import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminLandingPath } from '../../constants/roles';

// Section guard inside the admin panel, used as a layout route. AdminLayout has
// already turned away everyone without a section of their own; this keeps a
// Finansije account from reaching the news forms by typing the URL, and back.
export default function RequirePermission({ allow }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!allow(user)) return <Navigate to={adminLandingPath(user)} replace />;

  return <Outlet />;
}
