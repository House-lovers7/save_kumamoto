/**
 * `ActionCard` を紙（A4 掲示物）へ降ろすレンダラー。
 *
 * これは公開しているアプリの一部ではなく、`docs/design/zero-base-rethink.md` §4 の仮説
 * ——「`ActionCard` は Web 専用の型ではなく媒体非依存の中間表現として機能しうる」——を
 * 実物で確かめるための実証コードである。避難所の掲示板・広報車・ラジオのような
 * 端末を持たない受け手へ同じデータを届けられるか（同メモ §3 の L3「縮退の梯子」）を、
 * 主張ではなく動くもので確認する。
 *
 * 2段に分けてある。
 *
 *   posterModel(card, printedAt)  … 媒体非依存の中間表現へ落とす（何を載せるかの判断）
 *   renderPosterHtml(model)       … A4 の紙へ組む（どう見せるかの判断）
 *
 * 分ける理由は、ラジオ読み上げ原稿を足すときに `renderRadioScript(model)` を並べるだけで
 * 済む形かどうかが、この仮説の成否そのものだから。HTML の細部と「載せる／載せない」の
 * 判断が混ざっていると、次の媒体を足すときに判断ごと書き直すことになる。
 *
 * 期限・出典・未確認の扱いは `lib/disaster-data.ts` の関数をそのまま使う。紙のためだけに
 * 判定を書き直すと、Web は失効を隠さないのに紙は隠す、という食い違いが生まれる。
 */

import {
  type ActionCard,
  categoryLabels,
  isExpired,
  visibleFacts,
} from "./disaster-data.ts";

/**
 * 紙・音声・標識のどれにも降ろせる形にした1枚分の内容。
 *
 * `ActionCard` から**落としたフィールド**があることが、この実証の結果の一部である。
 * - `action`（「◯◯を開く」）: タップできる媒体でしか意味を持たない
 * - `keywords`: 検索専用で、読む人には見えなくてよい
 * - `offline`: 端末に保存するかどうかの指示で、紙には対応物が無い
 * `icon` は逆に、離れて読む紙では見出し文字として screen より効くので `glyph` として残す。
 */
export type PosterModel = {
  /** カードの見出し。 */
  title: string;
  /** 見出しの隣に大きく置く1文字（`ActionCard.icon`）。 */
  glyph: string;
  /** 分類名（「水・給水」など）。 */
  categoryLabel: string;
  /**
   * 説明。**失効後は null になる**（後述の「失効後に残すもの」を参照）。
   */
  summary: string | null;
  /**
   * この紙を刷った時刻。
   *
   * 画面は開くたびに `isExpired` を評価し直せるが、紙は刷った瞬間に凍る。
   * いつ時点の紙かを紙面に書かないと、読む人には古さを判定する手段が無い。
   */
  printedAt: string;
  /** この紙を信じてよい最後の時刻（`ActionCard.expiresAt`）。 */
  validUntil: string;
  /** 刷った時点で既に失効していたか（`allowExpired` を明示したときだけ true になりうる）。 */
  expired: boolean;
  /**
   * 受け取れる時間帯。**判定した結果ではなく枠そのもの**を渡す。
   *
   * 画面は `serviceWindowNotice` で「いまは受付時間外です」と言い切れるが、紙は言い切れない。
   * 刷った時刻の判定を紙に固定すると、4時間後に読んだ人へ嘘をつくことになる。
   * だから紙は枠だけを載せ、判定は読む人の時計に委ねる。
   *
   * 失効後は空にする（当日限りの枠なので、`dated` な答えと同じ扱い）。
   */
  windows: { label: string; start: string; end: string }[];
  /** 刷ってよい答え（`visibleFacts` がその日限りの失効分を落とした後のもの）。 */
  facts: { label: string; items: string[]; citedAs: string }[];
  /** まずやること。失効後は空。 */
  steps: string[];
  /** 行く前に必ず区別する項目。失効後は空。 */
  verifyPoints: { label: string; options: string[]; why: string }[];
  /** 順序を誤ると取り返しがつかない手続き。失効後は空。 */
  irreversibleOrder: string[];
  /** 注意。 */
  caution: string;
  /**
   * 出典で確認できていないこと。`sourceStatus === "unavailable"` なら必ず入る。
   *
   * 紙は「書かなければ無かったことになる」媒体なので、ここを落とすと
   * 「公式に案内がある」と読まれる。落とさないことをテストで固定してある。
   */
  unverified: string | null;
  source: {
    name: string;
    url: string;
    /** リンク先で何を探せばよいかの目印（`ActionCard.sourceLandmark`）。 */
    landmark: string | null;
    publishedAt: string;
    checkedAt: string;
  };
  areas: string[];
};

