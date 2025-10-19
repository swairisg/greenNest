import React, { useEffect, useState } from "react";
import api from "../../api";
import "./pc.css";

export default function PhenologyHome() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const { data } = await api.get("/plant-cultivation/phenology/summary");
      setRows(data?.data || []);
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
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setRecalcLoading(false);
    }
  };

  const badge = (s) => <span className={`badge ${s}`}>{s}</span>;

  return (
    <div className="pc-page" data-module="seeds">
      <div className="pc-header">
        <div>
          <h2 className="pc-title">Phenology &amp; Task Autopilot</h2>
          <p className="pc-sub">GDD-based stage prediction per plan, with automatic task creation when stages change.</p>
        </div>
        <div>
          <button className="pc-btn" onClick={load} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
          <button className="pc-btn success" style={{ marginLeft: 8 }} onClick={recompute} disabled={recalcLoading}>
            {recalcLoading ? "Recomputing…" : "Recompute all"}
          </button>
        </div>
      </div>

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
          Tip: keep daily Tmin/Tmax per section updated to get accurate GDD (via climate module or manual import).
        </div>
      </div>
    </div>
  );
}
