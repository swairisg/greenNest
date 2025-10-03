
/*import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { UsersAPI } from "../../api";
import { useAuth } from "../../auth/useAuth";
import "./CustomerProfileEdit.css";

export default function CustomerProfileEdit() {
  const nav = useNavigate();
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || "", phone: user.phone || "", address: user.address || "" });
  }, [user]);

  const change = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const validate = () => {
    const errs = [];
    if (form.name && (form.name.length < 2 || form.name.length > 60)) errs.push("Name must be 2–60 chars.");
    if (form.phone && !/^[0-9+\-\s()]{7,20}$/.test(form.phone)) errs.push("Phone looks invalid.");
    if (form.address.length > 200) errs.push("Address too long (max 200).");
    return errs;
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) {
      Swal.fire({ icon: "error", title: "Fix these", html: `<ul style="text-align:left">${errs.map(x=>`<li>${x}</li>`).join("")}</ul>` });
      return;
    }
    try {
      setSaving(true);
      const { user: updated } = await UsersAPI.updateMe(form);
      setUser(updated);
      Swal.fire({ icon: "success", title: "Saved", timer: 1200, showConfirmButton: false });
      nav("/profile", { replace: true });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Update failed", text: err?.response?.data?.message || err.message });
    } finally { setSaving(false); }
  };

  if (!user) return <div className="gn-container" style={{maxWidth:900}}><div className="gn-card">Loading...</div></div>;

  return (
    <div className="cpe_wrap">
      <div className="gn-container" style={{ maxWidth: 900 }}>
        <form className="gn-card cpe_card" onSubmit={save}>
          <div className="cpe_header">
            <h2>Edit Profile</h2>
            <button type="button" className="gn-btn ghost" onClick={() => nav("/profile")}>Cancel</button>
          </div>

          <div className="cpe_grid">
            <label className="cpe_field">
              <span className="cpe_label">Name</span>
              <input className="gn-input" name="name" value={form.name} onChange={change} placeholder="Full name" />
            </label>

            <label className="cpe_field">
              <span className="cpe_label">Phone</span>
              <input className="gn-input" name="phone" value={form.phone} onChange={change} placeholder="+94 77 123 4567" />
            </label>

            <label className="cpe_field cpe_field--full">
              <span className="cpe_label">Address</span>
              <textarea className="gn-input" name="address" rows={3} value={form.address} onChange={change} placeholder="No. 12, Road..., City" />
            </label>
          </div>

          <div className="cpe_actions">
            <button className="cp_btn cp_btn--primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
            <button type="button" className="cp_btn cp_btn--ghost" onClick={() => nav("/auth/reset-password")}>Update Password</button>
          </div>
        </form>
      </div>
    </div>
  );
} 8
 */
