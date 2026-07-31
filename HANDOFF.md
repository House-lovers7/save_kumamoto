# Fresh-thread handoff（2026-07-31 19:00 更新／No-Go #1 は再発・4カードが unavailable）

**再開方法**: 新セッションで `/resume-handoff /Users/tg/projects/app_development/save_kumamoto/HANDOFF.md`。
次の担当は実装・検証モデル（sonnet 想定）。設計判断は確定済みなので、上位モデルへ戻す必要はない。
着手前に必ず `git log --pretty='%h %ad %s' --date=iso -5` で HEAD が `417751e` 以降かを確認し、
先行完走している作業を二重実行しないこと。

**次セッション冒頭でやること**: 鮮度の毎日巡回。全カードの期限は **2026-08-01 18:30 JST** に切れる。
それまでに公式10URL（`docs/OPERATIONS.md` 第5章）を再確認し、`lib/disaster-data.ts` の
`PATROL_AT` / `PATROL_EXPIRES_AT` を更新して `npm run gen:mobile-data` → `npm test` → commit。
**再確認なしの期限延長は鮮度の捏造で禁止**。

## Goal

熊本の被災者が「いま何に困っているか」から公式情報へ最短で到達できる読み取り専用アプリ（R1）を、
Web とネイティブで同じ品質・同じ内容で提供する。情報がないときに「利用可能」と推測せず、
鮮度と失効を正直に出すことを最優先の品質基準とする。

**No-Go #2（訂正・停止体制）の Web 側は完了**（コード・回帰テスト・実測証拠・運用文書）。
**No-Go #1 は 2026-07-31 18:30 の巡回で再発**。判定を厳しくした結果、14カード中4カードで
公式の該当案内を確認できず `unavailable` とした。

## Decisions（確定済み。覆さないこと）

1. 停止フラグはサーバー側だけが読み、クライアントへは **props で渡す**
2. 環境変数名は **`EMERGENCY_MODE`**。`NEXT_PUBLIC_` は**絶対に付けない**
3. **infra を足さない**（KV / D1 / R2 / Durable Objects なし）
4. ネイティブの停止経路（EAS Update / OTA）は対象外。**ストア申請の必須前提条件**として文書化済み
5. 運用体制（2026-07-31 ユーザー確定）: **停止判断者・訂正担当者・問い合わせ対応は運営者1人が兼務** /
   窓口は **GitHub Issues** / 対応可能時間は **9:00〜21:00 JST ベストエフォート**
6. **巡回の判定ルール（2026-07-31 更新）**: 「リンクが生きているか」ではなく
   **「カードの steps に書いた行動がリンク先で実行できるか」**で判定する。
   実行できず代替も無ければ `sourceStatus: "unavailable"` にし、`unverified` に何が無いかを書く
7. 誤認防止の表示に書けるのは、**出典ページに実際に書かれている記載だけ**。区分を推測で作らない

## このセッション（2026-07-31 17:00〜19:00）で完了したこと

| commit | 内容 |
|---|---|
| `ea90d5d` | 導線が成立していない6カードの再選定・`unavailable` 化と、誤認防止の確認項目を追加 |
| `06e1e36` | 押せる要素9件をタップ領域48dpへ広げ、実測スクリプトで固定 |
| `417751e` | 設計書 `docs/DESIGN.md`（コンセプト／処理の流れ／画面／構成／経路／データ構造） |

### 巡回で判明した重大な欠陥［高］

**「リンク生存＋内容不変」の軽い確認では、導線の破綻を検出できなかった。**
水カードの手順「公式ページで開設中の給水所と実施時間を確認する」に従っても、
リンク先の県 防災推進課ページに給水情報は無かった。リンクは生きているので、
前セッションまでの確認方法では検出できない。14カード中6カードが該当していた。

| カード | 処置 |
|---|---|
| water | 熊本市「災害時における井戸水の提供について」へ再選定（72箇所の場所・時間、飲料用／生活用水の区別、容器の自己準備をすべて掲載） |
| elder-care | 県「介護保険サービスを利用したい被災者の皆様へ」へ再選定 |
| evidence | 集約ページからり災証明の本文ページへ寄せた |
| food-and-supplies / fuel / toilet / infant-care | **`unavailable`**。配布場所・給油・し尿処分・ミルク配布の公式案内をいずれも確認できず |

