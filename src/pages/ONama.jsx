import { Link } from 'react-router-dom';
import './ONama.css';

const founders = [
  { name: 'Filip Milosavljević' },
  { name: 'Miljana Milojković' },
  { name: 'Nenad Veličković' },
];

const gradskiOdbor = [
  'Vuk Živković',
  'Anastasija Mitrović',
  'Biljana Dimitrijević',
  'Bratislav Čukić',
  'Dušan Kostić',
  'Jelena Rakić',
  'Jelena Veličković',
  'Marija Mitrović',
  'Jovana Mišić',
  'Marina Momčilović',
  'Milan Mutavdžić',
  'Mirjana Mohenski',
  'Saša Živković',
  'Snežana Đorđević',
  'Slaviša Mitrović',
];

const decisionSteps = [
  {
    title: 'Predlog',
    desc: 'Svaki član ili Gradski odbor može da iznese predlog ili inicijativu.',
  },
  {
    title: 'Rasprava na sednici',
    desc: 'Predlog se otvoreno razmatra na sednici Gradskog odbora, uz mogućnost da prisustvuju i drugi članovi.',
  },
  {
    title: 'Glasanje',
    desc: 'Odluka se donosi glasanjem, većinom glasova prisutnih članova odbora.',
  },
  {
    title: 'Transparentno objavljivanje',
    desc: 'Doneta odluka i zapisnik sa sednice postaju dostupni svim članovima.',
  },
];

const milestones = [
  {
    year: '23.06.2026.',
    title: 'Osnivanje Bedema',
    desc: 'Grupa od 12 građana osniva udruženje Bedem, nastalo iz frustracije i nade - frustracije zbog sistema koji često okreće leđa najranjivijim građanima, i nade da organizovana zajednica može da promeni pravila igre.',
  },
  {
    year: '06.09.2026.',
    title: 'Pomoć studentima',
    desc: 'Naša grupa građana nudi pomoć studentima - jer pametniji ne popušta, pametniji se organizuje!',
  },
  {
    year: '09.09.2026.',
    title: 'Izlazi naš sajt',
    desc: 'Pokrećemo sajt Bedema na kome ćemo objavljivati sve što je aktuelno.',
  },
];

function initials(fullName) {
  return fullName
    .split(' ')
    .map((part) => part[0])
    .join('');
}

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
            <h2 className="section__title">Prva godina borbe</h2>
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

          <div className="onama-founders">
            <span className="onama-founders__label">Osnivači</span>
            <div className="onama-founders__grid">
              {founders.map(({ name }, i) => (
                <div
                  key={name}
                  className="onama-founder"
                  style={{ '--i': i }}
                >
                  <div className="onama-founder__avatar">
                    <div className="onama-founder__avatar-inner">
                      {initials(name)}
                    </div>
                  </div>
                  <span className="onama-founder__name">{name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="onama-odbor">
            <span className="onama-odbor__label">Gradski odbor</span>
            <div className="onama-odbor__wall">
              {gradskiOdbor.map((name) => (
                <span key={name} className="onama-odbor__brick">
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Kako donosimo odluke */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <span className="badge badge--secondary">Naš proces</span>
            <h2 className="section__title">Kako donosimo odluke</h2>
            <div className="divider"></div>
            <p className="section__subtitle">
              Nijedna odluka se ne donosi iza zatvorenih vrata — evo kako Bedem funkcioniše.
            </p>
          </div>
          <div className="onama-decisions__steps">
            {decisionSteps.map(({ title, desc }, i) => (
              <div key={title} className="onama-decisions__step">
                <span className="onama-decisions__step-num">{i + 1}</span>
                <h3 className="onama-decisions__step-title">{title}</h3>
                <p className="onama-decisions__step-desc">{desc}</p>
              </div>
            ))}
          </div>
          <figure className="onama-decisions__figure">
            <img
              src="/skupstina-sala.png"
              alt="Prikaz sale sa evidencijom prisustva na sednici Gradskog odbora"
              className="onama-decisions__image"
              loading="lazy"
            />
            <figcaption className="onama-decisions__caption">
              Sednica Gradskog odbora — ovako u praksi izgleda evidencija prisustva i glasanje.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* CTA */}
      <section className="section section--light">
        <div className="container text-center">
          <h2 className="section__title">Pridruži se, preuzmi svoju sudbinu u svoje ruke</h2>
          <div className="divider"></div>
          <p className="section__subtitle mb-8">
            Svaki novi član jača naš bedem. Ne čekaj da neko drugi promeni pravila igre —
            pridruži se i postani deo rešenja.
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
