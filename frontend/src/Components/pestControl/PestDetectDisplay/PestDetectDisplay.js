import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./PestDetectDisplay.css";
import { API_BASE } from "../../../api";
import PestDetectCard from "../PestDetectCard/PestDetectCard";
import PestDetectFilter from "../PestDetectFilter/PestDetectFilter";

const URL = `${API_BASE}/users`;

const fetchHandler = async () => {
  const { data } = await axios.get(URL); // no params since backend doesn't filter
  return data;
};

// helpers for safe/consistent comparisons
const toStr = (v) => (v == null ? "" : String(v));
const norm = (s) => toStr(s).trim().toLowerCase();

export default function PestDetectDisplay() {
  const [allRows, setAllRows] = useState([]); // master copy
  const [rows, setRows] = useState([]);       // filtered view
  const [loading, setLoading] = useState(false);

  const [crop, setCrop] = useState("");
  const [severity, setSeverity] = useState("");

  // Load once
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await fetchHandler();
        const list = data?.users || [];
        setAllRows(list);
        setRows(list); // start unfiltered
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Local filter (runs when crop/severity/allRows change)
  const filtered = useMemo(() => {
    const c = norm(crop);
    const sev = norm(severity); // expecting "", "low", "moderate", "high"

    return allRows.filter((u) => {
      const matchesCrop = c ? norm(u?.crop).includes(c) : true;

      // DB field is likely "severity_level" (string like "Low"/"Moderate"/"High")
      const dbSev = norm(u?.severity_level || u?.severity);
      const matchesSeverity = sev ? dbSev === sev : true;

      return matchesCrop && matchesSeverity;
    });
  }, [allRows, crop, severity]);

  // Apply filter on search submit (no server call)
  const onSearch = (e) => {
    e.preventDefault();
    setRows(filtered);
  };

  // Clear to original list
  const onClear = () => {
    setCrop("");
    setSeverity("");
    setRows(allRows);
  };

  // Keep both lists in sync on delete
  const onDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await axios.delete(`${URL}/${id}`);
      setAllRows((prev) => prev.filter((u) => u._id !== id));
      setRows((prev) => prev.filter((u) => u._id !== id));
    } catch (e) {
      alert(e.response?.data?.message || e.message || "Delete failed");
    }
  };

  return (
    <div className="pd-display">
      <div className="pd-head">
        <h1 className="pd-display__title">Pest Detect Records</h1>
        <Link to="/pests/farmer" className="pd-btn pd-btn--primary">+ Report Pest</Link>
      </div>

      <PestDetectFilter
        crop={crop} setCrop={setCrop}
        severity={severity} setSeverity={setSeverity}
        onSearch={onSearch} onClear={onClear}
      />

      {loading && <div className="pd-loading">Loading…</div>}
      {!loading && rows.length === 0 && <div className="pd-empty">No matching records.</div>}

      {!loading && rows.map((user) => (
        <div key={user._id} className="pd-card-wrap">
          <PestDetectCard user={user} />
          <p className="pd-actions">
            <Link to={`/pests/${user._id}/update`} className="pd-btn">Update Treatment</Link>{" "}
            <button onClick={() => onDelete(user._id)} className="pd-btn pd-btn--danger">Delete</button>
          </p>
        </div>
      ))}
    </div>
  );
}
