import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccessAdmin, canManageUsers, roleLabel } from '../../constants/roles';
import './Admin.css';

// Everyone the organisation admitted reads the whole panel; each page decides
// on its own whether to draw buttons. The last two are the exception: they are
// about oversight of the staff itself, so they stay with the Admin.
const sections = [
  { to: '/admin/news', label: 'Vesti', allow: canAccessAdmin },
  { to: '/admin/finance', label: 'Finansije', allow: canAccessAdmin },
  { to: '/admin/problems', label: 'Prijave problema', allow: canAccessAdmin },
  { to: '/admin/memberships', label: 'Zahtevi za članstvo', allow: canAccessAdmin },
  { to: '/admin/users', label: 'Nalozi i role', allow: canManageUsers },
  { to: '/admin/audit', label: 'Dnevnik izmena', allow: canManageUsers },
];

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!canAccessAdmin(user)) return <Navigate to="/" replace />;

  const visible = sections.filter(({ allow }) => allow(user));

  return (
    <div className="admin">
      <div className="container admin__inner">
        <aside className="admin__sidebar">
          <div className="admin__sidebar-title">Admin panel</div>
          <div className="admin__sidebar-role">{roleLabel(user.role)}</div>
          <nav aria-label="Admin navigacija">
            <ul className="admin__nav">
              {visible.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) => `admin__nav-link${isActive ? ' admin__nav-link--active' : ''}`}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <section className="admin__content">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
