# 地域カバレッジ図（area-map）の実描画QA（2026-08-03）

`handoff-2026-08-02-area-map-qa.md` の消化。ディレクトリ名は**実測日**に合わせている
（handoff の記載は `android-2026-08-02` だが、実際に測ったのは 08-03）。

Expo Go を使わず `npx expo run:android --port 8082` のローカル開発ビルドで、
エミュレータ Pixel_8_API_35（API 35 / density 420 / 1080x2400）に実描画させて採取した。
前回QA `../android-2026-07-31/` と同条件。

計測は `apps/mobile/scripts/qa/ui.py`（要素検索・タップ・スクリーンショット）と
`tap_targets.py`（uiautomator の bounds を `wm density` で dp へ戻す）。
左辺の色は採取した PNG から Pillow で直接ピクセルを読み、`apps/mobile/src/theme.ts` の実装値と突き合わせた。

## 測った4観点

| 観点 | 結果 | 根拠 |
|---|---|---|
| タイルの折り返し | **PASS** | 標準・特大とも、宇土市の最長文が折り返してタイル内に収まる。隣タイルとの重なりなし |
| タップ領域 48dp | **PASS** | 7タイルすべて最小辺 **184.8dp × 83.4dp**（特大で 103.6〜125.3dp）。48dp の 1.7倍以上 |
| ダークモード | **PASS**（ただし下の「見つかったこと」1件） | 4 tone すべての左辺色を実描画から採取し、実装値と一致を確認 |
| 横スクロール | **PASS** | 全タイルの右端が **1038px**（画面幅 1080px）。横スワイプしても座標が 1px も動かない |

## 何が写っているか

| ファイル | 内容 |
|---|---|
| `01-標準-7タイルが2列で折り返す.png` | 2026-08-03 18:04 JST / light / アプリ内「標準」。熊本県全域が全幅、残り6タイルが2列。宇土市だけ破線ボーダー（tone `none`）で「この地域を名指しした案内はありません」が2行に収まる |
| `02-特大-宇土市の長文が2行でも重ならない.png` | 同条件でアプリ内「特大」。宇土市の行が伸び、同じ行の熊本市も揃って伸びる（flex の stretch）。文字の切れ・タイルの重なりなし |
| `03-ダークモード-期限切れの左辺が背景に埋もれない.png` | `adb shell cmd uimode night yes` の実切替。tone `expired` の赤い左辺が暗い面から立つ |
| `04-ダークモード-一部欠けの左辺を実描画で確認.png` | 日時を 2026-08-01 18:12 JST へ戻して tone `partial` を出した状態（dark）。熊本市＝未確認3件、氷川町＝期限切れ1件 |
| `05-標準-一部欠けの左辺がlightで薄い.png` | 同じ状態を light で採取。partial の左辺 `#d79f13` が白面の上で薄い（下記） |

## 実測値

### タイル寸法（density 2.625x）

| 条件 | 熊本県全域 | 2列のタイル | 右端 |
|---|---|---|---|
| 標準 | 996x219px = 379.4x83.4dp | 485x219px = 184.8x83.4dp | 1038px |
| 特大 | 996x272px = 379.4x103.6dp | 485x272〜329px = 184.8x103.6〜125.3dp | 1037px |

`tap_targets.py` の 48dp未満は、標準1件・特大0件・dark標準3件。**いずれも area-map のタイルではなく**、
ビューポート端で切れた別要素（キーワードチップ「避難所」、困りごとセル「移動・道路」「片付け・制度」）。
uiautomator の bounds は可視領域でクリップされるため、画面端に半分だけ出ている要素は実寸より小さく出る。

### 左辺の色（PNG から採取したピクセル値）

| tone | light 左辺 | dark 左辺 | 面（light / dark） |
|---|---|---|---|
| `expired` | `(189,56,44)` = `#bd382c` | `(217,88,74)` = `#d9584a` | `#eef2f5` / `#212d3f` |
| `partial` | `(215,159,19)` = `#d79f13` | `(168,127,26)` = `#a87f1a` | `#ffffff` / `#17202e` |
| `none` | 左辺色なし（破線ボーダーのみ） | 同左 | `#ffffff` / `#17202e` |
| `covered` | 左辺色なし | 同左 | `#ffffff` / `#17202e` |

4種すべて `theme.ts` の実装値と一致した。コントラスト比（WCAG 2.1 の非テキスト基準は 3:1）:

| | light | dark |
|---|---|---|
| `expired` の左辺 | **4.95:1** | **3.60:1** |
| `partial` の左辺 | **2.37:1** ← 基準未満 | **4.46:1** |

## 見つかったこと

