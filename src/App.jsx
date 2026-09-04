import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import ONama from './pages/ONama';
import Finansije from './pages/Finansije';
import Problem from './pages/Problem';
import PridruziSe from './pages/PridruziSe';
import Vest from './pages/Vest';
import AdminLayout from './pages/admin/AdminLayout';
import AdminNews from './pages/admin/AdminNews';
import AdminNewsForm from './pages/admin/AdminNewsForm';
import AdminProblems from './pages/admin/AdminProblems';
import AdminMemberships from './pages/admin/AdminMemberships';
import AdminFinance from './pages/admin/AdminFinance';
import AdminFinanceForm from './pages/admin/AdminFinanceForm';
import AdminFinanceCategories from './pages/admin/AdminFinanceCategories';
import AdminFinanceYears from './pages/admin/AdminFinanceYears';
import AdminAssembly from './pages/admin/AdminAssembly';
import AdminAssemblySessions from './pages/admin/AdminAssemblySessions';
import AdminAssemblyTopics from './pages/admin/AdminAssemblyTopics';
import AdminAssemblyRecord from './pages/admin/AdminAssemblyRecord';
import AdminAssemblySessionForm from './pages/admin/AdminAssemblySessionForm';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import RequirePermission from './pages/admin/RequirePermission';
import {
  adminLandingPath,
  canAccessAdmin,
  canManageAssembly,
  canManageFinance,
  canManageNews,
  canManageUsers,
} from './constants/roles';
import { useAuth } from './context/AuthContext';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/o-nama" element={<ONama />} />
          <Route path="/finansije" element={<Finansije />} />
          <Route path="/problem" element={<Problem />} />
          <Route path="/pridruzi-se" element={<PridruziSe />} />
          <Route path="/vest/:slug" element={<Vest />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminIndex />} />

            {/* Lists are readable by the whole membership; the forms behind
                them write, so those keep the stricter guard. */}
            <Route element={<RequirePermission allow={canAccessAdmin} />}>
              <Route path="news" element={<AdminNews />} />
              <Route path="finance" element={<AdminFinance />} />
              <Route path="finance/categories" element={<AdminFinanceCategories />} />
              <Route path="finance/years" element={<AdminFinanceYears />} />
              <Route path="problems" element={<AdminProblems />} />
              <Route path="memberships" element={<AdminMemberships />} />
              <Route path="skupstina" element={<AdminAssembly />} />
              <Route path="skupstina/dnevni-red" element={<AdminAssemblyTopics />} />
              <Route path="skupstina/sednice" element={<AdminAssemblySessions />} />
              <Route path="skupstina/evidencija" element={<AdminAssemblyRecord />} />
            </Route>

            <Route element={<RequirePermission allow={canManageNews} />}>
              <Route path="news/new" element={<AdminNewsForm />} />
              <Route path="news/:id/edit" element={<AdminNewsForm />} />
            </Route>

            <Route element={<RequirePermission allow={canManageAssembly} />}>
              <Route path="skupstina/sednice/nova" element={<AdminAssemblySessionForm />} />
              <Route path="skupstina/sednice/:id/izmena" element={<AdminAssemblySessionForm />} />
            </Route>

            <Route element={<RequirePermission allow={canManageFinance} />}>
              <Route path="finance/new" element={<AdminFinanceForm />} />
              <Route path="finance/:id/edit" element={<AdminFinanceForm />} />
            </Route>

            <Route element={<RequirePermission allow={canManageUsers} />}>
              <Route path="users" element={<AdminUsers />} />
              <Route path="audit" element={<AdminAuditLog />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
}

// /admin has no page of its own: it drops you into the first section your role
// actually administers, which is not the same one for a Moderator and for
// Finansije.
function AdminIndex() {
  const { user } = useAuth();
  return <Navigate to={adminLandingPath(user)} replace />;
}

function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: '5rem' }}>404</div>
      <h1 style={{ fontSize: '2rem', color: 'var(--color-primary)' }}>Stranica nije pronađena</h1>
      <p style={{ color: 'var(--color-neutral)', maxWidth: '400px' }}>
        Stranica koju tražiš ne postoji ili je premeštena.
      </p>
      <a href="/" className="btn btn--primary" style={{ marginTop: '1rem' }}>
        Nazad na početnu
      </a>
    </div>
  );
}
