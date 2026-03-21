// src/contexts/AuthContext.tsx
// Unified auth — one Member table, three roles: member | mod | admin
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  memberAuthApi,
  getMemberToken, setMemberToken, removeMemberToken,
} from '../lib/api';

export interface MemberUser {
  id: string;
  email: string;
  full_name: string;
  batch: number;
  photo_url: string | null;
  status: string;
  role: 'member' | 'mod' | 'admin';
  must_change_password: boolean;
  has_password: boolean;
  phone_number?: string;
  alternative_phone?: string | null;
  job_title?: string | null;
  organisation?: string | null;
  organisation_address?: string | null;
  notify_events?: boolean;
  blood_group?: string | null;
  created_at?: string;
}

interface AuthContextType {
  // Unified user
  member: MemberUser | null;
  loading: boolean;

  // Convenience booleans
  isLoggedIn: boolean;
  isMember: boolean;       // any logged-in user
  isStaff: boolean;        // mod or admin
  isModerator: boolean;    // mod only
  isAdmin: boolean;        // mod or admin (for backward-compat — admin panel access)
  isFullAdmin: boolean;    // admin only

  // Actions
  memberLogin: (email: string, password: string) => Promise<{ error: string | null; needsSetup?: boolean }>;
  memberLogout: () => void;
  setMemberUser: (m: MemberUser) => void;

  // Legacy admin login kept for old Admin table fallback during transition
  // TODO: remove after all admins are migrated to member table
  admin: { id: string; username: string; role: string } | null;
  login: (username: string, password: string) => Promise<{ error: Error | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwtPayload(token: string) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp && payload.exp * 1000 < Date.now();
    return isExpired ? null : payload;
  } catch {
    return null;
  }
}

// Legacy imports for old Admin table login (kept during transition)
import { adminApi, getToken, setToken, removeToken } from '../lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<MemberUser | null>(null);
  const [legacyAdmin, setLegacyAdmin] = useState<{ id: string; username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore member session
    const memberToken = getMemberToken();
    if (memberToken) {
      const payload = parseJwtPayload(memberToken);
      if (payload && payload.email) {
        // Refresh from API to get latest role/status
        memberAuthApi.me().then((res: any) => {
          if (res.success) setMember(res.data);
          else removeMemberToken();
        }).catch(() => removeMemberToken());
      } else {
        removeMemberToken();
      }
    }

    // Legacy admin token restore
    const adminToken = getToken();
    if (adminToken) {
      const payload = parseJwtPayload(adminToken);
      if (payload && !payload.email) {
        setLegacyAdmin({ id: payload.id, username: payload.username, role: payload.role });
      } else {
        removeToken();
      }
    }

    setLoading(false);
  }, []);

  // ── Member login ───────────────────────────────────────────────────────────
  const memberLogin = async (email: string, password: string) => {
    try {
      const res = await memberAuthApi.login(email, password);
      if (!res.success) return { error: res.message || 'Login failed.', needsSetup: res.needsSetup };
      setMemberToken(res.data.token);
      setMember(res.data.member);
      return { error: null };
    } catch {
      return { error: 'Something went wrong. Please try again.' };
    }
  };

  const memberLogout = () => { removeMemberToken(); setMember(null); };
  const setMemberUser = (m: MemberUser) => setMember(m);

  // ── Legacy admin login ─────────────────────────────────────────────────────
  const login = async (username: string, password: string) => {
    try {
      const res = await adminApi.login(username, password);
      setToken(res.data.token);
      setLegacyAdmin(res.data.admin);
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const logout = () => { removeToken(); setLegacyAdmin(null); };

  // ── Derived state ──────────────────────────────────────────────────────────
  // Member table roles take priority; legacy admin is fallback
  const memberRole = member?.role ?? null;
  const effectiveRole = memberRole ?? (legacyAdmin ? legacyAdmin.role : null);

  const isLoggedIn = !!member || !!legacyAdmin;
  const isMember = !!member;
  const isStaff = memberRole === 'admin' || memberRole === 'mod';
  const isModerator = effectiveRole === 'mod' || effectiveRole === 'moderator';
  const isAdmin = effectiveRole === 'admin' || effectiveRole === 'mod' || effectiveRole === 'moderator';
  const isFullAdmin = effectiveRole === 'admin';

  return (
    <AuthContext.Provider value={{
      member, loading,
      isLoggedIn, isMember, isStaff, isModerator, isAdmin, isFullAdmin,
      memberLogin, memberLogout, setMemberUser,
      admin: legacyAdmin, login, logout,
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