import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth"; // ← changed import
import "../../styles/theme.css";
import "../../styles/app.css";

export default function Home() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="gn-container" style={{ maxWidth: 900 }}>
      <div className="gn-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ marginTop: 0, color: "var(--green-dark)" }}>
              Welcome to GreenNest
            </h2>
            <p className="text-muted" style={{ marginTop: 6 }}>
              This is a demo home page for customers.
            </p>
          </div>
          <button className="gn-btn ghost" onClick={doLogout}>
            Logout
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Link className="gn-btn primary" to="/profile">
            View My Profile
          </Link>
          
          <Link className="gn-btn ghost" to="/catalog">Shop Products</Link>
        </div>
      </div>
    </div>
  );
}
