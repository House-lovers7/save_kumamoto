# くまもと いまどうするナビ

熊本の被災者が「いま何に困っているか」から、公式な災害・生活支援情報へ短時間で到達するための読み取り専用アプリです。

- Web：PWA（vinext / React）
- iOS：Expo / React Native
- Android：Expo / React Native

このプロジェクトは熊本県、熊本市、NERVその他の公的・民間サービスの公式アプリではありません。自治体、消防、警察、医療機関等の指示を優先してください。

## 公開範囲（R1）

実装するのは、公式情報を安全に案内する読み取り専用版だけです。

- 119・110への常設導線
- 市町村、困りごと、キーワードによる絞り込み
- 水・給水、食料・生活用品、給油、トイレ、避難所、医療、通信、道路、乳幼児、高齢者・介護、生活再建
- 発表・内容更新時刻、取得時刻、接続確認時刻、有効期限、出典
- 期限切れ時の「現在の状況は確認できません」表示
- Web PWAキャッシュとネイティブ版のオフライン行動カード
- 文字拡大、キーボード操作、スクリーンリーダー向けラベル
- Webの緊急縮退モードと `/status` ページ

R1では次を実装しません。

- ログイン、GPS、住所、氏名、電話番号、健康情報、被害写真の収集
- 利用者投稿、匿名投稿、DM、支援要請
- 営業、在庫、通行、医療受入の独自断定
- 医療判断、救助優先順位の自動判定
- 寄付・決済、個人間物資提供、配送・ドローン制御
- 広告、アクセス解析、デバイスフィンガープリント

## 必要環境

- Node.js 22.13以上
- npm
- iOS/Androidのローカル起動にはXcodeまたはAndroid Studio
- ストア向け署名ビルドにはExpo/EASアカウントとApple/Googleの開発者資格情報

## Webの実行

```bash
npm install
npm run dev
```

既定の開発URLが表示されます。ポートを指定する場合：

```bash
npm run dev -- --port 3002
```

検証：

```bash
npm run lint
npm test
npm audit
```

`npm test` は本番ビルド後、サーバーレンダリング、情報鮮度契約、R1必須カテゴリ、PWA・プライバシー境界、ステータス画面を検査します。

本番起動：

```bash
npm run build
npm run start
```

## iOS / Androidの実行

```bash
cd apps/mobile
npm install
npm run start
```

開発用：

```bash
npm run ios
npm run android
```

検証：

```bash
npm run typecheck
npm run lint
npm run export:all
npx expo-doctor@latest
npm audit --omit=dev
```

`export:all` はiOSとAndroidのJavaScript/Hermes bundleを生成します。署名済み`.ipa`/`.aab`は生成しません。

ストア用ビルド例（外部通信・課金・資格情報を伴うため、実行前に承認が必要）：

```bash
cd apps/mobile
npx eas-cli build --platform ios --profile production
npx eas-cli build --platform android --profile production
```

## 情報更新と失効

公開前に、`lib/disaster-data.ts` と `apps/mobile/src/data/actions.ts` の各カードについて、公式ページを再確認します。

各カードには次が必須です。

- `sourceName` / `sourceUrl`
- `publishedAt`
- `fetchedAt`
- `checkedAt`
- `expiresAt`
- `sourceStatus`

期限切れ情報は削除せず「現在の状況は確認できません」と表示します。公式ページへの接続確認だけで、掲載内容の現在性を保証してはいけません。

## 緊急縮退

Webはビルド時環境変数で個別案内を停止できます。

```bash
NEXT_PUBLIC_EMERGENCY_MODE=true npm run build
```

この状態では119・110と公的情報を優先し、個別カードを非表示にします。通常表示へ戻す場合は変数を外して再ビルド・再デプロイします。

## アーキテクチャ

```text
公式情報
  ↓ 手動確認・構造化（R1）
ActionCard
  ├─ Web SSR / PWA cache
  └─ iOS / Android bundled data
       ↓
利用者が公式サイトを明示操作で開く
```

R1にはDB、認証、投稿API、個人情報保存、外部分析SDKがありません。公式リンクを開いた後は、リンク先サービスのCookie・位置情報・プライバシーポリシーが適用されます。

