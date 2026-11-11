import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// ─── User Roles ───────────────────────────────────────────────────────────────
export type UserRole =
  | 'po_manager'    // مدير PO — full access
  | 'planner'       // المخطط — marker & consumption
  | 'cutting'       // مشرف القص
  | 'sewing'        // مشرف الخياطة
  | 'ironing'       // مشرف المكوى
  | 'packing';      // مشرف التعبئة

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  displayNameAr: string;
  role: UserRole;
  avatarInitials: string;
}

// ─── Predefined users (in a real app this would come from a backend) ──────────
const USERS: (AppUser & { password: string })[] = [
  {
    id: 'u1',
    username: 'po_manager',
    password: '1234',
    displayName: 'PO Manager',
    displayNameAr: 'مدير الأوردرات',
    role: 'po_manager',
    avatarInitials: 'PM',
  },
  {
    id: 'u2',
    username: 'planner',
    password: '1234',
    displayName: 'Planner',
    displayNameAr: 'المخطط',
    role: 'planner',
    avatarInitials: 'PL',
  },
  {
    id: 'u3',
    username: 'cutting',
    password: '1234',
    displayName: 'Cutting Supervisor',
    displayNameAr: 'مشرف القص',
    role: 'cutting',
    avatarInitials: 'CU',
  },
  {
    id: 'u4',
    username: 'sewing',
    password: '1234',
    displayName: 'Sewing Supervisor',
    displayNameAr: 'مشرف الخياطة',
    role: 'sewing',
    avatarInitials: 'SW',
  },
  {
    id: 'u5',
    username: 'ironing',
    password: '1234',
    displayName: 'Ironing Supervisor',
    displayNameAr: 'مشرف المكوى',
    role: 'ironing',
    avatarInitials: 'IR',
  },
  {
    id: 'u6',
    username: 'packing',
    password: '1234',
    displayName: 'Packing Supervisor',
    displayNameAr: 'مشرف التعبئة',
    role: 'packing',
    avatarInitials: 'PK',
  },
];

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AppUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = 'pms_session';

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved) as AppUser) : null;
    } catch {
      return null;
    }
  });

  // Persist session on change
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const login = useCallback((username: string, password: string) => {
    const found = USERS.find(
      (u) => u.username === username.trim().toLowerCase() && u.password === password
    );
    if (!found) {
      return { success: false, error: 'invalid_credentials' };
    }
    const { password: _pw, ...safeUser } = found;
    setUser(safeUser);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// ─── Role labels ──────────────────────────────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, { en: string; ar: string; color: string }> = {
  po_manager: { en: 'PO Manager',         ar: 'مدير الأوردرات',  color: '#1565C0' },
  planner:    { en: 'Planner',            ar: 'المخطط',           color: '#6A1B9A' },
  cutting:    { en: 'Cutting Supervisor', ar: 'مشرف القص',        color: '#BF360C' },
  sewing:     { en: 'Sewing Supervisor',  ar: 'مشرف الخياطة',     color: '#1B5E20' },
  ironing:    { en: 'Ironing Supervisor', ar: 'مشرف المكوى',      color: '#E65100' },
  packing:    { en: 'Packing Supervisor', ar: 'مشرف التعبئة',     color: '#004D40' },
};

