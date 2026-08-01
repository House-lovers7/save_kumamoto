# 作業指示書: 外部レビュー(2026-08-01)対応

作成日: 2026-08-01（ファクトチェック実施セッション）
状態: WO-1〜4 完了（2026-08-02実行セッション）。WO-5/6は人間待ち

## 実施記録（2026-08-02）

| WO | commit | 検証 |
|---|---|---|
| WO-1 | f7e3371 | 新テスト4件（修正前red 3件実証→green）、npm test 43/43 |
| WO-2 | 0efbb71 | lint PASS + grep確認 |
| WO-3 | 965ae18 | 47/47 PASS + ローカル実測（/ と /status のヘッダー確認、/statusのみno-store）。本番実測はデプロイ後 |
| WO-4 | d4f500b + e11b985 + d5291dd | actionlint PASS。CI初回失敗2回: ①npm ci lock不整合（linux限定、rolldown wasm系optional依存の@emnapi/*欠落）→ node:24 linuxコンテナでlock再生成 ②Node 22→24へ整合。3回目で全ジョブPASS。patrolはworkflow_dispatch実走でIssue #1自動作成を確認（既知差分: support-systems） |

WO-4補足: 有効期限の事前警告Issueは patrol-diff.mjs の--json出力に期限残り時間情報がないため未実装（期限切れ後はneedsReview経由で差分Issueに含まれる）。

## 経緯

2026-08-01、外部AIレビュー（一般公開準備の総合評価）を受領。本リポジトリの実コードで全主要主張を裏取りした結果、**事実関係はほぼ正確**と判定し、以下の作業指示に変換した。ファクトチェック結果の要旨:

| 指摘 | 判定 | 根拠 |
|---|---|---|
| SWが全ナビゲーションを `/` として保存 | 確認済 [高] | public/sw.js:23-33（`cache.put("/", copy)`・ok未確認・タイムアウトなし） |
| 緊急停止が本番未検証 | 確認済 [高] | wrangler.toml/jsonc 不在、docs/qa/ に停止ドリル記録なし |
| CIなし | 確認済 [高] | .github/workflows 不在 |
| robots index許可 | 確認済 [高] | app/layout.tsx:10 |
| セキュリティヘッダーなし | 確認済 [高] | worker/index.ts 素通し、CSP等grep 0件 |
| 19カード規模の1人運用リスク | 妥当 [中] | lib/disaster-data.ts 1052行・id約20件（運用判断は人間） |
| LICENSE/SECURITY等不足 | 確認済 [高] | ルートに不在 |

レビュー側の誤り [低]: 「response.ok を確認せず」は非ナビゲーション経路（sw.js:41）には当てはまらない。ナビゲーション→`/` 保存経路のみ未確認。実害の結論は不変。

## 順序制約（くまモンPhase Bとの交差）

**WO-1（sw.js修正）はくまモンPhase B（`~/.claude/plans/8-1-atomic-cookie.md` B1〜B6）より先に完了させること。** 両者は public/sw.js の同一ファイルを触る。順序: WO-1でCACHEをv3へ → Phase B委譲時にv4へ。Phase B委譲プロンプトには「WO-1適用済みsw.jsが前提。SHELL構成は不変更、CACHEバージョンのみ更新」と明記する。

## 標準禁止事項（全WO共通）

不要な依存追加 / 無関係ファイル変更 / 既存仕様の無断変更 / テスト削除・無効化 / エラー握り潰し / 秘密情報埋め込み / 目的のない大規模リファクタ。加えて本リポジトリ固有: `docs/kumamon/**`・`docs/OPERATIONS.md`（未コミットのユーザー変更あり）・`handoff-kumamon-2026-08-01.md` に触らない。鮮度時刻（checkedAt等）を自動で進めない。

---

## WO-1: Service Worker キャッシュ汚染修正【P0・最優先】

- 推奨担当: debugger（sonnet）。理由: 仕様確定済みの修正+テスト追加で設計判断を伴わない
- 範囲: `public/sw.js` のナビゲーション経路修正 + 回帰テスト追加（tests/ 配下、既存テストの流儀に合わせる）
- 修正条件:
  1. `/` キーへの保存は「`url.pathname === "/"` かつ `response.ok`」の場合のみ
  2. `/status` はキャッシュ別キー保存または非保存（トップを汚染しないこと）
  3. ナビゲーション経路のfetchに3〜5秒タイムアウト（AbortController）→ 超過時 `caches.match("/")` へフォールバック
  4. `CACHE` を `kumamoto-action-v3` へ更新。`SHELL` 配列は不変更
- 完走条件（機械ゲート）: `npm run lint` と `npm test` 全PASS。新規テストは修正前コードでred・修正後greenを実証（red実証をログに残す）
- テスト観点（最低限）: ①/status取得後に `/` キーがトップの内容のまま ②非okレスポンスが `/` へ入らない ③EMERGENCY_MODE ON/OFF往復でキャッシュから旧カードが復活しない
- 触るなファイル: 標準禁止事項に加え `lib/disaster-data.ts` `lib/emergency-mode.ts` `worker/index.ts`

## WO-2: robots noindex化【P1・軽量】

- 推奨担当: メイン直接またはroutine-worker。1行変更
- 範囲: `app/layout.tsx:10` を `robots: { index: false, follow: false }` へ。本番停止ドリル（WO-5）完了までの暫定措置であることをコミットメッセージに記す
- 完走条件: `npm run lint` PASS + 該当行のgrep確認

## WO-3: セキュリティヘッダー付与【P1】

- 推奨担当: sonnet。**External Specification Preflight対象**（vinext 0.0.50のhandler応答へのヘッダー付与方法・Cloudflare Workersの仕様を当日の公式一次情報で確認してから着手。vinextは0.x系のためrelease notes必読）
- 範囲: `worker/index.ts` の応答に `X-Content-Type-Options: nosniff` / `Referrer-Policy` / `Permissions-Policy: geolocation=(), camera=(), microphone=()` / CSP `frame-ancestors` を付与。CSP本体はreport-onlyで開始（Next/vinextのインラインスクリプトと衝突しうるため一発本番適用しない）。`/status` の `Cache-Control` 適正化
- 完走条件: lint/test PASS + ローカル起動で応答ヘッダーをcurl実測（boundary evidenceは本番デプロイ後に別途）

## WO-4: GitHub Actions CI【P0】

- 推奨担当: sonnet
- 範囲: `.github/workflows/` に2本。①PR/push時: `npm ci` → `npm run lint` → `npm test` → `npm audit --omit=dev` → mobile typecheck → Web/mobile生成データ差分確認 ②定期実行: `npm run patrol:diff -- --json` → 差分ありならIssue作成（自動更新しない）、HTTP取得失敗は高優先度Issue、有効期限数時間前に未更新なら警告
- 制約: 鮮度時刻の自動更新は実装しない（検出と通知のみ。人間確認後更新の現方針を維持）
- 完走条件: workflowファイルのlint（actionlint等があれば）+ ローカルで同コマンド列の全PASS。**push・Actions実走はexternal_sendのため人間承認後**

## WO-5【人間のみ】: 本番緊急停止ドリル

production_change。AIは実行しない。Cloudflare本番で: 通常表示確認 → `EMERGENCY_MODE=true` → 別端末でカード消失確認 → 反映秒数記録 → 停止中に再デプロイ → 停止維持確認 → 解除 → 直前バージョンへrollback → 通常表示再確認。結果を `docs/qa/production-kill-switch-<date>/` に記録。前提: wrangler設定の所在確認（ルートに設定ファイル不在のため、`docs/OPERATIONS.md` 記載のコマンドは実行前に要検証）

## WO-6【人間判断・週次キュー】

- カード削減（19→6〜8枚、リスク別A〜D区分）: プロダクト判断
- LICENSE / SECURITY.md / CONTRIBUTING.md / Issueテンプレート / 問い合わせ経路（30秒で報告できる導線）
- HANDOFF.md の公開・非公開分離（ローカルパス・セッション詳細の除去）

## 受入（各WO共通）

サブエージェントの完了報告は信用せず、ディスク実在+検収者の機械ゲート再実走で受け入れる（lesson: subagent-completion-claims-need-disk-level-acceptance）。
