# Fresh-thread handoff（2026-07-31 更新／No-Go #2 の中核欠陥を修正・残りは未着手）

## Goal

熊本の被災者が「いま何に困っているか」から公式情報へ最短で到達できる読み取り専用アプリ（R1）を、
Web とネイティブで同じ品質・同じ内容で提供する。情報がないときに「利用可能」と推測せず、
鮮度と失効を正直に出すことを最優先の品質基準とする。

本セッションの Goal は **No-Go #2（訂正・停止体制）を Web 限定で潰す**こと。
ユーザー承認済みの決定: 主軸 = No-Go #2 / 停止スイッチの範囲 = **Web のみ**（ネイティブは対象外）。

**コード側の中核は完了。テストと文書は未着手。** セッション使用量 97% でコンテキストガードにより中断。

## Decisions（このセッションで確定。覆さないこと）

1. 停止フラグはサーバー側だけが読み、クライアントへは **props で渡す**
2. 環境変数名は **`EMERGENCY_MODE`**。`NEXT_PUBLIC_` は**絶対に付けない**（理由は下記）
3. **infra を足さない**（KV / D1 / R2 / Durable Objects なし）
4. ネイティブの停止経路（EAS Update / OTA）は今回対象外。ただし**ストア申請の必須前提条件**として文書へ明記する
5. `lib/disaster-data.ts` のカード値は触らない（No-Go #1 は別件。公式ページ再確認なしの期限延長は鮮度の捏造）

## 本セッションで発見した欠陥と、その修正（commit `80ec958`）

### 欠陥: 緊急停止スイッチがブラウザ側で効いていなかった［高］

前回 handoff には無かった。No-Go #2 は「再デプロイが要る（遅い）」だけでなく
**そもそも止まらない**という問題を含んでいた。

| 層 | 修正前の `NEXT_PUBLIC_EMERGENCY_MODE` の扱い | 結果 |
|---|---|---|
| rsc / ssr バンドル | `process.env` を実行時に読む | 縮退した初期HTMLを返す |
| client バンドル | `process.env` が丸ごと `{}` に置換され ``h={}.NEXT_PUBLIC_EMERGENCY_MODE===`true` `` | **常に false** |

`app/home-client.tsx` は `"use client"` なので、SSR で消えたカードが **hydration 後に復活**していた。
一方 `app/status/page.tsx` は Server Component（`"use client"` 無し）なので正しく動く。
つまり**運用者の `/status` だけ「緊急縮退中」と出て、利用者の画面にはカードが出続ける**。

### さらに: README が載せていた手順は「効かない」のではなく「有害」だった［高］

`README.md:129-137` の `NEXT_PUBLIC_EMERGENCY_MODE=true npm run build` は使ってはいけない。
`node_modules/vinext/dist/index.js:1772-1776` の `getNextPublicEnvDefines()` がビルドプロセスの
`NEXT_PUBLIC_*` を per-key define 化し、同 `:604` の `define: defines` で**全環境（rsc/ssr 含む）へ適用**する。
誰かが `NEXT_PUBLIC_EMERGENCY_MODE=false` を付けて建てると**サーバー側にも `false` が焼き付き、
以後どの環境変数を変えても永久に停止できなくなる**。だから変数名から接頭辞を外した。

### 実行時 env が Workers に届く前提条件（確認済み）［高］

`dist/server/wrangler.json` は `compatibility_flags:["nodejs_compat"]` / `compatibility_date:"2026-07-28"`。
wrangler の `isProcessEnvPopulated`（`nodejs_compat` かつ compat date ≥ `2025-04-01`）を満たすため、
**vars と secrets の両方が `process.env` へ載る** → 環境変数を変えるだけで再ビルド無しに反映できる。
compat date はプラグイン既定値に依存していただけなので `vite.config.ts` で明示固定した。

## 実測した boundary evidence［高］

`npm test` のビルド成果物に対し、**同一ビルドのまま環境変数だけを変えて**実測:

| 条件 | `/` の `action-section` | 緊急縮退モード | `/status` | RSCペイロード |
|---|---|---|---|---|
| OFF | 1 | 0 | 通常表示 | — |
| `EMERGENCY_MODE=true` | **0** | **1** | **緊急縮退中 ×2** | **`emergencyMode\":true`** |

