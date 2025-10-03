import React from "react";
import { jsPDF } from "jspdf";
import "./PestDetectCard.css";

export default function PestDetectCard({ user = {} }) {
  const {
    _id, date_identified, crop, symptoms, severity_level,
    pesticide, application_method, dosage, treatment_date,
  } = user;

  const formatDate = (d) => (d ? new Date(d).toISOString().split("T")[0] : "—");
  const sev = (severity_level || "").toLowerCase();
  const sevClass = sev === "high" ? "is-high" : sev === "moderate" ? "is-medium" : sev === "low" ? "is-low" : "";

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Pest Detection Report", 14, 20);
    doc.setFontSize(12);
    [
      `ID: ${_id || "—"}`,
      `Date Identified: ${formatDate(date_identified)}`,
      `Crop: ${crop || "—"}`,
      `Symptoms: ${symptoms || "—"}`,
      `Severity: ${severity_level || "—"}`,
      `Pesticide: ${pesticide || "—"}`,
      `Application Method: ${application_method || "—"}`,
      `Dosage: ${dosage || "—"}`,
      `Treatment Date: ${formatDate(treatment_date)}`,
    ].reduce((y, line) => (doc.text(line, 14, y), y + 8), 32);
    doc.save(`pest-report-${_id || "unknown"}.pdf`);
  };

  return (
    <article className="pd-card">
      <header className="pd-card__header">
        <h3 className="pd-card__title">Pest Detection Record</h3>
        <span className={`pd-badge ${sevClass}`}>{severity_level || "—"}</span>
        <button className="pd-btn" style={{ marginLeft: "auto" }} onClick={downloadPdf}>Download PDF</button>
      </header>

      <div className="pd-grid">
        <div className="pd-row"><div className="pd-label">ID</div><div className="pd-value">{_id || "—"}</div></div>
        <div className="pd-row"><div className="pd-label">Date Identified</div><div className="pd-value">{formatDate(date_identified)}</div></div>
        <div className="pd-row"><div className="pd-label">Crop</div><div className="pd-value">{crop || "—"}</div></div>
        <div className="pd-row"><div className="pd-label">Symptoms</div><div className="pd-value">{symptoms || "—"}</div></div>
        <div className="pd-row"><div className="pd-label">Pesticide</div><div className="pd-value">{pesticide || "—"}</div></div>
        <div className="pd-row"><div className="pd-label">Application Method</div><div className="pd-value">{application_method || "—"}</div></div>
        <div className="pd-row"><div className="pd-label">Dosage</div><div className="pd-value">{dosage || "—"}</div></div>
        <div className="pd-row"><div className="pd-label">Treatment Date</div><div className="pd-value">{formatDate(treatment_date)}</div></div>
      </div>
    </article>
  );
}
