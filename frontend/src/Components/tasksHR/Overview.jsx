// frontend/src/Components/tasksHR/Overview.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./Employees.css";
import "./Tasks.css";
import "./Overview.css";

import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";

const COLORS = ["#10b981","#34d399","#06b6d4","#60a5fa","#f59e0b","#ef4444","#a78bfa"];
const STATUS = ["open", "in_progress", "blocked", "done"];
const PRIORITY = ["low", "normal", "high"];

export default function HROverview() {
  const [emps, setEmps] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [attn, setAttn] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;

    const load = async () => {
      setErr("");
      setLoading(true);
      try {
        // Employees — explicitly request active & non-deleted, accept both {data} and {rows}
        const eResp = await api.get("/hr/employees", {
          params: { page: 1, pageSize: 5000, status: "active", includeDeleted: "false" },
        });
        let empList =
          (Array.isArray(eResp.data?.data) && eResp.data.data) ||
          (Array.isArray(eResp.data?.rows) && eResp.data.rows) ||
          [];
        // extra guard: drop any soft-deleted that may slip through
        empList = empList.filter(e => !e?.isDeleted);

        // Tasks
        const tResp = await api.get("/hr/tasks", { params: { page: 1, pageSize: 2000 } });
        const taskList = tResp.data?.data || tResp.data?.rows || [];

        // Attendance (last 14 days)
        const from = new Date();
        from.setDate(from.getDate() - 13);
        const dateFrom = from.toISOString().slice(0, 10);
        const aResp = await api.get("/hr/attendance", {
          params: { dateFrom, page: 1, pageSize: 5000 },
        });
        const attnList = aResp.data?.data || aResp.data?.rows || [];

        if (!live) return;
        setEmps(empList);
        setTasks(taskList);
        setAttn(attnList);

        // Nudge Recharts so it measures container sizes after mount
        requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      } catch (e) {
        if (!live) return;
        console.error(e);
        setErr(e?.response?.data?.message || e.message || "Failed to load overview data");
      } finally {
        if (live) setLoading(false);
      }
    };

    load();
    return () => { live = false; };
  }, []);

  // Employees by department -> [{ dept, count }]
  const employeesByDept = useMemo(() => {
    if (!Array.isArray(emps) || emps.length === 0) return [];
    const counts = new Map();
    for (const e of emps) {
      const dept = e?.department || "Unassigned";
      counts.set(dept, (counts.get(dept) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([dept, count]) => ({ dept, count }));
  }, [emps]);

  const tasksByStatus = useMemo(() => {
    const map = Object.fromEntries(STATUS.map(s => [s, 0]));
    tasks.forEach(t => { map[t.status] = (map[t.status] || 0) + 1; });
    return STATUS.map(s => ({ name: s.replace("_", " "), value: map[s] || 0 }));
  }, [tasks]);

  const tasksByPriority = useMemo(() => {
    const map = Object.fromEntries(PRIORITY.map(p => [p, 0]));
    tasks.forEach(t => { map[t.priority] = (map[t.priority] || 0) + 1; });
    return PRIORITY.map(p => ({ name: p, value: map[p] || 0 }));
  }, [tasks]);

  const attendanceByDay = useMemo(() => {
    const days = [];
    const d = new Date();
    d.setHours(0,0,0,0);
    for (let i = 13; i >= 0; i--) {
      const dd = new Date(d);
      dd.setDate(d.getDate() - i);
      days.push(dd.toISOString().slice(0,10));
    }
    const map = Object.fromEntries(days.map(k => [k, 0]));
    attn.forEach(r => {
      const k = r.workDate ? new Date(r.workDate).toISOString().slice(0,10) : null;
      if (k && map[k] !== undefined && r.checkIn) map[k] += 1;
    });
    return days.map(k => ({ date: k, checkIns: map[k] }));
  }, [attn]);

  const kpis = useMemo(() => {
    const headcount = emps.length;
    const activeTasks = tasks.filter(t => t.status !== "done").length;
    const doneTasks = tasks.filter(t => t.status === "done").length;
    const completionRate = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
    const lateCount = attn.filter(r => {
      if (!r.checkIn) return false;
      const dt = new Date(r.checkIn);
      const h = dt.getHours(), m = dt.getMinutes();
      return h > 9 || (h === 9 && m > 15);
    }).length;
    return { headcount, activeTasks, completionRate, lateCount };
  }, [emps, tasks, attn]);

  return (
    <div className="hrlist-wrap">
      <div className="hrlist-card">
        <div className="hrlist-head">
          <h2>Overview</h2>
        </div>

        {err && <div className="hrlist-error">{err}</div>}
        {loading && <div className="hrlist-empty" style={{ padding: 24 }}>Loading…</div>}

        {!loading && (
          <div className="overview-gap">
            <div className="kpi-grid">
              <KPI title="Headcount" value={kpis.headcount} />
              <KPI title="Active tasks" value={kpis.activeTasks} />
              <KPI title="Completion rate" value={`${kpis.completionRate}%`} />
              <KPI title="Late check-ins (14d)" value={kpis.lateCount} />
            </div>

            <div className="chart-grid">
              <div className="chart-card">
                <div className="chart-head">
                  <h3 className="chart-title">Employees by Department</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={employeesByDept}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dept" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count">
                        {employeesByDept.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-head">
                  <h3 className="chart-title">Tasks by Status</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Legend />
                      <Pie
                        data={tasksByStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="35%"
                        outerRadius="65%"
                        label
                      >
                        {tasksByStatus.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-head">
                  <h3 className="chart-title">Tasks by Priority</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tasksByPriority}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value">
                        {tasksByPriority.map((_, i) => (
                          <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="chart-card">
                <div className="chart-head">
                  <h3 className="chart-title">Attendance: Check-ins (last 14 days)</h3>
                </div>
                <div className="chart-body">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attendanceByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="checkIns" stroke="#10b981" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ title, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{title}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}
