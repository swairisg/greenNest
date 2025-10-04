// frontend/src/Components/pestControl/PestDetectCard/PestDetectCard.jsx
import React from "react";
import { jsPDF } from "jspdf";
import "./PestDetectCard.css";

const theme = {
  green: [34, 197, 94],
  dark:  [11, 34, 20],
  muted: [71, 85, 105],
  border:[226, 232, 240],
  red:   [220, 38, 38],
  amber: [245, 158, 11],
  lime:  [101, 163, 13],
  white: [255, 255, 255],
};

const sevColor = (sev) => {
  const s = (sev || "").toLowerCase();
  if (s === "high") return theme.red;
  if (s === "moderate" || s === "medium") return theme.amber;
  if (s === "low") return theme.lime;
  return theme.muted;
};

const fmt = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "—");

// label+value row (two columns)
function drawRow(doc, x, y, contentW, label, value) {
  const labelW = 130;
  const gap = 12;
  const valueW = contentW - labelW - gap;
  const lineH = 14;
  const topPad = 6;

  const lines = doc.splitTextToSize(String(value ?? "—"), valueW);
  const rowH = Math.max(18, topPad + lines.length * lineH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...theme.muted);
  doc.text(label, x, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...theme.dark);
  doc.text(lines, x + labelW + gap, y + 12, { maxWidth: valueW, lineHeightFactor: 1.2 });

  doc.setDrawColor(...theme.border);
  doc.line(x, y + rowH, x + contentW, y + rowH);

  return y + rowH + 8;
}

function downloadPdfStyled(user) {
  const {
    _id, date_identified, crop, symptoms, severity_level,
    pesticide, application_method, dosage, treatment_date,
  } = user || {};

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const margin = 36;
  const cardX = margin;
  const cardY = margin;
  const cardW = pageW - margin * 2;
  const cardH = pageH - margin * 2;

  // card
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...theme.border);
  doc.roundedRect(cardX, cardY, cardW, cardH, 12, 12, "FD");

  // header
  const headerH = 64;
  doc.setFillColor(...theme.green);
  doc.roundedRect(cardX, cardY, cardW, headerH, 12, 12, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...theme.white);
  doc.text("Pest Detection Report", cardX + 18, cardY + 40);

  // severity badge
  const sevTxt = (severity_level || "—").toString().toUpperCase();
  const sevRGB = sevColor(severity_level);
  doc.setFontSize(12);
  const padX = 10;
  const txtW = doc.getTextWidth(sevTxt);
  const badgeW = txtW + padX * 2;
  const badgeH = 26;
  const badgeX = cardX + cardW - badgeW - 16;
  const badgeY = cardY + (headerH - badgeH) / 2;
  doc.setFillColor(...sevRGB);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 13, 13, "F");
  doc.setTextColor(255, 255, 255);
  doc.text(sevTxt, badgeX + padX, badgeY + 17);

  // content
  let x = cardX + 18;
  let y = cardY + headerH + 18;
  const contentW = cardW - 36;

  // page-break helper
  const ensure = (needed = 100) => {
    if (y + needed > cardY + cardH - 30) {
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...theme.border);
      doc.roundedRect(cardX, cardY, cardW, cardH, 12, 12, "FD");
      y = cardY + 20;
    }
  };

  const section = (title) => {
    ensure(60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...theme.dark);
    doc.text(title, x, y);
    y += 10;
    doc.setDrawColor(...theme.border);
    doc.line(x, y, x + contentW, y);
    y += 12;
  };

  section("Report Details");
  ensure(120);
  y = drawRow(doc, x, y, contentW, "Record ID", _id || "—");
  y = drawRow(doc, x, y, contentW, "Date Identified", fmt(date_identified));
  y = drawRow(doc, x, y, contentW, "Crop", crop || "—");
  y = drawRow(doc, x, y, contentW, "Symptoms", symptoms || "—");

  section("Treatment");
  const hasTx = pesticide || application_method || dosage || treatment_date;
  doc.setTextColor(...(hasTx ? theme.dark : theme.muted));
  y = drawRow(doc, x, y, contentW, "Pesticide", pesticide || "—");
  y = drawRow(doc, x, y, contentW, "Application Method", application_method || "—");
  y = drawRow(doc, x, y, contentW, "Dosage", dosage || "—");
  y = drawRow(doc, x, y, contentW, "Treatment Date", fmt(treatment_date));

  // footer
  ensure(30);
  const footerY = cardY + cardH - 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...theme.muted);
  doc.text(`Generated on ${new Date().toISOString().slice(0, 10)}`, x, footerY);

  doc.save(`pest-report-${_id || "record"}.pdf`);
}

export default function PestDetectCard({ user = {} }) {
  const {
    _id, date_identified, crop, symptoms, severity_level,
    pesticide, application_method, dosage, treatment_date,
  } = user;

  const sev = (severity_level || "").toLowerCase();
  const sevClass =
    sev === "high" ? "is-high" :
    sev === "moderate" ? "is-medium" :
    sev === "low" ? "is-low" : "";

  const formatDate = (d) => (d ? new Date(d).toISOString().split("T")[0] : "—");

  return (
    <article className="pd-card">
      <header className="pd-card__header">
        <h3 className="pd-card__title">Pest Detection Record</h3>
        <span className={`pd-badge ${sevClass}`}>{severity_level || "—"}</span>
        <button
          className="pd-btn pd-btn--pdf pd-card__spacer"
          onClick={() => downloadPdfStyled(user)}
        >
          Download PDF
        </button>
      </header>

      <div className="pd-grid">
        <div className="pd-row"><div className="pd-label">ID</div><div className="pd-value mono">{_id || "—"}</div></div>
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
