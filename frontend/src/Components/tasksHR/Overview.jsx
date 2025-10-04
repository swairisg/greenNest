// frontend/src/Components/tasksHR/Overview.jsx
import React from "react";
export default function HROverview() {
  const stats = { employees: 6, tasksDueToday: 4, overdueTasks: 2, presentToday: 5, payrollStatus: "Oct • Draft", perfCyclesOpen: 1 };
  const Card = ({ title, value }) => (
    <div style={{ padding: 16, borderRadius: 16, background: "#fff", border: "1px solid #e5e7eb",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#065f46" }}>{value}</div>
    </div>
  );
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: 22, color: "#065f46" }}>HR Overview</h1>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Card title="Employees" value={stats.employees} />
        <Card title="Tasks — Due Today" value={stats.tasksDueToday} />
        <Card title="Tasks — Overdue" value={stats.overdueTasks} />
        <Card title="Attendance — Present" value={stats.presentToday} />
        <Card title="Payroll" value={stats.payrollStatus} />
        <Card title="Performance Cycles" value={stats.perfCyclesOpen} />
      </div>
      <div style={{ padding: 16, borderRadius: 16, background: "#fff", border: "1px solid #e5e7eb" }}>
        <div style={{ fontWeight: 700, color: "#065f46", marginBottom: 8 }}>Charts (coming soon)</div>
        <div style={{ color: "#6b7280" }}>Tasks by status, Attendance last 14 days, Hours by department…</div>
      </div>
    </div>
  );
}
