import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_LABELS, canManageAssembly } from '../../constants/roles';
import {
  SESSION_STATUS,
  SESSION_STATUS_TONES,
  formatSessionDateTime,
} from '../../constants/assembly';
import AdminAssemblyTabs from './AdminAssemblyTabs';
import ReadOnlyNotice from './ReadOnlyNotice';
import Pagination from '../../components/admin/Pagination';

const PAGE_SIZE = 20;

export default function AdminAssemblySessions() {
  const { user } = useAuth();
  const canEdit = canManageAssembly(user);

  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setSessions(await api.getAssemblySessions(status || undefined));
      setPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(session) {
    if (!window.confirm(`Obrisati sednicu "${session.title}"?`)) return;

    setActionError('');
    try {
      await api.deleteAssemblySession(session.id);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
    } catch (err) {
      setActionError(err.message);
      await load();
    }
  }

  const pageCount = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
  const visible = sessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="admin-news__header">
        <h1 className="admin__title">Skupština</h1>
        {canEdit && (
          <Link to="/admin/skupstina/sednice/nova" className="btn btn--primary">
            + Zakaži sednicu
          </Link>
        )}
      </div>

      {!canEdit && <ReadOnlyNotice owner={ROLE_LABELS[ROLES.ASSEMBLY]} />}

      <AdminAssemblyTabs />

      <div className="admin-filters">
        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="session-status">Status</label>
          <select
            id="session-status"
            className="form-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Sve sednice</option>
            {Object.values(SESSION_STATUS).map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
        {status && (
          <div className="admin-filters__actions">
            <button type="button" className="btn btn--outline" onClick={() => setStatus('')}>
              Poništi filtere
            </button>
          </div>
        )}
      </div>

      {actionError && <p className="admin-news__error">{actionError}</p>}
      {loading && <p className="admin-news__loading">Učitavanje...</p>}
      {error && <p className="admin-news__error">{error}</p>}

      {!loading && !error && sessions.length === 0 && (
        <p className="admin-news__empty">Nema sednica za izabrani filter.</p>
      )}

      {!loading && !error && sessions.length > 0 && (
        <>
          <table className="admin-news__table">
            <thead>
              <tr>
                <th>Sednica</th>
                <th>Termin</th>
                <th>Status</th>
                <th>Dolazi</th>
                <th>Tačaka</th>
                {canEdit && <th />}
              </tr>
            </thead>
            <tbody>
              {visible.map((session) => (
                <tr key={session.id}>
                  <td className="admin-news__title-cell">{session.title}</td>
                  <td>{formatSessionDateTime(session.scheduledAt)}</td>
                  <td>
                    <span className={`assembly-status assembly-status--${SESSION_STATUS_TONES[session.status]}`}>
                      {session.status}
                    </span>
                  </td>
                  <td>{session.rsvp.attending + session.rsvp.online}</td>
                  <td>{session.topicCount}</td>
                  {canEdit && (
                    <td>
                      <span className="admin-news__actions">
                        <Link
                          to={`/admin/skupstina/sednice/${session.id}/izmena`}
                          className="admin-news__action-btn"
                        >
                          Izmeni
                        </Link>
                        <button
                          type="button"
                          className="admin-news__action-btn admin-news__action-btn--delete"
                          onClick={() => handleDelete(session)}
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

          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
