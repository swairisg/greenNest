import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './CardSwap.css';

const CardSwap = ({ cards }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="card-swap-container">
      {/* Main active card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          className="active-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="card-content">
            <h3>{cards[activeIndex].title}</h3>
            <p>{cards[activeIndex].content}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Card selector buttons */}
      <div className="card-selector">
        {cards.map((card, index) => (
          <button
            key={index}
            className={`selector-btn ${index === activeIndex ? 'active' : ''}`}
            onClick={() => setActiveIndex(index)}
          >
            {card.title}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CardSwap;