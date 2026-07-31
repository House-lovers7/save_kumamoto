# Fresh-thread handoff（2026-07-31 更新／No-Go #2 の Web 側は完了・残りは本番境界と No-Go #1）

**再開方法**: 新セッションで `/resume-handoff /Users/tg/projects/app_development/save_kumamoto/HANDOFF.md`。
次の担当は実装・検証モデル（sonnet 想定）。設計判断は確定済みなので、上位モデルへ戻す必要はない。
着手前に必ず `git log --pretty='%h %ad %s' --date=iso -5` で HEAD が `cf93954` 以降かを確認し、
先行完走している作業を二重実行しないこと。

**最初にやること**: 下の「Scope（残り）」の **B（No-Go #1・medical カードの医療導線再選定）** から。A は Human Approval Gate の先にある。

## Goal

熊本の被災者が「いま何に困っているか」から公式情報へ最短で到達できる読み取り専用アプリ（R1）を、
Web とネイティブで同じ品質・同じ内容で提供する。情報がないときに「利用可能」と推測せず、
鮮度と失効を正直に出すことを最優先の品質基準とする。

**No-Go #2（訂正・停止体制）の Web 側は、コード・回帰テスト・実測証拠・運用文書まで完了した。**
残るのは本番 Workers での実操作（デプロイ承認が要る）と、**No-Go #1（全14カードが期限切れ）**。

## Decisions（確定済み。覆さないこと）

1. 停止フラグはサーバー側だけが読み、クライアントへは **props で渡す**
2. 環境変数名は **`EMERGENCY_MODE`**。`NEXT_PUBLIC_` は**絶対に付けない**
3. **infra を足さない**（KV / D1 / R2 / Durable Objects なし）
4. ネイティブの停止経路（EAS Update / OTA）は対象外。**ストア申請の必須前提条件**として文書化済み
5. `lib/disaster-data.ts` のカード値は触らない（No-Go #1 は別件。再確認なしの期限延長は鮮度の捏造）
6. 運用体制（2026-07-31 ユーザー確定）: **停止判断者・訂正担当者・問い合わせ対応は運営者1人が兼務** /
   窓口は **GitHub Issues** / 対応可能時間は **9:00〜21:00 JST ベストエフォート**

## このセッションで完了したこと

| commit | 内容 |
|---|---|
| `80ec958` | 停止スイッチがブラウザ側で効いていなかった欠陥の修正（前セッション） |
| `b19b798` | 回帰ゲート `tests/emergency-mode.test.mjs`（8件）＋縮退中の死んだ操作子を非表示 |
| `348074c` | 実測証拠 `docs/qa/emergency-mode-2026-07-31/` ＋再現用 `scripts/qa/hydration-check.mjs` |
| `b35aa43` | `docs/OPERATIONS.md`（訂正・停止の運用手順） |
| `c6b5985` | `README.md` と `docs/RELEASE_AUDIT.md` の更新 |

### 直した欠陥［高］

1. **停止スイッチがブラウザ側で効いていなかった。** クライアントバンドルでは `process.env` が `{}` に
   置換されるため、`"use client"` の中で読んでいたフラグは常に false。SSR の初期HTMLだけ縮退し、
   **hydration 後にカードが復活**していた。Server Component の `/status` だけが正しく動くので、
   運用者は止めたつもりで利用者には案内が出続けるという最悪の食い違いだった
2. **README の旧手順は有害だった。** `NEXT_PUBLIC_*` は vinext がビルド時に rsc/ssr を含む全環境へ
   define する。`false` を付けてビルドするとサーバー側にも焼き付き、以後どの環境変数でも止まらなくなる
3. **縮退中に無反応の操作子が残っていた。** 困りごとグリッド・市町村/検索・スキップリンクは
   行き先の `#actions` ごと消えているため、押しても何も起きなかった

### 実測した boundary evidence［高］

`docs/qa/emergency-mode-2026-07-31/README.md` に全数値。同一ビルドのまま環境変数だけを変えて計測。

