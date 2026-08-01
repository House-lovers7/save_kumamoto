# リリース監査

監査日：2026年7月31日

判定：`implementation_complete_boundary_unverified`

## Acceptance Chain

| Link | 必要な証拠 | 現在の状態 |
|---|---|---|
| 公式情報 | 公式ページ、出典URL、発表・取得・確認・失効時刻 | [高] 2026年8月1日 09:30 JST に公式ページ14件（重複除く）を再確認し、全件がHTTP 200。**8カードは掲載継続、4カードを新規追加（food-hikawa / shelter-hikawa / bath-kumamoto / toilet-container）、3カードは手順・説明を実態へ修正（evidence / water / support-systems）、熊本市の3カードは公式の該当案内を確認できず `unavailable`**。判定は「カードの手順が1つずつリンク先で実行できるか」（`docs/OPERATIONS.md` 第5章）。取得から時刻設定まで9時間空いたため、最後に全URLを取り直して差分を確認している |
| Web内部品質 | typecheck、production build、契約テスト、依存監査 | [高] PASS。テスト25件、`npm audit --omit=dev` 脆弱性0件（2026年7月31日 実行） |
| Web UI | mobile/desktop表示、検索、市町村、文字拡大、status | [高] ローカル実ブラウザでPASS |
| タップ領域 | 押せる要素が48x48dp以上、横スクロールなし | [高] 2026年8月1日に**Webとネイティブの両方**で実測。Webは実ブラウザの390/360/320px すべてで基準未満0件・横スクロールなし（`scripts/qa/tap-target-check.mjs`）。ネイティブはAndroidエミュレータで実測し、修正前は44dp未満10件・48dp未満15件だったものを0件へ（`apps/mobile/scripts/qa/tap_targets.py`）。uiautomatorのboundsは画面外をクリップするため、対象を画面内に入れてから測る |
| 初期転送量 | gzip後のクライアントJS/CSSが150KB以下 | [高] 約101KB（2026年7月30日計測。以後 UI を追加しており未再計測） |
| iOS/Android内部品質 | typecheck、lint、Expo Doctor、両OS export | [高] Expo Doctor 20/20 PASS（2026年7月31日 再実行）。typecheck/lint/export は2026年7月30日時点 |
| iOS/Android実行 | Simulatorおよび実機で主要画面を操作 | [中] 2026年8月1日にAndroidエミュレータ（Pixel_8_API_35）で `npx expo run:android` を通し、トップ・困りごと絞り込み・カードの開閉・誤認防止表示（未確認タグ／確認できていません／確認項目／個別の有効期限）を実描画で確認した。**実機とiOSは未検証**。iOSは `expo-modules-jsi` がSwift 6.3を要求し xcodebuild error 65（手元は6.2、Xcode 26.4+への更新が必要） |
| アクセシビリティ | VoiceOver/TalkBack、文字拡大、キーボード | [中] Webの文字拡大・キーボード構造は確認済み。実支援技術は未検証 |
| 現地評価 | 熊本在住者または支援者3〜5名の記録 | [低] 未実施 |
| 運用停止 | 管理者が数分以内に案内停止できる実境界 | [中] 2026年7月31日更新。verified: 実行時env経路（再ビルド不要）、SSRとRSCペイロード双方への反映、単一ビルドでのON/OFF回帰8件、populate前提条件の機械検査、workerd経路（`.dev.vars`→miniflare bindings）、実ブラウザのhydration後DOM。未検証: 本番Workersでの実操作と反映時間、停止中デプロイでの維持、実利用者への到達遅延、停止判断者の実オペレーション |
| 公開問い合わせ | 公開可能な運営者・訂正窓口・対応時間 | [中] 体制は確定（運営者1人が兼務／窓口はGitHub Issues／9:00〜21:00 JSTベストエフォート、`docs/OPERATIONS.md`）。ただしremote未設定でIssuesのURLが存在せず未達 |
| Web本番配信 | 公開URL、CDN、低速回線、オフライン再起動、rollback | [低] 未実施 |
| ストア配信 | 署名済みIPA/AAB、TestFlight/Internal testing、審査 | [低] 未実施 |
| 公開通知 | 公開URLと検証結果を指定先へ送信 | [低] 公開後かつ送信直前の承認待ち |

## ローカル合格証拠

```text
npm run lint
npm test
npm audit

cd apps/mobile
npm run typecheck
npm run lint
npx expo-doctor@latest
npm run export:all
npm audit --omit=dev
```

