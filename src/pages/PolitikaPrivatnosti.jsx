import { Link } from 'react-router-dom';
import './PolitikaPrivatnosti.css';

/**
 * The privacy policy.
 *
 * It exists because petitions needed one, but it covers every form on the site:
 * until now the two consent checkboxes on /problem and /pridruzi-se linked to
 * href="#", which means nobody who ticked them was ever informed of anything.
 *
 * The placeholders below are marked and must be filled in before this page is
 * of any use — a policy that cannot name its controller names nobody.
 */

// Bumped together with PetitionConsent.CurrentVersion on the server, so a
// signature's stored version can be matched to the text that was in force.
const VERSION = '2026-09-04';

// TODO before launch: replace every one of these with the association's real
// registration details, exactly as they appear in the APR register.
const CONTROLLER = {
  name: '[POPUNITI: pun naziv udruženja iz APR-a]',
  address: '[POPUNITI: adresa sedišta]',
  registrationNumber: '[POPUNITI: matični broj]',
  email: '[POPUNITI: kontakt email za zaštitu podataka]',
};

function Placeholder({ children }) {
  return <span className="privatnost-placeholder">{children}</span>;
}

export default function PolitikaPrivatnosti() {
  return (
    <div className="privatnost-page">
      <section className="page-hero">
        <div className="container page-hero__content">
          <span className="page-hero__badge">Politika privatnosti</span>
          <h1 className="page-hero__title">Kako postupamo sa vašim podacima</h1>
          <p className="page-hero__subtitle">
            Verzija {VERSION}. Ova politika se primenjuje na sve podatke koje
            prikupljamo preko ovog sajta.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container privatnost-content">

          <h2>1. Ko obrađuje vaše podatke</h2>
          <p>
            Rukovalac podacima je <Placeholder>{CONTROLLER.name}</Placeholder>,
            sa sedištem na adresi <Placeholder>{CONTROLLER.address}</Placeholder>,
            matični broj <Placeholder>{CONTROLLER.registrationNumber}</Placeholder>.
          </p>
          <p>
            Za sva pitanja u vezi sa vašim podacima pišite na{' '}
            <Placeholder>{CONTROLLER.email}</Placeholder>.
          </p>
          <p>
            Obrada se sprovodi u skladu sa Zakonom o zaštiti podataka o ličnosti
            („Službeni glasnik RS", br. 87/2018), a za lica koja se nalaze u
            Evropskoj uniji i u skladu sa Opštom uredbom o zaštiti podataka (GDPR).
          </p>

          <h2>2. Koje podatke prikupljamo i zašto</h2>

          <div className="privatnost-table-wrap">
            <table className="privatnost-table">
              <thead>
                <tr>
                  <th>Svrha</th>
                  <th>Podaci</th>
                  <th>Pravni osnov</th>
                  <th>Rok čuvanja</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Nalog na sajtu</td>
                  <td>Korisničko ime, email adresa, šifrovana lozinka</td>
                  <td>Izvršenje ugovora o korišćenju usluge</td>
                  <td>Dok postoji nalog</td>
                </tr>
                <tr>
                  <td>Komentari i reakcije</td>
                  <td>Sadržaj komentara, vreme, nalog sa kog je poslat</td>
                  <td>Izvršenje ugovora o korišćenju usluge</td>
                  <td>Dok postoji nalog ili do brisanja komentara</td>
                </tr>
                <tr>
                  <td><strong>Potpisivanje peticije</strong></td>
                  <td>Ime, prezime, grad, nalog, vreme potpisa, tekst saglasnosti</td>
                  <td><strong>Izričit pristanak</strong> (posebna vrsta podataka)</td>
                  <td>12 meseci od zatvaranja peticije</td>
                </tr>
                <tr>
                  <td>Prijava problema</td>
                  <td>Ime, email, telefon, lokacija, opis (ili anonimno)</td>
                  <td>Pristanak</td>
                  <td><Placeholder>[POPUNITI: rok]</Placeholder></td>
                </tr>
                <tr>
                  <td>Zahtev za članstvo</td>
                  <td>Ime, prezime, email, telefon, grad, zanimanje, motivacija</td>
                  <td>Pristanak / preduzimanje radnji pre zaključenja članstva</td>
                  <td><Placeholder>[POPUNITI: rok]</Placeholder></td>
                </tr>
                <tr>
                  <td>Dnevnik izmena u admin panelu</td>
                  <td>Nalog, radnja, IP adresa, podaci o pregledaču</td>
                  <td>Legitimni interes — odgovornost za rad udruženja</td>
                  <td>Trajno</td>
                </tr>
                <tr>
                  <td>Zaštita od automatskih prijava</td>
                  <td>IP adresa, podaci o pregledaču, sadržaj pokušaja</td>
                  <td>Legitimni interes — bezbednost sajta</td>
                  <td><Placeholder>[POPUNITI: rok]</Placeholder></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>3. Peticije — posebno objašnjenje</h2>
          <p>
            Podatak o tome da ste potpisali određenu peticiju otkriva vaše političko
            mišljenje. Po članu 17. Zakona o zaštiti podataka o ličnosti to je
            <strong> posebna vrsta podataka o ličnosti</strong>, čija je obrada
            zabranjena osim ako ste za nju dali <strong>izričit pristanak</strong>.
            Zato se potpis ne može ostaviti bez potvrde saglasnosti, i zato tu
            saglasnost čuvamo u celini, u tekstu koji vam je bio prikazan.
          </p>
          <p>
            <strong>Javno prikazivanje je zasebna, dobrovoljna odluka.</strong> Ako
            ne date tu saglasnost, vaš potpis se i dalje računa u ukupan broj, ali
            se vaše ime nigde ne prikazuje. Odbijanje javnog prikazivanja nikada
            nije prepreka za potpisivanje.
          </p>
          <p>
            Pristanak možete povući u svakom trenutku na stranici{' '}
            <Link to="/moji-potpisi">Moji potpisi</Link>. Povlačenjem se vaš potpis{' '}
            <strong>briše</strong> — ne označava kao povučen, nego briše — i prestaje
            da se broji.
          </p>
          <p>
            Potpise čuvamo 12 meseci od dana zatvaranja peticije, kako bismo mogli da
            odgovorimo na eventualno osporavanje kampanje. Po isteku tog roka lični
            podaci potpisnika se brišu automatski, a sačuva se samo ukupan broj potpisa.
          </p>
          <p className="privatnost-callout">
            Peticija na ovom sajtu je izraz javne podrške i <strong>nema pravno
            dejstvo narodne inicijative</strong>. Po Zakonu o referendumu i narodnoj
            inicijativi, potpisi za narodnu inicijativu overavaju se u opštinskoj
            upravi ili se prikupljaju elektronski isključivo preko portala eUprava.
          </p>

          <h2>4. Kome dostavljamo podatke</h2>
          <p>
            Vaše podatke ne prodajemo i ne ustupamo trećim licima u marketinške svrhe.
            Podaci se nalaze na serverima našeg pružaoca usluge hostinga:{' '}
            <Placeholder>[POPUNITI: naziv i država hosting provajdera]</Placeholder>.
          </p>
          <p>
            Podacima pristupaju samo ovlašćena lica u udruženju, i to samo u obimu
            koji je potreban za njihov posao. Svaki pristup spisku potpisnika i svako
            preuzimanje tog spiska beleži se u internom dnevniku izmena.
          </p>

          <h2>5. Vaša prava</h2>
          <p>U odnosu na svoje podatke imate pravo na:</p>
          <ul className="privatnost-list">
            <li><strong>Pristup</strong> — da saznate koje podatke o vama imamo. Za potpise to vidite odmah na stranici <Link to="/moji-potpisi">Moji potpisi</Link>.</li>
            <li><strong>Ispravku</strong> netačnih podataka.</li>
            <li><strong>Brisanje</strong> podataka.</li>
            <li><strong>Ograničenje obrade</strong> i <strong>prigovor</strong> na obradu.</li>
            <li><strong>Prenosivost</strong> podataka koje ste nam sami dali.</li>
            <li><strong>Povlačenje pristanka</strong> u svakom trenutku, bez obrazloženja i bez posledica. Povlačenje ne utiče na zakonitost obrade pre povlačenja.</li>
          </ul>
          <p>
            Zahtev šaljete na <Placeholder>{CONTROLLER.email}</Placeholder>. Odgovaramo
            u roku od 30 dana; ako je zahtev složen, rok se može produžiti, o čemu ćemo
            vas obavestiti.
          </p>

          <h2>6. Kolačići</h2>
          <p>
            Ovaj sajt ne koristi kolačiće za praćenje niti alate za analitiku trećih
            strana. Za održavanje vaše prijave koristi se lokalno skladište vašeg
            pregledača (<code>localStorage</code>), u kome se čuva samo token vaše
            sesije. Taj podatak ostaje na vašem uređaju i briše se odjavom.
          </p>

          <h2>7. Maloletna lica</h2>
          <p>
            Usluge ovog sajta koje se zasnivaju na pristanku namenjene su licima od
            navršenih <strong>15 godina</strong> (član 16. Zakona o zaštiti podataka o
            ličnosti). Za mlađe od 15 godina pristanak daje roditelj ili drugi zakonski
            zastupnik. Ako saznamo da smo prikupili podatke deteta mlađeg od 15 godina
            bez takvog pristanka, brišemo ih.
          </p>

          <h2>8. Bezbednost</h2>
          <p>
            Lozinke se čuvaju isključivo u kriptovanom obliku i nikada u čitljivom.
            Pristup podacima potpisnika ograničen je na uloge kojima je to potrebno za
            rad, a svaka izmena i svako preuzimanje spiska beleže se.
          </p>

          <h2>9. Pritužba</h2>
          <p>
            Ako smatrate da obrađujemo vaše podatke suprotno zakonu, imate pravo da
            podnesete pritužbu Povereniku za informacije od javnog značaja i zaštitu
            podataka o ličnosti, Bulevar kralja Aleksandra 15, Beograd —{' '}
            <a href="https://www.poverenik.rs" target="_blank" rel="noreferrer noopener">
              poverenik.rs
            </a>.
          </p>

          <h2>10. Izmene ove politike</h2>
          <p>
            Ovu politiku možemo menjati. Svaka verzija nosi datum, a saglasnost koju ste
            dali prilikom potpisivanja peticije čuva se u tekstu koji je bio na snazi u
            tom trenutku — kasnije izmene ne menjaju ono na šta ste pristali.
          </p>
          <p className="privatnost-version">Verzija ove politike: {VERSION}</p>

        </div>
      </section>
    </div>
  );
}
