import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import './Peticije.css';
import './MojiPotpisi.css';

function formatDate(isoString) {
  const d = new Date(isoString);
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`;
}

/**
 * Everything this account has signed, and the button that undoes it.
 *
 * Two rights live on this one page: the right to know what is held (čl. 26
 * ZZPL) — hence the stored consent text is shown verbatim rather than
 * summarised — and the right to withdraw consent as easily as it was given
 * (čl. 23), which here is one click plus a confirmation.
 */
export default function MojiPotpisi() {
  const { user, loading: authLoading } = useAuth();

  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    api.getMyPetitionSignatures()
      .then(setSignatures)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  async function handleWithdraw(petitionId, title) {
    if (!window.confirm(
      `Povlačenjem pristanka vaš potpis na peticiji "${title}" se briše i više se ne broji. Nastaviti?`
    )) return;

    setBusyId(petitionId);
    setError('');

    try {
      await api.withdrawPetitionSignature(petitionId);
      setSignatures((prev) => prev.filter((s) => s.petitionId !== petitionId));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || loading) {
    return <p className="peticije-status">Učitavanje...</p>;
  }

  return (
    <div className="moji-potpisi-page">
      <section className="page-hero">
        <div className="container page-hero__content">
          <span className="page-hero__badge">Moji potpisi</span>
          <h1 className="page-hero__title">Šta ste potpisali</h1>
          <p className="page-hero__subtitle">
            Ovde vidite svaki svoj potpis i tačan tekst saglasnosti koji ste dali.
            Pristanak možete povući u svakom trenutku — potpis se tada briše.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {!user && (
            <div className="moji-potpisi-empty">
              <p>Prijavite se da biste videli svoje potpise.</p>
              <button type="button" className="btn btn--primary" onClick={() => setShowAuth(true)}>
                Prijavi se
              </button>
            </div>
          )}

          {user && error && <p className="peticije-status peticije-status--error">{error}</p>}

          {user && !error && signatures.length === 0 && (
            <div className="moji-potpisi-empty">
              <p>Još niste potpisali nijednu peticiju.</p>
              <Link to="/peticije" className="btn btn--primary">Pogledaj peticije</Link>
            </div>
          )}

          <ul className="moji-potpisi-list">
            {signatures.map((s) => (
              <li key={s.petitionId} className="moji-potpisi-item">
                <div className="moji-potpisi-item__head">
                  <div>
                    <h2 className="moji-potpisi-item__title">
                      <Link to={`/peticije/${s.slug}`}>{s.title}</Link>
                    </h2>
                    <p className="moji-potpisi-item__date">
                      Potpisano {formatDate(s.signedAt)} · {s.petitionStatus}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    onClick={() => handleWithdraw(s.petitionId, s.title)}
                    disabled={busyId === s.petitionId}
                  >
                    {busyId === s.petitionId ? 'Povlačimo...' : 'Povuci potpis'}
                  </button>
                </div>

                <dl className="moji-potpisi-item__data">
                  <div>
                    <dt>Ime i prezime</dt>
                    <dd>{s.firstName} {s.lastName}</dd>
                  </div>
                  <div>
                    <dt>Grad</dt>
                    <dd>{s.city}</dd>
                  </div>
                  <div>
                    <dt>Javno prikazano</dt>
                    <dd>{s.publicDisplay ? 'Da' : 'Ne'}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  className="moji-potpisi-item__toggle"
                  onClick={() => setExpanded(expanded === s.petitionId ? null : s.petitionId)}
                >
                  {expanded === s.petitionId ? 'Sakrij' : 'Prikaži'} tekst saglasnosti koji ste dali
                </button>

                {expanded === s.petitionId && (
                  <blockquote className="moji-potpisi-item__consent">
                    {s.consentText}
                    <footer>Verzija teksta: {s.consentVersion}</footer>
                  </blockquote>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
