import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

export default function RequireRole({ roles = [] }) {
  const { user } = useAuth();
  const ok = user?.roles?.some((r) => roles.includes(r));
  if (!ok) return <Navigate to="/auth/login" replace />;
  return <Outlet />;
}
