# 緊急停止スイッチの本番実測（2026-08-06）

`docs/OPERATIONS.md` 第6章 #5（本番実操作と反映時間）・#6（停止中デプロイでの維持）・
#8（停止判断者本人の実行）を、**本番 Cloudflare Workers** の実境界証拠で閉じた記録。
ローカル・workerd での証拠は `docs/qa/emergency-mode-2026-07-31/` にあり、本記録はその本番側の対。

- 対象: `https://kumamoto-action-navigator-web.cokomo-gt.workers.dev`
- 開始時 Version: `fed0cf32-3235-48f9-be01-3236dfc37367`
- 操作はすべて**運営者本人**がターミナルで実行した（#8）。計測（HTTP GET のみ）は Claude が実行した
- 時刻はすべて 2026-08-06 JST。開始前に自Worker・熊本市・Cloudflare の HTTP `Date` を3点照合し、
  3サーバとも `16:20:20 GMT` で一致・ローカル時計との差1秒以内を確認してから計測した

## タイムライン（実測）

| 時刻 | 出来事 | 根拠 |
|---|---|---|
| 01:20:29 | ベースライン指紋採取（通常表示・43052B・有効期限切れ1） | `fp-03-baseline-before-stop-r2.json` |
| 01:20:40 | `/status` 1秒間隔ポーラー起動（state=off） | poller ログ |
| 01:23:23 | **失敗**: リポジトリ外（`~`）から `secret put` → `Required Worker name missing` | wrangler ログ（4.119.0 が新規インストールされた） |
| 01:24:23 | リポジトリルートで `echo true \| npx wrangler secret put EMERGENCY_MODE` 開始（wrangler 4.115.0） | wrangler ログ |
| 01:24:26 | secret put 完了（`Success! Uploaded secret EMERGENCY_MODE`） | wrangler ログ mtime |
| 01:24:30.5 | ポーラーが `/status`「**緊急縮退中**」への遷移を観測 | poller: `+229.8s state=on` |
| 01:25:18 | 停止後指紋採取（5927B・カード語0・119/110残存） | `fp-04-after-stop.json` |
| 01:26頃 | 運営者が put を再実行（同値の上書き。無害・変化なし） | 01:27:29 に縮退維持を確認 |
| 01:28前後 | **#6**: 停止中に同一ビルドを `npx vinext deploy` → Version `d65da2d7-…` | deploy 出力 |
| 01:28:23 | デプロイ後指紋 = 停止後指紋と**完全一致**（停止維持） | `fp-05-after-deploy-during-stop.json` |
| 01:34:00.3 | `npx wrangler secret delete EMERGENCY_MODE` 開始 | wrangler ログ |
| 01:34:02.4 | ポーラーが「**通常表示**」への復帰を観測 | poller: `+312.4s state=off` |
| 01:34:44 | 復帰後指紋 = ベースラインと**機械比較で差分0** | `fp-06-after-restore.json` |

## 反映時間（#5）

| 方向 | 実測 |
|---|---|
| 停止（secret put → 縮退表示） | コマンド開始から**約7秒**（完了からは約4秒。分解能は1秒ポーリング） |
| 復帰（secret delete → 通常表示） | コマンド開始から**約2秒** |

## 指紋の前後比較（`scripts/qa/fingerprint.mjs`）

| 計測項目 | ベースライン | 停止後 | 停止中デプロイ後 | 復帰後 |
|---|---|---|---|---|
| `/` バイト数 | 43052 | **5927** | 5927 | 43052 |
| `/status` | 通常表示 | **緊急縮退中** | 緊急縮退中 | 通常表示 |
| カード語（応急給水・無料入浴・り災証明・氷川町など） | 8/7/7/28 | **すべて0** | すべて0 | 8/7/7/28 |
| `action-section` / `need-grid` / `area-map` / `skip-link` | 1/17/8/1 | **0/0/0/0** | 0/0/0/0 | 1/17/8/1 |
| `emergency-strip` | 1 | **1（残存）** | 1 | 1 |
| `119` / `110` | 5/3 | **3/3（残存）** | 3/3 | 5/3 |

- 停止中も 119/110 の緊急連絡導線と `emergency-strip` は残る（設計どおり）
- `git status --porcelain` はデプロイ後も無変更（`wrangler.jsonc` の勝手生成なし。正典が
  ルートに置かれた f8ea7e3 以降の期待どおりの挙動）

## 運用上の発見（OPERATIONS 3.2 へ反映済み）

1. **`secret put` はリポジトリルートで実行する**。リポジトリ外から実行すると
   `Required Worker name missing` で失敗する（ルートの `wrangler.jsonc` が Worker 名を解決する）
2. リポジトリ外の `npx wrangler` は**別バージョンを新規インストールして動く**（4.119.0 が入った）。
   バージョン差の挙動は未検証なので、この経路を常用しない

## この証拠でも言えないこと

- **実ブラウザでの縮退表示の目視は未実施**。運営者スマホでの `/` 目視を依頼したが、報告の前に
  解除操作が実行された。本記録の「カード消滅」はサーバー応答の HTTP 指紋にもとづく
  （hydration 後 DOM の証拠はローカル実測 `docs/qa/emergency-mode-2026-07-31/` §3 のみ）
- 反映時間は**同一回線の1クライアントから1秒間隔で観測した値**。全エッジ・全利用者への
  到達分布は言えない
- 開きっぱなしのタブ・オフラインの PWA 利用者・ネイティブアプリに停止が届かないことは
  設計どおり残る（`docs/OPERATIONS.md` 3.4）

## 再現手順

```bash
# 事前: ベースライン指紋とポーラー（どちらも読み取りのみ）
node scripts/qa/fingerprint.mjs baseline-before-stop
node scripts/qa/poll-status.mjs on 900 &   # 「緊急縮退中」への遷移を秒つきで記録

# 停止（リポジトリルートで。運営者本人が実行する）
echo true | npx wrangler secret put EMERGENCY_MODE
node scripts/qa/fingerprint.mjs after-stop

# 停止中デプロイ（#6）
npx vinext deploy && git status --porcelain
node scripts/qa/fingerprint.mjs after-deploy-during-stop

# 解除（絶対に忘れない）
node scripts/qa/poll-status.mjs off 900 &
npx wrangler secret delete EMERGENCY_MODE
node scripts/qa/fingerprint.mjs after-restore
```

rollback: 解除は `secret delete` そのもの。Worker が壊れた場合は Cloudflare ダッシュボードから
直前 Version へ rollback する。
