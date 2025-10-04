// frontend/src/Components/tasksHR/Employees.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useHRChrome } from "./HRLayout";
import "./Employees.css";
import EditEmployeeDrawer from "./EditEmployeeDrawer";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const STATUSES = ["all", "active", "inactive", "terminated"];

// Dept/designation filter lists
const DEPARTMENTS = [
  "Administration",
  "People Ops",
  "Operations",
  "Finance",
  "Product",
  "Greenhouse",
];
const DESIGNATIONS_BY_DEPT = {
  Administration: ["Admin", "Office Assistant", "Coordinator"],
  "People Ops": ["HR Manager", "HR Executive", "Recruiter"],
  Operations: ["Inventory Manager", "Logistics Coordinator", "Shift Supervisor"],
  Finance: ["Finance Manager", "Accountant", "Analyst"],
  Product: ["Product Manager", "QA Engineer", "UX Designer"],
  Greenhouse: ["Farmer", "Agronomist", "Specialist", "Technician"],
};

export default function HREmployees() {
  const { setRight, clearRight } = useHRChrome();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");
  const [designation, setDesignation] = useState("all");

  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [err, setErr] = useState("");

  // Edit drawer state
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  const [deletingId, setDeletingId] = useState(null);
  const lastDeletedRef = useRef(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  const designationOptions = useMemo(() => {
    if (department === "all") return [];
    return DESIGNATIONS_BY_DEPT[department] || [];
  }, [department]);

  // header right actions
  useEffect(() => {
    setRight(
      <Link to="/hr/employees/new" className="hrlist-btn-primary">
        + Add Employee
      </Link>
    );
    return clearRight;
  }, [setRight, clearRight]);

const buildParams = (overrides = {}) => {
    const params = {
      page,
      pageSize,
      ...overrides,
    };
    if (search.trim()) params.search = search.trim();
    if (status !== "all") params.status = status;
    if (department !== "all") params.department = department;
    if (designation !== "all") params.designation = designation;
    return params;
  };

  const fetchList = async () => {
    setLoading(true);
    setErr("");
    try {
      const params = { page, pageSize };
      if (search.trim()) params.search = search.trim();
      if (status !== "all") params.status = status;
      if (department !== "all") params.department = department;
      if (designation !== "all") params.designation = designation;

      const res = await api.get("/hr/employees", { params });
      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  // initial + when page or filters change
  useEffect(() => {
    fetchList();
  }, [page, status, department, designation]);

  // search with small debounce (300ms)
  const debounceRef = useRef();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchList();
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

//deleting
const handleDelete = async (row) => {
  const result = await MySwal.fire({
    icon: "warning",
    title: "Delete employee?",
    text:
      "This will deactivate and hide the employee from the list. " +
      "You can undo this immediately.",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#e11d48",
    reverseButtons: true,
  });

  if (!result.isConfirmed) return;

  try {
    setDeletingId(row._id);
    await api.delete(`/hr/employees/${row._id}`);

    // Save deleted row so we can restore if needed
    lastDeletedRef.current = { row, pageSnapshot: page };

    // Optimistic UI: remove it now
    setRows((prev) => prev.filter((r) => r._id !== row._id));
    setTotal((t) => Math.max(0, t - 1));

    // If page becomes empty, step back one (next render ok)
    setTimeout(() => {
      if (rows.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
    }, 0);

    // Show Undo
    const undo = await MySwal.fire({
      icon: "success",
      title: "Employee deleted",
      html:
        `<div style="margin-top:6px;color:#374151">` +
        `They’ve been marked inactive and hidden from the list.</div>`,
      showCancelButton: true,
      confirmButtonText: "Undo",
      cancelButtonText: "OK",
      reverseButtons: true,
      timer: 8000,
      timerProgressBar: true,
    });

    // If "Undo" clicked (and we still have the row)
    if (undo.isConfirmed && lastDeletedRef.current?.row?._id === row._id) {
      try {
        const res = await api.post(`/hr/employees/${row._id}/restore`);
        const restored = res.data?.data || lastDeletedRef.current.row;

        // Put it back in the list (prepend for visibility)
        setRows((prev) => [restored, ...prev]);
        setTotal((t) => t + 1);

        // Optionally jump back to original page if it changed:
        if (lastDeletedRef.current.pageSnapshot && lastDeletedRef.current.pageSnapshot !== page) {
          setPage(lastDeletedRef.current.pageSnapshot);
        }

        await MySwal.fire({
          icon: "success",
          title: "Restored",
          text: "The employee has been restored.",
          confirmButtonText: "OK",
        });
      } catch (e) {
        console.error(e);
        const msg = e?.response?.data?.message || e.message || "Restore failed";
        MySwal.fire({ icon: "error", title: "Restore failed", text: msg });
      } finally {
        lastDeletedRef.current = null;
      }
    } else {
      // Not undone (timeout or OK)
      lastDeletedRef.current = null;
    }
  } catch (e) {
    console.error(e);
    const msg = e?.response?.data?.message || e.message || "Delete failed";
    MySwal.fire({ icon: "error", title: "Delete failed", text: msg });
  } finally {
    setDeletingId(null);
  }
};


//exporting reports
const csvEscape = (v) => {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      // Pull ALL rows that match current filters/search in batches
      const pageSizeExport = 500;
      let curPage = 1;
      let all = [];
      let totalFound = 0;

      // first call
      // reuse the same endpoint with filters
      while (true) {
        const res = await api.get("/hr/employees", {
          params: buildParams({ page: curPage, pageSize: pageSizeExport }),
        });
        const chunk = res.data?.data || [];
        totalFound = res.data?.total || 0;
        all = all.concat(chunk);

        const totalPagesExport = Math.max(
          1,
          Math.ceil(totalFound / pageSizeExport)
        );
        if (curPage >= totalPagesExport) break;
        curPage++;
      }

      // Build CSV rows
      const headers = [
        "Full Name",
        "Email",
        "Phone",
        "Department",
        "Designation",
        "Status",
        "Join Date",
        "Salary (LKR)",
      ];

      const rowsCsv = all.map((r) => {
        const join = r.joinDate || r.createdAt;
        const joinStr = join ? new Date(join).toISOString().slice(0, 10) : "";
        return [
          csvEscape(r.fullName || ""),
          csvEscape(r.email || ""),
          csvEscape(r.phone || ""),
          csvEscape(r.department || ""),
          csvEscape(r.designation || ""),
          csvEscape(r.currentStatus || ""),
          csvEscape(joinStr),
          csvEscape(r.salary != null ? r.salary : ""),
        ].join(",");
      });

      const csv = [headers.join(","), ...rowsCsv].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `employees_${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Tiny toast
      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `Report generated (${all.length} rows)`,
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
      });
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e.message || "Export failed";
      MySwal.fire({ icon: "error", title: "Export failed", text: msg });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="hrlist-wrap">
      <div className="hrlist-card">
        <div className="hrlist-head">
          <h2>Employees</h2>
        </div>

        {/* Filters */}
        <div className="hrlist-filters">
          <input
            className="hrlist-input"
            placeholder="Search by name, department, designation…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="hrlist-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            title="Status"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          {/* Department filter */}
          <select
            className="hrlist-select"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setDesignation("all");
              setPage(1);
            }}
            title="Department"
          >
            <option value="all">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Designation filter (depends on Department) */}
          <select
            className="hrlist-select"
            value={designation}
            onChange={(e) => {
              setDesignation(e.target.value);
              setPage(1);
            }}
            disabled={department === "all"}
            title="Designation"
          >
            <option value="all">All designations</option>
            {designationOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <button
            className="btn-teal"
            disabled={loading}
            onClick={() => {
              setPage(1);
              fetchList();
            }}
          >
            {loading ? "Searching…" : "Search"}
          </button>

          {/* Export button */}
          <button
            className="hrlist-btn ghost"
            disabled={exporting || loading}
            onClick={handleExport}
            title="Download CSV of the filtered results"
            style={{ marginLeft: 6 }}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>

        {err && <div className="hrlist-error">{err}</div>}

        {/* Table */}
        <div className="hrlist-tablewrap">
          <table className="hrlist-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Join Date</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="hrlist-empty">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="hrlist-empty">
                    No employees found
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id}>
                    <td className="hrlist-name">{r.fullName}</td>
                    <td>{r.department || "-"}</td>
                    <td>{r.designation || "-"}</td>
                    <td>
                      <span className={`badge ${r.currentStatus || "active"}`}>
                        {r.currentStatus || "active"}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const d = r.joinDate || r.createdAt;
                        return d ? new Date(d).toLocaleDateString() : "-";
                      })()}
                    </td>
                    <td>
                      <div className="hrlist-actions">
                        <button
                          className="hrlist-btn edit small"
                          title="View / Edit"
                          onClick={() => {
                            setEditingRow(r);
                            setEditOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="hrlist-btn danger small"
                          title="Delete"
                         onClick={() => handleDelete(r)}
                          disabled={deletingId === r._id}
                        >
                          {deletingId === r._id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="hrlist-pager">
          <div className="hrlist-pager-info">
            Page {page} of {totalPages} • {total} total
          </div>
          <div className="hrlist-pager-btns">
            <button
              className="hrlist-btn ghost small"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Prev
            </button>
            <button
              className="hrlist-btn ghost small"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Edit drawer */}
      <EditEmployeeDrawer
        open={editOpen}
        row={editingRow}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setRows((prev) =>
            prev.map((x) => (x._id === updated._id ? { ...x, ...updated } : x))
          );
        }}
      />
    </div>
  );
}
