# 緊急停止スイッチの実測（2026-07-31）

`80ec958` で直した「停止スイッチがブラウザ側で効いていない」不具合について、
**同じビルドのまま環境変数だけを変えて**採取した証拠。

前提: 停止フラグはサーバー側の `readEmergencyMode()`（`lib/emergency-mode.ts`）だけが読み、
クライアントへは props で渡す。クライアントバンドルでは `process.env` が `{}` に置換されるため、
`"use client"` の中から読むと常に false になる（これが元の不具合）。

## 1. Node 本番サーバ（`vinext start`）

`npm run build` は1回だけ。以後は環境変数を変えて再起動しただけで、**再ビルドしていない**。

| 計測項目 | 環境変数なし | `EMERGENCY_MODE=true` |
|---|---|---|
| `class="action-section"` | 1 | **0** |
| `class="need-grid"` | 1 | **0** |
| `class="controls"` | 1 | **0** |
| `skip-link` | 1 | **0** |
| 「緊急縮退モード」 | 0 | **1** |
| 「まずやること」 | 14 | **0** |
| `tel:119` / `tel:110` | 1 / 1 | **1 / 1（残る）** |
| RSCペイロード | `emergencyMode=false` | **`emergencyMode=true`** |
| `/status` | 通常表示 | **緊急縮退中** |

`grep -rl 'EMERGENCY_MODE' dist/client/assets/` → 該当なし（クライアントへ配っていない）。

## 2. workerd（`vinext dev` = miniflare／本番と同じランタイム）

`.dev.vars` → wrangler → miniflare bindings → workerd の `process.env` populate という、
**本番の secret と同じ鎖**を通した確認。Node の `process.env` を直接使う手順ではこの鎖を通らない。

| 計測項目 | `.dev.vars` なし | `.dev.vars` に `EMERGENCY_MODE=true` |
|---|---|---|
| `class="action-section"` | 1 | **0** |
| 「緊急縮退モード」 | 0 | **1** |
| RSCペイロード | `emergencyMode=false` | **`emergencyMode=true`** |
| `/status` | 通常表示 | **緊急縮退中** |

起動ログに `Using secrets defined in .dev.vars` が出る。wrangler は `.dev.vars` の各行を
**var ではなく secret として**扱うため、「secret でも `process.env` に載るか」もここで確認できている。

## 3. 実ブラウザの hydration 後 DOM（今回のバグの直接症状）

ローカルの Google Chrome 150.0.7871.187 を headless + CDP で操作し、
**React がマウントし終わった後**の DOM を数えた（`scripts/qa/hydration-check.mjs`）。

| 計測項目 | 通常表示（対照） | `EMERGENCY_MODE=true` |
|---|---|---|
| `reactHydrated` | true | **true** |
| `serviceWorkerRegistrations` | 1 | 1 |
| `.action-card` | **14** | **0** |
| `.action-section` | 1 | 0 |
| `.need-grid` / `.controls` / `.skip-link` | 1 / 1 / 1 | **0 / 0 / 0** |
| `.maintenance-notice` | 0 | **1** |
| `.emergency-strip` | 1 | **1** |
| `a[href^="tel:"]` | `tel:119`, `tel:110` | **`tel:119`, `tel:110`** |
| `.steps__title` | 14 | 0 |
| console / log / exception | **なし** | **なし** |

- `reactHydrated: true` と Service Worker 登録（`useEffect` の中で実行）が、**JSが実際に走った証拠**。
  これが無いと「0件」は単にSSRのHTMLを見ているだけで、止まっている証拠にならない
- 対照側で 14 カードを検出できているので、計測系がカードを見落としているのではない
- hydration 警告・エラーが1件も出ていない。値の出所がサーバー1箇所なので、SSRと
  クライアントで判定が食い違わない

## この証拠でも言えないこと

- **本番 Cloudflare Workers での実操作**は未検証。secret を設定してから実利用者へ届くまでの
  実時間は、デプロイ承認後にしか測れない
- **開いたままのタブ・オフラインのPWA利用者・ネイティブアプリ**には停止が届かない。
  到達範囲は `docs/OPERATIONS.md` の表を参照
- localhost と miniflare で採れた証拠を、本番境界の証拠に読み替えない

## 再現手順

```bash
npm run build

# 1. Node 本番サーバ（ポート3000が塞がっていたので3123を使った）
npm run start -- --port 3123 &
EMERGENCY_MODE=true npm run start -- --port 3123 &

# 2. workerd
printf 'EMERGENCY_MODE=true\n' > .dev.vars && npm run dev -- --port 3123 &
rm .dev.vars

# 3. 実ブラウザ（hydration 後のDOM）
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --remote-debugging-port=9333 \
  --user-data-dir=/tmp/chrome-qa about:blank &
node scripts/qa/hydration-check.mjs 9333 http://localhost:3123/
```

回帰は `tests/emergency-mode.test.mjs` が `npm test` で自動的に見る（8件）。
そのゲートが本物であることは変異注入で確認済み — `lib/emergency-mode.ts` を
トップレベル `const` キャプチャへ書き換えると、ソース検査だけでなく
**実行時の往復テストを含む5件**が落ちる。
