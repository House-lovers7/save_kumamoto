# アーキテクチャ — くまもと いまどうするナビ

最終更新: 2026-08-02 / 出典: 実コード調査（`worker/index.ts`, `public/sw.js`, `lib/emergency-mode.ts`, `app/page.tsx`, `app/status/page.tsx`, `app/home-client.tsx`, `scripts/generate-mobile-data.mjs`, `scripts/qa/patrol-diff.mjs`, `.github/workflows/ci.yml`, `.github/workflows/patrol.yml`, `vite.config.ts`）

## 1. 全体構成

```mermaid
flowchart TB
    subgraph OFFICIAL["公式サイト群（熊本県・熊本市・氷川町・TCA・国交省九州地方整備局・資源エネルギー庁・熊本市上下水道局）"]
        SRC["19枚のActionCardが参照する公式URL"]
    end

    subgraph HUMAN["運営者（人間）"]
        PATROL["毎日1回の巡回<br/>公式ページを開いて手で確認"]
    end

    subgraph EDGE["Cloudflare Workers（実行環境）"]
        WI["worker/index.ts<br/>セキュリティヘッダー付与 + 画像最適化"]
        VH["vinext app-router-entry<br/>SSR / RSC ハンドラ"]
        ASSETS["ASSETS バインディング<br/>静的アセット（dist/client = public/ + ビルド成果物）"]
    end

    subgraph BROWSER["ブラウザ（Web PWA）"]
        HTML["初期HTML + RSCペイロード"]
        REACT["React hydration後<br/>app/home-client.tsx"]
        SW["Service Worker<br/>public/sw.js（cache: kumamoto-action-v3）"]
        LS["localStorage<br/>relief-area / relief-text-scale"]
    end

    subgraph MOBILE["モバイル（Expo, R2で公開予定）"]
        NATIVE["apps/mobile/src/app/*<br/>Expo Router"]
        GENDATA["apps/mobile/src/data/actions.ts<br/>生成物・端末に同梱・実行時通信なし"]
    end

    ENV["環境変数 EMERGENCY_MODE<br/>wrangler secret（Workers bindings）"] -.読み取り.-> VH

    PATROL -->|手で確認して編集| CANON["lib/disaster-data.ts（正典）"]
    CANON -->|npm run build| WI
    CANON -->|npm run gen:mobile-data| GENDATA

    SRC -.出典として引用.-> CANON
    SRC -.日次巡回で取得比較.-> PATROLDIFF["scripts/qa/patrol-diff.mjs"]
    CANON -.巡回対象の一覧.-> PATROLDIFF

    WI --> VH --> ASSETS
    VH --> HTML --> REACT
    HTML -. install時にプリキャッシュ .-> SW
    REACT -->|保存| LS
    REACT -->|register| SW
    SW -. オフライン時に保存版を返す .-> HTML

    GENDATA --> NATIVE
```

**要点**

- Cloudflare Workers上で `worker/index.ts` が受け口になり、`/_vinext/image` は画像最適化ハンドラへ、それ以外は vinext の `app-router-entry` ハンドラ（SSR/RSC）へ委譲する。どちらの応答にもセキュリティヘッダーを付け直してから返す（`worker/index.ts:94-112`）。
- 実行時に外部（公式サイト）へ取りに行く処理はアプリ本体のコードには無い。情報は運営者が巡回時に手で `lib/disaster-data.ts` へ書く（`docs/DESIGN.md:111-112` の記述をコードでも確認: `lib/disaster-data.ts` にはfetch呼び出しが無い）。`scripts/qa/patrol-diff.mjs` だけが公式URLへ実際にHTTPリクエストする（後述「データ更新フロー」）。
- ネイティブ（Expo）は `apps/mobile/src/data/actions.ts` を起動時にアプリへ同梱したデータとして読むだけで、実行時通信はゼロ（`README.md`「これは何か」）。EMERGENCY_MODE の停止経路もネイティブには届かない（`docs/RELEASE_AUDIT.md`「停止の到達範囲」, `docs/DESIGN.md:173-175`）。
- インフラとして持たないもの: KV / D1 / R2 / Durable Objects / キュー / **Workers の cron trigger** / DB / 認証基盤 / 外部APIクライアント / アクセス解析SaaS（`docs/DESIGN.md:384-392`。根拠は本書 `data-model.md` の「データベースは無い」章で裏取り）。後述する巡回パトロールの定期実行は GitHub Actions の `schedule` であり、公開アプリ（Workers）側の定期実行ではない。

## 2. リクエスト処理フロー

### 2-1. Service Worker（`public/sw.js`）のナビゲーション／非ナビゲーション経路

sw.jsはv3（`CACHE = "kumamoto-action-v3"`, `public/sw.js:1`）。前バージョンとの主な差分は、`/` キーの保存条件を厳格化したこと（`pathname === "/" かつ response.ok` の両方を満たす時だけ保存）と、ナビゲーションfetchに4秒のタイムアウトを持たせたこと（`public/sw.js:3, 24-39`）。

