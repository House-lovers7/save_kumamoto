# Fresh-thread handoff（2026-07-31 更新／Android 実描画QA 完了・iOS はツールチェーンでブロック）

## Goal

熊本の被災者が「いま何に困っているか」から公式情報へ最短で到達できる読み取り専用アプリ（R1）を、
Web とネイティブで同じ品質・同じ内容で提供する。情報がないときに「利用可能」と推測せず、
鮮度と失効を正直に出すことを最優先の品質基準とする。

本セッションの Goal は No-Go #4（ネイティブ実機・署名境界）の突破。
**Android はエミュレータ相当まで達成。iOS は Xcode のバージョン不足で未達。**

## 前セッション handoff の誤りの訂正

前回の handoff は「Android のビルド完走とアプリ起動は未確認」で終わっていたが、
**ビルドは handoff が書かれた後に完走していた**。本セッション冒頭のログ確認で判明。

- `BUILD SUCCESSFUL in 6m 1s` / APK 生成 / インストール / Metro が 1403 modules をバンドル
- JDK 21 でコンパイル段階が落ちる懸念は空振り（Gradle が `~/.gradle/jdks/eclipse_adoptium-17` を自前調達）

つまり本セッションの実質的な出発点は「証拠採取」だった。再ビルドは不要だった。

## 本セッションで実測したこと（boundary evidence）[高]

すべて Android エミュレータ Pixel_8_API_35 / API 35 / density 420 の実描画。
証拠は `apps/mobile/scripts/qa/` のスクリプトで採取（スクリーンショットと dp 実測）。

| 項目 | 結果 |
|---|---|
| ネイティブ実描画（全画面） | PASS |
| 文字倍率 9通り（OS 1.0/1.3/2.0 × アプリ内 標準/大/特大、実効最大2.76倍） | 破綻2件を検出→修正済み |
| ダークモード実切替（`useColorScheme()` + `automatic`） | PASS |
| タップ領域（完全表示時） | 44dp未満 0件 / 44〜48dp 5件（Materialの48dp未達） |
| 119・110 → ダイヤラーに番号が入る（発信なし） | PASS |
| 外部リンクの確認ダイアログ（位置情報・Cookie の断り）→「やめる」で復帰 | PASS |
| 画面遷移 /offline-guides・/about | ヘッダー戻るはPASS、システムBACKで不具合検出→修正済み |
| 全14カード期限切れ時の stale シグナルと「まずやること」の残存 | PASS |
| `Platform.OS` → 「Android版 1.0.0」 | PASS |
| a11y ロール変換（radio→RadioButton+SELECTED、button→Button） | PASS |
| TalkBack 起動とアプリウィンドウへのアクセシビリティフォーカス | PASS |
| 機械ゲート（web lint / test 13件 / 生成物差分ゼロ / mobile typecheck / lint / export:all） | PASS |
| Expo Doctor | 20/20 |
| npm audit --omit=dev | web 0件 / mobile moderate 11件（すべてExpoビルドツール由来、前回と同じ） |

## 修正した不具合（すべて再ビルドして実描画で直ったことを確認）

1. **システムBACKでアプリが終了する**[重大]
   `app.json` の `predictiveBackGestureEnabled: true` が `android:enableOnBackInvokedCallback="true"`
   を生成しており、Android 公式ドキュメントの記述どおり `KEYCODE_BACK` による傍受が無効化されていた。
   /offline-guides と /about からBACKするとアプリごとランチャーへ抜けた。ヘッダーの戻る矢印は正常
   だったため経路で挙動が割れていた。既定（無効）へ戻し、**BACKでホームへ戻ることを実描画で確認済み**。
2. **「特大」でタイトルの行が重なる**[重大]
   `fontSize` だけ倍率を掛け `lineHeight` を固定値のままにしていた。`cardTitle` は
   21×1.38=28.98 に対し `lineHeight: 29` で行間比 1.00。`localTitle` 0.97 / `privacyTitle` 0.96 も同様。
   固定 `lineHeight` を倍率へ追従させ、**衝突が消えたことをスクリーンショットで確認済み**。
3. **文字サイズ設定が /offline-guides と /about に効かない**[重大]
   この2画面は `scale` を一切参照しておらず、ホームで特大にしても標準で描画されていた。
   `src/use-text-scale.ts` に設定の読み書きを集約して3画面で共有。**特大で表示されることを確認済み**。
4. 119/110・「期限切れ」タグ・件数・「公式サービスではありません」の断り書きも倍率に追従させた。

## handoff の想定が外れた点（記録しておく）