| 経路 | 結果 |
|---|---|
| Node 本番サーバ | ON で `action-section` / `need-grid` / `controls` / `skip-link` すべて 0、「緊急縮退モード」1、`tel:119`/`tel:110` は残る、RSC ペイロード `emergencyMode=true`、`/status` 緊急縮退中 |
| **workerd（miniflare）** | `.dev.vars` 経由で同じ結果。起動ログに `Using secrets defined in .dev.vars` → **secret でも `process.env` に載ることを確認**（従来は推論［中］だった） |
| **実ブラウザ hydration 後 DOM** | `reactHydrated: true` かつ SW 登録済みの状態で `.action-card` **0件**（対照の通常表示では **14件**検出）。console / log / exception **0件** |
| クライアントバンドル | `EMERGENCY_MODE` の混入なし |

### 回帰ゲートが本物であることの実証［高］

`lib/emergency-mode.ts` をトップレベル `const` キャプチャへ変異させると、ソース検査だけでなく
**実行時の往復テストを含む5件**が落ちる（変異は `git checkout` で復元済み）。
テストは worker モジュールを1回だけ import して使い回し、その間に env を差し替える設計。
キャッシュ破棄 import にすると、この退行を検出できなくなるので変えないこと。

### 検証結果

`npm run lint` PASS / `npm test` **21件 PASS**（13件から +8件）/
`npm run gen:mobile-data` 後の `git status` 差分なし。

## Scope（残り）

### A. No-Go #2 を `verified` にする（Human Approval Gate の先）

`docs/OPERATIONS.md` 第6章のチェックリスト 5〜9 が未達。

1. **本番 Workers での実操作**（デプロイ承認後）
   - `npx wrangler secret put EMERGENCY_MODE`（値 `true`）
   - **別端末**で `/` からカードが消え `/status` が「緊急縮退中」になることを確認
   - **反映までの実時間を記録**する
   - 停止中に無害な変更をデプロイし、停止が維持されることを確認（secrets はデプロイで消えない前提の実地確認）
   - `npx wrangler secret delete EMERGENCY_MODE` で解除
2. **問い合わせ窓口 URL の確定**。現在 **remote が未設定**で GitHub Issues が存在しない。
   `docs/OPERATIONS.md` の `[要記入]` を埋める
3. **ネイティブに停止が届かないことの受諾**（運営者の明示的な同意）

### B. No-Go #1（残りは medical カードの導線再選定と毎日巡回の継続）

- 2026-07-31 15:01/15:09 JST に公式6URLを WebFetch で再確認し、13/14カードの鮮度を更新済み
  （`lib/disaster-data.ts` の `contentTimes`。`checkedAt`/`expiresAt` を更新、期限は確認から**24時間**へ変更）
- **medical カード1件**（出典: 熊本県トップページ）のみ、緊急災害用ページへ差し替わっており
  医療導線を確認できなかったため未更新（`staleMedicalTimes` のまま、失効表示を維持）。
  **残課題**: 県の医療情報への正しい導線の再選定（差し替え後のページ構成を確認し、
  医療情報に到達できる新しい `sourceUrl` を選び直す）
- 期限を24時間へ変更したのは 2026-07-31 ユーザー確定（`docs/OPERATIONS.md` 第5章「採用」参照）。
  **24時間期限のため、毎日1回（9:00〜21:00 JST内）の再確認巡回をしないと13カードも再び全件失効する**
- 鮮度運用の論点（カテゴリ単位の個別期限 / `checkedAt` だけ更新する軽い確認ルーチン /
  巡回頻度と期限の釣り合い）は `docs/OPERATIONS.md` 第5章に整理済み（提案1＋2を採用）

### C. その他（前セッションから継続）

1. **iOS**: `npx expo run:ios` が xcodebuild error 65。原因は `expo-modules-jsi` の `weak let`
   （Swift 6.3 / SE-0481）で、手元は Swift 6.2。Expo 公式 issue
   https://github.com/expo/expo/issues/46242 でメンテナが「SDK 56 requires Xcode 26.4+」と回答。
   **Xcode 26.4+ への更新が必須**（App Store 経由・ユーザー操作）。ディスクは確保済み（26GB → 45GB）。
   更新後は `rm -rf apps/mobile/node_modules/expo-modules-jsi/apple/Products` してから
   `cd apps/mobile && npx expo run:ios --device "iPhone 16"`。
   `nonisolated(unsafe) weak var` 回避策はメンテナが非推奨としているので採用しない
