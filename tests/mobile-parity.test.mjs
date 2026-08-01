// Web とネイティブで案内内容がずれると、片方の利用者だけ古い・欠けた案内を見る。
// 生成物が正典と一致していること、手で編集されていないことを機械で止める。

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { actionCards as webCards, municipalities as webAreas } from "../lib/disaster-data.ts";
import {
  actionCards as mobileCards,
  categoryLabels as mobileCategoryLabels,
  isExpired as mobileIsExpired,
  municipalities as mobileAreas,
  siteCheckedAt as mobileSiteCheckedAt,
} from "../apps/mobile/src/data/actions.ts";
import { renderMobileData, TARGET_PATH } from "../scripts/generate-mobile-data.mjs";

test("生成物が正典と1件も欠けずに一致する", () => {
  assert.deepEqual(
    mobileCards.map((card) => card.id),
    webCards.map((card) => card.id),
    "カードの件数か並びが Web とずれている",
  );
  assert.deepEqual(
    [...mobileAreas],
    [...webAreas],
    "市町村リストが Web とずれている",
  );
  for (const [index, webCard] of webCards.entries()) {
    assert.deepEqual(
      mobileCards[index],
      webCard,
      `${webCard.id}: カードの内容が Web とずれている`,
    );
  }
});

test("正典を編集して再生成し忘れていない", () => {
  assert.equal(
    readFileSync(TARGET_PATH, "utf8"),
    renderMobileData(),
    "apps/mobile/src/data/actions.ts が古い。npm run gen:mobile-data を実行する",
  );
});

test("ネイティブ版も行動順序ステップと出典を全カードで持つ", () => {
  assert.ok(mobileCards.length > 0);
  for (const card of mobileCards) {
    assert.ok(Array.isArray(card.steps) && card.steps.length >= 2, `${card.id}: steps`);
    assert.ok(Array.isArray(card.keywords) && card.keywords.length > 0, `${card.id}: keywords`);
    assert.ok(["official", "unavailable"].includes(card.sourceStatus), card.id);
    // 確認できていないことは Web だけでなくネイティブにも同じ言葉で届く必要がある。
    if (card.sourceStatus === "unavailable") {
      assert.ok(card.unverified?.trim().length > 0, `${card.id}: unverified が配られていない`);
    }
    assert.match(card.sourceUrl, /^https:\/\//, card.id);
    assert.ok(card.action.trim().length > 0, `${card.id}: action`);
    assert.ok(mobileCategoryLabels[card.category], `${card.id}: カテゴリ表示名がない`);
  }
});

test("ネイティブ版でも困りごとのかな・話し言葉から該当カードへ届く", () => {
  const search = (word) => {
    const q = word.toLowerCase();
    return mobileCards.filter((card) =>
      `${card.title} ${card.summary} ${card.steps.join(" ")} ${card.action} ${card.keywords.join(" ")}`
        .toLowerCase()
        .includes(q),
    );
  };
  const expectations = [
    ["こども", "infant-care"],
    ["赤ちゃん", "infant-care"],
    ["おむつ", "infant-care"],
    ["くすり", "medical"],
    ["けが", "medical"],
    ["みず", "water"],
    ["断水", "water"],
    ["ひなん", "shelter"],
    ["ペット", "shelter"],
    ["ごはん", "food-and-supplies"],
    ["ガソリン", "fuel"],
    ["といれ", "toilet"],
    ["充電", "communication"],
    ["安否", "communication"],
    ["お年寄り", "elder-care"],
    ["通行止め", "roads"],
    ["罹災", "kumamoto-city-hub"],
    ["お金", "support-systems"],
  ];
  for (const [word, expectedId] of expectations) {
    const hits = search(word);
    assert.ok(hits.length > 0, `「${word}」で0件`);
    assert.ok(
      hits.some((card) => card.id === expectedId),
      `「${word}」で ${expectedId} に届かない（${hits.map((c) => c.id).join(",")}）`,
    );
  }
});

// データを両方へ配っても、描画コードが片方にしか無ければ利用者には届かない。
// ネイティブは以前 sourceStatus を見ずに全カードへ「公式情報」を出しており、
// 確認できていないカードほど強く誤認させていた。表示の有無を両方で機械的に止める。
test("誤認防止の表示を Web とネイティブの両方が持つ", () => {
  const renderers = [
    ["Web", readFileSync(new URL("../app/home-client.tsx", import.meta.url), "utf8")],
    ["ネイティブ", readFileSync(new URL("../apps/mobile/src/app/index.tsx", import.meta.url), "utf8")],
  ];
  for (const [name, source] of renderers) {
    // 「公式情報」は sourceStatus の分岐の中だけに置く。分岐の外に1つでもあれば、
    // unavailable のカードが公式扱いで表示される。
    assert.match(
      source,
      /sourceStatus === ["']unavailable["'][\s\S]{0,400}公式情報/,
      `${name}: 「公式情報」タグが sourceStatus の分岐から離れている`,
    );
    assert.equal(
      (source.match(/>公式情報</g) ?? []).length,
      1,
      `${name}: 「公式情報」タグの描画が1箇所ではない`,
    );
    for (const text of [
      "未確認",
      "公式の案内を確認できていません",
      "公式ページで必ず確認する",
      "順番を間違えると取り返しがつきません",
      // 出典の答えをカード内に出す表示。片方だけ「探しに行かせる」形に戻さない。
      "出典の「",
      "開いたページで「",
    ]) {
      assert.ok(source.includes(text), `${name}: 「${text}」が描画されていない`);
    }
    for (const field of ["unverified", "verifyPoints", "irreversibleOrder", "sourceLandmark"]) {
      assert.match(
        source,
        new RegExp(`\\b(card|item)\\.${field}\\b`),
        `${name}: ${field} が配られているのに描画していない`,
      );
    }
    // facts は正典の visibleFacts() 経由でしか読まない。ここで直に card.facts を
    // 使うと、その日限りの答えを期限切れ後も出す実装へ簡単に戻れてしまう。
    assert.match(
      source,
      /visibleFacts\((card|item), now\)/,
      `${name}: facts が配られているのに描画していない（visibleFacts 経由で読む）`,
    );
    assert.doesNotMatch(
      source,
      /\b(card|item)\.facts\b/,
      `${name}: facts を直接読まない（期限切れの安全規則を迂回する）`,
    );
  }
});

test("ネイティブ版の期限切れ判定と接続確認時刻が Web と同じ挙動", () => {
  const card = mobileCards[0];
  const boundary = new Date(card.expiresAt);
  assert.equal(mobileIsExpired(card, new Date(boundary.getTime() - 1000)), false);
  assert.equal(mobileIsExpired(card, boundary), true);
  assert.equal(
    mobileSiteCheckedAt,
    webCards.reduce(
      (latest, item) => (item.checkedAt > latest ? item.checkedAt : latest),
      webCards[0].checkedAt,
    ),
  );
});
