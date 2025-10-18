import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useHRChrome } from "./HRLayout";
import "./Employees.css";
import "./Tasks.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const PRIORITY = ["low", "normal", "high"];
const STATUS = ["open", "in_progress", "blocked", "done"];

// defaults (used if backend not yet implemented)
const DEFAULTS = {
  departments: [
    "Administration",
    "People Ops",
    "Operations",
    "Finance",
    "Product",
    "Greenhouse",
  ],
  taskDefaults: {
    priority: "normal",
    status: "open",
  },
  attendanceDefaults: {
    shiftStart: "08:00 AM",
    shiftEnd: "05:00 PM",
  },
  payroll: {
    payCycle: "monthly", // monthly | biweekly | weekly
    payday: "last_day",  // last_day | 25 | 1 | 15 (string or numeric-like)
    overtimeMultiplier: 1.5,
  },
  notifications: {
    taskAssignedEmail: true,
    taskDueSoonDays: 3,
  },
};

export default function HRSettings() {
  const { setRight, clearRight } = useHRChrome();

  // master state
  const [settings, setSettings] = useState(DEFAULTS);
  const [departments, setDepartments] = useState(DEFAULTS.departments);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // header actions (Save + Back)
  useEffect(() => {
    setRight(
      <div style={{ display: "flex", gap: 8 }}>
        <Link to="/hr" className="hrlist-btn ghost">← Back</Link>
        <button className="hrlist-btn" onClick={saveAll} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    );
    return clearRight;
  }, [setRight, clearRight, saving, settings, departments]);

  const toast = (title) =>
    MySwal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title,
      showConfirmButton: false,
      timer: 1600,
    });

  const errorBox = (e, title = "Error") =>
    MySwal.fire({
      icon: "error",
      title,
      text: e?.response?.data?.message || e.message || "Something failed",
    });

  /* ---------------- load ---------------- */
  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await api.get("/hr/settings");
      const data = res.data?.data || res.data || {};
      const merged = {
        ...DEFAULTS,
        ...data,
        taskDefaults: { ...DEFAULTS.taskDefaults, ...(data.taskDefaults || {}) },
        attendanceDefaults: {
          ...DEFAULTS.attendanceDefaults,
          ...(data.attendanceDefaults || {}),
        },
        payroll: { ...DEFAULTS.payroll, ...(data.payroll || {}) },
        notifications: { ...DEFAULTS.notifications, ...(data.notifications || {}) },
      };
      setSettings(merged);
      setDepartments(merged.departments || DEFAULTS.departments);
    } catch (e) {
      // If endpoint not ready, show defaults but warn non-blocking
      console.warn("Settings load failed, using defaults:", e);
      setSettings(DEFAULTS);
      setDepartments(DEFAULTS.departments);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ---------------- save all ---------------- */
  const saveAll = async () => {
    try {
      setSaving(true);
      const payload = {
        ...settings,
        departments,
      };
      await api.patch("/hr/settings", payload);
      toast("Settings saved");
    } catch (e) {
      errorBox(e, "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ---------------- departments CRUD ---------------- */
  const [newDept, setNewDept] = useState("");

  const addDept = async () => {
    const name = newDept.trim();
    if (!name) return;
    if (departments.includes(name)) {
      return MySwal.fire({ icon: "info", title: "Department already exists" });
    }
    // optimistically add
    setDepartments((d) => [...d, name]);
    setNewDept("");

    try {
      await api.post("/hr/settings/departments", { name });
      toast("Department added");
    } catch (e) {
      // rollback
      setDepartments((d) => d.filter((x) => x !== name));
      errorBox(e, "Add failed");
    }
  };

  const deleteDept = async (name) => {
    const conf = await MySwal.fire({
      icon: "warning",
      title: `Remove "${name}"?`,
      text: "This will not modify existing employees, but it will stop appearing in pickers.",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#dc2626",
      reverseButtons: true,
    });
    if (!conf.isConfirmed) return;

    // optimistic
    const old = departments;
    setDepartments((d) => d.filter((x) => x !== name));
    try {
      await api.delete(`/hr/settings/departments/${encodeURIComponent(name)}`);
      toast("Removed");
    } catch (e) {
      setDepartments(old);
      errorBox(e, "Remove failed");
    }
  };

  /* ---------------- small helpers ---------------- */
  const setTaskDefault = (k, v) =>
    setSettings((s) => ({ ...s, taskDefaults: { ...s.taskDefaults, [k]: v } }));

  const setAttendanceDefault = (k, v) =>
    setSettings((s) => ({
      ...s,
      attendanceDefaults: { ...s.attendanceDefaults, [k]: v },
    }));

  const setPayroll = (k, v) =>
    setSettings((s) => ({ ...s, payroll: { ...s.payroll, [k]: v } }));

  const setNotifications = (k, v) =>
    setSettings((s) => ({
      ...s,
      notifications: { ...s.notifications, [k]: v },
    }));

  // simple time input mask -> "HH:MM AM/PM"
  const normalizeTime = (val) => {
    const v = val.trim().toUpperCase();
    // Accept "8:00", "08:00", "08:00 AM", "8am", etc.
    let hh = 8, mm = 0, ampm = "AM";
    const m = v.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (m) {
      hh = Math.min(12, Math.max(1, parseInt(m[1], 10)));
      mm = Math.min(59, Math.max(0, m[2] ? parseInt(m[2], 10) : 0));
      ampm = m[3] ? m[3].toUpperCase() : (v.includes("PM") ? "PM" : "AM");
    }
    const pad = (n) => (n < 10 ? `0${n}` : String(n));
    return `${pad(hh)}:${pad(mm)} ${ampm}`;
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="hrlist-wrap">
      <div className="hrlist-card">
        <div className="hrlist-head">
          <h2>HR Settings</h2>
          {loading && <div className="hrlist-subtle">Loading…</div>}
        </div>

        {err && <div className="hrlist-error">{err}</div>}

        {/* Task defaults */}
        <section className="hrlist-section">
          <h3 style={{ marginTop: 0 }}>Task defaults</h3>
          <div className="hrlist-grid2">
            <label>
              Default priority
              <select
                value={settings.taskDefaults.priority}
                onChange={(e) => setTaskDefault("priority", e.target.value)}
              >
                {PRIORITY.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Default status
              <select
                value={settings.taskDefaults.status}
                onChange={(e) => setTaskDefault("status", e.target.value)}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="hrlist-hint">
            These apply when creating new tasks (can still be changed per task).
          </div>
        </section>

        {/* Attendance defaults */}
        <section className="hrlist-section" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Attendance defaults</h3>
          <div className="hrlist-grid2">
            <label>
              Default shift start (HH:MM AM/PM)
              <input
                value={settings.attendanceDefaults.shiftStart}
                onChange={(e) =>
                  setAttendanceDefault("shiftStart", normalizeTime(e.target.value))
                }
                placeholder="08:00 AM"
              />
            </label>
            <label>
              Default shift end (HH:MM AM/PM)
              <input
                value={settings.attendanceDefaults.shiftEnd}
                onChange={(e) =>
                  setAttendanceDefault("shiftEnd", normalizeTime(e.target.value))
                }
                placeholder="05:00 PM"
              />
            </label>
          </div>
          <div className="hrlist-hint">
            Used when creating new shift templates or quick-assigning shifts.
          </div>
        </section>

        {/* Payroll basics */}
        <section className="hrlist-section" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Payroll basics</h3>
          <div className="hrlist-grid3">
            <label>
              Pay cycle
              <select
                value={settings.payroll.payCycle}
                onChange={(e) => setPayroll("payCycle", e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
            <label>
              Payday
              <select
                value={settings.payroll.payday}
                onChange={(e) => setPayroll("payday", e.target.value)}
              >
                <option value="last_day">Last day of month</option>
                <option value="1">1</option>
                <option value="15">15</option>
                <option value="25">25</option>
              </select>
            </label>
            <label>
              Overtime multiplier
              <input
                type="number"
                min={1}
                step="0.1"
                value={settings.payroll.overtimeMultiplier}
                onChange={(e) =>
                  setPayroll("overtimeMultiplier", Number(e.target.value))
                }
              />
            </label>
          </div>
          <div className="hrlist-hint">
            These are used as defaults when creating new pay runs.
          </div>
        </section>

        {/* Notifications */}
        <section className="hrlist-section" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Notifications</h3>
          <div className="hrlist-grid2">
            <label className="hrlist-switch">
              <input
                type="checkbox"
                checked={!!settings.notifications.taskAssignedEmail}
                onChange={(e) =>
                  setNotifications("taskAssignedEmail", e.target.checked)
                }
              />
              <span>Email on task assignment</span>
            </label>
            <label>
              Remind about due tasks (days before)
              <input
                type="number"
                min={0}
                step="1"
                value={settings.notifications.taskDueSoonDays}
                onChange={(e) =>
                  setNotifications("taskDueSoonDays", Number(e.target.value))
                }
              />
            </label>
          </div>
        </section>

        {/* Departments */}
        <section className="hrlist-section" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Departments</h3>
          <div className="hrlist-gridAdd">
            <input
              placeholder="Add department…"
              value={newDept}
              onChange={(e) => setNewDept(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDept()}
            />
            <button className="hrlist-btn" onClick={addDept}>
              + Add
            </button>
          </div>

          <div className="hrlist-tablewrap" style={{ marginTop: 10 }}>
            <table className="hrlist-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="hrlist-empty">
                      No departments
                    </td>
                  </tr>
                ) : (
                  departments.map((d) => (
                    <tr key={d}>
                      <td className="hrlist-name">{d}</td>
                      <td>
                        <button
                          className="hrlist-btn danger small"
                          onClick={() => deleteDept(d)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="hrlist-hint">
              Removing a department won’t alter existing employee records.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
