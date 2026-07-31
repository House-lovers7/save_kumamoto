# Fresh-thread handoff（2026-07-31 更新／Android ネイティブ実機相当検証の途中）

## Goal

熊本の被災者が「いま何に困っているか」から公式情報へ最短で到達できる読み取り専用アプリ（R1）を、
Web とネイティブで同じ品質・同じ内容で提供する。情報がないときに「利用可能」と推測せず、
鮮度と失効を正直に出すことを最優先の品質基準とする。

本セッションのGoalは **No-Go #4（ネイティブ実機・署名境界）の突破** ＝ 前セッションで
Expo Go 57.0.5 の取得が8%停滞して諦めた経路を捨て、`expo run:android` のローカル
development build でエミュレータ実描画の boundary evidence を採ること。**未完了**。

## 現状（このセッションで実測したことだけ）

UI/UX 改修は Web・ネイティブとも反映済みで、機械ゲートは全緑。
Android のローカルビルドは **成立する道筋まで確認できたが、ビルド完了とアプリ起動は未確認**。

### 実測できたこと [高]

1. **Phase 0 の機械ゲート全緑**（handoff の記述は今も真）
   - Web: `npm run lint` OK / `npm test` 13件 PASS / `npm run gen:mobile-data` 後の差分ゼロ
   - Mobile: `npm run typecheck` OK / `npm run lint` OK / `export:all` OK（iOS 2.4MB, Android 2.7MB）
2. **`npx expo prebuild --platform android --no-install` 成功** → `apps/mobile/android/` 生成。
   `.gitignore` に `/android` `/ios` があるため git は汚れない（CNG 方式）。
3. **エミュレータ起動成功** — `Pixel_8_API_35` / `adb devices` に `emulator-5554` / `boot_completed=1`。
   Expo Go のダウンロードを一切経由していない。これが前回との決定的な差分。
4. **Gradle 側の依存は自前で解決される** — Gradle 9.3.1 を自動取得し、
   不足していた **NDK 27.1.12297006 と Build-Tools 36.0.0 を Gradle が自動インストール**した。
   着手前に懸念した「build-tools が 34/35 しかない」「cmdline-tools がない」は障害にならなかった。
5. **JDK 21 で configure フェーズを通過**（公式は JDK 17 指定だが、少なくとも設定評価までは通る）。
6. Expo SDK 57 が要求する構成: `buildTools 36.0.0 / minSdk 24 / compileSdk 36 / targetSdk 36 /
   ndk 27.1.12297006 / kotlin 2.1.20 / ksp 2.1.20-2.0.1`。

### 未確認のまま残っていること [未検証]

- Gradle の **assemble / install が最後まで通るか**（コンパイル段階は未到達のまま本セッション終了）
- アプリがエミュレータ上で起動するか
- 実描画の検証項目すべて（下記 Remaining）

## 決定事項（ユーザー承認済み）

1. 次スコープは **No-Go #4 の実機相当検証**。Android → iOS の順で両方やる
2. iOS 着手前に `brew install cocoapods` の y/n を改めて取る（システムへの依存追加。**未承認・未実行**）
3. Phase 1（公式docs の WebFetch ＋ Android ローカルビルドの外部依存取得）は承認済み・実行済み
4. カード内容の正典 `lib/disaster-data.ts` の**値は変更しない**（公式ページ再確認なしの期限延長は
   鮮度の捏造。No-Go #1 は別セッション）
5. `expo run:*` 経路へ切り替えたので、prebuild が書き換えた `package.json` のスクリプトは**残す**

## 外部仕様の確認結果（ACOS External Specification Preflight）

- 参照: `https://docs.expo.dev/get-started/set-up-your-environment/?mode=development-build&platform=android&device=simulated`
  - **JDK 17**（`brew install --cask zulu@17`）を指定 / **Android SDK Platform 36**（Android 16 Baklava）必須 /
    `ANDROID_HOME` 等の環境変数
- 参照: `https://docs.expo.dev/guides/local-app-development/`
  - `expo run:*` は native ディレクトリが無ければ先に `npx expo prebuild` を走らせる
  - `--device` で対象を選べる（**ただし adb シリアル `emulator-5554` は受け付けない**。
    実測で `CommandError: Could not find device with name: emulator-5554`。
    デバイス1台なら `--device` を付けないのが正解）
  - SDK 54 以降 `--variant debugOptimized` で反復が速くなる
- **齟齬**: 手元の JDK は Zulu 21 のみ（17 は未インストール）。configure は通ったが、
  コンパイル段階で落ちる可能性は残る。落ちたら `brew install --cask zulu@17` の承認を取る。
- `apps/mobile/AGENTS.md` が **v55 の docs を読め**と書いているが、実際は SDK 57
  （`expo@57.0.9` / `react-native@0.86.2`）。1行の齟齬修正が未実施。

## Files（本セッションで触ったもの）

変更（commit 済み）:

- `apps/mobile/package.json` — prebuild により `"android": "expo start --android"` →
  `"expo run:android"`、`"ios"` も同様に書き換わった。方針転換と一致するため意図的に残す
- `apps/mobile/scripts/qa/tap_targets.py`（新規）— uiautomator の bounds を `wm density` で
  dp へ戻し、44dp/48dp 未満のタップ可能要素を列挙する。目視でなく数値で採るため
