import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useHRChrome } from "./HRLayout";
import "./Attendance.css";
import "./Employees.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
const MySwal = withReactContent(Swal);

const DEPARTMENTS = ["Administration","People Ops","Operations","Finance","Product","Greenhouse"];
const STATUS = ["all", "open", "clocked_in", "clocked_out"];

/* formatting helpers (same logic as backend, kept here for UI) */
const minutesToAMPM = (mins) => {
  if (mins == null) return "";
  let h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const am = h24 < 12;
  if (h24 === 0) h24 = 12;
  else if (h24 > 12) h24 -= 12;
  const HH = String(h24).padStart(2, "0");
  const MM = String(m).padStart(2, "0");
  return `${HH}:${MM} ${am ? "AM" : "PM"}`;
};

export default function HRAttendance() {
  const { setRight, clearRight } = useHRChrome();

  // Attendance list state
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [department, setDepartment] = useState("all");
  const [employee, setEmployee] = useState("all");
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Shift templates
  const [templates, setTemplates] = useState([]);
  const [tmplLoading, setTmplLoading] = useState(false);
  const [showTemplatesPanel, setShowTemplatesPanel] = useState(true);

  // Assign modal
  const [assignOpen, setAssignOpen] = useState(false);

  // UI
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  /* header buttons */
  useEffect(() => {
    setRight(
      <div style={{ display: "flex", gap: 8 }}>
        <Link to="/hr" className="hrlist-btn ghost">← Back</Link>
        <button className="hrlist-btn" onClick={() => setAssignOpen(true)}>Assign Shifts</button>
        <button className="hrlist-btn ghost" onClick={() => setShowTemplatesPanel(v => !v)}>
          {showTemplatesPanel ? "Hide Templates" : "Show Templates"}
        </button>
      </div>
    );
    return clearRight;
  }, [setRight, clearRight, showTemplatesPanel]);

  /* data helpers */
  const buildParams = (overrides={}) => {
    const p = { page, pageSize, ...overrides };
    if (dateFrom) p.dateFrom = dateFrom;
    if (dateTo)   p.dateTo   = dateTo;
    if (department !== "all") p.department = department;
    if (employee !== "all")   p.employeeId = employee;
    if (status !== "all")     p.status     = status;
    if (search.trim())        p.search     = search.trim();
    return p;
  };

  /* load Attendance */
  const fetchAttendance = async () => {
    setLoading(true); setErr("");
    try {
      const r = await api.get("/hr/attendance", { params: buildParams() });
      setRows(r.data?.data || []);
      setTotal(r.data?.total || 0);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load attendance");
    } finally { setLoading(false); }
  };

  /* load employees for filter */
  const fetchEmployees = async (dept="all") => {
    try {
      const params = { status: "active", page: 1, pageSize: 1000 };
      if (dept !== "all") params.department = dept;
      const r = await api.get("/hr/employees", { params });
      setEmployees(r.data?.data || []);
    } catch (e) { console.error(e); }
  };

  /* load shift templates */
  const loadTemplates = async () => {
    try {
      setTmplLoading(true);
      const r = await api.get("/hr/shifts");
      setTemplates(r.data?.data || []);
    } catch (e) {
      console.error(e);
      setTemplates([]);
    } finally { setTmplLoading(false); }
  };

  /* init */
  useEffect(() => { fetchEmployees("all"); loadTemplates(); }, []);
  useEffect(() => { fetchAttendance(); /* eslint-disable-next-line */ }, [page, status, employee, dateFrom, dateTo]);
  useEffect(() => {
    fetchEmployees(department);
    setEmployee("all"); setPage(1); fetchAttendance();
    // eslint-disable-next-line
  }, [department]);

  const sref = useRef();
  useEffect(() => {
    clearTimeout(sref.current);
    sref.current = setTimeout(() => { setPage(1); fetchAttendance(); }, 300);
    return () => clearTimeout(sref.current);
    // eslint-disable-next-line
  }, [search]);

  /* actions */
  const toast = (title) =>
    MySwal.fire({ toast: true, position: "top-end", icon: "success", title, showConfirmButton: false, timer: 1800 });

  const errorBox = (e, title="Error") =>
    MySwal.fire({ icon: "error", title, text: e?.response?.data?.message || e.message || "Something failed" });

  const doClockIn = async (att) => {
    try {
      const r = await api.post("/hr/attendance/clock-in", { attendanceId: att._id });
      const row = r.data?.data || r.data;
      setRows(prev => prev.map(x => x._id === att._id ? row : x));
      toast("Clocked in");
    } catch (e) { errorBox(e, "Clock-in failed"); }
  };

  const doClockOut = async (att) => {
    try {
      const r = await api.post("/hr/attendance/clock-out", { attendanceId: att._id });
      const row = r.data?.data || r.data;
      setRows(prev => prev.map(x => x._id === att._id ? row : x));
      toast("Clocked out");
    } catch (e) { errorBox(e, "Clock-out failed"); }
  };

  const doEdit = async (att) => {
    const html = `
      <div style="display:grid;gap:10px;text-align:left">
        <label style="display:grid;gap:6px">
          <span class="lbl">Work Date</span>
          <input id="a-date" type="date" class="swal2-input" style="margin:0"
            value="${att.workDate ? new Date(att.workDate).toISOString().slice(0,10) : ""}" />
        </label>
        <label style="display:grid;gap:6px">
          <span class="lbl">Check-in</span>
          <input id="a-in" type="datetime-local" class="swal2-input" style="margin:0"
            value="${att.checkIn ? new Date(att.checkIn).toISOString().slice(0,16) : ""}" />
        </label>
        <label style="display:grid;gap:6px">
          <span class="lbl">Check-out</span>
          <input id="a-out" type="datetime-local" class="swal2-input" style="margin:0"
            value="${att.checkOut ? new Date(att.checkOut).toISOString().slice(0,16) : ""}" />
        </label>
        <label style="display:grid;gap:6px">
          <span class="lbl">Status</span>
          <select id="a-status" class="swal2-select" style="margin:0">
            ${["open","clocked_in","clocked_out"].map(s=>`<option ${att.status===s?"selected":""} value="${s}">${s.replace("_"," ")}</option>`).join("")}
          </select>
        </label>
      </div>`;
    const res = await MySwal.fire({
      title: "Edit attendance",
      html, focusConfirm: false, showCancelButton: true, confirmButtonText: "Save",
      preConfirm: () => {
        const workDate = document.getElementById("a-date").value || undefined;
        const checkIn  = document.getElementById("a-in").value || undefined;
        const checkOut = document.getElementById("a-out").value || undefined;
        const status   = document.getElementById("a-status").value;
        return { workDate, checkIn, checkOut, status };
      },
    });
    if (!res.isConfirmed) return;
    try {
      const r = await api.patch(`/hr/attendance/${att._id}`, res.value);
      const row = r.data?.data || r.data;
      setRows(prev => prev.map(x => x._id === att._id ? row : x));
      toast("Updated");
    } catch (e) { errorBox(e, "Update failed"); }
  };

  const doDelete = async (att) => {
    const conf = await MySwal.fire({ icon: "warning", title: "Delete this record?",
      text: "This will mark the attendance as deleted.",
      showCancelButton: true, confirmButtonText: "Delete", confirmButtonColor: "#dc2626", reverseButtons: true });
    if (!conf.isConfirmed) return;
    try {
      await api.delete(`/hr/attendance/${att._id}`);
      setRows(prev => prev.filter(x => x._id !== att._id));
      setTotal(t => Math.max(0, t - 1));
      toast("Deleted");
    } catch (e) { errorBox(e, "Delete failed"); }
  };

  /* Assign Shifts modal */
  const AssignModal = () => {
    const [mode, setMode] = useState("department");
    const [dept, setDept] = useState(department !== "all" ? department : "");
    const [pickedEmployees, setPickedEmployees] = useState([]);
    const [rangeStart, setRangeStart] = useState("");
    const [rangeEnd, setRangeEnd] = useState("");
    const [templateId, setTemplateId] = useState("");

    const canSubmit =
      templateId && rangeStart && rangeEnd &&
      ((mode === "department" && dept) || (mode === "employees" && pickedEmployees.length));

    const handleAssign = async () => {
      try {
        const payload = (mode === "department")
          ? { department: dept, templateId, startDate: rangeStart, endDate: rangeEnd }
          : { employeeIds: pickedEmployees, templateId, startDate: rangeStart, endDate: rangeEnd };
        await api.post("/hr/attendance/assign", payload);
        setAssignOpen(false);
        toast("Shifts assigned");
        fetchAttendance();
      } catch (e) { errorBox(e, "Assign failed"); }
    };

    return (
      <div className="attn-modal">
        <div className="attn-modal-card">
          <div className="attn-modal-head">
            <h3>Assign Shifts</h3>
            <button className="attn-x" onClick={()=>setAssignOpen(false)}>×</button>
          </div>
          <div className="attn-modal-body">
            <div className="attn-row">
              <label className="attn-radio">
                <input type="radio" name="mode" checked={mode==="department"} onChange={()=>setMode("department")} />
                <span> By Department</span>
              </label>
              <label className="attn-radio">
                <input type="radio" name="mode" checked={mode==="employees"} onChange={()=>setMode("employees")} />
                <span> Pick Employees</span>
              </label>
            </div>

            {mode === "department" ? (
              <div className="attn-grid">
                <label>
                  Department
                  <select value={dept} onChange={(e)=>setDept(e.target.value)}>
                    <option value="">Select…</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
              </div>
            ) : (
              <div className="attn-grid">
                <label className="span2">
                  Employees (active)
                  <select multiple value={pickedEmployees}
                    onChange={(e)=>setPickedEmployees(Array.from(e.target.selectedOptions).map(o=>o.value))}
                    size={6}>
                    {employees.map(e => (
                      <option key={e._id} value={e._id}>
                        {e.fullName} · {e.department} · {e.designation || "-"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="attn-grid">
              <label>
                Start date
                <input type="date" value={rangeStart} onChange={(e)=>setRangeStart(e.target.value)} />
              </label>
              <label>
                End date
                <input type="date" value={rangeEnd} onChange={(e)=>setRangeEnd(e.target.value)} />
              </label>
              <label className="span2">
                Shift template
                <select value={templateId} onChange={(e)=>setTemplateId(e.target.value)}>
                  <option value="">Select template…</option>
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>
                      {t.name} · {t.startLabel || minutesToAMPM(t.startMinutes)}–{t.endLabel || minutesToAMPM(t.endMinutes)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="attn-modal-foot">
            <button className="hrlist-btn ghost" onClick={()=>setAssignOpen(false)}>Cancel</button>
            <button className="hrlist-btn" disabled={!canSubmit} onClick={handleAssign}>Assign</button>
          </div>
        </div>
      </div>
    );
  };

  /* Shift template CRUD (AM/PM) */
  const createTemplate = async () => {
    const html = `
      <div style="display:grid;gap:10px;text-align:left">
        <label style="display:grid;gap:6px">
          <span class="lbl">Name</span>
          <input id="t-name" class="swal2-input" style="margin:0" placeholder="Morning A" />
        </label>
        <div style="display:grid;gap:10px;grid-template-columns:1fr 1fr">
          <label style="display:grid;gap:6px">
            <span class="lbl">Start (HH:MM AM/PM)</span>
            <input id="t-start" class="swal2-input" style="margin:0" placeholder="08:00 AM" />
          </label>
          <label style="display:grid;gap:6px">
            <span class="lbl">End (HH:MM AM/PM)</span>
            <input id="t-end" class="swal2-input" style="margin:0" placeholder="04:00 PM" />
          </label>
        </div>
      </div>`;
    const res = await MySwal.fire({
      title: "New Shift Template",
      html, showCancelButton: true, confirmButtonText: "Create",
      preConfirm: () => {
        const name = document.getElementById("t-name").value.trim();
        const start = document.getElementById("t-start").value.trim();
        const end   = document.getElementById("t-end").value.trim();
        if (!name || !start || !end) return MySwal.showValidationMessage("All fields required");
        return { name, start, end };
      },
    });
    if (!res.isConfirmed) return;
    try {
      await api.post("/hr/shifts", res.value);
      await loadTemplates();
      toast("Template created");
    } catch (e) { errorBox(e, "Create failed"); }
  };

  const editTemplate = async (tmpl) => {
    const html = `
      <div style="display:grid;gap:10px;text-align:left">
        <label style="display:grid;gap:6px">
          <span class="lbl">Name</span>
          <input id="t-name" class="swal2-input" style="margin:0" value="${(tmpl.name||"").replace(/"/g,"&quot;")}" />
        </label>
        <div style="display:grid;gap:10px;grid-template-columns:1fr 1fr">
          <label style="display:grid;gap:6px">
            <span class="lbl">Start (HH:MM AM/PM)</span>
            <input id="t-start" class="swal2-input" style="margin:0" value="${tmpl.startLabel || minutesToAMPM(tmpl.startMinutes)}" />
          </label>
          <label style="display:grid;gap:6px">
            <span class="lbl">End (HH:MM AM/PM)</span>
            <input id="t-end" class="swal2-input" style="margin:0" value="${tmpl.endLabel || minutesToAMPM(tmpl.endMinutes)}" />
          </label>
        </div>
      </div>`;
    const res = await MySwal.fire({
      title: "Edit Shift Template",
      html, showCancelButton: true, confirmButtonText: "Save",
      preConfirm: () => {
        const name = document.getElementById("t-name").value.trim();
        const start = document.getElementById("t-start").value.trim();
        const end   = document.getElementById("t-end").value.trim();
        if (!name || !start || !end) return MySwal.showValidationMessage("All fields required");
        return { name, start, end };
      },
    });
    if (!res.isConfirmed) return;
    try {
      await api.patch(`/hr/shifts/${tmpl._id}`, res.value);
      await loadTemplates();
      toast("Template updated");
    } catch (e) { errorBox(e, "Update failed"); }
  };

  const deleteTemplate = async (tmpl) => {
    const conf = await MySwal.fire({
      icon: "warning", title: "Delete template?",
      showCancelButton: true, confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626", reverseButtons: true
    });
    if (!conf.isConfirmed) return;
    try {
      await api.delete(`/hr/shifts/${tmpl._id}`);
      await loadTemplates();
      toast("Template deleted");
    } catch (e) { errorBox(e, "Delete failed"); }
  };

  /* UI */
  return (
    <div className="hrlist-wrap">
      <div className="hrlist-card">
        <div className="hrlist-head"><h2>Attendance</h2></div>

        {/* Filters */}
        <div className="hrlist-filters">
          <input className="hrlist-input" placeholder="Search by name/designation…"
            value={search} onChange={(e)=>setSearch(e.target.value)} title="Search" />

          <select className="hrlist-select" value={department} onChange={(e)=>setDepartment(e.target.value)} title="Department">
            <option value="all">All departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select className="hrlist-select" value={employee} onChange={(e)=>{ setEmployee(e.target.value); setPage(1); }} title="Employee">
            <option value="all">{department === "all" ? "All employees" : "All in dept"}</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.fullName}</option>)}
          </select>

          <select className="hrlist-select" value={status} onChange={(e)=>{ setStatus(e.target.value); setPage(1); }} title="Status">
            {STATUS.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
          </select>

          <input className="hrlist-input" type="date" value={dateFrom} onChange={(e)=>{ setDateFrom(e.target.value); setPage(1); }} title="From" />
          <input className="hrlist-input" type="date" value={dateTo} onChange={(e)=>{ setDateTo(e.target.value); setPage(1); }} title="To" />

          <button className="btn-teal" disabled={loading} onClick={()=>{ setPage(1); fetchAttendance(); }}>
            {loading ? "Loading…" : "Search"}
          </button>
        </div>

        {err && <div className="hrlist-error">{err}</div>}

        {/* Attendance table */}
        <div className="hrlist-tablewrap">
          <table className="hrlist-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Shift</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th style={{ width: 210 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="hrlist-empty">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="hrlist-empty">No records</td></tr>
              ) : rows.map(r => (
                <tr key={r._id}>
                  <td>{r.workDate ? new Date(r.workDate).toLocaleDateString() : "-"}</td>
                  <td className="hrlist-name">{r.employee?.fullName || "-"}</td>
                  <td>{r.employee?.department || r.department || "-"}</td>
                  <td>
                    {r.shift?.name
                      ? `${r.shift.name} · ${(r.shift.startLabel || minutesToAMPM(r.shift.startMinutes))}–${(r.shift.endLabel || minutesToAMPM(r.shift.endMinutes))}`
                      : "-"}
                  </td>
                  <td>{r.checkIn ? new Date(r.checkIn).toLocaleString() : "-"}</td>
                  <td>{r.checkOut ? new Date(r.checkOut).toLocaleString() : "-"}</td>
                  <td><span className={`badge ${r.status}`}>{r.status?.replace("_"," ")}</span></td>
                  <td>
                    <div className="attn-actions">
                      <button className="hrlist-btn ghost small" onClick={()=>doEdit(r)}>Edit</button>
                      {!r.checkIn && <button className="hrlist-btn small" onClick={()=>doClockIn(r)}>Clock In</button>}
                      {r.checkIn && !r.checkOut && <button className="hrlist-btn small" onClick={()=>doClockOut(r)}>Clock Out</button>}
                      <button className="hrlist-btn danger small" onClick={()=>doDelete(r)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pager */}
        <div className="hrlist-pager">
          <div className="hrlist-pager-info">Page {page} of {totalPages} • {total} total</div>
          <div className="hrlist-pager-btns">
            <button className="hrlist-btn ghost small" disabled={page <= 1 || loading} onClick={()=>setPage(p => Math.max(1, p - 1))}>← Prev</button>
            <button className="hrlist-btn ghost small" disabled={page >= totalPages || loading} onClick={()=>setPage(p => Math.min(totalPages, p + 1))}>Next →</button>
          </div>
        </div>
      </div>

      {/* Shift Templates panel */}
      {showTemplatesPanel && (
        <div className="hrlist-card" style={{ marginTop: 16 }}>
          <div className="hrlist-head">
            <h3 style={{ margin: 0, color: "#065f46" }}>Shift Templates</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="hrlist-btn" onClick={createTemplate}>+ New</button>
              <button className="hrlist-btn ghost" onClick={loadTemplates} disabled={tmplLoading}>
                {tmplLoading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </div>
          <div className="hrlist-tablewrap">
            <table className="hrlist-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start</th>
                  <th>End</th>
                  <th style={{ width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr><td colSpan={4} className="hrlist-empty">No templates</td></tr>
                ) : templates.map(t => (
                  <tr key={t._id}>
                    <td className="hrlist-name">{t.name}</td>
                    <td>{t.startLabel || minutesToAMPM(t.startMinutes)}</td>
                    <td>{t.endLabel || minutesToAMPM(t.endMinutes)}</td>
                    <td>
                      <div className="attn-actions">
                        <button className="hrlist-btn ghost small" onClick={()=>editTemplate(t)}>Edit</button>
                        <button className="hrlist-btn danger small" onClick={()=>deleteTemplate(t)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign modal */}
      {assignOpen && <AssignModal />}
    </div>
  );
}
