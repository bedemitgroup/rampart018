import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/admin/finance', label: 'Stavke', end: true },
  { to: '/admin/finance/categories', label: 'Kategorije' },
  { to: '/admin/finance/years', label: 'Godine i kvartali' },
];

/** Keeps the three finance screens under one sidebar entry. */
export default function AdminFinanceTabs() {
  return (
    <nav className="admin-tabs" aria-label="Finansije — sekcije">
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
