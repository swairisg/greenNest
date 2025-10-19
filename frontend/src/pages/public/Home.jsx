/*import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth"; // ← changed import
import "../../styles/theme.css";
import "../../styles/app.css";

export default function Home() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const doLogout = async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="gn-container" style={{ maxWidth: 900 }}>
      <div className="gn-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ marginTop: 0, color: "var(--green-dark)" }}>
              Welcome to GreenNest
            </h2>
            <p className="text-muted" style={{ marginTop: 6 }}>
              This is a demo home page for customers.
            </p>
          </div>
          <button className="gn-btn ghost" onClick={doLogout}>
            Logout
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Link className="gn-btn primary" to="/profile">
            View My Profile
          </Link>
          
          <Link className="gn-btn ghost" to="/catalog">Shop Products</Link>
        </div>
      </div>
    </div>
  );
}*/

import React, { useState, useEffect } from "react";
import "./Home.css";
import { Link } from "react-router-dom";

/* === Chatbot (customer) === */
import CustomerChatbot from "./components/CustomerChatbot";
import "./components/customerChat.css";

/* === HERO / CAROUSEL IMAGES === */
import home1 from "../../assests/Home/home1.jpg";
import home2 from "../../assests/Home/home2.jpg";
import home3 from "../../assests/Home/home3.jpg";

/* === CROP CARD IMAGES === */
import strawberryhome from "../../assests/Home/strawberryhome.jpg";
import lillyhome from "../../assests/Home/lillyhome.jpg";
import tomatoeshome from "../../assests/Home/tomatoeshome.jpg";
import cabbagehome from "../../assests/Home/cabbagehome.jpg";

