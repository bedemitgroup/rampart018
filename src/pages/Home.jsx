import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, BASE } from '../services/api';
import './Home.css';

const categoryColors = {
  primary:   'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent:    'var(--color-accent)',
  accent2:   'var(--color-accent2)',
};
const colorKeys = Object.keys(categoryColors);

function categoryColorFor(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0;
  return colorKeys[Math.abs(hash) % colorKeys.length];
}

function CategoryTag({ label }) {
  return (
    <span className="news-category" style={{ color: categoryColors[categoryColorFor(label)] }}>
      {label}
    </span>
  );
}

function ArticleTitle({ article, className }) {
  return (
    <Link to={`/vest/${article.slug}`} className={`news-title-link ${className || ''}`}>
      {article.title}
    </Link>
  );
}

function formatDate(isoString) {
  const d = new Date(isoString);
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`;
}

export default function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getNews()
      .then(setNews)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home">
      {/* Breaking bar */}
      <div className="home-breaking">
        <div className="container home-breaking__inner">
          <span className="home-breaking__label">Aktuelno</span>
          <span className="home-breaking__text">
            Sledeća javna akcija: Protest ispred Skupštine Beograda — subota, 2. avgusta u 11h
          </span>
          <Link to="/problem" className="home-breaking__link">Prijavi problem →</Link>
        </div>
      </div>

      <main className="container home-main">
        {loading && <p className="home-status">Učitavanje vesti...</p>}
        {error && <p className="home-status home-status--error">{error}</p>}
        {!loading && !error && news.length === 0 && (
          <p className="home-status">Trenutno nema objavljenih vesti.</p>
        )}

        {!loading && !error && news.length > 0 && (
          <NewsGrid news={news} />
        )}

        {/* Stats bar */}
        <div className="home-stats">
          {[
            { value: '1.200+', label: 'Aktivnih članova' },
            { value: '48',     label: 'Uspešnih akcija' },
            { value: '5',      label: 'Godina borbe' },
            { value: '12',     label: 'Opština' },
          ].map(({ value, label }) => (
            <div key={label} className="home-stats__item">
              <span className="home-stats__value">{value}</span>
              <span className="home-stats__label">{label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* CTA Banner */}
      <section className="home-cta">
        <div className="container home-cta__inner">
          <div className="home-cta__text">
            <h2>Imaš problem? Nisi sam.</h2>
            <p>Podeli svoju priču sa nama. Svaka prijava pomaže da bolje razumemo šta muči naše sugrađane.</p>
          </div>
          <div className="home-cta__actions">
            <Link to="/problem" className="btn btn--outline-white btn--lg">Podeli problem</Link>
            <Link to="/pridruzi-se" className="btn btn--secondary btn--lg">Postani član</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function NewsGrid({ news }) {
  const featuredArticle = news[0];
  const leftArticles = news.slice(1, 4);
  const rightArticles = news.slice(4, 7);
  const secondaryArticles = news.slice(1, 5);

  return (
    <>
      <div className="home-grid">
        {/* Left column */}
        {leftArticles.length > 0 && (
          <aside className="home-grid__left">
            <div className="home-col-label">Vesti</div>
            {leftArticles.map((a) => (
              <article key={a.id} className="news-item news-item--side">
                <div className="news-item__body">
                  <CategoryTag label={a.category} />
                  <ArticleTitle article={a} className="news-item__title news-item__title--sm" />
                  <p className="news-item__excerpt news-item__excerpt--sm">{a.excerpt}</p>
                  <span className="news-item__date">{formatDate(a.createdAt)}</span>
                </div>
                {a.imageUrl ? (
                  <img className="news-item__thumb" src={`${BASE}${a.imageUrl}`} alt="" />
                ) : (
                  <div className="news-item__thumb" />
                )}
                <div className="news-item__divider" />
              </article>
            ))}
          </aside>
        )}

        {/* Center — featured */}
        <section className="home-grid__center">
          <article className="news-featured">
            <Link to={`/vest/${featuredArticle.slug}`} className="news-featured__image-link">
              <div className="news-featured__image">
                {featuredArticle.imageUrl ? (
                  <img className="news-featured__image-real" src={`${BASE}${featuredArticle.imageUrl}`} alt={featuredArticle.title} />
                ) : (
                  <div className="news-featured__image-placeholder">
                    <span className="news-featured__image-icon">🏛</span>
                  </div>
                )}
              </div>
            </Link>
            <div className="news-featured__body">
              <CategoryTag label={featuredArticle.category} />
              <Link to={`/vest/${featuredArticle.slug}`} className="news-featured__title-link">
                <h1 className="news-featured__title">{featuredArticle.title}</h1>
              </Link>
              <p className="news-featured__excerpt">{featuredArticle.excerpt}</p>
              <div className="news-featured__meta">
                <span className="news-featured__author">{featuredArticle.authorName}</span>
                <span className="news-featured__sep">·</span>
                <span className="news-featured__date">{formatDate(featuredArticle.createdAt)}</span>
              </div>
            </div>
          </article>
        </section>

        {/* Right column */}
        {rightArticles.length > 0 && (
          <aside className="home-grid__right">
            <div className="home-col-label">Ostale vesti</div>
            {rightArticles.map((a) => (
              <article key={a.id} className="news-item news-item--side">
                <div className="news-item__body">
                  <CategoryTag label={a.category} />
                  <ArticleTitle article={a} className="news-item__title news-item__title--sm" />
                  <p className="news-item__excerpt news-item__excerpt--sm">{a.excerpt}</p>
                  <span className="news-item__date">{formatDate(a.createdAt)}</span>
                </div>
                {a.imageUrl ? (
                  <img className="news-item__thumb" src={`${BASE}${a.imageUrl}`} alt="" />
                ) : (
                  <div className="news-item__thumb" />
                )}
                <div className="news-item__divider" />
              </article>
            ))}
          </aside>
        )}
      </div>

      {secondaryArticles.length > 0 && (
        <>
          <div className="home-section-divider">
            <span>Više aktuelnosti</span>
          </div>

          <div className="home-secondary">
            {secondaryArticles.map((a) => (
              <article key={a.id} className="news-card">
                {a.imageUrl ? (
                  <img className="news-card__image-placeholder" src={`${BASE}${a.imageUrl}`} alt="" />
                ) : (
                  <div className="news-card__image-placeholder" />
                )}
                <div className="news-card__body">
                  <CategoryTag label={a.category} />
                  <ArticleTitle article={a} className="news-card__title" />
                  <p className="news-card__excerpt">{a.excerpt}</p>
                  <span className="news-card__date">{formatDate(a.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
