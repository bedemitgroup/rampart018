import { Link } from 'react-router-dom';
import { vesti } from '../data/vesti';
import './Home.css';

const featuredArticle = vesti[0];
const leftArticles   = [vesti[1], vesti[2], vesti[3]];
const rightArticles  = [vesti[4], vesti[5], {
  slug: null,
  category: 'Mediji',
  categoryColor: 'primary',
  date: '10. jul 2026.',
  title: 'Bedem u N1: razgovor o novom zakonu o udruženjima',
  excerpt: 'Predsednica Bedema gostovala je u emisiji Pressing i govorila o predloženim izmenama.',
}];
const secondaryArticles = [vesti[3], vesti[4], vesti[5], vesti[1]];

const categoryColors = {
  primary:   'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent:    'var(--color-accent)',
  accent2:   'var(--color-accent2)',
};

function CategoryTag({ label, color }) {
  return (
    <span className="news-category" style={{ color: categoryColors[color] || categoryColors.primary }}>
      {label}
    </span>
  );
}

function ArticleTitle({ article, className }) {
  if (article.slug) {
    return (
      <Link to={`/vest/${article.slug}`} className={`news-title-link ${className || ''}`}>
        {article.title}
      </Link>
    );
  }
  return <span className={className}>{article.title}</span>;
}

export default function Home() {
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

      {/* Main news grid */}
      <main className="container home-main">
        <div className="home-grid">

          {/* Left column */}
          <aside className="home-grid__left">
            <div className="home-col-label">Vesti</div>
            {leftArticles.map((a) => (
              <article key={a.title} className="news-item news-item--side">
                <div className="news-item__body">
                  <CategoryTag label={a.category} color={a.categoryColor} />
                  <ArticleTitle article={a} className="news-item__title news-item__title--sm" />
                  <p className="news-item__excerpt news-item__excerpt--sm">{a.excerpt}</p>
                  <span className="news-item__date">{a.date}</span>
                </div>
                <div className="news-item__thumb" />
                <div className="news-item__divider" />
              </article>
            ))}
          </aside>

          {/* Center — featured */}
          <section className="home-grid__center">
            <article className="news-featured">
              <Link to={`/vest/${featuredArticle.slug}`} className="news-featured__image-link">
                <div className="news-featured__image">
                  <div className="news-featured__image-placeholder">
                    <span className="news-featured__image-icon">🏛</span>
                    <span className="news-featured__image-caption">
                      Protest ispred Višeg suda u Beogradu
                    </span>
                  </div>
                </div>
              </Link>
              <div className="news-featured__body">
                <CategoryTag label={featuredArticle.category} color={featuredArticle.categoryColor} />
                <Link to={`/vest/${featuredArticle.slug}`} className="news-featured__title-link">
                  <h1 className="news-featured__title">{featuredArticle.title}</h1>
                </Link>
                <p className="news-featured__excerpt">{featuredArticle.excerpt}</p>
                <div className="news-featured__meta">
                  <span className="news-featured__author">{featuredArticle.author}</span>
                  <span className="news-featured__sep">·</span>
                  <span className="news-featured__date">{featuredArticle.date}</span>
                  <span className="news-featured__sep">·</span>
                  <span className="news-featured__read">{featuredArticle.readTime}</span>
                </div>
              </div>
            </article>
          </section>

          {/* Right column */}
          <aside className="home-grid__right">
            <div className="home-col-label">Upozorenja i događaji</div>
            {rightArticles.map((a) => (
              <article key={a.title} className="news-item news-item--side">
                <div className="news-item__body">
                  <CategoryTag label={a.category} color={a.categoryColor} />
                  <ArticleTitle article={a} className="news-item__title news-item__title--sm" />
                  <p className="news-item__excerpt news-item__excerpt--sm">{a.excerpt}</p>
                  <span className="news-item__date">{a.date}</span>
                </div>
                <div className="news-item__thumb" />
                <div className="news-item__divider" />
              </article>
            ))}
          </aside>
        </div>

        {/* Divider */}
        <div className="home-section-divider">
          <span>Više aktuelnosti</span>
        </div>

        {/* Secondary grid */}
        <div className="home-secondary">
          {secondaryArticles.map((a) => (
            <article key={a.slug} className="news-card">
              <div className="news-card__image-placeholder" />
              <div className="news-card__body">
                <CategoryTag label={a.category} color={a.categoryColor} />
                <ArticleTitle article={a} className="news-card__title" />
                <p className="news-card__excerpt">{a.excerpt}</p>
                <span className="news-card__date">{a.date}</span>
              </div>
            </article>
          ))}
        </div>

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