- ON で「まずやること」も 0 件（カードごと消えている）
- `grep -rl 'EMERGENCY_MODE' dist/client/assets/` → **混入なし**
- RSC ペイロードに値が載る＝**hydration 後も止まる**（今回のバグの直接の修正証明）
- `npm run lint` PASS / `npm test` **13件 PASS** / `npm run gen:mobile-data` 後 `git status` 空

## Files（commit `80ec958`）

- `lib/emergency-mode.ts`（新規）— `EMERGENCY_MODE_ENV_KEY` と `readEmergencyMode()`。読み取りの唯一の実装。
  「NEXT_PUBLIC_ を付けるな」「client から呼ぶな」「トップレベルで確定させるな」をコメントで明記
- `app/page.tsx` — `<HomeClient emergencyMode={readEmergencyMode()} />`
- `app/status/page.tsx` — トップレベル `const` を関数内の `readEmergencyMode()` 呼び出しへ
- `app/home-client.tsx` — `process.env` 参照を削除し `HomeClientProps { emergencyMode: boolean }` で受ける
- `vite.config.ts` — `compatibility_date: "2026-07-28"` を明示（populate 条件の固定）

## Scope（残り。順番どおりに）

計画の全文: `/Users/tg/.claude/plans/users-tg-projects-app-development-save-adaptive-grove.md`

1. **`app/home-client.tsx`: 縮退中の死んだ操作子を隠す**（未着手・小）
   困りごとグリッド（`nav.need-grid`）と市町村・検索（`section.controls`）を `{!emergencyMode && ...}` で包む。
   `selectNeed` は `document.getElementById("actions")` へスクロールするが、縮退中は `#actions` が
   存在せず**押しても何も起きない**。災害時に無反応のボタンを残さない。
   119/110 の `emergency-strip` は条件の外なので残る（残すのが正しい）。
2. **`tests/emergency-mode.test.mjs`（新規）— 機械ゲート**（未着手）
   既存 `tests/rendered-html.test.mjs` の2パターン（`dist/server/index.js` をキャッシュ破棄 import して
   `worker.fetch` を直接呼ぶ／ソース文字列で契約を止める）にそのまま倣う。
   **ビルドは1回で足りる**（サーババンドルは `keepProcessEnv:true` で建つので実行時読み取りが残る。
   テスト内で `process.env.EMERGENCY_MODE` を差し替え、`finally` で復元）。
   **この方式自体がビルド時固定への退行を検出する** — 値が焼き付けば env を変えても出力が変わらず必ず落ちる。
   検証する6点:
   1. ON: 「緊急縮退モード」が出て `action-section` と「まずやること」が消える
   2. ON: **RSC ペイロードに `"emergencyMode":true` が載る**（本命）
   3. OFF（未設定 / `"false"`）: 通常表示へ戻りペイロードは `false`
   4. `/` と `/status` が同一判定
   5. `app/home-client.tsx` に `process.env` と `NEXT_PUBLIC_` が現れない（退行検出）
   6. `dist/client/assets/*.js` に `EMERGENCY_MODE` 混入なし／`dist/server/wrangler.json` が
      `nodejs_compat` かつ `compatibility_date >= "2025-04-01"`（populate 前提条件の機械固定）
   注: `tests/rendered-html.test.mjs` は通常表示前提なので、シェルに `EMERGENCY_MODE=true` が
   残っていると落ちる。これは望ましい挙動なので変更しない。
3. **`.gitignore` に `.dev.vars` を追加**（現状 `.env*` はあるが `.dev.vars` が無い）
4. **workerd 経路のローカル検証**（未実施・重要）
   ```bash
   printf 'EMERGENCY_MODE=true\n' > .dev.vars && npm run dev &
   curl -s localhost:3000/ | grep -o '緊急縮退モード'
   kill %1 && rm .dev.vars
   ```
   実測済みの証拠は Node の `process.env` 経路であり、**workerd が bindings から `process.env` を
   埋める鎖そのものは未通過**。`.dev.vars` → wrangler `getVarsForDev` → miniflare bindings →
   workerd populate は本番と同じ経路なので、これだけは通しておくこと。
   注意: `vinext dev` は**シェル env が効かない**（`CLOUDFLARE_INCLUDE_PROCESS_ENV` 既定 false）。`.dev.vars` を使う。
5. **ブラウザ目視**（未実施）: `EMERGENCY_MODE=true npm run start` で開き、(a) Console に hydration 警告が
   出ない (b) 読み込み直後に消えていたカードが数百ms後に**復活しない**
