import React, { useMemo } from "react";
import "chart.js/auto";
import { Bar, Doughnut } from "react-chartjs-2";
import "./VisitBookingChart.css";


export default function VisitBookingsChart({ rows = [], titleSuffix = "" }) {
  const { statusData, dateData } = useMemo(() => {
    const statusCounts = { new: 0, approved: 0 };
    for (const r of rows) {
      const raw = String(r?.status || "").toLowerCase();
      const normalized = raw === "confirmed" ? "approved" : raw === "pending" ? "new" : raw;
      if (normalized === "approved") statusCounts.approved += 1;
      else statusCounts.new += 1;
    }

    const byDate = new Map();
    for (const r of rows) {
      if (!r?.preferredDate) continue;
      const d = new Date(r.preferredDate);
      if (Number.isNaN(d.getTime())) continue;
      const key = d.toISOString().slice(0, 10);
      byDate.set(key, (byDate.get(key) || 0) + 1);
    }
    const dateLabels = Array.from(byDate.keys()).sort();
    const dateValues = dateLabels.map((k) => byDate.get(k));

    return {
      statusData: {
        labels: ["New", "Approved"],
        datasets: [
          {
            label: "Bookings",
            data: [statusCounts.new, statusCounts.approved],
          },
        ],
      },
      dateData: {
        labels: dateLabels,
        datasets: [
          {
            label: "Bookings per day",
            data: dateValues,
          },
        ],
      },
    };
  }, [rows]);

  const doughnutOpts = {
    responsive: true,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { enabled: true },
      title: { display: true, text: `Status Breakdown ${titleSuffix}`.trim() },
    },
  };

  const barOpts = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
      title: { display: true, text: `Bookings by Preferred Date ${titleSuffix}`.trim() },
    },
    scales: {
      x: { ticks: { autoSkip: true, maxRotation: 0 }, grid: { display: false } },
      y: { beginAtZero: true, precision: 0 },
    },
  };

  return (
    <div className="vbch-wrap">
      <div className="vbch-grid">
        <div className="vbch-card">
          <Doughnut data={statusData} options={doughnutOpts} />
        </div>
        <div className="vbch-card">
          <Bar data={dateData} options={barOpts} />
        </div>
      </div>
    </div>
  );
}
