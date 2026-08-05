# 日次巡回の自動化 — 現状実測と段階2設計（ドラフト）

作成: 2026-08-06 / 位置づけ: **確定版**（§4 の判断ポイント A/B/C は 2026-08-06 に運営者が決定済み。§4 末尾の決定記録を参照）/ 経緯: 2026-08-06 運営者要望「日次巡回を Claude Code / Codex 等で自動化できないか」。確度タグ（[高]=実測・文書で確認済み / [中]=複数の根拠から推定 / [低]=仮説・要検証）。

## 1. 現状の自動化レベル（実測）[高]

巡回は4工程に分解できる。**前半2工程はすでに自動化済み**である。

| 工程 | 内容 | 現状 |
|---|---|---|
| (a) 検知の起動 | 出典サイトとカード内容の機械照合を定期実行 | **自動**: `.github/workflows/patrol.yml`（WO-4）が6時間ごと（UTC 0/6/12/18時）に `npm run patrol:diff` を実行 |
| (b) 差分の解釈と文言書き換え | 差分・取得失敗を読み、`lib/disaster-data.ts` のカードを直す | 手動 |
| (c) 鮮度の宣言 | `PATROL_AT` / `PATROL_EXPIRES_AT` の前進、water-station の `availableWindows` / `expiresAt` の日付前進 | 手動 |
| (d) 配布 | `gen:mobile-data` → lint/test → commit → deploy → push | 手動（deploy/push は Human Approval Gate） |

検知の通知は GitHub Issue で行われる（label: `automated-patrol` + `patrol-diff` または `patrol-fetch-error`。既存 Issue があればコメント追記）。**カードデータの自動更新・自動 commit は workflow 内で明示的に禁止**されている。

### 実走証拠（2026-08-06 02:45 JST 実測）[高]

- `gh run list --workflow=patrol.yml` 直近10件: **すべて `schedule` トリガーで success**（2026-08-03 07:13Z 〜 2026-08-05 12:39Z、所要 34〜49秒）。cron の実発火は定刻から約35〜60分遅延（GitHub Actions の既知特性）
- Issue 起票・再検知コメントの動作確認: Issue #1（差分検知、8/1 起票）・#2（取得失敗、8/4 起票）に 8/5 21:40 JST の実行で再検知コメントが追記されている
- 作成時の初回実走は WO-4 で `workflow_dispatch` により確認済み（Issue #1 の自動作成）
- **2026-08-06 07:45 JST 追記**: push 済み main（sourceUrl 個別URL 42551 化済み）での初回スケジュール実行 run `31035426472`（2026-08-05T18:35:14Z = JST 03:35、schedule、success、40秒）は **Issue #1/#2 への新規コメントなし＝クリーン実行**（gh api で最新コメントが基準時刻 2026-08-05T12:40:3xZ のまま変化なしを実測）[高]。8/6 01:44 巡回での修正の独立確認が取れた

**handoff `2026-08-06-kumamoto-stop-verified-patrol-caught-up-all-pushed.md` の「段階案1（検知の自動化）」は、実装済みかつ稼働中だった。** 段階1は `verified` とする。

### 検知の自動化は日次巡回の代替ではない [高]

patrol.yml がやるのは**検知と通知だけ**である。`PATROL_AT` は「出典を人が（または承認された起案者が）確認した時刻の宣言」であり、cron の成功では前進しない。したがって cron が全 green でも、**毎日1回の巡回（工程 b〜d）を止めてよい理由にはならない**。24時間失効の安全弁は自動化と独立に維持する（自動化を失効延長の理由にしない）。

## 2. 2026-08-06 深夜の実測で見つかった運用ギャップ [高]

1. **OPERATIONS.md に自動検知の記載が無かった**: 運営者のランブックが patrol.yml と自動起票 Issue の存在・見方を説明していない → 本設計書と同時に OPERATIONS 5章へ追記した
2. **Issue はクリーン実行でも自動クローズされない**: workflow は再検知時にコメントを追記するが、差分が解消された実行では何もしない。修正済みの内容でも Issue が OPEN のまま滞留する（#1・#2 が該当。8/5 21:40 JST の再検知はいずれも push 前の旧 main との比較であり、8/6 01:44 の巡回・02:14 の push で修正済みの内容。**JST 03:35 のクリーン実行 run 31035426472 で修正済みを確認 [高]**。運営者決定（§4-C）に基づき 8/6 に根拠コメント付きで手動クローズ）
3. **waterworks の 404 が GitHub ランナーからも再現**（8/5 21:40 JST、旧URL `list.php` に HTTP 404）: ローカル2回 + 別ネットワーク・別UAの GH ランナー1回で再現したため、「UA・アクセス元起因ではなくサーバ側」の確度が上がった。なお 8/6 01:44 の巡回で sourceUrl は個別URL（42551）へ変更済みのため、次回実行から対象自体が変わる → **個別URLでの初回実行（JST 03:35 run 31035426472）は取得失敗の再検知なし [高]**

## 3. 段階2案 — 起案の自動化（採否未決）[低〜中]

