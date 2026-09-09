import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api, BASE } from '../services/api';
import Comments from '../components/Comments';
import './Vest.css';

const categoryColors = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  accent2: 'var(--color-accent2)',
};
const colorKeys = Object.keys(categoryColors);

function categoryColorFor(category) {
  let hash = 0;
  for (let i = 0; i < category.length; i++) hash = (hash * 31 + category.charCodeAt(i)) | 0;
  return colorKeys[Math.abs(hash) % colorKeys.length];
}

function sourceHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function formatDate(isoString) {
  const d = new Date(isoString);
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`;
}

export default function Vest() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [vest, setVest] = useState(null);
  const [ostaleVesti, setOstaleVesti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setVest(null);

    api.getNewsBySlug(slug)
      .then(setVest)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    api.getNews()
      .then(list => setOstaleVesti(list.filter(v => v.slug !== slug).slice(0, 3)))
      .catch(() => {});
  }, [slug]);

  if (loading) {
    return <p className="vest-status">Učitavanje vesti...</p>;
  }

  if (notFound || !vest) {
    return (
      <div className="vest-notfound">
        <h1>Vest nije pronađena</h1>
        <Link to="/" className="btn btn--primary">Nazad na početnu</Link>
      </div>
    );
  }

  const catColor = categoryColorFor(vest.category);
  const paragraphs = vest.body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="vest-page">
      <div className="container vest-container">

        {/* Breadcrumb */}
        <nav className="vest-breadcrumb">
          <button onClick={() => navigate(-1)} className="vest-back">← Nazad</button>
          <span className="vest-breadcrumb__sep">/</span>
          <span
            className="vest-breadcrumb__cat"
            style={{ color: categoryColors[catColor] }}
          >
            {vest.category}
          </span>
        </nav>

        <div className="vest-layout">
          {/* Article */}
          <article className="vest-article">
            <header className="vest-header">
              <span
                className="vest-category"
                style={{ color: categoryColors[catColor] }}
              >
                {vest.category}
              </span>
              <h1 className="vest-title">{vest.title}</h1>
              <p className="vest-excerpt">{vest.excerpt}</p>
              <div className="vest-meta">
                <span className="vest-meta__author">{vest.authorName}</span>
                <span className="vest-meta__sep">·</span>
                <span className="vest-meta__date">{formatDate(vest.createdAt)}</span>
              </div>
            </header>

            {/* Image */}
            <figure className="vest-figure">
              {vest.imageUrl ? (
                <img className="vest-image-real" src={`${BASE}${vest.imageUrl}`} alt={vest.title} />
              ) : (
                <div className="vest-image-placeholder">
                  <span className="vest-image-icon">📰</span>
                </div>
              )}
            </figure>

            {/* Body */}
            <div className="vest-body">
              {paragraphs.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Source */}
            {vest.sourceUrl && (
              <p className="vest-source">
                Izvor:{' '}
                <a href={vest.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {sourceHostname(vest.sourceUrl)}
                </a>
              </p>
            )}

            {/* Comments */}
            <div className="vest-comments">
              <h2 className="vest-comments__heading">Komentari</h2>
              <Comments vestSlug={vest.slug} />
            </div>

            {/* CTA */}
            <div className="vest-cta">
              <p>Imate sličan problem ili informaciju koja bi mogla da pomogne?</p>
              <div className="vest-cta__actions">
                <Link to="/problem" className="btn btn--primary">Podeli problem</Link>
                <Link to="/pridruzi-se" className="btn btn--outline">Postani član</Link>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="vest-sidebar">
            <div className="vest-sidebar__label">Više vesti</div>
            {ostaleVesti.map((v) => (
              <Link key={v.slug} to={`/vest/${v.slug}`} className="vest-sidebar__item">
                <span
                  className="vest-sidebar__cat"
                  style={{ color: categoryColors[categoryColorFor(v.category)] }}
                >
                  {v.category}
                </span>
                <h3 className="vest-sidebar__title">{v.title}</h3>
                <span className="vest-sidebar__date">{formatDate(v.createdAt)}</span>
                <div className="vest-sidebar__divider" />
              </Link>
            ))}
            <Link to="/" className="vest-sidebar__all">Sve vesti →</Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