- `apps/mobile/scripts/qa/ui.py`（新規）— content-desc / text で要素を探してタップ・
  スクリーンショット・読み上げ順テキスト出力。座標ハードコードを避ける
  （文字サイズやダークモードで座標が動くため）

触っていない（意図的）:

- `lib/disaster-data.ts`、`app/`（Web UI）、`apps/mobile/src/`（実測前に直さない）
- `apps/mobile/android/`（生成物。`.gitignore` 済み）

## 実機でのみ露見する既知リスク（コード読みで裏取り済み、まだ実測していない）

1. **文字倍率の二重適用**[高] — `apps/mobile/src/app/index.tsx` の **55 箇所すべて**が
   `fontSize: N * scale` のインライン指定で、`maxFontSizeMultiplier` / `allowFontScaling` は
   `src/app/*.tsx` 全ファイルで **0 箇所**。アプリ内3段階（最大 1.38x、`src/theme.ts:100`）に
   OS のフォントスケールが乗算される。Android の「フォントサイズ 最大」と重なると実効 2x 超。
   react-native-web の静的レンダリングでは再現しない。
   - 修正するなら 55 箇所への個別付与ではなく、`Text` をラップした共通コンポーネントで
     一元的に上限を掛けるのが妥当（`about.tsx` 5箇所 / `offline-guides.tsx` 7箇所も対象）
2. **スケールと固定 minHeight の衝突**[中] — `fontSize: 34 * scale`（index.tsx:253）等に対し
   コンテナは `minHeight: 44/52/96` の固定値（index.tsx:547,559,653,685,782,818）
3. **ダークモードの実切替**[中] — `useColorScheme()`（index.tsx:61）＋ `app.json` の
   `userInterfaceStyle: automatic`
4. **accessibilityRole のプラットフォーム差**[中] — `radiogroup` / `radio` / `summary` を使用
   （index.tsx:227,234,257）。TalkBack / VoiceOver での実読み上げは未確認

## Verification（次セッションで最初に流すコマンド）

```bash
cd /Users/tg/projects/app_development/save_kumamoto
npm run lint && npm test                       # 13件（既存5 / 整合5 / SSR3）
npm run gen:mobile-data && git status --short   # 差分が出たら正典と生成物がずれている

cd apps/mobile
npm run typecheck && npm run lint && npm run export:all
```

Android ビルドの再開（**Gradle / NDK / build-tools のキャッシュは既に温まっているので初回より速い**）:

```bash
"$ANDROID_HOME/emulator/emulator" -avd Pixel_8_API_35 -no-snapshot-save -no-boot-anim &
adb wait-for-device && adb shell getprop sys.boot_completed   # 1 になるまで待つ
cd /Users/tg/projects/app_development/save_kumamoto/apps/mobile
npx expo run:android            # --device は付けない（adb シリアルは受け付けない）
```

前回のビルドログ（途中まで）: セッション固有の scratchpad にあるため次セッションでは消える。
再実行してログを取り直すこと。

## Remaining（優先順）

1. **Android ビルド完走とアプリ起動** — ここが未達なので以降がすべて未着手
2. **boundary evidence の採取**（`apps/mobile/scripts/qa/` のスクリプトを使う）
   - OS フォントスケール（`adb shell settings put system font_scale 1.0/1.3/2.0`）×
     アプリ内3段階の 9 通りで折り返し・見切れ・ボタン内テキストのあふれ
   - ダークモード実切替（`adb shell cmd uimode night yes|no`）
   - タップ領域（`python3 scripts/qa/tap_targets.py <ラベル>`）
   - TalkBack の読み上げ順・ラベル・radiogroup の扱い
   - 期限切れ14カードで「まずやること」が残ること、60秒 tick（index.tsx:90）、外部リンク、119/110
3. **見つかった不具合の修正 → 再ビルドで直ったことを確認**（proxy evidence で代替しない）
4. **iOS Simulator**（`brew install cocoapods` の y/n を取ってから `npx expo run:ios`）
5. `apps/mobile/AGENTS.md` の v55 → v57 齟齬修正（1行、任意）
6. Expo Doctor と `npm audit --omit=dev` の再実行（UI/UX 反映後は未実行のまま）
7. README「公開前に残る課題」5項目（No-Go #1 の時刻更新は外部通信の承認が要る）

## Remaining Risks

- **エミュレータは physical device ではない**。実タッチ、実ディスプレイのコントラスト、
  実機 VoiceOver/TalkBack ジェスチャ、低速回線は、Android が完走しても未検証のまま残る。
  README には「エミュレータで検証済み／実機は未検証」と区別して書き、
  **No-Go #4 を全部消したことにしない**
- JDK 21（公式指定は 17）でコンパイル段階が落ちる可能性
- 全カードが期限切れのままなので、公開するなら先に公式情報と時刻の更新が必要
  （`lib/disaster-data.ts` を更新して `npm run gen:mobile-data`）
- iOS 側は CocoaPods 未導入・システム Ruby 2.6.10 のため gem 経由不可。Homebrew が要る

## Acceptance

判定は依然 `implementation_complete_boundary_unverified`。
本セッションで前進したのは「ネイティブをローカルビルドで動かす経路が存在すると分かった」ところまでで、
**ネイティブ実行の boundary evidence はまだ 1 件も取れていない**。

次セッションは Verification を流したうえで Remaining 1 → 2 → 3 の順に進めれば、この handoff だけで着手できる。
deploy / push / メール / ストア申請はユーザー明示承認後のみ。remote 未設定のため push 先は存在しない。
