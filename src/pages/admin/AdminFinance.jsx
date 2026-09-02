import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import Pagination from '../../components/admin/Pagination';
import AdminFinanceTabs from './AdminFinanceTabs';
import { formatAmount, formatDate, TYPE_LABELS } from './financeFormat';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLES, canManageFinance } from '../../constants/roles';
import ReadOnlyNotice from './ReadOnlyNotice';

const PAGE_SIZE = 20;

const initialFilters = { year: '', type: '', categoryId: '' };

export default function AdminFinance() {
  const { user } = useAuth();
  const canEdit = canManageFinance(user);

  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  useEffect(() => { loadCategories(); }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getFinanceEntries(filters);
        if (!cancelled) {
          setEntries(data);
          setPage(1);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [filters]);

  async function loadCategories() {
    try {
      setCategories(await api.getFinanceCategories());
    } catch (err) {
      setError(err.message);
    }
  }

  function updateFilter(field, value) {
    setFilters(prev => ({ ...prev, [field]: value }));
  }

  async function handleDelete(entry) {
    if (!window.confirm(`Obrisati stavku "${entry.description}"?`)) return;
    setActionError('');
    try {
      await api.deleteFinanceEntry(entry.id);
      setEntries(prev => prev.filter(e => e.id !== entry.id));
    } catch (err) {
      setActionError(err.message);
    }
  }

  // Years come from the entries themselves, so the filter can never offer a
  // year that has nothing behind it.
  const years = useMemo(
    () => [...new Set(entries.map(e => Number(e.date.slice(0, 4))))].sort((a, b) => b - a),
    [entries],
  );

  const totals = useMemo(() => ({
    income: entries.filter(e => e.type === 'Income').reduce((sum, e) => sum + e.amount, 0),
    expenses: entries.filter(e => e.type === 'Expense').reduce((sum, e) => sum + e.amount, 0),
  }), [entries]);

  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const visible = entries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="admin-news">
      <div className="admin-news__header">
        <h1 className="admin__title">Finansije</h1>
        {canEdit && <Link to="/admin/finance/new" className="btn btn--primary">+ Nova stavka</Link>}
      </div>

      {!canEdit && <ReadOnlyNotice owner={ROLE_LABELS[ROLES.FINANCE]} />}

      <AdminFinanceTabs />

      <div className="admin-filters">
        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="finance-year">Godina</label>
          <select
            id="finance-year"
            className="form-input"
            value={filters.year}
            onChange={e => updateFilter('year', e.target.value)}
          >
            <option value="">Sve godine</option>
            {years.map(year => <option key={year} value={year}>{year}.</option>)}
          </select>
        </div>

        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="finance-type">Tip</label>
          <select
            id="finance-type"
            className="form-input"
            value={filters.type}
            onChange={e => updateFilter('type', e.target.value)}
          >
            <option value="">Prihodi i rashodi</option>
            <option value="Income">Samo prihodi</option>
            <option value="Expense">Samo rashodi</option>
          </select>
        </div>

        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="finance-category">Kategorija</label>
          <select
            id="finance-category"
            className="form-input"
            value={filters.categoryId}
            onChange={e => updateFilter('categoryId', e.target.value)}
          >
            <option value="">Sve kategorije</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="admin-filters__actions">
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setFilters(initialFilters)}
          >
            Poništi filtere
          </button>
        </div>
      </div>

      {!loading && !error && (
        <p className="admin-filters__summary">
          {entries.length} stavki · prihodi {formatAmount(totals.income)} RSD ·
          {' '}rashodi {formatAmount(totals.expenses)} RSD ·
          {' '}bilans {formatAmount(totals.income - totals.expenses)} RSD
        </p>
      )}

      {actionError && <p className="admin-news__error">{actionError}</p>}
      {loading && <p className="admin-news__loading">Učitavanje...</p>}
      {error && <p className="admin-news__error">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="admin-news__empty">Nema stavki za izabrane filtere.</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <>
          <table className="admin-news__table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Opis</th>
                <th>Kategorija</th>
                <th>Tip</th>
                <th className="admin-finance__amount-cell">Iznos (RSD)</th>
                {canEdit && <th></th>}
              </tr>
            </thead>
            <tbody>
              {visible.map(entry => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.date)}</td>
                  <td className="admin-news__title-cell">{entry.description}</td>
                  <td>{entry.categoryName}</td>
                  <td>
                    <span className={`admin-finance__type admin-finance__type--${entry.type.toLowerCase()}`}>
                      {TYPE_LABELS[entry.type]}
                    </span>
                  </td>
                  <td className="admin-finance__amount-cell">{formatAmount(entry.amount)}</td>
                  {canEdit && (
                    <td>
                      <span className="admin-news__actions">
                        <Link to={`/admin/finance/${entry.id}/edit`} className="admin-news__action-btn">Izmeni</Link>
                        <button
                          className="admin-news__action-btn admin-news__action-btn--delete"
                          onClick={() => handleDelete(entry)}
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
