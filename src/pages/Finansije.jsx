import { useEffect, useState } from 'react';
import { api } from '../services/api';
import './Finansije.css';

const amountFormatter = new Intl.NumberFormat('sr-RS', { maximumFractionDigits: 0 });

function formatAmount(value) {
  return amountFormatter.format(value ?? 0);
}

/** Balances carry their sign so a shortfall reads as one at a glance. */
function formatBalance(value) {
  const formatted = formatAmount(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

function statusBadgeClass(status) {
  if (status === 'Usvojen') return 'badge badge--success';
  if (status === 'U toku') return 'badge badge--secondary';
  return 'badge badge--primary';
}

function Breakdown({ title, items }) {
  if (items.length === 0) {
    return (
      <div className="finansije-breakdown__section">
        <h3 className="finansije-breakdown__title">{title}</h3>
        <p className="finansije-empty">Za izabranu godinu nema unetih stavki.</p>
      </div>
    );
  }

  return (
    <div className="finansije-breakdown__section">
      <h3 className="finansije-breakdown__title">{title}</h3>
      <div className="finansije-breakdown__bars">
        {items.map(({ name, amount, percent, color }) => (
          <div key={name} className="finansije-bar">
            <div className="finansije-bar__header">
              <span className="finansije-bar__label">{name}</span>
              <span className="finansije-bar__amount">{formatAmount(amount)} RSD</span>
            </div>
            <div className="finansije-bar__track">
              <div
                className={`finansije-bar__fill finansije-bar__fill--${color}`}
                style={{ width: `${percent}%` }}
              ></div>
            </div>
            <div className="finansije-bar__percent">{percent}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Finansije() {
  const [overview, setOverview] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getFinanceOverview(selectedYear);
        if (cancelled) return;
        setOverview(data);
        // The server picks the year on the first load; follow its choice so the
        // dropdown and the figures below it never disagree.
        setSelectedYear(data.year);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedYear]);

  const summary = overview?.summary;
  const quarters = overview?.quarters ?? [];
  const annualReports = overview?.annualReports ?? [];
  const availableYears = overview?.availableYears ?? [];

  return (
    <>
      <section className="page-hero">
        <div className="container page-hero__content">
          <span className="page-hero__badge">Transparentnost</span>
          <h1 className="page-hero__title">Finansije</h1>
          <p className="page-hero__subtitle">
            Svaki dinar koji dobijemo od građana — vraćamo ga građanima.
            Evo kako ga trošimo.
          </p>
        </div>
      </section>

      {/* Principle */}
      <section className="section section--light">
        <div className="container">
          <div className="finansije-principle">
            <div className="finansije-principle__icon">🔍</div>
            <div className="finansije-principle__text">
              <h2>Naš princip transparentnosti</h2>
              <p>
                Bedem se finansira isključivo od dobrovoljnih doprinosa — članarina i donacija.
                Ne prihvatamo novac od države, partija ni korporacija. Sve finansijske informacije
                su javno dostupne. Godišnji izveštaji se podnose Agenciji za privredne registre
                i objavljuju na ovoj stranici.
              </p>
            </div>
          </div>
        </div>
      </section>

      {loading && !overview && (
        <section className="section">
          <div className="container">
            <p className="finansije-empty">Učitavanje finansijskih podataka...</p>
          </div>
        </section>
      )}

      {error && (
        <section className="section">
          <div className="container">
            <p className="finansije-error">{error}</p>
          </div>
        </section>
      )}

      {/* Nothing booked yet — a page of zeros would read as a real report. */}
      {overview && availableYears.length === 0 && (
        <section className="section">
          <div className="container">
            <p className="finansije-empty">
              Finansijski izveštaji će uskoro biti objavljeni na ovoj stranici.
            </p>
          </div>
        </section>
      )}

      {overview && availableYears.length > 0 && (
        <>
          {/* Summary cards */}
          <section className="section">
            <div className="container">
              <div className="section__header">
                {availableYears.length > 1 ? (
                  <label className="finansije-year-picker">
                    <span className="finansije-year-picker__label">Izveštaj za godinu</span>
                    <select
                      className="finansije-year-picker__select"
                      value={overview.year}
                      onChange={e => setSelectedYear(Number(e.target.value))}
                    >
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}.</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <span className="badge badge--primary">Izveštaj za {overview.year}.</span>
                )}
                <h2 className="section__title">Pregled prihoda i rashoda</h2>
                <div className="divider"></div>
              </div>

              <div className="finansije-summary">
                <div className="finansije-summary__card finansije-summary__card--income">
                  <div className="finansije-summary__label">Ukupni prihodi</div>
                  <div className="finansije-summary__value">{formatAmount(summary.totalIncome)} RSD</div>
                  <div className="finansije-summary__sub">godišnje ({overview.year})</div>
                </div>
                <div className="finansije-summary__card finansije-summary__card--expense">
                  <div className="finansije-summary__label">Ukupni rashodi</div>
                  <div className="finansije-summary__value">{formatAmount(summary.totalExpenses)} RSD</div>
                  <div className="finansije-summary__sub">godišnje ({overview.year})</div>
                </div>
                <div className="finansije-summary__card finansije-summary__card--balance">
                  <div className="finansije-summary__label">Stanje fonda</div>
                  <div className="finansije-summary__value">{formatAmount(summary.reserveFund)} RSD</div>
                  <div className="finansije-summary__sub">rezerve za {overview.year + 1}.</div>
                </div>
                <div className="finansije-summary__card finansije-summary__card--members">
                  <div className="finansije-summary__label">Aktivni članovi</div>
                  <div className="finansije-summary__value">{formatAmount(summary.memberCount)}</div>
                  <div className="finansije-summary__sub">koji plaćaju članarinu</div>
                </div>
              </div>

              <div className="finansije-breakdown">
                <Breakdown title="Struktura prihoda" items={overview.income} />
                <Breakdown title="Struktura rashoda" items={overview.expenses} />
              </div>
            </div>
          </section>

          {/* Quarterly table */}
          <section className="section section--light">
            <div className="container">
              <div className="section__header">
                <span className="badge badge--secondary">{overview.year}. godina</span>
                <h2 className="section__title">Kvartalni pregled</h2>
                <div className="divider"></div>
              </div>
              <div className="finansije-table-wrap">
                <table className="finansije-table">
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Prihodi (RSD)</th>
                      <th>Rashodi (RSD)</th>
                      <th>Bilans (RSD)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quarters.map(({ quarter, label, income, expenses, balance, hasEntries, status }) => (
                      <tr key={quarter}>
                        <td className="finansije-table__period">{label}</td>
                        <td>{hasEntries ? formatAmount(income) : '—'}</td>
                        <td>{hasEntries ? formatAmount(expenses) : '—'}</td>
                        <td className={
                          !hasEntries || balance === 0 ? '' :
                          balance > 0 ? 'finansije-table__positive' : 'finansije-table__negative'
                        }>
                          {hasEntries ? formatBalance(balance) : '—'}
                        </td>
                        <td>
                          <span className={statusBadgeClass(status)}>{status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Annual reports */}
          {annualReports.length > 0 && (
            <section className="section">
              <div className="container">
                <div className="section__header">
                  <span className="badge badge--primary">Arhiva</span>
                  <h2 className="section__title">Godišnji izveštaji</h2>
                  <div className="divider"></div>
                  <p className="section__subtitle">
                    Sve izveštaje možete preuzeti u PDF formatu ili pregledati online.
                  </p>
                </div>
                <div className="finansije-reports">
                  {annualReports.map(({ year, totalIncome, totalExpenses, memberCount, reportUrl }) => (
                    <div key={year} className="finansije-report">
                      <div className="finansije-report__year">{year}</div>
                      <div className="finansije-report__stats">
                        <div className="finansije-report__stat">
                          <span className="finansije-report__stat-label">Prihodi</span>
                          <span className="finansije-report__stat-value text-success">{formatAmount(totalIncome)} RSD</span>
                        </div>
                        <div className="finansije-report__stat">
                          <span className="finansije-report__stat-label">Rashodi</span>
                          <span className="finansije-report__stat-value text-accent">{formatAmount(totalExpenses)} RSD</span>
                        </div>
                        <div className="finansije-report__stat">
                          <span className="finansije-report__stat-label">Članovi</span>
                          <span className="finansije-report__stat-value text-primary">{formatAmount(memberCount)}</span>
                        </div>
                      </div>
                      {reportUrl ? (
                        <a
                          href={reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn--outline finansije-report__btn"
                        >
                          Preuzmi PDF ↓
                        </a>
                      ) : (
                        <span className="btn btn--outline finansije-report__btn finansije-report__btn--disabled">
                          Izveštaj uskoro
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}
