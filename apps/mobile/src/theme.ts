// Web（app/globals.css の :root と prefers-color-scheme: dark）と同じ配色トークン。
// 同じ災害情報を Web とネイティブで別の色温度で出さないため、値をそのまま持つ。

export type Palette = {
  ink: string;
  navy: string;
  navyDeep: string;
  paper: string;
  surface: string;
  mist: string;
  muted: string;
  red: string;
  redSoft: string;
  line: string;
  accentInk: string;
  bodyText: string;
  chipBg: string;
  warnBg: string;
  warnBorder: string;
  warnInk: string;
  dangerInk: string;
  calmBg: string;
  calmInk: string;
  onNavy: string;
  onNavyMuted: string;
};

const light: Palette = {
  ink: "#132238",
  navy: "#152d4a",
  navyDeep: "#0b1e35",
  paper: "#f7f8f5",
  surface: "#ffffff",
  mist: "#e8ecef",
  muted: "#5c6875",
  red: "#bd382c",
  redSoft: "#fff0ed",
  line: "#cfd6dc",
  accentInk: "#152d4a",
  bodyText: "#3e4c5c",
  chipBg: "#eef2f5",
  warnBg: "#fff7d8",
  warnBorder: "#d79f13",
  warnInk: "#654b00",
  dangerInk: "#76251e",
  calmBg: "#e8efe9",
  calmInk: "#17483c",
  onNavy: "#ffffff",
  onNavyMuted: "#cdd8e2",
};

const dark: Palette = {
  ink: "#e7ecf3",
  navy: "#24406b",
  navyDeep: "#050d19",
  paper: "#0d141e",
  surface: "#17202e",
  mist: "#243144",
  muted: "#9fadbf",
  red: "#d9584a",
  redSoft: "#38201c",
  line: "#33415a",
  accentInk: "#a8c4e8",
  bodyText: "#c3cddb",
  chipBg: "#212d3f",
  warnBg: "#33290e",
  warnBorder: "#a87f1a",
  warnInk: "#ecd9a0",
  dangerInk: "#f1b3aa",
  calmBg: "#16251f",
  calmInk: "#a9d9c6",
  onNavy: "#ffffff",
  onNavyMuted: "#cdd8e2",
};

export const palettes = { light, dark };

/** 保存情報の鮮度シグナル。Web の .freshness-panel__signal と同じ色。 */
export const freshnessColors = {
  fresh: "#5ce2aa",
  mixed: "#f3c14b",
  stale: "#f0836f",
} as const;

export type TextScale = "standard" | "large" | "xlarge";

export const textScales: TextScale[] = ["standard", "large", "xlarge"];

export const textScaleLabels: Record<TextScale, string> = {
  standard: "標準",
  large: "大",
  xlarge: "特大",
};

/** Web の .app--text-* が使う 16 / 19 / 22px を基準倍率にしたもの。 */
export const textScaleFactors: Record<TextScale, number> = {
  standard: 1,
  large: 1.19,
  xlarge: 1.38,
};

export const TEXT_SCALE_KEY = "relief-text-scale";
export const LEGACY_LARGE_TEXT_KEY = "relief-large-text";
export const AREA_KEY = "relief-area";

/**
 * useColorScheme() は "light" | "dark" | "unspecified" | null を返す。
 * 判別できないときは app.json の既定と同じライトへ倒す。
 */
export function paletteFor(scheme: string | null | undefined): Palette {
  return scheme === "dark" ? dark : light;
}
