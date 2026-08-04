import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

// 緊急停止スイッチの回帰テスト。
//
// 守りたい性質は「同じビルドのまま環境変数を変えるだけで止まること」なので、
// worker モジュールは **1回だけ import して使い回す**。既存の rendered-html.test.mjs のように
// キャッシュ破棄 import をすると、モジュールのトップレベルで値を確定させる退行
// （`vinext start` は Node 常駐なので実行中に切り替わらなくなる）を検出できない。
// 再 import では新しい env で再評価されてしまい、テストが通ってしまうため。

let workerPromise;
const loadWorker = () =>
  (workerPromise ??= import(new URL("../dist/server/index.js", import.meta.url).href).then(
    (module) => module.default,
  ));

async function renderWith(value, pathname = "/") {
  const before = process.env.EMERGENCY_MODE;
  if (value === undefined) delete process.env.EMERGENCY_MODE;
  else process.env.EMERGENCY_MODE = value;
  try {
    const worker = await loadWorker();
    const response = await worker.fetch(
      new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 200);
    return response.text();
  } finally {
    if (before === undefined) delete process.env.EMERGENCY_MODE;
    else process.env.EMERGENCY_MODE = before;
  }
}

const count = (html, pattern) => (html.match(pattern) ?? []).length;

// RSCペイロードはHTML内のJS文字列リテラルとして埋め込まれるため引用符がエスケープされる。
// 実出力は `\"emergencyMode\":true`。埋め込み方が変わっても壊れないよう両形を許す。
function payloadFlag(html) {
  const matched = html.match(/\\?"emergencyMode\\?":(true|false)/);
  return matched ? matched[1] : null;
}

test("停止中は個別案内と、行き先を失う操作子が消える", async () => {
  const html = await renderWith("true");
  assert.equal(count(html, /緊急縮退モード/g), 1);
  assert.equal(count(html, /class="action-section"/g), 0);
  assert.equal(count(html, /まずやること/g), 0);
  // 押しても何も起きない操作子を残さない（行き先の #actions ごと消えているため）
  assert.equal(count(html, /class="need-grid"/g), 0);
  assert.equal(count(html, /class="controls"/g), 0);
  assert.equal(count(html, /class="area-map"/g), 0);
  assert.equal(count(html, /skip-link/g), 0);
  // 縮退中に案内の件数だけが残ると、止めているのに「N件ある」と読ませる。
  assert.equal(count(html, /位置関係は実際の地理と異なります/g), 0);
});

test("停止中でも119・110は残る", async () => {
  const html = await renderWith("true");
  assert.match(html, /emergency-strip/);
  assert.match(html, /tel:119/);
  assert.match(html, /tel:110/);
});

test("停止の判定がRSCペイロードに載る（hydration後も止まったままになる）", async () => {
  // これが本命。クライアント側で process.env を読んでいた時は、SSRのHTMLだけ縮退し
  // hydration でカードが復活していた。サーバーが決めた値が1つだけ流れることを固定する。
  assert.equal(payloadFlag(await renderWith("true")), "true");
  assert.equal(payloadFlag(await renderWith(undefined)), "false");
});

test("未設定と\"false\"では通常表示に戻る", async () => {
  for (const value of [undefined, "false"]) {
    const html = await renderWith(value);
    assert.equal(count(html, /緊急縮退モード/g), 0);
    assert.equal(count(html, /class="action-section"/g), 1);
    assert.equal(count(html, /class="need-grid"/g), 1);
    assert.equal(count(html, /class="controls"/g), 1);
    assert.equal(payloadFlag(html), "false");
  }
});

test("同一ビルド・同一モジュールのまま環境変数だけで往復できる", async () => {
  // 値がビルド時やモジュール初期化時に焼き付いていれば、この往復のどこかで必ず落ちる。
  assert.equal(payloadFlag(await renderWith("true")), "true");
  assert.equal(payloadFlag(await renderWith("false")), "false");
  assert.equal(payloadFlag(await renderWith("true")), "true");
});

test("案内画面と運用ステータスが同じ判定を出す", async () => {
  const [homeOn, statusOn, homeOff, statusOff] = [
    await renderWith("true"),
    await renderWith("true", "/status"),
    await renderWith(undefined),
    await renderWith(undefined, "/status"),
  ];
  assert.match(homeOn, /緊急縮退モード/);
  assert.match(statusOn, /緊急縮退中/);
  assert.doesNotMatch(homeOff, /緊急縮退モード/);
  assert.match(statusOff, /通常表示/);
  assert.doesNotMatch(statusOff, /緊急縮退中/);
});

