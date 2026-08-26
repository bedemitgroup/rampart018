import { useEffect, useState } from 'react';
import { api } from '../../services/api';

function formatDate(isoString) {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat('sr-RS', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function DetailRow({ label, children }) {
  return (
    <div className="admin-detail__row">
      <div className="admin-detail__label">{label}</div>
      <div className="admin-detail__value">{children}</div>
    </div>
  );
}

export default function AdminProblems() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
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

  if (selectedReport) {
    return (
      <div className="admin-detail">
        <div className="admin-detail__header">
          <div>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setSelectedReport(null)}
            >
              ← Nazad
            </button>

            <h1 className="admin__title">
              Detalji prijave #{selectedReport.id}
            </h1>
          </div>
        </div>

        <div className="admin-detail__card">
          <DetailRow label="ID">
            {selectedReport.id}
          </DetailRow>

          <DetailRow label="Kategorija">
            {selectedReport.category || '—'}
          </DetailRow>

          <DetailRow label="Datum prijave">
            {formatDate(selectedReport.createdAt)}
          </DetailRow>

          <DetailRow label="Anonimna prijava">
            {selectedReport.anonymous ? 'Da' : 'Ne'}
          </DetailRow>

          <DetailRow label="Ime i prezime">
            {selectedReport.anonymous
              ? 'Anonimno'
              : selectedReport.name || '—'}
          </DetailRow>

          <DetailRow label="Email">
            {selectedReport.email || '—'}
          </DetailRow>

          <DetailRow label="Telefon">
            {selectedReport.phone || '—'}
          </DetailRow>

          <DetailRow label="Lokacija">
            {selectedReport.location || '—'}
          </DetailRow>

          <div className="admin-detail__message">
            <div className="admin-detail__label">
              Opis problema
            </div>

            <div className="admin-detail__message-content">
              {selectedReport.message || '—'}
            </div>
          </div>

          <DetailRow label="Saglasnost">
            {selectedReport.consent ? 'Da' : 'Ne'}
          </DetailRow>
        </div>
      </div>
    );
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
              <tr
                key={report.id}
                className="admin-news__clickable-row"
                onClick={() => setSelectedReport(report)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedReport(report);
                  }
                }}
              >
                <td>{report.id}</td>

                <td>{report.category || '—'}</td>

                <td>
                  {report.anonymous
                    ? 'Anonimno'
                    : report.name || '—'}
                </td>

                <td>{report.email || '—'}</td>

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