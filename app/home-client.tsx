"use client";

import { useEffect, useMemo, useState } from "react";
import {
  actionCards,
  categoryLabels,
  formatRelativeTime,
  formatTimestamp,
  isExpired,
  municipalities,
  siteCheckedAt,
  type ActionCategory,
} from "@/lib/disaster-data";

const categories = Object.keys(categoryLabels) as ActionCategory[];
const needCategories = categories.filter(
  (item): item is Exclude<ActionCategory, "all"> => item !== "all",
);
type TextScale = "standard" | "large" | "xlarge";

const textScales: TextScale[] = ["standard", "large", "xlarge"];
const textScaleLabels: Record<TextScale, string> = {
  standard: "標準",
  large: "大",
  xlarge: "特大",
};

export type HomeClientProps = {
  /**
   * 緊急停止スイッチ。サーバー側で `readEmergencyMode()` が読んだ値を受け取る。
   * ここで `process.env` を読んではいけない（クライアントバンドルでは常に false になる）。
   */
  emergencyMode: boolean;
};

export function HomeClient({ emergencyMode }: HomeClientProps) {
  const [municipality, setMunicipality] = useState<(typeof municipalities)[number]>(
    "熊本県全域",
  );
  const [category, setCategory] = useState<ActionCategory>("all");
  const [query, setQuery] = useState("");
  const [textScale, setTextScale] = useState<TextScale>("standard");
  const [offline, setOffline] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const savedArea = window.localStorage.getItem("relief-area");
    const savedScale = window.localStorage.getItem("relief-text-scale");
    const legacyLarge = window.localStorage.getItem("relief-large-text");
    queueMicrotask(() => {
      if (savedArea && municipalities.includes(savedArea as (typeof municipalities)[number])) {
        setMunicipality(savedArea as (typeof municipalities)[number]);
      }
      if (savedScale && textScales.includes(savedScale as TextScale)) {
        setTextScale(savedScale as TextScale);
      } else if (legacyLarge === "true") {
        setTextScale("large");
        window.localStorage.setItem("relief-text-scale", "large");
      }
      setOffline(!window.navigator.onLine);
    });
    const online = () => setOffline(false);
    const offlineHandler = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineHandler);
    const tick = window.setInterval(() => setNow(new Date()), 60_000);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineHandler);
      window.clearInterval(tick);
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matched = actionCards.filter((card) => {
      const matchesCategory = category === "all" || card.category === category;
      const matchesArea =
        municipality === "熊本県全域" ||
        card.areas.includes("熊本県全域") ||
        card.areas.includes(municipality);
      const matchesQuery =
        !normalized ||
        `${card.title} ${card.summary} ${card.steps.join(" ")} ${card.action} ${card.keywords.join(" ")}`
          .toLowerCase()
          .includes(normalized);
      return matchesCategory && matchesArea && matchesQuery;
    });
    if (!normalized) return matched;
    // 検索時は、その困りごと自体を扱うカードを先に出す。
    // 「薬」で高齢者向けカードが先に出たり、「ペット」が本文の「ペットボトル」に
    // 反応して給水カードが避難所より上に来たりするのを防ぐ。
    const rank = (card: (typeof actionCards)[number]) => {
      if (card.title.toLowerCase().includes(normalized)) return 0;
      if (card.keywords.some((word) => word.toLowerCase().includes(normalized))) return 1;
      return 2;
    };
    return matched
      .map((card, index) => ({ card, index }))
      .sort((a, b) => rank(a.card) - rank(b.card) || a.index - b.index)
      .map((entry) => entry.card);
  }, [category, municipality, query]);

  const countsByCategory = useMemo(() => {
    const counts = new Map<ActionCategory, number>();
    for (const card of actionCards) {
      const matchesArea =
        municipality === "熊本県全域" ||
        card.areas.includes("熊本県全域") ||
        card.areas.includes(municipality);
      if (!matchesArea) continue;
      counts.set(card.category, (counts.get(card.category) ?? 0) + 1);
    }
    return counts;
  }, [municipality]);

  // 保存情報が古くなったら見た目も変える。全部期限切れなのに緑の信号を出さない。
  const freshness = useMemo(() => {
    const expired = actionCards.filter((card) => isExpired(card, now)).length;
    if (expired === 0) {
      return {
        tone: "fresh" as const,
        headline: "公式サイトの接続を確認",
        note: "状況は変わる可能性があります。各リンク先の発表時刻を確認してください。",
      };
    }
    if (expired === actionCards.length) {
      return {
        tone: "stale" as const,
        headline: "保存した情報の期限が切れています",
        note: "下の手順は使えますが、場所・時間などの最新の状況は必ず公式サイトで確認してください。",
      };
    }
    return {
      tone: "mixed" as const,
      headline: `一部の情報が期限切れです（${expired}／${actionCards.length}件）`,
      note: "期限切れの案内は「期限切れ」と表示しています。最新の状況は公式サイトで確認してください。",
    };
  }, [now]);

  function changeArea(value: (typeof municipalities)[number]) {
    setMunicipality(value);
    window.localStorage.setItem("relief-area", value);
  }

  function changeTextScale(scale: TextScale) {
    setTextScale(scale);
    window.localStorage.setItem("relief-text-scale", scale);
  }

  function selectNeed(item: ActionCategory) {
    setCategory(item);
    document.getElementById("actions")?.scrollIntoView({ block: "start" });
  }

  function resetFilters() {
    setCategory("all");
    setQuery("");
  }

  return (
    <main className={`app app--text-${textScale}`}>
      {!emergencyMode && <a className="skip-link" href="#actions">
        困りごとの一覧へ移動
      </a>}

      <div className="emergency-strip" role="region" aria-label="緊急連絡">
        <span>命の危険・火災・救急</span>
        <div>
          <a href="tel:119">
            <strong>119</strong>消防・救急
          </a>
          <a href="tel:110">
            <strong>110</strong>警察
          </a>
        </div>
      </div>

      <header className="site-header">
        <div className="brand" aria-label="くまもと いまどうするナビ">
          <span className="brand__mark" aria-hidden="true">
            火
          </span>
          <div>
            <p>有志による公式情報への案内</p>
            <h1>くまもと<br />いまどうするナビ</h1>
          </div>
        </div>
        <div className="text-size-control" role="group" aria-label="文字の大きさ">
          <span aria-hidden="true">文字</span>
          {textScales.map((scale) => (
            <button
              key={scale}
              type="button"
              className={textScale === scale ? "is-active" : ""}
              aria-pressed={textScale === scale}
              onClick={() => changeTextScale(scale)}
            >
              {textScaleLabels[scale]}
            </button>
          ))}
        </div>
      </header>

      {emergencyMode && (
        <section className="maintenance-notice" role="alert">
          <strong>緊急縮退モード</strong>
          <p>
            現在、個別の案内カードを停止しています。119・110と自治体の公式情報を優先してください。
          </p>
        </section>
      )}

      {offline && (
        <div className="offline-notice" role="status">
          オフラインです。保存済みの案内を表示しています。外部の公式ページは開けませんが、
          「まずやること」の手順と電話（119・110・171）は使えます。
        </div>
      )}

      {/*
        鮮度は普段1行だけ出す。期限切れが出たときにだけ見出しと説明を足す。
        常に警告文を置くと、本当に古くなったときの警告がその中に埋もれる。
      */}
      <div
        className={`freshness-bar freshness-bar--${freshness.tone}`}
        role="status"
        suppressHydrationWarning
      >
        <span className="freshness-bar__signal" aria-hidden="true" />
        <time dateTime={siteCheckedAt} suppressHydrationWarning>
          接続確認 {formatRelativeTime(siteCheckedAt, now)}（{formatTimestamp(siteCheckedAt)}）
        </time>
        {freshness.tone !== "fresh" && (
          <div className="freshness-bar__alert">
            <strong>{freshness.headline}</strong>
            <p>{freshness.note}</p>
          </div>
        )}
      </div>

      {!emergencyMode && (
        <div className="need-lead">
          <p className="eyebrow">令和8年熊本地震・生活支援</p>
          <h2 id="hero-title">いま困っていることは？</h2>
        </div>
      )}

      {/*
        縮退中は絞り込みの操作子を出さない。行き先の #actions ごと消えているため、
        押しても何も起きないボタンになる。災害時に無反応の操作子を残さない。
      */}
      {!emergencyMode && <nav className="need-grid" aria-label="困りごとから選ぶ">
        {needCategories.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? "is-active" : ""}
            aria-pressed={category === item}
            onClick={() => selectNeed(item)}
          >
            <span className="need-grid__label">{categoryLabels[item]}</span>
            <span className="need-grid__count">{countsByCategory.get(item) ?? 0}件</span>
          </button>
        ))}
      </nav>}

      {!emergencyMode && <section className="controls" aria-label="表示する情報を選ぶ">
        <label>
          <span>市町村</span>
          <select value={municipality} onChange={(event) => changeArea(event.target.value as (typeof municipalities)[number])}>
            {municipalities.map((area) => (
              <option key={area}>{area}</option>
            ))}
          </select>
        </label>
        <label className="search-box">
          <span>キーワード</span>
          <input
            type="search"
            placeholder="水、薬、片付け…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </section>}

      {!emergencyMode && <section id="actions" className="action-section" aria-live="polite">
        <div className="section-heading">
          <h2>{municipality}で確認すること</h2>
          <span>{filtered.length}件</span>
        </div>
        <div className="category-nav-wrap">
          <nav className="category-nav" aria-label="困りごとの種類">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={category === item ? "is-active" : ""}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {categoryLabels[item]}
              </button>
            ))}
          </nav>
        </div>
        {filtered.length > 0 ? (
          <div className="action-list">
            {filtered.map((card) => {
              const expired = isExpired(card, now);
              return (
                <article className="action-card" key={card.id}>
                  <div className="action-card__icon" aria-hidden="true">{card.icon}</div>
                  <div className="action-card__body">
                    <div className="action-card__meta">
                      <span>{categoryLabels[card.category]}</span>
                      {card.offline && <span>オフライン保存</span>}
                      {/* 確認できていないカードに「公式情報」と付けると、行けば分かると誤解させる。 */}
                      {card.sourceStatus === "unavailable" ? (
                        <span className="is-unverified">未確認</span>
                      ) : (
                        <span>公式情報</span>
                      )}
                      {expired && <span className="is-expired" suppressHydrationWarning>期限切れ</span>}
                    </div>
                    <h3>{card.title}</h3>
                    {expired ? (
                      <div className="expired-message" role="status" suppressHydrationWarning>
                        <strong>現在の状況は確認できません</strong>
                        <p>
                          保存情報の有効期限（{formatTimestamp(card.expiresAt)}）を過ぎています。
                          下の基本手順は使えますが、場所・時間などの最新状況は必ず公式サイトで確認してください。
                        </p>
                      </div>
                    ) : (
                      <p>{card.summary}</p>
                    )}
                    {/*
                      リンクは生きているが、そのページにこの話題の案内が無い状態。
                      黙って通常のカードとして出すと「行けば分かる」と誤解させるので、
                      手順より先に、何が確認できていないのかを本文として出す。
                    */}
                    {card.sourceStatus === "unavailable" && (
                      <div className="unverified-notice" role="note">
                        <strong>公式の案内を確認できていません</strong>
                        <p>{card.unverified}</p>
                      </div>
                    )}
                    <div className="source-summary" suppressHydrationWarning>
                      <span className={expired ? "source-summary__status is-expired" : "source-summary__status"}>
                        {expired
                          ? `有効期限切れ（${formatTimestamp(card.expiresAt)}）`
                          : `有効期限 ${formatTimestamp(card.expiresAt)}まで`}
                      </span>
                      <span>接続確認 {formatRelativeTime(card.checkedAt, now)}</span>
                    </div>
                    {/*
                      手順から下は畳む。18枚のカードを全部開いたまま並べると、必要な1枚に
                      たどり着くまでのスクロールが長すぎる。JS が動く前でも開けるよう <details>
                      を使い、初期HTMLからは消さない（誤認防止の表示は初期HTMLに出ている必要がある）。
                      畳んだ状態でも残すのは、要約・有効期限・「未確認」の警告・公式サイトへのボタン。
                    */}
                    <details className="card-detail">
                      <summary>手順と注意を見る</summary>
                      <div className="steps">
                        <strong className="steps__title">まずやること</strong>
                        <ol>
                          {card.steps.map((step) => (
                            <li key={step}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    {/*
                      混同すると健康被害・無駄足につながる区別。期限切れでも隠さない。
                      「飲料用か生活用水か」は、期限が切れても確認すべきことに変わりがない。
                    */}
                    {card.verifyPoints?.map((point) => (
                      <div className="verify-point" key={point.label}>
                        <strong>公式ページで必ず確認する: {point.label}</strong>
                        <ul>
                          {point.options.map((option) => (
                            <li key={option}>{option}</li>
                          ))}
                        </ul>
                        <p>{point.why}</p>
                      </div>
                    ))}
                    {card.irreversibleOrder && (
                      <div className="irreversible-order">
                        <strong>順番を間違えると取り返しがつきません</strong>
                        <ol>
                          {card.irreversibleOrder.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                      <div className="caution">
                        <strong>注意</strong>
                        <p>{card.caution}</p>
                      </div>
                      <details className="source-details">
                        <summary>出典と時刻の詳細</summary>
                        <dl>
                        <div>
                          <dt>出典</dt>
                          <dd>{card.sourceName}</dd>
                        </div>
                        <div>
                          <dt>案内更新</dt>
                          <dd>{formatTimestamp(card.publishedAt)}</dd>
                        </div>
                        <div>
                          <dt>取得</dt>
                          <dd>{formatTimestamp(card.fetchedAt)}</dd>
                        </div>
                        <div>
                          <dt>接続確認</dt>
                          <dd>{formatTimestamp(card.checkedAt)}</dd>
                        </div>
                          <div>
                            <dt>有効期限</dt>
                            <dd>{formatTimestamp(card.expiresAt)}</dd>
                          </div>
                        </dl>
                      </details>
                    </details>
                    {offline ? (
                      <div className="primary-link primary-link--disabled" aria-disabled="true">
                        <span>{card.action}</span>
                        <span className="primary-link__note">オフラインのため開けません</span>
                      </div>
                    ) : (
                      <a
                        className="primary-link"
                        href={card.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${card.action}（外部の公式サイト）`}
                      >
                        {card.action}
                        <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <strong>一致する情報がありません</strong>
            <p>市町村・カテゴリ・キーワードを変えてください。</p>
            <button type="button" className="empty-state__reset" onClick={resetFilters}>
              条件をリセットしてすべて表示
            </button>
          </div>
        )}
      </section>}

      <section className="safety-note" aria-labelledby="safety-title">
        <p className="eyebrow">このアプリがしないこと</p>
        <h2 id="safety-title">あなたの居場所を集めません。</h2>
        <div>
          <p>ログイン、GPS、住所、氏名、被害写真、健康情報、利用者投稿、広告、アクセス解析を使いません。</p>
          <p>営業、在庫、道路、医療の状態を独自に断定せず、必ず公式情報へ案内します。</p>
        </div>
      </section>

      <footer>
        <p>これは熊本県・熊本市・NERV等の公式サービスではありません。自治体、消防、警察の指示を優先してください。</p>
        <p>
          公開情報のみ／個人情報を収集しない／最終更新 2026年7月30日／
          <a href="/status">運用ステータス</a>
        </p>
      </footer>
    </main>
  );
}
