import React, { useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./pc.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";

const MySwal = withReactContent(Swal);

export default function PhenologyHome() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [err, setErr] = useState("");

  // quick climate state
  const [selPlanId, setSelPlanId] = useState("");   // plan chosen for chart + entry
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [tmin, setTmin] = useState("");
  const [tmax, setTmax] = useState("");
  const [series, setSeries] = useState(null);
  const [seriesLoading, setSeriesLoading] = useState(false);

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const { data } = await api.get("/plant-cultivation/phenology/summary");
      const list = data?.data || [];
      setRows(list);
      // set default selected plan (first row)
      if (!selPlanId && list.length) setSelPlanId(String(list[0].planId));
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const recompute = async () => {
    setRecalcLoading(true);
    try {
      await api.post("/plant-cultivation/phenology/recompute");
      await load();
      if (selPlanId) await fetchSeries(selPlanId);
    } catch (e) {
      MySwal.fire({ icon: "error", title: "Recompute failed", text: e?.response?.data?.message || e.message });
    } finally {
      setRecalcLoading(false);
    }
  };

  const fetchSeries = async (planId) => {
    if (!planId) return;
    setSeriesLoading(true);
    try {
      const { data } = await api.get(`/plant-cultivation/phenology/series/${planId}`);
      const fmt = (d) => new Date(d).toLocaleDateString();
      const mapped = (data?.data || []).map(x => ({ ...x, d: fmt(x.date) }));
      setSeries({ data: mapped, thresholds: data?.thresholds || {}, baseTemp: data?.baseTemp, meta: data?.meta });
    } catch (e) {
      setSeries(null);
      MySwal.fire({ icon: "error", title: "Load series failed", text: e?.response?.data?.message || e.message });
    } finally {
      setSeriesLoading(false);
    }
  };

  useEffect(() => { if (selPlanId) fetchSeries(selPlanId); }, [selPlanId]);

  const badge = (s) => <span className={`badge ${s}`}>{s || "none"}</span>;

  const plansOptions = useMemo(() => rows.map(r => ({
    value: String(r.planId),
    label: `${r.section} • ${r.crop}`
  })), [rows]);

  const submitClimate = async (e) => {
    e.preventDefault();
    if (!selPlanId) return;
    const r = rows.find(x => String(x.planId) === selPlanId);
    if (!r) return;

    try {
      await api.post("/plant-cultivation/phenology/climate", {
        section: r.section,
        date,
        tmin: Number(tmin),
        tmax: Number(tmax),
      });
      setTmin(""); setTmax("");
      await fetchSeries(selPlanId);
      MySwal.fire({ icon: "success", title: "Saved", text: "Daily Tmin/Tmax recorded (upserted)." });
    } catch (e2) {
      MySwal.fire({ icon: "error", title: "Save failed", text: e2?.response?.data?.message || e2.message });
    }
  };

  const k = series?.thresholds || {};
  const stageLines = [
    { key: "emergence", val: k.emergence, color: "#7bddafff" },
    { key: "vegetative", val: k.vegetative, color: "#679fe2ff" },
    { key: "flowering", val: k.flowering, color: "#f384c3ff" },
    { key: "fruiting",  val: k.fruiting,  color: "#fec25aff" },
  ].filter(x => x.val != null);

  return (
    <div className="pc-page" data-module="seeds">
      <div className="pc-header">
        <div>
          <h2 className="pc-title">Phenology &amp; Task Autopilot</h2>
          <p className="pc-sub">GDD-based stage prediction per plan, with automatic task creation when stages change.</p>
        </div>
        <div>
          <button className="pc-btn" onClick={load} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
          <button className="pc-btn success" style={{ marginLeft: 8 }} onClick={recompute} disabled={recalcLoading}>
            {recalcLoading ? "Recomputing…" : "Recompute all"}
          </button>
        </div>
      </div>

      {/* Summary table */}
      <div className="pc-card">
        {err && <div className="pc-hint error" style={{ marginBottom: 10 }}>{err}</div>}
        <div className="pc-table-wrap">
          <table className="pc-table">
            <thead>
              <tr>
                <th>Plan</th><th>Crop</th><th>Section</th><th>Start</th><th>GDD</th><th>Predicted Stage</th><th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="pc-empty">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="pc-empty">No plans found</td></tr>
              ) : rows.map(r => (
                <tr key={r.planId}>
                  <td className="mono">{String(r.planId).slice(-6)}</td>
                  <td>{r.crop}</td>
                  <td>{r.section}</td>
                  <td>{r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"}</td>
                  <td>{Math.round(r.gddSum || 0)}</td>
                  <td>{badge(r.predictedStage)}</td>
                  <td>{r.lastComputedAt ? new Date(r.lastComputedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pc-hint" style={{ marginTop: 8 }}>
          Tip: keep daily Tmin/Tmax per section updated to get accurate GDD (via this form or climate module/import).
        </div>
      </div>

      {/* Quick Climate Entry + Visual */}
      <div className="pc-card">
        <h3 className="pc-card-title">Quick Climate Entry &amp; GDD Visual</h3>

        {/* Selector */}
        <div className="pc-row gap" style={{ marginBottom: 12 }}>
          <select className="pc-input" value={selPlanId} onChange={(e)=>setSelPlanId(e.target.value)}>
            {plansOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Entry form */}
        <form className="pc-form-grid" onSubmit={submitClimate}>
          <div className="pc-field">
            <label>Date</label>
            <input className="pc-input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="pc-field">
            <label>Tmin (°C)</label>
            <input className="pc-input" type="number" step="0.1" value={tmin} onChange={e=>setTmin(e.target.value)} />
          </div>
          <div className="pc-field">
            <label>Tmax (°C)</label>
            <input className="pc-input" type="number" step="0.1" value={tmax} onChange={e=>setTmax(e.target.value)} />
          </div>
          <div className="pc-form-actions">
            <button className="pc-btn success" type="submit">Save Day</button>
          </div>
        </form>

        {/* Chart */}
        <div style={{ marginTop: 12 }}>
          {seriesLoading ? (
            <div className="pc-empty">Loading chart…</div>
          ) : !series || (series.data || []).length === 0 ? (
            <div className="pc-empty">No climate days yet for this plan/section</div>
          ) : (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={series.data}>
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                  <XAxis dataKey="d" />
                  <YAxis yAxisId="left" allowDecimals={false} />
                  <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  {/* daily GDD as bars */}
                  <Bar yAxisId="left" dataKey="gdd" name="Daily GDD" fill="#7bddafff" />
                  {/* cumulative GDD as line */}
                  <Line yAxisId="right" type="monotone" dataKey="cum" name="Cumulative GDD" stroke="#7babe7ff" strokeWidth={2} dot={false} />
                  {/* threshold markers (render as additional Lines) */}
                  {stageLines.map(s => (
                    <Line
                      key={s.key}
                      yAxisId="right"
                      type="stepAfter"
                      dataKey={() => s.val}
                      name={`${s.key} (${s.val})`}
                      stroke={s.color}
                      strokeDasharray="4 4"
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
