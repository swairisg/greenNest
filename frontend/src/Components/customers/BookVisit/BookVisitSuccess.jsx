import React from "react";
import { useLocation, Link } from "react-router-dom";
import "./BookVisit.css";

export default function BookVisitSuccess() {
  const { state } = useLocation();
  const name = state?.name || "Guest";

  return (
    <div className="bookvisit-wrap">
      <div className="bookvisit-card" style={{ textAlign: "center" }}>
        <h2 className="bookvisit-title">Thanks, {name}!</h2>
        <p className="bookvisit-sub">
          Your visit request was submitted. We’ll email you after reviewing availability.
        </p>
        <Link className="bv-btn" to="/Home">Back to Home</Link>
      </div>
    </div>
  );
}
