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
    setUser({ username: data.username, email: data.email, role: data.role });
  }

  async function register(username, email, password) {
    await api.register({ username, email, password });
    await login(email, password);
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
