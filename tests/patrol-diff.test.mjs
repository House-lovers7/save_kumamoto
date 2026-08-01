import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPatrolPlan,
  checkCardContent,
  normalizeText,
  renderReport,
  runPatrol,
} from "../scripts/qa/patrol-diff.mjs";

test("HTML・実体参照・全角記号を、出典文字列の照合用に正規化する", () => {
  assert.equal(
    normalizeText("<h2>時間&nbsp;９：００～１１：００</h2><script>捨てる</script>"),
    "時間9:00~11:00",
  );
  assert.equal(normalizeText("熊本市&#x30B3;&#12540;ルセンター"), "熊本市コールセンター");
});

test("カードのURLを重複排除し、上下水道局だけJSON表示実体へ向ける", () => {
  const cards = [
    { id: "a", sourceUrl: "https://example.test/page" },
    { id: "b", sourceUrl: "https://example.test/page" },
    { id: "water-station", sourceUrl: "https://www.kumamoto-waterworks.jp/" },
  ];

  const plan = buildPatrolPlan(cards);
  assert.equal(plan.length, 2);
  assert.deepEqual(plan[0].cardIds, ["a", "b"]);
  assert.equal(plan[1].requestUrl, "https://www.kumamoto-waterworks.jp/list.php");
  assert.equal(plan[1].headers["X-Requested-With"], "XMLHttpRequest");
  assert.equal(plan[1].headers.Referer, "https://www.kumamoto-waterworks.jp/");
});

test("landmark・citedAs・各itemの消失と、dated情報の期限切れを別々に出す", () => {
  const card = {
    id: "food",
    sourceUrl: "https://example.test/food",
    sourceLandmark: "8月1日の配布について",
    expiresAt: "2026-08-01T17:00:00+09:00",
    facts: [
      {
        citedAs: "8月1日の配布について",
        items: ["時間 9:00〜11:00", "場所 氷川中学校", "場所 消えた小学校"],
        dated: true,
      },
    ],
  };
  const source = "<h2>8月1日の配布について</h2><p>時間 9：00～11：00</p><p>場所 氷川中学校</p>";

  const result = checkCardContent(card, source, new Date("2026-08-01T18:00:00+09:00"));
  assert.deepEqual(
    result.checks.map(({ kind, value, status }) => ({ kind, value, status })),
    [
      { kind: "sourceLandmark", value: "8月1日の配布について", status: "found" },
      { kind: "citedAs", value: "8月1日の配布について", status: "found" },
      { kind: "fact", value: "時間 9:00〜11:00", status: "found" },
      { kind: "fact", value: "場所 氷川中学校", status: "found" },
      { kind: "fact", value: "場所 消えた小学校", status: "missing" },
      { kind: "dated", value: "8月1日の配布について", status: "expired" },
    ],
  );
  assert.equal(result.needsReview, true);
});

test("表の区名・施設・時間・住所が別要素でも、全構成要素があればfact一致とする", () => {
  const card = {
    id: "bath",
    sourceUrl: "https://example.test/bath",
    expiresAt: "2026-08-02T12:00:00+09:00",
    facts: [
      {
        citedAs: "3 実施施設",
        items: [
          "中央区 龍の湯 15:00〜22:00（中央区琴平本町5-54）",
          "北区 消えた湯 9:00〜21:00（北区架空町1）",
        ],
      },
    ],
  };
  const source = `
    <h2>3 実施施設</h2>
    <h3>中央区</h3><p>龍の湯（15：00～22：00）</p><p>受付で住所を確認します</p><p>中央区琴平本町5-54</p>
    <h3>北区</h3><p>9：00～21：00</p>
  `;

  const result = checkCardContent(card, source, new Date("2026-08-01T12:00:00+09:00"));
  assert.equal(result.checks[1].status, "found");
  assert.equal(result.checks[1].match, "components");
  assert.equal(result.checks[2].status, "missing");
});

test("1 URLを1回だけ取得し、HTTP失敗を取得エラーとして保持する", async () => {
  const cards = [
    { id: "a", sourceUrl: "https://example.test/shared", sourceLandmark: "見出し" },
    { id: "b", sourceUrl: "https://example.test/shared" },
    { id: "c", sourceUrl: "https://example.test/error" },
  ];
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.endsWith("/error")) return new Response("failure", { status: 503 });
    return new Response("<h1>見出し</h1>", {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  };

  const result = await runPatrol({ cards, fetchImpl, now: new Date("2026-08-01T12:00:00+09:00") });
  assert.deepEqual(calls, ["https://example.test/shared", "https://example.test/error"]);
  assert.equal(result.sources.length, 2);
  assert.equal(result.sources[0].status, "ok");
  assert.equal(result.sources[1].status, "fetch-error");
  assert.equal(result.exitCode, 2);
});

test("差分レポートは対象数と要確認文字列を人が読める形で出す", () => {
  const report = renderReport({
    checkedAt: "2026-08-01T03:00:00.000Z",
    cardCount: 1,
    sourceCount: 1,
    sources: [
      {
        sourceUrl: "https://example.test/food",
        requestUrl: "https://example.test/food",
        cardIds: ["food"],
        status: "ok",
        httpStatus: 200,
        cards: [
          {
            id: "food",
            needsReview: true,
            checks: [{ kind: "fact", value: "場所 消えた小学校", status: "missing" }],
          },
        ],
      },
    ],
    exitCode: 1,
  });
  assert.match(report, /1カード・1URL/);
  assert.match(report, /\[要確認\].*food.*fact.*場所 消えた小学校/);
});
