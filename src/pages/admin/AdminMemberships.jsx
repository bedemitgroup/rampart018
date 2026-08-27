import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import ExportPdfModal from '../../components/admin/ExportPdfModal';
import Pagination from '../../components/admin/Pagination';

const PAGE_SIZE = 20;

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
    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [skills];
  }
}

function DetailRow({ label, children }) {
  return (
    <div className="admin-detail__row">
      <div className="admin-detail__label">
        {label}
      </div>

      <div className="admin-detail__value">
        {children}
      </div>
    </div>
  );
}

const initialFilters = {
  search: '',
  membershipType: '',
  newsletter: '',
  sort: 'nameAsc',
};

export default function AdminMemberships() {
  const [applications, setApplications] =
    useState([]);

  const [
    selectedApplication,
    setSelectedApplication,
  ] = useState(null);

  const [filters, setFilters] =
    useState(initialFilters);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [exportOpen, setExportOpen] =
    useState(false);

  const [
    detailExportOpen,
    setDetailExportOpen,
  ] = useState(false);

  const [page, setPage] = useState(1);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  async function loadApplications() {
    setLoading(true);
    setError('');

    try {
      const data =
        await api.getMembershipApplications();

      setApplications(data);
    } catch (err) {
      setError(
        err.message ||
          'Greška pri učitavanju zahteva za članstvo.',
      );
    } finally {
      setLoading(false);
    }
  }

  const membershipTypes = useMemo(() => {
    return [...new Set(
      applications
        .map(
          (application) =>
            application.membershipType,
        )
        .filter(Boolean),
    )].sort((a, b) =>
      a.localeCompare(b, 'sr'),
    );
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const search = filters.search
      .trim()
      .toLowerCase();

    const filtered = applications.filter(
      (application) => {
        if (search) {
          const searchableText = [
            application.id,
            application.firstName,
            application.lastName,
            application.email,
            application.phone,
            application.city,
            application.occupation,
            application.membershipType,
            application.motivation,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (
            !searchableText.includes(search)
          ) {
            return false;
          }
        }

        if (
          filters.membershipType &&
          application.membershipType !==
            filters.membershipType
        ) {
          return false;
        }

        if (
          filters.newsletter &&
          String(application.newsletter) !==
            filters.newsletter
        ) {
          return false;
        }

        return true;
      },
    );

    return filtered.sort((a, b) => {
      if (filters.sort === 'dateNewest') {
        return (
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
        );
      }

      if (filters.sort === 'dateOldest') {
        return (
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
        );
      }

      const nameA =
        `${a.firstName || ''} ${
          a.lastName || ''
        }`
          .trim()
          .toLocaleLowerCase('sr');

      const nameB =
        `${b.firstName || ''} ${
          b.lastName || ''
        }`
          .trim()
          .toLocaleLowerCase('sr');

      const comparison =
        nameA.localeCompare(nameB, 'sr');

      return filters.sort === 'nameDesc'
        ? -comparison
        : comparison;
    });
  }, [applications, filters]);

  const pageCount = Math.max(
    1,
    Math.ceil(filteredApplications.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedApplications = filteredApplications.slice(
    pageStart,
    pageStart + PAGE_SIZE,
  );

  function handleFilterChange(event) {
    const { name, value } =
      event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  if (selectedApplication) {
    const skills = parseSkills(
      selectedApplication.skills,
    );

    return (
      <div className="admin-detail">
        <div className="admin-detail__header">
          <div>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() =>
                setSelectedApplication(null)
              }
            >
              ← Nazad
            </button>

            <h1 className="admin__title">
              Detalji zahteva #
              {selectedApplication.id}
            </h1>
          </div>

          <button
            type="button"
            className="btn btn--primary"
            onClick={() =>
              setDetailExportOpen(true)
            }
          >
            Izvezi PDF
          </button>
        </div>

        <div className="admin-detail__card">
          <DetailRow label="ID">
            {selectedApplication.id}
          </DetailRow>

          <DetailRow label="Ime">
            {selectedApplication.firstName ||
              '—'}
          </DetailRow>

          <DetailRow label="Prezime">
            {selectedApplication.lastName ||
              '—'}
          </DetailRow>

          <DetailRow label="Email">
            {selectedApplication.email ||
              '—'}
          </DetailRow>

          <DetailRow label="Telefon">
            {selectedApplication.phone ||
              '—'}
          </DetailRow>

          <DetailRow label="Grad">
            {selectedApplication.city ||
              '—'}
          </DetailRow>

          <DetailRow label="Zanimanje">
            {selectedApplication.occupation ||
              '—'}
          </DetailRow>

          <DetailRow label="Tip članstva">
            {selectedApplication.membershipType ||
              '—'}
          </DetailRow>

          <DetailRow label="Newsletter">
            {selectedApplication.newsletter
              ? 'Da'
              : 'Ne'}
          </DetailRow>

          <DetailRow label="Saglasnost">
            {selectedApplication.consent
              ? 'Da'
              : 'Ne'}
          </DetailRow>

          <DetailRow label="Datum prijave">
            {formatDate(
              selectedApplication.createdAt,
            )}
          </DetailRow>

          <div className="admin-detail__message">
            <div className="admin-detail__label">
              Motivacija
            </div>

            <div className="admin-detail__message-content">
              {selectedApplication.motivation ||
                '—'}
            </div>
          </div>

          <div className="admin-detail__message">
            <div className="admin-detail__label">
              Veštine
            </div>

            <div className="admin-detail__message-content">
              {skills.length > 0 ? (
                <ul>
                  {skills.map(
                    (skill, index) => (
                      <li
                        key={`${skill}-${index}`}
                      >
                        {skill}
                      </li>
                    ),
                  )}
                </ul>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>

        <ExportPdfModal
          isOpen={detailExportOpen}
          onClose={() =>
            setDetailExportOpen(false)
          }
          title={`Zahtev za članstvo #${selectedApplication.id}`}
          currentData={[
            selectedApplication,
          ]}
          allData={[
            selectedApplication,
          ]}
          filename={`zahtev-za-clanstvo-${selectedApplication.id}.pdf`}
          detailMode
          detailSections={[
            {
              label: 'ID',
              value: (application) =>
                application.id,
            },
            {
              label: 'Ime',
              value: (application) =>
                application.firstName || '—',
            },
            {
              label: 'Prezime',
              value: (application) =>
                application.lastName || '—',
            },
            {
              label: 'Email',
              value: (application) =>
                application.email || '—',
            },
            {
              label: 'Telefon',
              value: (application) =>
                application.phone || '—',
            },
            {
              label: 'Grad',
              value: (application) =>
                application.city || '—',
            },
            {
              label: 'Zanimanje',
              value: (application) =>
                application.occupation ||
                '—',
            },
            {
              label: 'Tip članstva',
              value: (application) =>
                application.membershipType ||
                '—',
            },
            {
              label: 'Newsletter',
              value: (application) =>
                application.newsletter
                  ? 'Da'
                  : 'Ne',
            },
            {
              label: 'Saglasnost',
              value: (application) =>
                application.consent
                  ? 'Da'
                  : 'Ne',
            },
            {
              label: 'Datum prijave',
              value: (application) =>
                formatDate(
                  application.createdAt,
                ),
            },
            {
              label: 'Motivacija',
              value: (application) =>
                application.motivation ||
                '—',
              fullWidth: true,
            },
            {
              label: 'Veštine',
              value: (application) => {
                const applicationSkills =
                  parseSkills(
                    application.skills,
                  );

                return applicationSkills.length
                  ? applicationSkills.join(', ')
                  : '—';
              },
              fullWidth: true,
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="admin-news">
      <div className="admin-news__header">
        <h1 className="admin__title">
          Zahtevi za članstvo
        </h1>

        <div className="admin-news__header-actions">
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={loadApplications}
            disabled={loading}
          >
            Osveži
          </button>

          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() =>
              setExportOpen(true)
            }
            disabled={
              loading ||
              applications.length === 0
            }
          >
            Izvezi PDF
          </button>
        </div>
      </div>

      <div className="admin-filters">
        <div className="admin-filters__group admin-filters__group--wide">
          <label
            className="admin-filters__label"
            htmlFor="membership-search"
          >
            Pretraga
          </label>

          <input
            id="membership-search"
            name="search"
            type="search"
            className="form-input"
            placeholder="Ime, prezime, email, telefon, grad..."
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>

        <div className="admin-filters__group">
          <label
            className="admin-filters__label"
            htmlFor="membership-type"
          >
            Tip članstva
          </label>

          <select
            id="membership-type"
            name="membershipType"
            className="form-select"
            value={filters.membershipType}
            onChange={handleFilterChange}
          >
            <option value="">
              Svi tipovi
            </option>

            {membershipTypes.map(
              (type) => (
                <option
                  key={type}
                  value={type}
                >
                  {type}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="admin-filters__group">
          <label
            className="admin-filters__label"
            htmlFor="membership-newsletter"
          >
            Newsletter
          </label>

          <select
            id="membership-newsletter"
            name="newsletter"
            className="form-select"
            value={filters.newsletter}
            onChange={handleFilterChange}
          >
            <option value="">Svi</option>
            <option value="true">
              Da
            </option>
            <option value="false">
              Ne
            </option>
          </select>
        </div>

        <div className="admin-filters__group">
          <label
            className="admin-filters__label"
            htmlFor="membership-sort"
          >
            Sortiranje
          </label>

          <select
            id="membership-sort"
            name="sort"
            className="form-select"
            value={filters.sort}
            onChange={handleFilterChange}
          >
            <option value="nameAsc">
              Ime A–Z
            </option>
            <option value="nameDesc">
              Ime Z–A
            </option>
            <option value="dateNewest">
              Najnoviji prvo
            </option>
            <option value="dateOldest">
              Najstariji prvo
            </option>
          </select>
        </div>

        <div className="admin-filters__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={resetFilters}
          >
            Resetuj filtere
          </button>
        </div>
      </div>

      <div className="admin-filters__summary">
        {filteredApplications.length > 0
          ? `Prikazano ${pageStart + 1}–${
              pageStart + paginatedApplications.length
            } od ${filteredApplications.length}`
          : `Prikazano 0 od ${filteredApplications.length}`}{' '}
        (ukupno {applications.length})
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

      {!loading &&
        !error &&
        applications.length === 0 && (
          <p className="admin-news__empty">
            Trenutno nema zahteva za članstvo.
          </p>
        )}

      {!loading &&
        !error &&
        applications.length > 0 &&
        filteredApplications.length === 0 && (
          <p className="admin-news__empty">
            Nema zahteva koji odgovaraju
            izabranim filterima.
          </p>
        )}

      {!loading &&
        !error &&
        filteredApplications.length > 0 && (
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
              {paginatedApplications.map(
                (application) => (
                  <tr
                    key={application.id}
                    className="admin-news__clickable-row"
                    onClick={() =>
                      setSelectedApplication(
                        application,
                      )
                    }
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (
                        event.key ===
                          'Enter' ||
                        event.key === ' '
                      ) {
                        event.preventDefault();

                        setSelectedApplication(
                          application,
                        );
                      }
                    }}
                  >
                    <td>
                      {application.id}
                    </td>

                    <td>
                      {application.firstName ||
                        '—'}{' '}
                      {application.lastName ||
                        ''}
                    </td>

                    <td>
                      {application.email ||
                        '—'}
                    </td>

                    <td>
                      {application.phone ||
                        '—'}
                    </td>

                    <td>
                      {application.city ||
                        '—'}
                    </td>

                    <td>
                      {application.membershipType ||
                        '—'}
                    </td>

                    <td>
                      {application.newsletter
                        ? 'Da'
                        : 'Ne'}
                    </td>

                    <td>
                      {formatDate(
                        application.createdAt,
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        )}

      {!loading &&
        !error &&
        filteredApplications.length > 0 && (
          <Pagination
            page={currentPage}
            pageCount={pageCount}
            onPageChange={setPage}
          />
        )}

      <ExportPdfModal
        isOpen={exportOpen}
        onClose={() =>
          setExportOpen(false)
        }
        title="Zahtevi za članstvo"
        currentData={filteredApplications}
        allData={applications}
        filename="zahtevi-za-clanstvo.pdf"
        columns={[
          {
            label: 'ID',
            value: (application) =>
              application.id,
          },
          {
            label: 'Ime i prezime',
            value: (application) => {
              const name = [
                application.firstName,
                application.lastName,
              ]
                .filter(Boolean)
                .join(' ')
                .trim();

              return name || '—';
            },
          },
          {
            label: 'Email',
            value: (application) =>
              application.email || '—',
          },
          {
            label: 'Telefon',
            value: (application) =>
              application.phone || '—',
          },
          {
            label: 'Grad',
            value: (application) =>
              application.city || '—',
          },
          {
            label: 'Članstvo',
            value: (application) =>
              application.membershipType ||
              '—',
          },
          {
            label: 'Newsletter',
            value: (application) =>
              application.newsletter
                ? 'Da'
                : 'Ne',
          },
          {
            label: 'Datum',
            value: (application) =>
              formatDate(
                application.createdAt,
              ),
          },
        ]}
      />
    </div>
  );
}