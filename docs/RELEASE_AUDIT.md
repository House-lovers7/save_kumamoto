# リリース監査

監査日：2026年7月30日

判定：`implementation_complete_boundary_unverified`

## Acceptance Chain

| Link | 必要な証拠 | 現在の状態 |
|---|---|---|
| 公式情報 | 公式ページ、出典URL、発表・取得・確認・失効時刻 | [高] 2026年7月31日 18:30 JST に公式ページを再確認。**8カードは掲載継続、2カードは導線を再選定、4カードは公式の該当案内を確認できず `unavailable`**。リンク生存だけでは導線の破綻を検出できないことが判明し、判定を「カードの手順がリンク先で実行できるか」へ変更した（`docs/OPERATIONS.md` 第5章） |
| Web内部品質 | typecheck、production build、契約テスト、依存監査 | [高] PASS。テスト25件、`npm audit --omit=dev` 脆弱性0件（2026年7月31日 実行） |
| Web UI | mobile/desktop表示、検索、市町村、文字拡大、status | [高] ローカル実ブラウザでPASS |
| タップ領域 | 押せる要素が48x48dp以上、横スクロールなし | [高] 2026年7月31日に実ブラウザで実測。390/360/320px すべてで基準未満0件・横スクロールなし（`scripts/qa/tap-target-check.mjs`）。修正前は9件が未達 |
| 初期転送量 | gzip後のクライアントJS/CSSが150KB以下 | [高] 約101KB（2026年7月30日計測。以後 UI を追加しており未再計測） |
| iOS/Android内部品質 | typecheck、lint、Expo Doctor、両OS export | [高] Expo Doctor 20/20 PASS（2026年7月31日 再実行）。typecheck/lint/export は2026年7月30日時点 |
| iOS/Android実行 | Simulatorおよび実機で主要画面を操作 | [低] 未検証。iOS SimulatorはExpo Go 57.0.5取得が8%で停滞し中止、Androidは未起動 |
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
   2026-07-31 18:30 JST の巡回で、14カード中**4カード**（食料・生活用品／燃料／トイレ／
   乳幼児）の公式案内を確認できず `sourceStatus: "unavailable"` とした。画面には
   「公式の案内を確認できていません」と何が確認できていないかを出しているが、
   被災者が最も困る領域が4つ空いた状態での一般公開はしない。
   water と elder-care は実在ページへ導線を再選定して解消済み。
   24時間期限のため、**毎日1回の再確認巡回が継続する限りにおいて**残り10カードは有効。
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
