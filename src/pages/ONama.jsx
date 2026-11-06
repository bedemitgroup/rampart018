import { Link } from 'react-router-dom';
import './ONama.css';

const founders = [
  { name: 'Miljana Milojković' },
  { name: 'Filip Milosavljević' },
  { name: 'Mirjana Mohenski' },
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
  'Filip Dimitrijević',
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
            <h2 className="onama-mission__title">Nastanak</h2>
            <div className="divider divider--left"></div>
            <p>
              Bedem je nastao iz zajedničke ideje grupe ljudi koji veruju da se
              problemi u našem gradu ne rešavaju sami od sebe i da su za promene
              potrebni aktivni građani.
            </p>
            <p className="mt-4">
              Potreba za osnivanjem udruženja postojala je duže vreme, a konkretnu
              formu dobila je pre oko pola godine, kada su se ljudi sličnih stavova
              i vrednosti okupili sa željom da svoje iskustvo, energiju i dosadašnje
              angažovanje usmere ka rešavanju lokalnih problema i izgradnji boljeg
              društva za sve građane Niša.
            </p>

            <h3 className="onama-mission__subtitle mt-8">Naši ljudi</h3>
            <p className="mt-2">
              Deo članova Bedema čine bivši članovi pokreta Kreni-Promeni, koji su
              zajedno sa drugim istomišljenicima odlučili da nastave građansko
              delovanje kroz novo udruženje i fokusiraju se na probleme našeg grada.
            </p>
            <p className="mt-4">
              Iako je Bedem formalno osnovan relativno skoro, ljudi koji ga čine su
              već više godina aktivni učesnici u građanskim inicijativama, protestima
              i akcijama usmerenim na ukazivanje na probleme u društvu i njihovo
              rešavanje. Naše osnivanje nije motivisano političkom dobiti ili ličnim
              interesima, već željom za dugoročnim i odgovornim delovanjem u
              interesu građana.
            </p>

            <h3 className="onama-mission__subtitle mt-8">Zašto postojimo</h3>
            <p className="mt-2">
              Bedem vidimo kao prostor za okupljanje, zajedničko delovanje i
              uključivanje svih koji žele da preuzmu odgovornost za sredinu u kojoj
              žive.
            </p>
            <p className="mt-4">
              Naš cilj je da saslušamo sugrađane, ukažemo na ono što ne funkcioniše,
              tražimo odgovore od nadležnih i učestvujemo u pronalaženju konkretnih
              rešenja.
            </p>
            <p className="mt-4">
              Verujemo da bolji Niš može nastati samo uz aktivne građane, međusobnu
              saradnju i borbu za zajednički interes.
            </p>
            <p className="mt-4">
              Godinama pasivnosti skupo smo platili, prepustili smo drugima da
              odlučuju umesto nas. Ne želimo da se to ponovi. Bedem je tu da budemo
              ujedinjeni, glasni i aktivni, jer budućnost Niša, i generacija koje
              dolaze, treba da oblikujemo mi sami.
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

      {/* Podrška studentskoj listi */}
      <section className="section section--light">
        <div className="container">
          <div className="section__header">
            <span className="badge badge--primary">Naše delovanje</span>
            <h2 className="section__title">Podrška studentskoj listi</h2>
            <div className="divider"></div>
          </div>
          <div className="onama-text-block">
            <p>
              Pojava studentske liste otvorila je prostor za nove ideje i aktivnije
              učešće građana u društvenim i političkim procesima. Članovi udruženja
              Bedem od početka su prepoznali značaj studentskog angažovanja i podržali
              ideju da studenti preuzmu aktivnu ulogu u promenama u Srbiji.
            </p>
            <p className="mt-4">
              Tu podršku pokazali smo konkretnim delovanjem. Naši članovi stavili su
              svoje vreme, znanje i ljudske resurse na raspolaganje studentskoj listi
              tokom parlamentarnih izbora. Učestvovali smo u predizbornim
              aktivnostima, a na dan izbora bili angažovani u timovima kontrolora i
              mobilnim timovima.
            </p>
            <p className="mt-4">
              Bedem će i u narednim izbornim procesima nastaviti da pruža podršku
              studentskoj listi, uz poštovanje autonomije studenata i spremnost da
              svoje aktivnosti usklađuje sa njihovim dogovorima i odlukama.
            </p>
            <p className="mt-4">
              Verujemo u društvo u kojem se glas građana čuje, institucije odgovorno
              rade, a javni interes bude u središtu donošenja odluka. Želimo da
              ostanemo aktivni učesnici tog procesa i svojim delovanjem doprinesemo
              izgradnji boljeg društva.
            </p>
          </div>
        </div>
      </section>

      {/* Za grad u interesu građana */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <span className="badge badge--secondary">Naš stav</span>
            <h2 className="section__title">Za grad u interesu građana</h2>
            <div className="divider"></div>
          </div>
          <div className="onama-text-block">
            <p>
              Javni interes nije apstraktna fraza, to su bezbedne ulice, škole koje
              funkcionišu, čist vazduh, zelene površine i novac koji se troši tamo
              gde treba. I odgovornost prema deci koja dolaze posle nas.
            </p>
            <p className="mt-4">
              To podrazumeva odgovorno i transparentno donošenje odluka, raspolaganje
              javnim novcem i imovinom u interesu građana i pravo javnosti da zna šta
              se planira i kako te odluke utiču na svakodnevni život.
            </p>
            <p className="mt-4">
              Ne želimo da budemo samo oni koji ukazuju na probleme i kritikuju.
              Razgovaraćemo sa građanima, proveravati informacije, prikupljati
              dokumentaciju, pratiti rad institucija i zahtevati odgovornost za odluke
              koje utiču na sve nas.
            </p>
            <p className="mt-4">
              Podržavaćemo svaku inicijativu koja je u interesu građana Niša, to je
              jedini kriterijum koji nam je bitan. Oslanjaćemo se na činjenice,
              stručna mišljenja i argumentovan razgovor.
            </p>
            <p className="mt-4">
              Nismo nepogrešivi i ne pravimo se da jesmo. Kad ne znamo nešto,
              pitamo. Kad pogrešimo, kažemo i ispravljamo. Kad se ne slažemo,
              razgovaramo.
            </p>
            <p className="mt-4">
              Ne želimo da budemo samo posmatrači promena u našem gradu. Želimo da
              učestvujemo u njegovom oblikovanju i da svojim radom doprinesemo boljem
              Nišu.
            </p>
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
