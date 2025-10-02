import { useContext } from "react";
import AuthProvider, { useAuthCtx } from "./AuthProvider";
export { AuthProvider }; // (optional re-export)
export const useAuth = () => useAuthCtx();
