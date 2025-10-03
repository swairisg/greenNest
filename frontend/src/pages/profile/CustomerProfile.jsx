import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth"; // ← changed import
import "../../styles/theme.css";
import "../../styles/app.css";

export default function CustomerProfile() {
  const { user, logout } = useAuth();
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
          <h2 style={{ marginTop: 0 }}>My Profile</h2>
          <button className="gn-btn ghost" onClick={doLogout}>
            Logout
          </button>
        </div>

        {!user ? (
          <p className="text-muted">Loading...</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Primary Role:</strong>{" "}
              {user.primaryRole || user.roles?.[0]}
            </div>
            <div>
              <strong>Status:</strong> {user.status}
            </div>
            {user.name && (
              <div>
                <strong>Name:</strong> {user.name}
              </div>
            )}
            {user.phone && (
              <div>
                <strong>Phone:</strong> {user.phone}
              </div>
            )}
            {user.address && (
              <div>
                <strong>Address:</strong> {user.address}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <button className="gn-btn ghost">Change Password</button>
        </div>
      </div>
    </div>
  );
}