前回 handoff は「OS倍率とアプリ内倍率の**二重適用**」を最大の懸念[高]としていたが、
**実描画では破綻しなかった**。Android は OS のフォントスケールを `fontSize` と `lineHeight` の
両方に掛けるため比率が保たれる。実効2.76倍でも折り返して読める。

したがって `maxFontSizeMultiplier` による上限は入れていない。低視力の利用者から拡大手段を
奪う方が害が大きい。実際の破綻は「アプリ内倍率だけが `fontSize` に掛かる」ことによる行間比の崩れだった。

## 未検証のまま残っていること

- **TalkBack の実発話**。TalkBack の起動とアクセシビリティフォーカスまでは確認したが、
  読み上げ文字列を取得する手段がない。`uiautomator dump` は「重要でないビュー」も含む可能性があり、
  TalkBack の読み上げ対象と同一とは言えない。したがって
  **「Pressable の子テキストが二重に読まれる」という指摘自体が未確認**。
  対策として `importantForAccessibility="no-hide-descendants"`（RN公式が「ビューとその子を
  支援技術から無視させる」と明記する値）を入れたが、**効果は未検証**。
  なお最初に入れた `"no"` は公式仕様上「イベントを発火しない」だけでツリーからは消えないため誤りだった。
- **物理実機**。実タッチ、実ディスプレイのコントラスト、実機ジェスチャ、低速回線。
- **60秒 tick**（`index.tsx:90`）。全カードが既に期限切れで境界をまたげず、素直に観測できなかった。
- **iOS 全般**（下記のブロッカー）。

## iOS のブロッカー（本セッション最大の未達）

`npx expo run:ios --device "iPhone SE (3rd generation)"` が **xcodebuild error code 65** で失敗。
CocoaPods の導入（`brew install cocoapods` → 1.17.0）と `pod install` は成功しており、
失敗はその先のコンパイル段階。

- 失敗箇所は **`node_modules/expo-modules-jsi@57.0.4` の Swift ソース 12ファイル・15エラー**。
  アプリのコードではない。すべて `'weak' must be a mutable variable, because it may change at runtime`
- 原因[高]: `weak let` は **Swift 6.3** で入った機能（SE-0481）。手元は **Swift 6.2** なので
  構文として存在しない。最小再現で確認済み: `swiftc -swift-version 5` と `-swift-version 6` の
  **両方**で同じエラーが出る。つまり言語モードの設定問題ではなく、**ツールチェーン不足**。
- **同一事象の Expo 公式 issue が存在する**: https://github.com/expo/expo/issues/46242
  「[expo-modules-jsi] Build fails on Xcode 26 / Swift 6.2 (weak let + Sendable mutable property)」。
  メンテナ（tsapeta）の回答は **「SDK 56 requires Xcode 26.4+ (Swift 6.3), per the upgrade guide」**。
  本プロジェクトは SDK 57 なので同等以上が必要。**バグではなくバージョン不整合**という整理。
- **必要な対応: Xcode を 26.4 以上へ更新する**。手元は Xcode 26.0.1 (Build 17A400) / Swift 6.2。
  更新後は `rm -rf node_modules/expo-modules-jsi/apple/Products` でキャッシュ済み xcframework を
  消してから再ビルドすること（メンテナ指示）。
- `nonisolated(unsafe) weak var` を付ける回避策は issue 内で提案されているが、
  **メンテナが「CIで壊れる可能性がある」として非推奨**としている。採用しない。
- `node_modules` を書き換える回避はしていない（原本を汚す・次回 install で消えるため）
- 参考: SE-0481 https://github.com/swiftlang/swift-evolution/blob/main/proposals/0481-weak-let.md

## Files（本セッションで触ったもの）

commit 済み（`ab372e3` / `36781c7` / `ae1c8e6`）:

- `apps/mobile/app.json` — `predictiveBackGestureEnabled` を削除
- `apps/mobile/src/use-text-scale.ts`（新規）— 文字サイズ設定を3画面で共有するフック
- `apps/mobile/src/app/index.tsx` — `createStyles(palette, scale)` 化して行間を倍率追従、
  安全上重要な文字も追従、`importantForAccessibility="no-hide-descendants"` 付与
- `apps/mobile/src/app/offline-guides.tsx` / `about.tsx` — 倍率を反映
- `apps/mobile/AGENTS.md` — v55 → SDK 57 の齟齬を修正し、CNG と実描画QAの手順を追記
- `README.md` — No-Go #4 を実測結果へ更新（エミュレータ検証済みと実機未検証を分けて記載）

触っていない（意図的）:

- `lib/disaster-data.ts` の値（公式ページ再確認なしの期限延長は鮮度の捏造。No-Go #1 は別件）
- `apps/mobile/android/` `apps/mobile/ios/`（生成物。`.gitignore` 済み。git はクリーン）
- `node_modules/`（iOS のブロッカーを回避するための改変はしない）

