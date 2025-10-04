import React, { useState } from "react";
import hv_schedule from "../../../assests/customers/contactimg.jpg";
import "./ContactUs.css";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE } from "../../../api";

const isEmail = (v = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NO /public
  const CONTACT_URL = `${API_BASE}/contact-us`;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = [];
    if (!formData.name.trim()) errs.push("Name is required.");
    if (!isEmail(formData.email)) errs.push("A valid email is required.");
    if (!formData.message.trim()) errs.push("Message is required.");

    if (errs.length) {
      Swal.fire({
        icon: "error",
        title: "Please check the form",
        html: `<ul style="text-align:left;margin:0;padding-left:18px">${errs
          .map((x) => `<li>${x}</li>`)
          .join("")}</ul>`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        message: formData.message.trim(),
      };
      const { data } = await axios.post(CONTACT_URL, payload);

      Swal.fire({
        title: "Success!",
        text: data?.message || "Message submitted successfully!",
        icon: "success",
        confirmButtonColor: "#2d5016",
        confirmButtonText: "OK",
      });

      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong! Please try again.";
      Swal.fire({
        title: "Error!",
        text: msg,
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "Try Again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-container">
      <main className="contact-main">
        <section className="contact-hero-image">
          <img src={hv_schedule} alt="greennest" className="contact-hero-img" />
        </section>

        <section className="contact-company-details">
          <h2 className="contact-company-title"><strong>Contact us</strong></h2>
          <p className="contact-company-info"><strong>Phone:</strong> +94 11 234 5678</p>
          <p className="contact-company-info"><strong>Email:</strong> info@greennest.com</p>
          <p className="contact-company-info">
            <strong>Address:</strong> 821/4/D NuwaraEliya, Sri Lanka
          </p>
          <p className="contact-company-social-title"><strong>Follow us:</strong></p>
          <div className="contact-social-media">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="contact-social-link">
              <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" className="contact-social-icon" />
              Facebook
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="contact-social-link">
              <img src="https://cdn-icons-png.flaticon.com/512/733/733579.png" alt="Twitter" className="contact-social-icon" />
              Twitter
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="contact-social-link">
              <img src="https://cdn-icons-png.flaticon.com/512/733/733558.png" alt="Instagram" className="contact-social-icon" />
              Instagram
            </a>
          </div>
        </section>

        <section className="contact-form-section">
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form-group">
              <label htmlFor="name" className="contact-form-label">Name:</label>
              <input
                className="contact-form-input contact-form-name"
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={80}
              />
            </div>
            <div className="contact-form-group">
              <label htmlFor="email" className="contact-form-label">Email:</label>
              <input
                className="contact-form-input contact-form-email"
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                inputMode="email"
              />
            </div>
            <div className="contact-form-group">
              <label htmlFor="message" className="contact-form-label">Message:</label>
              <textarea
                className="contact-form-textarea"
                id="message"
                name="message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
                maxLength={1000}
              />
              <div style={{ textAlign: "right", fontSize: 12, opacity: 0.7 }}>
                {(formData.message || "").length}/1000
              </div>
            </div>
            <button className="contact-submit-btn" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Submit Message"}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default ContactUs;
