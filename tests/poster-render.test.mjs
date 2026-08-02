// 紙は配ってしまうと回収できない。画面なら開き直せば直る誤りが、掲示板に貼られた紙では
// そのまま翌日の無駄足になる。だから「期限切れを隠さない」「確認できていないことを黙って
// 落とさない」を、紙でも機械で止める。
//
// 対象は lib/poster.ts（docs/design/zero-base-rethink.md §4 の仮説の実証コード）。

import assert from "node:assert/strict";
import test from "node:test";

import { actionCards } from "../lib/disaster-data.ts";
import { ExpiredCardError, posterModel, renderPosterHtml } from "../lib/poster.ts";

const card = (id) => {
  const found = actionCards.find((entry) => entry.id === id);
  assert.ok(found, `${id} が正典から消えている`);
  return found;
};

const poster = (id, now, options) =>
  renderPosterHtml(posterModel(card(id), new Date(now), options));

test("有効期限を紙面に必ず刷る", () => {
  // 画面は開くたびに期限を評価し直せるが、紙は刷った瞬間に凍る。
  // いつまで信じてよい紙かが書いていなければ、読む人には古さを判定する手段が無い。
  const html = poster("water-station", "2026-08-01T10:00:00+09:00");
  assert.match(html, /8月1日\(土\) 19:00 を過ぎたら、この紙は使わないでください。/);
  assert.match(html, /この紙は 8月1日\(土\) 10:00 時点の内容です/);
  assert.match(html, /この紙は自動では新しくなりません/);
});

test("その日限りの答えは、期限を過ぎた紙に1件も刷らない", () => {
  const inTime = poster("water-station", "2026-08-01T10:00:00+09:00");
  assert.match(inTime, /南区 隈庄小学校（南区城南町隈庄270）/);
  assert.match(inTime, /北区 北部中学校（北区鹿子木町1）/);

  const expired = poster("water-station", "2026-08-01T20:00:00+09:00", { allowExpired: true });
  for (const item of card("water-station").facts[0].items) {
    assert.ok(
      !expired.includes(item),
      `期限切れの紙に当日限りの給水所が残っている: ${item}`,
    );
  }
  assert.match(expired, /この紙は有効期限（8月1日\(土\) 19:00）を過ぎています/);
});

test("期限を過ぎた紙に残るのは、日付に依存しないと型が保証している答えだけ", () => {
  // `dated` フラグは facts にしか無い。summary・verifyPoints・steps には日付入りの内容が
  // 書かれていることがあり（water-station の「南区5か所・西区1か所」など）、型はそれを
  // 区別できない。区別できないものを失効後の紙に残さない。
  const target = card("evidence");
  const expired = poster("evidence", "2026-08-02T12:00:00+09:00", { allowExpired: true });

  assert.ok(!expired.includes(target.summary), "期限切れの紙に summary が残っている");
  for (const step of target.steps) {
    assert.ok(!expired.includes(step), `期限切れの紙に手順が残っている: ${step}`);
  }
  for (const order of target.irreversibleOrder) {
    assert.ok(!expired.includes(order), `期限切れの紙に手続きの順番が残っている: ${order}`);
  }
  // 日付つきの臨時窓口は消え、日付に依存しない各区の電話番号は残る。
  // 情報が古くなったときほど「どこへ聞けばよいか」が必要になる。
  assert.ok(!expired.includes("8月1日・2日のり災証明書の臨時窓口"));
  assert.match(expired, /中央区福祉課 096-328-2312/);
  assert.match(expired, /北区福祉課 096-272-1118/);
});

test("受付時間帯は枠のまま刷り、いま開いているかを紙に断定させない", () => {
  // 配布は 9:00〜11:00 と 15:00〜17:00 の2回で、間の4時間は現地に誰もいない。
  // 画面は「いまは受付時間外です」と言い切れるが、紙は刷った時刻でしか判定できないので
  // 言い切ってはいけない。枠だけを刷り、判定は読む人の時計に委ねる。
  const html = poster("food-hikawa", "2026-08-01T09:30:00+09:00");
  assert.match(html, /第1回 9:00〜11:00/);
  assert.match(html, /第2回 15:00〜17:00/);
  assert.match(html, /この時間の外は現地に誰もいません/);

  for (const phrase of [
    "告知では受付時間内です",
    "いまは受付時間外です",
    "本日の受付はまだ始まっていません",
    "本日の受付は終了しました",
  ]) {
    assert.ok(!html.includes(phrase), `紙が刷った時刻の判定を断定している: ${phrase}`);
  }
});

