import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import HoneypotField, { HONEYPOT_NAME } from './HoneypotField';

/**
 * The signing form.
 *
 * Two consents, and the layout is the point rather than a detail: the first is
 * required and blocks the button, the second is optional, unticked, and never a
 * condition of the first. Making publication a condition of signing would make
 * the consent unfree, and an unfree consent is no legal basis at all — which is
 * the whole basis this feature rests on (čl. 17 st. 2 tač. 1 ZZPL).
 *
 * The wording rendered here comes from the server, so the sentence on screen is
 * the sentence that gets stored on the signature.
 */
export default function PetitionSignForm({ petition, onSigned }) {
  const { user } = useAuth();

  const initialForm = {
    firstName: '',
    lastName: '',
    city: '',
    consent: false,
    publicDisplay: false,
    [HONEYPOT_NAME]: '',
  };

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const errs = {};

    if (!form.firstName.trim()) errs.firstName = 'Ime je obavezno';
    else if (form.firstName.trim().length > 60) errs.firstName = 'Ime je predugačko';

    if (!form.lastName.trim()) errs.lastName = 'Prezime je obavezno';
    else if (form.lastName.trim().length > 60) errs.lastName = 'Prezime je predugačko';

    if (!form.city.trim()) errs.city = 'Grad je obavezan';
    else if (form.city.trim().length > 80) errs.city = 'Naziv grada je predugačak';

    if (!form.consent) errs.consent = 'Bez ovog pristanka potpis ne možemo zabeležiti';

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setShowAuth(true);
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const data = await api.signPetition(petition.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        city: form.city.trim(),
        consent: form.consent,
        publicDisplay: form.publicDisplay,
        [HONEYPOT_NAME]: form[HONEYPOT_NAME],
      });

      setSigned(true);
      onSigned?.(data?.signatureCount);
    } catch (error) {
      setErrors({ submit: error.message || 'Došlo je do greške. Pokušajte ponovo.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (signed) {
    return (
      <div className="peticija-sign peticija-sign--done">
        <div className="peticija-sign__icon">✅</div>
        <h3 className="peticija-sign__title">Hvala, vaš potpis je zabeležen.</h3>
        <p className="peticija-sign__text">
          Pristanak možete povući u svakom trenutku — potpis se tada briše.
        </p>
        <Link to="/moji-potpisi" className="btn btn--secondary btn--sm">
          Moji potpisi
        </Link>
      </div>
    );
  }

  return (
    <div className="peticija-sign">
      <h3 className="peticija-sign__title">Potpiši peticiju</h3>

      {!user && (
        <p className="peticija-sign__note">
          Potpisivanje zahteva nalog — tako znamo da iza svakog potpisa stoji jedna
          osoba, i tako kasnije možete povući svoj pristanak.
        </p>
      )}

      <form className="peticija-sign__form" onSubmit={handleSubmit} noValidate>
        <HoneypotField
          value={form[HONEYPOT_NAME]}
          onChange={(v) => setForm((prev) => ({ ...prev, [HONEYPOT_NAME]: v }))}
        />

        <div className="form-group">
          <label className="form-label" htmlFor="peticija-ime">
            Ime <span className="required-star">*</span>
          </label>
          <input
            id="peticija-ime"
            className={`form-input${errors.firstName ? ' form-input--error' : ''}`}
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            autoComplete="given-name"
          />
          {errors.firstName && <span className="form-error">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="peticija-prezime">
            Prezime <span className="required-star">*</span>
          </label>
          <input
            id="peticija-prezime"
            className={`form-input${errors.lastName ? ' form-input--error' : ''}`}
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            autoComplete="family-name"
          />
          {errors.lastName && <span className="form-error">{errors.lastName}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="peticija-grad">
            Grad <span className="required-star">*</span>
          </label>
          <input
            id="peticija-grad"
            className={`form-input${errors.city ? ' form-input--error' : ''}`}
            type="text"
            name="city"
            value={form.city}
            onChange={handleChange}
            autoComplete="address-level2"
          />
          {errors.city && <span className="form-error">{errors.city}</span>}
        </div>

        {/* Required. The text is the server's, so what is agreed to here is
            literally what gets stored on the signature. */}
        <div className="form-group">
          <label className={`peticija-checkbox${errors.consent ? ' peticija-checkbox--error' : ''}`}>
            <input
              type="checkbox"
              name="consent"
              checked={form.consent}
              onChange={handleChange}
            />
            <span className="peticija-checkbox__box"></span>
            <span>
              {petition.consentText} <span className="required-star">*</span>
              {' '}
              <Link to="/politika-privatnosti" className="peticija-sign__link" target="_blank">
                Politika privatnosti
              </Link>
            </span>
          </label>
          {errors.consent && <span className="form-error">{errors.consent}</span>}
        </div>

        {/* Optional, and never pre-ticked. */}
        <div className="form-group">
          <label className="peticija-checkbox">
            <input
              type="checkbox"
              name="publicDisplay"
              checked={form.publicDisplay}
              onChange={handleChange}
            />
            <span className="peticija-checkbox__box"></span>
            <span>{petition.publicDisplayConsentText}</span>
          </label>
        </div>

        {errors.submit && <p className="form-error peticija-sign__error">{errors.submit}</p>}

        <button className="btn btn--primary btn--lg peticija-sign__submit" type="submit" disabled={submitting}>
          {submitting ? 'Beležimo potpis...' : user ? 'Potpiši peticiju' : 'Prijavi se i potpiši'}
        </button>

        <p className="peticija-sign__legal">{petition.legalEffectNotice}</p>
      </form>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}
