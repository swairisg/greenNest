import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { API_BASE } from "../../../api";         
import jsPDF from "jspdf";                       
import autoTable from "jspdf-autotable";         
import "./ViewVisit.css";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "—");

export default function VisitBookingsPage() {
  const [email, setEmail] = useState("");   
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const qs = email ? `?email=${encodeURIComponent(email)}` : "";
      const res = await axios.get(`${API_BASE}/public/visit-bookings${qs}`);
      setRows(res.data?.data || []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  
  const downloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

      const title = email
        ? `Visit Bookings (email: ${email})`
        : "Visit Bookings (all / recent)";
      doc.setFontSize(14);
      doc.text(title, 40, 40);

      const body = (rows || []).map((r) => [
        r.fullName || "—",
        r.email || "—",
        r.phone || "—",
        fmtDate(r.preferredDate),
        r.timeSlot || "—",
        String(r.visitorsCount ?? "—"),
        fmtDateTime(r.createdAt),
      ]);

      autoTable(doc, {
        startY: 60,
        head: [
          [
            "Full Name",
            "Email",
            "Phone",
            "Preferred Date",
            "Time Slot",
            "Visitors",
            "Created",
          ],
        ],
        body,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [13, 123, 110], textColor: 255 }, // GreenNest vibe
        alternateRowStyles: { fillColor: [245, 250, 249] },
        bodyStyles: { cellWidth: "wrap" },
        columnStyles: {
          0: { cellWidth: 120 },  
          1: { cellWidth: 160 },  
          2: { cellWidth: 100 },  
          3: { cellWidth: 100 },  
          4: { cellWidth: 100 },  
          5: { cellWidth: 70 },   
          6: { cellWidth: 140 },  
        },
      });

      const stamp = new Date().toISOString().slice(0, 10); 
      const fname = email
        ? `visit-bookings_${email}_${stamp}.pdf`
        : `visit-bookings_${stamp}.pdf`;
      doc.save(fname);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF");
    }
  };
  
  return (
    <div className="vb-wrap">
      <div className="vb-head">
        <h2 className="vb-title">Visit Bookings</h2>
        <div className="vb-filters">
          <input
            type="email"
            className="vb-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Filter by email (optional)"
          />
          <button className="vb-btn" onClick={load}>Search</button>
          <button
            className="vb-btn ghost"
            onClick={() => { setEmail("");  }}
          >
            Clear
          </button>
          <button
            className="vb-btn outline"
            onClick={downloadPDF}        // 🆕
            disabled={loading || rows.length === 0}
            title={rows.length ? "Download PDF of current list" : "No rows to export"}
          >
            Download PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="vb-loading">Loading…</div>
      ) : (
        <div className="vb-table">
          <div className="vb-thead">
            <div>Full Name</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Preferred Date</div>
            <div>Time Slot</div>
            <div>Visitors</div>
            <div>Created</div>
          </div>

          {rows.length === 0 ? (
            <div className="vb-empty">No bookings found.</div>
          ) : (
            rows.map((r) => (
              <div className="vb-row" key={r._id}>
                <div>{r.fullName}</div>
                <div>{r.email}</div>
                <div>{r.phone}</div>
                <div>{fmtDate(r.preferredDate)}</div>
                <div>{r.timeSlot}</div>
                <div>{r.visitorsCount}</div>
                <div>{fmtDateTime(r.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
