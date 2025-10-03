import { useRef, useEffect } from 'react';

export function useImageTrail(count = 10) {
  const elementsRef = useRef([]);
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      
      elementsRef.current.forEach((element, index) => {
        if (!element) return;
        
        const delay = index * 50; // Staggered delay
        const scale = 1 - (index * 0.08); // Decreasing scale
        const opacity = 1 - (index * 0.1); // Decreasing opacity
        
        setTimeout(() => {
          element.style.transform = `translate(${clientX}px, ${clientY}px) scale(${scale})`;
          element.style.opacity = Math.max(opacity, 0.1);
        }, delay);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return elementsRef;
}