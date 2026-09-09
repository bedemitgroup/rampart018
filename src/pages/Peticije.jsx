import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Peticije.css';

function formatDate(isoString) {
  const d = new Date(isoString);
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`;
}

// "1 potpisa" on a campaign page reads like a bug in the campaign. Only the
// singular needs catching — every other count takes the same genitive — and 11
// is the exception that spoils the simple rule (11 potpisa, not 11 potpis).
export function signatureWord(count) {
  const isSingular = count % 10 === 1 && count % 100 !== 11;
  return isSingular ? 'potpis' : 'potpisa';
}

export function StatusBadge({ status }) {
  const modifier = {
    'Otvorena': 'open',
    'Zatvorena': 'closed',
    'Arhivirana': 'archived',
    'Nacrt': 'draft',
  }[status] || 'draft';

  return <span className={`peticije-badge peticije-badge--${modifier}`}>{status}</span>;
}

export function ProgressBar({ count, goal }) {
  if (!goal) return null;

  const percent = Math.min(100, Math.round((count / goal) * 100));

  return (
    <div className="peticije-progress">
      <div
        className="peticije-progress__track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${percent}% od cilja`}
      >
        <div className="peticije-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="peticije-progress__labels">
        <strong>{count.toLocaleString('sr-RS')} {signatureWord(count)}</strong>
        <span>cilj: {goal.toLocaleString('sr-RS')}</span>
      </div>
    </div>
  );
}

export default function Peticije() {
  const { user } = useAuth();
  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPetitions()
      .then(setPetitions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="peticije-page">
      <section className="page-hero">
        <div className="container page-hero__content">
          <span className="page-hero__badge">Peticije</span>

          <h1 className="page-hero__title">Potpiši ono što tražimo</h1>

          <p className="page-hero__subtitle">
            Peticija je najjednostavniji način da se vidi koliko nas ima iza jednog
            zahteva. Potpisivanje traje minut i zahteva nalog na sajtu.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading && <p className="peticije-status">Učitavanje peticija...</p>}

          {error && <p className="peticije-status peticije-status--error">{error}</p>}

          {!loading && !error && petitions.length === 0 && (
            <p className="peticije-status">Trenutno nema pokrenutih peticija.</p>
          )}

          <div className="peticije-grid">
            {petitions.map((p) => (
              <article key={p.id} className="peticija-card">
                {p.imageUrl && (
                  <Link to={`/peticije/${p.slug}`} className="peticija-card__image">
                    <img src={`${BASE}${p.imageUrl}`} alt="" />
                  </Link>
                )}

                <div className="peticija-card__body">
                  <div className="peticija-card__meta">
                    <StatusBadge status={p.status} />
                    <span className="peticija-card__date">{formatDate(p.createdAt)}</span>
                  </div>

                  <h2 className="peticija-card__title">
                    <Link to={`/peticije/${p.slug}`}>{p.title}</Link>
                  </h2>

                  <p className="peticija-card__recipient">
                    Upućena: <strong>{p.recipient}</strong>
                  </p>

                  <p className="peticija-card__summary">{p.summary}</p>

                  <ProgressBar count={p.signatureCount} goal={p.goal} />

                  <Link to={`/peticije/${p.slug}`} className="btn btn--primary peticija-card__cta">
                    {p.status === 'Otvorena' ? 'Pogledaj i potpiši' : 'Pogledaj peticiju'}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {user && (
            <p className="peticije-mine">
              <Link to="/moji-potpisi">Pregledaj svoje potpise i povuci pristanak →</Link>
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
