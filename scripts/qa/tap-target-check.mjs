// 押せる要素が指で押せる大きさかを、実ブラウザの実レイアウトで測る。
//
// 使いどころ: 操作子のCSSを触ったとき。CSS の min-height / min-width を読むだけでは、
// padding・line-height・flex の伸縮・メディアクエリが効いた後の実寸は分からない。
// 被災直後に濡れた手や手袋で押す画面なので、宣言値ではなく実測値で判定する。
//
//   node scripts/qa/tap-target-check.mjs <cdp-port> <url> [viewport-width]
//
// 事前に Chrome を headless で起動しておく（外部通信はしない。宛先は localhost のみ）:
//
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless --disable-gpu --remote-debugging-port=9333 \
//     --user-data-dir=/tmp/chrome-qa about:blank &
//
// 基準: Material Design のタップ領域 48x48dp。iOS HIG の 44x44pt はこれを満たせば自動的に満たす。
// 判定: UNDER が1件でもあれば exit 1。横スクロールが出た場合も exit 1（狭い画面で操作子を
// 大きくしすぎるとヘッダーが溢れるため、48dp化とセットで見張る）。

const MIN_TAP_DP = 48;

const cdpPort = process.argv[2];
const target = process.argv[3];
const viewportWidth = Number(process.argv[4] ?? 390);
if (!cdpPort || !target) {
  console.error("usage: node scripts/qa/tap-target-check.mjs <cdp-port> <url> [viewport-width]");
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
ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

const send = (method, params = {}) =>
  new Promise((resolve) => {
    id += 1;
    pending.set(id, resolve);
    ws.send(JSON.stringify({ id, method, params }));
  });

await send("Page.enable");
// 実機相当の幅で測る。デスクトップ幅では通る要素が、狭い画面のメディアクエリで縮むことがある。
await send("Emulation.setDeviceMetricsOverride", {
  width: viewportWidth,
  height: 844,
  deviceScaleFactor: 1,
  mobile: true,
});

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
// hydration 後にしか出ない操作子（絞り込み・リセット）も測る
await new Promise((r) => setTimeout(r, 3000));

const expression = `(() => {
  const SELECTOR = 'a[href], button, summary, select, input, [role="button"]';
  const label = (el) => {
    const text = (el.getAttribute('aria-label') || el.textContent || '').replace(/\\s+/g, ' ').trim();
    return text.slice(0, 40) || el.tagName.toLowerCase();
  };
  const path = (el) => {
    const parts = [];
    for (let node = el; node && node.nodeType === 1 && parts.length < 3; node = node.parentElement) {
      parts.unshift(node.tagName.toLowerCase() + (node.className && typeof node.className === 'string'
        ? '.' + node.className.trim().split(/\\s+/).join('.')
        : ''));
    }
    return parts.join(' > ');
  };
  const seen = new Map();
  for (const el of document.querySelectorAll(SELECTOR)) {
    const rect = el.getBoundingClientRect();
    // 非表示・折りたたみ内の要素は押せないので測らない
    if (rect.width === 0 && rect.height === 0) continue;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') continue;
    const entry = {
      label: label(el),
      path: path(el),
      width: Math.round(rect.width * 10) / 10,
      height: Math.round(rect.height * 10) / 10,
    };
    // 同じ見た目の操作子（カードごとに繰り返される出典リンク等）は最小のものだけ残す
    const key = entry.path + '|' + Math.round(rect.width) + 'x' + Math.round(rect.height);
    if (!seen.has(key)) seen.set(key, entry);
  }
  const all = [...seen.values()];
  return JSON.stringify({
    viewport: { width: window.innerWidth, height: window.innerHeight },
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    measured: all.length,
    under: all.filter((e) => e.width < ${MIN_TAP_DP} || e.height < ${MIN_TAP_DP}),
  });
})()`;

const result = await send("Runtime.evaluate", { expression, returnByValue: true });
const report = JSON.parse(result.result.result.value);
ws.close();

console.log(`=== タップ領域の実測（基準 ${MIN_TAP_DP}x${MIN_TAP_DP}dp / viewport ${report.viewport.width}px） ===`);
console.log(`測定した操作子: ${report.measured}件`);
console.log(`横スクロール: ${report.horizontalOverflow ? `あり（scrollWidth ${report.scrollWidth}）` : "なし"}`);
if (report.under.length === 0) {
  console.log("基準未満: なし");
} else {
  console.log(`基準未満: ${report.under.length}件`);
  for (const entry of report.under) {
    console.log(`  ${entry.width}x${entry.height}  ${entry.label}  [${entry.path}]`);
  }
}

process.exit(report.under.length > 0 || report.horizontalOverflow ? 1 : 0);
