import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { ROLES } from '../../constants/roles';

// Staff are not silenced with a comment ban — a problem there is a role
// decision for an Admin. Mirrors Roles.Staff on the server.
const STAFF_ROLES = [ROLES.ADMIN, ROLES.MODERATOR, ROLES.FINANCE, ROLES.ASSEMBLY];

function formatDate(isoString) {
  const d = new Date(isoString);
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`;
}

// Comment moderation, all articles in one queue. Sits under the news list so a
// Moderator clears everything from the same screen he writes the news on.
export default function AdminCommentsPanel() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setPending(await api.getPendingComments());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id) {
    setActionError('');
    setBusyId(id);
    try {
      await api.approveComment(id);
      setPending(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Obrisati ovaj komentar?')) return;
    setActionError('');
    setActionNote('');
    setBusyId(id);
    try {
      await api.deleteComment(id);
      setPending(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  // The rule-breaking case: bar the author for 10 days and bin the comment that
  // earned it, in one step.
  async function handleBan(comment) {
    if (!window.confirm(
      `Zabraniti korisniku „${comment.username}" komentarisanje na 10 dana? ` +
      `Ovaj komentar će biti obrisan.`
    )) return;
    setActionError('');
    setActionNote('');
    setBusyId(comment.id);
    try {
      const res = await api.banCommenter(comment.authorUserId);
      await api.deleteComment(comment.id);
      setPending(prev => prev.filter(c => c.id !== comment.id));
      setActionNote(res.message);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="admin-comments">
      <div className="admin-comments__header">
        <h2 className="admin-comments__title">
          Komentari na čekanju
          {!loading && !error && (
            <span className="admin-comments__count">{pending.length}</span>
          )}
        </h2>
        <button className="admin-comments__refresh" onClick={load} disabled={loading}>
          Osveži
        </button>
      </div>

      {loading && <p className="admin-news__loading">Učitavanje...</p>}
      {error && <p className="admin-news__error">{error}</p>}
      {actionError && <p className="admin-news__error">{actionError}</p>}
      {actionNote && <p className="admin-comments__note">{actionNote}</p>}

      {!loading && !error && pending.length === 0 && (
        <p className="admin-news__empty">Nema komentara na čekanju.</p>
      )}

      {!loading && !error && pending.length > 0 && (
        <ul className="admin-comments__list">
          {pending.map(c => (
            <li key={c.id} className="admin-comments__item">
              <div className="admin-comments__meta">
                <span className="admin-comments__author">{c.username}</span>
                {c.authorBannedUntil && new Date(c.authorBannedUntil) > new Date() && (
                  <span className="admin-comments__banned">
                    zabranjeno do {formatDate(c.authorBannedUntil)}
                  </span>
                )}
                <span className="admin-comments__sep">·</span>
                <span className="admin-comments__date">{formatDate(c.createdAt)}</span>
                <span className="admin-comments__sep">·</span>
                {c.vestTitle ? (
                  <Link to={`/vest/${c.vestSlug}`} className="admin-comments__vest" target="_blank">
                    {c.vestTitle}
                  </Link>
                ) : (
                  <span className="admin-comments__vest">{c.vestSlug}</span>
                )}
              </div>
              <p className="admin-comments__content">{c.content}</p>
              <div className="admin-comments__actions">
                <button
                  className="btn btn--secondary btn--sm"
                  onClick={() => handleApprove(c.id)}
                  disabled={busyId === c.id}
                >
                  Odobri
                </button>
                <button
                  className="admin-news__action-btn admin-news__action-btn--delete"
                  onClick={() => handleDelete(c.id)}
                  disabled={busyId === c.id}
                >
                  Obriši
                </button>
                {!STAFF_ROLES.includes(c.authorRole) && (
                  <button
                    className="admin-news__action-btn admin-news__action-btn--delete"
                    onClick={() => handleBan(c)}
                    disabled={busyId === c.id}
                  >
                    Banuj korisnika na 10 dana
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
