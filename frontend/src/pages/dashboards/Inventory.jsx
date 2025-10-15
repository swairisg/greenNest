import React from "react";
import { Link } from "react-router-dom";
import '../../index.css';

export default function Inventory() {
  return (
    <Link to="/inventory" className="gn-card-link">
      <div className="gn-card" role="button">Inventory</div>
    </Link>
  );
}
