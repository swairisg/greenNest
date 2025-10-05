import React from "react";
import "./PestDetectFilter.css";

// Keep values lowercase to match the client-side compare
export default function PestDetectFilter({
  crop, setCrop,
  severity, setSeverity,
  onSearch, onClear
}) {
  return (
    <form className="pd-toolbar" onSubmit={onSearch}>
      <input
        className="pd-input"
        type="text"
        placeholder="Crop"
        value={crop}
        onChange={(e) => setCrop(e.target.value)}
      />

      <select
        className="pd-input"
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
      >
        <option value="">All severity</option>
        <option value="low">Low</option>
        <option value="moderate">Moderate</option>
        <option value="high">High</option>
      </select>

      <button className="pd-btn" type="submit">Search</button>
      <button className="pd-btn pd-btn--ghost" type="button" onClick={onClear}>Clear</button>
    </form>
  );
}
