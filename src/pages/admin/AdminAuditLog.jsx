import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/admin/Pagination';
import ExportPdfModal from '../../components/admin/ExportPdfModal';
import { actionLabel, actionTone, entityLabel } from './auditLabels';
import { roleLabel } from '../../constants/roles';

const PAGE_SIZE = 25;

// The server caps a page at 100, so the export walks the log in chunks of that.
const EXPORT_CHUNK = 100;

// Cap on the "export everything" fetch. The log has no upper bound, so an
// unbounded export would eventually be a way to hang the browser.
const EXPORT_LIMIT = 5000;

const SEARCH_DEBOUNCE_MS = 300;

const initialFilters = {
  search: '',
  actorUserId: '',
  entityType: '',
  action: '',
  dateFrom: '',
  dateTo: '',
};

function formatDate(isoString) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('sr-RS', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function AdminAuditLog() {
  const { user } = useAuth();

  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState(initialFilters);
  // Kept apart from `filters` so typing does not fire a request per keystroke.
  const [search, setSearch] = useState('');

  const [options, setOptions] = useState({ actors: [], entityTypes: [], actions: [] });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [exportOpen, setExportOpen] = useState(false);
  const [exportRows, setExportRows] = useState([]);

  const isAdmin = user?.role === 'Admin';

  const buildQuery = useCallback(
    (overrides = {}) => ({
      search: filters.search,
      actorUserId: filters.actorUserId,
      entityType: filters.entityType,
      action: filters.action,
      from: filters.dateFrom,
      to: filters.dateTo,
      ...overrides,
    }),
    [filters],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.search === search ? prev : { ...prev, search }));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (!isAdmin) return undefined;

    // A stale response from a slower earlier request would otherwise overwrite
    // the newer one, since filters can change faster than the server replies.
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await api.getAuditLogs(buildQuery({ page, pageSize: PAGE_SIZE }));

        if (!active) return;

        setEntries(data.items);
        setTotal(data.total);
      } catch (err) {
        if (active) setError(err.message || 'Greška pri učitavanju dnevnika.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [isAdmin, buildQuery, page]);

  useEffect(() => {
    if (!isAdmin) return;

    api
      .getAuditLogFilters()
      .then(setOptions)
      // The dropdowns are a convenience; the table is the point. A failure here
      // leaves them empty rather than blocking the page.
      .catch(() => setOptions({ actors: [], entityTypes: [], actions: [] }));
  }, [isAdmin, total]);

  // AdminLayout lets moderators in; this page is admin-only.
  if (!isAdmin) return <Navigate to="/admin/news" replace />;

  function handleFilterChange(event) {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }

  function resetFilters() {
    setFilters(initialFilters);
    setSearch('');
  }

  async function handleExportOpen() {
    // Seeded with the visible page so the modal has something to export even if
    // the wider fetch below fails or is still running.
    setExportRows(entries);
    setExportOpen(true);

    try {
      const first = await api.getAuditLogs(buildQuery({ page: 1, pageSize: EXPORT_CHUNK }));

      const pageCount = Math.min(
        Math.ceil(first.total / EXPORT_CHUNK),
        Math.ceil(EXPORT_LIMIT / EXPORT_CHUNK),
      );

      const rest = await Promise.all(
        Array.from({ length: Math.max(pageCount - 1, 0) }, (unused, index) =>
          api.getAuditLogs(buildQuery({ page: index + 2, pageSize: EXPORT_CHUNK })),
        ),
      );

      setExportRows([...first.items, ...rest.flatMap((chunk) => chunk.items)]);
    } catch {
      // Leave the current page as the export set rather than failing the modal.
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="admin-news__header">
        <h1 className="admin__title">Dnevnik izmena</h1>
        <div className="admin-news__header-actions">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleExportOpen}
            disabled={total === 0}
          >
            Izvezi PDF
          </button>
        </div>
      </div>

      <p className="admin-audit__intro">
        Svaka izmena koju moderator ili administrator napravi nad vestima, finansijama
        i nalozima. Zapisi se ne mogu menjati ni brisati.
      </p>

      <div className="admin-filters">
        <div className="admin-filters__group admin-filters__group--wide">
          <label className="admin-filters__label" htmlFor="audit-search">
            Pretraga
          </label>
          <input
            id="audit-search"
            className="form-input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Korisnik ili naziv objekta"
          />
        </div>

        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="audit-actor">
            Korisnik
          </label>
          <select
            id="audit-actor"
            className="form-input"
            name="actorUserId"
            value={filters.actorUserId}
            onChange={handleFilterChange}
          >
            <option value="">Svi</option>
            {options.actors.map((actor) => (
              <option key={`${actor.userId}-${actor.username}`} value={actor.userId ?? ''}>
                {actor.username}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="audit-entity">
            Oblast
          </label>
          <select
            id="audit-entity"
            className="form-input"
            name="entityType"
            value={filters.entityType}
            onChange={handleFilterChange}
          >
            <option value="">Sve</option>
            {options.entityTypes.map((type) => (
              <option key={type} value={type}>
                {entityLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="audit-action">
            Akcija
          </label>
          <select
            id="audit-action"
            className="form-input"
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
          >
            <option value="">Sve</option>
            {options.actions.map((value) => (
              <option key={value} value={value}>
                {actionLabel(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="audit-from">
            Od
          </label>
          <input
            id="audit-from"
            className="form-input"
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={handleFilterChange}
          />
        </div>

        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="audit-to">
            Do
          </label>
          <input
            id="audit-to"
            className="form-input"
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={handleFilterChange}
          />
        </div>

        <div className="admin-filters__actions">
          <button type="button" className="btn btn--outline btn--sm" onClick={resetFilters}>
            Poništi filtere
          </button>
        </div>
      </div>

      <p className="admin-filters__summary">
        {total === 0 ? 'Nema zapisa' : `Ukupno zapisa: ${total}`}
      </p>

      {loading && <p className="admin-news__loading">Učitavanje...</p>}
      {error && <p className="admin-news__error">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="admin-news__empty">Nema zapisa za izabrane filtere.</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <table className="admin-news__table">
          <thead>
            <tr>
              <th>Vreme</th>
              <th>Korisnik</th>
              <th>Rola</th>
              <th>Akcija</th>
              <th>Objekat</th>
              <th>IP adresa</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.createdAt)}</td>
                <td className="admin-news__title-cell">{entry.actorUsername}</td>
                <td>{roleLabel(entry.actorRole)}</td>
                <td>
                  <span
                    className={`admin-audit__action admin-audit__action--${actionTone(entry.action)}`}
                  >
                    {actionLabel(entry.action)}
                  </span>
                </td>
                <td>
                  <span className="admin-audit__entity">{entityLabel(entry.entityType)}</span>
                  {entry.entityLabel && (
                    <span className="admin-audit__entity-label">{entry.entityLabel}</span>
                  )}
                </td>
                <td className="admin-audit__ip">{entry.ipAddress || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />

      <ExportPdfModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Dnevnik izmena"
        currentData={entries}
        allData={exportRows}
        filename="dnevnik-izmena"
        columns={[
          { label: 'Vreme', value: (entry) => formatDate(entry.createdAt) },
          { label: 'Korisnik', value: (entry) => entry.actorUsername },
          { label: 'Rola', value: (entry) => roleLabel(entry.actorRole) },
          { label: 'Akcija', value: (entry) => actionLabel(entry.action) },
          { label: 'Oblast', value: (entry) => entityLabel(entry.entityType) },
          { label: 'Objekat', value: (entry) => entry.entityLabel || '—' },
          { label: 'IP adresa', value: (entry) => entry.ipAddress || '—' },
        ]}
      />
    </div>
  );
}
