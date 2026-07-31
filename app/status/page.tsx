import Link from "next/link";
import { readEmergencyMode } from "@/lib/emergency-mode";

export default function StatusPage() {
  // リクエストごとに読む。secret は読み出せないため、このページが現在の停止状態を
  // 確認できる唯一の経路になる。
  const emergencyMode = readEmergencyMode();

  return (
    <main className="status-page">
      <p className="eyebrow">運用ステータス</p>
      <h1>くまもと いまどうするナビ</h1>
      <div className={emergencyMode ? "status-box status-box--warning" : "status-box"}>
        <strong>{emergencyMode ? "緊急縮退中" : "通常表示"}</strong>
        <p>
          {emergencyMode
            ? "個別案内を停止し、公的な緊急連絡先だけを優先表示しています。"
            : "公開画面は表示できます。各情報の期限と公式リンク先の状態は、カードごとに確認してください。"}
        </p>
      </div>
      <h2>安全上の状態</h2>
      <ul>
        <li>利用者投稿・支援要請・寄付・決済：提供していません</li>
        <li>GPS・住所・氏名・健康情報：収集していません</li>
        <li>期限切れ情報：現在不明として表示します</li>
        <li>公式サイト障害：保存時刻を示し、最新とは表示しません</li>
      </ul>
      <p>
        <Link href="/">案内画面へ戻る</Link>
      </p>
    </main>
  );
}
