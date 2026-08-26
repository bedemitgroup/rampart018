import { useEffect, useState } from 'react';
import { api } from '../../services/api';

function formatDate(isoString) {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat('sr-RS', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function AdminProblems() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoading(true);
    setError('');

    try {
      const data = await api.getProblemReports();
      setReports(data);
    } catch (err) {
      setError(err.message || 'Greška pri učitavanju prijava.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-news">
      <div className="admin-news__header">
        <h1 className="admin__title">Prijave problema</h1>

        <button
          type="button"
          className="btn btn--primary"
          onClick={loadReports}
          disabled={loading}
        >
          Osveži
        </button>
      </div>

      {loading && (
        <p className="admin-news__loading">
          Učitavanje prijava...
        </p>
      )}

      {error && (
        <p className="admin-news__error">
          {error}
        </p>
      )}

      {!loading && !error && reports.length === 0 && (
        <p className="admin-news__empty">
          Trenutno nema prijavljenih problema.
        </p>
      )}

      {!loading && !error && reports.length > 0 && (
        <table className="admin-news__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Kategorija</th>
              <th>Ime</th>
              <th>Email</th>
              <th>Lokacija</th>
              <th>Anonimno</th>
              <th>Datum</th>
            </tr>
          </thead>

          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.id}</td>

                <td>{report.category}</td>

                <td>
                  {report.anonymous
                    ? 'Anonimno'
                    : report.name || '—'}
                </td>

                <td>
                  {report.anonymous && !report.email
                    ? '—'
                    : report.email || '—'}
                </td>

                <td>{report.location || '—'}</td>

                <td>
                  {report.anonymous ? 'Da' : 'Ne'}
                </td>

                <td>{formatDate(report.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}