Mobileのproduction依存監査はCritical/High 0件、Moderate 11件です。ModerateはExpoのビルドツール依存経由であり、ストア提出前に再監査します。

## 公開停止条件

次のいずれかが未達なら一般公開・ストア申請へ進みません。

1. 全カードの公式情報と時刻を公開直前に再確認する。**未達**。
   2026-08-01 09:30 JST の巡回時点で、**熊本市の3カード**（食料・生活用品／トイレ／
   乳幼児）の公式案内を確認できず `sourceStatus: "unavailable"` としている。画面には
   「公式の案内を確認できていません」と何が確認できていないかを出しているが、
   被災者が最も困る領域が3つ空いた状態での一般公開はしない。
   氷川町では食料配布（時間と場所つき）が公式に出ていたためカードを追加したが、
   熊本市には冊子PDFの目次まで当たっても該当する案内が無い。
   24時間期限のため、**毎日1回の再確認巡回が継続する限りにおいて**他のカードは有効。
   氷川町の配布カードだけは当日限りの告知なので配布終了時刻で失効する。
   詳細は `docs/OPERATIONS.md` 第5章。
2. 公開問い合わせ先、訂正担当、停止判断者、対応時間を確定する。体制は確定済み（`docs/OPERATIONS.md`）。
   残るのは**問い合わせ窓口のURLの実在**（remote未設定でGitHub Issuesが存在しない）。
3. 数分以内の停止手段とrollback手順を**本番環境で**確認する。ローカルとworkerdでの確認は済んでいるが、
   本番では次を順に実施する。
   1. `npx wrangler secret put EMERGENCY_MODE`（値 `true`）を実行する
   2. **別端末**で `/` から個別カードが消え、`/status` が「緊急縮退中」になることを確認する
   3. 1→2 にかかった実時間を記録する
   4. 停止中に無害な変更をデプロイし、`/status` が「緊急縮退中」のままであることを確認する
      （`wrangler deploy` はvarsを消すが secrets は消えない、という前提の実地確認）
   5. `npx wrangler secret delete EMERGENCY_MODE` で解除し、通常表示へ戻ることを確認する
4. iOS/Android実機とVoiceOver/TalkBackで主要シナリオを確認する。
5. 現地利用者3〜5名の評価を記録する。
6. ステージングで低速回線、オフライン再起動、主要リンクを確認する。
7. Web公開、EAS build、ストア申請、メール送信の各外部操作について承認を得る。
8. **ネイティブには誤案内を止める経路が一切ないことを、運営者が明示的に受諾する。**
   受諾するまでストア申請へ進まない。Webは環境変数で数分以内に止まるが、ネイティブは
   ストア審査を通した新バージョンの配布まで（数日〜）止められない。

## Rollback

- Web：直前の検証済みversionへ戻す。重大な誤案内時は `npx wrangler secret put EMERGENCY_MODE`（値 `true`）で
  緊急縮退モードを有効にする。**再ビルド・再デプロイは不要**。`/status` で状態を確認する。
  plain text var は `wrangler deploy` が既定でvarsを全消しするため次のデプロイで消える。secretを使う。
- iOS/Android：審査提出を停止し、配布中buildの段階的公開を停止する。必要に応じて修正版のversion/build番号を更新する。
  **配布済みのアプリに対しては停止手段がない**（`expo-updates` 未導入、通信ゼロ設計）。
- 情報：期限切れカードは削除せず「現在の状況は確認できません」と表示し、公式サイトへの導線だけを残す。

## 停止の到達範囲

緊急縮退モードを立てても、全利用者へ即座に届くわけではない。

| 対象 | 届くか | 遅延 |
|---|---|---|
| オンライン利用者の次のページ遷移・再読込 | 届く | 次のナビゲーションまで（`public/sw.js` はnavigationをnetwork-firstで取得） |
| 開きっぱなしのタブ | 届かない | 利用者が再読込するまで（ポーリング未実装） |
| オフラインのPWA利用者 | 届かない | 再接続してナビゲーションするまで |
| iOS / Androidネイティブ | 一切届かない | ストア審査を通した新バージョンの配布まで（数日〜） |

`isExpired` による失効表示は端末の時計で動くため、停止が届かない利用者に対する唯一の自動的な劣化通知になる。
**停止スイッチ（サーバー側の判定）と失効表示（端末側の判定）は別物**として扱う。
詳細と運用手順は `docs/OPERATIONS.md`、実測証拠は `docs/qa/emergency-mode-2026-07-31/`。
