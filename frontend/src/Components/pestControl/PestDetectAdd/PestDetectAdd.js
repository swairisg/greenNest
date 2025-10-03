import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import "./PestDetectAdd.css";
import { API_BASE } from "../../../api";

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

  useEffect(() => {
    if (!isSpecialist || !id) return;
    (async () => {
      try {
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
        setLoading(false);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
        setLoading(false);
      }
    })();
  }, [id, isSpecialist]);

  const onFarmerChange = (e) => setFarmer(p => ({ ...p, [e.target.name]: e.target.value }));
  const onTreatChange = (e) => setTreat(p => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
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
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pd-loading">Loading…</div>;
  if (error) return <div className="pd-error">Error: {error}</div>;

  const farmerEditable = isFarmer && !id;
  const specialistEditable = isSpecialist;

  return (
    <div className="pd-container">
      <h2 className="pd-title">Pest Detection</h2>

      <form className="pd-form" onSubmit={onSubmit}>
        <fieldset className="pd-fieldset" disabled={!farmerEditable}>
          <legend className="pd-legend">Farmer Report</legend>

          <div className="pd-row">
            <label className="pd-label" htmlFor="crop">Crop name</label>
            <input className="pd-input" id="crop" name="crop" value={farmer.crop} onChange={onFarmerChange} required />
          </div>

          <div className="pd-row">
            <label className="pd-label" htmlFor="date_identified">Date reported</label>
            <input className="pd-input" type="date" id="date_identified" name="date_identified"
                   value={farmer.date_identified} onChange={onFarmerChange} required />
          </div>

          <div className="pd-row">
            <label className="pd-label" htmlFor="symptoms">Symptoms description</label>
            <textarea className="pd-textarea" id="symptoms" name="symptoms" rows={3}
                      value={farmer.symptoms} onChange={onFarmerChange} required />
          </div>

          <div className="pd-row">
            <label className="pd-label" htmlFor="severity_level">Severity level</label>
            <select className="pd-select" id="severity_level" name="severity_level"
                    value={farmer.severity_level} onChange={onFarmerChange} required>
              <option value="">--Select--</option>
              <option value="Low">Low</option>
              <option value="Moderate">Moderate</option>
              <option value="High">High</option>
            </select>
          </div>
        </fieldset>

        <fieldset className="pd-fieldset" disabled={!specialistEditable}>
          <legend className="pd-legend">Specialist Treatment</legend>

          <div className="pd-row">
            <label className="pd-label" htmlFor="pesticide">Pesticide name</label>
            <input className="pd-input" id="pesticide" name="pesticide"
                   value={treat.pesticide} onChange={onTreatChange} required={isSpecialist} />
          </div>

          <div className="pd-row">
            <label className="pd-label" htmlFor="application_method">Method of application</label>
            <input className="pd-input" id="application_method" name="application_method"
                   value={treat.application_method} onChange={onTreatChange} required={isSpecialist} />
          </div>

          <div className="pd-row">
            <label className="pd-label" htmlFor="dosage">Dosage</label>
            <input className="pd-input" id="dosage" name="dosage"
                   value={treat.dosage} onChange={onTreatChange} required={isSpecialist} />
          </div>

          <div className="pd-row">
            <label className="pd-label" htmlFor="treatment_date">Treatment date</label>
            <input className="pd-input" type="date" id="treatment_date" name="treatment_date"
                   value={treat.treatment_date} onChange={onTreatChange} required={isSpecialist} />
          </div>
        </fieldset>

        <button className="pd-btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : isFarmer ? "Report Pest" : "Save Treatment"}
        </button>
      </form>
    </div>
  );
}
