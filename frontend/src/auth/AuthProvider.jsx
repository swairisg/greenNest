// src/auth/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const AuthCtx = createContext(null);
export const useAuthCtx = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gn_user") || "null"); }
    catch { return null; }
  });

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const u = data?.data?.user;
    setUser(u);
    localStorage.setItem("gn_user", JSON.stringify(u));
    return u;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } finally {
      setUser(null);
      localStorage.removeItem("gn_user");
    }
  };

  // keep localStorage in sync both ways
  useEffect(() => {
    if (user) localStorage.setItem("gn_user", JSON.stringify(user));
    else localStorage.removeItem("gn_user");
  }, [user]);

  // ✅ alias used by your pages
  const setUserFromServer = (freshUser) => setUser(freshUser);

  return (
    <AuthCtx.Provider value={{ user, setUser, setUserFromServer, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
