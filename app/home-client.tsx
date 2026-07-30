"use client";

import { useEffect, useMemo, useState } from "react";
import {
  actionCards,
  categoryLabels,
  formatTimestamp,
  isExpired,
  municipalities,
  type ActionCategory,
} from "@/lib/disaster-data";

const categories = Object.keys(categoryLabels) as ActionCategory[];
const renderedAt = new Date();
const emergencyMode = process.env.NEXT_PUBLIC_EMERGENCY_MODE === "true";

export function HomeClient() {
  const [municipality, setMunicipality] = useState<(typeof municipalities)[number]>(
    "熊本県全域",
  );
  const [category, setCategory] = useState<ActionCategory>("all");
  const [query, setQuery] = useState("");
  const [largeText, setLargeText] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const savedArea = window.localStorage.getItem("relief-area");
    const savedText = window.localStorage.getItem("relief-large-text");
    queueMicrotask(() => {
      if (savedArea && municipalities.includes(savedArea as (typeof municipalities)[number])) {
        setMunicipality(savedArea as (typeof municipalities)[number]);
      }
      setLargeText(savedText === "true");
      setOffline(!window.navigator.onLine);
    });
    const online = () => setOffline(false);
    const offlineHandler = () => setOffline(true);
    window.addEventListener("online", online);
    window.addEventListener("offline", offlineHandler);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offlineHandler);
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return actionCards.filter((card) => {
      const matchesCategory = category === "all" || card.category === category;
      const matchesArea =
        municipality === "熊本県全域" ||
        card.areas.includes("熊本県全域") ||
        card.areas.includes(municipality);
      const matchesQuery =
        !normalized ||
        `${card.title} ${card.summary} ${card.action}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesArea && matchesQuery;
    });
  }, [category, municipality, query]);

  function changeArea(value: (typeof municipalities)[number]) {
    setMunicipality(value);
    window.localStorage.setItem("relief-area", value);
  }

  function toggleText() {
    setLargeText((current) => {
      window.localStorage.setItem("relief-large-text", String(!current));
      return !current;
    });
  }

  return (
    <main className={largeText ? "app app--large" : "app"}>
      <a className="skip-link" href="#actions">
        困りごとの一覧へ移動
      </a>

      <div className="emergency-strip" role="region" aria-label="緊急連絡">
        <span>命の危険・火災・救急</span>
        <div>
          <a href="tel:119">119</a>
          <a href="tel:110">警察 110</a>
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
        <button className="text-toggle" type="button" onClick={toggleText} aria-pressed={largeText}>
          <span aria-hidden="true">あ</span>
          {largeText ? "標準の文字" : "文字を大きく"}
        </button>
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
          オフラインです。端末に保存済みの内容を表示しています。外部の公式ページは開けません。
        </div>
      )}

      <section className="hero" aria-labelledby="hero-title">
        <div>
          <p className="eyebrow">令和8年熊本地震・生活支援</p>
          <h2 id="hero-title">いま、一番<br />困っていることは？</h2>
        </div>
        <div className="freshness-panel">
          <span className="freshness-panel__signal" aria-hidden="true" />
          <div>
            <strong>公式サイトの接続を確認</strong>
          <time dateTime="2026-07-30T09:35:00+09:00">7月30日 09:35</time>
          </div>
          <p>状況は変わる可能性があります。各リンク先の発表時刻を確認してください。</p>
        </div>
      </section>

      <section className="controls" aria-label="表示する情報を選ぶ">
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
      </section>

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

      {!emergencyMode && <section id="actions" className="action-section" aria-live="polite">
        <div className="section-heading">
          <h2>{municipality}で確認すること</h2>
          <span>{filtered.length}件</span>
        </div>
        {filtered.length > 0 ? (
          <div className="action-list">
            {filtered.map((card) => (
              <article className="action-card" key={card.id}>
                <div className="action-card__icon" aria-hidden="true">{card.icon}</div>
                <div className="action-card__body">
                  <div className="action-card__meta">
                    <span>{categoryLabels[card.category]}</span>
                    {card.offline && <span>オフライン保存</span>}
                    <span>公式情報</span>
                    {isExpired(card, renderedAt) && <span className="is-expired">期限切れ</span>}
                  </div>
                  <h3>{card.title}</h3>
                  {isExpired(card, renderedAt) ? (
                    <div className="expired-message" role="status">
                      <strong>現在の状況は確認できません</strong>
                      <p>
                        保存情報の有効期限を過ぎています。移動や申込みの前に、公式サイトで最新情報を確認してください。
                      </p>
                    </div>
                  ) : (
                    <p>{card.summary}</p>
                  )}
                  <div className="caution">
                    <strong>注意</strong>
                    <p>{card.caution}</p>
                  </div>
                  <div className="source-row">
                    <span>出典：{card.sourceName}</span>
                    <span>案内更新：{formatTimestamp(card.publishedAt)}</span>
                    <span>取得：{formatTimestamp(card.fetchedAt)}</span>
                    <span>接続確認：{formatTimestamp(card.checkedAt)}</span>
                    <span>有効期限：{formatTimestamp(card.expiresAt)}</span>
                  </div>
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
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <strong>一致する情報がありません</strong>
            <p>市町村・カテゴリ・キーワードを変えてください。</p>
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
