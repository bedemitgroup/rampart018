import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import AdminFinanceTabs from './AdminFinanceTabs';
import { COLOR_OPTIONS, TYPE_LABELS } from './financeFormat';

const emptyDraft = { name: '', type: 'Expense', color: 'primary', isActive: true };

function ColorSelect({ id, value, onChange }) {
  return (
    <span className="admin-finance__color-field">
      <span
        className="admin-finance__swatch"
        style={{ background: COLOR_OPTIONS.find(c => c.value === value)?.swatch }}
        aria-hidden="true"
      />
      <select id={id} className="form-input" value={value} onChange={e => onChange(e.target.value)}>
        {COLOR_OPTIONS.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    </span>
  );
}

export default function AdminFinanceCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [draft, setDraft] = useState(emptyDraft);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(emptyDraft);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setCategories(await api.getFinanceCategories());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setActionError('');
    try {
      await api.createFinanceCategory({ ...draft, name: draft.name.trim() });
      setDraft(emptyDraft);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function startEdit(category) {
    setEditingId(category.id);
    setEditDraft({
      name: category.name,
      type: category.type,
      color: category.color,
      isActive: category.isActive,
    });
    setActionError('');
  }

  async function handleSaveEdit(id) {
    setActionError('');
    try {
      await api.updateFinanceCategory(id, {
        name: editDraft.name.trim(),
        color: editDraft.color,
        isActive: editDraft.isActive,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDelete(category) {
    if (!window.confirm(`Obrisati kategoriju "${category.name}"?`)) return;
    setActionError('');
    try {
      await api.deleteFinanceCategory(category.id);
      await load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleMove(id, direction) {
    setActionError('');
    try {
      setCategories(await api.moveFinanceCategory(id, direction));
    } catch (err) {
      setActionError(err.message);
    }
  }

  function renderGroup(type) {
    const group = categories.filter(c => c.type === type);

    return (
      <section className="admin-finance__group" key={type}>
        <h2 className="admin-finance__group-title">
          {type === 'Income' ? 'Kategorije prihoda' : 'Kategorije rashoda'}
        </h2>

        {group.length === 0 ? (
          <p className="admin-news__empty">Još nema kategorija ovog tipa.</p>
        ) : (
          <table className="admin-news__table">
            <thead>
              <tr>
                <th></th>
                <th>Naziv</th>
                <th>Boja</th>
                <th>Stavki</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {group.map((category, index) => {
                const isEditing = editingId === category.id;

                return (
                  <tr key={category.id}>
                    <td className="admin-news__move-cell">
                      <button
                        className="admin-news__move-btn"
                        disabled={index === 0}
                        onClick={() => handleMove(category.id, 'up')}
                        aria-label={`Pomeri "${category.name}" gore`}
                        title="Pomeri gore"
                      >
                        ↑
                      </button>
                      <button
                        className="admin-news__move-btn"
                        disabled={index === group.length - 1}
                        onClick={() => handleMove(category.id, 'down')}
                        aria-label={`Pomeri "${category.name}" dole`}
                        title="Pomeri dole"
                      >
                        ↓
                      </button>
                    </td>

                    <td className="admin-news__title-cell">
                      {isEditing ? (
                        <input
                          className="form-input"
                          value={editDraft.name}
                          onChange={e => setEditDraft(p => ({ ...p, name: e.target.value }))}
                          aria-label="Naziv kategorije"
                        />
                      ) : category.name}
                    </td>

                    <td>
                      {isEditing ? (
                        <ColorSelect
                          value={editDraft.color}
                          onChange={color => setEditDraft(p => ({ ...p, color }))}
                        />
                      ) : (
                        <span className="admin-finance__color-field">
                          <span
                            className="admin-finance__swatch"
                            style={{ background: COLOR_OPTIONS.find(c => c.value === category.color)?.swatch }}
                            aria-hidden="true"
                          />
                          {COLOR_OPTIONS.find(c => c.value === category.color)?.label ?? category.color}
                        </span>
                      )}
                    </td>

                    <td>{category.entryCount}</td>

                    <td>
                      {isEditing ? (
                        <label className="admin-finance__inline-check">
                          <input
                            type="checkbox"
                            checked={editDraft.isActive}
                            onChange={e => setEditDraft(p => ({ ...p, isActive: e.target.checked }))}
                          />
                          Aktivna
                        </label>
                      ) : (
                        <span className={`admin-news__status${category.isActive ? '' : ' admin-news__status--draft'}`}>
                          {category.isActive ? 'Aktivna' : 'Neaktivna'}
                        </span>
                      )}
                    </td>

                    <td>
                      <span className="admin-news__actions">
                        {isEditing ? (
                          <>
                            <button
                              className="admin-news__action-btn"
                              onClick={() => handleSaveEdit(category.id)}
                            >
                              Sačuvaj
                            </button>
                            <button
                              className="admin-news__action-btn"
                              onClick={() => setEditingId(null)}
                            >
                              Odustani
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="admin-news__action-btn" onClick={() => startEdit(category)}>
                              Izmeni
                            </button>
                            <button
                              className="admin-news__action-btn admin-news__action-btn--delete"
                              onClick={() => handleDelete(category)}
                              disabled={category.entryCount > 0}
                              title={category.entryCount > 0
                                ? 'Kategorija ima unete stavke — deaktivirajte je umesto brisanja.'
                                : undefined}
                            >
                              Obriši
                            </button>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    );
  }

  return (
    <div className="admin-news">
      <div className="admin-news__header">
        <h1 className="admin__title">Finansije</h1>
      </div>

      <AdminFinanceTabs />

      <form onSubmit={handleCreate} className="admin-filters admin-finance__new-category">
        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="new-category-name">Naziv</label>
          <input
            id="new-category-name"
            className="form-input"
            value={draft.name}
            onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
            placeholder="npr. Zakup prostora"
            required
          />
        </div>

        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="new-category-type">Tip</label>
          <select
            id="new-category-type"
            className="form-input"
            value={draft.type}
            onChange={e => setDraft(p => ({ ...p, type: e.target.value }))}
          >
            <option value="Income">{TYPE_LABELS.Income}</option>
            <option value="Expense">{TYPE_LABELS.Expense}</option>
          </select>
        </div>

        <div className="admin-filters__group">
          <label className="admin-filters__label" htmlFor="new-category-color">Boja na grafikonu</label>
          <ColorSelect
            id="new-category-color"
            value={draft.color}
            onChange={color => setDraft(p => ({ ...p, color }))}
          />
        </div>

        <div className="admin-filters__actions">
          <button className="btn btn--primary" type="submit" disabled={creating}>
            {creating ? 'Dodavanje...' : '+ Dodaj kategoriju'}
          </button>
        </div>
      </form>

      {actionError && <p className="admin-news__error">{actionError}</p>}
      {loading && <p className="admin-news__loading">Učitavanje...</p>}
      {error && <p className="admin-news__error">{error}</p>}

      {!loading && !error && (
        <>
          {renderGroup('Income')}
          {renderGroup('Expense')}
        </>
      )}
    </div>
  );
}
