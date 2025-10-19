import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Pie, Bar, Line } from "react-chartjs-2";
import "chart.js/auto";
import "./PestDetectDashboard.css";
import { API_BASE } from "../../../api";

const API_URL = `${API_BASE}/users`;

// --- helpers to read fields safely from variable backend shapes ---
const getDate = (r) =>
  r.date_identified || r.date || r.reportedAt || r.detectedAt || r.createdAt || r.timestamp;

const getSeverity = (r) =>
  (r.severity_level || r.severity || "").toString().trim().toLowerCase();

const getCrop = (r) =>
  (r.crop || r.cropType || "Unknown").toString().trim();

const toYMD = (d) => new Date(d).toISOString().slice(0, 10);

function PestDetectDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState("");     // yyyy-mm-dd
  const [severity, setSeverity] = useState("");   // "", "low" | "medium" | "high" | "critical"
  const [crop, setCrop] = useState("");

  // load once
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        const data = Array.isArray(res.data) ? res.data : (res.data?.users || []);
        if (mounted) setRecords(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setErr(e?.message || "Failed to load pest records");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // dropdown crop options
  const cropOptions = useMemo(() => {
    const s = new Set();
    records.forEach((r) => {
      const c = getCrop(r);
      if (c) s.add(c);
    });
    return Array.from(s);
  }, [records]);

  // date helpers
  const toStart = (s) => {
    if (!s) return null;
    const d = new Date(s); d.setHours(0,0,0,0);
    return isNaN(d) ? null : d;
  };
  const toEnd = (s) => {
    if (!s) return null;
    const d = new Date(s); d.setHours(23,59,59,999);
    return isNaN(d) ? null : d;
  };

  // apply filters
  const filtered = useMemo(() => {
    const s = toStart(startDate);
    const e = toEnd(endDate);
    const sev = (severity || "").toLowerCase();
    const cropKey = (crop || "").toLowerCase();

    return records.filter((r) => {
      const when = new Date(getDate(r));
      const okDate = (!s || when >= s) && (!e || when <= e);

      const recSev = getSeverity(r);
      const okSev = !sev || recSev === sev;

      const recCrop = getCrop(r).toLowerCase();
      const okCrop = !cropKey || recCrop === cropKey;

      return okDate && okSev && okCrop;
    });
  }, [records, startDate, endDate, severity, crop]);

  // KPIs
  const totalReports = filtered.length;
  const highSeverityReports = filtered.filter((r) => getSeverity(r) === "high").length;
  const uniqueCrops = useMemo(() => new Set(filtered.map(getCrop)).size, [filtered]);
  const openTreatments = filtered.filter((r) => !r.pesticide).length;

  // PIE: only Low/Medium/High/Critical
  const pieCounts = useMemo(() => {
    const acc = { low: 0, moderate: 0, high: 0, critical: 0 };
    filtered.forEach((r) => {
      const k = getSeverity(r);
      if (k in acc) acc[k] += 1;
    });
    return acc;
  }, [filtered]);

  const pieData = useMemo(() => ({
    labels: ["Low", "Moderate", "High", "Critical"],
    datasets: [{
      label: "Reports",
      data: [pieCounts.low, pieCounts.moderate, pieCounts.high, pieCounts.critical],
    }],
  }), [pieCounts]);

  // BAR: aggregate per unique crop (one bar per crop)
  const cropCounts = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const key = getCrop(r);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return { labels: Array.from(map.keys()), data: Array.from(map.values()) };
  }, [filtered]);

  const barData = useMemo(() => ({
    labels: cropCounts.labels,
    datasets: [{ label: "Reports per crop", data: cropCounts.data }],
  }), [cropCounts]);

  // LINE: last 30 days trend
  const trendData = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(toYMD(d));
    }
    const counts = Object.fromEntries(days.map(d => [d, 0]));
    filtered.forEach((r) => {
      const key = toYMD(getDate(r) ? new Date(getDate(r)) : new Date());
      if (counts[key] != null) counts[key] += 1;
    });
    return {
      labels: days,
      datasets: [{ label: "Reports (last 30 days)", data: days.map(d => counts[d]) }],
    };
  }, [filtered]);

  // TOP CROPS list
  const topCrops = useMemo(() => {
    const map = new Map();
    filtered.forEach((r) => {
      const c = getCrop(r);
      map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5
  }, [filtered]);

  // Recent (5)
  const recent = useMemo(() => {
    const clone = [...filtered];
    clone.sort((a, b) => new Date(getDate(b)) - new Date(getDate(a)));
    return clone.slice(0, 5);
  }, [filtered]);

  // Calendar map
  const eventsByDay = useMemo(() => {
    const map = new Map(); // yyyy-mm-dd -> count
    filtered.forEach((r) => {
      const d = new Date(getDate(r));
      if (!isNaN(d)) {
        const key = toYMD(d);
        map.set(key, (map.get(key) || 0) + 1);
      }
    });
    return map;
  }, [filtered]);

  // current month grid
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const weeks = [];
  let day = 1 - firstDay;
  for (let w = 0; w < 6; w++) {
    const row = [];
    for (let d = 0; d < 7; d++) {
      if (day < 1 || day > daysInMonth) row.push(null);
      else row.push(day);
      day++;
    }
    weeks.push(row);
  }

  // Export CSV of filtered
  const exportCSV = () => {
    const cols = [
      "id", "date_identified", "crop", "symptoms", "severity",
      "pesticide", "application_method", "dosage", "treatment_date"
    ];
    const rows = filtered.map(u => ([
      u._id || "",
      toYMD(getDate(u) || new Date()),
      getCrop(u),
      (u.symptoms || "").toString().replace(/\s+/g," ").trim(),
      getSeverity(u),
      u.pesticide || "",
      u.application_method || "",
      u.dosage || "",
      u.treatment_date ? toYMD(u.treatment_date) : ""
    ]));
    const csv = [cols.join(","), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "pest_reports.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="pd-container">Loading…</div>;
  if (err) return <div className="pd-container">Error: {err}</div>;

  return (
    <div className="pd-container">
      {/* Header + Quick Actions */}
      <header className="pd-header glass">
        <div>
          <h1 className="pd-title">Pest Detection Dashboard</h1>
          <p className="pd-sub">Operational overview, trends & alerts</p>
        </div>
        <div className="pd-actions">
          <Link to="/pests/farmer" className="pd-btn pd-btn-primary">+ Report Pest</Link>
          <Link to="/PestDetectDisplay" className="pd-btn pd-btn--ghost">View All</Link>
          <Link to="/pests/ai" className="pd-btn pd-btn--ghost">🔎Scan for Pests</Link>
        </div>
      </header>

      {/* Filters */}
      <section className="pd-section glass">
        <h2 className="pd-h2">Filters</h2>
        <div className="pd-filters">
          <div className="pd-filter">
            <label>From</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="pd-filter">
            <label>To</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="pd-filter">
            <label>Severity</label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="pd-filter">
            <label>Crop</label>
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              <option value="">All</option>
              {cropOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* KPI cards */}
      <section className="pd-grid-4">
        <div className="pd-card glass pd-kpi">
          <div className="pd-kpi-icon">📈</div>
          <div className="pd-kpi-title">Total Reports</div>
          <div className="pd-kpi-value">{totalReports}</div>
        </div>
        <div className="pd-card glass pd-kpi">
          <div className="pd-kpi-title">High Severity</div>
          <div className="pd-kpi-value">{highSeverityReports}</div>
        </div>
        <div className="pd-card glass pd-kpi">
          <div className="pd-kpi-title">Unique Crops</div>
          <div className="pd-kpi-value">{uniqueCrops}</div>
        </div>
        <div className="pd-card glass pd-kpi">
          <div className="pd-kpi-title">Open Treatments</div>
          <div className="pd-kpi-value">{openTreatments}</div>
        </div>
      </section>

      {/* Charts row 1: Pie + Bar */}
      <section className="pd-grid-2">
        <div className="pd-card glass">
          <div className="pd-card-head"><h3>Severity Distribution</h3></div>
          <div className="pd-chart"><Pie data={pieData} /></div>
        </div>
        <div className="pd-card glass">
          <div className="pd-card-head"><h3>Reports per Crop</h3></div>
          <div className="pd-chart"><Bar data={barData} /></div>
        </div>
      </section>

      {/* Charts row 2: 30-day trend + Top crops table */}
      <section className="pd-grid-2">
        <div className="pd-card glass">
          <div className="pd-card-head"><h3>30-Day Trend</h3></div>
          <div className="pd-chart"><Line data={trendData} /></div>
        </div>

        <div className="pd-card glass">
          <div className="pd-card-head"><h3>Top Crops</h3></div>
          <div className="pd-table-wrap">
            <table className="pd-table">
              <thead>
                <tr><th>Crop</th><th className="right">Reports</th></tr>
              </thead>
              <tbody>
                {topCrops.length === 0 && (
                  <tr><td colSpan="2" className="pd-empty">No data</td></tr>
                )}
                {topCrops.map(([name, count]) => (
                  <tr key={name}>
                    <td>{name}</td>
                    <td className="right">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Recent Records */}
      <section className="pd-card glass">
        <div className="pd-card-head"><h3>Recent Activity</h3></div>
        <div className="pd-recent">
          {recent.length === 0 && <div className="pd-empty">No recent records.</div>}
          {recent.map((u, i) => (
            <div key={i} className="pd-recent-item">
              <div className="pd-recent-title">
                {getCrop(u)} — <span className={`sev sev--${getSeverity(u)}`}>{(getSeverity(u) || "n/a").toUpperCase()}</span>
              </div>
              <div className="pd-recent-meta">{new Date(getDate(u) || Date.now()).toLocaleString()}</div>
              <div className="pd-recent-desc">{u.symptoms || u.notes || u.description || "-"}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Compact Calendar */}
      <section className="pd-card glass">
        <div className="pd-card-head">
          <h3>Calendar</h3>
          <div className="pd-muted">
            {today.toLocaleString("default", { month: "long" })} {year}
          </div>
        </div>

        <div className="pd-calendar pd-calendar--compact">
          <div className="pd-cal-row pd-cal-head">
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
              <div key={d} className="pd-cal-cell">{d}</div>
            ))}
          </div>

          {weeks.map((row, ri) => (
            <div key={ri} className="pd-cal-row">
              {row.map((num, ci) => {
                if (num === null) return <div key={ci} className="pd-cal-cell pd-cal-empty" />;
                const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(num).padStart(2, "0")}`;
                const count = eventsByDay.get(key) || 0;
                return (
                  <div key={ci} className="pd-cal-cell">
                    <div className="pd-cal-day">{num}</div>
                    {count > 0 && <div className="pd-cal-dot" title={`${count} event(s)`} />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Alerts */}
      <section className="pd-card glass">
        <div className="pd-card-head"><h3>Alerts: High severity</h3></div>
        <div className="pd-alerts">
          {filtered.filter((r) => getSeverity(r) === "high").map((r, i) => (
            <div key={i} className="pd-alert">
              <span className="pd-badge">HIGH</span>
              <div className="pd-alert-text">
                <strong>{getCrop(r)}</strong> — {r.location || r.section || "Unknown Area"}
                <div className="pd-muted">
                  {new Date(getDate(r) || Date.now()).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {filtered.filter((r) => getSeverity(r) === "high").length === 0 && (
            <div className="pd-empty">No high severity alerts 🎉</div>
          )}
        </div>
      </section>
    </div>
  );
}

export default PestDetectDashboard;
