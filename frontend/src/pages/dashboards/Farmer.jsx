import React from "react";
import { Link } from "react-router-dom";
export default function Farmer() {
  return(
  <div className="gn-container">
    <h2>Farmer / Specialist Dashboard</h2>
    <div className="gn-grid" style={{ marginTop: 16 }}>
      <Link to="/planting" className="gn-card-link"><div className="gn-card">Planting & Growth</div></Link>
      <Link to="/climate" className="gn-card-link"><div className="gn-card">Climate</div></Link>
      <Link to="/pest" className="gn-card-link"><div className="gn-card">Pest & Disease</div></Link>
      <Link to="/quality" className="gn-card-link"><div className="gn-card">Quality</div></Link>
      <Link to="/harvest" className="gn-card-link"><div className="gn-card">Harvest</div></Link>
    </div>
  </div>
);

}
