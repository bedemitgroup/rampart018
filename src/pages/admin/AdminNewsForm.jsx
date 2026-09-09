import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, BASE } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const initialForm = {
  title: '',
  excerpt: '',
  body: '',
  category: '',
  authorName: '',
  imageUrl: null,
  sourceUrl: '',
  isPublished: true,
};

export default function AdminNewsForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(() => ({ ...initialForm, authorName: isEdit ? '' : (user?.username || '') }));
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const list = await api.getNews();
        const item = list.find(n => n.id === Number(id));
        if (!item) throw new Error('Vest nije pronađena.');
        const detail = await api.getNewsBySlug(item.slug);
        setForm({
          title: detail.title,
          excerpt: detail.excerpt,
          body: detail.body,
          category: detail.category,
          authorName: detail.authorName,
          imageUrl: detail.imageUrl,
          sourceUrl: detail.sourceUrl || '',
          isPublished: detail.isPublished,
        });
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

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
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
    try {
      const payload = {
        title: form.title.trim(),
        excerpt: form.excerpt.trim(),
        body: form.body.trim(),
        category: form.category.trim(),
        authorName: form.authorName.trim(),
        imageUrl: form.imageUrl,
        sourceUrl: form.sourceUrl.trim() || null,
        isPublished: form.isPublished,
      };
      if (isEdit) {
        await api.updateNews(Number(id), payload);
      } else {
        await api.createNews(payload);
      }
      navigate('/admin/news');
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
        <h1 className="admin__title">{isEdit ? 'Izmeni vest' : 'Nova vest'}</h1>
        <Link to="/admin/news" className="btn btn--outline">← Nazad na listu</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-news-form__form">
        <div className="form-group">
          <label className="form-label">Naslov <span className="required-star">*</span></label>
          <input
            className="form-input"
            type="text"
            value={form.title}
            onChange={e => update('title', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kratak opis <span className="required-star">*</span></label>
          <textarea
            className="form-input"
            rows={2}
            value={form.excerpt}
            onChange={e => update('excerpt', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kategorija <span className="required-star">*</span></label>
          <input
            className="form-input"
            type="text"
            placeholder="npr. Akcija, Transparentnost, Upozorenje..."
            value={form.category}
            onChange={e => update('category', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Autor <span className="required-star">*</span></label>
          <input
            className="form-input"
            type="text"
            placeholder="npr. Pravni tim Bedema, Redakcija Bedema..."
            value={form.authorName}
            onChange={e => update('authorName', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Slika</label>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
          {uploading && <p className="admin-news-form__upload-status">Otpremanje slike...</p>}
          {uploadError && <p className="admin-news__error">{uploadError}</p>}
          {form.imageUrl && (
            <img className="admin-news-form__preview" src={`${BASE}${form.imageUrl}`} alt="Pregled" />
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Izvor <span className="form-optional">(opciono, ako je vest preuzeta sa drugog sajta)</span></label>
          <input
            className="form-input"
            type="url"
            placeholder="https://..."
            value={form.sourceUrl}
            onChange={e => update('sourceUrl', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tekst vesti <span className="required-star">*</span></label>
          <textarea
            className="form-input"
            rows={12}
            placeholder="Odvojite paragrafe praznim redom."
            value={form.body}
            onChange={e => update('body', e.target.value)}
            required
          />
        </div>

        <label className="admin-news-form__checkbox">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={e => update('isPublished', e.target.checked)}
          />
          Objavljeno (vidljivo na sajtu)
        </label>

        {submitError && <p className="admin-news__error">{submitError}</p>}

        <button className="btn btn--primary admin-news-form__submit" type="submit" disabled={submitting || uploading}>
          {submitting ? 'Čuvanje...' : isEdit ? 'Sačuvaj izmene' : 'Objavi vest'}
        </button>
      </form>
    </div>
  );
}
