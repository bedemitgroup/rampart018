import { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ALL_ROLES,
  CREATABLE_ROLES,
  ROLES,
  ROLE_DESCRIPTIONS,
  roleLabel,
} from '../../constants/roles';

const MIN_PASSWORD_LENGTH = 8;

// Ambiguous glyphs are left out on purpose: the admin reads this password out
// loud or writes it down, so O/0 and l/1/I would cost a support round-trip.
const PASSWORD_ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!?#$%';
const GENERATED_PASSWORD_LENGTH = 14;

const emptyDraft = { username: '', email: '', password: '', role: ROLES.MODERATOR };

// Staff accounts are what an admin opens this page for, so that is the default
// view; the full list is one select away.
const FILTERS = [
  { value: 'staff', label: 'Sa pravima' },
  { value: 'all', label: 'Svi nalozi' },
  ...ALL_ROLES.map((role) => ({ value: role, label: roleLabel(role) })),
];

function formatDate(isoString) {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('sr-RS', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function generatePassword() {
  const bytes = new Uint32Array(GENERATED_PASSWORD_LENGTH);
  crypto.getRandomValues(bytes);

  return Array.from(
    bytes,
    (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length],
  ).join('');
}

// The API speaks English. Translate the cases this page can actually produce
// and fall back to the raw message so nothing is swallowed silently.
function translateError(message) {
  if (!message) return 'Greška pri izmeni naloga.';

  if (message.includes('Email already in use')) {
    return 'Nalog sa tim e-mailom već postoji.';
  }

  if (message.includes('Username already taken')) {
    return 'To korisničko ime je zauzeto.';
  }

  if (message.includes('Password must be at least')) {
    return `Lozinka mora imati najmanje ${MIN_PASSWORD_LENGTH} znakova.`;
  }

  if (message.includes('All fields are required')) {
    return 'Sva polja su obavezna.';
  }

  if (message.includes('Invalid role')) {
    return 'Ta rola se ne može dodeliti.';
  }

  if (message.includes('cannot change your own role')) {
    return 'Ne možeš da menjaš sopstvenu rolu.';
  }

  if (message.includes('cannot deactivate your own account')) {
    return 'Ne možeš da deaktiviraš sopstveni nalog.';
  }

  return message;
}

export default function AdminUsers() {
  const { user } = useAuth();

  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('staff');

  const [draft, setDraft] = useState(emptyDraft);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [copied, setCopied] = useState(false);

  // Which row is mid-request, so only that row's controls go dead.
  const [busyId, setBusyId] = useState(null);
  const [rowError, setRowError] = useState('');

  // Credentials of the account just created, kept only in this component's
  // state. The password never comes back from the server.
  const [created, setCreated] = useState(null);

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    if (filter === 'all') return accounts;

    if (filter === 'staff') {
      return accounts.filter((a) => a.role !== ROLES.VISITOR && a.role !== ROLES.MEMBER);
    }

    return accounts.filter((a) => a.role === filter);
  }, [accounts, filter]);

  async function load() {
    setLoading(true);
    setError('');

    try {
      setAccounts(await api.getUsers());
    } catch (err) {
      setError(err.message || 'Greška pri učitavanju naloga.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const payload = {
      username: draft.username.trim(),
      email: draft.email.trim(),
      password: draft.password,
      role: draft.role,
    };

    if (payload.password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`Lozinka mora imati najmanje ${MIN_PASSWORD_LENGTH} znakova.`);
      return;
    }

    setSubmitting(true);

    try {
      await api.createStaffAccount(payload);
      setCreated({
        username: payload.username,
        email: payload.email,
        password: payload.password,
        role: payload.role,
      });
      setDraft(emptyDraft);
      setShowPassword(false);
      setCopied(false);
      await load();
    } catch (err) {
      setFormError(translateError(err.message));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(account, role) {
    if (role === account.role) return;

    const question = role === ROLES.ADMIN
      ? `Dati nalogu "${account.username}" puna administratorska prava?`
      : `Promeniti rolu naloga "${account.username}" u "${roleLabel(role)}"?`;

    if (!window.confirm(question)) return;

    setBusyId(account.id);
    setRowError('');

    try {
      await api.changeUserRole(account.id, role);
      await load();
    } catch (err) {
      setRowError(translateError(err.message));
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleActive(account) {
    const question = account.isActive
      ? `Deaktivirati nalog "${account.username}"? Neće više moći da se prijavi.`
      : `Ponovo aktivirati nalog "${account.username}"?`;

    if (!window.confirm(question)) return;

    setBusyId(account.id);
    setRowError('');

    try {
      if (account.isActive) {
        await api.deactivateUser(account.id);
      } else {
        await api.activateUser(account.id);
      }
      await load();
    } catch (err) {
      setRowError(translateError(err.message));
    } finally {
      setBusyId(null);
    }
  }

  function handleGenerate() {
    setDraft({ ...draft, password: generatePassword() });
    setShowPassword(true);
  }

  async function handleCopy() {
    if (!created) return;

    try {
      await navigator.clipboard.writeText(
        `Korisničko ime: ${created.username}\nE-mail: ${created.email}\nLozinka: ${created.password}`,
      );
      setCopied(true);
    } catch {
      setCopied(false);
      setFormError('Kopiranje nije uspelo — prepiši lozinku ručno.');
    }
  }

  return (
    <div>
      <div className="admin-news__header">
        <h1 className="admin__title">Nalozi i role</h1>
      </div>

      <form className="admin-moderators__form" onSubmit={handleSubmit}>
        <h2 className="admin-moderators__form-title">Dodaj novi nalog</h2>
        <p className="admin-moderators__hint">
          Nalog se pravi odmah. Lozinku saopšti korisniku lično — ne šalje se mejlom
          i posle ovog ekrana se više ne može pročitati.
        </p>

        <div className="admin-moderators__row">
          <label className="form-label" htmlFor="account-username">
            Korisničko ime
          </label>
          <input
            id="account-username"
            className="form-input"
            type="text"
            value={draft.username}
            onChange={(e) => setDraft({ ...draft, username: e.target.value })}
            required
            autoComplete="off"
            placeholder="npr. marko"
          />
        </div>

        <div className="admin-moderators__row">
          <label className="form-label" htmlFor="account-email">
            E-mail
          </label>
          <input
            id="account-email"
            className="form-input"
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            required
            autoComplete="off"
            placeholder="marko@bedem.rs"
          />
        </div>

        <div className="admin-moderators__row">
          <label className="form-label" htmlFor="account-role">
            Rola
          </label>
          <select
            id="account-role"
            className="form-input"
            value={draft.role}
            onChange={(e) => setDraft({ ...draft, role: e.target.value })}
          >
            {CREATABLE_ROLES.map((role) => (
              <option key={role} value={role}>{roleLabel(role)}</option>
            ))}
          </select>
          <p className="admin-moderators__role-hint">{ROLE_DESCRIPTIONS[draft.role]}</p>
        </div>

        <div className="admin-moderators__row">
          <label className="form-label" htmlFor="account-password">
            Lozinka
          </label>
          <div className="admin-moderators__password">
            <input
              id="account-password"
              className="form-input"
              type={showPassword ? 'text' : 'password'}
              value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder={`Najmanje ${MIN_PASSWORD_LENGTH} znakova`}
            />
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Sakrij' : 'Prikaži'}
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={handleGenerate}
            >
              Generiši
            </button>
          </div>
        </div>

        {formError && <p className="admin-news__error">{formError}</p>}

        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Kreiranje...' : 'Kreiraj nalog'}
        </button>
      </form>

      {created && (
        <div className="admin-moderators__success" role="status">
          <strong>Nalog je kreiran.</strong> Saopšti korisniku ove podatke:
          <ul className="admin-moderators__credentials">
            <li>Korisničko ime: <code>{created.username}</code></li>
            <li>E-mail: <code>{created.email}</code></li>
            <li>Lozinka: <code>{created.password}</code></li>
            <li>Rola: <code>{roleLabel(created.role)}</code></li>
          </ul>
          <div className="admin-moderators__success-actions">
            <button type="button" className="btn btn--outline btn--sm" onClick={handleCopy}>
              {copied ? 'Kopirano ✓' : 'Kopiraj podatke'}
            </button>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => { setCreated(null); setCopied(false); }}
            >
              Sakrij
            </button>
          </div>
        </div>
      )}

      <div className="admin-moderators__list-header">
        <h2 className="admin-moderators__list-title">Postojeći nalozi</h2>
        <label className="admin-moderators__filter">
          <span className="form-label">Prikaži</span>
          <select
            className="form-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {FILTERS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {loading && <p className="admin-news__loading">Učitavanje...</p>}
      {error && <p className="admin-news__error">{error}</p>}
      {rowError && <p className="admin-news__error">{rowError}</p>}

      {!loading && !error && visible.length === 0 && (
        <p className="admin-news__empty">Nema naloga u ovom izboru.</p>
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="admin-moderators__table-scroll">
        <table className="admin-news__table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Korisničko ime</th>
              <th>E-mail</th>
              <th>Rola</th>
              <th>Status</th>
              <th>Kreiran</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((account) => {
              // Your own row is read-only: the server refuses both actions, so
              // offering them here would only produce an error message.
              const isSelf = account.username === user?.username;
              const busy = busyId === account.id;

              return (
                <tr key={account.id}>
                  <td>{account.id}</td>
                  <td className="admin-news__title-cell">{account.username}</td>
                  <td>{account.email}</td>
                  <td>
                    {isSelf ? (
                      roleLabel(account.role)
                    ) : (
                      <select
                        className="form-input admin-moderators__role-select"
                        value={account.role}
                        disabled={busy}
                        onChange={(e) => handleRoleChange(account, e.target.value)}
                        aria-label={`Rola naloga ${account.username}`}
                      >
                        {ALL_ROLES.map((role) => (
                          <option key={role} value={role}>{roleLabel(role)}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    <span
                      className={`admin-news__status${account.isActive ? '' : ' admin-news__status--draft'}`}
                    >
                      {account.isActive ? 'Aktivan' : 'Deaktiviran'}
                    </span>
                  </td>
                  <td>{formatDate(account.createdAt)}</td>
                  <td>
                    {!isSelf && (
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        disabled={busy}
                        onClick={() => handleToggleActive(account)}
                      >
                        {account.isActive ? 'Deaktiviraj' : 'Aktiviraj'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
