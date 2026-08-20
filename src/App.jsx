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
            <Route index element={<Navigate to="news" replace />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="news/new" element={<AdminNewsForm />} />
            <Route path="news/:id/edit" element={<AdminNewsForm />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      </AuthProvider>
    </BrowserRouter>
  );
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
