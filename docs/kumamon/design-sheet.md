# デザイン画（design-sheet.png）の内容と再出力手順

届出書（notification-draft.md）の添付書類「利用の状況がわかる資料」として提出する
デザイン画の説明。実体は同ディレクトリの `design-sheet.png`（1040x2779 CSS px、
deviceScaleFactor 2 で撮影）。

## 内容（3カット構成）

1. **掲出位置（トップページ全体における位置）** — ローカルビルド（localhost:3200、
   モバイル幅390px）のトップページ全体スクリーンショットを縦150px枠に圧縮した
   サムネイル。ページ最下部「このアプリがしないこと」セクションとフッターの間に
   赤枠で挿入位置を示す。
2. **挿入位置の拡大** — 実画面ベースのフッター付近拡大。新設するくまモン応援表示の
   挿入範囲をオレンジ点線枠で示す（枠内に絵は一切描画していない）。構成4要素
   （見出し「熊本を応援しています。」/ イラスト1点・幅240px想定・原寸比・無改変・
   非リンク / ©2010熊本県くまモン#熊本支援 / 非公式明示の届出文言）を注記。
3. **掲出内容のテキストモック** — 4要素の文言と並び順のみを示すモック。イラスト部は
   斜線プレースホルダ+「イラストNo.(89)「がんばるけん！くまもとけん！」を原寸・
   無改変で配置（幅240px想定）」の文字のみ。

## 検証観点（提出前に毎回確認）

- **くまモンの実イラスト・類似イラストが1点も描かれていないこと**（許諾前のため。
  プレースホルダは点線枠+文字のみ。AI生成イラストは特例で明示的に禁止）
- イラスト番号の表示が各カットで1回ずつであること
- ©表記が「©2010熊本県くまモン#熊本支援」（特例ページ指定の表記）であること

## 再出力手順

ソース一式はリポジトリ内 `work/kumamon/`（`.gitignore` の `/work/` によりコミット
対象外）。`design-sheet.html` が `top-full.png` / `footer-crop.png` を相対参照する
ため、同一ディレクトリに置いたまま実行する。

1. イラスト番号を変える場合は `work/kumamon/design-sheet.html` 末尾スクリプトの
   `window.KUMAMON_ILLUST_NO` を1箇所書き換える（冒頭の CSS変数
   `--kumamon-illust-no` は表示ラベルの控えで、同じ値に揃えておく）
2. headless Chrome を CDP 付きで起動:
   `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9333 --user-data-dir=<一時プロファイル> --no-first-run --disable-gpu about:blank`
3. 撮影（devサーバー不要・file:// 直接描画）:
   `cd work/kumamon && node capture-generic.mjs "file://$PWD/design-sheet.html" "$PWD/design-sheet.png" 1040 false`
4. Chrome を停止し（`pkill -f "remote-debugging-port=9333"`）、PNG を目視検証のうえ
   `docs/kumamon/design-sheet.png` へコピーしてコミットする

トップページのスクリーンショット自体を撮り直す場合は `work/kumamon/` の
`capture-top.mjs` / `capture-footer.mjs`（要ローカルビルド起動）を使う。

## 撮影履歴

- 2026-08-01: イラストNo.(89) 確定版を再出力・目視検証済み（くまモン非描画・
  番号表示各1回・3カット構成を確認）
