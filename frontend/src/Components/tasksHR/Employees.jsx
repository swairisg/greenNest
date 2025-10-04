// frontend/src/Components/tasksHR/Employees.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useHRChrome } from "./HRLayout";
import "./Employees.css";
import EditEmployeeDrawer from "./EditEmployeeDrawer";

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
  const [err, setErr] = useState("");

  // Edit drawer state
  const [editOpen, setEditOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

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
                          disabled
                          onClick={() => {}}
                        >
                          Delete
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
