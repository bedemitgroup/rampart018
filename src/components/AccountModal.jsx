import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

export default function AccountModal({ onClose }) {
  const { user, changePassword, changeEmail } = useAuth();
  const [tab, setTab] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    changeCode: '',
  });
  const [emailForm, setEmailForm] = useState({
    currentPassword: '',
    newEmail: '',
    changeCode: '',
  });

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(onClose, 1500);
    return () => clearTimeout(timer);
  }, [success, onClose]);

  function switchTab(t) {
    setTab(t);
    setError('');
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Nova lozinka i potvrda se ne poklapaju.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword, passwordForm.changeCode);
      setSuccess('Lozinka je promenjena.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await changeEmail(emailForm.currentPassword, emailForm.newEmail, emailForm.changeCode);
      setSuccess('Email adresa je promenjena.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="auth-modal__close" onClick={onClose} aria-label="Zatvori">×</button>

        <div className="auth-modal__header">
          <span className="auth-modal__logo">⚖</span>
          <span className="auth-modal__title">{user?.username}</span>
        </div>

        {success ? (
          <p className="auth-success">{success}</p>
        ) : (
          <>
            <div className="auth-modal__tabs">
              <button
                className={`auth-tab${tab === 'password' ? ' auth-tab--active' : ''}`}
                onClick={() => switchTab('password')}
              >
                Lozinka
              </button>
              <button
                className={`auth-tab${tab === 'email' ? ' auth-tab--active' : ''}`}
                onClick={() => switchTab('email')}
              >
                Email
              </button>
            </div>

            {tab === 'password' && (
              <form className="auth-form" onSubmit={handlePasswordSubmit}>
                <label className="auth-label">
                  Trenutna lozinka
                  <input
                    className="auth-input"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                    placeholder="••••••••"
                  />
                </label>
                <label className="auth-label">
                  Nova lozinka
                  <input
                    className="auth-input"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    required
                    minLength={8}
                    placeholder="••••••••"
                  />
                </label>
                <label className="auth-label">
                  Potvrda nove lozinke
                  <input
                    className="auth-input"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                    placeholder="••••••••"
                  />
                </label>
                <label className="auth-label">
                  Tajni kod za promenu
                  <input
                    className="auth-input"
                    type="text"
                    value={passwordForm.changeCode}
                    onChange={(e) => setPasswordForm({ ...passwordForm, changeCode: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </label>
                {error && <p className="auth-error">{error}</p>}
                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Čuvanje...' : 'Promeni lozinku'}
                </button>
              </form>
            )}

            {tab === 'email' && (
              <form className="auth-form" onSubmit={handleEmailSubmit}>
                <label className="auth-label">
                  Trenutna lozinka
                  <input
                    className="auth-input"
                    type="password"
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                    required
                    placeholder="••••••••"
                  />
                </label>
                <label className="auth-label">
                  Novi email
                  <input
                    className="auth-input"
                    type="email"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                    required
                    placeholder="vas@email.com"
                  />
                </label>
                <label className="auth-label">
                  Tajni kod za promenu
                  <input
                    className="auth-input"
                    type="text"
                    value={emailForm.changeCode}
                    onChange={(e) => setEmailForm({ ...emailForm, changeCode: e.target.value })}
                    required
                    autoComplete="off"
                  />
                </label>
                {error && <p className="auth-error">{error}</p>}
                <button className="auth-submit" type="submit" disabled={loading}>
                  {loading ? 'Čuvanje...' : 'Promeni email'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
