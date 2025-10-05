// frontend/src/pages/auth/Login.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";


const nextPathByUser = (user) => {
  const primary = user?.primaryRole;
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const has = (r) => r && (primary === r || roles.includes(r));
  if (has("admin")) return "/admin";
  if (has("hr_manager")) return "/hr";
  if (has("finance_manager")) return "/finance";
  if (has("inventory_manager")) return "/inventory";
  if (has("product_manager")) return "/products";
  if (has("farmer") || has("specialist")) return "/farmer";
  return "/home";
};

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
  }, []);

   const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email.trim(), password);

      // success popup
      await Swal.fire({
        icon: "success",
        title: "Signed in",
        text: `Welcome back, ${u?.email || "user"}!`,
        timer: 1200,
        timerProgressBar: true,
        showConfirmButton: false,
        position: "top",
      });

      setEmail(""); setPassword("");
      nav(nextPathByUser(u), { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.message || "Login failed";
      await Swal.fire({
        icon: "error",
        title: "Login failed",
        text: msg,
        confirmButtonColor: "#22c55e", // your green
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="gn-auth-shell">
      <div className="gn-auth-card">
        <header className="gn-auth-header">
          <div className="gn-auth-logo" aria-hidden />
          <h1 className="gn-auth-title">Login</h1>
          <p className="gn-auth-sub">Welcome back to GreenNest</p>
        </header>

        <form onSubmit={onSubmit} autoComplete="off" className="gn-auth-form">
          <label className="gn-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="gn-input lg"
            type="email"
            name="gn-email"
            autoComplete="off"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

  {email && <div className="gn-hint">You’re signing in as <strong>{email}</strong></div>}


          <label className="gn-label" htmlFor="password">Password</label>
          <div className="gn-password-wrap">
            <input
              id="password"
              className="gn-input lg"
              type={showPw ? "text" : "password"}
              name="gn-pass"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
            />
            <button
              type="button"
              className="gn-eye"
              aria-label={showPw ? "Hide password" : "Show password"}
              onClick={() => setShowPw((s) => !s)}
               title={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>

           <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={showPw}
              onChange={() => setShowPw((s) => !s)}
              aria-checked={showPw}
            />
            <span className="text-muted" style={{ fontSize: 13 }}>Show password</span>
          </label>

          <button type="submit" className="gn-btn primary xl press" disabled={loading}>
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <footer className="gn-auth-footer small">
          <span className="text-muted">Don’t have an account?</span>{" "}
          <Link to="/auth/signup" className="link-green">Create one</Link>
        </footer>
      </div>
    </main>
  );
}
