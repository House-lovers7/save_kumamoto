// 緊急停止スイッチが hydration 後も効いていることを、実ブラウザの実DOMで確認する。
//
// 使いどころ: 停止フラグの読み取り経路を触ったとき。SSR の初期HTMLだけ縮退して
// hydration 後にカードが復活する、という壊れ方は HTML の grep では見つからない。
// ここではローカルの Chrome を CDP で操作し、React が実際にマウントした後の DOM を数える。
//
//   node scripts/qa/hydration-check.mjs <cdp-port> <url>
//
// 事前に Chrome を headless で起動しておく（外部通信はしない。宛先は localhost のみ）:
//
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless --disable-gpu --remote-debugging-port=9333 \
//     --user-data-dir=/tmp/chrome-qa about:blank &
//
// 期待値:
//   EMERGENCY_MODE=true  → actionCard 0 / needGrid 0 / controls 0 / skipLink 0、
//                          maintenanceNotice 1、emergencyStrip 1、tel:119 と tel:110 は残る
//   未設定               → actionCard は正典 lib/disaster-data.ts の actionCards と同数
//                          （カードは巡回で増減する。固定値で覚えない）/ needGrid 1 /
//                          controls 1 / skipLink 1
//
// reactHydrated が false のときは JS が走っていないので、0件でも「止まっている証拠」にならない。

const cdpPort = process.argv[2];
const target = process.argv[3];
if (!cdpPort || !target) {
  console.error("usage: node scripts/qa/hydration-check.mjs <cdp-port> <url>");
  process.exit(1);
}

const targets = await fetch(`http://127.0.0.1:${cdpPort}/json/list`).then((r) => r.json());
const page = targets.find((t) => t.type === "page");
if (!page) throw new Error("page target not found");

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve, { once: true });
  ws.addEventListener("error", reject, { once: true });
});

let id = 0;
const pending = new Map();
const consoleLines = [];

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
    return;
  }
  if (msg.method === "Runtime.consoleAPICalled") {
    const text = (msg.params.args ?? [])
      .map((a) => a.value ?? a.description ?? a.unserializableValue ?? "")
      .join(" ");
    consoleLines.push(`[${msg.params.type}] ${text}`);
  }
  if (msg.method === "Log.entryAdded") {
    consoleLines.push(`[log.${msg.params.entry.level}] ${msg.params.entry.text}`);
  }
  if (msg.method === "Runtime.exceptionThrown") {
    consoleLines.push(
      `[exception] ${msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text}`,
    );
  }
});

const send = (method, params = {}) =>
  new Promise((resolve) => {
    id += 1;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

await send("Runtime.enable");
await send("Log.enable");
await send("Page.enable");

const loaded = new Promise((resolve) => {
  const onMessage = (event) => {
    if (JSON.parse(event.data).method === "Page.loadEventFired") {
      ws.removeEventListener("message", onMessage);
      resolve();
    }
  };
  ws.addEventListener("message", onMessage);
});
await send("Page.navigate", { url: target });
await loaded;
// hydration と useEffect / queueMicrotask / Service Worker 登録が終わるだけの猶予
await new Promise((r) => setTimeout(r, 3000));

const expression = `(async () => {
  const main = document.querySelector("main");
  const reactKeys = main ? Object.keys(main).filter((k) => k.startsWith("__react")) : [];
  const regs = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : [];
  return JSON.stringify({
    reactHydrated: reactKeys.length > 0,
    serviceWorkerRegistrations: regs.length,
    actionSection: document.querySelectorAll(".action-section").length,
    actionCard: document.querySelectorAll(".action-card").length,
    needGrid: document.querySelectorAll(".need-grid").length,
    controls: document.querySelectorAll(".controls").length,
    skipLink: document.querySelectorAll(".skip-link").length,
    maintenanceNotice: document.querySelectorAll(".maintenance-notice").length,
    emergencyStrip: document.querySelectorAll(".emergency-strip").length,
    telLinks: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute("href")),
    stepsHeadings: document.querySelectorAll(".steps__title").length,
  });
})()`;

const result = await send("Runtime.evaluate", {
  expression,
  awaitPromise: true,
  returnByValue: true,
});

console.log("=== hydration 後の実DOM ===");
console.log(JSON.stringify(JSON.parse(result.result.result.value), null, 2));
console.log("=== console / log / exception ===");
console.log(consoleLines.length ? consoleLines.join("\n") : "(なし)");
ws.close();
