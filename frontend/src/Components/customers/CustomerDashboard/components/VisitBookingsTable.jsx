// VisitBookingsTable.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_BASE } from "../../../../api";
import "./VisitBookingTable.css";

axios.defaults.withCredentials = true; // send cookies for auth-protected admin endpoints

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString() : "—");
const norm = (v) => String(v ?? "").toLowerCase();

// Endpoints
const LIST_URL = `${API_BASE}/public/visit-bookings`;
const ADMIN_URL = `${API_BASE}/api/visit-bookings`;

// UI <-> backend status mapping
const toUiStatus = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (s === "pending") return "new";
  if (s === "confirmed") return "approved";
  return s || "new";
};

export default function VisitBookingsTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  // busyById: { [id]: "status" | "delete" | null }
  const [busyById, setBusyById] = useState({});
  // confirm click map: first click turns NEW -> APPROVE
  const [confirmById, setConfirmById] = useState({}); // { [id]: true }

  const setBusy = (id, val) =>
    setBusyById((m) => ({ ...m, [id]: val }));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(LIST_URL, { withCredentials: true });
      const list = data?.data || data || [];
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load visit bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = norm(query);
    return (rows || [])
      .map((r) => ({ ...r, _uiStatus: toUiStatus(r.status) }))
      .filter((r) => (status === "all" ? true : r._uiStatus === status))
      .filter((r) => {
        if (!q) return true;
        const haystack = [
          r.fullName,
          r.email,
          r.phone,
          fmtDate(r.preferredDate),
          r.timeSlot,
          String(r.visitorsCount ?? ""),
          fmtDateTime(r.createdAt),
          r._uiStatus,
        ]
          .filter(Boolean)
          .map(norm)
          .join(" ");
        return haystack.includes(q);
      });
  }, [rows, query, status]);

  // === Actions ===
  const approveOnServer = async (id) => {
    try {
      setBusy(id, "status");
      await axios.patch(
        `${ADMIN_URL}/${id}`,
        { status: "confirmed" }, // backend 'approved'
        { withCredentials: true }
      );
      // update local list + clear confirm state
      setRows((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: "confirmed" } : r))
      );
      setConfirmById((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to approve booking");
    } finally {
      setBusy(id, null);
    }
  };

  const handleStatusClick = (row) => {
    const id = row._id;
    const uiStat = toUiStatus(row.status);
    const isApproved = uiStat === "approved";
    if (isApproved) return; // nothing to do

    // if already in confirm step, second click approves on server
    if (confirmById[id]) {
      approveOnServer(id);
      return;
    }

    // first click -> turn "NEW" into "APPROVE"
    setConfirmById((m) => ({ ...m, [id]: true }));
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this booking? This cannot be undone.");
    if (!ok) return;
    try {
      setBusy(id, "delete");
      await axios.delete(`${ADMIN_URL}/${id}`, { withCredentials: true });
      // remove locally + any confirm state
      setRows((prev) => prev.filter((r) => r._id !== id));
      setConfirmById((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to delete booking");
    } finally {
      setBusy(id, null);
    }
  };

  const downloadPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

      doc.setFontSize(18);
      doc.text("Booked Visits", 40, 40);
      doc.setFontSize(11);
      doc.text(
        "Manage all visit bookings in one place. Track, filter and export.",
        40,
        58
      );

      const sub = [];
      if (status !== "all") sub.push(`Status: ${status}`);
      if (query) sub.push(`Search: "${query}"`);
      if (sub.length) doc.text(sub.join("  •  "), 40, 74);

      const body = (filtered || []).map((r) => [
        r.fullName || "—",
        r.email || "—",
        r.phone || "—",
        fmtDate(r.preferredDate),
        r.timeSlot || "—",
        String(r.visitorsCount ?? "—"),
        fmtDateTime(r.createdAt),
        toUiStatus(r.status).toUpperCase(),
      ]);

      autoTable(doc, {
        startY: sub.length ? 88 : 72,
        head: [
          [
            "Full Name",
            "Email",
            "Phone",
            "Preferred Date",
            "Time Slot",
            "Visitors",
            "Created",
            "Status",
          ],
        ],
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
      const fname = `booked-visits${
        status !== "all" ? `_st-${status}` : ""
      }${query ? `_q-${query.replace(/\s+/g, "-")}` : ""}_${stamp}.pdf`;
      doc.save(fname);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF");
    }
  };

  return (
    <div className="visit-wrap">
      <div className="visit-hero">
        <h1 className="visit-hero-title">Booked Visits</h1>
        <p className="visit-hero-sub">
          Manage all visit bookings in one place. Control approvals, filter by
          status, and export reports for your records.
        </p>
      </div>

      <div className="visit-toolbar">
        <div className="visit-chip">
          <span className="visit-chip-label">Total bookings</span>
          <span className="visit-chip-count">{rows.length}</span>
        </div>

        <div className="visit-toolbar-controls">
          <div className="visit-input-wrap">
            <input
              className="visit-input"
              placeholder="Search name, email, phone, date, status…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

        <select
            className="visit-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            title="Filter by status"
          >
            <option value="all">all</option>
            <option value="new">new</option>
            <option value="approved">approved</option>
          </select>

          <button className="visit-btn ghost" onClick={load} disabled={loading}>
            Refresh
          </button>

          <button
            className="visit-btn outline"
            onClick={downloadPDF}
            disabled={loading || filtered.length === 0}
            title={
              filtered.length
                ? "Download PDF of visible rows"
                : "No rows to export"
            }
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="visit-loading">Loading…</div>
      ) : (
        <div className="visit-table">
          <div className="visit-thead">
            <div>Full Name</div>
            <div>Email</div>
            <div>Phone</div>
            <div>Preferred Date</div>
            <div>Time Slot</div>
            <div>Visitors</div>
            <div>Created</div>
            <div>Status</div>
            <div>Delete</div>
          </div>

          {filtered.length === 0 ? (
            <div className="visit-empty">No bookings found.</div>
          ) : (
            filtered.map((r) => {
              const uiStat = toUiStatus(r.status);
              const busy = busyById[r._id];
              const isApproved = uiStat === "approved";
              const isConfirm = !!confirmById[r._id];

              // Compute label/appearance
              let label = "NEW";
              let statusClass = "is-new";
              if (isApproved) {
                label = "APPROVED";
                statusClass = "is-approved";
              } else if (isConfirm) {
                label = "APPROVED";
                statusClass = "is-confirm";
              }

              return (
                <div className="visit-row" key={r._id}>
                  <div>{r.fullName || "—"}</div>
                  <div>{r.email || "—"}</div>
                  <div>{r.phone || "—"}</div>
                  <div>{fmtDate(r.preferredDate)}</div>
                  <div>{r.timeSlot || "—"}</div>
                  <div>{r.visitorsCount ?? "—"}</div>
                  <div>{fmtDateTime(r.createdAt)}</div>

                  {/* Status button cell: NEW -> APPROVE  -> APPROVED */}
                  <div>
                    <button
                      className={`visit-status-btn ${statusClass}`}
                      disabled={!!busy || isApproved}
                      onClick={() => handleStatusClick(r)}
                      title={
                        isApproved
                          ? "Already approved"
                          : isConfirm
                          ? "Click to confirm approval"
                          : "Click to approve"
                      }
                    >
                      {busy === "status" ? "Saving…" : label}
                    </button>
                  </div>

                  {/* Delete button cell */}
                  <div>
                    <button
                      className="visit-btn danger"
                      disabled={!!busy}
                      onClick={() => handleDelete(r._id)}
                      title="Delete booking"
                    >
                      {busy === "delete" ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
