import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE } from "../../api";
import "../../styles/theme.css";
import "../../styles/app.css";

export default function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
    agree: false,
  });

  // separate toggles for each field
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const validateClient = () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword)
      return "Please fill all required fields.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password))
      return "Use 8+ chars with upper, lower, and a number.";
    if (!form.agree) return "Please accept the terms.";
    return null;
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validateClient();
    if (err) return Swal.fire({ icon: "warning", text: err });

    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/auth/signup`, {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        address: form.address || undefined,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      Swal.fire({ icon: "success", title: "Welcome!", text: res.data?.message || "Account created." });
      navigate("/auth/login");
    } catch (error) {
      const msg = error?.response?.data?.message || "Signup failed";
      Swal.fire({ icon: "error", title: "Oops", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gn-container" style={{ maxWidth: 680 }}>
      <div className="gn-card">
        <h2 style={{ margin: 0, color: "var(--green-dark)" }}>Create your GreenNest account</h2>
        <p className="text-muted" style={{ marginTop: 6 }}>
          Join our farm-to-table marketplace to order fresh strawberries, flowers, and veggies.
        </p>

        <form onSubmit={submit} autoComplete="off" style={{ marginTop: 16 }}>
          <label style={{ fontWeight: 600, margin: "12px 0 6px" }}>Full Name*</label>
          <input className="gn-input" name="name" value={form.name} onChange={onChange} placeholder="Jane Doe" autoComplete="off" required />

          <label style={{ fontWeight: 600, margin: "12px 0 6px" }}>Email*</label>
          <input className="gn-input" name="email" type="email" value={form.email} onChange={onChange} placeholder="jane@example.com" autoComplete="off" required />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 600, margin: "12px 0 6px" }}>Phone</label>
              <input className="gn-input" name="phone" value={form.phone} onChange={onChange} placeholder="+94 7X XXX XXXX" autoComplete="off" />
            </div>
            <div>
              <label style={{ fontWeight: 600, margin: "12px 0 6px" }}>Address</label>
              <input className="gn-input" name="address" value={form.address} onChange={onChange} placeholder="City / District" autoComplete="off" />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8 }}>
            <label style={{ fontWeight: 600, margin: "12px 0 6px" }}>Password*</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={showPw} onChange={() => setShowPw((s) => !s)} />
              <span className="text-muted" style={{ fontSize: 13 }}>Show</span>
            </label>
          </div>
          <input
            className="gn-input"
            name="password"
            type={showPw ? "text" : "password"}
            value={form.password}
            onChange={onChange}
            placeholder="Min 8 chars, upper/lower/number"
            autoComplete="new-password"
            required
            aria-label="Password"
          />

          {/* Confirm Password */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 8 }}>
            <label style={{ fontWeight: 600, margin: "12px 0 6px" }}>Confirm Password*</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="checkbox" checked={showConfirmPw} onChange={() => setShowConfirmPw((s) => !s)} />
              <span className="text-muted" style={{ fontSize: 13 }}>Show</span>
            </label>
          </div>
          <input
            className="gn-input"
            name="confirmPassword"
            type={showConfirmPw ? "text" : "password"}
            value={form.confirmPassword}
            onChange={onChange}
            autoComplete="new-password"
            required
            aria-label="Confirm password"
          />

          <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <input type="checkbox" name="agree" checked={form.agree} onChange={onChange} />
            <span>I agree to the Terms & Privacy Policy</span>
          </label>

          <button className="gn-btn primary" style={{ width: "100%", marginTop: 14 }} disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="text-muted" style={{ marginTop: 12, textAlign: "center" }}>
            Already have an account? <Link to="/auth/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
