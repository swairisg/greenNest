import React, { useEffect, useState } from "react";
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

  useEffect(() => { setEmail(""); setPassword(""); setErr(""); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const u = await login(email, password);
      setEmail(""); setPassword("");
      nav(nextPathByRole(u?.roles || []), { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed");
    }
  };


 return (
    <div className="gn-container">
      <div className="gn-card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <form onSubmit={onSubmit} autoComplete="off" style={{ display: "grid", gap: 12 }}>
          <input className="gn-input" type="email" name="gn-email" autoComplete="off"
                 placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
          <input className="gn-input" type="password" name="gn-pass" autoComplete="new-password"
                 placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
          {err && <div className="gn-alert">{err}</div>}
          <button type="submit" className="gn-btn primary">Login</button>
        </form>
        <p className="text-muted" style={{ marginTop: 10 }}>
          New customer? <Link to="/auth/signup">Create account</Link>
        </p>
      </div>
    </div>
  );

}
