import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import AdminFinanceTabs from './AdminFinanceTabs';
import { formatAmount, QUARTER_STATUSES } from './financeFormat';

const QUARTER_MONTHS = ['jan–mar', 'apr–jun', 'jul–sep', 'okt–dec'];

export default function AdminFinanceYears() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [savedYear, setSavedYear] = useState(null);
  const [savingYear, setSavingYear] = useState(null);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setYears(await api.getFinanceYears());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /** Edits stay local until "Sačuvaj" — a year is four fields, not four saves. */
  function updateYear(year, patch) {
    setYears(prev => prev.map(y => (y.year === year ? { ...y, ...patch } : y)));
  }

  async function handleSave(entry) {
    setSavingYear(entry.year);
    setActionError('');
    setSavedYear(null);
    try {
      await api.saveFinanceYear(entry.year, {
        memberCount: Number(entry.memberCount) || 0,
        reserveFund: Number(entry.reserveFund) || 0,
        reportUrl: entry.reportUrl?.trim() || null,
        isPublished: entry.isPublished,
      });
      setSavedYear(entry.year);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSavingYear(null);
    }
  }

  async function handleQuarterChange(year, quarter, status) {
    setActionError('');
    updateYear(year, {
      quarters: years.find(y => y.year === year).quarters
        .map(q => (q.quarter === quarter ? { ...q, status } : q)),
    });

    try {
      await api.saveFinanceQuarter(year, quarter, status);
    } catch (err) {
      setActionError(err.message);
      await load();
    }
  }

  async function handleAddYear(e) {
    e.preventDefault();
    const year = Number(newYear);

    if (years.some(y => y.year === year)) {
      setActionError(`Godina ${year}. već postoji na listi.`);
      return;
    }

    setActionError('');
    try {
      await api.saveFinanceYear(year, {
        memberCount: 0,
        reserveFund: 0,
        reportUrl: null,
        isPublished: false,
      });
      await load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <div className="admin-news">
      <div className="admin-news__header">
        <h1 className="admin__title">Finansije</h1>
      </div>

      <AdminFinanceTabs />

      <form onSubmit={handleAddYear} className="admin-filters admin-finance__new-year">
        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="new-year">Dodaj godinu</label>
          <input
            id="new-year"
            className="form-input"
            type="number"
            min="2000"
            max="2200"
            value={newYear}
            onChange={e => setNewYear(e.target.value)}
            required
          />
        </div>
        <div className="admin-filters__actions">
          <button className="btn btn--primary" type="submit">+ Dodaj godinu</button>
        </div>
      </form>

      {actionError && <p className="admin-news__error">{actionError}</p>}
      {loading && <p className="admin-news__loading">Učitavanje...</p>}
      {error && <p className="admin-news__error">{error}</p>}

      {!loading && !error && years.length === 0 && (
        <p className="admin-news__empty">Još nema nijedne godine. Dodajte prvu.</p>
      )}

      {!loading && !error && years.map(entry => (
        <section className="admin-finance__year" key={entry.year}>
          <header className="admin-finance__year-header">
            <h2 className="admin-finance__group-title">{entry.year}.</h2>
            <span className="admin-finance__year-totals">
              prihodi {formatAmount(entry.totalIncome)} RSD ·
              {' '}rashodi {formatAmount(entry.totalExpenses)} RSD ·
              {' '}bilans {formatAmount(entry.totalIncome - entry.totalExpenses)} RSD
            </span>
          </header>

          <p className="form-hint">
            Prihodi i rashodi se sabiraju iz stavki i ne unose se ovde.
          </p>

          <div className="admin-finance__year-fields">
            <div className="form-group">
              <label className="form-label" htmlFor={`members-${entry.year}`}>Aktivni članovi</label>
              <input
                id={`members-${entry.year}`}
                className="form-input"
                type="number"
                min="0"
                value={entry.memberCount}
                onChange={e => updateYear(entry.year, { memberCount: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor={`reserve-${entry.year}`}>Stanje fonda (RSD)</label>
              <input
                id={`reserve-${entry.year}`}
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                value={entry.reserveFund}
                onChange={e => updateYear(entry.year, { reserveFund: e.target.value })}
              />
            </div>

            <div className="form-group admin-finance__year-field--wide">
              <label className="form-label" htmlFor={`report-${entry.year}`}>
                Link ka godišnjem izveštaju <span className="form-optional">(opciono)</span>
              </label>
              <input
                id={`report-${entry.year}`}
                className="form-input"
                type="url"
                placeholder="https://..."
                value={entry.reportUrl ?? ''}
                onChange={e => updateYear(entry.year, { reportUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-finance__quarters">
            {entry.quarters.map(q => (
              <div className="form-group" key={q.quarter}>
                <label className="form-label" htmlFor={`q-${entry.year}-${q.quarter}`}>
                  Q{q.quarter} <span className="form-optional">({QUARTER_MONTHS[q.quarter - 1]})</span>
                </label>
                <select
                  id={`q-${entry.year}-${q.quarter}`}
                  className="form-input"
                  value={q.status}
                  onChange={e => handleQuarterChange(entry.year, q.quarter, e.target.value)}
                >
                  {QUARTER_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="admin-finance__year-actions">
            <label className="admin-news-form__checkbox">
              <input
                type="checkbox"
                checked={entry.isPublished}
                onChange={e => updateYear(entry.year, { isPublished: e.target.checked })}
              />
              Objavljeno (vidljivo na stranici Finansije)
            </label>

            <button
              className="btn btn--primary"
              type="button"
              onClick={() => handleSave(entry)}
              disabled={savingYear === entry.year}
            >
              {savingYear === entry.year ? 'Čuvanje...' : 'Sačuvaj godinu'}
            </button>

            {savedYear === entry.year && (
              <span className="admin-finance__saved">Sačuvano ✓</span>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
