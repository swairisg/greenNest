import React, { useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../api";
import bookvisit from "../../../assests/customers/bookvisit.jpg";

import "./BookVisit.css";

const SLOT_OPTIONS = [
  "09:00-10:00", "10:00-11:00", "11:00-12:00",
  "13:00-14:00", "14:00-15:00", "15:00-16:00"
];

const isEmail = (v="") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isPhone = (v = "") => {
  const digits = (v.match(/\d/g) || []).length;
   return digits === 10 && /^[+()\-.\s\d]+$/.test(v);
 };
 
export default function BookVisit() {
  const nav = useNavigate();
  const [inputs, setInputs] = useState({
    fullName: "",
    email: "",
    phone: "",
    preferredDate: "",
    timeSlot: "",
    visitorsCount: 1,
    purpose: "",
    agreeToTerms: false,
    website: "" 
  });

  const todayStr = useMemo(() => {
    const d = new Date(); const yyyy=d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInputs((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const errs = [];
    if ((inputs.fullName||"").trim().length < 2) errs.push("Full name is required (min 2 chars)");
    if (!isEmail(inputs.email)) errs.push("Valid email is required");
    if (!isPhone(inputs.phone)) errs.push("Valid phone is required");

    if (!inputs.preferredDate) errs.push("Preferred date is required");
    else {
      const chosen = new Date(inputs.preferredDate); chosen.setHours(0,0,0,0);
      const today  = new Date(); today.setHours(0,0,0,0);
      if (chosen < today) errs.push("Preferred date cannot be in the past");
    }

    if (!inputs.timeSlot) errs.push("Please choose a time slot");
    const count = Number(inputs.visitorsCount);
    if (!Number.isInteger(count) || count < 1 || count > 20)
      errs.push("Visitors count must be between 1 and 20");

    if ((inputs.purpose || "").length > 300)
      errs.push("Purpose must be 300 characters or less");

    if (!(inputs.agreeToTerms === true)) errs.push("You must accept the terms");
    return errs;
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length) {
      Swal.fire({
        icon: "error",
        title: "Please check the form",
        html: `<ul style="text-align:left;margin:0">${errs.map(x=>`<li>${x}</li>`).join("")}</ul>`
      });
      return;
    }

    try {
      const payload = {
        ...inputs,
        email: (inputs.email || "").toLowerCase(), 
        agreeToTerms: true                          
      };

      const res = await axios.post(`${API_BASE}/public/visit-bookings`, payload);
      if (res.status === 201) {
        nav("/visit/success", { replace: true, state: { name: inputs.fullName } });
      } else {
        Swal.fire({ icon: "info", title: "Submitted", text: "Thanks for your request." });
      }
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.errors?.join?.("\n") ||
        err?.response?.data?.message ||
        err?.message ||
        "Submit failed";
      Swal.fire({ icon: "error", title: "Oops", text: msg });
    }
  };

  return (
  <div className="bv-section">
    <div className="bv-frame">
      {/* LEFT: your existing form (unchanged fields) */}
      <div className="bv-left">
        <h2 className="bookvisit-title">Book a Greenhouse Visit</h2>
        <p className="bookvisit-sub">Open to everyone. We’ll confirm by email.</p>

        <form onSubmit={submit} className="bookvisit-form" noValidate>
          <div className="bv-row">
            <label>Full Name <span>*</span></label>
            <input
              name="fullName"
              value={inputs.fullName}
              onChange={onChange}
              placeholder="Your full name"
              required
              minLength={2}
              maxLength={80}
            />
          </div>

          <div className="bv-grid">
            <div className="bv-col">
              <label>Email <span>*</span></label>
              <input
                type="email"
                name="email"
                value={inputs.email}
                onChange={onChange}
                placeholder="you@example.com"
                required
                inputMode="email"
              />
            </div>
            <div className="bv-col">
              <label>Phone <span>*</span></label>
              <input
                name="phone"
                value={inputs.phone}
                onChange={onChange}
                placeholder="+94 7X XXX XXXX"
                required
                maxLength={20}
                pattern="[+()\\-\\.\\s\\d]{7,20}"
                title="7–20 digits/spaces, may include + ( ) - ."
              />
            </div>
            <div className="bv-col">
              <label>Visitors <span>*</span></label>
              <input
                type="number"
                name="visitorsCount"
                min={1}
                max={20}
                required
                value={inputs.visitorsCount}
                onChange={onChange}
              />
            </div>
          </div>

          <div className="bv-grid">
            <div className="bv-col">
              <label>Preferred Date <span>*</span></label>
              <input
                type="date"
                name="preferredDate"
                min={todayStr}
                value={inputs.preferredDate}
                onChange={onChange}
                required
              />
            </div>
            <div className="bv-col">
              <label>Time Slot <span>*</span></label>
              <select
                name="timeSlot"
                value={inputs.timeSlot}
                onChange={onChange}
                required
              >
                <option value="">-- Select --</option>
                {SLOT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="bv-row">
            <label>Purpose (optional)</label>
            <textarea
              name="purpose"
              rows={3}
              placeholder="Tell us a bit about your visit (optional)"
              value={inputs.purpose}
              onChange={(e) => {
                const v = e.target.value.slice(0, 300);
                setInputs(p => ({ ...p, purpose: v }));
              }}
            />
            <div style={{textAlign:"right", fontSize:12, color:"#6a8a76"}}>
              {(inputs.purpose || "").length}/300
            </div>
          </div>

          {/* Honeypot (hidden) */}
          <div className="bv-hp">
            <label>Website</label>
            <input name="website" value={inputs.website} onChange={onChange} autoComplete="off" />
          </div>

          <div className="bv-check">
            <input
              id="agree"
              type="checkbox"
              name="agreeToTerms"
              checked={inputs.agreeToTerms}
              onChange={onChange}
              required
            />
            <label htmlFor="agree">I agree to the terms and privacy policy.</label>
          </div>

          <div className="bv-actions">
            <button className="bv-btn" type="submit">Submit Request</button>
          </div>

          <p className="bv-note">We aim to respond within 24–48 hours.</p>
        </form>
      </div>

      {/* RIGHT: fixed-width side image (not full page) */}
      <div className="bv-sideimg" style={{ backgroundImage: `url(${bookvisit})` }}>
      </div>
    </div>
  </div>
);

}
