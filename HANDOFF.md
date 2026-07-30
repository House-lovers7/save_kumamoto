# Fresh-thread handoff（2026-07-31 更新）

## 現状

被災者視点のUI/UX改修（Webのみ）は **実装・実ブラウザQA・修正まで完了**。Web側で残っているのはコード外の運用課題（README「公開前に残る課題」）のみ。deploy / push / メール送信は未実施（Human Approval Gate、ユーザー承認待ち）。

## 決定事項（ユーザー承認済み）

1. 対象は **Webのみ**（apps/mobile は未反映。反映する場合はデータ二重管理に注意: `apps/mobile/src/data/actions.ts` に `steps` / `keywords` が無い）
2. 期限切れカードは警告を維持しつつ、時刻非依存の「まずやること」手順は表示し続ける
3. 行動順序ステップUI（`steps`）を実装する
4. タイムスタンプの値は更新しない（公式ページ再確認なしの期限延長は鮮度の捏造。運用課題 README No-Go #1）

## commit

- `d9fbaa2` baseline
- `3215826` UI/UX改修本体（need grid / steps / 鮮度表示 / ダークモード / 文字3段階 / オフライン）
- `5e70ff6` README
- `14deea0` 実ブラウザQAで見つかった5件の修正
- `HEAD` README検証結果更新

## 実ブラウザQAの結果（Playwright headless Chromium）

390×844 と 1440×900 で 15項目PASS / 0 FAIL。詳細はREADME「現在の検証結果」。
QAスクリプトは scratchpad（セッション破棄で消える）にあるため、恒久化するなら `tests/` へ移すか再作成する。
Playwright は本repo未導入で、`/Users/tg/projects/app_development/adult_affliliate_master/node_modules/playwright` を参照して実行した（依存追加はしていない）。

## Remaining（Web）

1. **Chrome拡張(claude-in-chrome)は本セッション中ずっと未接続**。人間の目視確認をするなら手動で `npm run dev -- --port 3002` を起動してブラウザで開く
2. QAスクリプトの恒久化（任意）
3. README「公開前に残る課題」5項目：公式情報の再確認と時刻更新／運営・訂正体制／現地評価／ネイティブ実機・署名／配信境界

## Remaining Risks

- iOS Safari実機・VoiceOver・低速回線は未検証（headless Chromiumでは代替できない）
- モバイルアプリ（Expo）は今回の改修が未反映で、Webと体験が乖離している
- 全カードが期限切れのままなので、公開するなら先に公式情報と時刻の更新が必要

## Acceptance

Web側のUI/UX改修は完了。次に進むならモバイル反映か、公開前の運用課題（No-Go 5項目）のどちらか。deploy / push / メールはユーザー明示承認後のみ。
