// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from "react-router-dom";

// Quality Control (CRUD) pages
import QualityList from "./Components/qualityControl/QualityList";
import QualityCreate from "./Components/qualityControl/QualityCreate";
import QualityEdit from "./Components/qualityControl/QualityEdit";
import QualityDetail from "./Components/qualityControl/QualityDetail";

export default function App() {
  return (
    <Router>
      {/* Simple header/nav */}
      <header className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>GreenNest</h2>
        <nav style={{ display: "flex", gap: 12 }}>
          <NavLink to="/quality">Quality</NavLink>
          <NavLink to="/quality/new">Add</NavLink>
        </nav>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
        
        <Routes>
          {/* redirect root to quality list */}
          <Route path="/" element={<Navigate to="/quality" replace />} />

          {/* Quality Control CRUD */}
          <Route path="/quality" element={<QualityList />} />
          <Route path="/quality/new" element={<QualityCreate />} />
          <Route path="/quality/:id" element={<QualityDetail />} />
          <Route path="/quality/:id/edit" element={<QualityEdit />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/quality" replace />} />
        </Routes>
      </main>
    </Router>
  );
};
