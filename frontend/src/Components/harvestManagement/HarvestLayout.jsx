// Components/harvestManagement/HarvestLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import Sidebar from "../harvestManagement/components/Sidebar";
import "./HarvestLayout.css";

export default function HarvestLayout() {
  const [sideBarVanish, setSideBarVanish] = useState(1);
  return (
    <div className="hl-frame">
      <Sidebar vanishState={sideBarVanish} setVanishState={setSideBarVanish} />
      <header className="hl-topbar">
        {sideBarVanish === 1 && (
          <button className="hl-menu-btn" onClick={() => setSideBarVanish(0)}>
            <FaBars />
          </button>
        )}
        <h1 className="hl-title">Harvest Management</h1>
      </header>
      <main className={`hl-main ${sideBarVanish === 1 ? "hl-main--full" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}
