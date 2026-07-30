import './Finansije.css';

const incomeData = [
  { source: 'Članarine', amount: '1.248.000', percent: 52, color: 'primary' },
  { source: 'Donacije građana', amount: '720.000', percent: 30, color: 'secondary' },
  { source: 'Donacije organizacija', amount: '240.000', percent: 10, color: 'success' },
  { source: 'Prihodi od projekata', amount: '192.000', percent: 8, color: 'neutral' },
];

const expenseData = [
  { category: 'Pravna pomoć i zastupanje', amount: '864.000', percent: 36, color: 'primary' },
  { category: 'Organizovanje akcija', amount: '480.000', percent: 20, color: 'secondary' },
  { category: 'Plate i naknade', amount: '576.000', percent: 24, color: 'accent' },
  { category: 'Administrativni troškovi', amount: '192.000', percent: 8, color: 'neutral' },
  { category: 'Komunikacije i marketing', amount: '144.000', percent: 6, color: 'success' },
  { category: 'Reserve i fond', amount: '144.000', percent: 6, color: 'neutral' },
];

const quarterlyReports = [
  {
    period: 'Q1 2026 (jan–mar)',
    income: '580.000',
    expenses: '490.000',
    balance: '+90.000',
    status: 'Usvojen',
    positive: true,
  },
  {
    period: 'Q2 2026 (apr–jun)',
    income: '620.000',
    expenses: '530.000',
    balance: '+90.000',
    status: 'Usvojen',
    positive: true,
  },
  {
    period: 'Q3 2026 (jul–sep)',
    income: '—',
    expenses: '—',
    balance: '—',
    status: 'U toku',
    positive: null,
  },
  {
    period: 'Q4 2026 (okt–dec)',
    income: '—',
    expenses: '—',
    balance: '—',
    status: 'Nije počeo',
    positive: null,
  },
];

const pastReports = [
  { year: '2025', total_income: '2.150.000', total_expenses: '1.980.000', members: '1.050', link: '#' },
  { year: '2024', total_income: '1.820.000', total_expenses: '1.700.000', members: '820', link: '#' },
  { year: '2023', total_income: '1.340.000', total_expenses: '1.260.000', members: '620', link: '#' },
  { year: '2022', total_income: '880.000', total_expenses: '810.000', members: '380', link: '#' },
];

export default function Finansije() {
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

      {/* Summary cards */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <span className="badge badge--primary">Izveštaj za 2025.</span>
            <h2 className="section__title">Pregled prihoda i rashoda</h2>
            <div className="divider"></div>
          </div>

          <div className="finansije-summary">
            <div className="finansije-summary__card finansije-summary__card--income">
              <div className="finansije-summary__label">Ukupni prihodi</div>
              <div className="finansije-summary__value">2.400.000 RSD</div>
              <div className="finansije-summary__sub">godišnje (2025)</div>
            </div>
            <div className="finansije-summary__card finansije-summary__card--expense">
              <div className="finansije-summary__label">Ukupni rashodi</div>
              <div className="finansije-summary__value">2.400.000 RSD</div>
              <div className="finansije-summary__sub">godišnje (2025)</div>
            </div>
            <div className="finansije-summary__card finansije-summary__card--balance">
              <div className="finansije-summary__label">Stanje fonda</div>
              <div className="finansije-summary__value">144.000 RSD</div>
              <div className="finansije-summary__sub">rezerve za 2026.</div>
            </div>
            <div className="finansije-summary__card finansije-summary__card--members">
              <div className="finansije-summary__label">Aktivni članovi</div>
              <div className="finansije-summary__value">1.200+</div>
              <div className="finansije-summary__sub">koji plaćaju članarinu</div>
            </div>
          </div>

          {/* Income breakdown */}
          <div className="finansije-breakdown">
            <div className="finansije-breakdown__section">
              <h3 className="finansije-breakdown__title">Struktura prihoda</h3>
              <div className="finansije-breakdown__bars">
                {incomeData.map(({ source, amount, percent, color }) => (
                  <div key={source} className="finansije-bar">
                    <div className="finansije-bar__header">
                      <span className="finansije-bar__label">{source}</span>
                      <span className="finansije-bar__amount">{amount} RSD</span>
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

            <div className="finansije-breakdown__section">
              <h3 className="finansije-breakdown__title">Struktura rashoda</h3>
              <div className="finansije-breakdown__bars">
                {expenseData.map(({ category, amount, percent, color }) => (
                  <div key={category} className="finansije-bar">
                    <div className="finansije-bar__header">
                      <span className="finansije-bar__label">{category}</span>
                      <span className="finansije-bar__amount">{amount} RSD</span>
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
          </div>
        </div>
      </section>

      {/* Quarterly table */}
      <section className="section section--light">
        <div className="container">
          <div className="section__header">
            <span className="badge badge--secondary">2026. godina</span>
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
                {quarterlyReports.map(({ period, income, expenses, balance, status, positive }) => (
                  <tr key={period}>
                    <td className="finansije-table__period">{period}</td>
                    <td>{income}</td>
                    <td>{expenses}</td>
                    <td className={positive === true ? 'finansije-table__positive' : positive === false ? 'finansije-table__negative' : ''}>
                      {balance}
                    </td>
                    <td>
                      <span className={`badge ${
                        status === 'Usvojen' ? 'badge--success' :
                        status === 'U toku' ? 'badge--secondary' :
                        'badge--primary'
                      }`}>{status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Annual reports */}
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
            {pastReports.map(({ year, total_income, total_expenses, members, link }) => (
              <div key={year} className="finansije-report">
                <div className="finansije-report__year">{year}</div>
                <div className="finansije-report__stats">
                  <div className="finansije-report__stat">
                    <span className="finansije-report__stat-label">Prihodi</span>
                    <span className="finansije-report__stat-value text-success">{total_income} RSD</span>
                  </div>
                  <div className="finansije-report__stat">
                    <span className="finansije-report__stat-label">Rashodi</span>
                    <span className="finansije-report__stat-value text-accent">{total_expenses} RSD</span>
                  </div>
                  <div className="finansije-report__stat">
                    <span className="finansije-report__stat-label">Članovi</span>
                    <span className="finansije-report__stat-value text-primary">{members}</span>
                  </div>
                </div>
                <a href={link} className="btn btn--outline finansije-report__btn">
                  Preuzmi PDF ↓
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
