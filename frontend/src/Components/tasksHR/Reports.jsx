import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useHRChrome } from "./HRLayout";
import "./Employees.css";
import "./Tasks.css";
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

const STATUS = ["all", "open", "in_progress", "blocked", "done"];
const PRIORITY = ["all", "low", "normal", "high"];

export default function HRReports() {
  const { setRight, clearRight } = useHRChrome();

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [department, setDepartment] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [dueFrom, setDueFrom] = useState("");
  const [dueTo, setDueTo] = useState("");

  // data
  const [assignees, setAssignees] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // header actions
  useEffect(() => {
    setRight(
      <div style={{ display: "flex", gap: 8 }}>
        <Link to="/hr" className="hrlist-btn ghost">← Back</Link>
        <button className="hrlist-btn" onClick={exportPDF}>Download PDF</button>
      </div>
    );
    return clearRight;
  }, [setRight, clearRight, rows, status, priority, department, assignee, dueFrom, dueTo, search]);

  // helpers
  const buildParams = (overrides = {}) => {
    const p = { page: 1, pageSize: 500, ...overrides };
    if (search.trim()) p.search = search.trim();
    if (status !== "all") p.status = status;
    if (priority !== "all") p.priority = priority;
    if (department !== "all") p.department = department;
    if (assignee !== "all") p.assignee = assignee;
    if (dueFrom) p.dueFrom = dueFrom;
    if (dueTo) p.dueTo = dueTo;
    return p;
  };

  const toast = (title) =>
    MySwal.fire({ toast: true, position: "top-end", icon: "success", title, showConfirmButton: false, timer: 1800 });

  const errorBox = (e, title = "Error") =>
    MySwal.fire({ icon: "error", title, text: e?.response?.data?.message || e.message || "Something failed" });

  // load assignees
  const fetchAssignees = async (dept = "all") => {
    try {
      const params = { status: "active", page: 1, pageSize: 1000 };
      if (dept !== "all") params.department = dept;
      const res = await api.get("/hr/employees", { params });
      setAssignees(res.data?.data || []);
    } catch (e) {
      console.error("assignees load error:", e);
    }
  };

  // load tasks (all that match filters; we page through if needed)
  const fetchTasks = async () => {
    setLoading(true);
    setErr("");
    try {
      const batch = 500;
      let cur = 1, all = [], total = 0;
      while (true) {
        const resp = await api.get("/hr/tasks", { params: buildParams({ page: cur, pageSize: batch }) });
        const chunk = resp.data?.data || [];
        total = resp.data?.total || 0;
        all = all.concat(chunk);
        const pages = Math.max(1, Math.ceil(total / batch));
        if (cur >= pages) break;
        cur++;
      }
      setRows(all);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  // initial
  useEffect(() => {
    fetchAssignees("all");
    fetchTasks();
  }, []);

  // department change
  useEffect(() => {
    fetchAssignees(department);
    setAssignee("all");
  }, [department]);

  // refresh when filters change (debounced for search)
  useEffect(() => { fetchTasks(); /* eslint-disable-next-line */ }, [status, priority, department, assignee, dueFrom, dueTo]);
  const sref = useRef();
  useEffect(() => {
    clearTimeout(sref.current);
    sref.current = setTimeout(fetchTasks, 300);
    return () => clearTimeout(sref.current);
  }, [search]);

  /* ---------- aggregations ---------- */
  const now = Date.now();
  const agg = useMemo(() => {
    const byStatus = {};
    const byPriority = {};
    const byDept = {};
    let overdue = 0;
    let completed = 0;
    let total = rows.length;

    // avg completion duration (in days) for done tasks
    let doneDurations = [];

    rows.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      const dep = t.assignee?.department || t.department || "-";
      byDept[dep] = (byDept[dep] || 0) + 1;

      if (t.dueDate && t.status !== "done" && new Date(t.dueDate).getTime() < now) overdue++;
      if (t.status === "done") {
        completed++;
        const created = new Date(t.createdAt).getTime();
        const finished = new Date(t.completedAt || t.updatedAt || t.createdAt).getTime();
        if (finished >= created) {
          doneDurations.push((finished - created) / (1000 * 60 * 60 * 24));
        }
      }
    });

    const completionRate = total ? Math.round((completed / total) * 100) : 0;
    const avgDays = doneDurations.length
      ? (doneDurations.reduce((a, b) => a + b, 0) / doneDurations.length)
      : 0;

    return { byStatus, byPriority, byDept, overdue, total, completed, completionRate, avgDays: Number(avgDays.toFixed(1)) };
  }, [rows, now]);

  /* ---------- PDF ---------- */
  async function exportPDF() {
    try {
      const doc = new jsPDF({ unit: "pt", compress: true });
      let y = 64;

      const addLine = (text, size = 11, dy = 18) => {
        doc.setFontSize(size);
        const lines = doc.splitTextToSize(text, 520);
        lines.forEach((ln) => {
          if (y > 760) { doc.addPage(); y = 64; }
          doc.text(ln, 48, y);
          y += dy;
        });
      };

      // header
      doc.setFontSize(16);
      doc.text("Tasks Report", 48, y);
      y += 10;
      doc.setLineWidth(0.8);
      doc.line(48, y, 560, y);
      y += 22;

      addLine(`Generated: ${new Date().toLocaleString()}`, 11, 16);

      // filters summary
      addLine(
        `Filters → Status: ${status}, Priority: ${priority}, Dept: ${department}, Assignee: ${assignee !== "all" ? assignees.find(a=>a._id===assignee)?.fullName || assignee : "all"}, ` +
        `Due: ${dueFrom || "-"} to ${dueTo || "-"}` , 11, 16
      );

      y += 6;
      doc.setFontSize(13);
      doc.text("KPIs", 48, y);
      y += 12;
      doc.setLineWidth(0.5);
      doc.line(48, y, 560, y);
      y += 16;
      addLine(`Total tasks: ${agg.total}   •   Completed: ${agg.completed}   •   Overdue (not done): ${agg.overdue}`, 11, 16);
      addLine(`Completion rate: ${agg.completionRate}%   •   Avg days to complete: ${agg.avgDays}`, 11, 22);

      // small table helper
      const drawTable = (title, pairs) => {
        doc.setFontSize(13);
        doc.text(title, 48, y);
        y += 12;
        doc.setLineWidth(0.25);
        doc.line(48, y, 560, y);
        y += 14;
        doc.setFontSize(11);
        Object.entries(pairs).forEach(([k, v]) => {
          if (y > 760) { doc.addPage(); y = 64; }
          doc.text(`${k}`, 48, y);
          doc.text(String(v), 540, y, { align: "right" });
          y += 16;
        });
        y += 8;
      };

      drawTable("By status", agg.byStatus);
      drawTable("By priority", agg.byPriority);
      drawTable("By department", agg.byDept);

      // (optional) first 25 visible rows list
      y += 6;
      doc.setFontSize(13);
      doc.text("Sample (first 25)", 48, y);
      y += 12;
      doc.setLineWidth(0.25);
      doc.line(48, y, 560, y);
      y += 14;
      doc.setFontSize(11);
      rows.slice(0, 25).forEach((t, i) => {
        if (y > 760) { doc.addPage(); y = 64; }
        const line = `${i + 1}. ${t.title} — ${t.priority}/${t.status} — ${
          t.assignee?.fullName || "-"
        } — Due ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}`;
        addLine(line, 11, 14);
      });

      const fname = `tasks_report_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(fname);
      toast("PDF downloaded");
    } catch (e) {
      console.error(e);
      errorBox(e, "PDF failed");
    }
  }

  /* ---------- UI ---------- */
  return (
    <div className="hrlist-wrap">
      <div className="hrlist-card">
        <div className="hrlist-head">
          <h2>Tasks Report</h2>
        </div>

        <div className="hrlist-filters">
          <input
            className="hrlist-input"
            placeholder="Search by title/description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select className="hrlist-select" value={status} onChange={(e)=>setStatus(e.target.value)} title="Status">
            {STATUS.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
          </select>

          <select className="hrlist-select" value={priority} onChange={(e)=>setPriority(e.target.value)} title="Priority">
            {PRIORITY.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select className="hrlist-select" value={department} onChange={(e)=>setDepartment(e.target.value)} title="Department">
            <option value="all">All departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select className="hrlist-select" value={assignee} onChange={(e)=>setAssignee(e.target.value)} title="Assignee">
            <option value="all">{department==="all" ? "All assignees" : "All in dept"}</option>
            {assignees.map(a => <option key={a._id} value={a._id}>{a.fullName}</option>)}
          </select>

          <input className="hrlist-input" type="date" value={dueFrom} onChange={(e)=>setDueFrom(e.target.value)} title="Due from"/>
          <input className="hrlist-input" type="date" value={dueTo} onChange={(e)=>setDueTo(e.target.value)} title="Due to"/>

          <button className="btn-teal" disabled={loading} onClick={fetchTasks}>
            {loading ? "Loading…" : "Search"}
          </button>
        </div>

        {err && <div className="hrlist-error">{err}</div>}

        {/* KPI strip */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginTop:8 }}>
          <div className="hrlist-kpi"><div className="kpi-title">Total</div><div className="kpi-value">{agg.total}</div></div>
          <div className="hrlist-kpi"><div className="kpi-title">Completed</div><div className="kpi-value">{agg.completed}</div></div>
          <div className="hrlist-kpi"><div className="kpi-title">Overdue</div><div className="kpi-value">{agg.overdue}</div></div>
          <div className="hrlist-kpi"><div className="kpi-title">Completion rate</div><div className="kpi-value">{agg.completionRate}%</div></div>
          <div className="hrlist-kpi"><div className="kpi-title">Avg days to complete</div><div className="kpi-value">{agg.avgDays}</div></div>
        </div>

        {/* Tables */}
        <div className="hrlist-tablewrap" style={{ marginTop: 12 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:16 }}>
            <SummaryTable title="By status" data={agg.byStatus} />
            <SummaryTable title="By priority" data={agg.byPriority} />
            <SummaryTable title="By department" data={agg.byDept} />
          </div>
        </div>

        {/* Sample list (current filter) */}
        <div className="hrlist-tablewrap" style={{ marginTop: 16 }}>
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="hrlist-empty">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="hrlist-empty">No tasks</td></tr>
              ) : (
                rows.slice(0,50).map(t => (
                  <tr key={t._id}>
                    <td className="hrlist-name">{t.title}</td>
                    <td>{t.assignee?.department || t.department || "-"}</td>
                    <td>{t.assignee?.fullName || "-"}</td>
                    <td>{t.priority}</td>
                    <td><span className={`badge ${t.status}`}>{t.status.replace("_"," ")}</span></td>
                    <td>{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-"}</td>
                    <td>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div style={{ fontSize:12, color:"#6b7280", padding:"6px 4px" }}>
            Showing first 50 rows (use filters to narrow down).
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- small summary table component ---------- */
function SummaryTable({ title, data }) {
  const entries = Object.entries(data || {}).sort((a,b)=>b[1]-a[1]);
  return (
    <div className="hrlist-card" style={{ margin:0 }}>
      <div className="hrlist-head">
        <h3 style={{ margin: 0 }}>{title}</h3>
      </div>
      <div className="hrlist-tablewrap">
        <table className="hrlist-table">
          <thead>
            <tr><th>Value</th><th style={{ width:90, textAlign:"right" }}>Count</th></tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={2} className="hrlist-empty">No data</td></tr>
            ) : entries.map(([k,v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td style={{ textAlign:"right" }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
