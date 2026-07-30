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
    assert.equal(card.sourceStatus, "official", card.id);
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

test("ネイティブ版の期限切れ判定と接続確認時刻が Web と同じ挙動", () => {
  const card = mobileCards[0];
  assert.equal(mobileIsExpired(card, new Date("2026-07-30T13:34:59+09:00")), false);
  assert.equal(mobileIsExpired(card, new Date("2026-07-30T13:35:00+09:00")), true);
  assert.equal(
    mobileSiteCheckedAt,
    webCards.reduce(
      (latest, item) => (item.checkedAt > latest ? item.checkedAt : latest),
      webCards[0].checkedAt,
    ),
  );
});
