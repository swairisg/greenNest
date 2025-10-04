// src/pages/dashboards/AdminOverview.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Admin.css";

// —— tiny sparkline (no libs)
function Spark({ points = [] }) {
  if (!points.length) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const norm = (v) => 30 - ((v - min) / Math.max(1, max - min)) * 30; // 0..30 -> up is bigger
  const step = 100 / (points.length - 1);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step},${norm(v)}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="gn-spark">
      <path d={d} fill="none" strokeWidth="2" />
    </svg>
  );
}

function Stat({ label, value, suffix, trend }) {
  return (
    <div className="gn-stat">
      <div className="gn-stat-top">
        <div className="gn-stat-label">{label}</div>
        <div className="gn-stat-value">
          {value}
          {suffix ? <span className="gn-muted"> {suffix}</span> : null}
        </div>
      </div>
      {trend?.length ? <Spark points={trend} /> : <div className="gn-spark gn-skeleton" />}
    </div>
  );
}

function Card({ title, to, children, action = "Open" }) {
  return (
    <div className="gn-card">
      <div className="gn-card-head">
        <h3>{title}</h3>
        {!!to && (
          <Link to={to} className="gn-btn sm">
            {action}
          </Link>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function AdminOverview() {
  // —— mock slices (replace with real API calls later)
  const [data, setData] = useState({
    planting: { cropsReady: 500, growthTrend: [10, 18, 26, 40, 52, 68, 74] },
    climate: { temp: 18, humidity: 70, soil: 55, trend: [14, 16, 19, 18, 17, 18, 18] },
    pests: { alerts: [{ id: 1, text: "Aphids in Strawberry Patch 3" }] },
    harvest: { dueThisWeek: 42, completed: 18, trend: [5, 8, 12, 19, 23, 33, 42] },
    quality: { passed: 92, rejected: 8 },
    hr: { completed: 12, inProgress: 5, pending: 3 },
    inventory: { low: 4, fulfillment: 80, trend: [60, 62, 70, 65, 78, 81, 80] },
    catalog: { active: 36, hidden: 4 },
    sales: { orders: 58, revenue: 245000, trend: [5, 12, 22, 28, 35, 46, 58] },
    customers: { newThisWeek: 9, total: 240 }
  });

  // example place to fetch:
  useEffect(() => {
    // TODO (each owner plugs their endpoint)
    // fetch(`${API_BASE}/harvest/summaries`).then(...)
  }, []);

  return (
    <div className="gn-wrap">
      <header className="gn-topbar">
        <div className="gn-brand">
          <span className="gn-logo">🌿</span>
          <span className="gn-title">GreenNest</span>
        </div>
        <input className="gn-search" placeholder="Search…" />
        <div className="gn-user">Admin ▾</div>
      </header>

      <div className="gn-grid kpis">
        {/* 1. Planting & Growth */}
        <Card title="Planting & Growth" to="/planting">
          <Stat label="Crops Ready" value={data.planting.cropsReady} />
          <Stat label="Growth Trend" value="Last 7d" suffix="" trend={data.planting.growthTrend} />
        </Card>

        {/* 2. Climate Ops */}
        <Card title="Climate" to="/climate">
          <div className="gn-3cols">
            <Stat label="Temp" value={`${data.climate.temp}°C`} trend={data.climate.trend} />
            <Stat label="Humidity" value={`${data.climate.humidity}%`} />
            <Stat label="Soil Moist." value={`${data.climate.soil}%`} />
          </div>
        </Card>

        {/* 3. Disease & Pests */}
        <Card title="Disease & Pests" to="/pests">
          <ul className="gn-list">
            {data.pests.alerts.map((a) => (
              <li key={a.id}>⚠️ {a.text}</li>
            ))}
          </ul>
        </Card>

        {/* 4. Harvest Management */}
        <Card title="Harvest" to="/harvest">
          <div className="gn-2cols">
            <Stat label="Due This Week" value={data.harvest.dueThisWeek} trend={data.harvest.trend} />
            <Stat label="Completed" value={data.harvest.completed} />
          </div>
        </Card>

        {/* 5. Quality Control & Products */}
        <Card title="Quality Control" to="/quality">
          <div className="gn-2cols">
            <Stat label="Passed" value={`${data.quality.passed}%`} />
            <Stat label="Rejected" value={`${data.quality.rejected}%`} />
          </div>
        </Card>

        {/* 6. HR & Task Management */}
        <Card title="HR & Tasks" to="/hr">
          <ul className="gn-badges">
            <li className="ok">Completed {data.hr.completed}</li>
            <li className="warn">In Progress {data.hr.inProgress}</li>
            <li className="muted">Pending {data.hr.pending}</li>
          </ul>
        </Card>

        {/* 7. Inventory, Logistics & Supply */}
        <Card title="Inventory & Supply" to="/inventory">
          <div className="gn-2cols">
            <Stat label="Low Stock Items" value={data.inventory.low} />
            <Stat label="Fulfillment" value={`${data.inventory.fulfillment}%`} trend={data.inventory.trend} />
          </div>
        </Card>

        {/* 8. Product Catalog */}
        <Card title="Product Catalog" to="/catalog">
          <div className="gn-2cols">
            <Stat label="Active" value={data.catalog.active} />
            <Stat label="Hidden" value={data.catalog.hidden} />
          </div>
        </Card>

        {/* 9. Sales, Finance & Orders */}
        <Card title="Sales & Finance" to="/sales">
          <Stat label="Orders (7d)" value={data.sales.orders} trend={data.sales.trend} />
          <div className="gn-subtext">Revenue: LKR {data.sales.revenue.toLocaleString()}</div>
        </Card>

        {/* 10. Customer Management */}
        <Card title="Customers" to="/customers">
          <div className="gn-2cols">
            <Stat label="New (7d)" value={data.customers.newThisWeek} />
            <Stat label="Total" value={data.customers.total} />
          </div>
          <div className="gn-quick">
            <Link to="/customers" className="gn-link">View all</Link>
            <Link to="/customers/new" className="gn-link">Add customer</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
