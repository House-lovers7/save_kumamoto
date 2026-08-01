import assert from "node:assert/strict";
import test from "node:test";

// Service Worker（public/sw.js）のナビゲーションキャッシュ回帰テスト。
//
// 守りたい性質は「/ 以外のナビゲーション応答や失敗応答がトップページ(/)の
// キャッシュを汚染しないこと」「ナビゲーションfetchが詰まった時は
// caches.match("/") へ確実にフォールバックすること」。
//
// sw.js はブラウザの Service Worker グローバル(self / caches / fetch)に
// 依存する素の JS（import/export なし）なので、import する **前** に
// これらをモックしてグローバルへ差し込み、捕獲した fetch イベント
// リスナーを疑似イベントで直接駆動する。sw.js は 1 回だけ import し
// （モジュールキャッシュのため二重登録を避ける）、caches/fetch のモック
// 状態だけをテストごとにリセットする。

function keyFor(reqOrKey) {
  return typeof reqOrKey === "string" ? reqOrKey : reqOrKey.url;
}

// 実装は単一の CACHE 定数しか使わないため、キャッシュ名の分離は再現せず、
// 単一のグローバル key-value ストアとして簡略化する。
function makeCachesMock() {
  const store = new Map();
  const cache = {
    async put(reqOrKey, response) {
      store.set(keyFor(reqOrKey), response);
    },
    async match(reqOrKey) {
      return store.get(keyFor(reqOrKey));
    },
    async addAll(urls) {
      for (const url of urls) store.set(url, new Response("shell"));
    },
    async keys() {
      return [...store.keys()];
    },
  };
  return {
    _store: store,
    async open() {
      return cache;
    },
    async match(reqOrKey) {
      return store.get(keyFor(reqOrKey));
    },
    async keys() {
      return [...store.keys()];
    },
    async delete() {
      return false;
    },
  };
}

function makeSelfMock() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) {
      listeners.set(type, fn);
    },
    skipWaiting() {},
    clients: { claim() {} },
    location: { origin: "http://localhost" },
    _listeners: listeners,
  };
}

globalThis.self = makeSelfMock();
globalThis.caches = makeCachesMock();
globalThis.fetch = async () => new Response("unset fetch stub", { status: 500 });

// import/export を持たない素の JS を1回だけ読み込む。
await import("../public/sw.js");

const fetchListener = globalThis.self._listeners.get("fetch");
assert.ok(fetchListener, "fetch リスナーが登録されていない");

function makeNavigateRequest(pathname) {
  return { method: "GET", url: `http://localhost${pathname}`, mode: "navigate" };
}

// respondWith(promise) に渡された promise を解決まで待ち、fire-and-forget な
// cache.put 系の非同期処理がマイクロタスクキューを消化し終えるまで
// マクロタスク境界（setImmediate）で1呼吸置いてから返す。
async function fireFetch(request) {
  let capture;
  const responded = new Promise((resolve) => {
    capture = resolve;
  });
  const event = {
    request,
    respondWith(promise) {
      capture(promise);
    },
    waitUntil() {},
  };
  fetchListener(event);
  const response = await responded;
  await new Promise((resolve) => setImmediate(resolve));
  return response;
}

function resetCaches() {
  globalThis.caches = makeCachesMock();
}

async function bodyOf(response) {
  if (!response) return undefined;
  return response.text();
}

test("/status へのナビゲーション後も / キーの内容はトップページのまま（汚染されない）", async () => {
  resetCaches();
  const cache = await globalThis.caches.open();
  await cache.put("/", new Response("トップの内容", { status: 200 }));

  globalThis.fetch = async (input) => {
    const url = typeof input === "string" ? input : input.url;
    assert.match(url, /\/status$/);
    return new Response("ステータスページの内容", { status: 200 });
  };

  const response = await fireFetch(makeNavigateRequest("/status"));
  assert.equal(await response.text(), "ステータスページの内容");

  const cachedRoot = await globalThis.caches.match("/");
  assert.equal(await bodyOf(cachedRoot), "トップの内容", "/status の応答が / キーへ入ってはいけない");
});

test("非okレスポンス（500）は / キーへ入らない", async () => {
  resetCaches();
  const cache = await globalThis.caches.open();
  await cache.put("/", new Response("既存のトップ内容", { status: 200 }));

  globalThis.fetch = async () => new Response("エラー", { status: 500 });

  await fireFetch(makeNavigateRequest("/"));

  const cachedRoot = await globalThis.caches.match("/");
  assert.equal(await bodyOf(cachedRoot), "既存のトップ内容", "非okレスポンスでキャッシュが上書きされてはいけない");
});

test("縮退HTML→通常HTMLの往復で、キャッシュは常に最新のokな / 応答になる", async () => {
  resetCaches();

  globalThis.fetch = async () => new Response("緊急縮退モード", { status: 200 });
  await fireFetch(makeNavigateRequest("/"));
  let cachedRoot = await globalThis.caches.match("/");
  assert.equal(await bodyOf(cachedRoot), "緊急縮退モード");

  globalThis.fetch = async () => new Response("通常のカード表示", { status: 200 });
  await fireFetch(makeNavigateRequest("/"));
  cachedRoot = await globalThis.caches.match("/");
  assert.equal(await bodyOf(cachedRoot), "通常のカード表示", "古い縮退内容がキャッシュに残ってはいけない");
});

test(
  'ナビゲーションfetchがタイムアウト（abort）すると caches.match("/") へフォールバックする',
  { timeout: 8000 },
  async () => {
    resetCaches();
    const cache = await globalThis.caches.open();
    await cache.put("/", new Response("フォールバック内容", { status: 200 }));

    globalThis.fetch = (input, opts) =>
      new Promise((resolve, reject) => {
        const signal = opts && opts.signal;
        if (!signal) return; // signal を渡さない実装は意図的にハングさせ、修正前実装の欠陥を検出する
        if (signal.aborted) {
          reject(new Error("aborted"));
          return;
        }
        signal.addEventListener("abort", () => reject(new Error("aborted")));
      });

    const response = await fireFetch(makeNavigateRequest("/"));
    assert.equal(await bodyOf(response), "フォールバック内容");
  },
);
