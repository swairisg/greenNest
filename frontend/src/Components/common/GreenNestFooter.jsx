import React from "react";
import { Link } from "react-router-dom";

export default function GreenNestFooter() {
  const accent = "#e91e63"; // pink accent line
  const textColor = "#e8f5e9";
  const bg = "#0e1f16";

  const colTitle = {
    fontWeight: 600,
    fontSize: 15,
    marginBottom: 12,
    position: "relative",
    display: "inline-block",
  };

  const underline = {
    content: "''",
    position: "absolute",
    bottom: -4,
    left: 0,
    width: "40px",
    height: "2px",
    backgroundColor: accent,
  };

  const linkStyle = {
    color: textColor,
    textDecoration: "none",
    opacity: 0.85,
    fontSize: 14,
    padding: "4px 0",
    display: "block",
  };

  const iconBox = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(255,255,255,.08)",
    marginRight: 8,
  };

  return (
    <footer
    style={{
        background: bg,
        color: textColor,
        padding: "40px 20px 20px",
        marginTop: "auto", // this lets it push to bottom when parent uses flex-column
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24,
        }}
      >
        {/* --- Column 1: Company --- */}
        <div>
          <div style={colTitle}>
            Company
            <div style={underline}></div>
          </div>
          <Link to="/about" style={linkStyle}>
            About Us
          </Link>
          <Link to="/contact" style={linkStyle}>
            Contact Us
          </Link>
          <Link to="/schedule" style={linkStyle}>
            Book a Schedule
          </Link>
        </div>

        {/* --- Column 2: Shop --- */}
        <div>
          <div style={colTitle}>
            Shop
            <div style={underline}></div>
          </div>
          <Link to="/Home" style={linkStyle}>
            Home
          </Link>
          <Link to="/catalog" style={linkStyle}>
            Products
          </Link>
          <Link to="/cart" style={linkStyle}>
            Cart
          </Link>
        </div>

        {/* --- Column 3: Info (optional future section) --- */}
        <div>
          <div style={colTitle}>
            Info
            <div style={underline}></div>
          </div>
          <p style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>
            Fresh greenhouse-grown produce, managed with care and delivered with
            love.
          </p>
        </div>

        {/* --- Column 4: Follow Us (static) --- */}
        <div>
          <div style={colTitle}>
            Follow Us
            <div style={underline}></div>
          </div>
          <div style={{ display: "flex", marginTop: 8 }}>
            <div style={iconBox}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
              </svg>
            </div>
            <div style={iconBox}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </div>
            <div style={iconBox}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.46 2a9.05 9.05 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16 2a4.48 4.48 0 0 0-4.5 4.5c0 .35.04.7.12 1.03A12.82 12.82 0 0 1 3 3.6a4.5 4.5 0 0 0-.61 2.27c0 1.57.8 2.96 2 3.77A4.48 4.48 0 0 1 2 9.71v.06A4.5 4.5 0 0 0 4.5 14a4.53 4.53 0 0 1-2 .07A4.52 4.52 0 0 0 6.29 16 9.05 9.05 0 0 1 2 18.28a12.77 12.77 0 0 0 6.92 2.02A12.7 12.7 0 0 0 22 7.54 9.1 9.1 0 0 0 23 3z" />
              </svg>
            </div>
            <div style={iconBox}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </div>
          </div>
          <div
            style={{
              marginTop: 10,
              opacity: 0.7,
              fontSize: 13,
            }}
          >
            @GreenNest (static)
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,.1)",
          marginTop: 30,
          paddingTop: 12,
          fontSize: 13,
          textAlign: "center",
          opacity: 0.75,
        }}
      >
        © {new Date().getFullYear()} GreenNest. All rights reserved.
      </div>
    </footer>
  );
}