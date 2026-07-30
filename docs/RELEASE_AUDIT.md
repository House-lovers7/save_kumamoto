# リリース監査

監査日：2026年7月30日

判定：`implementation_complete_boundary_unverified`

## Acceptance Chain

| Link | 必要な証拠 | 現在の状態 |
|---|---|---|
| 公式情報 | 公式ページ、出典URL、発表・取得・確認・失効時刻 | [高] 2026年7月30日に熊本県、熊本市、九州地方整備局、電気通信事業者協会の公式ページへ接続確認済み。掲載内容の継続的な現在性は未保証 |
| Web内部品質 | typecheck、production build、契約テスト、依存監査 | [高] PASS。テスト6件、脆弱性0件 |
| Web UI | mobile/desktop表示、検索、市町村、文字拡大、status | [高] ローカル実ブラウザでPASS |
| 初期転送量 | gzip後のクライアントJS/CSSが150KB以下 | [高] 約101KB |
| iOS/Android内部品質 | typecheck、lint、Expo Doctor、両OS export | [高] PASS。Expo Doctor 20/20 |
| iOS/Android実行 | Simulatorおよび実機で主要画面を操作 | [低] 未検証。iOS SimulatorはExpo Go 57.0.5取得が8%で停滞し中止、Androidは未起動 |
| アクセシビリティ | VoiceOver/TalkBack、文字拡大、キーボード | [中] Webの文字拡大・キーボード構造は確認済み。実支援技術は未検証 |
| 現地評価 | 熊本在住者または支援者3〜5名の記録 | [低] 未実施 |
| 運用停止 | 管理者が数分以内に案内停止できる実境界 | [低] 未達。現状は環境変数変更と再デプロイが必要 |
| 公開問い合わせ | 公開可能な運営者・訂正窓口・対応時間 | [低] 未確定 |
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

1. 全カードの公式情報と時刻を公開直前に再確認する。
2. 公開問い合わせ先、訂正担当、停止判断者、対応時間を確定する。
3. 数分以内の停止手段とrollback手順を実環境で確認する。
4. iOS/Android実機とVoiceOver/TalkBackで主要シナリオを確認する。
5. 現地利用者3〜5名の評価を記録する。
6. ステージングで低速回線、オフライン再起動、主要リンクを確認する。
7. Web公開、EAS build、ストア申請、メール送信の各外部操作について承認を得る。

## Rollback

- Web：直前の検証済みversionへ戻す。重大な誤案内時は緊急縮退モードを有効にして再デプロイする。
- iOS/Android：審査提出を停止し、配布中buildの段階的公開を停止する。必要に応じて修正版のversion/build番号を更新する。
- 情報：期限切れカードは削除せず「現在の状況は確認できません」と表示し、公式サイトへの導線だけを残す。
