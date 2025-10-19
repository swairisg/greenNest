import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceDot, ResponsiveContainer } from "recharts";
import { API_BASE } from "../../api";
import "./WeeklyYieldDotGraph.css"; // reuse same styles

function ywLabel(yw) {
  const [y, w] = yw.split("-W");
  return `W${w} ${y}`;
}

export default function WeeklyYieldDotGraph({ crop, section, refreshMs = 30000 }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  const load = async () => {
    setErr("");
    try {
      const url = `${API_BASE}/api/harvest/ai/weekly-forecast?crop=${encodeURIComponent(crop)}${section ? `&section=${encodeURIComponent(section)}` : ""}`;
      const { data } = await axios.get(url);
      setData(data);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message);
    }
  };

  useEffect(() => {
    load();
    if (!refreshMs) return;
    const t = setInterval(load, refreshMs);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop, section]);

  const points = useMemo(() => {
    if (!data?.points) return [];
    return data.points.map(p => ({ yw: p.yw, x: p.yw, y: Math.round(p.kg * 10) / 10 }));
  }, [data]);

  return (
    <div className="mydg-card">
      <div className="mydg-head">
        <div>
          <h3 className="mydg-title">{crop} — Weekly Yield</h3>
          {section && <div className="mydg-sub">Section: {section}</div>}
        </div>
        <div className="mydg-metrics">
          {data?.metrics && (
            <>
              {data.metrics.r2 != null && <span className="mydg-badge" title="R-squared">R² {Math.round((data.metrics.r2 || 0) * 100)}%</span>}
              {data.metrics.rmse != null && <span className="mydg-badge" title="Root Mean Squared Error">RMSE {Math.round((Math.sqrt((data.metrics?.rmse||0)**2))*10)/10} kg</span>}
              <span className="mydg-badge" title="Samples">n={data.metrics.samples}</span>
            </>
          )}
        </div>
      </div>

      {err && <div className="mydg-error">{err}</div>}

      <div className="mydg-chart">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid stroke="#e5e7eb" />
            <XAxis
              dataKey="x"
              tickFormatter={ywLabel}
              type="category"
              tick={{ fontSize: 12 }}
              interval={0}
              angle={-30}
              textAnchor="end"
              height={50}
            />
            <YAxis dataKey="y" name="kg" unit=" kg" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [`${v} kg`, "Yield"]} labelFormatter={(l)=>ywLabel(l)} />
            <Scatter data={points} fill="#22c55e" />
            {data?.forecastPoint && (
              <ReferenceDot
                x={data.forecastPoint.yw}
                y={Math.round(data.forecastPoint.kg * 10) / 10}
                r={6}
                fill="#ef4444"
                stroke="#991b1b"
                isFront
                label={{ value: "Next", position: "top", fill: "#991b1b", fontSize: 12 }}
              />
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {data?.next && (
        <div className="mydg-footer">
          <div className="mydg-note">
            Forecast for <b>{ywLabel(`${data.next.year}-W${String(data.next.week).padStart(2,"0")}`)}</b>:
            <b> {Math.round(data.next.estimateKg*10)/10} kg</b>
            <span className="mydg-dim">
              (trees ~ {data.next.treesAssumed ?? "—"}, events ~ {data.next.eventsAssumed ?? "—"})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
