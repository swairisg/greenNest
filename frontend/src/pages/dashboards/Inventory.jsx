import React from "react";
import { Link } from "react-router-dom";

export default function Inventory() {
  return (
    <div style={{ maxWidth: 820, margin: "40px auto" }}>
      <h2>Inventory Dashboard</h2>
      <Link to="/inventory" className="block"></Link>
    </div>
  );
}
