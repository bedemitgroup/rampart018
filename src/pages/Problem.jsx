import { useState } from 'react';

import { api } from '../services/api';
import HoneypotField, { HONEYPOT_NAME } from '../components/HoneypotField';

import './Problem.css';

const categories = [
  'Komunalni problemi',
  'Kršenje prava',
  'Nezakonita gradnja',
  'Korupcija',
  'Ekološki problem',
  'Diskriminacija',
  'Nepravilnosti u institucijama',
  'Ostalo',
];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  category: '',
  location: '',
  message: '',
  anonymous: false,
  consent: false,
  [HONEYPOT_NAME]: '',
};

export default function Problem() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};

    if (!form.anonymous && !form.name.trim()) {
      errs.name =
        'Ime je obavezno (ili označite "Šaljem anonimno")';
    }

    if (!form.anonymous && !form.email.trim()) {
      errs.email = 'Email adresa je obavezna';
    } else if (
      !form.anonymous &&
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      errs.email = 'Unesite ispravnu email adresu';
    }

    if (
      !form.anonymous &&
      form.phone.trim() &&
      !form.phone.trim().startsWith('+')
    ) {
      errs.phone =
        'Broj telefona unesite sa pozivnim brojem, npr. +381 64 123 45 67';
    }

    if (!form.category) {
      errs.category = 'Izaberite kategoriju';
    }

    if (!form.message.trim()) {
      errs.message = 'Opis problema je obavezan';
    } else if (form.message.trim().length < 30) {
      errs.message =
        'Molimo opišite problem detaljnije (min. 30 karaktera)';
    }

    if (!form.consent) {
      errs.consent =
        'Morate prihvatiti uslove obrade podataka';
    }

    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      const data = await api.createProblemReport({
        name: form.anonymous ? null : form.name.trim(),
        email: form.anonymous ? null : form.email.trim(),
        phone: form.anonymous
          ? null
          : form.phone.trim() || null,
        category: form.category,
        location: form.location.trim() || null,
        message: form.message.trim(),
        anonymous: form.anonymous,
        consent: form.consent,
        [HONEYPOT_NAME]: form[HONEYPOT_NAME],
      });

      setReference(data?.id ?? null);
      setSubmitted(true);
    } catch (error) {
      console.error('Problem report error:', error);

      setErrors({
        submit:
          error.message ||
          'Došlo je do greške. Pokušajte ponovo.',
      });
    }
  };

  const handleReset = () => {
    setForm(initialForm);
    setErrors({});
    setSubmitted(false);
    setReference(null);
  };

  return (
    <>
      <section className="page-hero page-hero--accent">
        <div className="container page-hero__content">
          <span className="page-hero__badge">
            Prijavi problem
          </span>

          <h1 className="page-hero__title">
            Podeli problem sa nama
          </h1>

          <p className="page-hero__subtitle">
            Svaki glas je važan. Tvoja prijava pomaže nam da identifikujemo
            sistemske probleme i pronađemo rešenja.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="section section--light">
        <div className="container">
          <div className="problem-how">
            <div className="problem-how__step">
              <div className="problem-how__num">1</div>

              <div>
                <h3>Opišeš problem</h3>

                <p>
                  Što detaljniji opis, to smo efikasniji. Možeš ostati anoniman.
                </p>
              </div>
            </div>

            <div className="problem-how__arrow">→</div>

            <div className="problem-how__step">
              <div className="problem-how__num">2</div>

              <div>
                <h3>Naš tim analizira</h3>

                <p>
                  U roku od 48h procenjujemo prijavu i kontaktiramo te.
                </p>
              </div>
            </div>

            <div className="problem-how__arrow">→</div>

            <div className="problem-how__step">
              <div className="problem-how__num">3</div>

              <div>
                <h3>Preduzimamo akciju</h3>

                <p>
                  Pravna pomoć, posredovanje ili javna akcija — zavisno od
                  slučaja.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form section */}
      <section className="section">
        <div className="container problem-section">
          <div className="problem-info">
            <div className="problem-info__card">
              <h3>📬 Šta se dešava sa prijavom?</h3>

              <ul>
                <li>Svaka prijava dolazi do našeg pravnog tima</li>
                <li>Čuvamo poverljivost svih informacija</li>
                <li>Možeš pratiti status prijave putem emaila</li>
                <li>Bezplatna pravna procena u roku od 48h</li>
              </ul>
            </div>

            <div className="problem-info__card">
              <h3>🔒 Zaštita podataka</h3>

              <ul>
                <li>Podaci se ne dele sa trećim stranama</li>
                <li>Opcija potpune anonimnosti</li>
                <li>Svi podaci se čuvaju u skladu sa GDPR</li>
                <li>Možeš zahtevati brisanje u svakom trenutku</li>
              </ul>
            </div>

            <div className="problem-info__card problem-info__card--highlight">
              <h3>📞 Hitna pomoć</h3>

              <p>
                Za urgentne situacije koje zahtevaju brzu reakciju, možeš nas
                pozvati direktno:
              </p>

              <a
                href="tel:+38121000000"
                className="problem-info__phone"
              >
                +381 21 000 000
              </a>

              <p className="problem-info__hours">
                Pon–Pet, 9:00–17:00
              </p>
            </div>
          </div>

          <div className="problem-form-wrap">
            {submitted ? (
              <div className="problem-success">
                <div className="problem-success__icon">✅</div>

                <h2 className="problem-success__title">
                  Prijava primljena!
                </h2>

                <p className="problem-success__text">
                  Naš tim će pregledati tvoju prijavu i preduzeti
                  odgovarajuće korake.

                  {!form.anonymous &&
                    ' Ako je ostavljena email adresa, možemo te kontaktirati u vezi sa prijavom.'}
                </p>

                {reference != null && (
                  <p className="problem-success__ref">
                    Referentni broj:{' '}
                    <strong>
                      BDM-{String(reference).padStart(6, '0')}
                    </strong>
                  </p>
                )}

                <button
                  className="btn btn--primary btn--lg"
                  onClick={handleReset}
                >
                  Pošalji novu prijavu
                </button>
              </div>
            ) : (
              <form
                className="problem-form"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="problem-form__header">
                  <h2>Forma za prijavu problema</h2>

                  <p>
                    Sva polja označena sa{' '}
                    <span className="required-star">*</span> su obavezna
                  </p>
                </div>

                <div className="problem-form__check">
                  <label className="problem-checkbox">
                    <input
                      type="checkbox"
                      name="anonymous"
                      checked={form.anonymous}
                      onChange={handleChange}
                    />

                    <span className="problem-checkbox__box"></span>

                    <span>Šaljem prijavu anonimno</span>
                  </label>
                </div>

                {!form.anonymous && (
                  <>
                    <div className="form-group">
                      <label
                        className="form-label"
                        htmlFor="name"
                      >
                        Ime i prezime{' '}
                        <span className="required-star">*</span>
                      </label>

                      <input
                        id="name"
                        name="name"
                        type="text"
                        className={`form-input${
                          errors.name
                            ? ' form-input--error'
                            : ''
                        }`}
                        placeholder="Petar Petrović"
                        value={form.name}
                        onChange={handleChange}
                      />

                      {errors.name && (
                        <span className="form-error">
                          {errors.name}
                        </span>
                      )}
                    </div>

                    <div className="problem-form__row">
                      <div className="form-group">
                        <label
                          className="form-label"
                          htmlFor="email"
                        >
                          Email adresa{' '}
                          <span className="required-star">*</span>
                        </label>

                        <input
                          id="email"
                          name="email"
                          type="email"
                          className={`form-input${
                            errors.email
                              ? ' form-input--error'
                              : ''
                          }`}
                          placeholder="vas@email.com"
                          value={form.email}
                          onChange={handleChange}
                        />

                        {errors.email && (
                          <span className="form-error">
                            {errors.email}
                          </span>
                        )}
                      </div>

                      <div className="form-group">
                        <label
                          className="form-label"
                          htmlFor="phone"
                        >
                          Telefon{' '}
                          <span className="form-optional">
                            (opciono, sa pozivnim brojem)
                          </span>
                        </label>

                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          className={`form-input${
                            errors.phone
                              ? ' form-input--error'
                              : ''
                          }`}
                          placeholder="+381 64 123 45 67"
                          value={form.phone}
                          onChange={handleChange}
                        />

                        {errors.phone && (
                          <span className="form-error">
                            {errors.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="problem-form__row">
                  <div className="form-group">
                    <label
                      className="form-label"
                      htmlFor="category"
                    >
                      Kategorija problema{' '}
                      <span className="required-star">*</span>
                    </label>

                    <select
                      id="category"
                      name="category"
                      className={`form-select${
                        errors.category
                          ? ' form-input--error'
                          : ''
                      }`}
                      value={form.category}
                      onChange={handleChange}
                    >
                      <option value="">
                        — Izaberi kategoriju —
                      </option>

                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    {errors.category && (
                      <span className="form-error">
                        {errors.category}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label
                      className="form-label"
                      htmlFor="location"
                    >
                      Lokacija{' '}
                      <span className="form-optional">
                        (opciono)
                      </span>
                    </label>

                    <input
                      id="location"
                      name="location"
                      type="text"
                      className="form-input"
                      placeholder="Grad, opština, adresa..."
                      value={form.location}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="message"
                  >
                    Opis problema{' '}
                    <span className="required-star">*</span>
                  </label>

                  <textarea
                    id="message"
                    name="message"
                    className={`form-textarea${
                      errors.message
                        ? ' form-input--error'
                        : ''
                    }`}
                    placeholder="Opišite problem što detaljnije: šta se dogodilo, kada, ko je uključen, kakve su posledice..."
                    rows={7}
                    value={form.message}
                    onChange={handleChange}
                  />

                  <div className="problem-form__counter">
                    {form.message.length} karaktera{' '}
                    {form.message.length < 30 &&
                      form.message.length > 0 &&
                      `(potrebno još ${
                        30 - form.message.length
                      })`}
                  </div>

                  {errors.message && (
                    <span className="form-error">
                      {errors.message}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label
                    className={`problem-checkbox${
                      errors.consent
                        ? ' problem-checkbox--error'
                        : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="consent"
                      checked={form.consent}
                      onChange={handleChange}
                    />

                    <span className="problem-checkbox__box"></span>

                    <span>
                      Saglasan/na sam sa{' '}
                      <a
                        href="#"
                        className="problem-form__link"
                      >
                        politikom privatnosti
                      </a>{' '}
                      i obradom ličnih podataka u svrhu postupanja
                      po prijavi.{' '}
                      <span className="required-star">*</span>
                    </span>
                  </label>

                  {errors.consent && (
                    <span className="form-error">
                      {errors.consent}
                    </span>
                  )}
                </div>

                <HoneypotField
                  value={form[HONEYPOT_NAME]}
                  onChange={(v) =>
                    setForm({ ...form, [HONEYPOT_NAME]: v })
                  }
                />

                {errors.submit && (
                  <div
                    className="form-error"
                    style={{ marginBottom: '1rem' }}
                  >
                    {errors.submit}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn--accent btn--lg problem-form__submit"
                >
                  Pošalji prijavu →
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}