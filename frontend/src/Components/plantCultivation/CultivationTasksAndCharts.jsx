import React, { useEffect, useState } from "react";
import api from "../../api";
import "./pc.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const MySwal = withReactContent(Swal);

// Pastel/light palette (your updated colors)
const COLORS = ["#86b9f8ff", "#7bddafff", "#ffe896ff", "#fba7d7ff", "#a3b3f3ff", "#8cf8b2ff", "#fcd34d"];

export default function CultivationTasksAndCharts() {
  const [m, setM] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/plant-cultivation/metrics");
      setM(data?.data || null);
    } catch (e) {
      console.error(e);
      MySwal.fire({ icon: "error", title: "Failed to load", text: e?.response?.data?.message || e.message });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "—");

  // helpers
  const norm = (arr) => (arr || []).map((x, i) => ({ name: String(x._id ?? "—"), count: x.count, i }));
  const ensure = (v) => (Array.isArray(v) ? v : []);

  // KPI cards
  const kpi = [
    { label: "Overdue Tasks", value: m?.tasks?.overdue ?? 0 },
    { label: "Seeds Expiring (30d)", value: m?.seeds?.expiringSoon ?? 0 },
    { label: "Active Plans", value: m?.plans?.active ?? 0 },
    { label: "Growth Logs Today", value: m?.growth?.today ?? 0 },
  ];

  return (
    <div className="pc-page" data-module="seeds">
      <div className="pc-header">
        <div>
          <h2 className="pc-title">Cultivation Tasks & Analytics</h2>
          <p className="pc-sub">One place to see tasks and trends across Seeds, Land Prep, Planting Plans, and Growth.</p>
        </div>
        <div>
          <button className="pc-btn" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="pc-card">
        <div className="kpi-grid">
          {kpi.map((k) => (
            <div key={k.label} className="kpi">
              <div className="kpi-value">{k.value}</div>
              <div className="kpi-label">{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts grid (uses your palette) */}
      <div className="pc-card">
        <div className="chart-grid">
          {/* Land prep activity (60d) */}
          <div className="chart-card">
            <h4 className="chart-title">Land Prep Activity (last 60 days)</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={norm(m?.land?.activity)}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[0]} /> {/* light blue from your palette */}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Growth stages distribution */}
          <div className="chart-card">
            <h4 className="chart-title">Growth Stages</h4>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={norm(m?.growth?.stages)} dataKey="count" nameKey="name" outerRadius={130} label>
                  {ensure(m?.growth?.stages).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Plans by Section */}
          <div className="chart-card">
            <h4 className="chart-title">Plans by Section</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={norm(m?.plans?.bySection)}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill={COLORS[1]} /> {/* mint from your palette */}
              </BarChart>
            </ResponsiveContainer>
          </div>

      {/* Seeds by Unit — Donut */}
<div className="chart-card">
  <h4 className="chart-title">Seed Batches by Unit</h4>
  <ResponsiveContainer width="100%" height={280}>
    <PieChart>
      {/* donut: innerRadius < outerRadius */}
      <Pie
        data={norm(m?.seeds?.byUnit)}
        dataKey="count"
        nameKey="name"
        innerRadius={50}
        outerRadius={110}
        label
      >
        {ensure(m?.seeds?.byUnit).map((_, i) => (
          <Cell key={i} fill={COLORS[i % COLORS.length]} />
        ))}
      </Pie>
      {/* center label (total) */}
      {(() => {
        const total = (m?.seeds?.byUnit || []).reduce((acc, x) => acc + (x.count || 0), 0);
        return (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fontSize: 14, fontWeight: 700, fill: "#374151" }}
          >
            {total} total
          </text>
        );
      })()}
      <Tooltip />
      <Legend />
    </PieChart>
  </ResponsiveContainer>
</div>

        </div>
        <div className="chart-foot">
          Updated: {m?.generatedAt ? new Date(m.generatedAt).toLocaleString() : "—"}
        </div>
      </div>

      {/* Top tasks table */}
      <div className="pc-card">
        <h3 className="pc-card-title">Upcoming Tasks</h3>
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead>
              <tr>
                <th>Module</th><th>Title</th><th>Section</th><th>Due</th><th>Priority</th><th>Status</th><th>Assigned</th>
              </tr>
            </thead>
            <tbody>
              {!m || !m.tasks || m.tasks.top?.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="pc-empty">
                      <div className="pc-empty-title">No tasks</div>
                    </div>
                  </td>
                </tr>
              ) : (
                m.tasks.top.map((t) => (
                  <tr key={t._id}>
                    <td>{t.module}</td>
                    <td title={t.description || ""}>{t.title}</td>
                    <td>{t.section || "—"}</td>
                    <td>{fmt(t.dueDate)}</td>
                    <td><span className={`badge ${t.priority}`}>{t.priority}</span></td>
                    <td><span className={`badge ${t.status}`}>{t.status}</span></td>
                    <td>{t.assignedTo || "—"}</td>
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