const HomePage = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    { url: home1, alt: "strawberry image" },
    { url: home2, alt: "greenhouse" },
    { url: home3, alt: "flowers" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev === images.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="home-homepage">
      {/* ===== HERO ===== */}
      <section className="home-home_hero">
        <div className="home-home_carousel">
          <div className="home-home_carousel-images">
            {images.map((image, index) => (
              <div
                key={index}
                className={`home-home_carousel-image ${
                  index === currentImageIndex ? "home-active" : ""
                }`}
                style={{ backgroundImage: `url(${image.url})` }}
              />
            ))}
          </div>

          <div className="home-home_carousel-indicators">
            {images.map((_, index) => (
              <button
                key={index}
                className={`home-home_indicator ${
                  index === currentImageIndex ? "home-active" : ""
                }`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        </div>

        <div className="home-hero-content">
          <div className="home-container">
            <h1>Freshness You Can Taste, Quality You Can Trust</h1>
            <p>
              GreenNest brings you the freshest strawberries, vibrant vegetables,
              and blooming flowers, carefully grown in the cool hills of Nuwara Eliya.
            </p>
            <div className="home-cta-buttons">
              <Link className="home-btn home-primary" to="/Aboutus">Learn More</Link>
              <Link className="home-btn home-secondary" to="/visit/book">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== OUR CROPS ===== */}
      <section className="home-our-crops-section">
        <div className="home-container">
          <h2 className="home-section-title">Our Premium Crops</h2>
          <p className="home-section-subtitle">
            Carefully cultivated in our state-of-the-art greenhouses
          </p>

          <div className="home-crops-grid">
            {/* Strawberry */}
            <div className="home-crop-card">
              <img className="home-crop-photo" src={strawberryhome} alt="Strawberry" />
              <div className="home-crop-body">
                <h3>Strawberry</h3>
                <p>Premium quality strawberries grown with advanced greenhouse technology</p>
                <div className="home-crop-tag">Flagship Product</div>
              </div>
            </div>

            {/* Lilly */}
            <div className="home-crop-card">
              <img className="home-crop-photo" src={lillyhome} alt="Lilly" />
              <div className="home-crop-body">
                <h3>Lilly</h3>
                <p>Beautiful flowering plants and ornamental flowers for all occasions</p>
                <div className="home-crop-tag">Ornamental</div>
              </div>
            </div>

            {/* Tomatoes */}
            <div className="home-crop-card">
              <img className="home-crop-photo" src={tomatoeshome} alt="Tomatoes" />
              <div className="home-crop-body">
                <h3>Tomatoes</h3>
                <p>Fresh, juicy tomatoes cultivated in controlled greenhouse environments</p>
                <div className="home-crop-tag">Vegetable</div>
              </div>
            </div>

            {/* Cabbage */}
            <div className="home-crop-card">
              <img className="home-crop-photo" src={cabbagehome} alt="Cabbage" />
              <div className="home-crop-body">
                <h3>Cabbage</h3>
                <p>High-quality leafy vegetables grown using sustainable practices</p>
                <div className="home-crop-tag">Leafy Vegetable</div>
              </div>
            </div>
          </div>

          <div className="home-crops-cta">
            <Link className="home-btn home-primary" to="/catalog">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ===== WHAT WE OFFER ===== */}
      <section className="home-offer-section">
        <div className="home-container">
          <h2 className="home-section-title">What we offer</h2>

          <div className="home-offer-grid">
            <Link to="/products" className="home-offer-card">
              <h3>Equipment</h3>
              <p>Smart farming essentials to power daily operations.</p>
              <span className="home-offer-cta">Discover</span>
            </Link>

            <Link to="/products" className="home-offer-card">
              <h3>Fresh Produce</h3>
              <p>Nature’s finest harvest from our controlled environments.</p>
              <span className="home-offer-cta">Discover</span>
            </Link>

            <Link to="/contactus" className="home-offer-card">
              <h3>Wholesale Services</h3>
              <p>Bulk orders and tailored supply for retailers and partners.</p>
              <span className="home-offer-cta">Contact Us</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== WHY CHOOSE GREENNEST ===== */}
      <section className="home-why-choose-section">
        <div className="home-container">
          <h2 className="home-why-title">Why Choose GreenNest?</h2>

          <div className="home-features-grid">
            {/* Expertise */}
            <div className="home-feature-item">
              <div className="home-feature-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7.5 4A3.5 3.5 0 0 0 4 7.5v2A3.5 3.5 0 0 0 7.5 13H9v-1.5A2.5 2.5 0 0 0 6.5 9 2.5 2.5 0 0 0 9 6.5V6A2 2 0 0 0 7.5 4ZM16.5 4A2 2 0 0 0 15 6v.5A2.5 2.5 0 0 0 17.5 9 2.5 2.5 0 0 0 15 11.5V13h1.5A3.5 3.5 0 0 0 20 9.5v-2A3.5 3.5 0 0 0 16.5 4ZM9 13v3a2 2 0 1 1-4 0v-1" />
                  <path d="M15 13v3a2 2 0 1 0 4 0v-1" />
                </svg>
              </div>
              <div className="home-feature-content">
                <h3>Expertise in Innovation</h3>
                <p>
                  Advanced greenhouse technology with AI-powered monitoring and automation
                  for superior crop management.
                </p>
              </div>
            </div>

            {/* Tailored */}
            <div className="home-feature-item">
              <div className="home-feature-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8 3h3a2 2 0 1 1 2 2h3a2 2 0 0 1 2 2v3h-1a2 2 0 1 0 0 4h1v3a2 2 0 0 1-2 2h-3v-1a2 2 0 1 0-4 0v1H8a2 2 0 0 1-2-2v-3h1a2 2 0 1 0 0-4H6V7a2 2 0 0 1 2-2Z" />
                </svg>
              </div>
              <div className="home-feature-content">
                <h3>Tailored Greenhouse Solutions</h3>
                <p>
                  Custom-fit greenhouse management and data-driven farming
                  for optimal yield and operational efficiency.
                </p>
              </div>
            </div>

            {/* Operations */}
            <div className="home-feature-item">
              <div className="home-feature-icon">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3a9 9 0 1 0 0 18A9 9 0 0 0 12 3Zm0 0c-2.5 0-4.5 4-4.5 9s2 9 4.5 9 4.5-4 4.5-9-2-9-4.5-9Zm-7 9h14M5 8h14M5 16h14" />
                </svg>
              </div>
              <div className="home-feature-content">
                <h3>Comprehensive Operations</h3>
                <p>
                  End-to-end coverage — remote management, workforce coordination,
                  inventory tracking, and sales integration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS PILL ===== */}
      <section className="home-stats-section">
        <div className="home-container home-stats-wrap">
          <div className="home-stats-pill">
            <div className="home-stat">
              <div className="home-stat-value">85%</div>
              <div className="home-stat-label">REMOTE MONITORING</div>
            </div>
            <div className="home-stat">
              <div className="home-stat-value">70%</div>
              <div className="home-stat-label">LOW OPERATION COST</div>
            </div>
            <div className="home-stat">
              <div className="home-stat-value">80%</div>
              <div className="home-stat-label">HIGH YIELD</div>
            </div>
            <div className="home-stat">
              <div className="home-stat-value">100%</div>
              <div className="home-stat-label">PESTICIDE FREE</div>
            </div>
            <div className="home-stat">
              <div className="home-stat-value">8</div>
              <div className="home-stat-label">CROPS</div>
            </div>
          </div>
        </div>
      </section>

      {/* === Customer Chatbot (floating) === */}
      <CustomerChatbot />
    </div>
  );
};

export default HomePage;
