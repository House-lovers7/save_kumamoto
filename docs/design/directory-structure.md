# ディレクトリ構成 — くまもと いまどうするナビ

最終更新: 2026-08-02 / 出典: 実コード調査（`find` / `git ls-files` / `git log` によるリポジトリ全体の踏査）

## 注釈付きツリー

`node_modules` / `dist` / `.wrangler` / `*.tsbuildinfo`（`tsconfig.tsbuildinfo` 等）は生成物のため以下のツリーから除外した。`.vinext/`（vinextのフォントキャッシュ、`.gitignore` で無視設定済み）も同様の理由で除外した。`build/` は名称から生成物に見えるが、**実際は1本のソースファイルのみを含む実体のあるディレクトリ**だったため、除外リストの意図（ノイズになる生成物の除去）を優先し、ツリーには残して注記した（判断の詳細は本書末尾）。

```text
save_kumamoto/
├── app/                        Webのapp router本体（vinext / Next.js互換）
│   ├── page.tsx                 "/" のServer Component。EMERGENCY_MODEを読んでpropsで渡す
│   ├── home-client.tsx          "/" のClient Component。絞り込み・検索・カード描画の本体
│   ├── layout.tsx               ルートレイアウト。metadata（robots: noindex）・viewport
│   ├── globals.css              手書きCSS（ライト/ダーク切替のカスタムプロパティ）
│   ├── _sites-preview/          空ディレクトリ（後述「用途調査」参照）
│   └── status/
│       └── page.tsx             "/status" 運用ステータス（Server Component）
├── apps/
│   └── mobile/                  Expo/React Native モバイルアプリ（独立npmプロジェクト）
│       ├── src/
│       │   ├── app/              Expo Router画面（index / offline-guides / about / _layout）
│       │   ├── data/actions.ts   生成物。lib/disaster-data.ts から自動生成、直接編集禁止
│       │   ├── theme.ts          配色トークン・文字倍率・AREA_KEY等の共有定数
│       │   └── use-text-scale.ts 文字サイズ設定の共有フック
│       ├── scripts/qa/           モバイル向けQAスクリプト（ui.py / tap_targets.py）
│       ├── app.json              bundle identifier（jp.savekumamoto.imadousuru）等
│       ├── eas.json              EAS buildプロファイル
│       ├── AGENTS.md / CLAUDE.md  Expo SDK 57運用ルール（ネイティブビルド・実描画検証の注意）
│       └── android/ ios/         Continuous Native Generationの生成物（.gitignore対象、直接編集禁止）
├── build/                       ビルド補助スクリプト置き場（1ファイルのみ）
│   └── sites-vite-plugin.ts     vite.config.tsが呼ぶVite plugin。ビルド後にdrizzle/等をdist/.openaiへコピーする（現状drizzle/は空なのでコピー対象なし）
├── db/                          空ディレクトリ（後述「用途調査」参照）
├── docs/
│   ├── design/                  本ドキュメント群（このディレクトリ）
│   ├── adr/                     Architecture Decision Record（くまモンマスコット関連1件）
│   ├── kumamon/                 くまモン特例利用の届出パッケージ関連資料（本アプリのコードとは無関係）
│   ├── qa/                      実ブラウザ/実機QAの実測記録（スクリーンショット・README）
│   ├── work-orders/             外部レビュー起因の作業指示書
│   ├── DESIGN.md                本ディレクトリの前身にあたる単一ファイル設計書（2026-07-31時点）
│   ├── OPERATIONS.md            訂正・停止の運用手順（ランブック）
│   ├── RELEASE_AUDIT.md         公開判定・検証実測ログ・残課題・リリース手順
│   └── FIXES.md                 修正した不具合の記録（症状 → 原因 → 対処）
├── drizzle/
│   └── meta/                    空ディレクトリ（後述「用途調査」参照）
├── examples/
│   └── d1/                      空ディレクトリ（後述「用途調査」参照）
├── lib/                         Web/モバイル共有のドメインロジック
│   ├── disaster-data.ts         正典。ActionCard型定義・19カードのデータ・時刻/失効ヘルパー
│   └── emergency-mode.ts        緊急停止スイッチの唯一の実装（サーバー専用）
├── public/                      Web静的アセット（ASSETSバインディング経由で配信）
│   ├── sw.js                    Service Worker（v3。ナビゲーションキャッシュ・4秒タイムアウト）
│   ├── manifest.webmanifest     PWAマニフェスト
│   ├── favicon.svg              アイコン
│   └── file.svg / globe.svg / window.svg  vinext-starterの既定サンプルアイコン（アプリ内での使用は未確認）
├── scripts/
│   ├── generate-mobile-data.mjs 正典からapps/mobile/src/data/actions.tsを生成
│   └── qa/
│       ├── patrol-diff.mjs       出典サイトとカード内容の差分検知（CI/cronから実行）
│       ├── hydration-check.mjs   hydration後の実DOMを実ブラウザで計測
│       └── tap-target-check.mjs  タップ領域の実測
├── tests/                       node:test（追加依存なし）
│   ├── data-contract.test.mjs    ActionCardのデータ契約（19カード全件の制約検査）
│   ├── emergency-mode.test.mjs   緊急停止スイッチの回帰テスト
│   ├── security-headers.test.mjs セキュリティヘッダーの回帰テスト（WO-3）
│   ├── sw-cache.test.mjs         Service Workerのナビゲーションキャッシュ回帰テスト
│   ├── mobile-parity.test.mjs    正典↔生成物の整合・再生成し忘れ検出
│   ├── patrol-diff.test.mjs      巡回差分ロジックの単体テスト
│   ├── rendered-html.test.mjs    サーバーレンダリングの検査
│   └── fixtures/patrol/          patrol-diff.mjs用の固定応答フィクスチャ
├── worker/
│   └── index.ts                  Cloudflare Worker本体。セキュリティヘッダー付与 + 画像最適化 + vinextハンドラ委譲
├── work/
│   └── kumamon/                  くまモンデザインシート制作の作業ファイル（HTML/画像/参照PDF）。本アプリの実行コードとは無関係、docs/kumamon/の素材置き場
├── .github/
│   └── workflows/
│       ├── ci.yml                 push/PR時: lint・test・audit・mobile-dataドリフト検知 + mobile typecheck
│       └── patrol.yml             6時間毎cron: 出典差分検知 → GitHub Issue通知
├── .claude/
│   └── settings.local.json        Claude Code のローカル権限設定（本アプリの実行時には無関係）
├── .openai/
│   └── hosting.json                vinext-starterのホスティング設定フラグ（{"d1": null, "r2": null}）。db/drizzle/examples/d1が空である理由の根拠
├── package.json / package-lock.json  Web側の依存関係定義（`type: module`）
├── next.config.ts                  vinextが読むNext.js互換設定（現状ほぼ空）
├── vite.config.ts                  Vite/Cloudflare Workersビルド設定。EMERGENCY_MODE前提条件のcompatibility_date等をここで固定
├── postcss.config.mjs              Tailwind CSS 4 (@tailwindcss/postcss) 設定
├── tsconfig.json / tsconfig.web.json  TypeScript設定（サーバー向け・Web向け）
├── README.md                       オンボーディングの入口（コンセプト・実行方法・画面と操作・構成）
├── HANDOFF.md                      開発セッション間の引き継ぎメモ（生きた作業ログ、本アプリの仕様書ではない）
└── handoff-kumamon-2026-08-01.md   くまモン特例申請作業の引き継ぎメモ（同上）
```

