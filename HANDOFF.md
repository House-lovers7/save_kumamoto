# Fresh-thread handoff（2026-07-31 更新／ネイティブ反映後）

## Goal

熊本の被災者が「いま何に困っているか」から公式情報へ最短で到達できる読み取り専用アプリ（R1）を、
Web とネイティブで同じ品質・同じ内容で提供する。情報がないときに「利用可能」と推測せず、
鮮度と失効を正直に出すことを最優先の品質基準とする。

本セッションのGoalは「Webで完了済みの被災者視点UI/UX改修を apps/mobile へ反映し、
カードデータの二重管理を解消する」で、これは完了している。

## 現状

被災者視点のUI/UX改修は **Web・ネイティブ両方に反映済み**。カードデータの二重管理も解消した。
コード側で残っているのは実機検証と、コード外の運用課題（README「公開前に残る課題」）のみ。
deploy / push / メール送信は未実施（Human Approval Gate、ユーザー承認待ち）。
remote未設定のリポジトリなので、push先自体が存在しない。

## 決定事項（ユーザー承認済み）

1. 対象は Web と apps/mobile の両方（本セッションでネイティブへ反映完了）
2. 期限切れカードは警告を維持しつつ、時刻非依存の「まずやること」手順は表示し続ける
3. 行動順序ステップUI（`steps`）を実装する
4. タイムスタンプの値は更新しない（公式ページ再確認なしの期限延長は鮮度の捏造。運用課題 README No-Go #1）
5. カード内容の正典は `lib/disaster-data.ts` の1か所。ネイティブ版データは生成物

## commit

- `d9fbaa2` baseline
- `3215826` Web UI/UX改修本体
- `5e70ff6` README
- `14deea0` Web実ブラウザQAで見つかった5件の修正
- `f0d5ed8` README検証結果更新
- `b5898a1` ネイティブ反映（誠実性バグ2件＋データ単一化＋UIパリティ）
- `d0804f3` Web/ネイティブ整合テスト
- `HEAD` README更新

## 本セッションで直したネイティブ側の不具合

1. 鮮度インジケータが緑ドット＋固定時刻のハードコードで、全14カードが期限切れでも
   「接続を確認」と緑を出していた（Webでは修正済みだった不正直シグナルの残存）
2. 期限切れカードが summary を隠すだけで行動手順を出していなかった（決定事項2に反する）
3. `renderedAt` をモジュール読込時の定数で保持しており、起動しっぱなしだと失効判定が更新されなかった

## Files（本セッションで触ったもの）

新規:

- `scripts/generate-mobile-data.mjs`：正典 → ネイティブ版データの生成
- `apps/mobile/src/theme.ts`：Web の globals.css と同じ配色トークン・文字倍率・鮮度シグナル色
- `tests/mobile-parity.test.mjs`：Web/ネイティブ整合の機械ゲート

変更:

- `apps/mobile/src/app/index.tsx`：全面改修（鮮度3トーン / steps常時表示 / 60秒tick /
  キーワード検索＋関連度順 / need grid / 文字3段階 / ダークモード / 空状態）
- `apps/mobile/src/data/actions.ts`：**生成物になった**（直接編集しない）
- `apps/mobile/src/app/_layout.tsx` / `about.tsx` / `offline-guides.tsx`：テーマ連動
- `apps/mobile/app.json`：`userInterfaceStyle` を `light` → `automatic`
- `package.json`：`gen:mobile-data` スクリプト追加
- `README.md` / `HANDOFF.md`

触っていない（意図的）:

- `lib/disaster-data.ts` の内容（正典として読むだけ。タイムスタンプ値も未更新＝決定事項4）
- `app/`（Web UI）、依存パッケージ（追加ゼロ）

## 検証結果

- Web: lint 成功 / `npm test` 13件成功（既存5＋整合5＋SSR3）
- Mobile: typecheck 成功 / lint 成功 / iOS・Android bundle export 成功
- 描画確認: `npx expo export --platform web`（react-native-web静的レンダリング）で15項目確認。
  全件期限切れ状態で鮮度が赤系へ切り替わること、14カード全部に手順が残ることを実出力で確認
- 同期ゲート（生成物の手編集検出）は、実際に手編集した状態で FAIL することを確認済み

## Remaining

1. **実機・Simulator検証**（No-Go #4）。Expo Go 57.0.5 取得停滞の境界は未解決のまま。
   ネイティブのレイアウト、ダークモードの実切替、44pxタップ領域、文字特大時の折り返しは未検証
2. Expo Doctor と `npm audit --omit=dev` の再実行（UI/UX反映後は未実行）
3. Playwright QAスクリプトの恒久化（任意。現状は他repoのnode_modulesを借用しており再現性なし）
4. README「公開前に残る課題」5項目：公式情報の再確認と時刻更新／運営・訂正体制／現地評価／
   ネイティブ実機・署名／配信境界

## Remaining Risks

- iOS Safari実機・VoiceOver/TalkBack・低速回線は未検証（headless Chromiumもreact-native-webも代替にならない）
- ダークモードの配色はWebでAA検証済みのトークンを流用しているが、ネイティブ実機での
  コントラスト実測はしていない
- 全カードが期限切れのままなので、公開するなら先に公式情報と時刻の更新が必要
  （`lib/disaster-data.ts` を更新して `npm run gen:mobile-data` を実行する）

## Verification（次セッションで最初に流すコマンド）

```bash
cd /Users/tg/projects/app_development/save_kumamoto
npm run lint            # tsc --noEmit（Web）
npm test                # build + 13件（既存5 / 整合5 / SSR3）
npm run gen:mobile-data && git diff --stat   # 差分が出たら正典と生成物がずれている

cd apps/mobile
npm run typecheck
npm run lint
npm run export:all      # iOS/Android バンドル（署名なし）
```

未実行のまま残しているもの（承認・環境が要る）:

```bash
cd apps/mobile
npx expo-doctor@latest      # 外部からのCLI取得を伴う
npm audit --omit=dev
```

## Acceptance

Web・ネイティブ両方のUI/UX改修は完了。判定は `implementation_complete_boundary_unverified`
（コードとローカル検査は通っているが、実機・実配信の証拠はない）。

次セッションの選択肢は次の3つ。どれもこのhandoffだけで着手できる。

1. 実機・Simulator検証（No-Go #4）— Expo Go 57.0.5 取得停滞の境界を解く必要がある
2. 公開前の運用課題（No-Go 1〜5）— #1（公式情報の再確認と時刻更新）は外部通信の承認が要る
3. Playwright QAスクリプトの恒久化 — 依存追加の承認が要る

deploy / push / メールはユーザー明示承認後のみ。remote未設定のためpush先は存在しない。