差分ありの日だけ、LLM がカード編集案と `PATROL_AT` 前進を**ブランチ + PR** として起案する。

- **トリガー**: patrol.yml が差分 Issue を作成/再検知した時（Issue-driven）。差分0の日は起動しない
- **動作範囲**: カード文言は**出典引き写しに限定**（要約・推測での書き換えを禁止）。`gen:mobile-data` と lint/test をブランチ上で実行し、結果を PR 本文に添付
- **人間に残すもの**: PR レビュー = Gate。merge / deploy / push は従来どおり人間（production_change / external_send）
- **実行基盤の候補比較**（優先順は handoff の推奨を踏襲）:

| 基盤 | 利点 | 難点 |
|---|---|---|
| ① GitHub Actions cron + `claude -p` 等 | 追加ベンダー不要・Issue/PR と同一平面・public repo は無料枠 | **API キーを GH Secrets に置く**（credential 管理の拡大 = Gate 対象）。`claude -p` は expensive_api Gate |
| ② Cloudflare Cron Triggers | 既に Workers 運用中でスタック追加なし | 巡回ロジック（Node 前提の patrol-diff.mjs）の Worker への移植が必要。起案 LLM 呼び出しは結局 API キーが要る |
| ③ AWS EventBridge+Lambda / GCP Scheduler+Cloud Run | 汎用 | 新規アカウント・課金・credential 管理が増える。①②で不足する要件が出た時のみ |
| ④ 常駐ローカルマシン（Mac mini / Raspberry Pi の launchd/cron + `claude -p` 等） | API キー・認証が手元に留まる（GH Secrets への配置不要 = credential 拡大なし）。patrol-diff.mjs（Node）を移植なしで実行できる。ACOS の Resident Runtime 枠と整合 | 可用性が個人環境依存（電源・スリープ・回線断で止まる。ただし止まっても24時間失効で安全側に倒れる）。LLM 呼び出しは expensive_api Gate のまま。Raspberry Pi 上のローカルLLMは出典引き写し編集でも品質・検証実績が不足 [中] |

- **④の位置づけ（2026-08-06 運営者提案を受けて追記）**: 監視（検知）は①が稼働済みのため、④の追加ハードが検知に必要になることはない。④が意味を持つのは**工程(b)(c)の起案実行基盤**として。検知は① GH Actions のまま、起案だけ手元の Mac mini が Issue をポーリングして PR を作る折衷構成も可能 [低〜中]
- **実装前の必須 Preflight（未実施）**: GitHub Actions schedule の当日公式仕様（無効化条件・遅延特性・GITHUB_TOKEN で PR を作る際の制約）/ Claude Code scheduled agents・`claude -p` の当日公式 Docs（④の headless 常駐運用の可否・制約を含む）/ （②採用時）Cloudflare Cron Triggers。本設計書の基盤比較は記憶ベース [低〜中] であり、実装判断の根拠にはこの Preflight を通すこと

## 4. 運営者判断ポイント（2026-08-06 決定済み。決定記録は表の下）

| # | 判断 | トレードオフ |
|---|---|---|
| A | water-station を dated + `availableWindows` のまま維持するか、非dated へ移すか | 維持: 毎日デプロイが必須（日付前進のため）だが誤案内リスク最小。非dated化: 差分0の日はデプロイ不要になり自動化の効果が最大化するが、「今日の何時に使えるか」の精度が落ちる |
| B | 段階2（起案の自動化）を実装するか。するならどの基盤か | §3 の比較表。expensive_api（LLM 呼び出し）+ credential 管理拡大の Gate 承認が前提 |
| C | 滞留 Issue の扱い | (1) クリーン実行を確認して手動クローズ（今すぐ可能・external_send Gate）(2) workflow を改修しクリーン実行時に自動コメント+クローズ（自動化するが「閉じてよい」の判断まで機械に渡すことになる） |

### 決定記録（2026-08-06 運営者回答・AskUserQuestion）[高]

- **A: dated + `availableWindows` を維持**。誤案内リスク最小を優先。毎日の日付前進とデプロイは継続する（PATROL_AT の日次前進自体にデプロイが必要なため、非dated化しても省力効果は限定的 [中] という点も考慮）
- **B: 段階2は Preflight のみ先行**。§3 末尾の Preflight を実施して基盤比較（①〜④）を実測根拠へ更新してから、採否と基盤を再判断する。それまで実装・credential 配置・定常的な LLM 呼び出しはしない
- **C: 滞留 Issue #1/#2 は手動クローズ**（external_send はこの回答で承認済み）。クリーン実行 run `31035426472` を根拠コメントに記載して閉じる。自動クローズ機構は実装しない（「閉じてよい」の判断は人間に残す）

## 5. 不変条件 [高]

1. **deploy / push / merge は自動化しない**（ACOS 方針「hooks で自動 push/deploy/merge しない」+ 誤案内が人命側に倒れるこの repo の性質）
2. **24時間失効の安全弁は維持**する。自動化の停止・誤動作は「カードが安全側に失効する」方向にしか倒れないこと
3. **検知 cron が止まっても手動巡回の義務は消えない**（cron は検知のみで鮮度を宣言しない。§1）
