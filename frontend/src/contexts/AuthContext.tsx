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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<MemberUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // `loading` must stay true until the restore has settled. It is async, so
    // clearing it early would briefly report a logged-in member as anonymous and
    // bounce guarded routes to /login on a cold page load.
    const restore = async () => {
      const memberToken = getMemberToken();
      if (memberToken) {
        const payload = parseJwtPayload(memberToken);
        if (payload && payload.email) {
          // Refresh from API to get latest role/status
          try {
            const res: any = await memberAuthApi.me();
            if (res.success) {
              if (!cancelled) setMember(res.data);
            } else {
              removeMemberToken();
            }
          } catch {
            removeMemberToken();
          }
        } else {
          removeMemberToken();
        }
      }

      if (!cancelled) setLoading(false);
    };

    restore();
    return () => { cancelled = true; };
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

  // ── Derived state ──────────────────────────────────────────────────────────
  const memberRole = member?.role ?? null;

  const isLoggedIn = !!member;
  const isMember = !!member;
  const isStaff = memberRole === 'admin' || memberRole === 'mod';
  const isModerator = memberRole === 'mod';
  const isAdmin = isStaff;          // admin panel access — admin or mod
  const isFullAdmin = memberRole === 'admin';

  return (
    <AuthContext.Provider value={{
      member, loading,
      isLoggedIn, isMember, isStaff, isModerator, isAdmin, isFullAdmin,
      memberLogin, memberLogout, setMemberUser,
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