test("停止フラグの読み取り経路をソースで固定する", async () => {
  const [client, lib, page, status] = await Promise.all([
    readFile(new URL("../app/home-client.tsx", import.meta.url), "utf8"),
    readFile(new URL("../lib/emergency-mode.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/status/page.tsx", import.meta.url), "utf8"),
  ]);
  // コメントでの言及（禁止理由の説明）は許す。止めたいのは実際の読み書きなので、
  // プロパティ／添字アクセスの形と、環境変数名としての NEXT_PUBLIC_ だけを見る。
  //
  // クライアントコンポーネントでは process.env が {} に置換されるので常に false になる
  assert.doesNotMatch(client, /process\.env\s*[.[]/);
  // NEXT_PUBLIC_* はビルド時に rsc/ssr を含む全環境へ define されるため、値がサーバーへ焼き付く
  assert.doesNotMatch(client, /NEXT_PUBLIC_[A-Z]/);
  assert.doesNotMatch(lib, /NEXT_PUBLIC_[A-Z]/);
  // 読み取りは関数の中だけ。トップレベルで確定させると常駐サーバーで切り替わらなくなる
  assert.match(lib, /export function readEmergencyMode\(\)[\s\S]*process\.env\[/);
  assert.doesNotMatch(lib, /^(export )?const \w+\s*=\s*process\.env/m);
  // サーバー側の2つの読み手が同じ実装を共有していること
  assert.match(page, /readEmergencyMode\(\)/);
  assert.match(status, /readEmergencyMode\(\)/);
});

test("停止スイッチが本番ランタイムへ届く前提条件を固定する", async () => {
  const assetsDir = new URL("../dist/client/assets/", import.meta.url);
  const scripts = (await readdir(assetsDir)).filter((name) => name.endsWith(".js"));
  assert.ok(scripts.length > 0);
  const bundles = await Promise.all(
    scripts.map((name) => readFile(new URL(name, assetsDir), "utf8")),
  );
  // 停止フラグはクライアントへ配らない（配ると値の出所が2つになり、また食い違う）
  for (const [index, bundle] of bundles.entries()) {
    assert.doesNotMatch(bundle, /EMERGENCY_MODE/, `${scripts[index]} に停止フラグが混入している`);
  }

  // Workers が bindings（vars / secrets）を process.env へ流し込む条件そのもの。
  // これが崩れると、コードは正しいのに本番で停止が黙って効かなくなる。
  const wrangler = JSON.parse(
    await readFile(new URL("../dist/server/wrangler.json", import.meta.url), "utf8"),
  );
  assert.ok(wrangler.compatibility_flags.includes("nodejs_compat"));
  assert.ok(
    wrangler.compatibility_date >= "2025-04-01",
    `compatibility_date ${wrangler.compatibility_date} では process.env が埋まらない`,
  );
});

// 2026-08-05、本番デプロイが `Compatibility flag specified multiple times`（code 10021）で
// 失敗した。原因は `wrangler.jsonc` と `vite.config.ts` の両方が `nodejs_compat` を宣言し、
// マージで重複したこと。上のテストは `.includes()` で見ていたため重複を素通しし、
// 73件すべてPASSしたまま本番だけが落ちた。ローカル検査を本番境界の証拠に読み替えられない、
// という原則がそのまま出た形なので、機械で検出できる部分をここで塞ぐ。
test("デプロイ設定の正典が1つで、フラグが重複しない", async () => {
  const wrangler = JSON.parse(
    await readFile(new URL("../dist/server/wrangler.json", import.meta.url), "utf8"),
  );

  // 重複そのもの。Cloudflare API が拒否する。
  const flags = wrangler.compatibility_flags ?? [];
  assert.equal(
    new Set(flags).size,
    flags.length,
    `compatibility_flags が重複している: ${JSON.stringify(flags)}`,
  );

  // `worker/index.ts` の画像最適化が env.IMAGES を使う。binding が落ちると実行時に落ちる。
  assert.equal(wrangler.images?.binding, "IMAGES");

  // ルートに wrangler 設定が無いと、`vinext deploy` が起動のたびに wrangler.jsonc を
  // 作り直す（deploy.js の generateWranglerConfig）。作り直された設定は compatibility_date が
  // 実行日になり、compatibility_flags も再宣言されるので、重複が復活する。
  const rootConfig = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  assert.match(rootConfig, /"compatibility_flags"/);
  assert.match(rootConfig, /"nodejs_compat"/);

  // 正典は1つ。vite.config.ts 側へ書き戻すと、また重複してデプロイが落ちる。
  const viteConfig = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");
  assert.doesNotMatch(
    viteConfig,
    /^\s*compatibility_(date|flags)\s*:/m,
    "compatibility_date / compatibility_flags の正典は wrangler.jsonc だけにする",
  );
});
