import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE } from '@/constants/api';

type User = {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  avatar_url?: string;
  cover_photo_url?: string;
  city?: string;
  bio?: string;
  dealership_name?: string;
  docs_status?: string | null;
  docs_rejection_reason?: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (token: string, refreshToken: string) => Promise<User | null>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  setAuth: async () => null,
  logout: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [token,     setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadToken(); }, []);

  async function loadToken() {
    try {
      const t = await SecureStore.getItemAsync('access_token');
      if (t) {
        setToken(t);
        await fetchUser(t);
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }

  async function fetchUser(t: string): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });

      if (res.ok) {
        const u: User = await res.json();
        setUser(u);
        return u;
      }

      // Token expired (401) → try refresh before logging out
      if (res.status === 401) {
        const refreshed = await tryRefresh();
        if (!refreshed) {
          await clearAuth();
        }
      }
      // For other errors (500, network) — keep token, don't logout
    } catch {
      // Network error — keep existing token/user, don't logout
    }
    return null;
  }

  async function tryRefresh(): Promise<boolean> {
    try {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      if (!refreshToken) return false;

      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        await SecureStore.setItemAsync('access_token', data.access_token);
        if (data.refresh_token) {
          await SecureStore.setItemAsync('refresh_token', data.refresh_token);
        }
        setToken(data.access_token);
        // Fetch user with new token
        const userRes = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        if (userRes.ok) setUser(await userRes.json());
        return true;
      }
    } catch { /* offline */ }
    return false;
  }

  async function clearAuth() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setToken(null);
    setUser(null);
  }

  async function setAuth(accessToken: string, refreshToken: string): Promise<User | null> {
    await SecureStore.setItemAsync('access_token', accessToken);
    await SecureStore.setItemAsync('refresh_token', refreshToken);
    const fetchedUser = await fetchUser(accessToken);
    setToken(accessToken);
    return fetchedUser;
  }

  async function logout() {
    await clearAuth();
  }

  async function refreshUser() {
    const t = token || await SecureStore.getItemAsync('access_token');
    if (t) await fetchUser(t);
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, setAuth, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
