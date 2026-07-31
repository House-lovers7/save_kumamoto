# Android 実描画QA（2026-07-31）

Expo Go を使わず `npx expo run:android` のローカル開発ビルドで、
エミュレータ Pixel_8_API_35（API 35 / density 420）に実描画させて採取した証拠。

計測は `apps/mobile/scripts/qa/ui.py`（スクリーンショット・要素検索・タップ）と
`tap_targets.py`（uiautomator の bounds を `wm density` で dp へ戻す）を使用。

## 何が写っているか

| ファイル | 内容 |
|---|---|
| `01-before-…カード見出しの行が重なる.png` | 文字「特大」でカード見出しの2行が衝突。`fontSize` だけ倍率を掛け `lineHeight: 29` を固定していたため、行間比が 1.00 になっていた |
| `02-after-…行間を倍率に追従.png` | 修正後。同じ「特大」で行が分離し、断り書きと 119/110 も倍率に追従している |
| `03-before-…下部パネルの行が重なる.png` | 「通信が切れても、手順は残ります。」「あなたの居場所を集めません。」も同じ原因で衝突 |
| `04-before-…オフラインカードが標準サイズ.png` | ホームで「特大」を選んでいるのに `/offline-guides` が標準サイズで描画される。通信が切れたとき一番読む必要のある手順が読めない状態だった |
| `05-after-…特大が反映.png` | 修正後。設定を3画面で共有し、見出し・手順・警告すべてが拡大している |
| `06-ダークモード実切替.png` | `useColorScheme()` + `app.json: userInterfaceStyle: automatic` が実機で機能していること。`adb shell cmd uimode night yes` で切替 |
| `07-OS2.0×特大-…破綻しない.png` | OS のフォントスケール 2.0 × アプリ内 1.38 = 実効 2.76 倍。Android は OS 倍率を `fontSize` と `lineHeight` の両方へ掛けるため比率が保たれ、折り返して読める |

## この証拠でも言えないこと

- **物理実機**は未検証。実タッチ、実ディスプレイのコントラスト、低速回線はエミュレータでは代替できない
- **TalkBack の実発話**は未検証。起動とアクセシビリティフォーカスまでは確認したが、
  読み上げ文字列を取得する手段がない
- **iOS** は未検証（`expo-modules-jsi` の `weak let` を手元の Swift 6.2 が受け付けず、
  xcodebuild が error 65 で失敗。詳細は `HANDOFF.md`）

## 再現手順

```bash
"$ANDROID_HOME/emulator/emulator" -avd Pixel_8_API_35 -no-snapshot-save -no-boot-anim &
adb wait-for-device && adb shell getprop sys.boot_completed
cd apps/mobile && npx expo run:android          # --device は付けない

adb shell settings put system font_scale 2.0    # OS 側の倍率
python3 scripts/qa/ui.py tap "文字の大きさ 特大"  # アプリ内の倍率
python3 scripts/qa/ui.py shot out.png
python3 scripts/qa/tap_targets.py "条件ラベル"
adb shell cmd uimode night yes                  # ダークモード
```

終了時は `adb shell settings put system font_scale 1.0` と
`adb shell cmd uimode night no` で戻す。TalkBack を有効化した場合は
`adb shell settings delete secure enabled_accessibility_services` で消すこと
（`settings put ... ""` は失敗し、再起動時に読み上げが復活する）。
