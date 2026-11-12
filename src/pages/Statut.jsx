import './Statut.css';

export default function Statut() {
  return (
    <div className="statut-page">
      <section className="page-hero">
        <div className="container page-hero__content">
          <span className="page-hero__badge">Pravni akti</span>
          <h1 className="page-hero__title">Statut udruženja</h1>
          <p className="page-hero__subtitle">
            Usvojen na osnivačkoj skupštini, 23. juna 2026. godine, u Nišu.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container statut-layout">
          <nav className="statut-toc" aria-label="Sadržaj">
            <p className="statut-toc__heading">Sadržaj</p>
            <ol className="statut-toc__list">
              <li><a href="#clan-1">Čl. 1 — Oblast ciljeva</a></li>
              <li><a href="#clan-2">Čl. 2 — Ciljevi</a></li>
              <li><a href="#clan-3">Čl. 3 — Aktivnosti</a></li>
              <li><a href="#clan-4">Čl. 4 — Naziv i sedište</a></li>
              <li><a href="#clan-5">Čl. 5 — Učlanjivanje</a></li>
              <li><a href="#clan-6">Čl. 6 — Prijem i prestanak</a></li>
              <li><a href="#clan-7">Čl. 7 — Prava i obaveze</a></li>
              <li><a href="#clan-8">Čl. 8 — Organi</a></li>
              <li><a href="#clan-9">Čl. 9 — Skupština</a></li>
              <li><a href="#clan-10">Čl. 10 — Upravni odbor</a></li>
              <li><a href="#clan-11">Čl. 11 — Predsednik</a></li>
              <li><a href="#clan-12">Čl. 12 — Nadležnosti UO</a></li>
              <li><a href="#clan-13">Čl. 13 — Nadzorni odbor</a></li>
              <li><a href="#clan-14">Čl. 14 — Javnost rada</a></li>
              <li><a href="#clan-15">Čl. 15 — Saradnja</a></li>
              <li><a href="#clan-16">Čl. 16 — Sredstva</a></li>
              <li><a href="#clan-17">Čl. 17 — Privredna delatnost</a></li>
              <li><a href="#clan-18">Čl. 18 — Prestanak rada</a></li>
              <li><a href="#clan-19">Čl. 19 — Imovina</a></li>
              <li><a href="#clan-20">Čl. 20 — Pečat</a></li>
              <li><a href="#clan-21">Čl. 21 — Primena zakona</a></li>
              <li><a href="#clan-22">Čl. 22 — Stupanje na snagu</a></li>
            </ol>
          </nav>

          <article className="statut-content">
            <p className="statut-uvod">
              U skladu sa odredbama čl. 11. i 12. Zakona o udruženjima („Sl. glasnik RS",
              br. 51/09, 99/2011, 44/2018 — dr. zakon), na osnivačkoj skupštini održanoj
              dana 23.06.2026. godine, u Nišu, Opština Pantelej, Salvadora Dalija 27,
              usvojen je
            </p>
            <h2 className="statut-naslov-akta">STATUT UDRUŽENJA „БЕДЕМ 018"</h2>

            {/* Član 1 */}
            <div id="clan-1" className="statut-clan">
              <h3 className="statut-clan__naslov">Oblast ostvarivanja ciljeva</h3>
              <p className="statut-clan__broj">Član 1.</p>
              <p>
                Udruženje „БЕДЕМ 018" (u daljem tekstu: Udruženje) je nevladino i neprofitno
                udruženje, osnovano na neodređeno vreme radi ostvarivanja ciljeva u oblasti:
              </p>
              <ol className="statut-lista">
                <li>Društvenih delatnosti</li>
                <li>Komunalnih problema</li>
                <li>Zaštite životinja i životne sredine</li>
                <li>Kulture i medija</li>
                <li>Omladine i sporta</li>
                <li>Turizma i očuvanja istorijske i kulturne baštine</li>
              </ol>
            </div>

            {/* Član 2 */}
            <div id="clan-2" className="statut-clan">
              <h3 className="statut-clan__naslov">Ciljevi udruženja</h3>
              <p className="statut-clan__broj">Član 2.</p>
              <ol className="statut-lista">
                <li>unapređivanje kvaliteta života, edukacija građana a posebno dece i mladih;</li>
                <li>organizovanje aktivnosti kao i javno zalaganje po svim društvenim i ekonomskim pitanjima;</li>
                <li>zalaganje za bolje uslove i više podsticajnih mera za one koji se bave inovacionim tehnologijama i generalno za domaće, lokalne i male preduzetnike i početnike u biznisu;</li>
                <li>rad na povećanju svesti o ekologiji i zaštiti životne sredine;</li>
                <li>informisanje javnosti putem pisanih tekstova, intervjua i snimaka putem sajtova, portala, društvenih mreža i drugih vidova elektronskih medija;</li>
                <li>aktivniji rad na polju kulturno-umetničkog stvaralaštva i istorijskog nasleđa;</li>
                <li>zagovaranje višeg stepena tolerancije, slobodu izražavanja, jednakost i ljudska prava;</li>
                <li>rad na promociji i razvoju turizma na jugu Srbije;</li>
                <li>aktivno zagovaranje i rad na zaštiti životinja;</li>
                <li>borba za transparentnost rada javnih institucija;</li>
                <li>predlaganje rešenja za lokalne i nacionalne probleme;</li>
                <li>edukacija građana o njihovim pravima i obavezama;</li>
                <li>unapređenje komunalne infrastrukture;</li>
                <li>podizanje svesti o nacionalnim interesima;</li>
                <li>rešavanje statusa ratnih vojnih veterana;</li>
                <li>aktivnosti na rešavanju socijalnih, penzionih i zdravstvenih pitanja.</li>
              </ol>
            </div>

            {/* Član 3 */}
            <div id="clan-3" className="statut-clan">
              <h3 className="statut-clan__naslov">Aktivnosti udruženja</h3>
              <p className="statut-clan__broj">Član 3.</p>
              <p>Radi ostvarivanja svojih ciljeva Udruženje naročito:</p>
              <ol className="statut-lista">
                <li>prikuplja i obrađuje naučnu i stručnu literaturu iz relevantnih oblasti;</li>
                <li>organizuje, samo ili u zajednici sa drugim organizacijama, stručne skupove, savetovanja, seminare i druge oblike edukacije;</li>
                <li>objavljuje knjige i druge publikacije;</li>
                <li>organizuje prosvetne radnike i druge stručnjake za rad na edukaciji dece i omladine u oblasti zaštite životne sredine i za sprovođenje aktivnosti na zaštiti i uređenju prirode i ostalih relevantnih oblasti;</li>
                <li>organizuje volonterske akcije za čišćenje i zaštitu prirode, pošumljavanje i ozelenjavanjeuroženih delova naselja i njihove okoline;</li>
                <li>sarađuje sa univerzitetima, školama, stručnim udruženjima i drugim organizacijama u zemlji i inostranstvu.</li>
              </ol>
            </div>

            {/* Član 4 */}
            <div id="clan-4" className="statut-clan">
              <h3 className="statut-clan__naslov">Naziv i sedište</h3>
              <p className="statut-clan__broj">Član 4.</p>
              <p>Naziv Udruženja je: <strong>„БЕДЕМ 018"</strong></p>
              <p>Udruženje ima sedište u Nišu, Opština Pantelej, Ilindenska 66.</p>
              <p>Udruženje svoju delatnost ostvaruje na teritoriji Republike Srbije.</p>
            </div>

            {/* Član 5 */}
            <div id="clan-5" className="statut-clan">
              <h3 className="statut-clan__naslov">Uslovi i način učlanjivanja i prestanka članstva</h3>
              <p className="statut-clan__broj">Član 5.</p>
              <p>
                Član Udruženja može biti svako lice koje prihvata ciljeve Udruženja i Statut
                i podnese prijavu za učlanjenje Upravnom odboru Udruženja.
              </p>
              <p>
                Maloletno lice sa navršenih 14 godina života može se učlaniti u udruženje
                uz prilaganje overene izjave njegovog zakonskog zastupnika o davanju saglasnosti.
              </p>
              <p>
                Za lice mlađe od 14 godina iz stava 1. ovog člana prijavu podnosi njegov
                zakonski zastupnik.
              </p>
            </div>

            {/* Član 6 */}
            <div id="clan-6" className="statut-clan">
              <h3 className="statut-clan__naslov">Prijem i prestanak članstva</h3>
              <p className="statut-clan__broj">Član 6.</p>
              <p>
                Odluku o prijemu u članstvo donosi Skupština i o tome bez odlaganja obaveštava
                podnosioca prijave.
              </p>
              <p>
                Član može istupiti iz članstva davanjem pisane izjave o istupanju. Za istupanje
                maloletnog člana nije potrebna saglasnost zakonskog zastupnika.
              </p>
              <p>
                Članstvo u Udruženju može prestati zbog duže neaktivnosti člana, nepoštovanja
                odredaba ovog statuta ili narušavanja ugleda Udruženja. Odluku o prestanku
                članstva donosi Skupština, na obrazloženi predlog Upravnog odbora. Članu se
                mora omogućiti da se izjasni o razlozima zbog kojih je podnet predlog za
                donošenje odluke o prestanku njegovog članstva u Udruženju.
              </p>
            </div>

            {/* Član 7 */}
            <div id="clan-7" className="statut-clan">
              <h3 className="statut-clan__naslov">Prava, obaveze i odgovornost članstva</h3>
              <p className="statut-clan__broj">Član 7.</p>
              <p>Član Udruženja ima pravo da:</p>
              <ol className="statut-lista">
                <li>ravnopravno sa drugim članovima učestvuje u ostvarivanju ciljeva Udruženja;</li>
                <li>neposredno učestvuje u odlučivanju na Skupštini, kao i preko organa Udruženja;</li>
                <li>bira i bude biran u organe Udruženja;</li>
                <li>bude blagovremeno i potpuno informisan o radu i aktivnostima Udruženja.</li>
              </ol>
              <p>Član je dužan da:</p>
              <ol className="statut-lista">
                <li>aktivno doprinosi ostvarivanju ciljeva Udruženja;</li>
                <li>učestvuje, u skladu sa interesovanjem, u aktivnostima Udruženja;</li>
                <li>plaća članarinu;</li>
                <li>obavlja druge poslove koje mu poveri Upravni odbor.</li>
              </ol>
            </div>

            {/* Član 8 */}
            <div id="clan-8" className="statut-clan">
              <h3 className="statut-clan__naslov">Unutrašnja organizacija</h3>
              <p className="statut-clan__broj">Član 8.</p>
              <p>Organi Udruženja su Skupština, Upravni odbor i Nadzorni odbor.</p>
              <p>
                Funkciju zastupnika vrši Predsednik Upravnog odbora, a u njegovom odsustvu
                zamenik Predsednika Upravnog odbora.
              </p>
            </div>

            {/* Član 9 */}
            <div id="clan-9" className="statut-clan">
              <h3 className="statut-clan__naslov">Skupština</h3>
              <p className="statut-clan__broj">Član 9.</p>
              <p>Skupštinu Udruženja čine svi njegovi članovi.</p>
              <p>
                Skupština se redovno sastaje jednom godišnje. Vanredna sednica Skupštine može
                se zakazati na obrazloženi predlog Upravnog odbora, kao i na inicijativu
                najmanje jedne trećine članova skupštine. Inicijativa se podnosi Upravnom
                odboru u pisanom obliku i u njoj se moraju navesti pitanja čije se razmatranje
                predlaže.
              </p>
              <p>
                Sednicu skupštine saziva predsednik Upravnog odbora, pisanim obaveštenjem o
                mestu i vremenu održavanja skupštine i predlogu dnevnog reda. Sednicom
                predsedava lice koje bude, javnim glasanjem, izabrano na početku sednice.
              </p>
              <p>Skupština:</p>
              <ol className="statut-lista">
                <li>donosi plan i program rada;</li>
                <li>usvaja Statut, kao i izmene i dopune Statuta;</li>
                <li>usvaja druge opšte akte Udruženja;</li>
                <li>bira i razrešava članove Upravnog odbora;</li>
                <li>razmatra i usvaja, najmanje jednom godišnje, izveštaj Upravnog odbora;</li>
                <li>razmatra i usvaja finansijski plan i izveštaj;</li>
                <li>odlučuje o statusnim promenama i prestanku rada udruženja;</li>
                <li>odlučuje o udruživanju u saveze i druge asocijacije u zemlji i inostranstvu.</li>
              </ol>
              <p>
                Skupština punopravno odlučuje ako je prisutna najmanje jedna polovina članova.
                Skupština odlučuje većinom glasova prisutnih članova. Za odluku o izmenama i
                dopunama Statuta, statusnim promenama i prestanku rada Udruženja neophodna je
                dvotrećinska većina glasova prisutnih članova.
              </p>
            </div>

            {/* Član 10 */}
            <div id="clan-10" className="statut-clan">
              <h3 className="statut-clan__naslov">Upravni odbor</h3>
              <p className="statut-clan__broj">Član 10.</p>
              <p>
                Upravni odbor je izvršni organ Udruženja, koji se stara o sprovođenju ciljeva
                udruženja koji su utvrđeni ovim Statutom.
              </p>
              <p>
                Upravni odbor ima 5 članova, koje bira i opoziva Skupština. Mandat članova
                Upravnog odbora traje 1 godinu i mogu se ponovo birati na istu funkciju.
              </p>
              <p>Upravni odbor iz reda svojih članova bira predsednika i zamenika predsednika.</p>
            </div>

            {/* Član 11 */}
            <div id="clan-11" className="statut-clan">
              <h3 className="statut-clan__naslov">Predsednik Upravnog odbora</h3>
              <p className="statut-clan__broj">Član 11.</p>
              <p>
                Predsednik Upravnog odbora zastupa Udruženje u pravnom prometu i ima prava i
                dužnosti finansijskog nalogodavca.
              </p>
              <p>
                Zamenik predsednika je ovlašćen da, u odsustvu predsednika upravnog odbora,
                zastupa Udruženje i potpisuje sva finansijska i novčana dokumenta u ime
                Udruženja.
              </p>
            </div>

            {/* Član 12 */}
            <div id="clan-12" className="statut-clan">
              <h3 className="statut-clan__naslov">Nadležnosti Upravnog odbora</h3>
              <p className="statut-clan__broj">Član 12.</p>
              <p>Upravni odbor:</p>
              <ol className="statut-lista">
                <li>rukovodi radom Udruženja između dve sednice Skupštine i donosi odluke radi ostvarivanja ciljeva Udruženja;</li>
                <li>organizuje redovno obavljanje delatnosti Udruženja;</li>
                <li>poverava posebne poslove pojedinim članovima;</li>
                <li>donosi finansijske odluke;</li>
                <li>odlučuje o pokretanju postupka za izmene i dopune Statuta, sopstvenom inicijativom ili na predlog najmanje pet članova Udruženja i priprema predlog izmena i dopuna, koji podnosi Skupštini na usvajanje;</li>
                <li>odlučuje o pokretanju postupka za naknadu štete u slučajevima iz člana 25. stav 2. Zakona o udruženjima i, po potrebi, određuje posebnog zastupnika udruženja za taj postupak;</li>
                <li>odlučuje o drugim pitanjima za koja nisu, zakonom ili ovim statutom, ovlašćeni drugi organi Udruženja.</li>
              </ol>
              <p>
                Upravni odbor punovažno odlučuje ako je prisutna najmanje jedna polovina
                članova, a odluke donosi većinom glasova svih članova.
              </p>
            </div>

            {/* Član 13 */}
            <div id="clan-13" className="statut-clan">
              <h3 className="statut-clan__naslov">Nadzorni odbor</h3>
              <p className="statut-clan__broj">Član 13.</p>
              <p>
                Nadzorni odbor kontroliše finansijsko poslovanje Udruženja i o uočenim
                nepravilnostima, bez odlaganja, obaveštava Upravni odbor.
              </p>
              <p>
                Nadzorni odbor ima pet članova koje bira Skupština. Mandat članova nadzornog
                odbora traje 1 godinu i mogu biti ponovo birani.
              </p>
              <p>Nadzorni odbor podnosi izveštaj na svakoj sednici Skupštine.</p>
            </div>

            {/* Član 14 */}
            <div id="clan-14" className="statut-clan">
              <h3 className="statut-clan__naslov">Ostvarivanje javnosti rada</h3>
              <p className="statut-clan__broj">Član 14.</p>
              <p>
                Rad Udruženja je javan. Upravni odbor se stara o redovnom obaveštavanju
                članstva i javnosti o radu i aktivnostima Udruženja, neposredno ili putem
                internih publikacija, odnosno putem saopštenja za javnost, ili na drugi
                primereni način.
              </p>
              <p>
                Godišnji obračuni i izveštaji o aktivnosti udruženja podnose se članovima
                na sednici skupštine udruženja.
              </p>
            </div>

            {/* Član 15 */}
            <div id="clan-15" className="statut-clan">
              <h3 className="statut-clan__naslov">Saradnja</h3>
              <p className="statut-clan__broj">Član 15.</p>
              <p>
                Radi ostvarenja svojih ciljeva Udruženje uspostavlja kontakte i sarađuje sa
                drugim udruženjima i organizacijama u zemlji i inostranstvu.
              </p>
              <p>
                Udruženje može pristupiti međunarodnim udruženjima za zaštitu životne sredine,
                o čemu odluku donosi Skupština.
              </p>
            </div>

            {/* Član 16 */}
            <div id="clan-16" className="statut-clan">
              <h3 className="statut-clan__naslov">Način sticanja sredstava i raspolaganje</h3>
              <p className="statut-clan__broj">Član 16.</p>
              <p>
                Udruženje pribavlja sredstva od članarine, dobrovoljnih priloga, donacija i
                poklona, finansijskih subvencija i na drugi zakonom dozvoljen način.
              </p>
              <p>
                Udruženje može pribavljati sredstva i od kotizacije za seminare i druge oblike
                obrazovanja iz oblasti zaštite životne sredine, kao i prodajom sekundarnih
                sirovina prikupljenih tokom realizacije akcija za čišćenje životne sredine ili
                proizvoda nastalih u okviru edukativnih radionica.
              </p>
            </div>

            {/* Član 17 */}
            <div id="clan-17" className="statut-clan">
              <h3 className="statut-clan__naslov">Privredna delatnost</h3>
              <p className="statut-clan__broj">Član 17.</p>
              <p>Udruženje pribavlja sredstva obavljajući privrednu delatnost: <strong>9499</strong>.</p>
              <p>
                Udruženje može početi sa neposrednim obavljanjem ove delatnosti tek nakon
                izvršenog upisa u Registar privrednih subjekata.
              </p>
              <p>
                Dobit ostvarena na ovaj način može se koristiti isključivo za ostvarivanje
                ciljeva udruženja, uključujući i troškove redovnog rada Udruženja i sopstveno
                učešće u finansiranju određenih projekata.
              </p>
            </div>

            {/* Član 18 */}
            <div id="clan-18" className="statut-clan">
              <h3 className="statut-clan__naslov">Prestanak rada udruženja</h3>
              <p className="statut-clan__broj">Član 18.</p>
              <p>
                Udruženje prestaje sa radom odlukom Skupštine, kada prestanu uslovi za
                ostvarivanje ciljeva Udruženja, kao i u drugim slučajevima predviđenim zakonom.
              </p>
            </div>

            {/* Član 19 */}
            <div id="clan-19" className="statut-clan">
              <h3 className="statut-clan__naslov">Postupanje sa imovinom u slučaju prestanka</h3>
              <p className="statut-clan__broj">Član 19.</p>
              <p>
                U slučaju prestanka rada, imovina Udruženja preneće se na domaće nedobitno
                pravno lice koje je osnovano radi ostvarivanja istih ili sličnih ciljeva,
                odnosno Skupština će odlukom o prestanku odrediti kome se imovina prenosi
                u skladu sa Zakonom.
              </p>
            </div>

            {/* Član 20 */}
            <div id="clan-20" className="statut-clan">
              <h3 className="statut-clan__naslov">Izgled i sadržina pečata</h3>
              <p className="statut-clan__broj">Član 20.</p>
              <p>
                Udruženje ima pečat okruglog oblika na kojem je u gornjoj polovini ispisano:
                u gornjem delu polukružno „Удружење грађана", u donjem delu prati ivicu
                „Илинденска 66, Ниш", dok na sredini vodoravno stoji naziv „БЕДЕМ 018".
              </p>
            </div>

            {/* Član 21 */}
            <div id="clan-21" className="statut-clan">
              <h3 className="statut-clan__naslov">Primena zakona</h3>
              <p className="statut-clan__broj">Član 21.</p>
              <p>
                Na sva pitanja koja nisu regulisana ovim statutom neposredno će se primenjivati
                odredbe Zakona o udruženjima.
              </p>
            </div>

            {/* Član 22 */}
            <div id="clan-22" className="statut-clan">
              <h3 className="statut-clan__naslov">Stupanje na snagu</h3>
              <p className="statut-clan__broj">Član 22.</p>
              <p>
                Ovaj statut stupa na snagu danom njegovog usvajanja na osnivačkoj skupštini
                Udruženja.
              </p>
            </div>

            <div className="statut-potpis">
              <p>Predsedavajući osnivačke skupštine Udruženja</p>
              <div className="statut-potpis__linija" aria-hidden="true" />
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
