import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, BASE } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PetitionSignForm from '../components/PetitionSignForm';
import { ProgressBar, StatusBadge, signatureWord } from './Peticije';
import './Peticije.css';
import './Peticija.css';

function formatDate(isoString) {
  const d = new Date(isoString);
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`;
}

const SIGNATURES_PAGE_SIZE = 50;

export default function Peticija() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [petition, setPetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [signatures, setSignatures] = useState(null);
  const [signaturesPage, setSignaturesPage] = useState(1);

  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setPetition(null);
    setSignaturesPage(1);

    api.getPetitionBySlug(slug)
      .then(setPetition)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadSignatures = useCallback(() => {
    api.getPetitionSignatures(slug, signaturesPage, SIGNATURES_PAGE_SIZE)
      .then(setSignatures)
      .catch(() => setSignatures(null));
  }, [slug, signaturesPage]);

  useEffect(() => {
    if (!petition) return;
    loadSignatures();
  }, [petition, loadSignatures]);

  function handleSigned(count) {
    setPetition((prev) => prev && {
      ...prev,
      viewerHasSigned: true,
      signatureCount: count ?? prev.signatureCount + 1,
    });
    loadSignatures();
  }

  async function handleWithdraw() {
    if (!window.confirm(
      'Povlačenjem pristanka vaš potpis se briše i više se ne broji. Nastaviti?'
    )) return;

    setWithdrawing(true);
    setWithdrawError('');

    try {
      const data = await api.withdrawPetitionSignature(petition.id);

      setPetition((prev) => prev && {
        ...prev,
        viewerHasSigned: false,
        signatureCount: data?.signatureCount ?? Math.max(0, prev.signatureCount - 1),
      });

      loadSignatures();
    } catch (err) {
      setWithdrawError(err.message);
    } finally {
      setWithdrawing(false);
    }
  }

  if (loading) return <p className="peticija-status">Učitavanje peticije...</p>;

  if (notFound || !petition) {
    return (
      <div className="peticija-notfound">
        <h1>Peticija nije pronađena</h1>
        <Link to="/peticije" className="btn btn--primary">Sve peticije</Link>
      </div>
    );
  }

  const paragraphs = petition.body.split(/\n\n+/).filter(Boolean);
  const canSign = !petition.signBlockedReason && !petition.viewerHasSigned;
  const pageCount = signatures ? Math.ceil(signatures.total / signatures.pageSize) : 0;

  return (
    <div className="peticija-page">
      <div className="container peticija-container">
        <nav className="peticija-breadcrumb">
          <button type="button" className="peticija-breadcrumb__back" onClick={() => navigate(-1)}>
            ← Nazad
          </button>
          <Link to="/peticije">Peticije</Link>
        </nav>

        <div className="peticija-layout">
          <article className="peticija-article">
            <div className="peticija-article__meta">
              <StatusBadge status={petition.status} />
              <span>{formatDate(petition.createdAt)}</span>
            </div>

            <h1 className="peticija-article__title">{petition.title}</h1>

            <p className="peticija-article__recipient">
              Upućena: <strong>{petition.recipient}</strong>
            </p>

            {petition.imageUrl && (
              <img className="peticija-article__image" src={`${BASE}${petition.imageUrl}`} alt="" />
            )}

            <p className="peticija-article__summary">{petition.summary}</p>

            <div className="peticija-article__body">
              {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
            </div>

            {petition.status === 'Arhivirana' && (
              <p className="peticija-article__archived">
                Ova peticija je arhivirana. Potpisi su obrisani po isteku roka čuvanja,
                a sačuvan je samo njihov ukupan broj.
              </p>
            )}

            {/* Only ever the people who ticked the second box. Everyone else is
                in the counter above and nowhere else. */}
            {signatures && signatures.total > 0 && (
              <section className="peticija-signatories">
                <h2 className="peticija-signatories__title">
                  Javno potpisani ({signatures.total.toLocaleString('sr-RS')})
                </h2>

                <p className="peticija-signatories__note">
                  Prikazani su samo potpisnici koji su posebno pristali na javno
                  objavljivanje. Ukupan broj potpisa je veći.
                </p>

                <ul className="peticija-signatories__list">
                  {signatures.items.map((s, i) => (
                    <li key={`${s.signedAt}-${i}`}>
                      <strong>{s.firstName} {s.lastName}</strong>
                      <span>{s.city}</span>
                    </li>
                  ))}
                </ul>

                {pageCount > 1 && (
                  <div className="peticija-signatories__pager">
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      disabled={signaturesPage <= 1}
                      onClick={() => setSignaturesPage((p) => p - 1)}
                    >
                      Prethodna
                    </button>
                    <span>{signaturesPage} / {pageCount}</span>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      disabled={signaturesPage >= pageCount}
                      onClick={() => setSignaturesPage((p) => p + 1)}
                    >
                      Sledeća
                    </button>
                  </div>
                )}
              </section>
            )}
          </article>

          <aside className="peticija-sidebar">
            <div className="peticija-counter">
              <div className="peticija-counter__number">
                {petition.signatureCount.toLocaleString('sr-RS')}
              </div>
              <div className="peticija-counter__word">{signatureWord(petition.signatureCount)}</div>

              <ProgressBar count={petition.signatureCount} goal={petition.goal} />

              {petition.closesAt && petition.status === 'Otvorena' && (
                <p className="peticija-counter__deadline">
                  Potpisivanje traje do {formatDate(petition.closesAt)}
                </p>
              )}
            </div>

            {petition.viewerHasSigned ? (
              <div className="peticija-signed">
                <p className="peticija-signed__text">Potpisali ste ovu peticiju. Hvala.</p>

                {withdrawError && <p className="form-error">{withdrawError}</p>}

                {/* Withdrawal has to be as easy as consenting was (čl. 23 ZZPL),
                    so it lives here, next to the signature, and not buried in
                    account settings. */}
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                >
                  {withdrawing ? 'Povlačimo...' : 'Povuci potpis'}
                </button>

                <Link to="/moji-potpisi" className="peticija-signed__link">
                  Svi moji potpisi →
                </Link>
              </div>
            ) : canSign ? (
              <PetitionSignForm petition={petition} onSigned={handleSigned} />
            ) : (
              <div className="peticija-closed">
                <p>{petition.signBlockedReason}</p>
                <Link to="/peticije" className="btn btn--secondary btn--sm">
                  Ostale peticije
                </Link>
              </div>
            )}

            {!user && (
              <p className="peticija-sidebar__hint">
                Nemate nalog? Registracija traje minut i potrebna je samo email adresa.
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
