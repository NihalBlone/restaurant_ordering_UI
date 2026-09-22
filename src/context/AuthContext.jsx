import { createContext, useContext, useEffect, useState } from "react";
import {
  getAdminSession,
  loginRestaurant,
  loginPlatform,
  logoutRestaurant,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getAdminSession()
      .then((session) => {
        if (active) setAdmin(session);
      })
      .catch(() => {
        if (active) setAdmin(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const handleExpiredSession = () => setAdmin(null);
    window.addEventListener("restaurant-auth-expired", handleExpiredSession);
    return () => {
      active = false;
      window.removeEventListener("restaurant-auth-expired", handleExpiredSession);
    };
  }, []);

  async function login(credentials, platform = false) {
    const session = await (platform ? loginPlatform(credentials) : loginRestaurant(credentials));
    setAdmin(session);
    return session;
  }

  async function logout() {
    try {
      await logoutRestaurant();
    } finally {
      setAdmin(null);
    }
  }

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
