import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import notoSansRegular from '../../fonts/NotoSans-Regular.ttf';
import notoSansBold from '../../fonts/NotoSans-Bold.ttf';

const LIMIT_OPTIONS = [
  { value: '100', label: 'Prvih 100' },
  { value: '500', label: 'Prvih 500' },
  { value: 'all', label: 'Svi' },
];
async function loadPdfFonts(doc) {
  const regularResponse = await fetch(notoSansRegular);
  const regularBuffer = await regularResponse.arrayBuffer();

  const boldResponse = await fetch(notoSansBold);
  const boldBuffer = await boldResponse.arrayBuffer();

  const toBase64 = (buffer) => {
    let binary = '';

    const bytes = new Uint8Array(buffer);

    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(
        ...bytes.subarray(i, i + chunkSize),
      );
    }

    return btoa(binary);
  };

  doc.addFileToVFS(
    'NotoSans-Regular.ttf',
    toBase64(regularBuffer),
  );

  doc.addFont(
    'NotoSans-Regular.ttf',
    'NotoSans',
    'normal',
  );

  doc.addFileToVFS(
    'NotoSans-Bold.ttf',
    toBase64(boldBuffer),
  );

  doc.addFont(
    'NotoSans-Bold.ttf',
    'NotoSans',
    'bold',
  );

  doc.setFont('NotoSans', 'normal');
}

