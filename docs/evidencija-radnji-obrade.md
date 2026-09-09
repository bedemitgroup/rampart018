# Evidencija radnji obrade

Vođena po **članu 47. Zakona o zaštiti podataka o ličnosti** („Službeni glasnik RS", br. 87/2018).

> **Zašto je obavezna.** Izuzetak od vođenja evidencije za rukovaoce sa manje od 250 zaposlenih
> (čl. 47 st. 5) **ne primenjuje se** ovde, iz dva razloga navedena u samom zakonu: obrada nije
> povremena, i obuhvata **posebne vrste podataka o ličnosti** (potpisi peticija otkrivaju političko
> mišljenje).

Popunjeno iz stvarne šeme baze — vidi `backend/BedemApi/Data/AppDbContext.cs`. Kada se šema menja,
menja se i ovaj dokument.

---

## Rukovalac

| Stavka | Vrednost |
|---|---|
| Naziv | Udruženje Građana Bedem (APR/companywall: „BEDEM 018") |
| Sedište | Ilindenska 66, 18103 Niš (Pantelej) |
| Matični broj | 28419635 (PIB 115867202) |
| Kontakt za zaštitu podataka | bedem018@gmail.com |
| Lice za zaštitu podataka (čl. 56) | Nije određeno — obrada posebnih vrsta podataka nije osnovna delatnost udruženja i nije velikih razmera. Preispitati ako broj potpisa značajno poraste. |
| Obrađivač (čl. 45) | **Hetzner Online GmbH**, Nemačka — hosting servera (aplikacija, baza, otpremljeni fajlovi). Potpisati ugovor o obradi podataka (DPA) pre puštanja u rad; Hetzner nudi standardni DPA. |

> **Iznošenje iz zemlje.** Serveri su u Nemačkoj. Nemačka je članica EU i na listi
> država/teritorija sa obezbeđenim primerenim nivoom zaštite (čl. 64 ZZPL i Odluka
> Vlade), pa prenos **ne zahteva poseban osnov ni odobrenje Poverenika** — dovoljan je
> ugovor o obradi sa Hetznerom. Ovo važi za sve radnje obrade niže.

---

## 1. Nalozi korisnika

| | |
|---|---|
| **Svrha** | Prijava na sajt, komentarisanje, potpisivanje peticija, učešće u radu udruženja |
| **Kategorije lica** | Registrovani posetioci, članovi, osoblje udruženja |
| **Kategorije podataka** | Korisničko ime, email adresa, kriptovana lozinka (bcrypt), rola, datum registracije, status naloga |
| **Pravni osnov** | Izvršenje ugovora o korišćenju usluge (čl. 12 st. 1 tač. 2) |
| **Primaoci** | Nema, osim obrađivača (Hetzner) kao hostinga. Podaci se ne dele sa trećim licima. |
| **Iznošenje iz zemlje** | Nemačka (Hetzner) — vidi napomenu kod Rukovaoca. Ne zahteva poseban osnov. |
| **Rok čuvanja** | Dok postoji nalog |
| **Tabela** | `Users` |

## 2. Potpisi peticija — POSEBNA VRSTA PODATAKA

| | |
|---|---|
| **Svrha** | Evidentiranje podrške zahtevu koji udruženje upućuje trećem licu |
| **Kategorije lica** | Registrovani korisnici koji potpišu peticiju |
| **Kategorije podataka** | Ime, prezime, grad, veza sa nalogom, vreme potpisa, saglasnost za javno prikazivanje, **pun tekst i verzija date saglasnosti** |
| **Posebna vrsta** | **Da.** Podatak o potpisivanju određene peticije otkriva političko mišljenje (čl. 17 st. 1) |
| **Pravni osnov** | **Izričit pristanak** lica (čl. 17 st. 2 tač. 1). Nijedan drugi osnov se ne koristi. |
| **Dokaz pristanka** | Tekst saglasnosti se upisuje na server-skoj strani u sam red potpisa (`PetitionSignature.ConsentText`), nikada iz zahteva klijenta — vidi `Models/PetitionConsent.cs` |
| **Javno prikazivanje** | Samo uz **zaseban** pristanak (`PublicDisplay`). Nije uslov za potpisivanje. |
| **Povlačenje pristanka** | Samostalno, na `/moji-potpisi`. Povlačenje **briše red**, ne označava ga. |
| **Primaoci** | Javno se prikazuju ime, prezime i grad **isključivo** onih potpisnika koji su to posebno dozvolili. Pun spisak vide samo role Moderator i Admin. |
| **Rok čuvanja** | **12 meseci od zatvaranja peticije**, zatim automatsko brisanje ličnih podataka; ostaje samo ukupan broj |
| **Ko sprovodi brisanje** | `Services/PetitionRetentionService.cs` (dnevni prolaz) i ručno dugme u panelu |
| **Tabele** | `PetitionSignatures`, `Petitions` |

## 3. Prijave problema

| | |
|---|---|
| **Svrha** | Postupanje po prijavi građana |
| **Kategorije podataka** | Ime, email, telefon, kategorija, lokacija, opis problema, oznaka anonimnosti, saglasnost |
| **Pravni osnov** | Pristanak (čl. 12 st. 1 tač. 1) |
| **Napomena** | Prijava može biti anonimna — tada se ime, email i telefon ne upisuju |
| **Rok čuvanja** | `[POPUNITI — trenutno nije definisan ni u politici ni u kodu]` |
| **Tabela** | `ProblemReports` |

## 4. Zahtevi za članstvo

| | |
|---|---|
| **Svrha** | Odlučivanje o prijemu u članstvo |
| **Kategorije podataka** | Ime, prezime, email, telefon, grad, zanimanje, vrsta članstva, motivacija, veštine, saglasnost, opredeljenje za newsletter |
| **Pravni osnov** | Pristanak / preduzimanje radnji pre zaključenja članstva |
| **Rok čuvanja** | `[POPUNITI — trenutno nije definisan]` |
| **Tabela** | `MembershipApplications` |
| **Otvoreno pitanje** | Polje `Newsletter` ima podrazumevanu vrednost `true`. Unapred štikliran pristanak nije valjan pristanak (čl. 23). Ispraviti. |

## 5. Komentari i reakcije

| | |
|---|---|
| **Svrha** | Javna rasprava uz objavljene vesti |
| **Kategorije podataka** | Sadržaj komentara, vreme, nalog autora, status odobrenja |
| **Pravni osnov** | Izvršenje ugovora o korišćenju usluge |
| **Rok čuvanja** | Dok postoji nalog ili do brisanja komentara |
| **Tabele** | `Comments`, `Votes` |

## 6. Rad skupštine

| | |
|---|---|
| **Svrha** | Vođenje evidencije o sednicama, prisustvu i odlukama udruženja |
| **Kategorije lica** | Članovi udruženja |
| **Kategorije podataka** | Prisustvo, način učešća, glasovi po tačkama dnevnog reda, poeni |
| **Pravni osnov** | Legitimni interes / obaveze udruženja prema statutu |
| **Napomena** | Glasanje na skupštini je javno po članu — to je odluka udruženja zapisana u statutu, a ne tehnička posledica |
| **Rok čuvanja** | Trajno — zapisnik o odlukama |
| **Tabele** | `AssemblySessions`, `AssemblyAttendances`, `AssemblyVotes`, `AssemblyPoints` |

## 7. Dnevnik izmena u admin panelu

| | |
|---|---|
| **Svrha** | Odgovornost za postupke osoblja udruženja |
| **Kategorije lica** | Osoblje sa pristupom panelu |
| **Kategorije podataka** | Nalog, rola, radnja, entitet, **IP adresa**, podaci o pregledaču, vreme |
| **Pravni osnov** | Legitimni interes (čl. 12 st. 1 tač. 6) |
| **Rok čuvanja** | Trajno |
| **Tabela** | `AuditLogs` |
| **Napomena** | Pojedinačni potpisi peticija i njihova povlačenja se **namerno ne upisuju** ovde — trag koji preživljava povlačenje pristanka i rok čuvanja bio bi druga, večna kopija političkog opredeljenja. Upisuje se samo preuzimanje spiska potpisnika (`Petition.SignaturesExport`) i brisanje potpisa. |

## 8. Zaštita od automatskih prijava

| | |
|---|---|
| **Svrha** | Bezbednost sajta, sprečavanje zloupotrebe formulara |
| **Kategorije podataka** | IP adresa, podaci o pregledaču, sadržaj pokušaja (lozinke i tokeni redigovani) |
| **Pravni osnov** | Legitimni interes |
| **Rok čuvanja** | `[POPUNITI — trenutno nije definisan]` |
| **Tabela** | `BotSubmissions` |

---

## Opšti opis mera zaštite (čl. 47 st. 1 tač. 7)

- Lozinke isključivo u bcrypt heševima; nigde u čitljivom obliku.
- Pristup po rolama, po principu najmanjih ovlašćenja (`Models/Roles.cs`). Spisak potpisnika vide
  samo Moderator i Admin.
- Svaka izmena u panelu i svako preuzimanje spiska potpisnika beleže se u dnevniku izmena.
- Ograničenje broja zahteva po nalogu i IP adresi na svim javnim formama, sa posebno strožim
  ograničenjem za potpisivanje peticija.
- Automatsko brisanje potpisa po isteku roka čuvanja.
- Skriveno polje protiv automatskih prijava na svim javnim formama.

## Otvorene stavke pre puštanja u rad

1. Popuniti preostale oznake `[POPUNITI]` (rokovi čuvanja) u ovom dokumentu i u
   `src/pages/PolitikaPrivatnosti.jsx` (hosting provajder = Hetzner / Nemačka).
2. **Rotirati JWT ključ i lozinku baze na produkciji.** ~~`appsettings.json` je sadržao
   hardkodovan JWT ključ~~ — rešeno: tajne su izbačene iz koda, a `Program.cs` prekida
   pokretanje ako je ključ prazan, prekratak ili jednak iscurelom ključu iz git istorije
   (vidi `docs/deployment.md`). Ostaje: generisati svež `JWT_SECRET` i `POSTGRES_PASSWORD`
   samo na serveru (`deploy/README.md`, korak 4). Iscureli ključ u git istoriji postaje
   bezvredan čim produkcija radi sa novim.
3. Potpisati ugovor o obradi (DPA) sa Hetznerom.
4. Definisati rokove čuvanja za prijave problema, zahteve za članstvo i zapise o automatskim
   prijavama.
5. Ispraviti podrazumevano štikliran `Newsletter` na formi za članstvo.
6. Preispitati potrebu za procenom uticaja (čl. 54) kada broj potpisa postane značajan.