1. **[中] light テーマの `partial` 左辺 `#d79f13` は白面に対して 2.37:1** で、WCAG 2.1 SC 1.4.11（非テキストのコントラスト 3:1）を下回る。dark 側（4.46:1）は満たす。
   **ただしこの図は色だけで区別させない設計**で（`apps/mobile/src/app/index.tsx:369-372` のコメント）、
   同じタイルに「未確認 3件」「期限切れ 1件」という文字が必ず併記される。だから左辺が見えなくても欠けは伝わる。
   情報の欠落ではなく、補助的な手がかりが弱いという話。
   **直していない。** `warnBorder` は native 7箇所・Web 11箇所（`app/globals.css`）で共有される横断トークンで、
   変えると警告表示すべてに波及する。area-map 単独で決められない。
2. **[低] 特大で「未確認」が「未確 / 認」に分割される**（熊本市タイル、`02-*.png`）。
   日本語の禁則としては許容範囲で、読めなくはない。折り返しの破綻ではない。

## この証拠でも言えないこと

- **物理実機**は未検証。実タッチの当たり、実ディスプレイのコントラスト、屋外の直射光下での左辺色の見え方はエミュレータでは代替できない。上の 2.37:1 が屋外で実際にどう見えるかは、この証拠からは言えない
- **TalkBack の実発話**は未検証。`accessibilityLabel`（`宇土市, この地域を名指しした案内はありません` など）が uiautomator の `content-desc` に載っていることは確認したが、読み上げ音声そのものは取得手段がない
- **iOS** は未検証（`expo-modules-jsi` が Swift 6.3 を要求し、手元は 6.2 で xcodebuild error 65。前回QAから継続）
- **04 / 05 は日時を戻した状態の描画**。エミュレータの時計を 2026-08-01 へ一時的に変えて `partial` / `covered` を出した。データそのものは同じで、`areaCoverage(now)` の判定が変わっただけ。測定後 `auto_time=1` で現在時刻へ復帰済み

## 観測時のデータ（`areaCoverage(now)` は実行時刻で変わる）

`apps/mobile/src/app/index.tsx:77` の `now` は 60 秒ごとに更新され、tone はその時刻で再判定される。
handoff に載っている「2026-08-01 12:00 JST 固定SSR」の値とは一致しない。

| 観測時刻 | 状態 |
|---|---|
| 2026-08-03 18:04 JST | 全19件が期限切れ（接続確認 8/1 11:25）。tone は `expired` と `none` の2種類だけ。図の下は「どの地域でも使える熊本県全域の案内は、いまはすべて期限切れです。」 |
| 2026-08-01 18:12 JST（時計を戻して再現） | 19件中1件が期限切れ。熊本市＝未確認3件（`partial`）、氷川町＝期限切れ1件（`partial`）、宇城市/八代市/その他/熊本県全域＝`covered`、宇土市＝`none`。図の下は「このほかに、どの地域でも使える熊本県全域の案内が6件あります。」 |

**宇土市の0件はどちらの時刻でも変わらない。** これがこの機能の本体で、
「名指しの案内がない地域」を空白にせず、破線のタイルとして図に残している。

## 再現手順

```bash
# 運営者がフォアグラウンドで起動する（バックグラウンドだと Metro が一緒に死ぬ）
cd apps/mobile && npx expo run:android --port 8082   # 8081 は別プロジェクトの Metro。使わない・止めない

cd apps/mobile
python3 scripts/qa/ui.py text                        # 実描画の確認
python3 scripts/qa/ui.py tap "文字の大きさ 特大"       # アプリ内の倍率
adb shell input swipe 540 1900 540 900 300           # 図まで縦スクロール
python3 scripts/qa/ui.py find "宇土市"                # bounds を px で採る
python3 scripts/qa/tap_targets.py "area-map 標準"     # dp へ戻して 48dp を判定
python3 scripts/qa/ui.py shot out.png
adb shell cmd uimode night yes                       # ダークモード実切替
```

`partial` / `covered` を出すには、エミュレータの時計を戻す（`adb root` は production build では通らず、
`date` コマンドも `Operation not permitted`。設定アプリの UI から変える）。

```bash
adb shell settings put global auto_time 0
adb shell am start -a android.settings.DATE_SETTINGS
python3 scripts/qa/ui.py tap "August 3, 2026"   # → 日付ピッカー → "01 August 2026" → "OK"
adb shell am force-stop jp.savekumamoto.imadousuru && adb shell am start -n jp.savekumamoto.imadousuru/.MainActivity
```

**終了時は必ず戻す。**

```bash
adb shell settings put global auto_time 1        # 時計を現在へ復帰
adb shell settings put system font_scale 1.0
adb shell cmd uimode night no
```

本QAの終了時点で `date` = 2026-08-03 18:15 JST / `font_scale` = 1.0 / `Night mode: no` / `auto_time` = 1 を実測で確認した。
