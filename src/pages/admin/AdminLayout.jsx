import { Navigate, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Admin.css';

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;

  const isModOrAdmin = user && (user.role === 'Admin' || user.role === 'Moderator');
  if (!isModOrAdmin) return <Navigate to="/" replace />;

  return (
    <div className="admin">
      <div className="container admin__inner">
        <aside className="admin__sidebar">
          <div className="admin__sidebar-title">Admin panel</div>
          <nav aria-label="Admin navigacija">
            <ul className="admin__nav">
              <li>
                <NavLink
                  to="/admin/news"
                  className={({ isActive }) => `admin__nav-link${isActive ? ' admin__nav-link--active' : ''}`}
                >
                  Vesti
                </NavLink>
              </li>
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
