import { useEffect, useState } from 'react';
import { api } from '../../services/api';

function formatDate(isoString) {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat('sr-RS', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function AdminMemberships() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    setLoading(true);
    setError('');

    try {
      const data = await api.getMembershipApplications();
      setApplications(data);
    } catch (err) {
      setError(err.message || 'Greška pri učitavanju zahteva za članstvo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-news">
      <div className="admin-news__header">
        <h1 className="admin__title">Zahtevi za članstvo</h1>

        <button
          type="button"
          className="btn btn--primary"
          onClick={loadApplications}
          disabled={loading}
        >
          Osveži
        </button>
      </div>

      {loading && (
        <p className="admin-news__loading">
          Učitavanje zahteva...
        </p>
      )}

      {error && (
        <p className="admin-news__error">
          {error}
        </p>
      )}

      {!loading && !error && applications.length === 0 && (
        <p className="admin-news__empty">
          Trenutno nema zahteva za članstvo.
        </p>
      )}

      {!loading && !error && applications.length > 0 && (
        <table className="admin-news__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ime i prezime</th>
              <th>Email</th>
              <th>Telefon</th>
              <th>Grad</th>
              <th>Članstvo</th>
              <th>Newsletter</th>
              <th>Datum</th>
            </tr>
          </thead>

          <tbody>
            {applications.map((application) => (
              <tr key={application.id}>
                <td>{application.id}</td>

                <td>
                  {application.firstName} {application.lastName}
                </td>

                <td>{application.email}</td>

                <td>{application.phone || '—'}</td>

                <td>{application.city}</td>

                <td>{application.membershipType}</td>

                <td>{application.newsletter ? 'Da' : 'Ne'}</td>

                <td>{formatDate(application.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}