import { NavLink } from 'react-router-dom';
import './Assembly.css';

const TABS = [
  { to: '/admin/skupstina', label: 'Sala', end: true },
  { to: '/admin/skupstina/sednice', label: 'Sednice' },
];

/**
 * Keeps the assembly screens under one sidebar entry, the way
 * AdminFinanceTabs does for finance.
 *
 * This is also the single import point for Assembly.css — the same relationship
 * AdminLayout has with Admin.css. The hall is its own visual system, with
 * animations and a colour scale of its own, so it stays out of the 900-line
 * Admin.css rather than doubling it.
 */
export default function AdminAssemblyTabs() {
  return (
    <nav className="admin-tabs" aria-label="Skupština — sekcije">
      {TABS.map(({ to, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `admin-tabs__link${isActive ? ' admin-tabs__link--active' : ''}`}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
