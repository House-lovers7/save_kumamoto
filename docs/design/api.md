# API定義書 — くまもと いまどうするナビ

最終更新: 2026-08-02 / 出典: 実コード調査（`worker/index.ts`, `tests/security-headers.test.mjs`, `app/layout.tsx`, `public/manifest.webmanifest`, `lib/emergency-mode.ts`, `vite.config.ts`, `dist/server/wrangler.json`, `tests/data-contract.test.mjs`）

## このアプリは公開REST/GraphQL/RPC APIを持たない

**外部へ公開する REST / GraphQL / RPC エンドポイントは存在しない。** `POST` / `PUT` / `DELETE` を受け付ける経路も、JSONを返す経路も実装していない。利用者から送られてくるデータが無いため、受け口を持つ必要がない（`worker/index.ts` 全体を確認しても、GETリクエストの処理経路以外は実装されていない）。

以下は「公開している HTTP 経路」の一覧であって、データ授受を伴うAPI定義ではない。

## 公開経路

| メソッド | パス | 応答Content-Type | 認証 | キャッシュ | 備考 |
|---|---|---|---|---|---|
| GET | `/` | `text/html`（SSR + RSCペイロード） | なし | ブラウザ/エッジ側の明示指定なし。Service Workerがnetwork-firstで管理（後述） | 案内画面。`app/page.tsx` |
| GET | `/status` | `text/html` | なし | **`Cache-Control: no-store`** を明示付与（`worker/index.ts:81-85`） | 運用ステータス。緊急停止フラグを確認できる唯一の経路（`app/status/page.tsx`） |
| GET | `/manifest.webmanifest` | `application/manifest+json`［中］ | なし | ASSETS経由の静的配信 | PWAマニフェスト。`lang: ja`（`public/manifest.webmanifest:5`）。`app/layout.tsx:9` からリンク |
| GET | `/sw.js` | `application/javascript`［中］ | なし | ASSETS経由の静的配信 | Service Worker本体（`public/sw.js`） |
| GET | `/favicon.svg` | `image/svg+xml`［中］ | なし | ASSETS経由の静的配信 | `app/layout.tsx:12-13` からアイコンとして参照 |
| GET | `/_vinext/image` | 変換後の画像（`format`パラメータに従う） | なし | 個別指定なし | `worker/index.ts:98-108` が `vinext/server/image-optimization` の `handleImageOptimization` を呼び出す。許可幅は vinext の既定値（`DEFAULT_DEVICE_SIZES` / `DEFAULT_IMAGE_SIZES`）のみ |
| GET | その他 | 静的アセット or 404 | なし | ASSETS経由 | `ASSETS` バインディング（`dist/server/wrangler.json` の `"assets":{"directory":"../client"}`）。ルーティングの内部実装は依存パッケージ `vinext/server/app-router-entry` 側で、本リポジトリのコードでは検証していない［中］ |

**すべて認証なし・すべてGET・すべて公開情報。** クエリパラメータで利用者を識別しない。Cookieを発行しない（`docs/DESIGN.md:451` の記述をコード側からも確認: `worker/index.ts` にCookie発行処理は無い）。

`/manifest.webmanifest` `/sw.js` `/favicon.svg` のContent-Typeは、Cloudflare Workers Static Assets（`ASSETS` バインディング）が拡張子から推定する既定動作に基づく想定であり、本リポジトリ内に明示設定するコードは無い。実HTTPレスポンスで直接検証したテストは無いため［中］とした。

## セキュリティヘッダー（`worker/index.ts` の `applySecurityHeaders()`）

`/_vinext/image` を含む**すべての応答**に対し、Workerが元のResponseのHeadersをコピーし直して以下を付与する（`worker/index.ts:68-92`）。`tests/security-headers.test.mjs` が回帰テストとして固定している。

| ヘッダー | 値 | 目的 |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | MIMEタイプスニッフィング防止 |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 同一オリジン/HTTPS間はフルURLを送り、クロスオリジンはoriginのみ、HTTPへのダウングレード時は送らない（MDN推奨の既定値） |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=()` | 位置情報・カメラ・マイクを無効化 |
| `X-Frame-Options` | `DENY` | frame-ancestors未対応の古いブラウザ向けフォールバック |
| `Content-Security-Policy`（enforced） | `frame-ancestors 'none'` | クリックジャッキング対策のみを即時強制。他ディレクティブは混ぜない（inline scriptを壊すリスクがあるため） |
| `Content-Security-Policy-Report-Only`（監視のみ） | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'` | 本体ポリシーをReport-Onlyで先行運用。`report-uri`/`report-to` は設定しておらず、違反データは外部へ送信されない |
| `Cache-Control`（`/status` のみ） | `no-store` | キルスイッチの状態表示を常に最新化する |