test("出典で確認できていないことを紙から落とさない", () => {
  // 紙は「書かなければ無かったことになる」媒体で、欠けた説明は
  // 「公式に案内がある」と読まれる。unavailable のカードは unverified を必ず刷る。
  const target = card("food-and-supplies");
  assert.equal(target.sourceStatus, "unavailable");
  const html = poster("food-and-supplies", "2026-08-02T09:00:00+09:00");
  assert.match(html, /公式の案内を確認できていません/);
  assert.ok(html.includes(target.unverified), "unverified の本文が紙面に無い");
});

test("出典と確認時刻を紙面に必ず刷る", () => {
  const html = poster("water-station", "2026-08-01T10:00:00+09:00");
  assert.match(html, /出典 熊本市上下水道局/);
  assert.match(html, /https:\/\/www\.kumamoto-waterworks\.jp\//);
  assert.match(html, /開いたページで「【第21報】8月1日の応急給水所について（8月1日07：00時点）」/);
  assert.match(html, /出典の更新 8月1日\(土\) 07:00／確認 8月1日\(土\) 11:25/);
  assert.match(html, /この紙は熊本県・市町村の公式発行物ではありません/);
});

test("画面でしか意味を持たない項目は紙へ降ろさない", () => {
  // action（「◯◯を開く」）はタップできる媒体の文言で、keywords は検索専用。
  // 紙に出すと、端末を持たない読み手に実行できない指示を渡すことになる。
  const target = card("water-station");
  const html = poster("water-station", "2026-08-01T10:00:00+09:00");
  assert.ok(!html.includes(target.action), `紙に画面用の導線文言が出ている: ${target.action}`);
  for (const keyword of target.keywords) {
    assert.ok(!html.includes(`>${keyword}<`), `紙に検索用の言い換えが出ている: ${keyword}`);
  }
});

test("期限切れのカードは、明示しない限り刷らずに止める", () => {
  assert.throws(
    () => posterModel(card("water-station"), new Date("2026-08-01T20:00:00+09:00")),
    ExpiredCardError,
  );
  assert.doesNotThrow(() =>
    posterModel(card("water-station"), new Date("2026-08-01T20:00:00+09:00"), {
      allowExpired: true,
    }),
  );
});

test("出典の文言をHTMLとして解釈させない", () => {
  // 出典の見出しに記号が入っても、紙面の構造が壊れたり内容が消えたりしない。
  const injected = {
    ...card("water-station"),
    title: "水 & <script>alert(1)</script>",
    caution: 'テスト"引用"',
  };
  const html = renderPosterHtml(posterModel(injected, new Date("2026-08-01T10:00:00+09:00")));
  assert.ok(!html.includes("<script>alert(1)</script>"));
  assert.match(html, /水 &amp; &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /テスト&quot;引用&quot;/);
});

test("全カードが紙へ降りる（期限内・期限切れのどちらでも落ちない）", () => {
  // 1枚でも例外で落ちるカードがあれば、「同じデータモデルから全媒体へ」は成立していない。
  for (const entry of actionCards) {
    const before = new Date(new Date(entry.expiresAt).getTime() - 60_000);
    const after = new Date(new Date(entry.expiresAt).getTime() + 60_000);
    const inTime = renderPosterHtml(posterModel(entry, before));
    const expired = renderPosterHtml(posterModel(entry, after, { allowExpired: true }));
    assert.match(inTime, /<\/html>/, `${entry.id}: 期限内の紙が組めていない`);
    assert.match(expired, /この紙は有効期限（/, `${entry.id}: 失効が紙面に出ていない`);
    assert.ok(inTime.includes(entry.title), `${entry.id}: 見出しが紙面に無い`);
    assert.ok(inTime.includes(entry.sourceUrl), `${entry.id}: 出典URLが紙面に無い`);
  }
});
