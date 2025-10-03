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
    const u = data?.data?.user;          // expects { name, phone, address, ... }
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

  // Optional: keep localStorage in sync if setUser is used elsewhere
  useEffect(() => {
    if (user) localStorage.setItem("gn_user", JSON.stringify(user));
  }, [user]);

  return (
    <AuthCtx.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
