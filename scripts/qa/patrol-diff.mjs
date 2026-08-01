import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { actionCards } from "../../lib/disaster-data.ts";

const WATERWORKS_SOURCE_URL = "https://www.kumamoto-waterworks.jp/";
const WATERWORKS_DATA_URL = "https://www.kumamoto-waterworks.jp/list.php";
const DEFAULT_TIMEOUT_MS = 15_000;

const NAMED_ENTITIES = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeEntities(value) {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&([a-z]+);/gi, (entity, name) => NAMED_ENTITIES[name.toLowerCase()] ?? entity);
}

/** HTMLの見た目上の差を落とし、カードの引用文字列と機械照合できる形にする。 */
export function normalizeText(value) {
  return decodeEntities(String(value))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .normalize("NFKC")
    .replace(/[〜～]/g, "~")
    .replace(/[‐‑‒–—―−]/g, "-")
    .replace(/[\s\u00a0]+/gu, "")
    .replace(/[()[\]{}（）［］｛｝「」『』【】〖〗・,，、。．.!！?？]/g, "");
}

function collectJsonStrings(value, output) {
  if (typeof value === "string") {
    output.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectJsonStrings(item, output);
    return;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectJsonStrings(item, output);
  }
}

function searchableBody(body, contentType = "") {
  if (/\bjson\b/i.test(contentType) || /^\s*[\[{]/.test(body)) {
    try {
      const strings = [];
      collectJsonStrings(JSON.parse(body), strings);
      return strings.join("\n");
    } catch {
      // JSONらしい文字列でも壊れていれば、取得した本文をそのまま照合して差分として出す。
    }
  }
  return body;
}

function matchValue(haystack, value, allowComponents = false) {
  const exact = normalizeText(value);
  if (haystack.includes(exact)) return { status: "found", match: "exact" };
  if (!allowComponents) return { status: "missing" };

  // カードでは可読性のため「区 施設 時間（住所）」を1行に組み直しているが、出典では
  // 区見出し・施設名・時間・住所が別のHTML要素やJSONフィールドになっていることがある。
  // 空白と括弧で分けた全構成要素が存在するときだけ一致とし、1要素でも無ければ差分に残す。
  const components = decodeEntities(String(value))
    .normalize("NFKC")
    .replace(/[（()）]/g, " ")
    .split(/\s+/u)
    .map(normalizeText)
    .filter(Boolean);
  if (components.length >= 2 && components.every((component) => haystack.includes(component))) {
    return { status: "found", match: "components" };
  }
  return { status: "missing" };
}

/** 同じsourceUrlを共有するカードを、1回の取得へまとめる。 */
export function buildPatrolPlan(cards) {
  const bySource = new Map();
  for (const card of cards) {
    const existing = bySource.get(card.sourceUrl);
    if (existing) {
      existing.cardIds.push(card.id);
      existing.cards.push(card);
      continue;
    }

    const waterworks = card.sourceUrl === WATERWORKS_SOURCE_URL;
    bySource.set(card.sourceUrl, {
      sourceUrl: card.sourceUrl,
      requestUrl: waterworks ? WATERWORKS_DATA_URL : card.sourceUrl,
      healthUrl: waterworks ? card.sourceUrl : undefined,
      headers: waterworks
        ? {
            "X-Requested-With": "XMLHttpRequest",
            Referer: WATERWORKS_SOURCE_URL,
          }
        : {},
      cardIds: [card.id],
      cards: [card],
    });
  }
  return [...bySource.values()];
}

/** 1カードが出典から引用している全文字列を照合する。 */
export function checkCardContent(card, body, now = new Date(), contentType = "") {
  const haystack = normalizeText(searchableBody(body, contentType));
  const checks = [];
  const check = (kind, value, allowComponents = false) => {
    checks.push({
      kind,
      value,
      ...matchValue(haystack, value, allowComponents),
    });
  };

  if (card.sourceLandmark) check("sourceLandmark", card.sourceLandmark);
  for (const fact of card.facts ?? []) {
    check("citedAs", fact.citedAs);
    for (const item of fact.items) check("fact", item, true);
    if (fact.dated && Number.isFinite(Date.parse(card.expiresAt)) && now >= new Date(card.expiresAt)) {
      checks.push({ kind: "dated", value: fact.citedAs, status: "expired" });
    }
  }

  return {
    id: card.id,
    checks,
    needsReview: checks.some(({ status }) => status !== "found"),
  };
}

async function getResponse(fetchImpl, url, { headers = {}, timeoutMs }) {
  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: "text/html,application/json,application/pdf;q=0.9,*/*;q=0.8",
        "User-Agent": "kumamoto-action-navigator-patrol/1.0",
        ...headers,
      },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      return {
        ok: false,
        httpStatus: response.status,
        error: `HTTP ${response.status}`,
      };
    }
    return {
      ok: true,
      httpStatus: response.status,
      contentType: response.headers.get("content-type") ?? "",
      body: await response.text(),
    };
  } catch (error) {
    return {
      ok: false,
      httpStatus: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** 全sourceUrlを取得し、引用差分を集約する。HTTP失敗は引用差分より強い失敗として扱う。 */
export async function runPatrol({
  cards,
  fetchImpl = fetch,
  now = new Date(),
  timeoutMs = DEFAULT_TIMEOUT_MS,
}) {
  const plan = buildPatrolPlan(cards);
  const sources = await Promise.all(
    plan.map(async (target) => {
      if (target.healthUrl) {
        const health = await getResponse(fetchImpl, target.healthUrl, {
          timeoutMs,
        });
        if (!health.ok) {
          return {
            ...target,
            cards: [],
            status: "fetch-error",
            httpStatus: health.httpStatus,
            error: `表示面 ${health.error}`,
          };
        }
      }

      const response = await getResponse(fetchImpl, target.requestUrl, {
        headers: target.headers,
        timeoutMs,
      });
      if (!response.ok) {
        return {
          ...target,
          cards: [],
          status: "fetch-error",
          httpStatus: response.httpStatus,
          error: response.error,
        };
      }

      return {
        sourceUrl: target.sourceUrl,
        requestUrl: target.requestUrl,
        cardIds: target.cardIds,
        status: "ok",
        httpStatus: response.httpStatus,
        contentType: response.contentType,
        cards: target.cards.map((card) =>
          checkCardContent(card, response.body, now, response.contentType),
        ),
      };
    }),
  );

  const hasFetchError = sources.some(({ status }) => status === "fetch-error");
  const hasDifference = sources.some(({ cards: results }) =>
    results.some(({ needsReview }) => needsReview),
  );

  return {
    checkedAt: now.toISOString(),
    cardCount: cards.length,
    sourceCount: plan.length,
    sources,
    exitCode: hasFetchError ? 2 : hasDifference ? 1 : 0,
  };
}

export function renderReport(result) {
  const lines = [
    `巡回差分: ${result.cardCount}カード・${result.sourceCount}URL (${result.checkedAt})`,
  ];

  for (const source of result.sources) {
    if (source.status === "fetch-error") {
      lines.push(
        `[取得失敗] ${source.cardIds.join(", ")} ${source.sourceUrl} — ${source.error}`,
      );
      continue;
    }

    let sourceHasChecks = false;
    for (const card of source.cards) {
      if (card.checks.length === 0) continue;
      sourceHasChecks = true;
      for (const check of card.checks) {
        if (check.status === "found") continue;
        lines.push(`[要確認] ${card.id} ${check.kind} ${check.status}: ${check.value}`);
      }
      if (!card.needsReview) {
        lines.push(`[一致] ${card.id} (${card.checks.length}項目)`);
      }
    }
    if (!sourceHasChecks) {
      lines.push(`[到達] ${source.cardIds.join(", ")} ${source.sourceUrl}`);
    }
  }

  const fetchErrors = result.sources.filter(({ status }) => status === "fetch-error").length;
  const reviewCards = result.sources.flatMap(({ cards }) => cards).filter(({ needsReview }) => needsReview)
    .length;
  lines.push(`結果: 取得失敗 ${fetchErrors}URL / 要確認 ${reviewCards}カード`);
  return lines.join("\n");
}

function parseArgs(argv) {
  const options = { json: false, fixture: undefined, timeoutMs: DEFAULT_TIMEOUT_MS };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--fixture") {
      options.fixture = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--timeout-ms") {
      options.timeoutMs = Number(argv[index + 1]);
      index += 1;
      continue;
    }
    if (arg === "--help") {
      options.help = true;
      continue;
    }
    throw new Error(`不明な引数: ${arg}`);
  }
  if (!Number.isInteger(options.timeoutMs) || options.timeoutMs < 1) {
    throw new Error("--timeout-ms は1以上の整数で指定してください");
  }
  if (options.fixture === "") throw new Error("--fixture のパスが空です");
  return options;
}

async function loadFixture(path) {
  const fixturePath = path.endsWith(".json") ? resolve(path) : resolve(path, "patrol.json");
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));
  const fetchImpl = async (url) => {
    const response = fixture.responses[url];
    if (!response) return new Response("fixture response missing", { status: 599 });
    return new Response(response.body ?? "", {
      status: response.status ?? 200,
      headers: { "content-type": response.contentType ?? "text/plain; charset=utf-8" },
    });
  };
  return {
    cards: fixture.cards,
    now: new Date(fixture.now),
    fetchImpl,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(
      "usage: node scripts/qa/patrol-diff.mjs [--json] [--timeout-ms 15000] [--fixture PATH]",
    );
    return;
  }

  const input = options.fixture
    ? await loadFixture(options.fixture)
    : { cards: actionCards, now: new Date(), fetchImpl: fetch };
  const result = await runPatrol({ ...input, timeoutMs: options.timeoutMs });
  console.log(options.json ? JSON.stringify(result, null, 2) : renderReport(result));
  process.exitCode = result.exitCode;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 2;
  });
}
