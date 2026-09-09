import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import HoneypotField, { HONEYPOT_NAME } from './HoneypotField';
import './AuthModal.css';

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    [HONEYPOT_NAME]: '',
  });

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginForm.email, loginForm.password);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(registerForm);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function switchTab(t) {
    setTab(t);
    setError('');
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="auth-modal__close" onClick={onClose} aria-label="Zatvori">×</button>

        <div className="auth-modal__header">
          <span className="auth-modal__logo">⚖</span>
          <span className="auth-modal__title">Bedem</span>
        </div>

        <div className="auth-modal__tabs">
          <button
            className={`auth-tab${tab === 'login' ? ' auth-tab--active' : ''}`}
            onClick={() => switchTab('login')}
          >
            Prijava
          </button>
          <button
            className={`auth-tab${tab === 'register' ? ' auth-tab--active' : ''}`}
            onClick={() => switchTab('register')}
          >
            Registracija
          </button>
        </div>

        {tab === 'login' && (
          <form className="auth-form" onSubmit={handleLogin}>
            <label className="auth-label">
              E-mail
              <input
                className="auth-input"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
                placeholder="vas@email.com"
              />
            </label>
            <label className="auth-label">
              Lozinka
              <input
                className="auth-input"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Prijava...' : 'Prijavi se'}
            </button>
            <p className="auth-switch">
              Nemate nalog?{' '}
              <button type="button" className="auth-switch__link" onClick={() => switchTab('register')}>
                Registrujte se
              </button>
            </p>
          </form>
        )}

        {tab === 'register' && (
          <form className="auth-form" onSubmit={handleRegister}>
            <label className="auth-label">
              Korisničko ime
              <input
                className="auth-input"
                type="text"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
                placeholder="vase_ime"
              />
            </label>
            <label className="auth-label">
              E-mail
              <input
                className="auth-input"
                type="email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
                placeholder="vas@email.com"
              />
            </label>
            <label className="auth-label">
              Lozinka
              <input
                className="auth-input"
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
                placeholder="••••••••"
              />
            </label>
            <HoneypotField
              value={registerForm[HONEYPOT_NAME]}
              onChange={(v) => setRegisterForm({ ...registerForm, [HONEYPOT_NAME]: v })}
            />
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Registracija...' : 'Registruj se'}
            </button>
            <p className="auth-switch">
              Već imate nalog?{' '}
              <button type="button" className="auth-switch__link" onClick={() => switchTab('login')}>
                Prijavite se
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
