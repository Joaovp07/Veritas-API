import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

type User = {
  id: number;
  name: string;
  email: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (payload: { name: string; email: string; password: string }) => Promise<string | null>;
  login: (payload: { email: string; password: string }) => Promise<string | null>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = "veritas_token";

function parseApiError(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (message) return message;
  }
  return "Não foi possível concluir a operação.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      return;
    }
    const response = await api.get<{ user: User }>("/user/profile");
    setUser(response.data.user);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await fetchProfile();
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const register = async (payload: { name: string; email: string; password: string }) => {
    try {
      await api.post("/auth/register", payload);
      return null;
    } catch (error) {
      return parseApiError(error);
    }
  };

  const login = async (payload: { email: string; password: string }) => {
    try {
      const response = await api.post<{ accessToken: string }>("/auth/login", payload);
      const nextToken = response.data.accessToken;
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
      await fetchProfile();
      return null;
    } catch (error) {
      return parseApiError(error);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      register,
      login,
      logout,
      refreshProfile: fetchProfile,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de AuthProvider");
  }
  return context;
}
