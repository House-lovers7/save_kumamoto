// lib/disaster-data.ts（正典）の1枚を、避難所へ貼る A4 掲示物として書き出す。
//
// docs/design/zero-base-rethink.md §4 の仮説（ActionCard は媒体非依存の中間表現として
// 機能しうる）を実物で確かめるための実証用スクリプト。公開しているアプリの一部ではない。
//
//   node scripts/render-poster.mjs water-station
//   node scripts/render-poster.mjs water-station --now 2026-08-01T10:00:00+09:00
//   node scripts/render-poster.mjs water-station --now 2026-08-01T20:00:00+09:00 --allow-expired
//   node scripts/render-poster.mjs food-hikawa --out /tmp/hikawa.html
//
// 既定の出力先は work/（.gitignore 済み）。刷った紙は刷った時刻で凍るので、生成物を
// リポジトリへコミットしない——古い紙がリポジトリに残ると、それ自体が期限切れの掲示になる。

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { actionCards } from "../lib/disaster-data.ts";
import { posterModel, renderPosterHtml } from "../lib/poster.ts";

function parseArgs(argv) {
  const options = { id: null, now: null, out: null, allowExpired: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--allow-expired") options.allowExpired = true;
    else if (arg === "--now") options.now = argv[++index];
    else if (arg === "--out") options.out = argv[++index];
    else if (arg.startsWith("--")) throw new Error(`不明なオプション: ${arg}`);
    else if (options.id === null) options.id = arg;
    else throw new Error(`引数が多すぎます: ${arg}`);
  }
  return options;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const options = parseArgs(process.argv.slice(2));

if (options.id === null) {
  fail(
    `使い方: node scripts/render-poster.mjs <card-id> [--now <ISO>] [--out <path>] [--allow-expired]\n` +
      `card-id:\n${actionCards.map((card) => `  ${card.id}`).join("\n")}`,
  );
}

const card = actionCards.find((entry) => entry.id === options.id);
if (!card) {
  fail(
    `card-id "${options.id}" は lib/disaster-data.ts にありません。\n` +
      `使えるのは:\n${actionCards.map((entry) => `  ${entry.id}`).join("\n")}`,
  );
}

const printedAt = options.now ? new Date(options.now) : new Date();
if (Number.isNaN(printedAt.getTime())) fail(`--now の日時を解釈できません: ${options.now}`);

let html;
try {
  html = renderPosterHtml(posterModel(card, printedAt, { allowExpired: options.allowExpired }));
} catch (error) {
  // 期限切れは想定内の停止なので、スタックトレースではなく理由と次の一手を出す。
  fail(`${error.message}`);
}

const outPath =
  options.out ?? fileURLToPath(new URL(`../work/poster-${card.id}.html`, import.meta.url));
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html, "utf8");

console.log(`${outPath} を書き出しました（${printedAt.toISOString()} 時点の内容）。`);
