import { useState, useEffect } from 'react';
import { api } from '../../services/api';

// The one "aktuelno" line that runs across the top of the front page. Lives
// under the news panel because it is the same job — whatever is current.
export default function AdminNoticeEditor() {
  const [text, setText] = useState('');
  const [original, setOriginal] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getSiteNotice();
      setText(data.text || '');
      setOriginal(data.text || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const data = await api.updateSiteNotice(text.trim());
      setText(data.text || '');
      setOriginal(data.text || '');
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const dirty = text.trim() !== original;

  return (
    <section className="admin-notice">
      <h2 className="admin-comments__title">Traka „Aktuelno“</h2>
      <p className="admin-moderators__hint">
        Kratka poruka na vrhu početne strane. Na telefonu se otvara kao iskačući prozor preko dugmeta „Aktuelno“.
      </p>

      {loading ? (
        <p className="admin-news__loading">Učitavanje...</p>
      ) : (
        <form className="admin-notice__form" onSubmit={handleSave}>
          <textarea
            className="form-input admin-notice__textarea"
            value={text}
            onChange={e => { setText(e.target.value); setSaved(false); }}
            rows={3}
            maxLength={280}
            placeholder="npr. Sledeća javna akcija: protest ispred Skupštine — subota u 11h"
          />
          <div className="admin-notice__row">
            <button className="btn btn--primary btn--sm" type="submit" disabled={saving || !dirty}>
              {saving ? 'Čuvanje...' : 'Sačuvaj'}
            </button>
            {saved && <span className="admin-finance__saved">Sačuvano.</span>}
            {error && <span className="admin-news__error">{error}</span>}
          </div>
        </form>
      )}
    </section>
  );
}
