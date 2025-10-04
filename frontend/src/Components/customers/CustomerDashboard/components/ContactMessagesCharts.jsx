import React, { useMemo } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title
);

/* ---------- helpers ---------- */
const normalize = (v) => String(v ?? "").trim().toLowerCase();

/** Treat a set of common “done” statuses as replied */
function isRepliedStatus(s) {
  const x = normalize(s);
  return x === "replied" || x === "reply" || x === "resolved" || x === "done";
}

/** Build YYYY-MM-DD -> count (createdAt) */
function groupByDay(rows = []) {
  const m = new Map();
  rows.forEach((r) => {
    const d = r?.createdAt ? new Date(r.createdAt) : null;
    if (!d || Number.isNaN(d.getTime())) return;
    const key = d.toISOString().slice(0, 10);
    m.set(key, (m.get(key) || 0) + 1);
  });
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export default function ContactMessagesCharts({ rows = [], titleSuffix = "" }) {
  /* ---------- stats ---------- */
  const stats = useMemo(() => {
    const total = rows.length;
    const replied = rows.reduce((n, r) => n + (isRepliedStatus(r?.status) ? 1 : 0), 0);
    const pending = Math.max(0, total - replied);
    return { total, replied, pending };
  }, [rows]);

  const dayPairs = useMemo(() => groupByDay(rows), [rows]);

  /* ---------- chart data ---------- */
  const donutData = useMemo(
    () => ({
      labels: ["Pending", "Replied"],
      datasets: [
        {
          label: "Messages",
          data: [stats.pending, stats.replied],
          // optional colors (match your existing palette if you want)
          backgroundColor: ["#36A2EB", "#FF6384"],
          borderColor: "#ffffff",
          borderWidth: 2,
        },
      ],
    }),
    [stats]
  );

  const barData = useMemo(
    () => ({
      labels: dayPairs.map(([d]) => d),
      datasets: [
        {
          label: "Messages per day",
          data: dayPairs.map(([, n]) => n),
          backgroundColor: "rgba(54,162,235,0.4)",
          borderColor: "rgba(54,162,235,1)",
          borderWidth: 1,
        },
      ],
    }),
    [dayPairs]
  );

  /* ---------- chart options (compact, no clipping) ---------- */
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false, // allow CSS container to control height
    cutout: "58%",              // donut thickness
    layout: { padding: 10 },
    plugins: {
      legend: { position: "top" },
      title: { display: false },
      tooltip: { enabled: true },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 10 },
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
      x: { grid: { display: false } },
    },
  };

  return (
    <section className="vb-charts contact-charts">
      <div className="vb-card" style={{ height: 300 }}>
        <div className="vb-card-head">
          <h3>Contact Messages — Status Breakdown {titleSuffix}</h3>
          <div className="vb-sub">Total: {stats.total}</div>
        </div>
        <div style={{ height: "240px" }}>
          <Doughnut data={donutData} options={donutOptions} />
        </div>
      </div>

      <div className="vb-card" style={{ height: 320 }}>
        <div className="vb-card-head">
          <h3>Contact Messages by Created Date {titleSuffix}</h3>
        </div>
        <div style={{ height: "260px" }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </section>
  );
}
