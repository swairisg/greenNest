import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthCtx } from "../../auth/AuthProvider";
import logo from "../../assests/logo-leaf.png"; // adjust path if needed
import "./Landing.css";

export default function Landing() {
  const { user } = useAuthCtx() || {};
  const nav = useNavigate();

  const goPrimary = () => {
    if (!user) return nav("/auth/login");
    // send known roles straight to their place
    if (user.role === "admin" || user.roles?.includes("admin")) return nav("/admin");
    if (user.roles?.includes("farmer") || user.role === "farmer") return nav("/farmer");
    return nav("/home"); // default customer
  };

  return (
    <div className="gn-landing">
      {/* Top nav */}
      <header className="gn-ln-top">
        <div className="brand">
          <img src={logo} alt="GreenNest" />
          <span>GreenNest</span>
        </div>
        <nav className="links">
          <a href="#features">Features</a>
          <a href="#audiences">Who it’s for</a>
          <a href="#contact">Contact</a>
        </nav>
        <div className="actions">
          {user ? (
            <button className="btn primary" onClick={goPrimary}>Open Dashboard</button>
          ) : (
            <>
              <Link className="btn ghost" to="/auth/login">Log in</Link>
              <Link className="btn primary" to="/auth/signup">Sign up</Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="gn-ln-hero">
        <div className="copy">
          <h1>Smart Greenhouse in Nuwara Eliya</h1>
          <p>Real-time climate, pest alerts, yield insights—built for growers and delightful for customers.</p>
          <div className="cta">
            <Link className="btn primary lg" to="/book-visit">Book a Visit</Link>
            <button className="btn dark lg" onClick={goPrimary}>
              {user ? "Go to Dashboard" : "Explore Dashboard"}
            </button>
          </div>
          <div className="trust">
            <span>✅ Live monitoring</span>
            <span>✅ Secure role access</span>
            <span>✅ Sri Lanka–hosted support</span>
          </div>
        </div>
        <div className="hero-media" aria-hidden="true">
          {/* Replace with your greenhouse photo if you have one */}
          <div className="mock-photo" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="gn-ln-features">
        <div className="card">
          <div className="icon">🌡️</div>
          <h3>Climate Monitoring</h3>
          <p>Track temperature, humidity & soil moisture instantly.</p>
        </div>
        <div className="card">
          <div className="icon">🪲</div>
          <h3>Pest Alerts</h3>
          <p>Detect outbreaks fast and assign actions to staff.</p>
        </div>
        <div className="card">
          <div className="icon">📈</div>
          <h3>Yield Forecast</h3>
          <p>Plan harvests and inventory with accurate predictions.</p>
        </div>
        <div className="card">
          <div className="icon">🛒</div>
          <h3>Catalog & Orders</h3>
          <p>Browse products, check availability, and place orders.</p>
        </div>
      </section>

      {/* Audience split */}
      <section id="audiences" className="gn-ln-split">
        <div className="split-card staff">
          <h2>For Greenhouse Team</h2>
          <ul>
            <li>Role-based dashboards (Admin, HR, Finance, Farmer)</li>
            <li>Tasks, schedules, and real-time operations</li>
            <li>Reports & analytics for better decisions</li>
          </ul>
          <div className="cta-row">
            <Link className="btn dark" to="/auth/login">Staff Login</Link>
            <Link className="btn ghost" to="/admin">View Admin Demo</Link>
          </div>
        </div>
        <div className="split-card customers">
          <h2>For Customers</h2>
          <ul>
            <li>Book a greenhouse visit easily</li>
            <li>Browse products & pricing</li>
            <li>Track your orders in your profile</li>
          </ul>
          <div className="cta-row">
            <Link className="btn primary" to="/book-visit">Book a Visit</Link>
            <Link className="btn ghost" to="/catalog">Open Catalog</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="gn-ln-footer">
        <div>© {new Date().getFullYear()} GreenNest. All rights reserved.</div>
        <div className="foot-links">
          <a href="mailto:hello@greennest.lk">hello@greennest.lk</a>
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
        </div>
      </footer>
    </div>
  );
}
