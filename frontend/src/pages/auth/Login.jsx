// frontend/src/pages/auth/Login.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

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
  const [showPw, setShowPw] = useState(false); // <-- added
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setErr("");
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const u = await login(email.trim(), password);
      setEmail("");
      setPassword("");
      nav(nextPathByUser(u), { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gn-container">
      <div className="gn-card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>

        <form
          onSubmit={onSubmit}
          autoComplete="off"
          style={{ display: "grid", gap: 12 }}
        >
          <input
            className="gn-input"
            type="email"
            name="gn-email"
            autoComplete="off"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="gn-input"
            type={showPw ? "text" : "password"}   // <-- toggle here
            name="gn-pass"
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Password"
          />

          {/* Show password checkbox */}
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={showPw}
              onChange={() => setShowPw((s) => !s)}
              aria-checked={showPw}
            />
            <span className="text-muted" style={{ fontSize: 13 }}>Show password</span>
          </label>

          {err && (
            <div
              className="gn-badge"
              style={{
                borderColor: "var(--strawberry-dark)",
                color: "var(--strawberry-dark)",
              }}
            >
              {err}
            </div>
          )}

          <button type="submit" className="gn-btn primary" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="text-muted" style={{ marginTop: 12, textAlign: "center" }}>
          Don’t have an account? <Link to="/auth/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
