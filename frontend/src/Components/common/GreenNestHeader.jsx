import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";

/**
 * GreenNestHeader — safe, simple, no window access
 * - Uses CSS media queries (no matchMedia) to avoid blank-page runtime errors
 * - Minimal styling; responsive with a mobile hamburger
 */
export default function GreenNestHeader() {
  const [open, setOpen] = useState(false);

  const linkStyle = ({ isActive }) => ({
    padding: "8px 12px",
    borderRadius: 10,
    fontSize: 14,
    textDecoration: "none",
    color: "#e8f5e9",
    opacity: isActive ? 1 : 0.9,
    background: isActive ? "rgba(255,255,255,.12)" : "transparent",
  });

  return (
    <header className="gn-header">
      {/* component-scoped CSS to avoid external files */}
      <style>{`
        .gn-header{position:sticky;top:0;z-index:50;background:#0e1f16;color:#e8f5e9;box-shadow:0 2px 10px rgba(0,0,0,.08)}
        .gn-wrap{max-width:1200px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .gn-brand{display:flex;align-items:center;gap:10px;color:inherit;text-decoration:none}
        .gn-logo{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#41b883,#2f855a);display:grid;place-items:center;font-weight:800;font-size:18px;color:#0b1a13;box-shadow:inset 0 0 0 2px rgba(255,255,255,.15)}
        .gn-name{font-size:18px;font-weight:700;letter-spacing:.3px}
        .gn-nav{display:flex;align-items:center;gap:8px}
        .gn-burger{display:none;align-items:center;justify-content:center;width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);cursor:pointer}
        .gn-mobile{display:none;padding:10px 16px 14px;border-top:1px solid rgba(255,255,255,.12);background:#0e1f16}

        /* responsive */
        @media (max-width: 800px){
          .gn-nav{display:none}
          .gn-burger{display:inline-flex}
          .gn-mobile{display:block}
        }
      `}</style>

      <div className="gn-wrap">
        {/* Brand */}
        <Link to="/" className="gn-brand" onClick={() => setOpen(false)}>
        <img
      src="/favicon.ico"
      alt="GreenNest Logo"
      style={{
        width: 34,
        height: 34,
        borderRadius: 8,
        objectFit: "contain",
        background: "linear-gradient(135deg, #41b883, #2f855a)",
        padding: 4,
      }}
    />
          <div className="gn-name">GreenNest</div>
        </Link>

        {/* Desktop nav */}
        <nav className="gn-nav">
          <NavLink to="/home" style={linkStyle}>Home</NavLink>
          <NavLink to="/catalog" style={linkStyle}>Products</NavLink>
          <NavLink to="/cart" style={linkStyle}>Cart</NavLink>
          <NavLink to="/profile" style={linkStyle}>Profile</NavLink>
          
        </nav>

        {/* Mobile burger */}
        <button aria-label="Toggle menu" className="gn-burger" onClick={() => setOpen(v => !v)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="gn-mobile">
          <div style={{display:"grid",gap:8}}>
            <NavLink to="/" style={linkStyle} onClick={() => setOpen(false)}>Home</NavLink>
            <NavLink to="/catalog" style={linkStyle} onClick={() => setOpen(false)}>Products</NavLink>
            <NavLink to="/cart" style={linkStyle} onClick={() => setOpen(false)}>Cart</NavLink>
            <NavLink to="/orders" style={linkStyle} onClick={() => setOpen(false)}>Orders</NavLink>
            <NavLink to="/login" style={linkStyle} onClick={() => setOpen(false)}>Login</NavLink>
          </div>
        </div>
      )}
    </header>
  );
}