```mermaid
flowchart TB
    F["fetch イベント発火"] --> G0{"GET かつ同一オリジンか"}
    G0 -->|"いいえ"| PASS["介入しない（ブラウザのデフォルト挙動）"]
    G0 -->|"はい"| NAV{"request.mode === 'navigate'？"}

    NAV -->|"はい（HTMLナビゲーション）"| T["4秒タイマー付きfetchを発行<br/>AbortControllerで打ち切り"]
    T --> OK{"取得成功 かつ<br/>pathname === '/' かつ response.ok？"}
    OK -->|"はい"| SAVE["/ キーでキャッシュへ保存してから応答"]
    OK -->|"いいえ（他パス or 非ok）"| RESP["キャッシュ保存はせずそのまま応答"]
    T -->|"タイムアウト or ネットワーク失敗"| FALLBACK["caches.match('/') で保存版へフォールバック"]

    NAV -->|"いいえ（画像/CSS/JS等）"| CACHEFIRST{"caches.match(request) にヒット？"}
    CACHEFIRST -->|"はい"| CACHED["キャッシュ版を返す"]
    CACHEFIRST -->|"いいえ"| FETCH2["fetchして取得"]
    FETCH2 --> OK2{"response.ok？"}
    OK2 -->|"はい"| SAVE2["request をキーにキャッシュへ保存してから応答"]
    OK2 -->|"いいえ"| ASIS["保存せずそのまま応答"]
```

この設計により、`/status`（緊急停止の確認ページ）への遷移が `/` の保存内容を汚染しない（`pathname === "/"` チェックが無いと、`/status` の応答が誤って `/` キーへ保存されてしまう）。この性質は `tests/sw-cache.test.mjs` の「`/status` へのナビゲーション後も `/` キーの内容はトップページのまま」テストで固定されている（`tests/sw-cache.test.mjs:113-129`）。

### 2-2. EMERGENCY_MODE（緊急縮退）の判定経路

```mermaid
sequenceDiagram
    participant O as 運営者
    participant CF as Cloudflare Workers（wrangler secret）
    participant SC as Server Component<br/>(app/page.tsx / app/status/page.tsx)
    participant Lib as lib/emergency-mode.ts
    participant CC as Client Component<br/>(app/home-client.tsx)
    participant U as 利用者のブラウザ

    O->>CF: npx wrangler secret put EMERGENCY_MODE（値=true）
    Note over CF: nodejs_compat + compatibility_date >= 2025-04-01<br/>により bindings が process.env へ載る（vite.config.ts:17-22）
    U->>SC: GET / または GET /status
    SC->>Lib: readEmergencyMode() を呼び出しごとに評価
    Lib-->>SC: process.env.EMERGENCY_MODE === "true" の真偽値
    SC->>CC: props emergencyMode={値} として渡す（RSCペイロードに載る）
    CC->>U: 初期HTMLとhydrationが同じ1つの値から描画される<br/>（縮退中は困りごとグリッド/絞り込み/#actions/スキップリンクを描画しない）
```

`readEmergencyMode()` は関数の中でしか `process.env` を読まない実装で、モジュールのトップレベルで値を確定させない（`vinext start` はNode常駐のため一度しか評価されず、切り替えが効かなくなるのを防ぐ。`lib/emergency-mode.ts:14-21`）。クライアントコンポーネントからは呼ばない（クライアントバンドルでは `process.env` が空オブジェクトに置換され常にfalseになる）。この3条件は `tests/emergency-mode.test.mjs` がソースコードの形そのものを検査して固定している（`tests/emergency-mode.test.mjs:104-125`）。

縮退中に消える要素・残る要素は `app/home-client.tsx:169-525` の5箇所の条件付きレンダリング（`{!emergencyMode && ...}`。169 / 248 / 259 / 274 / 294行）で実装されており、詳細は `screens.md` を参照。

## 3. データ更新フロー

