import React from "react";
import "./Landing.css";
import logo from "../../../assests/logo-leaf.png";
import landing from "../../../assests/landing/landing1.png";
import landing2 from "../../../assests/landing/landing2.png";

export default function LandingSimple() {
  return (
    <div className="lp" style={{ "--lp-bg": `url(${landing})` }}>
      {/* NAV */}
      <header className="lp-nav">
        <div className="lp-container lp-hero-grid lp-hero-one-col">
          <div className="lp-brand">
            <img src={logo} alt="GreenNest" className="lp-logo" />
            <span>GreenNest</span>
          </div>
          <nav className="lp-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
            <a className="lp-btn" href="/auth/Login">Sign in</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div>
            <h1>Modern Greenhouse Management</h1>
            <p>
              Plan harvests, monitor climate in real time, catch pests early, streamline tasks, and sell online—without juggling five apps.
            </p>
            <div className="lp-actions">
              <a className="lp-btn lp-primary" href="/auth/Signup">Get Started</a>
            </div>
          </div>
          <div className="lp-hero-card">
            <img alt="Greenhouse" src={landing} />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="lp-section">
        <div className="lp-container">
          <h2 className="lp-center">What you can do</h2>
          <div className="lp-grid">
            <div className="lp-card">
              <h3>Cultivation Planning</h3>
              <p>Create schedules, estimate harvest dates, and log growth.</p>
            </div>
            <div className="lp-card">
              <h3>Climate Monitoring</h3>
              <p>Track temperature/humidity and set alert thresholds.</p>
            </div>
            <div className="lp-card">
              <h3>Pest & Disease</h3>
              <p>Record incidents, severity levels, and actions taken.</p>
            </div>
            <div className="lp-card">
              <h3>Analytics</h3>
              <p>See trends and export simple PDF/CSV reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="lp-section lp-muted">
        <div className="lp-container lp-about">
          <div>
            <h2>Built for teams & customers</h2>
            <p>
              Operators run daily checklists, climate targets, pest logs, and inventory movements; managers get KPIs and exports. Customers discover products, submit inquiries, and confirm visit dates—no back-and-forth.
            </p>
            <div className="lp-actions">
              <a className="lp-btn lp-primary" href="/auth/Login">Go to Portal</a>
            </div>
          </div>
          <img
            alt="Inside greenhouse"
            src={landing2}
          />
        </div>
      </section>

      {/* CONTACT */}
<section id="contact" className="lp-section">
  <div className="lp-container lp-contact">
    <div>
      <h2>Contact us</h2>
      <p className="lp-soft">We’ll reply within 1 business day.</p>

      <div className="lp-info-cards">
        <div className="lp-info-card">
          <div className="lp-info-ico">✉️</div>
          <div>
            <div className="lp-info-title">Email</div>
            <a href="mailto:support@greennest.app" className="lp-info-link">
              support@greennest.app
            </a>
          </div>
        </div>

        <div className="lp-info-card">
          <div className="lp-info-ico">📞</div>
          <div>
            <div className="lp-info-title">Phone</div>
            <a href="tel:+94111234567" className="lp-info-link">
              +94 11 123 4567
            </a>
          </div>
        </div>

        <div className="lp-info-card">
          <div className="lp-info-ico">📍</div>
          <div>
            <div className="lp-info-title">Location</div>
            <div className="lp-info-text">Nuwara Eliya, Sri Lanka</div>
          </div>
        </div>
      </div>

      <div className="lp-actions mt-16">
        <a className="lp-btn lp-primary" href="mailto:support@greennest.app">Email us</a>
        <a className="lp-btn lp-outline" href="tel:+94111234567">Call now</a>
      </div>
    </div>

    <br></br>
    <br></br>
    <br></br>

    {/* Map (optional) */}
    <div className="lp-map">
      <iframe
        title="GreenNest Location"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src="https://www.google.com/maps?q=Nuwara%20Eliya%2C%20Sri%20Lanka&output=embed"
      />
    </div>
  </div>
</section>


      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-row">
          <span>© {new Date().getFullYear()} GreenNest</span>
          <div className="lp-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
