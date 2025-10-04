import React, { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { API_BASE } from "../../../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import VisitBookingsChart from "./components/VisitBookingsChart";
import ContactMessagesCharts from "./components/ContactMessagesCharts";
import "../CustomerDashboard/CustomerDashboard.css";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "—");
const norm = (v) => String(v ?? "").toLowerCase();

const LIST_URL = (email) =>
  `${API_BASE}/public/visit-bookings${email ? `?email=${encodeURIComponent(email)}` : ""}`;
const ADMIN_URL = `${API_BASE}/api/visit-bookings`;

// NEW: contact-us admin endpoints
const CONTACT_LIST_URL = `${API_BASE}/contact-us`;

export default function VisitBookingsPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: contact-us state
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const [localStatus, setLocalStatus] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(LIST_URL(email));
      const list = data?.data || [];
      setRows(list);

      const seed = {};
      for (const r of list) {
        const s = r.status && String(r.status).toLowerCase();
        if (s === "approved" || s === "confirmed") seed[r._id] = "approved";
      }
      setLocalStatus(seed);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [email]);

  // NEW: load contact messages once (no filters)
  const loadContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const res = await axios.get(CONTACT_LIST_URL);
      const rows = res?.data?.data ?? res?.data ?? [];
      setContacts(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      alert("Failed to load contact messages");
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // NEW: fetch contacts on mount
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const filtered = useMemo(() => {
    const q = norm(query);
    if (!q) return rows;
    return rows.filter((r) => {
      const haystack = [
        r.fullName,
        r.email,
        r.phone,
        fmtDate(r.preferredDate),
        r.timeSlot,
        String(r.visitorsCount ?? ""),
        fmtDateTime(r.createdAt),
        (localStatus[r._id] || r.status || "new"),
      ]
        .filter(Boolean)
        .map(norm)
        .join(" ");
      return haystack.includes(q);
    });
  }, [rows, query, localStatus]);

  const patchBooking = async (id, payload) =>
    axios.patch(`${ADMIN_URL}/${id}`, payload);

  const deleteBooking = async (id) =>
    axios.delete(`${ADMIN_URL}/${id}`);

  const toUiStatus = (raw) => {
    const s = String(raw || "").toLowerCase();
    if (s === "pending") return "new";
    if (s === "confirmed") return "approved";
    return s || "new";
  };

  const getStatus = (r) =>
    localStatus[r._id] || toUiStatus(r.status || "new");

  const updateRow = async (r, nextStatus) => {
    const id = r?._id;
    if (!id) return;
    if (!["new", "approved"].includes(nextStatus)) {
      return alert("Invalid status");
    }
    setLocalStatus((p) => ({
      ...p,
      [id]: nextStatus === "approved" ? "approved" : undefined,
    }));
    try {
      await patchBooking(id, { status: nextStatus });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to update booking");
      setLocalStatus((p) => {
        const copy = { ...p };
        const prev = toUiStatus(r.status || "new");
        if (prev === "approved") copy[id] = "approved";
        else delete copy[id];
        return copy;
      });
    }
  };

  const removeRow = async (r) => {
    const id = r?._id;
    if (!id) return;
    if (!window.confirm("Delete this booking? This cannot be undone.")) return;
    try {
      await deleteBooking(id);
      setRows((prev) => prev.filter((x) => x._id !== id));
      setLocalStatus((p) => {
        const copy = { ...p };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete booking");
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

      const title = email
        ? `Visit Bookings (email: ${email})`
        : "Visit Bookings (all / recent)";
      const subtitle = query ? `Filtered by: "${query}"` : "";

      doc.setFontSize(14);
      doc.text(title, 40, 40);
      if (subtitle) {
        doc.setFontSize(10);
        doc.text(subtitle, 40, 58);
      }

      const body = (filtered || []).map((r) => [
        r.fullName || "—",
        r.email || "—",
        r.phone || "—",
        fmtDate(r.preferredDate),
        r.timeSlot || "—",
        String(r.visitorsCount ?? "—"),
        fmtDateTime(r.createdAt),
        getStatus(r).toUpperCase(),
      ]);

      autoTable(doc, {
        startY: subtitle ? 72 : 60,
        head: [[
          "Full Name",
          "Email",
          "Phone",
          "Preferred Date",
          "Time Slot",
          "Visitors",
          "Created",
          "Status",
        ]],
        body,
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [13, 123, 110], textColor: 255 },
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
          7: { cellWidth: 80 },
        },
      });

      const stamp = new Date().toISOString().slice(0, 10);
      const fname =
        `visit-bookings${email ? `_${email}` : ""}` +
        `${query ? `_q-${query.replace(/\s+/g, "-")}` : ""}` +
        `_${stamp}.pdf`;
      doc.save(fname);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF");
    }
  };

  return (
    <div className="vb-wrap">
      <div className="vb-head">
        <h2 className="vb-title">Customer Management Dashboard</h2>

        <div className="vb-filters">
          <input
            type="email"
            className="vb-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Filter by email (server-side)"
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <button className="vb-btn" onClick={load} disabled={loading}>
            Search
          </button>

          

          <button
            className="vb-btn ghost"
            onClick={() => {
              setEmail("");
              setQuery("");
              load();
            }}
            disabled={loading}
          >
            Clear
          </button>

          <button
            className="vb-btn outline"
            onClick={downloadPDF}
            disabled={loading || filtered.length === 0}
            title={filtered.length ? "Download PDF of visible rows" : "No rows to export"}
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* ---- Booking Visits Analytics (TITLE + charts) ---- */}
      <div className="vb-section-title">Booking Visits Analytics</div>

      {/* Existing Visit Bookings charts */}
      {!loading && (
        <VisitBookingsChart
          rows={filtered}
          titleSuffix={filtered.length !== rows.length ? "(filtered)" : ""}
        />
      )}

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
            <div>Status / Actions</div>
          </div>

          {filtered.length === 0 ? (
            <div className="vb-empty">No bookings found.</div>
          ) : (
            filtered.map((r) => {
              const status = getStatus(r);
              return (
                <div className="vb-row" key={r._id}>
                  <div>{r.fullName || "—"}</div>
                  <div>{r.email || "—"}</div>
                  <div>{r.phone || "—"}</div>
                  <div>{fmtDate(r.preferredDate)}</div>
                  <div>{r.timeSlot || "—"}</div>
                  <div>{r.visitorsCount ?? "—"}</div>
                  <div>{fmtDateTime(r.createdAt)}</div>

                  <div className="vb-actions">
                    <select
                      className="vb-status-select"
                      value={status === "approved" ? "approved" : "new"}
                      onChange={(e) => updateRow(r, e.target.value)}
                      disabled={loading}
                      title="Change status (display-only control)"
                    >
                      <option value="new">New</option>
                      <option value="approved">Approved</option>
                    </select>

                    <button
                      className="vb-btn danger"
                      onClick={() => removeRow(r)}
                      disabled={loading}
                      title="Delete booking"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ---- Contact Messages Analytics (COMPACT, BELOW THE TABLE) ---- */}
      <section className="vb-analytics">
        <div className="vb-section-title">Contact Messages Analytics</div>

        {loadingContacts ? (
          <div className="vb-loading sm">Loading contact analytics…</div>
        ) : contacts.length === 0 ? (
          <div className="vb-empty">No contact messages yet.</div>
        ) : (
          <div className="vb-analytics-grid one">
            <div className="vb-card vb-chart-box vb-chart-box--sm">
              <ContactMessagesCharts
                rows={contacts}
                titleSuffix=""
                // options={{ maintainAspectRatio: false }}
              />
            </div>
          </div>
        )}

        <div className="vb-actions-bar">
          <button
            className="vb-btn outline"
            onClick={() => navigate("/viewcontactus")}
            title="Go to Contact Messages table"
          >
            View Contact Messages Table
          </button>
        </div>
      </section>
    </div>
  );
}
