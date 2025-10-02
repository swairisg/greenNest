import React, { createContext, useContext, useState } from "react";
import { api } from "../api";

const AuthCtx = createContext(null);
export const useAuthCtx = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id,email,roles,primaryRole,status }

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const u = data?.data?.user;
    setUser(u);
    return u;
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } finally { setUser(null); }
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
