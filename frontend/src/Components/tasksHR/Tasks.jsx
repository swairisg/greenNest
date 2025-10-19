// frontend/src/Components/tasksHR/Tasks.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useHRChrome } from "./HRLayout";
import "./Employees.css"; // reuse list/table/button styles
import "./Tasks.css";     // keep visuals parallel to TasksNew form

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const STATUS = ["all", "open", "in_progress", "blocked", "done"];
const PRIORITY = ["all", "low", "normal", "high"];
const DEPARTMENTS = [
  "Administration",
  "People Ops",
  "Operations",
  "Finance",
  "Product",
  "Greenhouse",
];

export default function HRTasks() {
  const { setRight, clearRight } = useHRChrome();

  // table data
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // completed data (separate section)
  const [doneRows, setDoneRows] = useState([]);

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [department, setDepartment] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [assignees, setAssignees] = useState([]); // active employees (optionally filtered by dept)
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");

  // ui state
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [err, setErr] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / pageSize)),
    [total, pageSize]
  );

  // header right action
  useEffect(() => {
    setRight(
      <Link to="/hr/tasks/new" className="hrlist-btn-primary">
        + Create Task
      </Link>
    );
    return clearRight;
  }, [setRight, clearRight]);

  // helper: build current query
  const buildParams = (overrides = {}) => {
    const params = { page, pageSize, ...overrides };
    if (search.trim()) params.search = search.trim();
    if (status !== "all") params.status = status;
    if (priority !== "all") params.priority = priority;
    if (department !== "all") params.department = department;
    if (assignee !== "all") params.assignee = assignee;  // <-- uses "assignee"
    if (dueFrom) params.dueFrom = dueFrom;
    if (dueTo) params.dueTo = dueTo;
    return params;
  };

  // load table
  const fetchList = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/hr/tasks", { params: buildParams() });
      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  // load completed (done) list — always status=done; reuse other filters
  const fetchDone = async () => {
    try {
      const res = await api.get("/hr/tasks", {
        params: buildParams({ status: "done", page: 1, pageSize: 50 }),
      });
      setDoneRows(res.data?.data || []);
    } catch (e) {
      // non-blocking
      console.error("done list load error:", e);
    }
  };

  // load active employees for assignee filter (optionally filtered by department)
  const fetchAssignees = async (dept) => {
    try {
      const params = { status: "active", page: 1, pageSize: 1000 };
      if (dept && dept !== "all") params.department = dept;
      const res = await api.get("/hr/employees", { params });
      setAssignees(res.data?.data || []);
    } catch (e) {
      console.error("assignees load error:", e);
    }
  };

  // initial loads
  useEffect(() => {
    fetchAssignees("all");
  }, []);
  useEffect(() => {
    fetchList();
    fetchDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status, priority, assignee, dueFrom, dueTo]);

  // when department changes, refresh assignee list and reset current assignee
  useEffect(() => {
    fetchAssignees(department);
    setAssignee("all");
    setPage(1);
    fetchList();
    fetchDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department]);

  // debounce search
  const debounceRef = useRef();
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchList();
      fetchDone();
    }, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // CSV export (respects filters)
  const csvEscape = (v) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const batch = 500;
      let cur = 1,
        all = [],
        totalFound = 0;
      while (true) {
        const resp = await api.get("/hr/tasks", {
          params: buildParams({ page: cur, pageSize: batch }),
        });
        const chunk = resp.data?.data || [];
        totalFound = resp.data?.total || 0;
        all = all.concat(chunk);
        const pages = Math.max(1, Math.ceil(totalFound / batch));
        if (cur >= pages) break;
        cur++;
      }

      const headers = [
        "Title",
        "Department",
        "Assignee",
        "Priority",
        "Status",
        "Due Date",
        "Created",
      ];
      const rowsCsv = all
        .map((t) =>
          [
            csvEscape(t.title || ""),
            csvEscape(t.assignee?.department || ""),
            csvEscape(t.assignee?.fullName || ""),
            csvEscape(t.priority || ""),
            csvEscape(t.status || ""),
            csvEscape(
              t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : ""
            ),
            csvEscape(
              t.createdAt ? new Date(t.createdAt).toISOString().slice(0, 10) : ""
            ),
          ].join(",")
        )
        .join("\n");

      const csv = [headers.join(","), rowsCsv].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: `CSV generated (${all.length})`,
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (e) {
      console.error(e);
      MySwal.fire({
        icon: "error",
        title: "Export failed",
        text: e?.response?.data?.message || e.message,
      });
    } finally {
      setExporting(false);
    }
  };

  // PDF export (printable window -> Save as PDF)
  const renderTasksTableHTML = (rows) => {
    const head = `
      <thead>
        <tr>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Title</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Department</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Assignee</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Priority</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Status</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Due</th>
          <th style="text-align:left;padding:8px;border-bottom:1px solid #e5e7eb;">Created</th>
        </tr>
      </thead>`;
    const body = rows
      .map(
        (t) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${t.title || ""}</td>
          <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${t.department || t.assignee?.department || "-"}</td>
          <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${t.assignee?.fullName || "-"}</td>
          <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${t.priority || "-"}</td>
          <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${(t.status || "-").replace("_"," ")}</td>
          <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${
            t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"
          }</td>
          <td style="padding:8px;border-bottom:1px solid #f3f4f6;">${
            t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-"
          }</td>
        </tr>`
      )
      .join("");
    return `<table style="width:100%; border-collapse:collapse; font-size:12px;">${head}<tbody>${body}</tbody></table>`;
  };

 const handleExportPDF = async () => {
  try {
    setExporting(true);

    // get ALL rows under current filters
    const batch = 500;
    let cur = 1, all = [], totalFound = 0;
    while (true) {
      const resp = await api.get("/hr/tasks", {
        params: buildParams({ page: cur, pageSize: batch }),
      });
      const chunk = resp.data?.data || [];
      totalFound = resp.data?.total || 0;
      all = all.concat(chunk);
      const pages = Math.max(1, Math.ceil(totalFound / batch));
      if (cur >= pages) break;
      cur++;
    }

    // Build data rows
    const body = all.map(t => ([
      t.title || "",
      t.department || t.assignee?.department || "",
      t.assignee?.fullName || "",
      t.priority || "",
      (t.status || "").replace("_"," "),
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "",
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "",
    ]));

    // Create + render table
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const marginX = 36;
    const marginY = 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Tasks Report", marginX, marginY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(new Date().toLocaleString(), marginX, marginY + 14);

    autoTable(doc, {
      startY: marginY + 28,
      head: [[ "Title","Department","Assignee","Priority","Status","Due","Created" ]],
      body,
      styles: { fontSize: 8, cellPadding: 4, valign: "middle" },
      headStyles: { fillColor: [6,95,70], textColor: 255 },
      columnStyles: {
        0: { cellWidth: 170 },
        1: { cellWidth: 90 },
        2: { cellWidth: 120 },
        3: { cellWidth: 60 },
        4: { cellWidth: 70 },
        5: { cellWidth: 70 },
        6: { cellWidth: 70 },
      },
      margin: { left: marginX, right: marginX },
      didDrawPage: (data) => {
        const str = `Page ${doc.internal.getNumberOfPages()}`;
        doc.setFontSize(8);
        doc.text(
          str,
          doc.internal.pageSize.getWidth() - marginX,
          doc.internal.pageSize.getHeight() - 14,
          { align: "right" }
        );
      },
    });

    // Download
    const filename = `tasks_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(filename);

    MySwal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: `PDF downloaded (${all.length} rows)`,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  } catch (e) {
    console.error(e);
    MySwal.fire({
      icon: "error",
      title: "Export failed",
      text: e?.response?.data?.message || e.message,
    });
  } finally {
    setExporting(false);
  }
};


  /* -------------------- Manage (Edit / Done / Delete) -------------------- */

  const handleManage = async (task) => {
    const { value } = await MySwal.fire({
      title: "Manage task",
      input: "radio",
      inputOptions: {
        edit: "Edit",
        done: "Mark as done",
        del: "Delete",
      },
      inputValidator: (v) => (!v ? "Choose an option" : undefined),
      showCancelButton: true,
      confirmButtonText: "Continue",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
    if (!value) return;

    if (value === "edit") return editTask(task);
    if (value === "done") return markDone(task);
    if (value === "del") return deleteTask(task);
  };

  const editTask = async (task) => {
    const html = `
      <div style="display:grid; gap:10px; text-align:left">
        <label style="display:grid; gap:6px">
          <span style="font-size:12px;color:#374151">Title</span>
          <input id="t-title" value="${(task.title || "").replace(/"/g, "&quot;")}" class="swal2-input" style="margin:0" />
        </label>
        <label style="display:grid; gap:6px">
          <span style="font-size:12px;color:#374151">Priority</span>
          <select id="t-pri" class="swal2-select" style="margin:0">
            ${["low","normal","high"].map(p=>`<option ${task.priority===p?"selected":""} value="${p}">${p}</option>`).join("")}
          </select>
        </label>
        <label style="display:grid; gap:6px">
          <span style="font-size:12px;color:#374151">Status</span>
          <select id="t-st" class="swal2-select" style="margin:0">
            ${["open","in_progress","blocked"].map(s=>`<option ${task.status===s?"selected":""} value="${s}">${s.replace("_"," ")}</option>`).join("")}
          </select>
        </label>
        <label style="display:grid; gap:6px">
          <span style="font-size:12px;color:#374151">Due date</span>
          <input id="t-due" type="date" class="swal2-input" style="margin:0" value="${task.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : ""}" />
        </label>
      </div>
    `;
    const res = await MySwal.fire({
      title: "Edit task",
      html,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save",
      preConfirm: () => {
        const title = document.getElementById("t-title").value.trim();
        const priority = document.getElementById("t-pri").value;
        const status = document.getElementById("t-st").value;
        const dueDate = document.getElementById("t-due").value;
        if (!title) return MySwal.showValidationMessage("Title is required");
        return { title, priority, status, dueDate };
      },
    });
    if (!res.isConfirmed) return;

    try {
      const payload = {
        title: res.value.title,
        priority: res.value.priority,
        status: res.value.status,
        dueDate: res.value.dueDate || undefined,
      };
      const upd = await api.patch(`/hr/tasks/${task._id}`, payload);
      const updated = upd.data;

      // update in open list
      setRows((prev) => prev.map((x) => (x._id === task._id ? { ...x, ...updated } : x)));
      // also if it accidentally became done, move it
      if (updated.status === "done") {
        setRows((prev) => prev.filter((x) => x._id !== task._id));
        setDoneRows((prev) => [{ ...task, ...updated }, ...prev]);
      }

      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Task updated",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (e) {
      console.error(e);
      MySwal.fire({ icon: "error", title: "Update failed", text: e?.response?.data?.message || e.message });
    }
  };

  const markDone = async (task) => {
    try {
      const upd = await api.patch(`/hr/tasks/${task._id}`, {
        status: "done",
        completedAt: new Date().toISOString(),
      });
      const updated = upd.data;
      // move from rows to doneRows
      setRows((prev) => prev.filter((x) => x._id !== task._id));
      setDoneRows((prev) => [{ ...task, ...updated }, ...prev]);

      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Marked as done",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (e) {
      console.error(e);
      MySwal.fire({ icon: "error", title: "Failed", text: e?.response?.data?.message || e.message });
    }
  };

  const deleteTask = async (task) => {
    const conf = await MySwal.fire({
      icon: "warning",
      title: "Delete this task?",
      text: "This cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });
    if (!conf.isConfirmed) return;
    try {
      await api.delete(`/hr/tasks/${task._id}`);
      setRows((prev) => prev.filter((x) => x._id !== task._id));
      setDoneRows((prev) => prev.filter((x) => x._id !== task._id));

      MySwal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Task deleted",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });
    } catch (e) {
      console.error(e);
      MySwal.fire({ icon: "error", title: "Delete failed", text: e?.response?.data?.message || e.message });
    }
  };

  /* -------------------- UI -------------------- */

  return (
    
    <div className="hrlist-wrap">
      <div className="hrlist-card">
        <div className="hrlist-head">
          <h2>Tasks</h2>
        </div>

        {/* Filters */}
        <div className="hrlist-filters">
          <input
            className="hrlist-input"
            placeholder="Search by title/description…"
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
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            title="Priority"
          >
            {PRIORITY.map((p) => (
              <option key={p} value={p}>
                {p[0].toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          {/* Department -> Assignee cascade */}
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
            value={assignee}
            onChange={(e) => {
              setAssignee(e.target.value);
              setPage(1);
            }}
            title="Assignee"
          >
            <option value="all">
              {department === "all" ? "All assignees" : "All in department"}
            </option>
            {assignees.map((a) => (
              <option key={a._id} value={a._id}>
                {a.fullName}
              </option>
            ))}
          </select>

          <input
            className="hrlist-input"
            type="date"
            value={dueFrom}
            onChange={(e) => {
              setDueFrom(e.target.value);
              setPage(1);
            }}
            title="Due from"
          />
          <input
            className="hrlist-input"
            type="date"
            value={dueTo}
            onChange={(e) => {
              setDueTo(e.target.value);
              setPage(1);
            }}
            title="Due to"
          />

          <button
            className="btn-teal"
            disabled={loading}
            onClick={() => {
              setPage(1);
              fetchList();
              fetchDone();
            }}
          >
            {loading ? "Loading…" : "Search"}
          </button>
          <button
            className="hrlist-btn ghost"
            style={{ marginLeft: 6 }}
            disabled={exporting || loading}
            onClick={handleExportCSV}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
          <button
            className="hrlist-btn ghost"
            style={{ marginLeft: 6 }}
            disabled={exporting || loading}
            onClick={handleExportPDF}
            title="Export to PDF (via print)"
          >
            {exporting ? "Building…" : "Export PDF"}
          </button>
        </div>

        {err && <div className="hrlist-error">{err}</div>}

        {/* Main table */}
        <div className="hrlist-tablewrap">
          <table className="hrlist-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Department</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due</th>
                <th>Created</th>
                <th style={{ width: 130 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="hrlist-empty">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="hrlist-empty">
                    No tasks found
                  </td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t._id}>
                    <td className="hrlist-name">{t.title}</td>
                    <td>{t.assignee?.department || "-"}</td>
                    <td>{t.assignee?.fullName || "-"}</td>
                    <td>{t.priority}</td>
                    <td>
                      <span className={`badge ${t.status}`}>
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      {t.dueDate
                        ? new Date(t.dueDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <button
                        className="hrlist-btn edit small"
                        onClick={() => handleManage(t)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pager */}
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

      {/* Completed (Done) section */}
      <div className="hrlist-card" style={{ marginTop: 16 }}>
        <div className="hrlist-head">
          <h3 style={{ margin: 0, color: "#065f46" }}>Completed</h3>
        </div>
        <div className="hrlist-tablewrap">
          <table className="hrlist-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Department</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {doneRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="hrlist-empty">
                    Nothing completed yet
                  </td>
                </tr>
              ) : (
                doneRows.map((t) => (
                  <tr key={t._id}>
                    <td className="hrlist-name">{t.title}</td>
                    <td>{t.assignee?.department || "-"}</td>
                    <td>{t.assignee?.fullName || "-"}</td>
                    <td>{t.priority}</td>
                    <td>
                      <span className="badge done">done</span>
                    </td>
                    <td>
                      {t.completedAt
                        ? new Date(t.completedAt).toLocaleDateString()
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
