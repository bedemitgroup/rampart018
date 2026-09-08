import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import Pagination from '../../components/admin/Pagination';
import ExportPdfModal from '../../components/admin/ExportPdfModal';

const PAGE_SIZE = 50;

function formatDateTime(isoString) {
  return new Intl.DateTimeFormat('sr-RS', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(isoString));
}

/**
 * The signature list.
 *
 * Paged on the server rather than fetched whole and sliced in the browser like
 * the other inboxes: this list is names, cities and, by implication, political
 * opinions, so the page asks for the fifty rows it is about to draw and no more.
 * The one place it does pull everything is the PDF export, and that is exactly
 * why the export is a POST the server writes into the audit log.
 */
export default function AdminPeticijaPotpisi() {
  const { id } = useParams();
  const petitionId = Number(id);

  const [petition, setPetition] = useState(null);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const [exportRows, setExportRows] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [purging, setPurging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [p, list] = await Promise.all([
        api.getPetitionById(petitionId),
        api.getAllPetitionSignatures(petitionId, page, PAGE_SIZE),
      ]);

      setPetition(p);
      setData(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [petitionId, page]);

  useEffect(() => { load(); }, [load]);

  async function handleExport() {
    setExporting(true);
    setActionError('');

    try {
      const rows = await api.exportPetitionSignatures(petitionId);
      setExportRows(rows);
      setExportOpen(true);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handlePurge() {
    if (!window.confirm(
      `Trajno obrisati sve potpise na peticiji "${petition.title}"?\n\n`
      + 'Lični podaci potpisnika se brišu, a peticija se arhivira sa sačuvanim '
      + 'ukupnim brojem potpisa. Ovo se ne može poništiti.'
    )) return;

    setPurging(true);
    setActionError('');

    try {
      await api.purgePetitionSignatures(petitionId);
      setPage(1);
      await load();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setPurging(false);
    }
  }

  if (loading && !data) return <p className="admin-news__loading">Učitavanje...</p>;
  if (error) return <p className="admin-news__error">{error}</p>;
  if (!petition || !data) return null;

  const pageCount = Math.ceil(data.total / data.pageSize);
  const publicCount = data.items.filter((s) => s.publicDisplay).length;

  return (
    <div className="admin-news">
      <div className="admin-news__header">
        <div>
          <h1 className="admin__title">Potpisi — {petition.title}</h1>
          <p className="admin-news__muted">
            {data.total.toLocaleString('sr-RS')} ukupno · status: {petition.status}
            {petition.closedAt && ` · zatvorena ${formatDateTime(petition.closedAt)}`}
          </p>
        </div>

        <span className="admin-news__header-actions">
          <Link to="/admin/peticije" className="btn btn--secondary btn--sm">← Nazad</Link>

          {data.total > 0 && (
            <button
              className="btn btn--secondary btn--sm"
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Priprema...' : 'Izvezi PDF'}
            </button>
          )}
        </span>
      </div>

      {/* Not a warning about a mistake — a reminder about what this screen is. */}
      <p className="admin__readonly" role="note">
        Ovaj spisak sadrži podatke koji otkrivaju političko mišljenje — posebnu vrstu
        podataka o ličnosti. Ne prosleđujte ga van udruženja. Svako preuzimanje se
        beleži u <Link to="/admin/audit">dnevniku izmena</Link>.
      </p>

      {actionError && <p className="admin-news__error">{actionError}</p>}

      {petition.signaturesPurgedAt && (
        <p className="admin-news__empty">
          Potpisi su obrisani {formatDateTime(petition.signaturesPurgedAt)}. Sačuvan je
          ukupan broj: <strong>{petition.signatureCount.toLocaleString('sr-RS')}</strong>.
        </p>
      )}

      {!petition.signaturesPurgedAt && data.total === 0 && (
        <p className="admin-news__empty">Ova peticija još nema potpisa.</p>
      )}

      {data.total > 0 && (
        <>
          <table className="admin-news__table">
            <thead>
              <tr>
                <th>Ime i prezime</th>
                <th>Grad</th>
                <th>Nalog</th>
                <th>Javno</th>
                <th>Verzija saglasnosti</th>
                <th>Potpisano</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((s) => (
                <tr key={s.id}>
                  <td className="admin-news__title-cell">{s.firstName} {s.lastName}</td>
                  <td>{s.city}</td>
                  <td>{s.username}</td>
                  <td>{s.publicDisplay ? 'Da' : 'Ne'}</td>
                  <td>{s.consentVersion}</td>
                  <td>{formatDateTime(s.signedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="admin-news__muted">
            Na ovoj strani {publicCount} od {data.items.length} potpisnika pristalo je na
            javno prikazivanje.
          </p>

          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </>
      )}

      {/* Deleting is offered here rather than on the list, next to the data it
          destroys, and only the server decides whether it is allowed yet. */}
      {data.total > 0 && (
        <div className="admin-news__header">
          <p className="admin-news__muted">
            Potpisi se automatski brišu 12 meseci po zatvaranju peticije. Brisanje pre
            roka radite ovde.
          </p>
          <button
            className="btn btn--outline btn--sm"
            onClick={handlePurge}
            disabled={purging}
          >
            {purging ? 'Brisanje...' : 'Obriši potpise i arhiviraj'}
          </button>
        </div>
      )}

      <ExportPdfModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        title={`Potpisnici — ${petition.title}`}
        currentData={exportRows || []}
        allData={exportRows || []}
        filename={`potpisi-${petition.slug}.pdf`}
        columns={[
          { label: 'Ime', value: (s) => s.firstName },
          { label: 'Prezime', value: (s) => s.lastName },
          { label: 'Grad', value: (s) => s.city },
          { label: 'Nalog', value: (s) => s.username },
          { label: 'Javno', value: (s) => (s.publicDisplay ? 'Da' : 'Ne') },
          { label: 'Potpisano', value: (s) => formatDateTime(s.signedAt) },
        ]}
      />
    </div>
  );
}