export class ExpiredCardError extends Error {
  constructor(card: ActionCard, printedAt: Date) {
    super(
      `${card.id}: 有効期限（${card.expiresAt}）を過ぎたカードを ${printedAt.toISOString()} に刷ろうとしました。` +
        `期限切れを承知で刷るなら allowExpired を指定してください。`,
    );
    this.name = "ExpiredCardError";
  }
}

/**
 * カードを紙1枚分の中間表現へ落とす。
 *
 * 既定では期限切れのカードを刷らずに投げる。紙は配ってしまうと回収できないので、
 * 画面のように「期限切れ表示へ切り替える」よりも、刷る前に止めるほうが安全側になる。
 * それでも刷る必要があるとき（問い合わせ先だけを掲示したい等）は `allowExpired` を明示する。
 *
 * **失効後に残すのは、正典の型が日付非依存だと保証しているものだけ**にしてある。
 * 具体的には `dated` でない `facts`（問い合わせ先など）と、出典・注意・見出しだけ。
 * `summary` `steps` `verifyPoints` `irreversibleOrder` `availableWindows` は落とす。
 *
 * これらを落とす理由は、`dated` フラグが `facts` にしか無いこと。実際、`water-station` の
 * `summary` には「8月1日（土曜日）は南区5か所・西区1か所・北区6か所」が、`verifyPoints` にも
 * 同じ当日限りの区分が書かれている。`facts` だけ失効させて他を残すと、給水所の一覧は
 * 消えたのに「南区5か所」だけが紙に残る。画面は開き直せば直るが、掲示板に貼られた紙は
 * 誰も回収しないので、この差はそのまま翌日の無駄足になる。
 *
 * 紙面がほとんど空になるカードが出るのは想定どおりで、それは
 * 「失効後に安全に残せる情報を、この型はまだほとんど持っていない」という事実の表示である。
 */
export function posterModel(
  card: ActionCard,
  printedAt: Date,
  options: { allowExpired?: boolean } = {},
): PosterModel {
  const expired = isExpired(card, printedAt);
  if (expired && !options.allowExpired) throw new ExpiredCardError(card, printedAt);

  return {
    title: card.title,
    glyph: card.icon,
    categoryLabel: categoryLabels[card.category],
    summary: expired ? null : card.summary,
    printedAt: printedAt.toISOString(),
    validUntil: card.expiresAt,
    expired,
    windows: expired ? [] : (card.availableWindows ?? []),
    facts: visibleFacts(card, printedAt).map(({ label, items, citedAs }) => ({
      label,
      items,
      citedAs,
    })),
    steps: expired ? [] : card.steps,
    verifyPoints: expired ? [] : (card.verifyPoints ?? []),
    irreversibleOrder: expired ? [] : (card.irreversibleOrder ?? []),
    caution: card.caution,
    unverified: card.sourceStatus === "unavailable" ? (card.unverified ?? null) : null,
    source: {
      name: card.sourceName,
      url: card.sourceUrl,
      landmark: card.sourceLandmark ?? null,
      publishedAt: card.publishedAt,
      checkedAt: card.checkedAt,
    },
    areas: card.areas,
  };
}

/**
 * 紙面の時刻表記。
 *
 * 値は Web と同じ ISO 文字列から作るが、書き方だけ変えてある。画面は「8/1 19:00」で足りる
 * （今日の画面だと分かっている）が、紙は掲示板に何日も貼られたまま離れて読まれるので、
 * 月・日・曜日を省略しない。省略しているのは表記だけで、判定は共有している。
 */
