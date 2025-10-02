import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const nextPathByRole = (roles = []) => {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("hr_manager")) return "/hr";
  if (roles.includes("finance_manager")) return "/finance";
  if (roles.includes("inventory_manager")) return "/inventory";
  if (roles.includes("product_manager")) return "/products";
  if (roles.includes("farmer") || roles.includes("specialist")) return "/farmer";
  return "/home"; // (we'll wire Home in NEXT chunk)
};

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const u = await login(email, password);
      nav(nextPathByRole(u?.roles || []), { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "60px auto" }}>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        {err && <div style={{ color:"crimson" }}>{err}</div>}
        <button type="submit">Login</button>
      </form>
      <p style={{ marginTop: 10 }}>
        New customer? <Link to="/auth/signup">Create account</Link>
      </p>
    </div>
  );
}
