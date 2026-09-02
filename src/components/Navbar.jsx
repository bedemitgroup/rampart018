import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES, roleLabel, canAccessAdmin, adminLandingPath } from '../constants/roles';
import AuthModal from './AuthModal';
import './Navbar.css';

const navLinks = [
  { to: '/', label: 'Početna', end: true },
  { to: '/o-nama', label: 'O nama' },
  { to: '/finansije', label: 'Finansije' },
  { to: '/problem', label: 'Podeli problem' },
  { to: '/pridruzi-se', label: 'Pridruži se' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
        <div className="container navbar__inner">

          {/* Logo */}
          <Link to="/" className="navbar__logo" onClick={closeMenu}>
            <span className="navbar__logo-icon">⚖</span>
            <span className="navbar__logo-text">
              <span className="navbar__logo-name">Bedem</span>
              <span className="navbar__logo-tagline">Građansko udruženje</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="navbar__desktop" aria-label="Glavna navigacija">
            <ul className="navbar__list">
              {navLinks.map(({ to, label, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      `navbar__link${isActive ? ' navbar__link--active' : ''}`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="navbar__auth">
              {user ? (
                <>
                  <span className="navbar__user">
                    <span className="navbar__username">{user.username}</span>
                    {user.role && user.role !== ROLES.VISITOR && (
                      <span className="navbar__role-badge">{roleLabel(user.role)}</span>
                    )}
                  </span>
                  {canAccessAdmin(user) && (
                    <Link to={adminLandingPath(user)} className="btn btn--outline navbar__btn">Admin</Link>
                  )}
                  <button className="btn btn--outline navbar__btn" onClick={logout}>
                    Odjava
                  </button>
                </>
              ) : (
                <button className="btn btn--outline navbar__btn" onClick={() => setShowAuth(true)}>
                  Prijava
                </button>
              )}
              <Link to="/pridruzi-se" className="btn btn--secondary navbar__cta">
                Postani član
              </Link>
            </div>
          </nav>

          {/* Hamburger */}
          <button
            className={`navbar__hamburger${menuOpen ? ' navbar__hamburger--open' : ''}`}
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label={menuOpen ? 'Zatvori meni' : 'Otvori meni'}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile drawer + overlay */}
      {menuOpen && (
        <div className="navbar__overlay" onClick={closeMenu} aria-hidden="true" />
      )}

      <div className={`navbar__drawer${menuOpen ? ' navbar__drawer--open' : ''}`} aria-hidden={!menuOpen}>
        {/* Drawer header */}
        <div className="navbar__drawer-header">
          <Link to="/" className="navbar__logo" onClick={closeMenu}>
            <span className="navbar__logo-icon">⚖</span>
            <span className="navbar__logo-text">
              <span className="navbar__logo-name">Bedem</span>
              <span className="navbar__logo-tagline">Građansko udruženje</span>
            </span>
          </Link>
          <button className="navbar__drawer-close" onClick={closeMenu} aria-label="Zatvori meni">
            ✕
          </button>
        </div>

        {/* Drawer links */}
        <nav aria-label="Mobilna navigacija">
          <ul className="navbar__drawer-list">
            {navLinks.map(({ to, label, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `navbar__drawer-link${isActive ? ' navbar__drawer-link--active' : ''}`
                  }
                  onClick={closeMenu}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Drawer auth */}
        <div className="navbar__drawer-auth">
          {user ? (
            <>
              <div className="navbar__drawer-user">
                <span className="navbar__username">{user.username}</span>
                {user.role && user.role !== ROLES.VISITOR && (
                  <span className="navbar__role-badge">{roleLabel(user.role)}</span>
                )}
              </div>
              {canAccessAdmin(user) && (
                <Link to={adminLandingPath(user)} className="btn btn--outline navbar__drawer-btn" onClick={closeMenu}>
                  Admin
                </Link>
              )}
              <button
                className="btn btn--outline navbar__drawer-btn"
                onClick={() => { logout(); closeMenu(); }}
              >
                Odjava
              </button>
            </>
          ) : (
            <button
              className="btn btn--outline navbar__drawer-btn"
              onClick={() => { setShowAuth(true); closeMenu(); }}
            >
              Prijava
            </button>
          )}
          <Link to="/pridruzi-se" className="btn btn--secondary navbar__drawer-btn" onClick={closeMenu}>
            Postani član
          </Link>
        </div>
      </div>
    </>
  );
}
