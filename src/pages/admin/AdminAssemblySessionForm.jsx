import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { isoToLocalInput, localInputToIso } from '../../constants/assembly';

const initialForm = {
  title: '',
  scheduledAt: '',
  location: '',
  onlineUrl: '',
  description: '',
  quorumRequired: '',
};

export default function AdminAssemblySessionForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isEdit) return undefined;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const session = await api.getAssemblySession(id);
        if (cancelled) return;
        setForm({
          title: session.title,
          scheduledAt: isoToLocalInput(session.scheduledAt),
          location: session.location ?? '',
          onlineUrl: session.onlineUrl ?? '',
          description: session.description ?? '',
          quorumRequired: session.quorumRequired == null ? '' : String(session.quorumRequired),
        });
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id, isEdit]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError('');

    if (!form.scheduledAt) {
      setSubmitError('Termin sednice je obavezan.');
      return;
    }

    const payload = {
      title: form.title,
      // The input gives naive local wall time; the server wants an instant, so
      // the browser's own zone does the conversion here rather than the server
      // guessing one.
      scheduledAt: localInputToIso(form.scheduledAt),
      location: form.location || null,
      onlineUrl: form.onlineUrl || null,
      description: form.description || null,
      quorumRequired: form.quorumRequired === '' ? null : Number(form.quorumRequired),
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await api.updateAssemblySession(id, payload);
      } else {
        await api.createAssemblySession(payload);
      }
      navigate('/admin/skupstina/sednice');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="admin-news__loading">Učitavanje...</p>;
  if (loadError) return <p className="admin-news__error">{loadError}</p>;

  return (
    <div className="admin-news-form">
      <div className="admin-news__header">
        <h1 className="admin__title">{isEdit ? 'Izmena sednice' : 'Nova sednica'}</h1>
        <button
          type="button"
          className="btn btn--outline"
          onClick={() => navigate('/admin/skupstina/sednice')}
        >
          ← Nazad na listu
        </button>
      </div>

      <form className="admin-news-form__form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="title">
            Naziv sednice <span className="required-star">*</span>
          </label>
          <input
            id="title"
            className="form-input"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="npr. Redovna sednica — septembar"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="scheduledAt">
            Termin <span className="required-star">*</span>
          </label>
          <input
            id="scheduledAt"
            type="datetime-local"
            className="form-input"
            value={form.scheduledAt}
            onChange={(e) => update('scheduledAt', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="location">
            Mesto <span className="form-optional">(opciono)</span>
          </label>
          <input
            id="location"
            className="form-input"
            value={form.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="npr. Kancelarija, Novi Sad"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="onlineUrl">
            Link za online učešće <span className="form-optional">(opciono)</span>
          </label>
          <input
            id="onlineUrl"
            type="url"
            className="form-input"
            value={form.onlineUrl}
            onChange={(e) => update('onlineUrl', e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="quorumRequired">
            Kvorum <span className="form-optional">(opciono)</span>
          </label>
          <input
            id="quorumRequired"
            type="number"
            min="0"
            className="form-input"
            value={form.quorumRequired}
            onChange={(e) => update('quorumRequired', e.target.value)}
            placeholder="npr. 5"
          />
          <p className="form-hint">
            Koliko članova mora biti prisutno. Prikazuje se kao informacija i ne
            blokira sednicu.
          </p>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">
            Napomena <span className="form-optional">(opciono)</span>
          </label>
          <textarea
            id="description"
            className="form-input"
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </div>

        {submitError && <p className="admin-news__error">{submitError}</p>}

        <button type="submit" className="btn btn--primary admin-news-form__submit" disabled={submitting}>
          {submitting ? 'Čuvanje...' : isEdit ? 'Sačuvaj izmene' : 'Zakaži sednicu'}
        </button>
      </form>
    </div>
  );
}
