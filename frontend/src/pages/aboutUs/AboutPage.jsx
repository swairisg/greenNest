import React from 'react';
import { motion } from 'framer-motion';
import CardSwap from '../../components/CardSwap/CardSwap';
import './AboutPage.css';


import img1 from '../../assets/images/greenhouse/img1.jpg';
import img2 from '../../assets/images/greenhouse/img2.png';
import img3 from '../../assets/images/greenhouse/img3.jpg';
import img4 from '../../assets/images/greenhouse/img4.jpg';
import img5 from '../../assets/images/greenhouse/img5.png';
import img6 from '../../assets/images/greenhouse/img6.jpg';

const AboutPage = () => {
  const greenhouseImages = [img1, img2, img3, img4, img5, img6];

  const aboutCards = [
    {
      title: "About Us",
      content: "GreenNest revolutionizes agricultural management through innovative technology and sustainable practices. We combine cutting-edge climate monitoring, intelligent inventory systems, and supply chain optimization to empower farmers and agricultural businesses worldwide."
    },
    {
      title: "Our Mission",
      content: "To empower farmers and agricultural businesses with intelligent inventory management, climate monitoring, and supply chain optimization tools for sustainable farming practices that increase yield while reducing environmental impact."
    },
    {
      title: "Our Vision", 
      content: "A world where technology-driven agriculture ensures food security, environmental sustainability, and economic prosperity for farming communities worldwide through accessible, efficient, and eco-friendly solutions."
    }
  ];

  const teamMembers = [
    {
      name: "Dr. Sarah Chen",
      role: "Head of Horticulture",
      experience: "15+ years in greenhouse management",
      avatar: "👩‍🌾"
    },
    {
      name: "Mark Thompson", 
      role: "Automation Specialist",
      experience: "Expert in greenhouse automation systems",
      avatar: "👨‍💻"
    },
    {
      name: "Dr. Elena Rodriguez",
      role: "Climate Scientist", 
      experience: "PhD in environmental science",
      avatar: "👩‍🔬"
    },
    {
      name: "James Wilson",
      role: "Supply Chain Director",
      experience: "10+ years agricultural logistics",
      avatar: "👨‍💼"
    }
  ];

  return (
    <div className="about-page split-layout">
      {/*hero Section */}
     <section className="about-hero">
  <div className="container">
    <motion.div 
      className="text-left"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.h1 
        className='text-4xl font-medium text-gray-900 mb-2 tracking-wide'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        About GreenNest
      </motion.h1>
      
      <div className='flex  space-x-1 mb-3'>
        <div className='w-1 h-1 bg-green-400 rounded-full'></div>
        <div className='w-1 h-1 bg-green-400 rounded-full'></div>
        <div className='w-1 h-1 bg-green-400 rounded-full'></div>
      </div>
      
      <motion.p 
        className='text-gray-900 text-sm max-w-xl'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        Revolutionizing Agricultural Management Through Innovative Technology & Sustainable Practices
      </motion.p>
    </motion.div>
  </div>
</section>

      {/*2-Column main Content */}
      <section className="main-content">
        <div className="container">
          <div className="content-grid">
            
            {/*leftcol */}
            <div className="text-column">
              <div className="content-section">
                <h2>Our Story</h2>
                <CardSwap cards={aboutCards} />
              </div>

              {/*features*/}
              <div className="features-section">
                <h3>What We Offer</h3>
                <div className="features-grid">
                  <div className="feature-item">
                    <span className="feature-icon">📊</span>
                    <div>
                      <h4>Smart Inventory</h4>
                      <p>Real-time stock tracking and automated reordering</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🌡️</span>
                    <div>
                      <h4>Climate Intelligence</h4>
                      <p>Advanced environmental monitoring systems</p>
                    </div>
                  </div>
                  <div className="feature-item">
                    <span className="feature-icon">🔗</span>
                    <div>
                      <h4>Supply Chain</h4>
                      <p>End-to-end logistics optimization</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Image Gallery */}
            <div className="image-column">
              <div className="image-gallery">
                <h3>Our Greenhouse</h3>
                <div className="gallery-grid">
                  {greenhouseImages.map((image, index) => (
                    <motion.div
                      key={index}
                      className="gallery-item"
                      whileHover={{ scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <img src={image} alt={`Greenhouse ${index + 1}`} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Our Experts Section - Horizontal Row */}
      <section className="experts-section">
        <div className="container">
          <h2>Our Experts</h2>
          <div className="experts-grid">
            {teamMembers.map((member, index) => (
              <motion.div 
                key={index}
                className="expert-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="expert-avatar">{member.avatar}</div>
                <h3>{member.name}</h3>
                <p className="expert-role">{member.role}</p>
                <p className="expert-experience">{member.experience}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <h2>Get In Touch</h2>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">📧</span>
              <span>contact@greennest.com</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📱</span>
              <span>+94 71 1138 509</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <span>Nuwara Eliya , Sri Lanka</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;