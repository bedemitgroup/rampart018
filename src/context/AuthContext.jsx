import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bedem_token');
    if (token) {
      api.me()
        .then(setUser)
        .catch(() => localStorage.removeItem('bedem_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email, password) {
    const data = await api.login({ email, password });
    localStorage.setItem('bedem_token', data.token);
    // id comes along because the assembly hall is built on "which seat is
    // mine"; without it user.id stays undefined until the next page load.
    setUser({ id: data.id, username: data.username, email: data.email, role: data.role });
  }

  // Takes the whole payload so the honeypot field rides along without becoming
  // an unnamed fourth positional argument.
  async function register(data) {
    await api.register(data);
    await login(data.email, data.password);
  }

  function logout() {
    localStorage.removeItem('bedem_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
