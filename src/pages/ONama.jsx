import { Link } from 'react-router-dom';
import './ONama.css';

const team = [
  {
    name: 'Marija Petrović',
    role: 'Predsednica udruženja',
    bio: 'Pravnica sa 15 godina iskustva u oblasti ljudskih prava. Bivša savetnica Poverenika za zaštitu ravnopravnosti.',
    emoji: '👩‍⚖️',
  },
  {
    name: 'Nikola Jovanović',
    role: 'Koordinator akcija',
    bio: 'Sociolog i aktivista. Organizovao je više od 30 mirnih protesta i javnih skupova širom Srbije.',
    emoji: '👨‍💼',
  },
  {
    name: 'Ana Đorđević',
    role: 'Finansijska direktorka',
    bio: 'Ovlašćeni revizor sa iskustvom u neprofitnom sektoru. Odgovorna za transparentnost finansijskog poslovanja.',
    emoji: '👩‍💻',
  },
  {
    name: 'Stefan Milošević',
    role: 'Pravni savetnik',
    bio: 'Advokat specijalizovan za upravno i ustavno pravo. Zastupa građane pred sudovima i institucijama.',
    emoji: '👨‍⚖️',
  },
];

const milestones = [
  {
    year: '2021',
    title: 'Osnivanje Bedema',
    desc: 'Grupa od 12 građana osniva udruženje nakon niza slučajeva kršenja prava u lokalnoj samoupravi.',
  },
  {
    year: '2022',
    title: 'Prva pravna pobeda',
    desc: 'Uspešno osporavamo nezakonitu odluku gradske uprave. Presuda postaje presedan za slične slučajeve.',
  },
  {
    year: '2023',
    title: 'Regionalno proširenje',
    desc: 'Otvaramo koordianatorske kancelarije u Beogradu, Nišu i Kragujevcu. Baza članova dostiže 500.',
  },
  {
    year: '2024',
    title: 'Platforma za prijave',
    desc: 'Lansiramo digitalnu platformu za anonimne prijave kršenja prava. Primamo 200+ prijava mesečno.',
  },
  {
    year: '2025',
    title: 'Međunarodno priznanje',
    desc: 'Bedem dobija nagradu Mreže za demokratizaciju Balkana za doprinos civilnom društvu.',
  },
  {
    year: '2026',
    title: 'Danas',
    desc: 'Više od 1.200 aktivnih članova, 48 uspešnih akcija i svakodnevna podrška građanima.',
  },
];

export default function ONama() {
  return (
    <>
      <section className="page-hero">
        <div className="container page-hero__content">
          <span className="page-hero__badge">O nama</span>
          <h1 className="page-hero__title">Ko je Bedem?</h1>
          <p className="page-hero__subtitle">
            Nezavisno građansko udruženje posvećeno zaštiti prava, transparentnosti
            i izgradnji pravednog društva.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section">
        <div className="container onama-mission">
          <div className="onama-mission__text">
            <span className="badge badge--secondary">Naša priča</span>
            <h2 className="onama-mission__title">Zašto postoji Bedem</h2>
            <div className="divider divider--left"></div>
            <p>
              Bedem je nastao iz frustracije i nade — frustracije zbog sistema koji
              često okrenuće leđa najranjivijim građanima, i nade da organizovana
              zajednica može da promeni pravila igre.
            </p>
            <p className="mt-4">
              Naše ime nije slučajno. Bedem — zid koji štiti, struktura koja izdržava
              pritisak — to je ono što želimo da budemo za naše sugrađane. Čvrst,
              pouzdan, uvek prisutan.
            </p>
            <p className="mt-4">
              Ne primamo novac od državnih institucija ni od korporacija. Finansiramo
              se isključivo od članarina i donacija građana koji veruju u našu misiju.
              To nam daje slobodu da govorimo istinu moći.
            </p>
          </div>
          <div className="onama-mission__cards">
            <div className="onama-mission__card onama-mission__card--primary">
              <div className="onama-mission__card-label">Misija</div>
              <p>Zaštititi prava svakog građana kroz pravnu pomoć, javno zagovaranje i organizovanu akciju.</p>
            </div>
            <div className="onama-mission__card onama-mission__card--secondary">
              <div className="onama-mission__card-label">Vizija</div>
              <p>Srbija u kojoj institucije služe građanima, a ne obrnuto — gde su pravda i jednakost stvarnost, ne ideal.</p>
            </div>
            <div className="onama-mission__card onama-mission__card--accent">
              <div className="onama-mission__card-label">Pristup</div>
              <p>Spajamo pravnu ekspertizu, građanski aktivizam i digitalnu transparentnost u jedinstven model delovanja.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section section--light">
        <div className="container">
          <div className="section__header">
            <span className="badge badge--primary">Naš put</span>
            <h2 className="section__title">Pet godina borbe</h2>
            <div className="divider"></div>
          </div>
          <div className="onama-timeline">
            {milestones.map(({ year, title, desc }, i) => (
              <div key={year} className={`onama-timeline__item${i % 2 === 0 ? '' : ' onama-timeline__item--right'}`}>
                <div className="onama-timeline__content">
                  <span className="onama-timeline__year">{year}</span>
                  <h3 className="onama-timeline__title">{title}</h3>
                  <p className="onama-timeline__desc">{desc}</p>
                </div>
                <div className="onama-timeline__dot"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <span className="badge badge--secondary">Naš tim</span>
            <h2 className="section__title">Ljudi koji stoje iza Bedema</h2>
            <div className="divider"></div>
            <p className="section__subtitle">
              Volonteri i profesionalci ujedinjeni zajedničkim ciljem — boljim životom za sve.
            </p>
          </div>
          <div className="onama-team__grid">
            {team.map(({ name, role, bio, emoji }) => (
              <div key={name} className="card onama-team__card">
                <div className="onama-team__avatar">{emoji}</div>
                <h3 className="onama-team__name">{name}</h3>
                <span className="badge badge--secondary onama-team__role">{role}</span>
                <p className="onama-team__bio">{bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--light">
        <div className="container text-center">
          <h2 className="section__title">Postani deo Bedema</h2>
          <div className="divider"></div>
          <p className="section__subtitle mb-8">
            Svaki novi član jača naš bedem. Pridruži se i pomozi nam da zaštitimo
            prava svakog građana.
          </p>
          <div className="onama-cta__actions">
            <Link to="/pridruzi-se" className="btn btn--primary btn--lg">
              Postani član
            </Link>
            <Link to="/problem" className="btn btn--outline btn--lg">
              Prijavi problem
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