```mermaid
flowchart TB
    subgraph daily["運営者の日次巡回（docs/OPERATIONS.md 第5章）"]
        D1["公式サイトを開いて手で確認"]
        D2["lib/disaster-data.ts を編集<br/>PATROL_AT / PATROL_EXPIRES_AT / facts 等"]
    end

    subgraph gate["機械ゲート"]
        G1["npm run gen:mobile-data<br/>scripts/generate-mobile-data.mjs"]
        G2["npm run lint / npm test<br/>tests/*.test.mjs"]
    end

    subgraph patrol["自動巡回（人間の判断を検算する）"]
        P1["scripts/qa/patrol-diff.mjs<br/>cronで6時間ごと起動（.github/workflows/patrol.yml）"]
        P2["19カードが参照する公式URLへ実際にHTTPリクエスト"]
        P3{"sourceLandmark / facts.citedAs / facts.items<br/>が出典本文に見つかるか"}
        P4["GitHub Issueを作成/更新<br/>ラベル patrol-diff / patrol-fetch-error"]
    end

    D1 --> D2 --> G1
    G1 -->|"apps/mobile/src/data/actions.ts を再生成"| MOBILE["apps/mobile/src/data/actions.ts（生成物・直接編集禁止）"]
    D2 --> G2
    MOBILE -.生成し忘れ検出.-> PARITY["tests/mobile-parity.test.mjs"]

    D2 -.出典URL一覧.-> P1
    P1 --> P2 --> P3
    P3 -->|"見つからない/取得失敗"| P4
    P3 -->|"一致"| CLEAN["Issueは作らない（core.info ログのみ）"]
    P4 -.-> D1
```

**正典は1つ。** `lib/disaster-data.ts` だけが情報の原本で、ネイティブ用 `apps/mobile/src/data/actions.ts` は `npm run gen:mobile-data`（実体: `scripts/generate-mobile-data.mjs`）の生成物（`README.md`「開発の勘所」）。生成スクリプトはソーステキストを `export const municipalities` と `export const siteCheckedAt` の2つのマーカー文字列で切り出して複製し、`actionCards` 本体は `JSON.stringify` で埋め込む（`scripts/generate-mobile-data.mjs:18-19, 46-63`）。マーカー文字列が消えたり並びが変わると生成が例外で止まる（`scripts/generate-mobile-data.mjs:23-29`）。

**巡回パトロールはデータを自動更新しない。** `scripts/qa/patrol-diff.mjs` は `lib/disaster-data.ts` の `sourceLandmark` / `facts[].citedAs` / `facts[].items` が出典ページの本文に実在するかをテキスト正規化のうえで照合するだけで（`scripts/qa/patrol-diff.mjs:28-38, 116-142`）、差分が見つかっても `lib/disaster-data.ts` を書き換えず、GitHub Issueで人間に通知するだけ（`.github/workflows/patrol.yml:5-7` のコメントで明示）。

## 4. CI/CD（`.github/workflows` の2本）

```mermaid
flowchart LR
    subgraph CI["ci.yml — push/PR (main) で実行"]
        direction TB
        W["web ジョブ<br/>lint(tsc --noEmit) → test(build+node --test) →<br/>audit(npm audit --omit=dev) →<br/>mobile-data drift check(gen:mobile-data後にgit diff --exit-code)"]
        M["mobile ジョブ<br/>typecheck(tsc --noEmit)のみ"]
    end

    subgraph PATROL["patrol.yml — schedule(6時間毎) + workflow_dispatch"]
        direction TB
        RUN["scripts/qa/patrol-diff.mjs --json を実行"]
        ISSUE["結果をGitHub Issueへ反映<br/>（labels: patrol-diff / patrol-fetch-error / automated-patrol）"]
    end

    PUSH["push / PR to main"] --> CI
    CRON["cron: 0 */6 * * * (UTC)"] --> PATROL
```

| workflow | トリガー | 役割 | 副作用 |
|---|---|---|---|
| `ci.yml` | `push`（main）/ `pull_request`（main）/ `workflow_dispatch` | webジョブ: lint・ビルド込みテスト・依存監査・正典→生成物のドリフト検知。mobileジョブ: 型検査のみ（`.github/workflows/ci.yml:1-78`） | リポジトリへの書き込みなし（`permissions: contents: read`、`.github/workflows/ci.yml:14-15`） |
| `patrol.yml` | `schedule`（6時間毎）/ `workflow_dispatch` | 出典サイトへ実際にアクセスし、カード内容との差分・取得失敗を検知してGitHub Issueで通知（`.github/workflows/patrol.yml:1-23`） | `issues: write`。Issueの作成・コメントのみで、`lib/disaster-data.ts` 等のデータやコードへの自動commitは一切行わない（コード先頭コメントとworkflow本体の両方で明示。`.github/workflows/patrol.yml:5-7`） |

`ci.yml` はNode 24（npm 11系）を使う。開発機と同じnpmメジャーでlockファイルを生成しているため、Node 22系のnpm 10では `npm ci` が依存欠落として失敗する実測があったための固定（`.github/workflows/ci.yml:32-38`）。`patrol.yml` も同じ理由でNode 24を使う（`.github/workflows/patrol.yml:35-39`）。

## 持っていないインフラ（裏取り済み）

`KV / D1 / R2 / Durable Objects / キュー / cron trigger / データベース / 認証基盤・セッション / 外部APIクライアント / アクセス解析・広告・エラー収集SaaS` は無い。根拠は `data-model.md` の「データベースは無い」章を参照（`db/` `drizzle/` が空であることをgit履歴・grepで直接確認済み）。
