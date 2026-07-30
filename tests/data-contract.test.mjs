import assert from "node:assert/strict";
import test from "node:test";

import {
  actionCards,
  isExpired,
} from "../lib/disaster-data.ts";

const requiredCategories = [
  "emergency",
  "water",
  "essentials",
  "shelter",
  "medical",
  "communication",
  "transport",
  "recovery",
];

test("全カードが出典・時刻・失効・公式URLを持つ", () => {
  assert.ok(actionCards.length > 0);
  for (const card of actionCards) {
    assert.equal(card.sourceStatus, "official", card.id);
    assert.match(card.sourceUrl, /^https:\/\/(?:www\.)?(?:pref\.kumamoto\.jp|city\.kumamoto\.jp|tca\.or\.jp|qsr\.mlit\.go\.jp)\//, card.id);
    for (const key of ["publishedAt", "fetchedAt", "checkedAt", "expiresAt"]) {
      assert.equal(Number.isNaN(Date.parse(card[key])), false, `${card.id}:${key}`);
    }
    assert.ok(
      Date.parse(card.publishedAt) <= Date.parse(card.fetchedAt),
      `${card.id}: 発表時刻は取得時刻以前`,
    );
    assert.ok(
      Date.parse(card.checkedAt) <= Date.parse(card.expiresAt),
      `${card.id}: 確認時刻は有効期限以前`,
    );
  }
});

test("R1必須カテゴリをすべて備える", () => {
  const actual = new Set(actionCards.map((card) => card.category));
  for (const category of requiredCategories) {
    assert.equal(actual.has(category), true, category);
  }
});

test("期限切れ判定は境界時刻で安全側へ切り替わる", () => {
  const card = actionCards[0];
  assert.equal(isExpired(card, new Date("2026-07-30T13:34:59+09:00")), false);
  assert.equal(isExpired(card, new Date("2026-07-30T13:35:00+09:00")), true);
});
