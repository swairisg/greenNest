// src/auth/useAuth.js
import AuthProvider, { useAuthCtx } from "./AuthProvider";
export { AuthProvider }; // optional re-export for convenience
export const useAuth = () => useAuthCtx(); // our canonical hook