### 追加した誤認防止の表示

- **`verifyPoints`**: water の「飲料用／生活用水」（水質検査10項目が根拠）、
  elder-care の「被保険者証がないときに伝える4項目」
- **`irreversibleOrder`**: evidence の「片付けや修理の前に写真」「被災届出証明書は原則1か月以内」、
  support-systems の「支払い・契約の前に相談」「緊急修理は10日以内」
- **`unverified`**: `unavailable` の4カードに、何が確認できていないかを本文として表示

**配送可否の正規化（発送可/受取可/営業所のみ/停止）は実装していない。**
県・市の公式ページに該当する区分の記載を確認できなかったため。憶測で区分を作らない。

### 検証結果［高］

| 検証 | 結果 |
|---|---|
| `npm run lint` | PASS |
| `npm test` | **25件 PASS**（21件から +4件） |
| `npm run gen:mobile-data` 後の `git status` | 差分なし |
| タップ領域（390 / 360 / 320px 実測） | 基準未満 **0件**、横スクロールなし（修正前は9件未達） |
| `npm audit --omit=dev` | **0件** |
| `npx expo-doctor` | **20/20 PASS** |

追加した回帰ゲート4件: `unavailable` なら `unverified` 必須 / `verifyPoints` は選択肢2件以上と理由必須 /
water は飲料・生活用水の区別必須 / `irreversibleOrder` は2〜5件かつ60文字以内。
実HTMLにも出ていることを `tests/rendered-html.test.mjs` が検査する。

## Scope（残り）

### A. No-Go #1 を解消する（4カードが空いている）

`food-and-supplies` / `fuel` / `toilet` / `infant-care` の公式導線を見つける。
今回確認した範囲（県 防災推進課・県の令和8年熊本地震ページ・熊本市の集約ページ・
熊本市上下水道局）には無かった。次に当たる先の候補:

- **熊本市上下水道局**（`kumamoto-waterworks.jp`）は緊急情報を JS で後から読み込むため
  静的取得では中身が見えない。実ブラウザで開けば応急給水・下水の情報がある可能性［中］。
  ただし出典 allowlist 外ドメインなので、採用するなら `tests/data-contract.test.mjs` の
  許可ドメイン追加の是非を判断する必要がある
- **各市町村の個別ページ**（宇城市・宇土市・八代市・氷川町）は未調査
- 燃料は事業者情報のため、公式（県・市）に導線が無い可能性が高い［中］

### B. No-Go #2 を `verified` にする（Human Approval Gate の先）

`docs/OPERATIONS.md` 第6章のチェックリスト 5〜9 が未達。

1. **本番 Workers での実操作**（デプロイ承認後）
   - `npx wrangler secret put EMERGENCY_MODE`（値 `true`）
   - **別端末**で `/` からカードが消え `/status` が「緊急縮退中」になることを確認
   - **反映までの実時間を記録**する
   - 停止中に無害な変更をデプロイし、停止が維持されることを確認
   - `npx wrangler secret delete EMERGENCY_MODE` で解除
2. **問い合わせ窓口 URL の確定**。現在 **remote が未設定**で GitHub Issues が存在しない
3. **ネイティブに停止が届かないことの受諾**（運営者の明示的な同意）

### C. ネイティブのパリティ差分

`verifyPoints` / `irreversibleOrder` / `unverified` は生成物としてネイティブへ配られているが、
**`apps/mobile/src/app/index.tsx` に描画コードが無い**。Web だけが誤認防止表示を持っている。
Goal「Web とネイティブで同じ内容」に対する差分。`apps/mobile/` のコードは前セッションから
Non-Scope のままなので、着手には解除の判断が要る。

### D. その他（前セッションから継続）

1. **iOS**: `npx expo run:ios` が xcodebuild error 65。`expo-modules-jsi` の `weak let`
   （Swift 6.3 / SE-0481）で、手元は Swift 6.2。**Xcode 26.4+ への更新が必須**
   （App Store 経由・ユーザー操作）。ディスクは確保済み（26GB → 45GB）。
   更新後は `rm -rf apps/mobile/node_modules/expo-modules-jsi/apple/Products` してから
   `cd apps/mobile && npx expo run:ios --device "iPhone 16"`。
   `nonisolated(unsafe) weak var` 回避策はメンテナが非推奨なので採用しない
