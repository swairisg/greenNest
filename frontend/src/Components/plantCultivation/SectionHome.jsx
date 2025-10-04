import React from "react";
import { Link } from "react-router-dom";
import "./pc.css";

export default function SectionHome() {
  const Card = ({ to, title, desc }) => (
    <Link to={to} className="pc-card">
      <div className="pc-card-title">{title}</div>
      <div className="pc-card-desc">{desc}</div>
    </Link>
  );

  return (
    <div className="pc-wrap">
      <h2>Planting & Growth Monitoring</h2>
      <p className="pc-sub">Manage seeds, land preparation, planting plans, and daily growth logs.</p>

      <div className="pc-grid">
        <Card to="land"   title="Land Preparation"  desc="Soil tests & prep tasks" />
        <Card to="seeds"  title="Seed Inventory"    desc="Batches, suppliers, quantities" />
        <Card to="plans"  title="Planting Plans"    desc="Schedule crop plantings" />
        <Card to="growth" title="Growth Monitoring" desc="Logs, stages, and charts" />
      </div>
    </div>
  );
}
