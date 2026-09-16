import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, clearStoredAuthTokens } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // null = checking, false = guest

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data?.authenticated === false ? false : data);
    } catch {
      setUser(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    clearStoredAuthTokens();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
