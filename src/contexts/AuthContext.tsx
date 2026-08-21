import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminRole } from '../types/api';

interface AuthContextType {
  token: string | null;
  role: AdminRole | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (token: string, role: AdminRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeUsername(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json).sub ?? null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('fbrl_token')
  );
  const [role, setRole] = useState<AdminRole | null>(() =>
    localStorage.getItem('fbrl_role') as AdminRole | null
  );
  const username = useMemo(() => decodeUsername(token), [token]);

  const login = useCallback((newToken: string, newRole: AdminRole) => {
    localStorage.setItem('fbrl_token', newToken);
    localStorage.setItem('fbrl_role', newRole);
    setToken(newToken);
    setRole(newRole);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fbrl_token');
    localStorage.removeItem('fbrl_role');
    setToken(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, role, username, isAuthenticated: !!token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = isAuthenticated && role === 'ADMIN';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (role !== 'ADMIN') {
      logout();
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, role, logout, navigate]);

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
