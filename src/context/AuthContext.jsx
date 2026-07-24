import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    try {
      const { user } = await api.get("/auth?action=me");
      setUser(user);
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { user } = await api.post("/auth?action=login", { email, password });
    setUser(user);
  }

  async function register(payload) {
    const { user } = await api.post("/auth?action=register", payload);
    setUser(user);
  }

  async function signOut() {
    await api.post("/auth?action=logout");
    setUser(null);
  }

  const value = {
    user,
    profile: user,
    role: user?.role || null,
    loading,
    refreshProfile,
    login,
    register,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
