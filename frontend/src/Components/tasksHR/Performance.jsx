// frontend/src/Components/tasksHR/Performance.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useHRChrome } from "./HRLayout";
import "./Employees.css"; // table/buttons
import "./Tasks.css";     // badges, filters
import "./Performance.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { jsPDF } from "jspdf";

const MySwal = withReactContent(Swal);

const DEPARTMENTS = [
  "Administration",
  "People Ops",
  "Operations",
  "Finance",
  "Product",
  "Greenhouse",
];

const STATUS = ["all", "open", "in_review", "finalized"];

export default function HRPerformance() {
  const { setRight, clearRight } = useHRChrome();

  // table state
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // filters
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [employee, setEmployee] = useState("all");
  const [employees, setEmployees] = useState([]); // used for the page filter dropdown
  const [status, setStatus] = useState("all");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");

  // ui
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  // header actions
  useEffect(() => {
    setRight(
      <div style={{ display: "flex", gap: 8 }}>
        <Link to="/hr" className="hrlist-btn ghost">← Back</Link>
        <button className="hrlist-btn" onClick={() => createReview()}>
          + New Review
        </button>
      </div>
    );
    return clearRight;
  }, [setRight, clearRight]);

  /* ---------------- helpers ---------------- */
  const buildParams = (overrides = {}) => {
    const p = { page, pageSize, ...overrides };
    if (search.trim()) p.search = search.trim();
    if (department !== "all") p.department = department;
    if (employee !== "all") p.employeeId = employee;
    if (status !== "all") p.status = status;
    if (periodFrom) p.periodFrom = periodFrom;
    if (periodTo) p.periodTo = periodTo;
    return p;
  };

  const toast = (title) =>
    MySwal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title,
      showConfirmButton: false,
      timer: 1800,
    });

  const errorBox = (e, title = "Error") =>
    MySwal.fire({
      icon: "error",
      title,
      text: e?.response?.data?.message || e.message || "Something failed",
    });

  /* ---------------- data ---------------- */
  const fetchList = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/hr/performance", { params: buildParams() });
      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  // Page filter dropdown list (now includes ALL employees, not just active)
  const fetchEmployees = async (dept = "all") => {
    try {
      const params = { page: 1, pageSize: 1000 }; // no status filter -> include all
      if (dept !== "all") params.department = dept;
      const res = await api.get("/hr/employees", { params });
      setEmployees(res.data?.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper used ONLY by the modal – fetch a fresh list, don't rely on state
  const fetchEmployeesNow = async (dept = "all") => {
    const params = { page: 1, pageSize: 1000 }; // all employees
    if (dept !== "all") params.department = dept;
    const res = await api.get("/hr/employees", { params });
    return res.data?.data || [];
  };

  // initial
  useEffect(() => {
    fetchEmployees("all");
  }, []);
  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, employee, periodFrom, periodTo]);

  // department change
  useEffect(() => {
    fetchEmployees(department);
    setEmployee("all");
    setPage(1);
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department]);

  // search debounce
  const sref = useRef();
  useEffect(() => {
    clearTimeout(sref.current);
    sref.current = setTimeout(() => {
      setPage(1);
      fetchList();
    }, 300);
    return () => clearTimeout(sref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  /* ---------------- create ---------------- */
  const createReview = async () => {
    // get a fresh list just for the modal to avoid async state timing
    let list = [];
    try {
      list = await fetchEmployeesNow(department);
    } catch (e) {
      console.error("Failed loading employees for modal:", e);
    }

    const optionsHtml =
      list.length > 0
        ? list
            .map(
              (e) =>
                `<option value="${e._id}">${(e.fullName || "")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")} · ${e.department || "-"}</option>`
            )
            .join("")
        : `<option value="">No employees found</option>`;

    const html = `
      <div style="display:grid;gap:10px;text-align:left">
        <label style="display:grid;gap:6px">
          <span class="lbl">Employee</span>
          <select id="p-emp" class="swal2-select" style="margin:0">
            <option value="">Select…</option>
            ${optionsHtml}
          </select>
        </label>
        <div style="display:grid;gap:10px;grid-template-columns:1fr 1fr">
          <label style="display:grid;gap:6px">
            <span class="lbl">Period start</span>
            <input id="p-start" type="date" class="swal2-input" style="margin:0" />
          </label>
          <label style="display:grid;gap:6px">
            <span class="lbl">Period end</span>
            <input id="p-end" type="date" class="swal2-input" style="margin:0" />
          </label>
        </div>
        <label style="display:grid;gap:6px">
          <span class="lbl">Title</span>
          <input id="p-title" class="swal2-input" style="margin:0" placeholder="H2 2025 Review"/>
        </label>
        <details>
          <summary style="cursor:pointer;color:#065f46;margin-top:6px">Add goals (optional)</summary>
          <div style="margin-top:8px;font-size:12px;color:#4b5563">
            Enter one per line: <b>label | weight | managerScore</b><br/>
            Example: <i>Quality | 1 | 4.5</i>
          </div>
          <textarea id="p-goals" class="swal2-textarea" style="margin-top:8px;height:120px"
            placeholder="Quality | 1 | 4.5&#10;Timeliness | 1 | 4&#10;Teamwork | 1 | 5"></textarea>
        </details>
      </div>
    `;

    const res = await MySwal.fire({
      title: "New performance review",
      html,
      showCancelButton: true,
      confirmButtonText: "Create",
      focusConfirm: false,
      preConfirm: () => {
        const employeeId = document.getElementById("p-emp").value;
        const periodStart = document.getElementById("p-start").value;
        const periodEnd = document.getElementById("p-end").value;
        const title = document.getElementById("p-title").value.trim();
        const rawGoals = document.getElementById("p-goals").value;

        if (!employeeId) return MySwal.showValidationMessage("Select employee");
        if (!periodStart || !periodEnd)
          return MySwal.showValidationMessage("Select period");

        const goals = [];
        if (rawGoals.trim()) {
          rawGoals
            .split("\n")
            .map((ln) => ln.trim())
            .filter(Boolean)
            .forEach((ln, i) => {
              const [label, w, s] = ln.split("|").map((x) => x?.trim());
              if (!label) return;
              goals.push({
                key: `g${i + 1}`,
                label,
                weight: Number(w || 1),
                managerScore: s === undefined ? undefined : Number(s),
              });
            });
        }
        return { employeeId, periodStart, periodEnd, title, goals };
      },
    });
    if (!res.isConfirmed) return;

    try {
      await api.post("/hr/performance", res.value);
      toast("Created");
      setPage(1);
      fetchList();
    } catch (e) {
      errorBox(e, "Create failed");
    }
  };

  /* ---------------- manage (edit/finalize/pdf/delete) ---------------- */
  const manage = async (row) => {
    const { value } = await MySwal.fire({
      title: "Manage review",
      input: "radio",
      inputOptions: {
        edit: "Edit",
        goals: "Edit goals",
        finalize: "Finalize",
        pdf: "Download PDF",
        del: "Delete",
      },
      inputValidator: (v) => (!v ? "Choose an option" : undefined),
      showCancelButton: true,
      confirmButtonText: "Continue",
      reverseButtons: true,
    });
    if (!value) return;
    if (value === "edit") return editMeta(row);
    if (value === "goals") return editGoals(row);
    if (value === "finalize") return finalize(row);
    if (value === "pdf") return downloadPDF(row);
    if (value === "del") return remove(row);
  };

  const editMeta = async (row) => {
    const html = `
      <div style="display:grid;gap:10px;text-align:left">
        <label style="display:grid;gap:6px">
          <span class="lbl">Title</span>
          <input id="e-title" class="swal2-input" style="margin:0"
                 value="${(row.title || "").replace(/"/g, "&quot;")}"/>
        </label>
        <div style="display:grid;gap:10px;grid-template-columns:1fr 1fr">
          <label style="display:grid;gap:6px">
            <span class="lbl">Period start</span>
            <input id="e-start" type="date" class="swal2-input" style="margin:0"
                   value="${row.periodStart ? new Date(row.periodStart).toISOString().slice(0,10) : ""}"/>
          </label>
          <label style="display:grid;gap:6px">
            <span class="lbl">Period end</span>
            <input id="e-end" type="date" class="swal2-input" style="margin:0"
                   value="${row.periodEnd ? new Date(row.periodEnd).toISOString().slice(0,10) : ""}"/>
          </label>
        </div>
        <label style="display:grid;gap:6px">
          <span class="lbl">Status</span>
          <select id="e-status" class="swal2-select" style="margin:0">
            ${["open","in_review","finalized"]
              .map((s) => `<option ${row.status===s?"selected":""} value="${s}">${s.replace("_"," ")}</option>`)
              .join("")}
          </select>
        </label>
        <label style="display:grid;gap:6px">
          <span class="lbl">Summary (optional)</span>
          <textarea id="e-sum" class="swal2-textarea" style="margin:0;height:120px">${(row.summary||"")
            .replace(/</g,"&lt;")
            .replace(/>/g,"&gt;")}</textarea>
        </label>
      </div>
    `;
    const res = await MySwal.fire({
      title: "Edit review",
      html,
      showCancelButton: true,
      confirmButtonText: "Save",
      focusConfirm: false,
      preConfirm: () => {
        const title = document.getElementById("e-title").value.trim();
        const periodStart = document.getElementById("e-start").value;
        const periodEnd = document.getElementById("e-end").value;
        const status = document.getElementById("e-status").value;
        const summary = document.getElementById("e-sum").value;
        if (!title) return MySwal.showValidationMessage("Title is required");
        if (!periodStart || !periodEnd)
          return MySwal.showValidationMessage("Period required");
        return { title, periodStart, periodEnd, status, summary };
      },
    });
    if (!res.isConfirmed) return;
    try {
      const upd = await api.patch(`/hr/performance/${row._id}`, res.value);
      const updated = upd.data?.data || upd.data;
      setRows((prev) => prev.map((x) => (x._id === row._id ? updated : x)));
      toast("Updated");
    } catch (e) {
      errorBox(e, "Update failed");
    }
  };

  const editGoals = async (row) => {
    const example = (row.goals || [])
      .map((g) => `${g.label} | ${g.weight ?? 1} | ${g.managerScore ?? ""}`)
      .join("\n");

    const html = `
      <div style="display:grid;gap:10px;text-align:left">
        <div style="font-size:12px;color:#4b5563">
          One per line: <b>label | weight | managerScore</b>
        </div>
        <textarea id="g-data" class="swal2-textarea" style="margin:0;height:180px"
          placeholder="Quality | 1 | 4.5&#10;Timeliness | 1 | 4">${example}</textarea>
      </div>
    `;

    const res = await MySwal.fire({
      title: "Edit goals",
      html,
      showCancelButton: true,
      confirmButtonText: "Save",
      focusConfirm: false,
      preConfirm: () => {
        const txt = document.getElementById("g-data").value;
        const goals = [];
        txt
          .split("\n")
          .map((ln) => ln.trim())
          .filter(Boolean)
          .forEach((ln, i) => {
            const [label, w, s] = ln.split("|").map((x) => x?.trim());
            if (!label) return;
            goals.push({
              key: `g${i + 1}`,
              label,
              weight: Number(w || 1),
              managerScore: s === undefined || s === "" ? undefined : Number(s),
            });
          });
        if (!goals.length) return MySwal.showValidationMessage("Add at least one goal");
        return { goals };
      },
    });
    if (!res.isConfirmed) return;

    try {
      const upd = await api.patch(`/hr/performance/${row._id}`, res.value);
      const updated = upd.data?.data || upd.data;
      setRows((prev) => prev.map((x) => (x._id === row._id ? updated : x)));
      toast("Goals updated");
    } catch (e) {
      errorBox(e, "Update failed");
    }
  };

  const finalize = async (row) => {
    if (row.status === "finalized") {
      return MySwal.fire({ icon: "info", title: "Already finalized" });
    }
    const conf = await MySwal.fire({
      icon: "warning",
      title: "Finalize this review?",
      text: "Scores will be locked.",
      showCancelButton: true,
      confirmButtonText: "Finalize",
      confirmButtonColor: "#10b981",
      reverseButtons: true,
    });
    if (!conf.isConfirmed) return;

    try {
      const upd = await api.post(`/hr/performance/${row._id}/finalize`);
      const updated = upd.data?.data || upd.data;
      setRows((prev) => prev.map((x) => (x._id === row._id ? updated : x)));
      toast("Finalized");
    } catch (e) {
      errorBox(e, "Finalize failed");
    }
  };

  const remove = async (row) => {
    const conf = await MySwal.fire({
      icon: "warning",
      title: "Delete this review?",
      text: "This cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });
    if (!conf.isConfirmed) return;
    try {
      await api.delete(`/hr/performance/${row._id}`);
      setRows((prev) => prev.filter((x) => x._id !== row._id));
      setTotal((t) => Math.max(0, t - 1));
      toast("Deleted");
    } catch (e) {
      errorBox(e, "Delete failed");
    }
  };

  /* ---------------- PDF (single review) ---------------- */
  const downloadPDF = async (row) => {
    try {
      const full = await api.get(`/hr/performance/${row._id}`);
      const r = full.data?.data || full.data;

      const doc = new jsPDF({ unit: "pt", compress: true });
      let y = 64;

      const addLine = (text, size = 11, dy = 18) => {
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, 520);
        lines.forEach((ln) => {
          if (y > 760) {
            doc.addPage();
            y = 64;
          }
          doc.text(ln, 48, y);
          y += dy;
        });
      };

      // Header
      doc.setFontSize(16);
      doc.text("Performance Review", 48, y);
      y += 10;
      doc.setLineWidth(0.8);
      doc.line(48, y, 560, y);
      y += 22;

      addLine(`Employee: ${r.employee?.fullName || "-"}`, 12, 18);
      addLine(`Department: ${r.employee?.department || r.department || "-"}`, 12, 18);
      addLine(
        `Period: ${
          r.periodStart ? new Date(r.periodStart).toLocaleDateString() : "-"
        }  —  ${r.periodEnd ? new Date(r.periodEnd).toLocaleDateString() : "-"}`,
        12,
        18
      );
      addLine(`Title: ${r.title || "-"}`, 12, 18);
      addLine(`Status: ${r.status?.replace("_", " ") || "-"}`, 12, 24);

      doc.setFontSize(13);
      doc.text("Goals & Scores", 48, y);
      y += 12;
      doc.setLineWidth(0.5);
      doc.line(48, y, 560, y);
      y += 14;

      // Simple table
      const header = ["Goal", "Weight", "Score"];
      const colX = [48, 420, 500];
      doc.setFontSize(11);
      doc.text(header[0], colX[0], y);
      doc.text(header[1], colX[1], y);
      doc.text(header[2], colX[2], y);
      y += 10;
      doc.setLineWidth(0.25);
      doc.line(48, y, 560, y);
      y += 12;

      (r.goals || []).forEach((g) => {
        const goalLines = doc.splitTextToSize(g.label || "-", 350);
        const rowsNeeded = goalLines.length;
        for (let i = 0; i < rowsNeeded; i++) {
          if (y > 760) {
            doc.addPage();
            y = 64;
          }
          doc.text(goalLines[i], colX[0], y);
          if (i === 0) {
            doc.text(String(g.weight ?? 1), colX[1], y);
            if (g.managerScore !== undefined && g.managerScore !== null) {
              doc.text(String(g.managerScore), colX[2], y);
            } else if (g.selfScore !== undefined && g.selfScore !== null) {
              doc.text(String(g.selfScore), colX[2], y);
            } else {
              doc.text("-", colX[2], y);
            }
          }
          y += 16;
        }
        y += 2;
      });

      y += 6;
      doc.setLineWidth(0.25);
      doc.line(48, y, 560, y);
      y += 18;

      addLine(`Overall score: ${r.overallScore ?? 0}`, 12, 18);

      if (r.summary) {
        y += 6;
        doc.setFontSize(13);
        doc.text("Summary", 48, y);
        y += 12;
        doc.setLineWidth(0.5);
        doc.line(48, y, 560, y);
        y += 14;
        addLine(r.summary, 11, 16);
      }

      const fname = `review_${(r.employee?.fullName || "employee")
        .toLowerCase()
        .replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(fname);

      toast("PDF downloaded");
    } catch (e) {
      console.error(e);
      errorBox(e, "PDF failed");
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="hrlist-wrap">
      <div className="hrlist-card">
        <div className="hrlist-head">
          <h2>Performance Reviews</h2>
        </div>

        <div className="hrlist-filters">
          <input
            className="hrlist-input"
            placeholder="Search by title/summary…"
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
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1).replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            className="hrlist-select"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            title="Department"
          >
            <option value="all">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            className="hrlist-select"
            value={employee}
            onChange={(e) => {
              setEmployee(e.target.value);
              setPage(1);
            }}
            title="Employee"
          >
            <option value="all">
              {department === "all" ? "All employees" : "All in dept"}
            </option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.fullName}
              </option>
            ))}
          </select>

          <input
            className="hrlist-input"
            type="date"
            value={periodFrom}
            onChange={(e) => {
              setPeriodFrom(e.target.value);
              setPage(1);
            }}
            title="From"
          />
          <input
            className="hrlist-input"
            type="date"
            value={periodTo}
            onChange={(e) => {
              setPeriodTo(e.target.value);
              setPage(1);
            }}
            title="To"
          />

          <button
            className="btn-teal"
            disabled={loading}
            onClick={() => {
              setPage(1);
              fetchList();
            }}
          >
            {loading ? "Loading…" : "Search"}
          </button>
        </div>

        {err && <div className="hrlist-error">{err}</div>}

        <div className="hrlist-tablewrap">
          <table className="hrlist-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Period</th>
                <th>Status</th>
                <th>Overall</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="hrlist-empty">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="hrlist-empty">
                    No reviews
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r._id}>
                    <td className="hrlist-name">{r.title || "-"}</td>
                    <td>{r.employee?.fullName || "-"}</td>
                    <td>{r.employee?.department || r.department || "-"}</td>
                    <td>
                      {(r.periodStart
                        ? new Date(r.periodStart).toLocaleDateString()
                        : "-") +
                        " – " +
                        (r.periodEnd
                          ? new Date(r.periodEnd).toLocaleDateString()
                          : "-")}
                    </td>
                    <td>
                      <span className={`badge ${r.status}`}>
                        {r.status?.replace("_", " ")}
                      </span>
                    </td>
                    <td>{r.overallScore ?? 0}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          className="hrlist-btn edit small"
                          onClick={() => manage(r)}
                        >
                          Manage
                        </button>
                        <button
                          className="hrlist-btn ghost small"
                          onClick={() => downloadPDF(r)}
                          title="Download PDF"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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
    </div>
  );
}
