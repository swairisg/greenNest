// src/pages/profile/EditProfile.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/useAuth";
import { API_BASE } from "../../../api";
import "./EditProfile.css";

const isPhone = (v = "") => /^[+()\-\.\s\d]{7,20}$/.test(String(v).trim());

export default function EditProfile() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  if (!user) return <div className="ep_wrap"><p>Loading…</p></div>;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    setErr("");

    if (form.phone && !isPhone(form.phone)) {
      setErr("Please enter a valid phone number.");
      return;
    }

    try {
      setSaving(true);

      const uid = user?.id || user?._id;
      const url = `${API_BASE}/api/auth/profile/${uid}`;

      const payload = {
        name: form.name?.trim(),
        phone: form.phone?.trim(),
        address: form.address?.trim(),
      };

      const res = await axios.put(url, payload, {
        headers: { "Content-Type": "application/json" },
      });

      const fresh = res?.data?.user;
      if (fresh) {
        // Merge to retain any extra client fields your app stores
        const merged = { ...(user || {}), ...fresh };

        // Update ONLY your user cache key(s). Do NOT touch the token.
        try { localStorage.setItem("gn:user", JSON.stringify(merged)); } catch {}
        try { localStorage.setItem("auth:user", JSON.stringify(merged)); } catch {}
        try { localStorage.setItem("user", JSON.stringify(merged)); } catch {}

        // Navigate to profile and hand off the updated user via route state
        nav("/profile", { replace: true, state: { updatedUser: merged } });
        return;
      }

      // If backend didn’t return user (unlikely), just go back
      nav("/profile", { replace: true });
    } catch (e) {
      console.error("Update profile failed:", e);
      setErr(e?.response?.data?.message || e?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => nav("/profile");

  return (
    <div className="ep_wrap">
      <form className="ep_card" onSubmit={onSave}>
        <h2 className="ep_title">Edit Profile</h2>

        <label className="ep_label">Email</label>
        <input className="ep_input" value={user.email} disabled />

        <label className="ep_label">Name</label>
        <input className="ep_input" name="name" value={form.name} onChange={onChange} placeholder="Your name" />

        <label className="ep_label">Phone</label>
        <input className="ep_input" name="phone" value={form.phone} onChange={onChange} placeholder="+94 7X XXX XXXX" />

        <label className="ep_label">Address</label>
        <textarea className="ep_input" name="address" rows={3} value={form.address} onChange={onChange} placeholder="Street, city" />

        {err && <div className="ep_error">{err}</div>}

        <div className="ep_actions">
          <button type="button" className="ep_btn ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="ep_btn" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
