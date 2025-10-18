import React, { useEffect, useState, useCallback, useMemo } from "react"; 
import axios from "axios";
import { API_BASE } from "../../../api";
import { useNavigate } from "react-router-dom";
import ContactMessagesCharts from "./components/ContactMessagesCharts";
import "../CustomerDashboard/CustomerDashboard.css";

const ymd = (d) => new Date(d).toISOString().slice(0, 10); // YYYY-MM-DD
const startOfDay = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const oidToDate = (id) => {
  if (!id || typeof id !== "string" || id.length < 8) return null;
  const ts = parseInt(id.substring(0, 8), 16);
  if (Number.isNaN(ts)) return null;
  return new Date(ts * 1000);
};
// date helpers for calendar
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths    = (date, n) => new Date(date.getFullYear(), date.getMonth()+n, 1);

const BOOKINGS_URL = `${API_BASE}/public/visit-bookings`; // list of bookings
const USERS_URL    = `${API_BASE}/api/customers`;         // list of users
const CONTACTS_URL = `${API_BASE}/contact-us`;

function MiniLineChart({ series, title }) {
  const w = 520, h = 220, p = 28;
  const xs = series.map(s => s.x);
  const ys = series.map(s => s.y);
  const minY = 0;
  const maxY = Math.max(1, ...ys);
  const stepX = (w - 2 * p) / Math.max(1, xs.length - 1);
  const scaleY = (v) => h - p - ((v - minY) / (maxY - minY)) * (h - 2 * p);
  const d = xs.map((_, i) => {
    const x = p + i * stepX;
    const y = scaleY(ys[i] || 0);
    return `${i === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  return (
    <div className="customerdash-card customerdash-chart-box">
      <div className="customerdash-card-title">{title}</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="customerdash-svg">
        <line x1={p} y1={h-p} x2={w-p} y2={h-p} stroke="#E5E7EB" />
        <line x1={p} y1={p} x2={p} y2={h-p} stroke="#E5E7EB" />
        <path d={`${d} L ${w - p} ${h - p} L ${p} ${h - p} Z`} fill="#32CD3230" />
        <path d={d} fill="none" stroke="#32CD32" strokeWidth="2.5" />
        {xs.map((_, i) => {
          const x = p + i * stepX;
          const y = scaleY(ys[i] || 0);
          return <circle key={i} cx={x} cy={y} r="3.5" fill="#2CB82C" />;
        })}
        <text x={p - 8} y={h - p + 16} textAnchor="end" fill="#6B7280" fontSize="11">{minY}</text>
        <text x={p - 8} y={scaleY(maxY)} textAnchor="end" fill="#6B7280" fontSize="11">{maxY}</text>
      </svg>
    </div>
  );
}

function MiniBarChart({ series, title }) {
  const w = 520, h = 220, p = 28;
  const xs = series.map(s => s.x);
  const ys = series.map(s => s.y);
  const maxY = Math.max(1, ...ys);
  const step = (w - 2 * p) / Math.max(1, xs.length);
  const scaleH = (v) => (v / maxY) * (h - 2 * p);
  return (
    <div className="customerdash-card customerdash-chart-box">
      <div className="customerdash-card-title">{title}</div>
      <svg viewBox={`0 0 ${w} ${h}`} className="customerdash-svg">
        <line x1={p} y1={h-p} x2={w-p} y2={h-p} stroke="#E5E7EB" />
        <line x1={p} y1={p} x2={p} y2={h-p} stroke="#E5E7EB" />
        {xs.map((_, i) => {
          const bh = scaleH(ys[i] || 0);
          const x = p + i * step + step * 0.15;
          const y = (h - p) - bh;
          const bw = step * 0.7;
          return <rect key={i} x={x} y={y} width={bw} height={bh} fill="#32CD32" rx="4" />;
        })}
        <text x={p - 8} y={p + 4} textAnchor="end" fill="#6B7280" fontSize="11">{maxY}</text>
      </svg>
    </div>
  );
}

/* -------------------- Page -------------------- */
export default function VisitBookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [, setLoadingBookings] = useState(true); // <- keep setter only (no-unused-vars fixed)

  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const [usersCount, setUsersCount] = useState(0);

  // NEW: calendar month + alert
  const [calMonth, setCalMonth] = useState(() => startOfMonth(new Date()));
  const [showAlert, setShowAlert] = useState(false);
  const [alertText, setAlertText] = useState("");

  const loadBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      const { data } = await axios.get(BOOKINGS_URL);
      const list = data?.data || data || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  const loadUsersCount = useCallback(async () => {
    try {
      const res = await axios.get(USERS_URL, { withCredentials: true });
      const arr = res?.data?.data ?? res?.data ?? [];
      setUsersCount(Array.isArray(arr) ? arr.length : 0);
    } catch (e) {
      console.error("GET /api/customers failed", e?.response || e);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const res = await axios.get(CONTACTS_URL);
      const rows = res?.data?.data ?? res?.data ?? [];
      setContacts(Array.isArray(rows) ? rows : []);
    } catch (e) {
      console.error(e);
      alert("Failed to load contact messages");
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => { loadBookings(); loadUsersCount(); }, [loadBookings, loadUsersCount]);
  useEffect(() => { loadContacts(); }, [loadContacts]);

  /* Alert: detect bookings happening soon (next 3 days) */
  useEffect(() => {
    const now = startOfDay(new Date());
    const soon = addDays(now, 3);
    // group by date and count
    const upcoming = bookings
      .filter(b => !!b.preferredDate)
      .map(b => startOfDay(new Date(b.preferredDate)))
      .filter(d => d >= now && d <= soon)
      .map(d => ymd(d));
    if (upcoming.length) {
      // no-sequences fix: use a block and return
      const counts = upcoming.reduce((m, k) => {
        m[k] = (m[k] || 0) + 1;
        return m;
      }, {});
      const nextDate = Object.keys(counts).sort()[0];
      const count = counts[nextDate];
      const pretty = new Date(nextDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      setAlertText(`${count} booking${count>1?"s":""} scheduled by ${pretty}.`);
      setShowAlert(true);
    } else {
      setShowAlert(false);
      setAlertText("");
    }
  }, [bookings]);

  /*  Build chart series from data  */
  const lineSeries = useMemo(() => {
    const byDay = new Map();
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      byDay.set(ymd(d), 0);
    }
    for (const r of bookings) {
      const created = r.createdAt ? new Date(r.createdAt) : oidToDate(String(r._id));
      if (!created || Number.isNaN(created.getTime())) continue;
      const key = ymd(created);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) || 0) + 1);
    }
    return Array.from(byDay, ([x, y]) => ({ x, y }));
  }, [bookings]);

  const barSeries = useMemo(() => {
    const counts = new Map();
    for (const r of bookings) {
      if (!r.preferredDate) continue;
      const key = ymd(r.preferredDate);
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts, ([x, y]) => ({ x, y }))
      .sort((a, b) => (a.x < b.x ? -1 : a.x > b.x ? 1 : 0))
      .slice(0, 30);
  }, [bookings]);

  /* Calendar data (group by preferredDate) */
  const bookingsByDay = useMemo(() => {
    const map = new Map();
    for (const r of bookings) {
      if (!r?.preferredDate) continue;
      const key = ymd(r.preferredDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return map;
  }, [bookings]);

  const calendarCells = useMemo(() => {
    const start = startOfMonth(calMonth);
    // removed unused `end` (no-unused-vars fix)
    // 6-week grid starting Monday
    const startWeekday = (start.getDay() + 6) % 7; // Mon=0..Sun=6
    const firstCellDate = new Date(start); firstCellDate.setDate(start.getDate() - startWeekday);
    const cells = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(firstCellDate); d.setDate(firstCellDate.getDate() + i);
      const key = ymd(d);
      const isCurrentMonth = d.getMonth() === calMonth.getMonth();
      const items = bookingsByDay.get(key) || [];
      const displayItems = items.slice(0, 3);
      const more = Math.max(0, items.length - displayItems.length);
      cells.push({ date: d, key, isCurrentMonth, items, displayItems, more });
    }
    return cells;
  }, [calMonth, bookingsByDay]);

  const labelMonthYear = useMemo(() =>
    calMonth.toLocaleDateString(undefined, { year: "numeric", month: "long" })
  , [calMonth]);


  return (
    <div className="customerdash-wrap">

      {showAlert && (
        <div className="customerdash-alert">
          <div className="customerdash-alert-left">
            <span className="customerdash-alert-dot" />
            <strong>Upcoming bookings</strong>
            <span className="customerdash-alert-text">{alertText}</span>
          </div>
          <div className="customerdash-alert-actions">
            <button className="customerdash-btn customerdash-outline customerdash-sm" onClick={() => navigate("/visit-bookings")}>
              View list
            </button>
            <button className="customerdash-btn customerdash-ghost customerdash-sm" onClick={() => setShowAlert(false)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* HERO */}
      <div className="customerdash-hero">
        <h1 className="customerdash-hero-title">Customer Management Dashboard</h1>
        <p className="customerdash-hero-sub">A quick overview of your customers, bookings, and messages.</p>
      </div>

      <div className="customerdash-stats-grid">
        <div className="customerdash-stat-card">
          <div className="customerdash-stat-top">
            <div className="customerdash-stat-label">Total users</div>
            <div className="customerdash-stat-count">{usersCount}</div>
          </div>
          <button className="customerdash-btn customerdash-ghost customerdash-sm" onClick={() => navigate("/users")}>View list</button>
        </div>

        <div className="customerdash-stat-card">
          <div className="customerdash-stat-top">
            <div className="customerdash-stat-label">Total bookings</div>
            <div className="customerdash-stat-count">{bookings.length}</div>
          </div>
          <button className="customerdash-btn customerdash-ghost customerdash-sm" onClick={() => navigate("/visit-bookings")}>View list</button>
        </div>
      </div>

      <section className="customerdash-calendar-section">
        <div className="customerdash-calendar-head">
          <div className="customerdash-calendar-title">{labelMonthYear}</div>
          <div className="customerdash-calendar-actions">
            <button
              className="customerdash-btn customerdash-outline customerdash-sm"
              onClick={() => setCalMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
            >
              ◀ Prev
            </button>
            <button
              className="customerdash-btn customerdash-ghost customerdash-sm"
              onClick={() => setCalMonth(startOfMonth(new Date()))}
            >
              Today
            </button>
            <button
              className="customerdash-btn customerdash-outline customerdash-sm"
              onClick={() => setCalMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              Next ▶
            </button>
          </div>
        </div>

        <div className="customerdash-card customerdash-calendar customerdash-calendar--sm">
          <div className="customerdash-calendar-grid customerdash-calendar-weekdays">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((w) => (
              <div key={w} className="customerdash-calendar-weekday">{w}</div>
            ))}
          </div>

          <div className="customerdash-calendar-grid">
            {calendarCells.map((c) => (
              <div
                key={c.key}
                className={`customerdash-calendar-cell ${c.isCurrentMonth ? "" : "customerdash-cal-out"}`}
              >
                <div className="customerdash-cal-date-row">
                  <span className="customerdash-cal-date-num">{c.date.getDate()}</span>
                  {!!c.items.length && (
                    <span className="customerdash-cal-badge">{c.items.length}</span>
                  )}
                </div>

                <div className="customerdash-cal-list">
                  {c.displayItems.map((r) => (
                    <div key={r._id} className="customerdash-cal-item" title={`${r.fullName || r.email} • ${r.timeSlot || ""}`}>
                      <span className="customerdash-cal-dot" />
                      <span className="customerdash-cal-text">
                        {r.fullName || r.email || "—"} {r.timeSlot ? `· ${r.timeSlot}` : ""}
                      </span>
                    </div>
                  ))}
                  {c.more > 0 && (
                    <div className="customerdash-cal-more">+{c.more} more</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="customerdash-analytics-grid customerdash-two">
        <MiniLineChart series={lineSeries} title="Bookings created — last 30 days" />
        <MiniBarChart  series={barSeries}  title="Preferred dates — bookings per day" />
      </div>

      <section className="customerdash-analytics customerdash-contact-green">
        <div className="customerdash-section-title">Contact Messages Analytics</div>

        {loadingContacts ? (
          <div className="customerdash-loading customerdash-sm">Loading contact analytics…</div>
        ) : contacts.length === 0 ? (
          <div className="customerdash-empty">No contact messages yet.</div>
        ) : (
          <div className="customerdash-analytics-grid customerdash-one">
            <div className="customerdash-card customerdash-chart-box customerdash-chart-box--sm">
              <ContactMessagesCharts rows={contacts} titleSuffix="" accentColor="#32CD32" />
            </div>
          </div>
        )}

        <div className="customerdash-actions-bar">
          <button
            className="customerdash-btn customerdash-outline"
            onClick={() => navigate("/viewcontactus")}
            title="Go to Contact Messages table"
          >
            View Contact Messages Table
          </button>
        </div>
      </section>
    </div>
  );
}
