# Expo HAS CHANGED

このアプリは **Expo SDK 57**（`expo@57.0.0` / `react-native@0.86.2` / `expo-router@57.0.9`）です。
コードを書く前に、対象バージョンの公式ドキュメントを読んでください。

https://docs.expo.dev/versions/v57.0.0/

## ネイティブビルド

`android/` `ios/` は `.gitignore` 済みの生成物（Continuous Native Generation）です。
直接編集せず、`app.json` を変更してから `npx expo prebuild --platform <android|ios>` で再生成します。

```bash
npx expo run:android   # エミュレータ1台なら --device は付けない（adbシリアルは受け付けない）
npx expo run:ios --device "iPhone SE (3rd generation)"
```

## 実描画の検証

`react-native-web` の静的レンダリングでは、ネイティブのレイアウト、ダークモードの実切替、
タップ領域、文字拡大時の折り返しは確認できません。`scripts/qa/` のスクリプトで実機・
エミュレータから数値とスクリーンショットを採ってください（`ui.py` / `tap_targets.py`）。
