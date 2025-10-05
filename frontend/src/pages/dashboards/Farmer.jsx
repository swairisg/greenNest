import React from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import "./farmer.css";
import Hero from "../../assests/farmer-hero.jpg";          
import TileCultivation from "../../assests/tile-cultivation.jpg"; 
import TileClimate from "../../assests/tile-climate.jpg";         
import TileHarvest from "../../assests/tile-harvest.jpg"; 
       


export default function Farmer() {
  const navigate = useNavigate();

  const tiles = [
    {
      key: "cultivation",
      title: "Planting • Cultivation • Growth",
      desc: "Seeds, land prep, planting plans, and growth monitoring.",
      to: "/farmer/cultivation",
      img: TileCultivation,
    },
    {
      key: "climate",
      title: "Climate",
      desc: "Sensors, temperature / humidity trends, alerts.",
      to: "/climate",
      img: TileClimate
    },
    {
      key: "pest",
      title: "Pest & Disease",
      desc: "Detection, records, treatments, and follow-ups.",
      to: "/PestDetectDashboard",
      img: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop",
    },
    {
      key: "quality",
      title: "Quality",
      desc: "Standards, checklists, sampling, and grading.",
      to: "/quality",
      img: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
    },
    {
      key: "harvest",
      title: "Harvest",
      desc: "Schedules, yield tracking, and post-harvest handling.",
      to: "/harvest",
      img: TileHarvest,
    },
  ];

  const handleLogout = async () => {
    try { await api.post("/auth/logout").catch(() => {}); }
    finally {
      localStorage.removeItem("token");
      navigate("/auth/login", { replace: true });
    }
  };

  return (
    <div className="fd-page">
      {/* Top Bar */}
      <header className="fd-nav">
        <div className="fd-brand">
          <div className="fd-mark">🌱</div>
          <div className="fd-company">
            <div className="fd-name">GreenNest</div>
            <div className="fd-role">Farmer / Specialist</div>
          </div>
        </div>

        <nav className="fd-actions">
          <Link className="fd-link" to="/farmer/tasks">Assigned Tasks</Link>
          <Link className="fd-link" to="/profile">Profile</Link>
          <button className="fd-btn danger" onClick={handleLogout}>Logout</button>
        </nav>
      </header>

      {/* Hero */}
      <section className="fd-hero"style={{ backgroundImage: `url(${Hero})` }}
        aria-label="Greenhouse overview"
      >
        <div className="fd-hero-overlay" />
        <div className="fd-hero-inner">
          <h1 className="fd-hero-title">Greenhouse Dashboard</h1>
          <p className="fd-hero-sub">
            Quick access to cultivation, climate, pest control, quality, and harvest modules.
          </p>
        </div>
      </section>

     <section className="fd-tiles" aria-label="Module shortcuts">
        {tiles.map((t) => (
          <Link key={t.key} to={t.to} className="fd-tile">
            <div className="fd-tile-img" style={{ backgroundImage: `url(${t.img})` }} />
            <div className="fd-tile-body">
              <h3 className="fd-tile-title">{t.title}</h3>
              <p className="fd-tile-desc">{t.desc}</p>
              <div className="fd-tile-cta">Open</div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
