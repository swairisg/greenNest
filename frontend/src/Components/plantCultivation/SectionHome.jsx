import React from "react";
import { Link } from "react-router-dom";
import "./pc.css";

export default function SectionHome() {
  const tiles = [
    {
      key: "seeds",
      title: "Seed Inventory",
      desc: "Track seed batches, suppliers, quantities, and expiries.",
      to: "/farmer/cultivation/seeds",
      img: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop", // seeds
    },
    {
      key: "land",
      title: "Land Preparation",
      desc: "Log soil tests, clearing, bed prep, amendments, irrigation setup.",
      to: "/farmer/cultivation/land",
      img: "https://images.unsplash.com/photo-1461354464878-ad92f492a5a0?q=80&w=1200&auto=format&fit=crop", // field
    },
    {
      key: "plans",
      title: "Planting Plans",
      desc: "Schedule crop plantings into sections and link seed batches.",
      to: "/farmer/cultivation/plans",
       img: "https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?q=80&w=1200&auto=format&fit=crop", // flower planting
  
    },
    {
      key: "growth",
      title: "Growth Monitoring",
      desc: "Record growth logs, stages, heights, and issues per plan.",
      to: "/farmer/cultivation/growth",
     img: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?q=80&w=1200&auto=format&fit=crop", // strawberries

 
    },
  ];

  return (
    <div className="pc-page" data-module="seeds">
      {/* HERO */}
      <div className="pc-hero">
        <div className="pc-hero-overlay" />
        <div className="pc-hero-inner">
          <h1 className="pc-hero-title">Planting &amp; Growth Monitoring</h1>
          <p className="pc-hero-sub">
            Manage seeds, land preparation, planting plans, and daily growth logs — all in one place.
          </p>
        </div>
      </div>

      {/* TILES */}
      <div className="pc-tiles">
        {tiles.map((t) => (
          <Link key={t.key} to={t.to} className="pc-tile">
            <div className="pc-tile-img" style={{ backgroundImage: `url(${t.img})` }} />
            <div className="pc-tile-body">
              <h3 className="pc-tile-title">{t.title}</h3>
              <p className="pc-tile-desc">{t.desc}</p>
              <div className="pc-tile-cta">Open</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
