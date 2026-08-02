import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { municipalities } from "../lib/disaster-data.ts";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

async function renderPath(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("災害行動ナビをサーバーレンダリングする", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="ja">/i);
  assert.match(html, /<title>くまもと いまどうするナビ<\/title>/i);
  assert.match(html, /いま困っていることは/);
  assert.match(html, /119/);
  assert.match(html, /あなたの居場所を集めません/);
  assert.match(html, /有効期限/);
  assert.match(html, /食料・生活/);
  assert.match(html, /まずやること/);
  assert.match(html, /困りごとから選ぶ/);
  assert.match(html, /出典と時刻の詳細/);
  assert.match(html, /文字の大きさ/);
  // 誤認を防ぐ表示は、JS が動く前の初期HTMLに出ていなければ意味がない。
  assert.match(html, /公式ページで必ず確認する/);
  assert.match(html, /飲料用/);
  assert.match(html, /生活用水/);
  assert.match(html, /順番を間違えると取り返しがつきません/);
  assert.match(html, /公式の案内を確認できていません/);
  // 出典の答えは、JS が動く前の初期HTMLで読めなければ「探させない」ことにならない。
  // 期限切れでも残る答え（問い合わせ先など）があるので、時刻に関係なく出ている。
  assert.match(html, /出典の「/);
  assert.match(html, /開いたページで「/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("独立した運用ステータスを表示する", async () => {
  const response = await renderPath("/status");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /運用ステータス/);
  assert.match(html, /期限切れ情報/);
  assert.match(html, /GPS・住所・氏名・健康情報/);
});

test("PWAとプライバシー境界を静的に備える", async () => {
  const [manifest, worker, client, data] = await Promise.all([
    readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"),
    readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    readFile(new URL("../app/home-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/disaster-data.ts", import.meta.url), "utf8"),
  ]);
  assert.equal(JSON.parse(manifest).lang, "ja");
  assert.match(worker, /caches\.open/);
  assert.match(client, /serviceWorker\.register/);
  assert.match(client, /ログイン、GPS、住所、氏名/);
  assert.match(client, /現在の状況は確認できません/);
  assert.match(data, /sourceName/);
  assert.match(data, /publishedAt/);
  assert.match(data, /fetchedAt/);
  assert.match(data, /checkedAt/);
  assert.match(data, /expiresAt/);
  assert.match(data, /isExpired/);
  assert.doesNotMatch(client, /geolocation|getCurrentPosition|analytics/i);
});

// 地域カバレッジ図は、件数だけを並べると「多い＝安全」と読まれる表示。
// 何を数えているのかの注記は、JS が動く前の初期HTMLに出ていなければ意味がない。
test("地域カバレッジ図は、注記とセットで初期HTMLに出る", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /class="area-map"/);
  assert.match(html, /位置関係は実際の地理と異なります。/);
  assert.match(
    html,
    /件数は公式ページで確認できた案内の数です。現地が今使えるかどうかではありません。/,
  );
  // 「名指しの案内なし」を「この地域には何も無い」と読ませないための1行。
  // 全部期限切れのときは件数を出さず、期限切れだと言い切る。
  assert.match(
    html,
    /どの地域でも使える熊本県全域の案内が\d+件あります。|どの地域でも使える熊本県全域の案内は、いまはすべて期限切れです。/,
  );

  // 市町村がひとつでも図から欠けると、その地域の利用者は自分の欄が無いことに気づけない。
  for (const area of municipalities) {
    assert.ok(html.includes(area), `${area} のタイルが初期HTMLに無い`);
  }
});

// 面（地域）で塗る図を、点（ピン）や現在地の地図と読ませない。
// GPSを持たず座標も持たないので、近さや現在地を語れる根拠がそもそも無い。
// 検査は図の内側だけに限る（資源エネルギー庁の外部地図への導線など、
// 出典側の正当な「地図で近くの給油所」を巻き込まないため）。
test("地域カバレッジ図の中で、現在地や近さを語らない", async () => {
  const response = await render();
  const html = await response.text();

  const start = html.indexOf('class="area-map"');
  const end = html.indexOf('class="controls"');
  assert.ok(start >= 0 && end > start, "area-map の区間を取り出せない");
  const section = html.slice(start, end);

  for (const word of ["現在地", "近く", "最寄り", "ピン", "あなたの位置", "km"]) {
    assert.ok(!section.includes(word), `地域カバレッジ図に「${word}」が出ている`);
  }
});
