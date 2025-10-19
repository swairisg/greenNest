import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../../api";
import WeeklyYieldDotGraph from "../../../Components/harvestManagement/WeeklyYieldDotGraph";
import "../../../Components/harvestManagement/WeeklyYieldDotGraph.css";

export default function WeeklyForecastPage() {
  const [crops, setCrops] = useState([]);
  const [crop, setCrop] = useState("");
  const [section, setSection] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/harvest/ai/crops`);
        if (Array.isArray(data) && data.length) {
          setCrops(data);
          setCrop((c) => c || data[0]);
        }
      } catch {}
    })();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Yield Forecast (Next Week)</h2>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Crop</label>
          {crops.length ? (
            <select value={crop} onChange={(e)=>setCrop(e.target.value)} style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb" }}>
              {crops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input value={crop} onChange={(e)=>setCrop(e.target.value)} placeholder="Enter crop" style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb", width: 240 }} />
          )}
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#6b7280" }}>Section (optional)</label>
          <input value={section} onChange={(e)=>setSection(e.target.value)} placeholder="e.g., A" style={{ padding: 8, borderRadius: 8, border: "1px solid #e5e7eb", width: 160 }} />
        </div>
      </div>

      {crop ? <WeeklyYieldDotGraph crop={crop} section={section || undefined} /> : <div style={{ padding: 12, border: "1px dashed #e5e7eb", borderRadius: 12, color: "#6b7280" }}>Select or type a crop to view the forecast.</div>}
    </div>
  );
}
