import React from "react";
import "./PestDetectFilter.css";

export default function PestDetectFilters({
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
        <option value="Low">Low</option>
        <option value="Moderate">Moderate</option>
        <option value="High">High</option>
      </select>

      <button className="pd-btn" type="submit">Search</button>
      <button className="pd-btn pd-btn--ghost" type="button" onClick={onClear}>Clear</button>
    </form>
  );
}
