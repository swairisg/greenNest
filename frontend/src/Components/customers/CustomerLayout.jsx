import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import Sidebar from "../customers/CustomerDashboard/components/SideBar/Sidebar";
import "./CustomerLayout.css";

export default function CustomerLayout() {
  const [sideBarVanish, setSideBarVanish] = useState(1);
  return (
    <div className="harvest_layout-frame">
      <Sidebar vanishState={sideBarVanish} setVanishState={setSideBarVanish} />
      <main
        className={`harvest_layout-main ${
          sideBarVanish === 1 ? "harvest_layout-main--full" : ""
        }`}
      >
        <div className="flex flex-items">
        {sideBarVanish === 1 && (
          <button
            className="harvest_layout-menu-btn "
            onClick={() => setSideBarVanish(0)}
          >
            <FaBars />
          </button>
        )}
        <h1 className="harvest_layout-title ">Customer Management</h1>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
