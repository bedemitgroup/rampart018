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
    // No membership figure here on purpose: the live one is on the front page,
    // and a second number written into prose is a second number to keep true.
    desc: 'Rastuće članstvo, 48 uspešnih akcija i svakodnevna podrška građanima.',
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
            Nezavisno udruženje građana posvećeno zaštiti prava, transparentnosti
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
              Bedem 018 je zid koji čine ljudi željni pravde, istine i povratka
              moralnih i patriotskih vrednosti u društvo.
            </p>
            <p className="mt-4">
              U želji da živimo u zdravom i uređenom okruženju, počeli smo da
              gradimo zid od ljudi – ljudi koji žele da iza sebe ostave društvo
              u kojem su lični interes i korist postali životni moto.
            </p>
            <p className="mt-4">
              Želimo da zajedno izgradimo društvo u kojem ćemo uzdignute glave
              stajati na zdravim i čvrstim temeljima, iz kojih će se razvijati
              sve sfere života, uz poštovanje osnovnih moralnih načela.
            </p>
            <p className="mt-4">
              Nismo potkupljivi jer su naši finansijeri slobodni građani koji
              žele promenu i koji veruju da se truo sistem može menjati samo
              zajedničkim delovanjem. Upravo zato možemo da stojimo uspravno i
              slobodno, i imamo moć da jasno i glasno iznesemo svoj stav o
              svakom problemu i zauzmemo se za njegovo rešavanje.
            </p>
            <p className="mt-4">
              Račune polažemo isključivo građanima kroz transparentnost u
              radu, dostupnost informacija na našem sajtu, kao i kroz
              prikazivanje rezultata akcija koje sprovodimo.
            </p>
            <p className="mt-4">
              Samo zajedno možemo izgraditi čvrste i zdrave temelje.
              <br />
              Budimo zajedno Bedem našeg društva.
            </p>
          </div>
          <div className="onama-mission__cards">
            <div className="onama-mission__card onama-mission__card--primary">
              <div className="onama-mission__card-label">Misija</div>
              <p>Zaštita prava i interesa svih građana kroz pravnu podršku, javno zagovaranje i organizovanu zajedničku akciju.</p>
            </div>
            <div className="onama-mission__card onama-mission__card--secondary">
              <div className="onama-mission__card-label">Vizija</div>
              <p>Zdravo, pravedno i uređeno društvo čvrstih moralnih temelja, u kome su institucije u službi naroda, a jednakost i transparentnost osnovni standardi života.</p>
            </div>
            <div className="onama-mission__card onama-mission__card--accent">
              <div className="onama-mission__card-label">Pristup</div>
              <p>Spajamo stručno pravno znanje, nepokolebljiv građanski aktivizam i potpunu digitalnu transparentnost u jedinstven i nezavisan model delovanja.</p>
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
