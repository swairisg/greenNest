import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import logo from "../../assests/logo-leaf.png";
import "./styles/Admin.css";

function MiniLineChart({
  series = [
    { label: "Series", data: [4, 8, 12, 18, 27, 30], color: "#1f6feb" },
  ],
  width = 520,
  height = 160,
  padding = 14,
  yTicks = 4,
  showLegend = false,
}) {
  const all = series.flatMap((s) => s.data);
  const max = Math.max(1, ...all);
  const min = Math.min(0, ...all);
  const W = width;
  const H = height;
  const P = padding;
  const innerW = W - P * 2;
  const innerH = H - P * 2;

  const x = (i, n) => (n <= 1 ? P : P + (i * innerW) / (n - 1));
  const y = (v) => P + innerH - ((v - min) / (max - min || 1)) * innerH;

  //simplequadratic curves
  const makePath = (arr) => {
    if (!arr?.length) return "";
    const n = arr.length;
    let d = `M ${x(0, n)} ${y(arr[0])}`;
    for (let i = 1; i < n; i++) {
      const x0 = x(i - 1, n), y0 = y(arr[i - 1]);
      const x1 = x(i, n), y1 = y(arr[i]);
      const xc = (x0 + x1) / 2, yc = (y0 + y1) / 2;
      d += ` Q ${x0} ${y0}, ${xc} ${yc}`;
      d += ` T ${x1} ${y1}`;
    }
    return d;
  };

  const ticks = useMemo(() => {
    const t = [];
    for (let i = 0; i <= yTicks; i++) {
      const ratio = i / yTicks;
      const yy = P + innerH - ratio * innerH;
      const val = min + Math.round((max - min) * ratio);
      t.push({ y: yy, v: val });
    }
    return t;
  }, [yTicks, min, max, innerH, P]);

  return (
    <div className="chart-wrap" role="img" aria-label="trend chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none">
        {/* grid */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={P} y1={t.y} x2={W - P} y2={t.y} className="grid" />
            <text x={P - 6} y={t.y + 4} className="tick">{t.v}</text>
          </g>
        ))}
        {/* axes */}
        <line x1={P} y1={P} x2={P} y2={H - P} className="axis" />
        <line x1={P} y1={H - P} x2={W - P} y2={H - P} className="axis" />

        {/* lines */}
        {series.map((s, idx) => (
          <path key={idx} d={makePath(s.data)} className="line" style={{ stroke: s.color }} />
        ))}
      </svg>

      {showLegend && (
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.label}><i style={{ background: s.color }} /> {s.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  return (
    <div className="gn-admin-wrap">
       <aside className="gn-admin-sidebar">
        <div className="gn-admin-brand">
          <img src={logo} alt="GreenNest" />
          <span>GreenNest</span>
        </div>
        <nav className="gn-admin-nav">
          <Link to="/admin" className="active">Dashboard</Link>
          <Link to="/farmer">Greenhouse Ops</Link>
          <Link to="/hr">HR & Tasks</Link>
          <Link to="/inventory">Inventory & Supply</Link>
          <Link to="/admin/Products/dashboard">Products & Pricing</Link>
          
          <Link to="/visits/bookings">Customers & Buyers</Link>
          <Link to="/orders">Order Management</Link>
        </nav>
        <div className="gn-admin-sidefooter">
          <small>© {new Date().getFullYear()} GreenNest</small>
        </div>
      </aside>

      <main className="gn-admin-main">
        <header className="gn-admin-topbar">
          <div className="gn-admin-search">
            <input placeholder="Search" />
          </div>
          <div className="gn-admin-right">
              <div className="gn-admin-user">
              <div className="avatar">A</div>
              <span>Admin</span>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="gn-admin-stats">
          <div className="gn-admin-stat" data-accent="green">
            <div className="stat-head"><span>Crops Ready</span><button>＋</button></div>
            <div className="stat-value">500</div>
          </div>
          <div className="gn-admin-stat" data-accent="blue">
            <div className="stat-head"><span>Climate</span><button>🌡️</button></div>
            <div className="stat-value">18°C</div>
          </div>
          <div className="gn-admin-stat" data-accent="indigo">
            <div className="stat-head"><span>Inventory</span><button>📦</button></div>
            <div className="stat-value">20%</div>
          </div>
          <div className="gn-admin-stat" data-accent="amber">
            <div className="stat-head"><span>Sales</span><button>💲</button></div>
            <div className="stat-value">15</div>
          </div>
        </section>

        {/* Grid */}
        <section className="gn-admin-grid">
          {/* Crop Growth */}
          <div className="gn-admin-card">
            <div className="card-head">
              <h3>Crop Growth</h3>
              <div className="legend">
                <span className="dot strawberries" /> Strawberries
                <span className="dot vegetables" /> Vegetables
                <span className="dot flowers" /> Flowers
              </div>
            </div>
            <MiniLineChart
              showLegend={false}
              series={[
                { label: "Strawberries", data: [10, 20, 35, 48, 62, 75, 88, 100], color: "#2e86ff" },
                { label: "Vegetables",  data: [8, 16, 26, 40, 55, 70, 84, 95],  color: "#34c759" },
                { label: "Flowers",     data: [2, 4, 7, 9, 12, 14, 16, 18],     color: "#f7b500" },
              ]}
              width={880}
              height={260}
            />
          </div>

          {/* Climate Monitor */}
          <div className="gn-admin-card">
            <div className="card-head"><h3>Climate Monitor</h3></div>
            <div className="gn-admin-metrics">
              <div><strong>Temperature</strong><span>18°C</span></div>
              <div><strong>Humidity</strong><span>70%</span></div>
              <div><strong>Soil Moisture</strong><span>55%</span></div>
            </div>
            <MiniLineChart
              series={[
                { label: "Temp", data: [14, 16, 17, 18, 19, 18, 17, 18], color: "#1f6feb" },
              ]}
              width={520}
              height={200}
            />
          </div>

          {/* Task Status */}
          <div className="gn-admin-card">
            <div className="card-head"><h3>Task Status</h3></div>
            <div className="gn-admin-taskboard">
              <div>
                <div className="col-title">Completed</div>
                <ul>
                  <li>Watering <span className="ok">●</span></li>
                  <li>Weeding <span className="ok">●</span></li>
                </ul>
              </div>
              <div>
                <div className="col-title">In Progress</div>
                <ul>
                  <li>Harvesting</li>
                  <li>Packing</li>
                </ul>
              </div>
              <div>
                <div className="col-title">Pending</div>
                <ul>
                  <li>Fertilizer application</li>
                  <li>Pest control</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Pest Alerts */}
          <div className="gn-admin-card gn-admin-alert">
            <div className="card-head"><h3>Pest Alerts</h3></div>
            <p>Pest detected in <strong>strawberry patch 3</strong>.</p>
            <div className="alert-mini">
              <div className="thumb" />
              <div className="meta">
                <div>Severity: <b>High</b></div>
                <small>Open PestDetect dashboard →</small>
              </div>
            </div>
          </div>

          {/* Sales */}
          <div className="gn-admin-card">
            <div className="card-head"><h3>Sales</h3></div>
            <MiniLineChart
              series={[{ label: "Sales", data: [5, 8, 12, 16, 22, 28, 36, 48], color: "#0ea5e9" }]}
              width={520}
              height={180}
            />
          </div>

          {/* Orders Overview */}
          <div className="gn-admin-card">
            <div className="card-head"><h3>Orders Overview</h3></div>
            <div className="gn-admin-kpis">
              <div><strong>Today</strong><span>12</span></div>
              <div><strong>Open</strong><span>7</span></div>
              <div><strong>Fulfilled</strong><span>5</span></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