2. **キャラクター／アイコン**（くまモンは No-Go 確定）。困りごとグリッドは現状 漢字1文字（報/水/食/避/薬/電/道/片）。
   119/110 の導線の隣にマスコットを置かない
3. **タップ領域 44〜48dp の5件**（119/110/文字×3）。iOS HIG の44ptは満たすが Material の48dp未達
4. **Android の残課題**: TalkBack の実発話、物理実機、60秒 tick の境界跨ぎ。
   注意: TalkBack を有効化したら必ず `adb shell settings delete secure enabled_accessibility_services` で戻す
5. **Expo Doctor / `npm audit --omit=dev`** を UI/UX 反映後に再実行していない

## Non-Scope（触らない）

- `lib/disaster-data.ts` のカード値（No-Go #1 として別途扱う）
- `apps/mobile/` のコード
- KV / D1 / R2 / Durable Objects の追加、依存追加
- deploy / push / remote 追加 / Cloudflare の secret 設定 / ストア申請 / メール（すべて Human Approval Gate）

## Verification（次セッションで最初に流すコマンド）

```bash
cd /Users/tg/projects/app_development/save_kumamoto
npm run lint && npm test                          # 21件 PASS
npm run gen:mobile-data && git status --short      # 差分が出たら正典と生成物がずれている
```

停止スイッチの手動確認（ポート3000は OrbStack が塞いでいたので別ポートを使う）:

```bash
npm run build
EMERGENCY_MODE=true npm run start -- --port 3123 &
node -e 'fetch("http://localhost:3123/").then(r=>r.text()).then(h=>{
  console.log("action-section:", (h.match(/class="action-section"/g)||[]).length);   // 0
  console.log("緊急縮退モード:", (h.match(/緊急縮退モード/g)||[]).length);              // 1
  console.log("payload:", (h.match(/emergencyMode[^,}]{0,10}/)||[])[0]);            // true
})'
```

注: `curl` は hook でブロックされるため node の fetch を使う（ユーザー承認済みの代替手段）。
実ブラウザでの hydration 確認は `scripts/qa/hydration-check.mjs`（使い方はファイル冒頭）。

## 未検証のまま残っていること（推測で埋めない）

- **本番 Cloudflare Workers での反映実時間**。デプロイ承認後にしか測れない
- **停止中デプロイで停止が維持されるか**。`wrangler deploy` が vars を全消しし secrets は残す、
  というコードからの推論［高］だが本番未実施
- **実利用者への到達遅延**。開いたままのタブ・オフラインPWA・ネイティブへは届かない（設計上の既知の穴）
- `Cache-Control` 未設定の HTML がエッジ・中間プロキシで実際にキャッシュされるか［中］。
  必要なら `worker/index.ts` で HTML に `no-cache`（`no-store` は bfcache を殺すので不可）。今回は範囲外

## 受領済みで未処理のニーズ観測（30件超）

2026-07-31 受領。大半は「給水車が今いるか」「冷房が動いているか」といった**現在の稼働状況**を求めており、
自治体・現場からの更新経路がなければ原理的に出せない。読み取り専用という現在の境界を変える判断を含む。

- **読み取り専用のまま着手できる**: 給水地点の用途と水質検査状態の強制表示（生活用水を飲料水と誤認させない）、
  配送可否の正規化（発送可/受取可/営業所のみ/停止）、支援制度の期限と手続き順序（支払い前に申請、修理前写真）
- **運用連携が前提で今は着手すべきでない**: 給水車のリアルタイム在否、避難所の暑熱ステータス、
  要配慮者の移送調整、災害ごみの搬出支援受付、支援者のQR認証

一般利用者の投稿だけで「利用可能」と判定しない、という現行の制約は全案で維持する。

## 実戦投入できるかの評価

**まだできない。** ただし No-Go #2 の Web 側は、技術・運用文書の両方が揃った。
判定は **`implementation_complete_boundary_unverified`** のまま（本番境界が未通過）。

止めているのは、いま2つだけ。

1. **No-Go #1**: 全14カードが期限切れ。中身が全部失効している以上、「最短で公式情報へ到達させる」
   という約束は今日の被災者に対して果たせていない。**UI をこれ以上磨いても公開判定は動かない**
2. **本番境界**: デプロイ承認と、問い合わせ窓口 URL の確定
