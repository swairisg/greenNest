import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./PestDetectAdd.css";
import { API_BASE } from "../../../api";

const SEVERITIES = ["Low", "Moderate", "High"];

const isISODate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const toDate = (s) => (isISODate(s) ? new Date(`${s}T00:00:00`) : new Date("Invalid"));
const isFuture = (d) => d instanceof Date && !isNaN(d) && d > new Date(new Date().toDateString());
const trim = (v) => (v ?? "").toString().trim();

export default function PestDetectAdd({ role = "farmer" }) {
  const navigate = useNavigate();
  const { id } = useParams();

  const isFarmer = role === "farmer";
  const isSpecialist = role === "specialist";

  const [farmer, setFarmer] = useState({
    crop: "",
    date_identified: "",
    symptoms: "",
    severity_level: "",
  });

  const [treat, setTreat] = useState({
    pesticide: "",
    application_method: "",
    dosage: "",
    treatment_date: "",
  });

  const [loading, setLoading] = useState(isSpecialist);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // touched + errors for inline validation
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  // ---- validation rules ----
  const validate = useMemo(() => ({
    crop: (v) => {
      const s = trim(v);
      if (!s) return "Crop is required.";
      if (s.length < 2) return "Crop must be at least 2 characters.";
      if (s.length > 50) return "Crop is too long.";
      return "";
    },
    date_identified: (v) => {
      if (!v) return "Date is required.";
      if (!isISODate(v)) return "Use format YYYY-MM-DD.";
      const d = toDate(v);
      if (isNaN(d)) return "Invalid date.";
      if (isFuture(d)) return "Date cannot be in the future.";
      return "";
    },
    symptoms: (v) => {
      const s = trim(v);
      if (!s) return "Symptoms are required.";
      if (s.length < 10) return "Please add a bit more detail (≥ 10 chars).";
      return "";
    },
    severity_level: (v) => {
      if (!v) return "Select a severity.";
      if (!SEVERITIES.includes(v)) return "Invalid severity.";
      return "";
    },
    pesticide: (v) => (isSpecialist && !trim(v) ? "Pesticide is required." : ""),
    application_method: (v) => (isSpecialist && !trim(v) ? "Application method is required." : ""),
    dosage: (v) => {
      if (!isSpecialist) return "";
      const s = trim(v);
      if (!s) return "Dosage is required.";
      // Soft pattern (e.g., "5 ml/L", "2 g/L", "20 ml/15 L")
      const ok = /\d/.test(s);
      if (!ok) return "Add a numeric amount (e.g., 5 ml/L).";
      return "";
    },
    treatment_date: (v) => {
      if (!isSpecialist) return "";
      if (!v) return "Treatment date is required.";
      if (!isISODate(v)) return "Use format YYYY-MM-DD.";
      const d = toDate(v);
      if (isNaN(d)) return "Invalid treatment date.";
      return "";
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [isSpecialist]);

  const setFieldTouched = (name) =>
    setTouched((t) => ({ ...t, [name]: true }));

  const setFieldError = (name, message) =>
    setErrors((e) => ({ ...e, [name]: message }));

  const validateField = (name, value, context = { farmer, treat }) => {
    let msg = "";
    if (name in validate) msg = validate[name](value);

    // cross-field: if both farmer date & treatment date exist, warn if treatment predates report
    if (!msg && name === "treatment_date" && context?.farmer?.date_identified && value) {
      const fd = toDate(context.farmer.date_identified);
      const td = toDate(value);
      if (!isNaN(fd) && !isNaN(td) && td < fd) {
        msg = "Treatment cannot be before report date.";
      }
    }
    setFieldError(name, msg);
    return msg;
  };

  const validateAll = () => {
    const ctx = { farmer, treat };
    const nextErrors = {};

    if (isFarmer) {
      nextErrors.crop = validate.crop(farmer.crop);
      nextErrors.date_identified = validate.date_identified(farmer.date_identified);
      nextErrors.symptoms = validate.symptoms(farmer.symptoms);
      nextErrors.severity_level = validate.severity_level(farmer.severity_level);
    }
    if (isSpecialist) {
      nextErrors.pesticide = validate.pesticide(treat.pesticide);
      nextErrors.application_method = validate.application_method(treat.application_method);
      nextErrors.dosage = validate.dosage(treat.dosage);
      nextErrors.treatment_date = validate.treatment_date(treat.treatment_date)
        || (farmer.date_identified && treat.treatment_date &&
            toDate(treat.treatment_date) < toDate(farmer.date_identified)
              ? "Treatment cannot be before report date."
              : "");
    }

    setErrors(nextErrors);
    // mark all as touched so errors show on submit
    const allTouched = {};
    Object.keys(nextErrors).forEach((k) => { allTouched[k] = true; });
    setTouched((t) => ({ ...t, ...allTouched }));

    return Object.values(nextErrors).every((m) => !m);
  };

  // ---- load existing record for specialist ----
  useEffect(() => {
    if (!isSpecialist || !id) return;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE}/users/${id}`);
        const u = data?.user ?? {};
        setFarmer({
          crop: u.crop ?? "",
          date_identified: u.date_identified ? u.date_identified.slice(0, 10) : "",
          symptoms: u.symptoms ?? "",
          severity_level: u.severity_level ?? "",
        });
        setTreat({
          pesticide: u.pesticide ?? "",
          application_method: u.application_method ?? "",
          dosage: u.dosage ?? "",
          treatment_date: u.treatment_date ? u.treatment_date.slice(0, 10) : "",
        });
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isSpecialist]);

  const onFarmerChange = (e) => {
    const { name, value } = e.target;
    setFarmer((p) => ({ ...p, [name]: value }));
    if (touched[name]) validateField(name, value, { farmer: { ...farmer, [name]: value }, treat });
  };
  const onTreatChange = (e) => {
    const { name, value } = e.target;
    setTreat((p) => ({ ...p, [name]: value }));
    if (touched[name]) validateField(name, value, { farmer, treat: { ...treat, [name]: value } });
  };

  const onBlur = (e) => {
    const { name } = e.target;
    setFieldTouched(name);
    const value = name in farmer ? farmer[name] : treat[name];
    validateField(name, value, { farmer, treat });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) return;
    setSaving(true);
    try {
      if (isFarmer) {
        await axios.post(`${API_BASE}/users`, {
          date_identified: farmer.date_identified,
          crop: farmer.crop,
          symptoms: farmer.symptoms,
          severity_level: farmer.severity_level,
        });
        alert("Successfully reported pest.");
      } else if (isSpecialist && id) {
        await axios.put(`${API_BASE}/users/${id}`, {
          pesticide: treat.pesticide,
          application_method: treat.application_method,
          dosage: treat.dosage,
          treatment_date: treat.treatment_date,
        });
        alert("Treatment saved.");
      }
      navigate("/PestDetectDisplay");
    } catch (e2) {
      setError(e2.response?.data?.message || e2.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pd-loading">Loading…</div>;
  if (error) return <div className="pd-error">Error: {error}</div>;

  const farmerEditable = isFarmer && !id;
  const specialistEditable = isSpecialist;

  const err = (k) => (touched[k] && errors[k] ? <div className="pd-help is-error">{errors[k]}</div> : null);
  const invalidClass = (k) => (touched[k] && errors[k] ? " is-invalid" : "");

  return (
    <div className="pd-container">
      <h2 className="pd-title">Pest Detection</h2>

      <form className="pd-form" onSubmit={onSubmit} noValidate>
        <fieldset className="pd-fieldset" disabled={!farmerEditable}>
          <legend className="pd-legend">Farmer Report</legend>

          <div className="pd-row">
            <label className="pd-label" htmlFor="crop">Crop name</label>
            <input
              className={`pd-input${invalidClass("crop")}`}
              id="crop" name="crop" value={farmer.crop}
              onChange={onFarmerChange} onBlur={onBlur} required
              aria-invalid={!!(touched.crop && errors.crop)} aria-describedby="err-crop"
            />
          </div>
          {touched.crop && errors.crop && <div id="err-crop" className="pd-help is-error">{errors.crop}</div>}

          <div className="pd-row">
            <label className="pd-label" htmlFor="date_identified">Date reported</label>
            <input
              className={`pd-input${invalidClass("date_identified")}`}
              type="date" id="date_identified" name="date_identified"
              value={farmer.date_identified} onChange={onFarmerChange} onBlur={onBlur} required
              aria-invalid={!!(touched.date_identified && errors.date_identified)} aria-describedby="err-date"
            />
          </div>
          {touched.date_identified && errors.date_identified && <div id="err-date" className="pd-help is-error">{errors.date_identified}</div>}

          <div className="pd-row">
            <label className="pd-label" htmlFor="symptoms">Symptoms description</label>
            <textarea
              className={`pd-textarea${invalidClass("symptoms")}`}
              id="symptoms" name="symptoms" rows={3}
              value={farmer.symptoms} onChange={onFarmerChange} onBlur={onBlur} required
              aria-invalid={!!(touched.symptoms && errors.symptoms)} aria-describedby="err-symptoms"
            />
          </div>
          {touched.symptoms && errors.symptoms && <div id="err-symptoms" className="pd-help is-error">{errors.symptoms}</div>}

          <div className="pd-row">
            <label className="pd-label" htmlFor="severity_level">Severity level</label>
            <select
              className={`pd-select${invalidClass("severity_level")}`}
              id="severity_level" name="severity_level"
              value={farmer.severity_level} onChange={onFarmerChange} onBlur={onBlur} required
              aria-invalid={!!(touched.severity_level && errors.severity_level)} aria-describedby="err-severity"
            >
              <option value="">--Select--</option>
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {touched.severity_level && errors.severity_level && <div id="err-severity" className="pd-help is-error">{errors.severity_level}</div>}
        </fieldset>

        <fieldset className="pd-fieldset" disabled={!specialistEditable}>
          <legend className="pd-legend">Specialist Treatment</legend>

          <div className="pd-row">
            <label className="pd-label" htmlFor="pesticide">Pesticide name</label>
            <input
              className={`pd-input${invalidClass("pesticide")}`}
              id="pesticide" name="pesticide"
              value={treat.pesticide} onChange={onTreatChange} onBlur={onBlur} required={isSpecialist}
              aria-invalid={!!(touched.pesticide && errors.pesticide)} aria-describedby="err-pesticide"
            />
          </div>
          {touched.pesticide && errors.pesticide && <div id="err-pesticide" className="pd-help is-error">{errors.pesticide}</div>}

          <div className="pd-row">
            <label className="pd-label" htmlFor="application_method">Method of application</label>
            <input
              className={`pd-input${invalidClass("application_method")}`}
              id="application_method" name="application_method"
              value={treat.application_method} onChange={onTreatChange} onBlur={onBlur} required={isSpecialist}
              aria-invalid={!!(touched.application_method && errors.application_method)} aria-describedby="err-method"
            />
          </div>
          {touched.application_method && errors.application_method && <div id="err-method" className="pd-help is-error">{errors.application_method}</div>}

          <div className="pd-row">
            <label className="pd-label" htmlFor="dosage">Dosage</label>
            <input
              className={`pd-input${invalidClass("dosage")}`}
              id="dosage" name="dosage"
              value={treat.dosage} onChange={onTreatChange} onBlur={onBlur} required={isSpecialist}
              placeholder="e.g., 5 ml/L; 1 L per 10 plants"
              aria-invalid={!!(touched.dosage && errors.dosage)} aria-describedby="err-dosage"
            />
          </div>
          {touched.dosage && errors.dosage && <div id="err-dosage" className="pd-help is-error">{errors.dosage}</div>}

          <div className="pd-row">
            <label className="pd-label" htmlFor="treatment_date">Treatment date</label>
            <input
              className={`pd-input${invalidClass("treatment_date")}`}
              type="date" id="treatment_date" name="treatment_date"
              value={treat.treatment_date} onChange={onTreatChange} onBlur={onBlur} required={isSpecialist}
              aria-invalid={!!(touched.treatment_date && errors.treatment_date)} aria-describedby="err-treatdate"
            />
          </div>
          {touched.treatment_date && errors.treatment_date && <div id="err-treatdate" className="pd-help is-error">{errors.treatment_date}</div>}
        </fieldset>

        <button className="pd-btn pd-btn--primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : isFarmer ? "Report Pest" : "Save Treatment"}
        </button>
      </form>
    </div>
  );
}
