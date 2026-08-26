import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import ExportPdfModal from '../../components/admin/ExportPdfModal';

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

const initialFilters = {
  search: '',
  category: '',
  anonymous: '',
  dateFrom: '',
  dateTo: '',
  sort: 'newest',
};

export default function AdminProblems() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const [detailExportOpen, setDetailExportOpen] =
    useState(false);

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
      setError(
        err.message ||
          'Greška pri učitavanju prijava.',
      );
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    return [...new Set(
      reports
        .map((report) => report.category)
        .filter(Boolean),
    )].sort((a, b) =>
      a.localeCompare(b, 'sr'),
    );
  }, [reports]);

  const filteredReports = useMemo(() => {
    const search = filters.search
      .trim()
      .toLowerCase();

    const filtered = reports.filter((report) => {
      if (search) {
        const searchableText = [
          report.id,
          report.category,
          report.name,
          report.email,
          report.phone,
          report.location,
          report.message,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(search)) {
          return false;
        }
      }

      if (
        filters.category &&
        report.category !== filters.category
      ) {
        return false;
      }

      if (
        filters.anonymous &&
        String(report.anonymous) !== filters.anonymous
      ) {
        return false;
      }

      if (filters.dateFrom) {
        const from = new Date(
          `${filters.dateFrom}T00:00:00`,
        );

        const createdAt = new Date(
          report.createdAt,
        );

        if (createdAt < from) {
          return false;
        }
      }

      if (filters.dateTo) {
        const to = new Date(
          `${filters.dateTo}T23:59:59.999`,
        );

        const createdAt = new Date(
          report.createdAt,
        );

        if (createdAt > to) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => {
      const dateA = new Date(
        a.createdAt,
      ).getTime();

      const dateB = new Date(
        b.createdAt,
      ).getTime();

      return filters.sort === 'oldest'
        ? dateA - dateB
        : dateB - dateA;
    });
  }, [reports, filters]);

  function handleFilterChange(event) {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  if (selectedReport) {
    return (
      <div className="admin-detail">
        <div className="admin-detail__header">
          <div>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() =>
                setSelectedReport(null)
              }
            >
              ← Nazad
            </button>

            <h1 className="admin__title">
              Detalji prijave #{selectedReport.id}
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
            {selectedReport.id}
          </DetailRow>

          <DetailRow label="Kategorija">
            {selectedReport.category || '—'}
          </DetailRow>

          <DetailRow label="Datum prijave">
            {formatDate(
              selectedReport.createdAt,
            )}
          </DetailRow>

          <DetailRow label="Anonimna prijava">
            {selectedReport.anonymous
              ? 'Da'
              : 'Ne'}
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
            {selectedReport.consent
              ? 'Da'
              : 'Ne'}
          </DetailRow>
        </div>

        <ExportPdfModal
          isOpen={detailExportOpen}
          onClose={() =>
            setDetailExportOpen(false)
          }
          title={`Prijava #${selectedReport.id}`}
          currentData={[selectedReport]}
          allData={[selectedReport]}
          filename={`prijava-${selectedReport.id}.pdf`}
          detailMode
          detailSections={[
            {
              label: 'ID',
              value: (report) => report.id,
            },
            {
              label: 'Kategorija',
              value: (report) =>
                report.category || '—',
            },
            {
              label: 'Datum prijave',
              value: (report) =>
                formatDate(report.createdAt),
            },
            {
              label: 'Anonimna prijava',
              value: (report) =>
                report.anonymous ? 'Da' : 'Ne',
            },
            {
              label: 'Ime i prezime',
              value: (report) =>
                report.anonymous
                  ? 'Anonimno'
                  : report.name || '—',
            },
            {
              label: 'Email',
              value: (report) =>
                report.email || '—',
            },
            {
              label: 'Telefon',
              value: (report) =>
                report.phone || '—',
            },
            {
              label: 'Lokacija',
              value: (report) =>
                report.location || '—',
            },
            {
              label: 'Opis problema',
              value: (report) =>
                report.message || '—',
              fullWidth: true,
            },
            {
              label: 'Saglasnost',
              value: (report) =>
                report.consent ? 'Da' : 'Ne',
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
          Prijave problema
        </h1>

        <div>
          <button
            type="button"
            className="btn btn--primary"
            onClick={loadReports}
            disabled={loading}
          >
            Osveži
          </button>

          <button
            type="button"
            className="btn btn--secondary"
            onClick={() =>
              setExportOpen(true)
            }
            disabled={
              loading ||
              reports.length === 0
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
            htmlFor="problem-search"
          >
            Pretraga
          </label>

          <input
            id="problem-search"
            name="search"
            type="search"
            className="form-input"
            placeholder="ID, kategorija, ime, email, telefon..."
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>

        <div className="admin-filters__group">
          <label
            className="admin-filters__label"
            htmlFor="problem-category"
          >
            Kategorija
          </label>

          <select
            id="problem-category"
            name="category"
            className="form-select"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <option value="">
              Sve kategorije
            </option>

            {categories.map((category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-filters__group">
          <label
            className="admin-filters__label"
            htmlFor="problem-anonymous"
          >
            Vrsta prijave
          </label>

          <select
            id="problem-anonymous"
            name="anonymous"
            className="form-select"
            value={filters.anonymous}
            onChange={handleFilterChange}
          >
            <option value="">Svi</option>
            <option value="true">
              Anonimne
            </option>
            <option value="false">
              Neanonimne
            </option>
          </select>
        </div>

        <div className="admin-filters__group">
          <label
            className="admin-filters__label"
            htmlFor="problem-sort"
          >
            Sortiranje
          </label>

          <select
            id="problem-sort"
            name="sort"
            className="form-select"
            value={filters.sort}
            onChange={handleFilterChange}
          >
            <option value="newest">
              Najnoviji prvo
            </option>
            <option value="oldest">
              Najstariji prvo
            </option>
          </select>
        </div>

        <div className="admin-filters__group">
          <label
            className="admin-filters__label"
            htmlFor="problem-date-from"
          >
            Od datuma
          </label>

          <input
            id="problem-date-from"
            name="dateFrom"
            type="date"
            className="form-input"
            value={filters.dateFrom}
            onChange={handleFilterChange}
          />
        </div>

        <div className="admin-filters__group">
          <label
            className="admin-filters__label"
            htmlFor="problem-date-to"
          >
            Do datuma
          </label>

          <input
            id="problem-date-to"
            name="dateTo"
            type="date"
            className="form-input"
            value={filters.dateTo}
            onChange={handleFilterChange}
          />
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
        Prikazano {filteredReports.length} od{' '}
        {reports.length} prijava
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

      {!loading &&
        !error &&
        reports.length === 0 && (
          <p className="admin-news__empty">
            Trenutno nema prijavljenih problema.
          </p>
        )}

      {!loading &&
        !error &&
        reports.length > 0 &&
        filteredReports.length === 0 && (
          <p className="admin-news__empty">
            Nema prijava koje odgovaraju izabranim
            filterima.
          </p>
        )}

      {!loading &&
        !error &&
        filteredReports.length > 0 && (
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
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="admin-news__clickable-row"
                  onClick={() =>
                    setSelectedReport(report)
                  }
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
                    ) {
                      event.preventDefault();
                      setSelectedReport(report);
                    }
                  }}
                >
                  <td>{report.id}</td>

                  <td>
                    {report.category || '—'}
                  </td>

                  <td>
                    {report.anonymous
                      ? 'Anonimno'
                      : report.name || '—'}
                  </td>

                  <td>
                    {report.email || '—'}
                  </td>

                  <td>
                    {report.location || '—'}
                  </td>

                  <td>
                    {report.anonymous
                      ? 'Da'
                      : 'Ne'}
                  </td>

                  <td>
                    {formatDate(
                      report.createdAt,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      <ExportPdfModal
        isOpen={exportOpen}
        onClose={() =>
          setExportOpen(false)
        }
        title="Prijave problema"
        currentData={filteredReports}
        allData={reports}
        filename="prijave-problema.pdf"
        columns={[
          {
            label: 'ID',
            value: (report) => report.id,
          },
          {
            label: 'Kategorija',
            value: (report) =>
              report.category || '—',
          },
          {
            label: 'Ime',
            value: (report) =>
              report.anonymous
                ? 'Anonimno'
                : report.name || '—',
          },
          {
            label: 'Email',
            value: (report) =>
              report.email || '—',
          },
          {
            label: 'Telefon',
            value: (report) =>
              report.phone || '—',
          },
          {
            label: 'Lokacija',
            value: (report) =>
              report.location || '—',
          },
          {
            label: 'Anonimno',
            value: (report) =>
              report.anonymous ? 'Da' : 'Ne',
          },
          {
            label: 'Datum',
            value: (report) =>
              formatDate(report.createdAt),
          },
        ]}
      />
    </div>
  );
}