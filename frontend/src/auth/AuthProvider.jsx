import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthCtx = createContext();
export const useAuthCtx = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");

  // keep axios default header in sync
  useEffect(() => {
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete api.defaults.headers.common.Authorization;
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token: t, data } = res.data || {};
    if (!t) throw new Error("No token from server");

    localStorage.setItem("token", t);
    setToken(t);
    setUser(data?.user || null);
    return data?.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