## 証拠の置き場所

スクリーンショットと計測結果:
`/private/tmp/claude-501/-Users-tg-projects-app-development-save-kumamoto/e7b5f61a-5281-4857-8f45-e8f8e2c364bd/scratchpad/`

- `shots/` — 文字倍率9通り × 上部/カード部、ダークモード、修正前後の比較
- `texts/` — 各条件の画面テキスト
- `android-run.log` / `android-run2.log` / `ios-run.log` — ビルドログ
- **セッション終了で消える可能性がある。残す必要があれば `docs/` へ移すこと。**

## 未決（次セッション冒頭でユーザーへ確認）

1. **iOS を続けるなら Xcode 26.4+ への更新が必須**（上記のとおり公式に確定）
   - 更新は App Store 経由でユーザー操作が必要。**ディスクは確保済み（下記）**
   - 更新後の手順:
     ```bash
     rm -rf apps/mobile/node_modules/expo-modules-jsi/apple/Products   # メンテナ指示
     cd apps/mobile && npx expo run:ios --device "iPhone 16"           # iOS 26.0 系のみ残存
     ```
   - iPhone SE (3rd gen) は iOS 18.x 側にしか無かったため削除済み。小画面で試すなら
     Xcode から iOS 26.0 の SE 系デバイスを新規作成すること

### 本セッションで実施したディスク確保（ユーザー承認済み）

**26GB → 45GB（コンテナ実値 48.2GB）まで回復。** 内訳:

- `~/Library/Developer/Xcode/DerivedData` 3.8GB 削除（純粋なビルドキャッシュ）
- `apps/mobile/ios` 1.2GB 削除（`prebuild` で再生成できる生成物。`.gitignore` 済み）
- **iOS 18.0 / 18.1 / 18.2 のシミュレータ 34台を削除**（`~/.../CoreSimulator/Devices` 48GB → 21GB）。
  iOS 26.0 の 11台、watchOS 15台、visionOS 3台は残した
- APFS の解放は非同期で、`df` に反映されるまで数分かかった（削除直後は +1GB しか見えなかった）

未実行（さらに要るとき用）: 使われなくなった **iOS 18.0/18.1/18.2 のランタイム本体**
（`xcrun simctl runtime delete <UDID>`。Disk Images 合計 67.8GB のうちの3つ）。
再取得は1本あたり数GBのダウンロードになるため、必要になるまで残している。
`~/.gradle` 6.1GB と `~/.npm` 3.7GB も未削除。
2. **キャラクター／アイコン**（前々回からの持ち越し。くまモンは No-Go 確定）
   - 代替案1（推奨）: 困りごとグリッドに絵記号。ただし現状すでに漢字1文字
     （報/水/食/避/薬/電/道/片、`index.tsx:49-58`）が入っており、これを絵記号へ置き換える判断になる
   - 代替案2: オリジナルの控えめなアプリアイコン（ストア申請時にはどのみち要る）
   - 制約: 119/110 の導線の隣にマスコットを置かない
3. **タップ領域 44〜48dp の5件**（119/110/文字×3）。iOS HIG の44ptは満たすが
   Material の48dpには未達。上げるとレイアウトが変わるので未着手。

## Verification（次セッションで最初に流すコマンド）

```bash
cd /Users/tg/projects/app_development/save_kumamoto
npm run lint && npm test                        # 13件
npm run gen:mobile-data && git status --short    # 差分が出たら正典と生成物がずれている

cd apps/mobile
npm run typecheck && npm run lint && npm run export:all
npx expo-doctor                                  # 20/20
```

Android の実描画を再開する場合:

```bash
"$ANDROID_HOME/emulator/emulator" -avd Pixel_8_API_35 -no-snapshot-save -no-boot-anim &
adb wait-for-device && adb shell getprop sys.boot_completed
cd apps/mobile && npx expo run:android           # --device は付けない
python3 scripts/qa/ui.py shot out.png
python3 scripts/qa/tap_targets.py "ラベル"
```

**注意**: TalkBack を有効化したら必ず
`adb shell settings delete secure enabled_accessibility_services` で戻すこと。
`settings put ... ""` は `Bad arguments` で失敗し、エミュレータ再起動時に TalkBack が復活して
音声を読み上げ続ける（本セッションで実際に起きた）。

## Acceptance

判定: **Android はエミュレータ相当まで `verified`、iOS と物理実機は `boundary_unverified`。**

No-Go #4 は消えていない。エミュレータで採れた証拠で全部消したことにしない。
deploy / push / ストア申請 / メールはユーザー明示承認後のみ。remote 未設定のため push 先は存在しない。