2. **キャラクター／アイコン**（くまモンは No-Go 確定）。困りごとグリッドは現状 漢字1文字。
   119/110 の導線の隣にマスコットを置かない
3. **Android の残課題**: TalkBack の実発話、物理実機、60秒 tick の境界跨ぎ。
   注意: TalkBack を有効化したら必ず `adb shell settings delete secure enabled_accessibility_services` で戻す
4. **初期転送量の再計測**。約101KB は 2026-07-30 の値で、以後 UI を追加している

## Non-Scope（触らない）

- `apps/mobile/` のコード（生成物 `src/data/actions.ts` の再生成は可）
- KV / D1 / R2 / Durable Objects の追加、依存の追加・更新
- deploy / push / remote 追加 / Cloudflare の secret 設定 / ストア申請 / メール（すべて Human Approval Gate）

## Verification（次セッションで最初に流すコマンド）

```bash
cd /Users/tg/projects/app_development/save_kumamoto
npm run lint && npm test                          # 25件 PASS
npm run gen:mobile-data && git status --short      # 差分が出たら正典と生成物がずれている
```

タップ領域と停止スイッチの実測（Chrome を headless で起動してから）:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --remote-debugging-port=9333 \
  --user-data-dir=/tmp/chrome-qa about:blank &
npm run build && npm run start -- --port 3123 &
node scripts/qa/tap-target-check.mjs 9333 http://localhost:3123/ 360   # 基準未満0件
node scripts/qa/hydration-check.mjs 9333 http://localhost:3123/        # 停止スイッチ
```

注: `curl` は hook でブロックされるため node の fetch を使う（ユーザー承認済みの代替手段）。
ポート3000は OrbStack が塞いでいるので別ポートを使う。

## 未検証のまま残っていること（推測で埋めない）

- **本番 Cloudflare Workers での反映実時間**。デプロイ承認後にしか測れない
- **停止中デプロイで停止が維持されるか**。`wrangler deploy` が vars を全消しし secrets は残す、
  というコードからの推論［高］だが本番未実施
- **実利用者への到達遅延**。開いたままのタブ・オフラインPWA・ネイティブへは届かない（設計上の既知の穴）
- `Cache-Control` 未設定の HTML がエッジ・中間プロキシで実際にキャッシュされるか［中］
- **熊本市上下水道局サイトの実内容**［中］。JS 読み込みのため静的取得では見えない

## 受領済みで未処理のニーズ観測（30件超）

2026-07-31 受領。大半は「給水車が今いるか」「冷房が動いているか」といった**現在の稼働状況**を求めており、
自治体・現場からの更新経路がなければ原理的に出せない。

- **実装済み**: 給水地点の用途と水質検査状態の強制表示（`verifyPoints`）、
  支援制度の期限と手続き順序（`irreversibleOrder`）
- **裏取りできず未実装**: 配送可否の正規化（公式に該当区分の記載が無い）
- **運用連携が前提で今は着手すべきでない**: 給水車のリアルタイム在否、避難所の暑熱ステータス、
  要配慮者の移送調整、災害ごみの搬出支援受付、支援者のQR認証

一般利用者の投稿だけで「利用可能」と判定しない、という現行の制約は全案で維持する。

## 実戦投入できるかの評価

**まだできない。** 判定は **`implementation_complete_boundary_unverified`** のまま。

止めているのは4つ。

1. **No-Go #1 が再発**（Scope A）。14カード中4カードが「公式の案内を確認できていません」表示
2. **本番境界**（Scope B）。デプロイ承認と問い合わせ窓口 URL の確定
3. **毎日巡回の継続**。24時間期限のため、巡回が止まった時点で全件が失効する
4. **ネイティブのパリティ差分**（Scope C）。誤認防止表示が Web にしかない

このほか README「公開前に残る課題」の現地評価（3〜5人）・ネイティブ実機・署名境界は未着手のまま。
