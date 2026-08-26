import { useEffect, useState } from 'react';
import { api } from '../../services/api';

function formatDate(isoString) {
  const date = new Date(isoString);

  return new Intl.DateTimeFormat('sr-RS', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function parseSkills(skills) {
  if (!skills) return [];

  if (Array.isArray(skills)) {
    return skills;
  }

  try {
    const parsed = JSON.parse(skills);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [skills];
  }
}

function DetailRow({ label, children }) {
  return (
    <div className="admin-detail__row">
      <div className="admin-detail__label">{label}</div>
      <div className="admin-detail__value">{children}</div>
    </div>
  );
}

export default function AdminMemberships() {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
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
      setError(
        err.message || 'Greška pri učitavanju zahteva za članstvo.'
      );
    } finally {
      setLoading(false);
    }
  }

  if (selectedApplication) {
    const skills = parseSkills(selectedApplication.skills);

    return (
      <div className="admin-detail">
        <div className="admin-detail__header">
          <div>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setSelectedApplication(null)}
            >
              ← Nazad
            </button>

            <h1 className="admin__title">
              Detalji zahteva #{selectedApplication.id}
            </h1>
          </div>
        </div>

        <div className="admin-detail__card">
          <DetailRow label="ID">
            {selectedApplication.id}
          </DetailRow>

          <DetailRow label="Ime">
            {selectedApplication.firstName || '—'}
          </DetailRow>

          <DetailRow label="Prezime">
            {selectedApplication.lastName || '—'}
          </DetailRow>

          <DetailRow label="Email">
            {selectedApplication.email || '—'}
          </DetailRow>

          <DetailRow label="Telefon">
            {selectedApplication.phone || '—'}
          </DetailRow>

          <DetailRow label="Grad">
            {selectedApplication.city || '—'}
          </DetailRow>

          <DetailRow label="Zanimanje">
            {selectedApplication.occupation || '—'}
          </DetailRow>

          <DetailRow label="Tip članstva">
            {selectedApplication.membershipType || '—'}
          </DetailRow>

          <DetailRow label="Newsletter">
            {selectedApplication.newsletter ? 'Da' : 'Ne'}
          </DetailRow>

          <DetailRow label="Saglasnost">
            {selectedApplication.consent ? 'Da' : 'Ne'}
          </DetailRow>

          <DetailRow label="Datum prijave">
            {formatDate(selectedApplication.createdAt)}
          </DetailRow>

          <div className="admin-detail__message">
            <div className="admin-detail__label">
              Motivacija
            </div>

            <div className="admin-detail__message-content">
              {selectedApplication.motivation || '—'}
            </div>
          </div>

          <div className="admin-detail__message">
            <div className="admin-detail__label">
              Veštine
            </div>

            <div className="admin-detail__message-content">
              {skills.length > 0 ? (
                <ul>
                  {skills.map((skill, index) => (
                    <li key={`${skill}-${index}`}>
                      {skill}
                    </li>
                  ))}
                </ul>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
              <tr
                key={application.id}
                className="admin-news__clickable-row"
                onClick={() => setSelectedApplication(application)}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedApplication(application);
                  }
                }}
              >
                <td>{application.id}</td>

                <td>
                  {application.firstName || '—'}{' '}
                  {application.lastName || ''}
                </td>

                <td>{application.email || '—'}</td>

                <td>{application.phone || '—'}</td>

                <td>{application.city || '—'}</td>

                <td>{application.membershipType || '—'}</td>

                <td>
                  {application.newsletter ? 'Da' : 'Ne'}
                </td>

                <td>{formatDate(application.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}