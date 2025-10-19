import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { API_BASE } from "../../../api";
import "./CustomersManage.css";

const MySwal = withReactContent(Swal);

const STATUS = ["all", "pending", "active", "suspended", "invited", "pendingApproval"];
const URL = `${API_BASE}/api/customers`;

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? "—"
    : dt.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
};

export default function CustomersManage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [nameFilter, setNameFilter] = useState("");
  const [addressFilter, setAddressFilter] = useState("");

  // debounce search
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    setErr("");

    const params = {};
    if (debouncedQ) params.q = debouncedQ;
    if (status !== "all") params.status = status;

    axios
      .get(URL, { params, withCredentials: true })
      .then((res) => setList(res.data?.data || []))
      .catch((e) => {
        console.error("GET /api/customers failed:", e?.response || e);
        setErr(e?.response?.data?.message || "Failed to load customers");
      })
      .finally(() => setLoading(false));
  }, [debouncedQ, status]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredRows = useMemo(() => {
    const nf = nameFilter.trim().toLowerCase();
    const af = addressFilter.trim().toLowerCase();
    return (list || []).filter((u) => {
      const nameOK = nf ? String(u.name || "").toLowerCase().includes(nf) : true;
      const addrOK = af ? String(u.address || "").toLowerCase().includes(af) : true;
      return nameOK && addrOK;
    });
  }, [list, nameFilter, addressFilter]);

  const onDelete = async (row) => {
    if (!row?._id) return;

    const result = await MySwal.fire({
      title: "Delete customer?",
      html: `<div style="text-align:left">
               <b>${row.name || row.email}</b><br/>
               This action cannot be undone.
             </div>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;

    MySwal.fire({ title: "Deleting…", allowOutsideClick: false, didOpen: () => MySwal.showLoading() });

    try {
      await axios.delete(`${URL}/${row._id}`, { withCredentials: true });
      setList((prev) => prev.filter((x) => x._id !== row._id));
      MySwal.fire({
        icon: "success",
        title: "Deleted",
        text: `${row.name || row.email} removed`,
        timer: 1400,
        showConfirmButton: false,
      });
    } catch (e) {
      MySwal.fire({ icon: "error", title: "Delete failed", text: e?.response?.data?.message || "Server error" });
    }
  };

  // PDF export of currently filtered rows
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Customers", 14, 14);

    const rows = filteredRows.map((u) => [
      u._id,
      u.name || "—",
      u.email,
      u.phone || "—",
      u.address || "—",
      u.status || "—",
      u.primaryRole || (u.roles?.[0] ?? "—"),
      u.source || "—",
      fmtDate(u.createdAt),
      u.isEmailVerified ? "Yes" : "No",
    ]);

    autoTable(doc, {
      head: [["ID", "Name", "Email", "Phone", "Address", "Status", "Role", "Source", "Joined", "Verified"]],
      body: rows,
      startY: 20,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [34, 197, 94] },
    });

    doc.save("customers.pdf");
  };

  const total = filteredRows.length;

  return (
    <div className="customr-page customr-green">
      <div className="customr-header">
        <h1 className="customr-title">User Management</h1>
        <p className="customr-subtitle">
          Manage all users in one place. Control access, assign roles, and monitor activity across your platform.
        </p>
      </div>

      <div className="customr-toolbar">
        <div className="customr-totalchip customr-chip-primary">
          <span className="customr-totalchip-label">Total users</span>
          <span className="customr-totalchip-count">{total}</span>
        </div>

        <div className="customr-searchwrap">
          <span className="customr-searchicon">🔍</span>
          <input
            className="customr-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search (name, email, phone, status…) — server search"
          />
        </div>

        <input
          className="customr-input"
          placeholder="Filter by name"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
        />

        <input
          className="customr-input"
          placeholder="Filter by address"
          value={addressFilter}
          onChange={(e) => setAddressFilter(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)} className="customr-select" title="Status">
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button onClick={fetchCustomers} className="customr-btn customr-btn-outline">
          Refresh
        </button>
        <button onClick={downloadPDF} className="customr-btn customr-btn-primary">
          Download PDF
        </button>
      </div>

      <div className="customr-tablewrap customr-card">
        <table className="customr-table">
          <thead className="customr-thead">
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Role</th>
              <th>Source</th>
              <th>Joined</th>
              <th>Verified</th>
              <th className="customr-th-actions">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="customr-empty">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && err && (
              <tr>
                <td colSpan={9} className="customr-error">
                  {err}
                </td>
              </tr>
            )}
            {!loading && !err && filteredRows.length === 0 && (
              <tr>
                <td colSpan={9} className="customr-empty">
                  No users
                </td>
              </tr>
            )}

            {!loading &&
              !err &&
              filteredRows.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div className="customr-cell-title">{r.name || "—"}</div>
                    <div className="customr-cell-sub">#{r._id.slice(-6)}</div>
                  </td>
                  <td>{r.email}</td>
                  <td>{r.phone || "—"}</td>
                  <td>
                    <span className={`customr-badge customr-badge--${(r.status || "default").toLowerCase()}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>
                    <span className="customr-tag">{r.primaryRole || (r.roles?.[0] ?? "—")}</span>
                  </td>
                  <td>
                    <span className="customr-tag customr-tag--muted">{r.source || "—"}</span>
                  </td>
                  <td>{fmtDate(r.createdAt)}</td>
                  <td>
                    {r.isEmailVerified ? (
                      <span className="customr-verify customr-verify--yes">✔ Verified</span>
                    ) : (
                      <span className="customr-verify customr-verify--no">✖ Not verified</span>
                    )}
                  </td>
                  <td className="customr-td-actions">
                    <button onClick={() => onDelete(r)} className="customr-btn customr-btn-danger">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="customr-rowsmeta">
        Showing <b>{filteredRows.length}</b> users
      </div>
    </div>
  );
}
