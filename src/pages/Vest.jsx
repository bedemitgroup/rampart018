import { useParams, Link, useNavigate } from 'react-router-dom';
import { getVest, vesti } from '../data/vesti';
import Comments from '../components/Comments';
import './Vest.css';

const categoryColors = {
  primary: 'var(--color-primary)',
  secondary: 'var(--color-secondary)',
  accent: 'var(--color-accent)',
  accent2: 'var(--color-accent2)',
};

export default function Vest() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const vest = getVest(slug);

  if (!vest) {
    return (
      <div className="vest-notfound">
        <h1>Vest nije pronađena</h1>
        <Link to="/" className="btn btn--primary">Nazad na početnu</Link>
      </div>
    );
  }

  const ostaleVesti = vesti.filter((v) => v.slug !== slug).slice(0, 3);

  return (
    <div className="vest-page">
      <div className="container vest-container">

        {/* Breadcrumb */}
        <nav className="vest-breadcrumb">
          <button onClick={() => navigate(-1)} className="vest-back">← Nazad</button>
          <span className="vest-breadcrumb__sep">/</span>
          <span
            className="vest-breadcrumb__cat"
            style={{ color: categoryColors[vest.categoryColor] }}
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
                style={{ color: categoryColors[vest.categoryColor] }}
              >
                {vest.category}
              </span>
              <h1 className="vest-title">{vest.title}</h1>
              <p className="vest-excerpt">{vest.excerpt}</p>
              <div className="vest-meta">
                <span className="vest-meta__author">{vest.author}</span>
                <span className="vest-meta__sep">·</span>
                <span className="vest-meta__date">{vest.date}</span>
                <span className="vest-meta__sep">·</span>
                <span className="vest-meta__read">{vest.readTime}</span>
              </div>
            </header>

            {/* Image */}
            <figure className="vest-figure">
              <div className="vest-image-placeholder">
                <span className="vest-image-icon">📰</span>
              </div>
              {vest.imageCaption && (
                <figcaption className="vest-figcaption">{vest.imageCaption}</figcaption>
              )}
            </figure>

            {/* Body */}
            <div className="vest-body">
              {vest.body.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Tags */}
            {vest.tags?.length > 0 && (
              <div className="vest-tags">
                {vest.tags.map((tag) => (
                  <span key={tag} className="vest-tag">{tag}</span>
                ))}
              </div>
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
                  style={{ color: categoryColors[v.categoryColor] }}
                >
                  {v.category}
                </span>
                <h3 className="vest-sidebar__title">{v.title}</h3>
                <span className="vest-sidebar__date">{v.date}</span>
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
