import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLES, canManagePetitions } from '../../constants/roles';
import ReadOnlyNotice from './ReadOnlyNotice';

function formatDate(isoString) {
  const d = new Date(isoString);
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`;
}

export default function AdminPeticije() {
  const { user } = useAuth();
  const canEdit = canManagePetitions(user);

  const [petitions, setPetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setPetitions(await api.getPetitions());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(petition, status) {
    const question = status === 'Otvorena'
      ? `Otvoriti peticiju "${petition.title}" za potpisivanje?`
      : `Zatvoriti peticiju "${petition.title}"? Potpisivanje prestaje, a rok čuvanja `
        + 'potpisa (12 meseci) počinje da teče od danas.';

    if (!window.confirm(question)) return;

    setBusyId(petition.id);
    setActionError('');

    try {
      const updated = await api.setPetitionStatus(petition.id, status);
      setPetitions((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(petition) {
    if (!window.confirm(`Obrisati peticiju "${petition.title}"?`)) return;

    setActionError('');

    try {
      await api.deletePetition(petition.id);
      setPetitions((prev) => prev.filter((p) => p.id !== petition.id));
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleMove(id, direction) {
    setActionError('');
    try {
      setPetitions(await api.movePetition(id, direction));
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="admin-news">
      <div className="admin-news__header">
        <h1 className="admin__title">Peticije</h1>
        {canEdit && <Link to="/admin/peticije/nova" className="btn btn--primary">+ Nova peticija</Link>}
      </div>

      {!canEdit && <ReadOnlyNotice owner={ROLE_LABELS[ROLES.MODERATOR]} />}

      {actionError && <p className="admin-news__error">{actionError}</p>}
      {loading && <p className="admin-news__loading">Učitavanje...</p>}
      {error && <p className="admin-news__error">{error}</p>}

      {!loading && !error && petitions.length === 0 && (
        <p className="admin-news__empty">
          {canEdit ? 'Još nema peticija. Napravite prvu.' : 'Još nema peticija.'}
        </p>
      )}

      {!loading && !error && petitions.length > 0 && (
        <table className="admin-news__table">
          <thead>
            <tr>
              {canEdit && <th></th>}
              <th>Naslov</th>
              <th>Upućena</th>
              <th>Potpisa</th>
              <th>Datum</th>
              <th>Status</th>
              {canEdit && <th></th>}
            </tr>
          </thead>
          <tbody>
            {petitions.map((p, index) => (
              <tr key={p.id}>
                {canEdit && (
                  <td className="admin-news__move-cell">
                    <button
                      className="admin-news__move-btn"
                      disabled={index === 0}
                      onClick={() => handleMove(p.id, 'up')}
                      aria-label="Pomeri gore"
                      title="Pomeri gore"
                    >
                      ↑
                    </button>
                    <button
                      className="admin-news__move-btn"
                      disabled={index === petitions.length - 1}
                      onClick={() => handleMove(p.id, 'down')}
                      aria-label="Pomeri dole"
                      title="Pomeri dole"
                    >
                      ↓
                    </button>
                  </td>
                )}

                <td className="admin-news__title-cell">{p.title}</td>
                <td>{p.recipient}</td>
                <td>
                  {canEdit ? (
                    <Link to={`/admin/peticije/${p.id}/potpisi`}>
                      {p.signatureCount.toLocaleString('sr-RS')}
                    </Link>
                  ) : (
                    p.signatureCount.toLocaleString('sr-RS')
                  )}
                  {p.goal > 0 && <span className="admin-news__muted"> / {p.goal.toLocaleString('sr-RS')}</span>}
                </td>
                <td>{formatDate(p.createdAt)}</td>
                <td>
                  <span className={`admin-news__status${p.status === 'Otvorena' ? '' : ' admin-news__status--draft'}`}>
                    {p.status}
                  </span>
                </td>

                {canEdit && (
                  <td>
                    <span className="admin-news__actions">
                      {p.status === 'Nacrt' && (
                        <button
                          className="admin-news__action-btn"
                          disabled={busyId === p.id}
                          onClick={() => handleStatus(p, 'Otvorena')}
                        >
                          Objavi
                        </button>
                      )}

                      {p.status === 'Otvorena' && (
                        <button
                          className="admin-news__action-btn"
                          disabled={busyId === p.id}
                          onClick={() => handleStatus(p, 'Zatvorena')}
                        >
                          Zatvori
                        </button>
                      )}

                      <Link to={`/admin/peticije/${p.id}/izmena`} className="admin-news__action-btn">
                        Izmeni
                      </Link>

                      <Link to={`/admin/peticije/${p.id}/potpisi`} className="admin-news__action-btn">
                        Potpisi
                      </Link>

                      <button
                        className="admin-news__action-btn admin-news__action-btn--delete"
                        onClick={() => handleDelete(p)}
                      >
                        Obriši
                      </button>
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