**設計上の理由（`worker/index.ts:40-54` コメントより）**: CSP3仕様では `Content-Security-Policy-Report-Only` はどのディレクティブに対しても実際のブロックを行わない（disposition "report" がshould-block-request判定自体をスキップする）。そのため `frame-ancestors` をReport-Onlyだけに置くとクリックジャッキング対策として機能しない。`frame-ancestors` はNext/vinextのインラインスクリプトを壊すリスクが無いため、これだけを即時強制し、残りのディレクティブ（`script-src`等）はSSR出力のインラインブートストラップスクリプトを壊す可能性があるためReport-Onlyで開始している。

## 外部への発信

**実行時に外部へ出ていく通信は無い。** 公式サイトへのリンクは `<a href target="_blank" rel="noreferrer">` で、利用者のブラウザが直接開く（`app/home-client.tsx:566-576`）。アプリのサーバー（Worker）が公式サイトを取りに行くことはない。

情報の取得は、運営者が巡回時に手で行う（`docs/OPERATIONS.md` 第5章）。唯一、公式サイトへ実際にHTTPリクエストするコードは `scripts/qa/patrol-diff.mjs` で、これは開発・CI環境からの検証用スクリプトであり、公開されているアプリ本体（Cloudflare Workers上で動くコード）には含まれない。詳細は `architecture.md`「データ更新フロー」を参照。

## 環境変数契約

| 名前 | 型 | 既定 | 意味 | 出典 |
|---|---|---|---|---|
| `EMERGENCY_MODE` | 文字列。`"true"` のみ真、それ以外（未設定含む）はすべて偽 | 未設定 | 緊急縮退モード。個別カード・絞り込み操作子を非表示にし、119/110と公的情報を優先する | `lib/emergency-mode.ts:17-21` |

設定は `npx wrangler secret put EMERGENCY_MODE`（本番）、ローカルは `.dev.vars` または `EMERGENCY_MODE=true npm run start`（`README.md`「開発の勘所」）。

**変数名に `NEXT_PUBLIC_` を付けてはいけない。** vinextはビルドプロセスの `NEXT_PUBLIC_*` をrsc/ssrを含む全環境へdefineするため、値がサーバー側に定数として焼き付き、以後どの環境変数を変えても停止できなくなる（`README.md`「開発の勘所」, `lib/emergency-mode.ts:9-11`）。

Workersのbindings（vars/secrets）が `process.env` へ流し込まれる条件は `compatibility_date >= 2025-04-01` かつ `compatibility_flags: ["nodejs_compat"]` の両方（`vite.config.ts:21-22`。この前提を落とすと停止が黙って効かなくなる理由は同ファイル `17-20` のコメント）。`tests/emergency-mode.test.mjs:139-149` がこの前提条件をビルド成果物（`dist/server/wrangler.json`）から直接検査して固定している。

## 外部参照先（巡回対象の公式URL）

アプリ自体は外部と通信しないが、各カードが案内する**公式リンク先**は次のドメインに限定されている。`tests/data-contract.test.mjs:28-29` の `ALLOWED_SOURCE_HOSTS` 正規表現がこの許可リストを機械的に強制する。

| ドメイン | 出典組織 | 参照カード数 |
|---|---|---|
| `pref.kumamoto.jp` | 熊本県（防災推進課／認知症施策・地域ケア推進課／国保・高齢者医療課） | 3 |
| `city.kumamoto.jp` | 熊本市（各課・各区役所） | 9 |
| `kumamoto-waterworks.jp` | 熊本市上下水道局 | 1 |
| `town.hikawa.kumamoto.jp` | 氷川町 総務課 | 2 |
| `enecho-ss.meti.go.jp` | 資源エネルギー庁 資源・燃料部 | 1 |
| `qsr.mlit.go.jp` | 国土交通省 九州地方整備局 | 2 |
| `tca.or.jp` | 電気通信事業者協会（TCA） | 1 |

（カード数の内訳は `lib/disaster-data.ts` の `sourceUrl` フィールドから集計。合計19カード・7ドメイン。ドメインごとの詳細URLは `data-model.md` を参照）

`kumamoto-waterworks.jp` のみ、巡回スクリプトが表示面（トップページ）とデータ面（`list.php` のJSON、`X-Requested-With`/`Referer`ヘッダーが必要）を分けて取得する特殊な扱いを受ける（`scripts/qa/patrol-diff.mjs:98-113`）。
