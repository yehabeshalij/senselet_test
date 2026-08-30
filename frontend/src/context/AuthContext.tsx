import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AUTH_API_BASE } from '../config/api';

interface StaffInfo { id: string; fullName: string; role: string; }
interface AuthContextValue {
  staff: StaffInfo | null;
  login: (username: string, pin: string, expectedRole?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('staff_token'));
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async (t: string) => {
    try {
      const res = await fetch(`${AUTH_API_BASE}/me`, { headers: { Authorization: `Bearer ${t}` } });

      // 🎯 ትክክለኛ auth ውድቅ (401/403) ብቻ token ን ያጠፋል — session በእውነት ካለቀ ወይም ተቋርጦ ከሆነ ብቻ
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('staff_token');
        setToken(null);
        setStaff(null);
        return;
      }

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setStaff(json.staff);
      }
      // ⚠️ ሌላ ስህተት (network/500) ከሆነ token ን አናጠፋም — ገጹ ዳግም ሲሞክር (ወይም ተመልሶ refresh ሲደረግ) በራሱ ይሳካል
    } catch {
      // network error — session ላይ ምንም አንቀይርም
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) fetchMe(token);
    else setLoading(false);
  }, [token, fetchMe]);

  const login = async (username: string, pin: string, expectedRole?: string) => {
    const deviceLabel = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 100) : undefined;
    const res = await fetch(`${AUTH_API_BASE}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin, deviceLabel, expectedRole }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'መግባት አልተቻለም');
    localStorage.setItem('staff_token', json.token);
    setToken(json.token);
    setStaff(json.staff);
  };

  const logout = () => {
    const t = localStorage.getItem('staff_token');
    if (t) {
      fetch(`${AUTH_API_BASE}/logout`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } }).catch(() => {});
    }
    localStorage.removeItem('staff_token');
    setToken(null);
    setStaff(null);
  };

  return (
    <AuthContext.Provider value={{ staff, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}