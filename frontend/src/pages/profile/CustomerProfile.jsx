import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth"; 
import "../../styles/theme.css";
import "../../styles/app.css";
import "./CustomerProfile.css"

export default function CustomerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => { await logout(); navigate("/auth/login", { replace: true }); };
  const goUpdateProfile = () => navigate("/profile/edit");           // adjust route as you have it
  const goUpdatePassword = () => navigate("/auth/reset-password");   // or your preferred route

  return (
    <div className="cp_profile">
      <div className="gn-container" style={{ maxWidth: 900 }}>
        <div className="gn-card">
          <div className="cp_header">
            <h2 className="cp_title">My Profile</h2>
            <button className="gn-btn ghost" onClick={doLogout}>Logout</button>
          </div>

          {!user ? (
            <p className="text-muted">Loading...</p>
          ) : (
            <>
              {/* identity */}
              <div className="cp_identity">
                <div className="cp_avatar">
                  {/* put <img src={user.avatarUrl} alt="" /> if you have it */}
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="cp_userName">{user.name || "Customer"}</div>
                  <div className="cp_userMeta">
                    {user.primaryRole || user.roles?.[0]} • {user.email}
                  </div>
                </div>
              </div>

              {/* fields */}
              <div className="cp_fields">
                <div className="cp_field">
                  <div className="cp_label">Email</div>
                  <div className="cp_value">{user.email}</div>
                </div>
                <div className="cp_field">
                  <div className="cp_label">Primary Role</div>
                  <div className="cp_value">{user.primaryRole || user.roles?.[0]}</div>
                </div>
                {user.name && (
                  <div className="cp_field">
                    <div className="cp_label">Name</div>
                    <div className="cp_value">{user.name}</div>
                  </div>
                )}
                {user.phone && (
                  <div className="cp_field">
                    <div className="cp_label">Phone</div>
                    <div className="cp_value">{user.phone}</div>
                  </div>
                )}
                {user.address && (
                  <div className="cp_field">
                    <div className="cp_label">Address</div>
                    <div className="cp_value">{user.address}</div>
                  </div>
                )}
                <div className="cp_field">
                  <div className="cp_label">Status</div>
                  <div className="cp_value">{user.status}</div>
                </div>
              </div>

              {/* actions */}
              <div className="cp_actions">
                <button className="cp_btn cp_btn--primary" onClick={goUpdateProfile}>
                  Update Profile
                </button>
                <button className="cp_btn cp_btn--ghost" onClick={goUpdatePassword}>
                  Update Password
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
