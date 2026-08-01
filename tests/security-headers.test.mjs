import assert from "node:assert/strict";
import test from "node:test";

// worker.fetch が返す応答にセキュリティヘッダーが付与されることを固定する回帰テスト（WO-3）。
//
// emergency-mode.test.mjs と同じ方式で、ビルド済み worker モジュールを1回だけ import し、
// worker.fetch を直接呼び出す（実サーバーを起動しない）。

const worker = await import(new URL("../dist/server/index.js", import.meta.url).href).then(
  (module) => module.default,
);

const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
const ctx = { waitUntil() {}, passThroughOnException() {} };

async function fetchPath(pathname) {
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    env,
    ctx,
  );
}

test("トップページに基本セキュリティヘッダーが付く", async () => {
  const response = await fetchPath("/");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(response.headers.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(
    response.headers.get("Permissions-Policy"),
    "geolocation=(), camera=(), microphone=()",
  );
  assert.equal(response.headers.get("X-Frame-Options"), "DENY");
});

test("CSPはframe-ancestorsのみ強制し、本体はReport-Onlyで開始する", async () => {
  const response = await fetchPath("/");
  const enforced = response.headers.get("Content-Security-Policy");
  const reportOnly = response.headers.get("Content-Security-Policy-Report-Only");

  assert.equal(enforced, "frame-ancestors 'none'");
  // 強制CSPには frame-ancestors 以外のディレクティブを混ぜない
  // （script-src 等を混ぜると、インラインスクリプトを壊す形で誤って強制してしまう）。
  assert.doesNotMatch(enforced, /script-src|style-src|default-src/);

  assert.match(reportOnly, /default-src 'self'/);
  assert.match(reportOnly, /script-src/);
  // 外部送信先（report-uri/report-to）は作らない
  assert.doesNotMatch(reportOnly, /report-uri|report-to/);
});

test("/status は常に no-store（キルスイッチ状態を常に最新表示する）", async () => {
  const response = await fetchPath("/status");
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});

test("元の応答（ステータス・Content-Type）は壊さずヘッダーだけ追加する", async () => {
  const home = await fetchPath("/");
  assert.equal(home.status, 200);
  assert.match(home.headers.get("Content-Type") ?? "", /text\/html/);
});
