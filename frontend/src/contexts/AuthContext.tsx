// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { adminApi, getToken, setToken, removeToken } from '../lib/api';

interface Admin {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  admin: Admin | null;
  loading: boolean;
  isAdmin: boolean;        // true for both admin and moderator
  isFullAdmin: boolean;    // true only for admin role
  isModerator: boolean;    // true only for moderator role
  login: (username: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp && payload.exp * 1000 < Date.now();
        if (!isExpired) {
          setAdmin({ id: payload.id, username: payload.username, role: payload.role });
        } else {
          removeToken();
        }
      } catch {
        removeToken();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await adminApi.login(username, password);
      setToken(res.data.token);
      setAdmin(res.data.admin);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const logout = () => {
    removeToken();
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{
      admin,
      loading,
      isAdmin: !!admin,
      isFullAdmin: admin?.role === 'admin',
      isModerator: admin?.role === 'moderator',
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}