## 現在の検証結果

2026年7月30日時点：

- Web TypeScript検査：成功
- Web本番ビルド：成功
- Webテスト：8件成功（行動順序ステップ、かな検索到達性の契約検査を含む）
- Web依存監査：脆弱性0件
- WebクライアントJS/CSSのgzip合計：約103KB（初期150KB上限内）
- Web実ブラウザ（Playwright headless Chromium、390×844と1440×900）：15項目PASS / 0 FAIL
  - 被災者シナリオ：断水・薬・トイレ・連絡不通・夜間ダークモード・オフライン・特大文字・キーボードのみ
  - hydration不整合0件、コンソールエラー0件
  - コントラスト：ライト15項目・ダーク15項目すべてWCAG AA合格
  - タップ対象：標準/特大とも44px未満0件、横方向あふれ0px
  - オフライン：外部リンク14件を無効化し電話導線を維持、Service Worker再読込で14件表示
  - 期限切れ時も全14カードで行動手順を表示

実ブラウザQAで検出し修正した不具合：鮮度シグナルが全件期限切れでも緑のまま／「薬」検索で医療カードが2番目に沈む／「こども」「くすり」等のかな検索が0件／ヒーローがモバイル初画面を占有／出典詳細のタップ領域39px。
- WebクライアントJS/CSSのgzip合計：約101KB（初期150KB上限内）
- Mobile TypeScript検査：成功
- Mobile lint：成功
- Expo Doctor：20/20
- iOS bundle export：成功
- Android bundle export：成功
- Mobile監査：Critical/High 0件、Expoビルドツール経由のModerate 11件

## 公開前に残る課題（No-Go）

次はコード内テストでは代替できないため、完了するまで一般公開・ストア申請を行いません。

1. 公式情報の再確認
   - 現在の掲載内容、発表・取得・確認・失効時刻を更新する。
   - 古い静的時刻のまま公開しない。
2. 運営・訂正体制
   - 公開問い合わせ先、訂正担当者、停止判断者、対応可能時間を確定する。
   - 現在の環境変数方式は再デプロイが必要で、「管理画面から数分以内」の停止要件は未達。
3. 現地評価
   - 熊本在住者または現地支援者3〜5人による実機・主要シナリオ評価は未実施。
4. ネイティブ実機・署名境界
   - iOS実機、Android実機、VoiceOver/TalkBackでの確認は未実施。
   - iOS Simulator起動は、Expo Go 57.0.5の取得が8%で停滞したため中止。Android Simulatorは同じ開発クライアント境界が未解決のため未起動。
   - Apple/Googleの署名済みストア成果物と審査は未検証。
5. 配信境界
   - 本番URLのCDN性能、低速回線、オフライン再起動、ロールバックは未検証。
   - Web公開、App Store/Google Play申請、メール送信は承認後に実行する。

現在の判定は `implementation_complete_boundary_unverified` です。コードとローカル検査は通っていますが、実配信・実機・現地運用の証拠はありません。

## リリース手順

1. 公式情報と全時刻を更新する。
2. `npm run lint && npm test && npm audit` を実行する。
3. Mobileでtypecheck、lint、Expo Doctor、両platform exportを実行する。
4. ステージングURLを実機・低速回線・オフラインで確認する。
5. 熊本在住者/現地支援者の操作確認を記録する。
6. 運営者、問い合わせ先、訂正・停止手順を確定する。
7. 明示承認後にWebを本番公開する。
8. iOS/Androidの署名ビルド、TestFlight/Internal testing、ストア審査へ進む。
9. 公開URLと検証結果を、承認された送信アカウントから指定先へメールする。

## 主なファイル

- `app/home-client.tsx`：Web UIと絞り込み
- `lib/disaster-data.ts`：Webの公式導線・鮮度・失効
- `public/sw.js`：PWAキャッシュ
- `app/status/page.tsx`：運用ステータス
- `tests/`：レンダリング・情報契約・安全境界テスト
- `apps/mobile/src/app/`：iOS/Android画面
- `apps/mobile/src/data/actions.ts`：ネイティブ版データ
- `apps/mobile/app.json`：bundle identifier / package設定
- `apps/mobile/eas.json`：EAS build profile
