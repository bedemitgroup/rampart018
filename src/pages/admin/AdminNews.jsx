import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

function formatDate(isoString) {
  const d = new Date(isoString);
  const months = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'];
  return `${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}.`;
}

export default function AdminNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [moveError, setMoveError] = useState('');

  useEffect(() => { loadNews(); }, []);

  async function loadNews() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getNews();
      setNews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Obrisati vest "${title}"?`)) return;
    setDeleteError('');
    try {
      await api.deleteNews(id);
      setNews(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setDeleteError(err.message);
    }
  }

  async function handleMove(id, direction) {
    setMoveError('');
    try {
      const updated = await api.moveNews(id, direction);
      setNews(updated);
    } catch (err) {
      setMoveError(err.message);
    }
  }

  return (
    <div className="admin-news">
      <div className="admin-news__header">
        <h1 className="admin__title">Vesti</h1>
        <Link to="/admin/news/new" className="btn btn--primary">+ Nova vest</Link>
      </div>

      {deleteError && <p className="admin-news__error">{deleteError}</p>}
      {moveError && <p className="admin-news__error">{moveError}</p>}
      {loading && <p className="admin-news__loading">Učitavanje...</p>}
      {error && <p className="admin-news__error">{error}</p>}

      {!loading && !error && news.length === 0 && (
        <p className="admin-news__empty">Još nema vesti. Dodajte prvu.</p>
      )}

      {!loading && !error && news.length > 0 && (
        <table className="admin-news__table">
          <thead>
            <tr>
              <th></th>
              <th>Naslov</th>
              <th>Kategorija</th>
              <th>Autor</th>
              <th>Datum</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {news.map((n, index) => (
              <tr key={n.id}>
                <td className="admin-news__move-cell">
                  <button
                    className="admin-news__move-btn"
                    disabled={index === 0}
                    onClick={() => handleMove(n.id, 'up')}
                    aria-label="Pomeri gore"
                    title="Pomeri gore"
                  >
                    ↑
                  </button>
                  <button
                    className="admin-news__move-btn"
                    disabled={index === news.length - 1}
                    onClick={() => handleMove(n.id, 'down')}
                    aria-label="Pomeri dole"
                    title="Pomeri dole"
                  >
                    ↓
                  </button>
                </td>
                <td className="admin-news__title-cell">{n.title}</td>
                <td>{n.category}</td>
                <td>{n.authorName}</td>
                <td>{formatDate(n.createdAt)}</td>
                <td>
                  <span className={`admin-news__status${n.isPublished ? '' : ' admin-news__status--draft'}`}>
                    {n.isPublished ? 'Objavljeno' : 'Nacrt'}
                  </span>
                </td>
                <td>
                  <span className="admin-news__actions">
                    <Link to={`/admin/news/${n.id}/edit`} className="admin-news__action-btn">Izmeni</Link>
                    <button
                      className="admin-news__action-btn admin-news__action-btn--delete"
                      onClick={() => handleDelete(n.id, n.title)}
                    >
                      Obriši
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
