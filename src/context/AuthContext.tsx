import {

  createContext,

  useCallback,

  useContext,

  useEffect,

  useMemo,

  useState,

  type ReactNode,

} from "react";

import { api, ApiError, getToken, setToken, isApiAvailable } from "@/lib/api";

import type { UserRole } from "@/types";



export interface AuthUser {

  id: string;

  name: string;

  email: string;

  role: UserRole;

}



export const DEMO_PASSWORD = "password123";



export const DEMO_ACCOUNTS: { role: UserRole; label: string; email: string }[] = [

  { role: "admin", label: "Admin", email: "admin@orkestra.com" },

  { role: "management", label: "Management", email: "management@orkestra.com" },

  { role: "receptionist", label: "Receptionist", email: "receptionist@orkestra.com" },

  { role: "staff", label: "Staff", email: "staff@orkestra.com" },

  { role: "finance", label: "Finance", email: "finance@orkestra.com" },

  { role: "guest", label: "Guest", email: "guest@orkestra.com" },

];



const DEMO_EMAILS: Record<UserRole, string> = {

  admin: "admin@orkestra.com",

  management: "management@orkestra.com",

  receptionist: "receptionist@orkestra.com",

  staff: "staff@orkestra.com",

  finance: "finance@orkestra.com",

  guest: "guest@orkestra.com",

};



interface AuthContextValue {

  user: AuthUser | null;

  loading: boolean;

  apiConnected: boolean;

  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;

  loginAsDemo: (role: UserRole) => Promise<{ ok: boolean; error?: string }>;

  register: (data: {

    name: string;

    email: string;

    password: string;

  }) => Promise<{ ok: boolean; error?: string }>;

  logout: () => void;

}



const AuthContext = createContext<AuthContextValue | null>(null);



function mapUser(u: { id: string; name: string; email: string; role: string }): AuthUser {

  return {

    id: u.id,

    name: u.name,

    email: u.email,

    role: u.role.toLowerCase() as UserRole,

  };

}



export function AuthProvider({ children }: { children: ReactNode }) {

  const [user, setUser] = useState<AuthUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [apiConnected, setApiConnected] = useState(false);



  useEffect(() => {

    (async () => {

      const connected = await isApiAvailable();

      setApiConnected(connected);

      if (connected && getToken()) {

        try {

          const me = await api.me();

          setUser(mapUser(me));

        } catch {

          setToken(null);

        }

      }

      setLoading(false);

    })();

  }, []);



  const login = useCallback(

    async (email: string, password: string) => {

      if (!apiConnected) {

        return { ok: false, error: "Backend is offline. Start PostgreSQL and Spring Boot." };

      }

      try {

        const res = await api.login(email.trim(), password);

        if (res.token && res.user) {

          setToken(res.token);

          setUser(mapUser(res.user));

          return { ok: true };

        }

        return { ok: false, error: "Login failed" };

      } catch (e) {

        return { ok: false, error: e instanceof ApiError ? e.message : "Login failed" };

      }

    },

    [apiConnected],

  );



  const loginAsDemo = useCallback(

    async (role: UserRole) => login(DEMO_EMAILS[role], DEMO_PASSWORD),

    [login],

  );



  const register = useCallback(

    async (data: { name: string; email: string; password: string }) => {

      if (!apiConnected) {

        return { ok: false, error: "Backend is offline. Start PostgreSQL and Spring Boot." };

      }

      try {

        const res = await api.register({

          name: data.name,

          email: data.email,

          password: data.password,

        });

        if (res.token && res.user) {

          setToken(res.token);

          setUser(mapUser(res.user));

          return { ok: true };

        }

        return { ok: false, error: "Registration failed" };

      } catch (e) {

        return { ok: false, error: e instanceof ApiError ? e.message : "Registration failed" };

      }

    },

    [apiConnected],

  );



  const logout = useCallback(() => {

    setToken(null);

    setUser(null);

  }, []);



  const value = useMemo<AuthContextValue>(

    () => ({

      user,

      loading,

      apiConnected,

      login,

      loginAsDemo,

      register,

      logout,

    }),

    [user, loading, apiConnected, login, loginAsDemo, register, logout],

  );



  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;

}



export function useAuth() {

  const ctx = useContext(AuthContext);

  if (!ctx) throw new Error("useAuth must be used within AuthProvider");

  return ctx;

}



export function getDemoAccount(role: UserRole) {

  return { email: DEMO_EMAILS[role], password: DEMO_PASSWORD };

}

