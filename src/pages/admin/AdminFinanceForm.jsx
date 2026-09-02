import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { TYPE_LABELS } from './financeFormat';

function today() {
  return new Date().toISOString().slice(0, 10);
}

const initialForm = {
  categoryId: '',
  amount: '',
  date: today(),
  description: '',
};

export default function AdminFinanceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const list = await api.getFinanceCategories();
        setCategories(list);

        if (isEdit) {
          const entry = await api.getFinanceEntry(Number(id));
          setForm({
            categoryId: String(entry.categoryId),
            amount: String(entry.amount),
            date: entry.date,
            description: entry.description,
          });
        }
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        categoryId: Number(form.categoryId),
        amount: Number(form.amount),
        date: form.date,
        description: form.description.trim(),
      };

      if (isEdit) {
        await api.updateFinanceEntry(Number(id), payload);
      } else {
        await api.createFinanceEntry(payload);
      }
      navigate('/admin/finance');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="admin-news__loading">Učitavanje...</p>;
  if (loadError) return <p className="admin-news__error">{loadError}</p>;

  // An entry keeps the retired category it was filed under, but a new one can
  // only be booked against an active category.
  const selectable = categories.filter(c => c.isActive || String(c.id) === form.categoryId);
  const income = selectable.filter(c => c.type === 'Income');
  const expenses = selectable.filter(c => c.type === 'Expense');

  return (
    <div className="admin-news-form">
      <div className="admin-news__header">
        <h1 className="admin__title">{isEdit ? 'Izmeni stavku' : 'Nova stavka'}</h1>
        <Link to="/admin/finance" className="btn btn--outline">← Nazad na listu</Link>
      </div>

      {selectable.length === 0 ? (
        <p className="admin-news__empty">
          Nema aktivnih kategorija. Prvo dodajte kategoriju u sekciji{' '}
          <Link to="/admin/finance/categories">Kategorije</Link>.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="admin-news-form__form">
          <div className="form-group">
            <label className="form-label" htmlFor="entry-category">
              Kategorija <span className="required-star">*</span>
            </label>
            <select
              id="entry-category"
              className="form-input"
              value={form.categoryId}
              onChange={e => update('categoryId', e.target.value)}
              required
            >
              <option value="">— izaberite kategoriju —</option>
              <optgroup label={TYPE_LABELS.Income}>
                {income.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (neaktivna)'}</option>
                ))}
              </optgroup>
              <optgroup label={TYPE_LABELS.Expense}>
                {expenses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (neaktivna)'}</option>
                ))}
              </optgroup>
            </select>
            <p className="form-hint">
              Kategorija određuje da li je stavka prihod ili rashod.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="entry-amount">
              Iznos (RSD) <span className="required-star">*</span>
            </label>
            <input
              id="entry-amount"
              className="form-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="npr. 120000"
              value={form.amount}
              onChange={e => update('amount', e.target.value)}
              required
            />
            <p className="form-hint">Uvek pozitivan broj — smer određuje kategorija.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="entry-date">
              Datum <span className="required-star">*</span>
            </label>
            <input
              id="entry-date"
              className="form-input"
              type="date"
              value={form.date}
              onChange={e => update('date', e.target.value)}
              required
            />
            <p className="form-hint">Datum određuje godinu i kvartal u kojima se stavka prikazuje.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="entry-description">
              Opis <span className="required-star">*</span>
            </label>
            <textarea
              id="entry-description"
              className="form-input"
              rows={3}
              placeholder="npr. Zakup prostora za jul 2026."
              value={form.description}
              onChange={e => update('description', e.target.value)}
              required
            />
          </div>

          {submitError && <p className="admin-news__error">{submitError}</p>}

          <button
            className="btn btn--primary admin-news-form__submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Čuvanje...' : isEdit ? 'Sačuvaj izmene' : 'Dodaj stavku'}
          </button>
        </form>
      )}
    </div>
  );
}
