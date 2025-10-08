/*import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";   // ← changed import
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ marginTop: 0, color: "var(--green-dark)" }}>Welcome to GreenNest</h2>
            <p className="text-muted" style={{ marginTop: 6 }}>
              This is a demo home page for customers.
            </p>
          </div>
          <button className="gn-btn ghost" onClick={doLogout}>Logout</button>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <Link className="gn-btn primary" to="/profile">View My Profile</Link>
          <Link className="gn-btn ghost" to="/products">Shop Products</Link>
        </div>
      </div>
    </div>
  );
}*/



import React, { useState, useEffect } from "react";
import "./Home.css";
import { Link } from "react-router-dom";

/* ===== HERO / CAROUSEL IMAGES (you already had these) ===== */
import home1 from "../../assests/Home/home1.jpg";
import home2 from "../../assests/Home/home2.jpg";
import home3 from "../../assests/Home/home3.jpg";

/* ===== CROP CARD IMAGES (your requested names) ===== */
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
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="home-homepage">
      {/* ================= HERO ================= */}
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
              GreenNest brings you the freshest strawberries, vibrant vegetables, and blooming
              flowers, carefully grown in the cool hills of Nuwara Eliya.
            </p>
            <div className="home-cta-buttons">
              <Link className="home-btn home-primary" to="/Aboutus">
                Learn More
              </Link>
              <Link className="home-btn home-secondary" to="/contactus">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============== OUR CROPS (now with images) ============== */}
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
            <Link className="home-btn home-primary" to="/products">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* ============== WHAT WE OFFER (bg images + overlay) ============== */}
      <section className="home-product-catalogue-section">
        <div className="home-container">
          <h2 className="home-section-title">What we offer</h2>

          <div className="home-catalogue-grid">
            {/* Equipments */}
            <Link
              to="/products"
              className="home-catalogue-box home-with-bg"
              style={{ "--home-bg": `url(${home2})` }}
            >
              <div className="home-box-content">
                <h3>Equipments</h3>
                <p>Smart Farming Essentials</p>
                <span className="home-discover-btn">Discover</span>
              </div>
            </Link>

            {/* Fresh Produce */}
            <Link
              to="/products"
              className="home-catalogue-box home-with-bg"
              style={{ "--home-bg": `url(${strawberryhome})` }}
            >
              <div className="home-box-content">
                <h3>Fresh Produce</h3>
                <p>Nature's Finest Produce</p>
                <span className="home-discover-btn">Discover</span>
              </div>
            </Link>

            {/* Services */}
            <Link
              to="/contactus"
              className="home-catalogue-box home-with-bg"
              style={{ "--home-bg": `url(${home3})` }}
            >
              <div className="home-box-content">
                <h3>Services</h3>
                <p>Expert Agricultural Services</p>
                <span className="home-discover-btn">Discover</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
