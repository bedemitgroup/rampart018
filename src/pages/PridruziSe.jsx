import { useState } from 'react';
import './PridruziSe.css';

const membershipTypes = [
  {
    id: 'redovni',
    name: 'Redovni član',
    price: '1.200',
    period: 'godišnje',
    monthly: '100 RSD/mesečno',
    color: 'primary',
    features: [
      'Glasanje na skupštini',
      'Pristup svim aktivnostima',
      'Mesečni newsletter',
      'Besplatna pravna procena (1×)',
      'Članska karta',
    ],
    recommended: false,
  },
  {
    id: 'podrzavalac',
    name: 'Podržavalac',
    price: '3.600',
    period: 'godišnje',
    monthly: '300 RSD/mesečno',
    color: 'secondary',
    features: [
      'Sve beneficije redovnog člana',
      'Prioritetna pravna pomoć',
      '2× besplatne pravne procene',
      'Direktan kontakt sa timom',
      'Pristupi ekskluzivnim izveštajima',
      'Pomen u godišnjem izveštaju',
    ],
    recommended: true,
  },
  {
    id: 'donator',
    name: 'Donator',
    price: 'Po dogovoru',
    period: '',
    monthly: '',
    color: 'accent2',
    features: [
      'Sve beneficije podržavaoca',
      'Direktno finansiranje projekata',
      'Sponzorstvo akcija',
      'Prominentno pomen u medijima',
      'Pristup godišnjoj gali',
      'Personalizovana saradnja',
    ],
    recommended: false,
  },
];

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  occupation: '',
  membershipType: 'redovni',
  motivation: '',
  skills: [],
  newsletter: true,
  consent: false,
};

const skillOptions = [
  'Pravna struka',
  'Novinarstvo',
  'IT i tehnologija',
  'Finansije',
  'Komunikacije',
  'Organizovanje događaja',
  'Prevođenje',
  'Medicina',
  'Arhitektura i urbanizam',
  'Obrazovanje',
  'Ostalo',
];