6. **`docs/OPERATIONS.md`（新規）**（未着手）— 章立ては計画ファイル参照。
   `[要記入]`（実在の人物・連絡先。**でっち上げ厳禁**）と `[提案]` を行単位で分離する凡例を冒頭に。
   1 位置づけ / 2 役割と連絡体制 / 3 停止のランブック / 4 訂正のランブック / 5 情報の鮮度運用 /
   6 公開判定チェックリスト / 7 UIへの反映
7. **`README.md` 更新**（未着手）
   - `:129-137`「## 緊急縮退」を**全面差し替え**（現行手順は有害。上記参照）
   - `:217-219` No-Go #2 / `:222-236` No-Go #4（ネイティブに停止経路が無い旨）
   - `:159`「Webテスト：8件成功」は実数と食い違い（現状13件、テスト追加後は増える）
   - `:243-253` リリース手順 / `:255-267` 主なファイル（`lib/emergency-mode.ts` と `docs/OPERATIONS.md`）
8. **`docs/RELEASE_AUDIT.md` 更新**（未着手）
   `:19` の「運用停止」行を `[低] 未達` → `[中]`、`:42-52` 公開停止条件 #3 の具体化、
   `:54-58` Rollback の差し替え、「## 停止の到達範囲」新設

### 停止の到達範囲（文書に必ずこの粒度で書く）

| 対象 | 届くか | 遅延 |
|---|---|---|
| オンライン利用者の次のページ遷移／再読込 | 届く | 次のナビゲーションまで（`public/sw.js` は navigation が network-first） |
| 開きっぱなしのタブ | 届かない | 利用者が再読込するまで（ポーリング未実装） |
| オフラインの PWA 利用者 | 届かない | 再接続してナビゲーションするまで |
| iOS / Android ネイティブ | **一切届かない** | ストア審査を通した新バージョン配布まで（数日〜） |

`isExpired`（`lib/disaster-data.ts:400-402`）による失効表示は端末時計で動くため、停止が届かない
利用者に対する唯一の自動的な劣化通知。**停止スイッチ ≠ 失効表示**として区別して書くこと。

### 本番運用の落とし穴（文書に必ず残す）［高］

`wrangler deploy` は既定で **vars を全消ししてから設定ファイルの vars を入れる**。
`dist/server/wrangler.json` の `vars` は `{}` なので、ダッシュボードで設定した plain text var は
**次のデプロイで消える**（＝停止中に誰かが文言修正をデプロイして案内が復活する事故）。
secrets はデプロイで消えず、かつ `process.env` に載る。

- 停止: `npx wrangler secret put EMERGENCY_MODE`（値 `true`）
- 解除: `npx wrangler secret delete EMERGENCY_MODE`
- 確認: `/status`（secret は読み出せないので、これが現在状態の唯一のシングルソース）
- plain var で運用するなら全デプロイで `--keep-vars` を固定

**変えてはいけないもの**: `nodejs_compat` を外さない／compat date を `2025-04-01` より前へ下げない／
変数名に `NEXT_PUBLIC_` を付けない／`vinext build --prerender-all` を使わない（`/` が静的化されると env が効かない）

## Non-Scope（触らない）

- `lib/disaster-data.ts` のカード値（No-Go #1）
- `apps/mobile/` のコード
- KV / D1 / R2 / Durable Objects の追加、依存追加
- deploy / push / Cloudflare の secret 設定 / ストア申請 / メール（すべて Human Approval Gate。remote 未設定）

## Verification（次セッションで最初に流すコマンド）

