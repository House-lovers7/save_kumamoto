/**
 * 本番 /status を1秒ごとに読み、停止スイッチの状態遷移を時刻つきで記録する。
 * docs/OPERATIONS.md 第6章 #5「反映までの実時間を測る」の実測用。
 *
 * usage: node poll-status.mjs <期待する遷移先: on|off> [timeoutSec]
 *   on  = 「緊急縮退中」になるまで待つ
 *   off = 「通常表示」に戻るまで待つ
 */
const BASE = "https://kumamoto-action-navigator-web.cokomo-gt.workers.dev";
const target = process.argv[2] === "off" ? "off" : "on";
const timeoutSec = Number(process.argv[3] ?? 300);

const stamp = () => new Date().toISOString();
const readState = async () => {
  const r = await fetch(`${BASE}/status`, {
    headers: { accept: "text/html", "cache-control": "no-cache" },
  });
  const html = await r.text();
  if (html.includes("緊急縮退中")) return "on";
  if (html.includes("通常表示")) return "off";
  return `unknown(${r.status})`;
};

const t0 = Date.now();
let previous = null;
console.log(`[${stamp()}] poll開始 target=${target} timeout=${timeoutSec}s`);

while ((Date.now() - t0) / 1000 < timeoutSec) {
  let state;
  try {
    state = await readState();
  } catch (error) {
    state = `error(${error.message})`;
  }
  if (state !== previous) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[${stamp()}] +${elapsed}s state=${state}`);
    if (previous !== null && state === target) {
      console.log(`RESULT: 遷移検出 ${previous} -> ${state} / 監視開始から ${elapsed}s`);
      process.exit(0);
    }
    previous = state;
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
console.log(`RESULT: timeout (${timeoutSec}s) 最終state=${previous}`);
process.exit(1);
