import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./PestDetectDisplay.css";
import { API_BASE } from "../../../api";
import PestDetectCard from "../PestDetectCard/PestDetectCard";
import PestDetectFilter from "../PestDetectFilter/PestDetectFilter";

const URL = `${API_BASE}/users`;

const fetchHandler = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const u = query ? `${URL}?${query}` : URL;
  return await axios.get(u).then((res) => res.data);
};

export default function PestDetectDisplay() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [crop, setCrop] = useState("");
  const [severity, setSeverity] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchHandler()
      .then((data) => setRows(data.users || []))
      .finally(() => setLoading(false));
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const params = {};
      if (crop) params.crop = crop;
      if (severity) params.severity = severity;
      const data = await fetchHandler(params);
      setRows(data.users || []);
    } finally {
      setLoading(false);
    }
  };

  const onClear = async () => {
    setCrop("");
    setSeverity("");
    setLoading(true);
    try {
      const data = await fetchHandler();
      setRows(data.users || []);
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Delete this report?")) return;
    try {
      await axios.delete(`${URL}/${id}`);
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