```bash
cd /Users/tg/projects/app_development/save_kumamoto
npm run lint && npm test                         # 現在 13件（テスト追加後は増える）
npm run gen:mobile-data && git status --short     # 差分が出たら正典と生成物がずれている

# 停止スイッチが同一ビルドのまま効くこと（実測済み。回帰確認用）
EMERGENCY_MODE=true node -e '
const u=new URL("./dist/server/index.js",`file://${process.cwd()}/`);
import(u.href).then(async m=>{
  const r=await m.default.fetch(new Request("http://localhost/",{headers:{accept:"text/html"}}),
    {ASSETS:{fetch:async()=>new Response("",{status:404})}},{waitUntil(){},passThroughOnException(){}});
  const h=await r.text();
  console.log("action-section:",(h.match(/class="action-section"/g)||[]).length);   // 0 を期待
  console.log("緊急縮退モード:",(h.match(/緊急縮退モード/g)||[]).length);            // 1 を期待
  console.log("payload:", (h.match(/emergencyMode[^,}]{0,20}/)||[])[0]);           // true を期待
});'
grep -rl 'EMERGENCY_MODE' dist/client/assets/ || echo 'OK: クライアントに混入なし'
```

## Acceptance

- Web の停止スイッチ: **コード側は `verified`（ローカル Node 経路の実測）**
- 判定は全体として **`implementation_complete_boundary_unverified` のまま**
- No-Go #2 を `verified` にするには次が要る:
  (a) 本番 Workers での実操作と反映時間の実測（デプロイ承認後）
  (b) 停止判断者・訂正担当者・問い合わせ先・対応可能時間の確定（`docs/OPERATIONS.md` の `[要記入]`）
  (c) オフライン利用者とネイティブへは届かないという範囲を運用者が受諾すること

## 未検証のまま残っていること

- **workerd 経路**（Scope 4）。実測は Node の `process.env` 経路のみ。workerd が bindings から
  `process.env` を埋める鎖は未通過。secret_text にも populate されるかは wrangler が vars と
  secrets を同列に扱うコードからの推論［中］
- **ブラウザでの hydration 目視**（Scope 5）。RSC ペイロードに値が載ることは確認したが、実ブラウザで
  カードが復活しないことの目視は未実施
- **本番 Workers での反映実時間**。デプロイ承認後にしか測れない
- `Cache-Control` 未設定の HTML がエッジ・中間プロキシで実際にキャッシュされるか［中］。
  必要なら `worker/index.ts` で HTML に `no-cache`（`no-store` は bfcache を殺すので不可）。今回は範囲外

## 前セッションから引き継いだ未決（手つかず）

1. **iOS**: `npx expo run:ios` が xcodebuild error 65。原因は `expo-modules-jsi` の `weak let`（Swift 6.3 / SE-0481）で、
   手元は Swift 6.2。Expo 公式 issue https://github.com/expo/expo/issues/46242 でメンテナが
   「SDK 56 requires Xcode 26.4+」と回答。**Xcode 26.4+ への更新が必須**（App Store 経由・ユーザー操作）。
   ディスクは確保済み（26GB → 45GB）。更新後は
   `rm -rf apps/mobile/node_modules/expo-modules-jsi/apple/Products` してから
   `cd apps/mobile && npx expo run:ios --device "iPhone 16"`。
   `nonisolated(unsafe) weak var` 回避策はメンテナが非推奨としているので採用しない。
2. **キャラクター／アイコン**（くまモンは No-Go 確定）。困りごとグリッドは現状 漢字1文字（報/水/食/避/薬/電/道/片）。
   119/110 の導線の隣にマスコットを置かない。
3. **タップ領域 44〜48dp の5件**（119/110/文字×3）。iOS HIG の44ptは満たすが Material の48dp未達。
4. **Android の残課題**: TalkBack の実発話、物理実機、60秒 tick の境界跨ぎ。
   注意: TalkBack を有効化したら必ず `adb shell settings delete secure enabled_accessibility_services` で戻す。

## 受領済みで未処理のニーズ観測（30件超）

2026-07-31 受領。大半は「給水車が今いるか」「冷房が動いているか」といった**現在の稼働状況**を求めており、
自治体・現場からの更新経路がなければ原理的に出せない。読み取り専用という現在の境界を変える判断を含む。

- **読み取り専用のまま着手できる**: 給水地点の用途と水質検査状態の強制表示（生活用水を飲料水と誤認させない）、
  配送可否の正規化（発送可/受取可/営業所のみ/停止）、支援制度の期限と手続き順序（支払い前に申請、修理前写真）
- **運用連携が前提で今は着手すべきでない**: 給水車のリアルタイム在否、避難所の暑熱ステータス、
  要配慮者の移送調整、災害ごみの搬出支援受付、支援者のQR認証

一般利用者の投稿だけで「利用可能」と判定しない、という現行の制約は全案で維持する。

## 実戦投入できるかの評価

**まだできない。** ただし本セッションで No-Go #2 の**技術的な中核は解けた**（停止が実際に効くようになった）。
残るのは運用側（停止判断者・問い合わせ先の確定）と、**No-Go #1（全14カードが期限切れ）**。
No-Go #1 はコードでは解決しない。中身が全部失効している以上「最短で公式情報へ到達させる」という
約束は今日の被災者に対して果たせていない。UI をこれ以上磨いても公開判定は動かない。
