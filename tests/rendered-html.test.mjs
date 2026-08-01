import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
