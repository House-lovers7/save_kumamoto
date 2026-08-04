// 受付時間帯・失効・紙面レンダリングの「挙動」を検査するための合成カード。
//
// なぜ本番データ（lib/disaster-data.ts）を固定具にしないか:
//
// 挙動の検査を実際の給水所カードや配布カードで書くと、**毎日の巡回で告知が入れ替わる
// たびにテストが落ちる**。2026-08-04 の巡回では実際にそれが起きた。氷川町の配布告知が
// 出典から消え、熊本市の応急給水は翌日分の告知だけになった結果、受付時間帯を持つカードが
// 一時的に0枚になり、判定ロジックの検査対象そのものが消えた。
// 巡回のたびに13件のテストを直す運用は、巡回を止める方向にしか働かない。
//
// ここで検査したいのは「与えられた枠に対して serviceWindow がどう振る舞うか」であって
// 「今日の氷川町が何時に配っているか」ではない。だから入力を固定した合成データにする。
//
// 正典データ側の約束（枠は確認当日の日付・最終枠の end＝expiresAt・枠は重ねない・
// 時間を出すカードは caution に「出発前」を含める）は、data-contract.test.mjs の
// 「受付時間帯は当日分で、最終枠の終了が有効期限と一致する」が **actionCards 全件** に
// 対して見ている。合成カードへ移してもデータ側の検査は緩まない。
//
// 出典URLは実在しない `example.invalid`（RFC 2606 の予約ドメイン）にしてある。
// 合成カードが誤って巡回や取得の対象へ紛れ込んだときに、静かに通らず必ず失敗するため。

const base = (overrides) => ({
  id: "fixture-card",
  category: "water",
  icon: "検",
  title: "検査用の合成カード",
  summary: "検査のための合成データで、実在の出典を持ちません。",
  steps: ["合成の手順1を実行する", "合成の手順2を実行する"],
  keywords: ["けんさ", "検査"],
  action: "合成の案内を開く",
  caution:
    "この案内は受け取りを保証しません。中止や時間の変更があるため、出発前に当日の掲載を確認してください。",
  sourceName: "合成出典",
  sourceUrl: "https://example.invalid/fixture",
  publishedAt: "2026-08-01T07:00:00+09:00",
  fetchedAt: "2026-08-01T08:00:00+09:00",
  checkedAt: "2026-08-01T08:00:00+09:00",
  expiresAt: "2026-08-02T08:00:00+09:00",
  sourceStatus: "official",
  areas: ["熊本市"],
  offline: false,
  ...overrides,
});

/**
 * 1日2回に分かれた当日限りの告知。間の 11:00〜15:00 は現地に誰もいない。
 * expiresAt（17:00）だけを見ると「有効」なので、この4時間に向かった人は閉まった場所に着く。
 * このアプリが直したかった失敗そのものを、合成データとして固定してある。
 */
export const twoWindowCard = base({
  id: "fixture-two-windows",
  expiresAt: "2026-08-01T17:00:00+09:00",
  availableWindows: [
    { label: "第1回", start: "2026-08-01T09:00:00+09:00", end: "2026-08-01T11:00:00+09:00" },
    { label: "第2回", start: "2026-08-01T15:00:00+09:00", end: "2026-08-01T17:00:00+09:00" },
  ],
  sourceLandmark: "合成の当日限り告知",
  facts: [
    {
      label: "合成の当日限りの配布",
      items: ["時間 9:00〜11:00、15:00〜17:00", "場所 合成小学校"],
      citedAs: "合成の当日限り告知",
      dated: true,
    },
  ],
});

/** 途切れない1枠だけの当日限り告知。「枠と枠の間」が存在しない場合の検査に使う。 */
export const oneWindowCard = base({
  id: "fixture-one-window",
  title: "合成の応急給水",
  expiresAt: "2026-08-01T19:00:00+09:00",
  availableWindows: [
    { label: "応急給水", start: "2026-08-01T08:00:00+09:00", end: "2026-08-01T19:00:00+09:00" },
  ],
  sourceLandmark: "合成の応急給水の告知",
  facts: [
    {
      label: "合成の当日限りの給水所",
      items: ["合成第一小学校（合成区合成町1-1）", "合成第二小学校（合成区合成町2-2）"],
      citedAs: "合成の応急給水の告知",
      dated: true,
    },
  ],
});

/**
 * 日付に依存する答えと、依存しない答えを両方持つカード。
 * 失効後の紙に何が残り何が消えるか（`dated` の境界）を検査するために使う。
 */
export const mixedFactsCard = base({
  id: "fixture-mixed-facts",
  title: "合成の手続き案内",
  expiresAt: "2026-08-01T19:00:00+09:00",
  irreversibleOrder: ["合成の順序1を先に行う", "合成の順序2を後に行う"],
  verifyPoints: [
    {
      label: "合成の区別",
      options: ["合成の区分A", "合成の区分B"],
      why: "区分を取り違えると受け取れないため、合成の出典に書かれた区分だけを並べています。",
    },
  ],
  facts: [
    {
      label: "合成の当日限りの窓口",
      items: ["開設窓口：合成窓口", "受付時間：午前9時〜午後4時"],
      citedAs: "合成の当日限り告知",
      dated: true,
    },
    {
      label: "合成の問い合わせ先",
      items: ["合成課 000-000-0000"],
      citedAs: "合成の常設案内",
    },
  ],
});

/** 受付時間帯を持たないカード。判定を足していないことの検査に使う。 */
export const plainCard = base({ id: "fixture-plain" });

/** リンクは生きているが、そのページに話題が無い状態。 */
export const unavailableCard = base({
  id: "fixture-unavailable",
  sourceStatus: "unavailable",
  unverified:
    "合成の検査用データです。この話題の公式案内は出典ページで確認できませんでした。",
});