export default function ExportPdfModal({
  isOpen,
  onClose,
  title,
  currentData,
  allData,
  columns = [],
  filename,
  detailMode = false,
  detailSections = [],
}) {
  const [scope, setScope] = useState('filtered');
  const [limit, setLimit] = useState('100');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setScope('filtered');
      setLimit('100');
      setExporting(false);
      setExportError('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  function getExportData() {
    const source =
      scope === 'filtered'
        ? currentData
        : allData;

    if (limit === 'all') {
      return source;
    }

    return source.slice(0, Number(limit));
  }

  function getValue(item, section) {
    const value =
      typeof section.value === 'function'
        ? section.value(item)
        : item[section.value];

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—';
    }

    return String(value);
  }

  function addWrappedText(
    doc,
    text,
    x,
    y,
    maxWidth,
    lineHeight = 5,
  ) {
    const lines = doc.splitTextToSize(
      String(text ?? '—'),
      maxWidth,
    );

    doc.text(lines, x, y);

    return y + lines.length * lineHeight;
  }

  function addDetailField(
    doc,
    section,
    item,
    currentY,
  ) {
    let y = currentY;

    if (section.type === 'heading') {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('NotoSans', 'bold');
      doc.setFontSize(13);
      doc.text(section.label, 15, y);

      doc.setFont('NotoSans', 'normal');

      return y + 9;
    }

    const value = getValue(item, section);
    const fullWidth = section.fullWidth === true;

    if (y > 265) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(9);
    doc.setFont('NotoSans', 'bold');
    doc.text(`${section.label}:`, 15, y);

    doc.setFont('NotoSans', 'normal');

    if (fullWidth) {
      y += 6;

      y = addWrappedText(
        doc,
        value,
        15,
        y,
        180,
        5,
      );

      return y + 7;
    }

    y = addWrappedText(
      doc,
      value,
      60,
      y,
      135,
      5,
    );

    return y + 5;
  }

  function exportSingleRecord(doc, item) {
    let y = 20;

    doc.setFont('NotoSans', 'bold');
    doc.setFontSize(18);
    doc.text(title, 15, y);

    y += 10;

    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(9);
    doc.text(
      `Izvezeno: ${new Date().toLocaleString('sr-RS')}`,
      15,
      y,
    );

    y += 12;

    detailSections.forEach((section) => {
      y = addDetailField(
        doc,
        section,
        item,
        y,
      );
    });
  }

 async function handleExport() {
    const data = getExportData();

    if (data.length === 0) {
      setExportError('Nema podataka za izvoz.');
      return;
    }

    setExporting(true);
    setExportError('');

    try {
      const doc = new jsPDF({
        orientation: detailMode
          ? 'portrait'
          : 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      await loadPdfFonts(doc);

      if (detailMode) {
        exportSingleRecord(doc, data[0]);
      } else {
        doc.setFont('NotoSans', 'bold');
        doc.setFontSize(16);
        doc.text(title, 14, 15);

        doc.setFont('NotoSans', 'normal');
        doc.setFontSize(9);

        doc.text(
          `Izvezeno: ${new Date().toLocaleString('sr-RS')}`,
          14,
          22,
        );

        doc.text(
          `Obuhvat: ${
            scope === 'filtered'
              ? 'Trenutno primenjeni filter'
              : 'Svi podaci'
          }`,
          14,
          27,
        );

        doc.text(
          `Broj zapisa: ${data.length}`,
          14,
          32,
        );

        const head = [
          columns.map((column) => column.label),
        ];

        const body = data.map((item) =>
          columns.map((column) => {
            const value =
              typeof column.value === 'function'
                ? column.value(item)
                : item[column.value];

            if (
              value === null ||
              value === undefined ||
              value === ''
            ) {
              return '—';
            }

            return String(value);
          }),
        );

        autoTable(doc, {
          startY: 37,
          head,
          body,
          theme: 'grid',
          styles: {
            fontSize: 7,
            cellPadding: 2,
            overflow: 'linebreak',
            valign: 'top',
          },
          headStyles: {
            fontSize: 7,
            fontStyle: 'bold',
          },
          margin: {
            top: 37,
            right: 10,
            bottom: 10,
            left: 10,
          },
        });
      }

      doc.save(filename);
      onClose();
    } catch (error) {
      console.error('PDF export error:', error);

      setExportError(
        'PDF nije moguće napraviti. Proverite browser konzolu za detalje.',
      );
    } finally {
      setExporting(false);
    }
  }

  const exportData = getExportData();

  return (
    <div
      className="admin-export-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-export-title"
    >
      <div
        className="admin-export-modal__backdrop"
        onClick={onClose}
      />

      <div className="admin-export-modal__content">
        <div className="admin-export-modal__header">
          <h2 id="admin-export-title">
            {detailMode
              ? 'Izvoz detalja'
              : 'Izvoz podataka'}
          </h2>

          <button
            type="button"
            className="admin-export-modal__close"
            onClick={onClose}
            aria-label="Zatvori"
          >
            ×
          </button>
        </div>

        <div className="admin-export-modal__body">
          {detailMode ? (
            <>
              <p className="admin-export-modal__description">
                Biće izvezen kompletan zapis sa svim
                podacima i punim tekstom opisa.
              </p>

              <div className="admin-export-modal__summary">
                <strong>{title}</strong>
              </div>
            </>
          ) : (
            <>
              <div className="admin-export-modal__section">
                <label className="admin-export-modal__label">
                  Šta se izvozi?
                </label>

                <p className="admin-export-modal__description">
                  {title}
                </p>
              </div>

              <div className="admin-export-modal__section">
                <label
                  className="admin-export-modal__label"
                  htmlFor="export-scope"
                >
                  Obuhvat
                </label>

                <select
                  id="export-scope"
                  className="form-select"
                  value={scope}
                  onChange={(event) =>
                    setScope(event.target.value)
                  }
                >
                  <option value="filtered">
                    Trenutno primenjeni filter
                  </option>

                  <option value="all">
                    Svi podaci
                  </option>
                </select>

                <p className="admin-export-modal__hint">
                  Trenutni filter daje{' '}
                  {currentData.length} zapisa, a ukupno
                  postoji {allData.length}.
                </p>
              </div>

              <div className="admin-export-modal__section">
                <label
                  className="admin-export-modal__label"
                  htmlFor="export-limit"
                >
                  Broj zapisa
                </label>

                <select
                  id="export-limit"
                  className="form-select"
                  value={limit}
                  onChange={(event) =>
                    setLimit(event.target.value)
                  }
                >
                  {LIMIT_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-export-modal__summary">
                Za izvoz će biti pripremljeno{' '}
                <strong>{exportData.length}</strong>{' '}
                zapisa.
              </div>
            </>
          )}

          {exportError && (
            <p className="admin-news__error">
              {exportError}
            </p>
          )}
        </div>

        <div className="admin-export-modal__footer">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            disabled={exporting}
          >
            Otkaži
          </button>

          <button
            type="button"
            className="btn btn--primary"
            onClick={handleExport}
            disabled={
              exporting ||
              exportData.length === 0
            }
          >
            {exporting
              ? 'Izvoz...'
              : detailMode
                ? 'Izvezi ovaj zapis'
                : 'Izvezi PDF'}
          </button>
        </div>
      </div>
    </div>
  );
}