function posterTime(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

/** 受付時間帯の「9:00」側。日付は枠の見出しに出るので時刻だけにする。 */
function posterClock(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 空の節を紙面に作らないための小道具。中身が無ければ節ごと出さない。 */
function section(title: string, body: string) {
  return body ? `<section class="block"><h2>${escapeHtml(title)}</h2>${body}</section>` : "";
}

function list(items: string[], className = "") {
  if (items.length === 0) return "";
  const attr = className ? ` class="${className}"` : "";
  return `<ul${attr}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

/**
 * A4 1枚の掲示物へ組む。
 *
 * **色に意味を持たせない。** 期限切れも未確認も文字で書く（`docs/design/screens.md` の
 * 既存方針をそのまま適用）。掲示物はモノクロで刷られ、コピーを重ねられ、色覚差のある人に
 * 読まれる。色が落ちた瞬間に警告が消える紙を作らない。
 */
export function renderPosterHtml(model: PosterModel): string {
  const validity = model.expired
    ? `<p class="expiry expiry-over">この紙は有効期限（${escapeHtml(posterTime(model.validUntil))}）を過ぎています。<br>この紙の内容で行動しないでください。公式ページで最新を確認してください。</p>`
    : `<p class="expiry">${escapeHtml(posterTime(model.validUntil))} を過ぎたら、この紙は使わないでください。</p>`;

  const windows =
    model.windows.length === 0
      ? ""
      : section(
          "受け取れる時間",
          `${list(
            model.windows.map(
              (w) => `${w.label} ${posterClock(w.start)}〜${posterClock(w.end)}`,
            ),
            "windows",
          )}<p class="note">この時間の外は現地に誰もいません。中止・早期終了もあるため、出発前に公式ページで当日の掲載を確認してください。</p>`,
        );

  const facts = model.facts
    .map(
      (fact) =>
        `<div class="fact"><h3>${escapeHtml(fact.label)}</h3>${list(fact.items)}<p class="cited">出典の「${escapeHtml(fact.citedAs)}」より</p></div>`,
    )
    .join("");

  const verifyPoints = model.verifyPoints
    .map(
      (point) =>
        `<div class="verify"><h3>${escapeHtml(point.label)}</h3>${list(point.options)}<p class="why">${escapeHtml(point.why)}</p></div>`,
    )
    .join("");

  const unverified = model.unverified
    ? `<section class="block unverified"><h2>公式の案内を確認できていません</h2><p>${escapeHtml(model.unverified)}</p></section>`
    : "";

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>${escapeHtml(model.title)} — 掲示用</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Hiragino Sans", "Noto Sans JP", "Yu Gothic", sans-serif;
    font-size: 11pt;
    line-height: 1.5;
    color: #000;
    background: #fff;
  }
  header { border-bottom: 3px solid #000; padding-bottom: 4mm; margin-bottom: 4mm; }
  .stamp { font-size: 10pt; }
  .glyph {
    float: left;
    width: 18mm; height: 18mm;
    margin-right: 4mm;
    border: 2px solid #000;
    font-size: 22pt; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  h1 { font-size: 20pt; margin: 0 0 2mm; line-height: 1.25; }
  .summary { margin: 0 0 3mm; }
  .expiry {
    font-size: 13pt; font-weight: 700;
    border: 2px solid #000; padding: 2mm 3mm; margin: 0 0 3mm;
  }
  .expiry-over { border-width: 4px; }
  .block { margin-bottom: 4mm; }
  .block h2 {
    font-size: 12pt; margin: 0 0 1.5mm;
    border-left: 5px solid #000; padding-left: 2mm;
  }
  h3 { font-size: 11pt; margin: 0 0 1mm; }
  ul { margin: 0 0 1.5mm; padding-left: 5mm; }
  li { margin-bottom: 0.5mm; }
  .windows { font-size: 13pt; font-weight: 700; }
  .fact, .verify { margin-bottom: 2.5mm; }
  .cited, .note, .why { font-size: 9pt; margin: 0; }
  .unverified { border: 2px dashed #000; padding: 2mm 3mm; }
  .caution { border: 1px solid #000; padding: 2mm 3mm; }
  footer { border-top: 2px solid #000; padding-top: 2mm; font-size: 9pt; }
  .url { word-break: break-all; font-weight: 700; }
</style>
</head>
<body>
<header>
  <p class="stamp">${escapeHtml(model.categoryLabel)} ／ ${escapeHtml(model.areas.join("・"))} ／ この紙は ${escapeHtml(posterTime(model.printedAt))} 時点の内容です</p>
  <div class="glyph">${escapeHtml(model.glyph)}</div>
  <h1>${escapeHtml(model.title)}</h1>
  ${model.summary ? `<p class="summary">${escapeHtml(model.summary)}</p>` : ""}
  ${validity}
</header>
${facts ? section("わかっていること", facts) : ""}
${windows}
${section("まずやること", list(model.steps))}
${verifyPoints ? section("行く前に必ず区別すること", verifyPoints) : ""}
${section("順番を間違えると取り返しがつきません", list(model.irreversibleOrder))}
${unverified}
<section class="block caution"><h2>注意</h2><p>${escapeHtml(model.caution)}</p></section>
<footer>
  <p>出典 ${escapeHtml(model.source.name)}${model.source.landmark ? `／開いたページで「${escapeHtml(model.source.landmark)}」を探してください` : ""}</p>
  <p class="url">${escapeHtml(model.source.url)}</p>
  <p>出典の更新 ${escapeHtml(posterTime(model.source.publishedAt))}／確認 ${escapeHtml(posterTime(model.source.checkedAt))}</p>
  <p>この紙は自動では新しくなりません。公式ページで最新を確認してください。この紙は熊本県・市町村の公式発行物ではありません。</p>
</footer>
</body>
</html>
`;
}