## 用途調査（`db/` / `drizzle/` / `examples/d1/` / `app/_sites-preview/`）

これらは実行コードから参照されておらず、いずれも空である（`find db drizzle examples -mindepth 1 -type f` は該当ファイル無し、`drizzle/meta` も空、`examples/d1/app/api/notes` `examples/d1/db` も空）。`git ls-files` で追跡ファイルが0件、`git log --all` でもコミット履歴が無いことを確認した（＝リポジトリ作成以来、一度も中身が入ったことがない）。

`vite.config.ts:9-33` は `.openai/hosting.json` の `d1` / `r2` フィールド（現在ともに `null`）を読み、Cloudflare WorkersのD1/R2バインディング設定を条件分岐で無効化する。`build/sites-vite-plugin.ts` はビルド後に `drizzle/` があれば `dist/.openai/drizzle` へコピーする処理を持つが、コピー元が空なので実質何もしない。これらは vinext-starter テンプレートが持つ汎用のデータベース連携（Cloudflare D1/R2 + Drizzle ORM）用スキャフォールドで、**本アプリ（読み取り専用の災害情報案内）はデータベースを使わない設計のため未使用のまま残っている**と判断できる。詳細な裏取りは `data-model.md`「RDBは存在しない」章を参照。

`app/_sites-preview/` も同じく空ディレクトリで、`git ls-files app/_sites-preview` が0件、`.gitignore` にも該当せず（`git check-ignore` がヒットしない）、`*.ts` / `*.tsx` / `*.mjs` / `*.json` / `*.md` 全体を対象にした `_sites-preview` の grep でも参照が見つからない。**gitに存在しないローカルの空ディレクトリ**であり、クローンし直した環境には現れない。中身が空で `page.tsx` を持たないため、ルートも生成しない。

## `build/` をツリーから除外しなかった理由

依頼の除外リストには `build` が挙がっているが、実際に中身を確認したところ `build/sites-vite-plugin.ts` という1ファイルのみが存在し、これは `vite.config.ts:4` から `import { sites } from "./build/sites-vite-plugin"` として読み込まれる、gitに追跡された本物のビルド設定ソースだった（一般的な「ビルド生成物ディレクトリ」ではない）。除外リストの意図（node_modules/dist/.wranglerのような、情報量が無いノイズの除去）に照らすと、`build/` を機械的に除外すると実在するソースファイルの存在が読者から見えなくなってしまうため、ツリーには残し、内容が生成物でないことを明記する形にした。

## 用途未確認のもの

- `public/file.svg` / `public/globe.svg` / `public/window.svg`: `grep -rn "file.svg\|globe.svg\|window.svg" app/ apps/mobile/src/` では参照箇所が見つからなかった。vinext-starterテンプレートに含まれる既定サンプルアイコンとみられるが、アプリ内での使用有無は**未確認**。
