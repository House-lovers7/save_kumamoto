# Fresh-thread handoff（2026-07-31 / Fable 5 → 次セッション sonnet 推奨）

## Goal

被災者視点のUI/UX改修（Webのみ）は実装・自動検証まで完了。残りは **ブラウザ実機QA（8シナリオのafter確認）** と、必要なら微調整のみ。deploy / push / メール送信は未実施（Human Approval Gate対象、ユーザー承認待ち）。

## このセッションで確定した決定（ユーザー承認済み）

1. 対象は **Webのみ**（apps/mobile は別セッション。反映するならデータ二重管理に注意: `apps/mobile/src/data/actions.ts`）
2. 期限切れカードは **警告「現在の状況は確認できません」を維持しつつ、時刻非依存の「まずやること」手順は表示し続ける**
3. **行動順序ステップUI（steps）を実装する** — 実装済み
4. タイムスタンプの値は更新しない（公式ページ再確認なしの期限延長は鮮度の捏造になるため。運用課題 README No-Go #1）

## 実装済み内容（commit: d9fbaa2 baseline → 3215826 本体 → 5e70ff6 README）

- `lib/disaster-data.ts`: 全14カードに `steps: string[]`（断定語なし・2〜5手順）、`siteCheckedAt` エクスポート、`formatRelativeTime`
- `app/home-client.tsx`: 困りごとグリッド（8ボタン・44px+）、ステップ`<ol>`表示、期限切れでもsteps表示、オフライン時は外部リンクを無効ブロック化、文字3段階（standard/large/xlarge、旧`relief-large-text`から移行）、期限判定60秒更新（`now` state）、5連時刻→「有効期限+接続確認」主表示+`<details>`全履歴
- `app/globals.css`: 全ハードコード色をトークン化+`prefers-color-scheme: dark`、119/110ボタン拡大（48px）、カテゴリチップにエッジフェード、need-grid/steps/source-details等の新スタイル
- `app/layout.tsx`: `colorScheme: "light dark"`+themeColor 2値、`public/sw.js`: cache v2
- `tests/`: steps契約テスト追加（rendered-html 4アサーション追加）。既存の安全契約（公式4ドメイン・geolocation/analytics禁止・期限境界）は全維持

## Verification（本セッションのツール実行結果）

- `npm run lint` PASS / `npm test` PASS 7/7 / `npm run build` PASS
- クライアントgzip合計 **101.97KB**（150KB予算内）
- SSR after検証: 14カード全てで「まずやること」（計43step）+期限切れ警告+出典detailsの同時表示を確認（before/after HTML: `/private/tmp/claude-501/-Users-tg-projects-app-development-save-kumamoto/77555e4a-922a-4b95-b604-537dd789fc1e/scratchpad/{before,after}.html`）
- before実測: 改修前は全14カードが「現在の状況は確認できません」のみで行動情報ゼロだった

## Remaining（次セッションの作業）

1. **ブラウザ実機QA（未検証・最優先）**: Chrome拡張が未接続で4回失敗（Chromeは起動中。claude.ai/chromeログイン確認 or Chrome再起動が必要）。dev serverは停止済みなので再起動: `npm run dev -- --port 3002`
   - 8シナリオ: ①熊本市→水・給水 ②検索「薬」 ③トイレ ④連絡不通 ⑤ダークモード（夜・停電） ⑥オフライン（リンク無効化とofline-notice確認） ⑦特大文字+タップ精度 ⑧キーボードのみ
   - 390×844とデスクトップ、スクリーンショット記録。task #6 に登録済み
2. QAで見つかった微調整（あれば最小差分で）
3. その後は README「公開前に残る課題（No-Go)」5項目が生きている（運用体制・現地評価・実機・配信境界）。deploy/push/メールはユーザー明示承認後のみ

## Remaining Risks

- ダークモードのコントラストは目視未確認（トークン値は設計上AA想定、実測なし）
- `suppressHydrationWarning` で相対時刻のSSR/クライアント差を吸収しているが、実ブラウザでのhydration警告有無は未確認
- iOS Safari実機・VoiceOver・低速回線は未検証（従来からのNo-Go）

## Acceptance（このhandoffの完了条件）

ブラウザ8シナリオのafter確認を記録し、PASS/FAILと修正差分をユーザーへ報告。deploy系はすべて承認ゲートで停止。