export default function PridruziSe() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};

    if (!form.firstName.trim()) {
      errs.firstName = 'Ime je obavezno';
    }

    if (!form.lastName.trim()) {
      errs.lastName = 'Prezime je obavezno';
    }

    if (!form.email.trim()) {
      errs.email = 'Email je obavezan';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Unesite ispravnu email adresu';
    }

    if (!form.city.trim()) {
      errs.city = 'Grad je obavezan';
    }

    if (!form.consent) {
      errs.consent = 'Morate prihvatiti uslove';
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

  const handleSkillToggle = (skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleMembershipSelect = (id) => {
    setForm((prev) => ({
      ...prev,
      membershipType: id,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    try {
      const response = await fetch(
        'http://localhost:5000/api/membership-applications',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(form),
        }
      );

      if (!response.ok) {
        let errorMessage = 'Greška pri slanju prijave.';

        try {
          const errorData = await response.json();

          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Ako backend ne vrati JSON, koristimo podrazumevanu poruku.
        }

        throw new Error(errorMessage);
      }

      await response.json();

      setSubmitted(true);
    } catch (error) {
      console.error('Greška pri slanju prijave:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Došlo je do greške pri slanju prijave.'
      );
    }
  };

  return (
    <>
      <section className="page-hero page-hero--success">
        <div className="container page-hero__content">
          <span className="page-hero__badge">Postani član</span>

          <h1 className="page-hero__title">
            Pridruži se Bedemu
          </h1>

          <p className="page-hero__subtitle">
            Postani deo zajednice koja se bori za prava svih građana.
            Zajedno možemo više.
          </p>
        </div>
      </section>

      {/* Membership types */}
      <section className="section section--light">
        <div className="container">
          <div className="section__header">
            <span className="badge badge--primary">
              Vrste članstva
            </span>

            <h2 className="section__title">
              Izaberi nivo podrške
            </h2>

            <div className="divider"></div>
          </div>

          <div className="pridruzi-plans">
            {membershipTypes.map(
              ({
                id,
                name,
                price,
                period,
                monthly,
                color,
                features,
                recommended,
              }) => (
                <div
                  key={id}
                  className={`pridruzi-plan pridruzi-plan--${color}${
                    recommended
                      ? ' pridruzi-plan--recommended'
                      : ''
                  }${
                    form.membershipType === id
                      ? ' pridruzi-plan--selected'
                      : ''
                  }`}
                  onClick={() => handleMembershipSelect(id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    handleMembershipSelect(id)
                  }
                >
                  {recommended && (
                    <div className="pridruzi-plan__badge">
                      Najpopularnije
                    </div>
                  )}

                  <div className="pridruzi-plan__name">
                    {name}
                  </div>

                  <div className="pridruzi-plan__price">
                    <span className="pridruzi-plan__amount">
                      {price}
                    </span>

                    {period && (
                      <span className="pridruzi-plan__currency">
                        {' '}
                        RSD
                      </span>
                    )}

                    {period && (
                      <span className="pridruzi-plan__period">
                        /{period}
                      </span>
                    )}
                  </div>

                  {monthly && (
                    <div className="pridruzi-plan__monthly">
                      {monthly}
                    </div>
                  )}

                  <ul className="pridruzi-plan__features">
                    {features.map((feature) => (
                      <li key={feature}>
                        <span className="pridruzi-plan__check">
                          ✓
                        </span>

                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="pridruzi-plan__select">
                    {form.membershipType === id
                      ? '● Izabrano'
                      : 'Izaberi'}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Registration form */}
      <section className="section">
        <div className="container pridruzi-section">
          {submitted ? (
            <div className="pridruzi-success">
              <div className="pridruzi-success__icon">
                🎉
              </div>

              <h2>
                Dobrodošao/la u Bedem!
              </h2>

              <p>
                Hvala ti na poverenju,{' '}
                <strong>{form.firstName}</strong>! Tvoja prijava za
                članstvo je primljena. Uskoro ćeš dobiti email na
                adresu <strong>{form.email}</strong> sa uputstvima
                za plaćanje članarine i aktivaciju članstva.
              </p>

              <div className="pridruzi-success__info">
                <div>
                  <span>Vrsta članstva:</span>{' '}
                  <strong>
                    {
                      membershipTypes.find(
                        (m) =>
                          m.id === form.membershipType
                      )?.name
                    }
                  </strong>
                </div>

                <div>
                  <span>Email:</span>{' '}
                  <strong>{form.email}</strong>
                </div>
              </div>
            </div>
          ) : (
            <form
              className="pridruzi-form"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="pridruzi-form__header">
                <h2>Obrazac za pristupanje</h2>

                <p>
                  Popuni podatke i postani deo zajednice Bedem
                </p>
              </div>

              {/* Selected plan summary */}
              <div className="pridruzi-form__plan-summary">
                <span>Izabrano članstvo:</span>

                <strong>
                  {
                    membershipTypes.find(
                      (m) =>
                        m.id === form.membershipType
                    )?.name
                  }
                </strong>

                <span className="pridruzi-form__plan-price">
                  {
                    membershipTypes.find(
                      (m) =>
                        m.id === form.membershipType
                    )?.price
                  }

                  {membershipTypes.find(
                    (m) =>
                      m.id === form.membershipType
                  )?.period &&
                    ` RSD/${
                      membershipTypes.find(
                        (m) =>
                          m.id === form.membershipType
                      )?.period
                    }`}
                </span>
              </div>

              {/* Personal info */}
              <div className="pridruzi-form__section-title">
                Lični podaci
              </div>

              <div className="pridruzi-form__row">
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="firstName"
                  >
                    Ime{' '}
                    <span className="required-star">
                      *
                    </span>
                  </label>

                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className={`form-input${
                      errors.firstName
                        ? ' form-input--error'
                        : ''
                    }`}
                    placeholder="Petar"
                    value={form.firstName}
                    onChange={handleChange}
                  />

                  {errors.firstName && (
                    <span className="form-error">
                      {errors.firstName}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="lastName"
                  >
                    Prezime{' '}
                    <span className="required-star">
                      *
                    </span>
                  </label>

                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className={`form-input${
                      errors.lastName
                        ? ' form-input--error'
                        : ''
                    }`}
                    placeholder="Petrović"
                    value={form.lastName}
                    onChange={handleChange}
                  />

                  {errors.lastName && (
                    <span className="form-error">
                      {errors.lastName}
                    </span>
                  )}
                </div>
              </div>

              <div className="pridruzi-form__row">
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="email"
                  >
                    Email{' '}
                    <span className="required-star">
                      *
                    </span>
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
                      (opciono)
                    </span>
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    placeholder="+381 6x xxx xxxx"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="pridruzi-form__row">
                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="city"
                  >
                    Grad{' '}
                    <span className="required-star">
                      *
                    </span>
                  </label>

                  <input
                    id="city"
                    name="city"
                    type="text"
                    className={`form-input${
                      errors.city
                        ? ' form-input--error'
                        : ''
                    }`}
                    placeholder="Novi Sad"
                    value={form.city}
                    onChange={handleChange}
                  />

                  {errors.city && (
                    <span className="form-error">
                      {errors.city}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label
                    className="form-label"
                    htmlFor="occupation"
                  >
                    Zanimanje{' '}
                    <span className="form-optional">
                      (opciono)
                    </span>
                  </label>

                  <input
                    id="occupation"
                    name="occupation"
                    type="text"
                    className="form-input"
                    placeholder="Pravnik, novinar, IT stručnjak..."
                    value={form.occupation}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Skills */}
              <div className="form-group">
                <label className="form-label">
                  Veštine koje možeš da ponudiš{' '}
                  <span className="form-optional">
                    (opciono)
                  </span>
                </label>

                <div className="pridruzi-skills">
                  {skillOptions.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      className={`pridruzi-skill${
                        form.skills.includes(skill)
                          ? ' pridruzi-skill--active'
                          : ''
                      }`}
                      onClick={() =>
                        handleSkillToggle(skill)
                      }
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motivation */}
              <div className="form-group">
                <label
                  className="form-label"
                  htmlFor="motivation"
                >
                  Zašto se pridružuješ?{' '}
                  <span className="form-optional">
                    (opciono)
                  </span>
                </label>

                <textarea
                  id="motivation"
                  name="motivation"
                  className="form-textarea"
                  placeholder="Kratko nam reci šta te je motivisalo da se pridružiš Bedemu..."
                  rows={4}
                  value={form.motivation}
                  onChange={handleChange}
                ></textarea>
              </div>

              {/* Newsletter */}
              <div className="form-group">
                <label className="problem-checkbox">
                  <input
                    type="checkbox"
                    name="newsletter"
                    checked={form.newsletter}
                    onChange={handleChange}
                  />

                  <span className="problem-checkbox__box"></span>

                  <span>
                    Želim da primam mesečni newsletter sa
                    vestima i aktivnostima Bedema
                  </span>
                </label>
              </div>

              {/* Consent */}
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
                      Statutom udruženja
                    </a>{' '}
                    i{' '}
                    <a
                      href="#"
                      className="problem-form__link"
                    >
                      politikom privatnosti
                    </a>
                    .{' '}
                    <span className="required-star">
                      *
                    </span>
                  </span>
                </label>

                {errors.consent && (
                  <span className="form-error">
                    {errors.consent}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="btn btn--secondary btn--lg pridruzi-submit"
              >
                Pošalji prijavu za članstvo →
              </button>

              <p className="pridruzi-note">
                Nakon podnošenja prijave, dobićeš instrukcije
                za plaćanje članarine na tvoj email.
                Membership postaje aktivan čim potvrdimo uplatu.
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}