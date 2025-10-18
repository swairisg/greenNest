// CustomerProfile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "../../styles/theme.css";
import "../../styles/app.css";
import "./CustomerProfile.css";

export default function CustomerProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [freshUser, setFreshUser] = useState(null);
  const u = freshUser || user;

  useEffect(() => {
    if (!user?.id) return;

    const refetch = async () => {
      try {
        const res = await fetch(`/api/auth/profile/${user.id}?t=${Date.now()}`, {
          headers: { "Cache-Control": "no-store" },
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.user) setFreshUser(data.user);
      } catch {}
    };

    refetch();
    const onFocus = () => refetch();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user?.id]);

  const doLogout = async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  };
  const goUpdateProfile = () => navigate("/profile/edit");
  const goUpdatePassword = () => navigate("/auth/reset-password");
  const goBookVisit = () => navigate("/visit/book");

  // UPDATED: navigate with real user id
  const goUserOrders = () => {
    const id = u?.id || u?._id;
    if (id) navigate(`/profileorders/${id}`);
  };

  return (
    <div className="cp_profile profile_root">
      <div className="gn-container profile_container" style={{ maxWidth: 900 }}>
        <div className="gn-card profile_card">
          <div className="cp_header profile_header">
            <h2 className="cp_title profile_title">My Profile</h2>
            <button className="gn-btn ghost profile_btn profile_btn--ghost" onClick={doLogout}>
              Logout
            </button>
          </div>

          {!u ? (
            <p className="text-muted profile_loading">Loading...</p>
          ) : (
            <>
              {/* identity */}
              <div className="cp_identity profile_identity">
                <div className="cp_avatar profile_avatar">
                  {u?.name?.[0]?.toUpperCase() || u?.email?.[0]?.toUpperCase()}
                </div>
                <div className="profile_identityText">
                  <div className="cp_userName profile_userName">{u.name || "Customer"}</div>
                  <div className="cp_userMeta profile_userMeta">
                    {u.primaryRole || u.roles?.[0]} • {u.email}
                  </div>
                </div>
              </div>

              {/* fields */}
              <div className="cp_fields profile_fields">
                <div className="cp_field profile_field">
                  <div className="cp_label profile_label">Email</div>
                  <div className="cp_value profile_value">{u.email}</div>
                </div>
                <div className="cp_field profile_field">
                  <div className="cp_label profile_label">Primary Role</div>
                  <div className="cp_value profile_value">{u.primaryRole || u.roles?.[0]}</div>
                </div>
                {u.name && (
                  <div className="cp_field profile_field">
                    <div className="cp_label profile_label">Name</div>
                    <div className="cp_value profile_value">{u.name}</div>
                  </div>
                )}
                {u.phone && (
                  <div className="cp_field profile_field">
                    <div className="cp_label profile_label">Phone</div>
                    <div className="cp_value profile_value">{u.phone}</div>
                  </div>
                )}
                {u.address && (
                  <div className="cp_field profile_field">
                    <div className="cp_label profile_label">Address</div>
                    <div className="cp_value profile_value">{u.address}</div>
                  </div>
                )}
                <div className="cp_field profile_field">
                  <div className="cp_label profile_label">Status</div>
                  <div className="cp_value profile_value">{u.status}</div>
                </div>
              </div>

              {/* actions */}
              <div className="cp_actions profile_actions">
                <button
                  className="cp_btn cp_btn--primary profile_btn profile_btn--primary"
                  onClick={goUpdateProfile}
                >
                  Update Profile
                </button>

                <button
                  className="cp_btn cp_btn--ghost profile_btn profile_btn--ghost"
                  onClick={goUpdatePassword}
                >
                  Update Password
                </button>

                <button
                  className="cp_btn cp_btn--primary profile_btn profile_btn--primary"
                  onClick={goUserOrders}
                >
                  View Orders
                </button>

                <button className="gn-btn success profile_btn profile_btn--success" onClick={goBookVisit}>
                  Book Visit
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
