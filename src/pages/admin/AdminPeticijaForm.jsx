import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, BASE } from '../../services/api';

const initialForm = {
  title: '',
  summary: '',
  body: '',
  recipient: '',
  imageUrl: '',
  goal: 1000,
  closesAt: '',
};

// <input type="datetime-local"> wants local wall-clock time with no zone; the
// API speaks ISO. These two are the whole conversion.
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPeticijaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!isEdit) return;

    api.getPetitionById(Number(id))
      .then((p) => {
        setForm({
          title: p.title,
          summary: p.summary,
          body: p.body,
          recipient: p.recipient,
          imageUrl: p.imageUrl || '',
          goal: p.goal,
          closesAt: toLocalInput(p.closesAt),
        });

        // The server refuses edits once anybody has signed, because the consent
        // named this text. Say so up front instead of on submit.
        setLocked(p.signatureCount > 0);
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      // Shared with the news uploader: same permitted roles, same folder, and
      // one endpoint is easier to keep safe than two.
      const result = await api.uploadNewsImage(file);
      update('imageUrl', result.url);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSubmitting(true);
    setSubmitError('');

    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      body: form.body.trim(),
      recipient: form.recipient.trim(),
      imageUrl: form.imageUrl.trim() || null,
      goal: Number(form.goal) || 0,
      closesAt: form.closesAt ? new Date(form.closesAt).toISOString() : null,
    };

    try {
      if (isEdit) await api.updatePetition(Number(id), payload);
      else await api.createPetition(payload);

      navigate('/admin/peticije');
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
      <h1 className="admin__title">{isEdit ? 'Izmena peticije' : 'Nova peticija'}</h1>

      {!isEdit && (
        <p className="admin__readonly" role="status">
          Peticija se snima kao <strong>nacrt</strong>. Objavljuje se posebnim dugmetom
          na spisku, jer se tekst zaključava čim je neko potpiše.
        </p>
      )}

      {locked && (
        <p className="admin-news__error">
          Ova peticija je već potpisana — tekst se više ne menja. Potpisnici su pristali
          upravo na ovaj tekst.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Naslov <span className="required-star">*</span></label>
          <input
            className="form-input"
            type="text"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            maxLength={200}
            disabled={locked}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Kome se peticija upućuje <span className="required-star">*</span>
          </label>
          <input
            className="form-input"
            type="text"
            value={form.recipient}
            onChange={(e) => update('recipient', e.target.value)}
            placeholder="npr. Gradska uprava Novog Sada"
            maxLength={200}
            disabled={locked}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kratak opis <span className="required-star">*</span></label>
          <textarea
            className="form-textarea"
            rows={3}
            value={form.summary}
            onChange={(e) => update('summary', e.target.value)}
            maxLength={600}
            disabled={locked}
            required
          />
          <span className="form-hint">Prikazuje se na spisku peticija i iznad teksta.</span>
        </div>

        <div className="form-group">
          <label className="form-label">Tekst peticije <span className="required-star">*</span></label>
          <textarea
            className="form-textarea"
            rows={14}
            value={form.body}
            onChange={(e) => update('body', e.target.value)}
            disabled={locked}
            required
          />
          <span className="form-hint">Prazan red razdvaja pasuse.</span>
        </div>

        <div className="form-group">
          <label className="form-label">Ciljani broj potpisa</label>
          <input
            className="form-input"
            type="number"
            min={0}
            value={form.goal}
            onChange={(e) => update('goal', e.target.value)}
            disabled={locked}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Rok za potpisivanje <span className="form-optional">(opciono)</span>
          </label>
          <input
            className="form-input"
            type="datetime-local"
            value={form.closesAt}
            onChange={(e) => update('closesAt', e.target.value)}
            disabled={locked}
          />
          <span className="form-hint">
            Posle ovog trenutka potpisivanje se odbija. Peticiju i dalje zatvarate ručno.
          </span>
        </div>

        <div className="form-group">
          <label className="form-label">Slika <span className="form-optional">(opciono)</span></label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={locked || uploading}
          />
          {uploading && <span className="form-hint">Otpremanje...</span>}
          {uploadError && <span className="form-error">{uploadError}</span>}
          {form.imageUrl && (
            <img className="admin-news-form__preview" src={`${BASE}${form.imageUrl}`} alt="Pregled" />
          )}
        </div>

        {submitError && <p className="admin-news__error">{submitError}</p>}

        <button
          className="btn btn--primary admin-news-form__submit"
          type="submit"
          disabled={submitting || uploading || locked}
        >
          {submitting ? 'Čuvanje...' : isEdit ? 'Sačuvaj izmene' : 'Sačuvaj kao nacrt'}
        </button>
      </form>
    </div>
  );
}
