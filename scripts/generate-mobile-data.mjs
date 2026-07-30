// lib/disaster-data.ts（正典）から apps/mobile/src/data/actions.ts を生成する。
//
// Web とネイティブでカード内容がずれると、片方だけ古い案内を出すことになる。
// 手で二重管理せず、正典を1つにしてここから配る。
// 型定義と時刻ヘルパーは正典のソーステキストをそのまま切り出して複製するので、
// 期限切れ判定や表示書式が Web とネイティブで食い違わない。

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { actionCards, categoryLabels, municipalities } from "../lib/disaster-data.ts";

const SOURCE_PATH = fileURLToPath(new URL("../lib/disaster-data.ts", import.meta.url));
const TARGET_PATH = fileURLToPath(
  new URL("../apps/mobile/src/data/actions.ts", import.meta.url),
);

const TYPES_END_MARKER = "export const municipalities";
const TAIL_START_MARKER = "export const siteCheckedAt";

/** 正典から「型定義ブロック」と「siteCheckedAt 以降のヘルパー」を切り出す。 */
function sliceSource(source) {
  const typesEnd = source.indexOf(TYPES_END_MARKER);
  const tailStart = source.indexOf(TAIL_START_MARKER);
  if (typesEnd < 0 || tailStart < 0 || tailStart <= typesEnd) {
    throw new Error(
      `lib/disaster-data.ts の構造が想定と異なります（"${TYPES_END_MARKER}" / "${TAIL_START_MARKER}" が見つからない）`,
    );
  }
  return {
    types: source.slice(0, typesEnd).trimEnd(),
    tail: source.slice(tailStart).trimEnd(),
  };
}

export function renderMobileData() {
  const { types, tail } = sliceSource(readFileSync(SOURCE_PATH, "utf8"));

  const municipalityLiteral = municipalities
    .map((area) => `  ${JSON.stringify(area)},`)
    .join("\n");
  const categoryLiteral = Object.entries(categoryLabels)
    .map(([key, label]) => `  ${JSON.stringify(key)}: ${JSON.stringify(label)},`)
    .join("\n");

  return `// このファイルは自動生成です。直接編集しないでください。
// 正典: lib/disaster-data.ts
// 再生成: npm run gen:mobile-data （リポジトリルートで実行）

${types}

export const municipalities = [
${municipalityLiteral}
] as const;

export const categoryLabels: Record<ActionCategory, string> = {
${categoryLiteral}
};

export const actionCards: ActionCard[] = ${JSON.stringify(actionCards, null, 2)};

${tail}
`;
}

export { TARGET_PATH };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(TARGET_PATH, renderMobileData(), "utf8");
  console.log(
    `generated ${TARGET_PATH} (${actionCards.length} cards, ${municipalities.length} municipalities)`,
  );
}
