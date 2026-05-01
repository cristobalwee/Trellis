import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { siteImages } from '../lib/siteImages';

interface FlowerProps {
  type: 'pink' | 'yellow' | 'leaf1' | 'leaf2';
  top: string;
  left: string;
  rotate: number;
  scale: number;
  index: number;
}

const ASSETS = {
  pink: siteImages.flowerPink,
  yellow: siteImages.flowerYellow,
  leaf1: siteImages.leaf1,
  leaf2: siteImages.leaf2,
};

const Flower = ({ type, top, left, rotate, scale, index, scrollYProgress }: FlowerProps & { scrollYProgress: any }) => {
  // Stagger the fade in based on vertical position (top)
  const topValue = parseFloat(top);
  
  // Refined thresholds for distinct staggering:
  // We use the full 0-1 range of the section's visibility to map the pop-ins.
  // Each flower starts its animation slightly before its vertical position hits the middle of the screen.
  const startIn = (topValue / 100) * 0.7; 
  const endIn = startIn + 0.15; // Quick pop-in window
  
  // Fade out logic: starts as the flower moves towards the top of the viewport
  const startOut = Math.min(0.9, startIn + 0.45);
  const endOut = Math.min(1, startOut + 0.15);

  const opacity = useTransform(
    scrollYProgress,
    [startIn, endIn, startOut, endOut],
    [0, 1, 1, 0]
  );

  const flowerScale = useTransform(
    scrollYProgress,
    [startIn, endIn, startOut, endOut],
    [0, scale, scale, 0]
  );

  const flowerRotate = useTransform(
    scrollYProgress,
    [startIn, endIn],
    [rotate - 25, rotate]
  );

  return (
    <motion.div
      style={{
        position: 'absolute',
        top,
        left,
        width: 'clamp(40px, 5vw, 60px)', // Smaller size as requested
        height: 'clamp(40px, 5vw, 60px)',
        zIndex: 0,
        pointerEvents: 'none',
        opacity,
        scale: flowerScale,
        rotate: flowerRotate,
        x: '-50%',
        y: '-50%',
      }}
    >
      <img 
        src={ASSETS[type]} 
        alt="" 
        className="w-full h-full object-contain"
      />
    </motion.div>
  );
};

export const TrellisScrollAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const flowers: Omit<FlowerProps, 'index'>[] = [
    { type: 'pink', top: '15%', left: '48%', rotate: -15, scale: 0.9 },
    { type: 'leaf1', top: '25%', left: '52%', rotate: 45, scale: 0.8 },
    { type: 'yellow', top: '40%', left: '47%', rotate: 10, scale: 1.1 },
    { type: 'leaf2', top: '55%', left: '53%', rotate: -20, scale: 0.75 },
    { type: 'pink', top: '70%', left: '49%', rotate: 25, scale: 1.0 },
    { type: 'yellow', top: '85%', left: '51%', rotate: -10, scale: 0.85 },
    { type: 'leaf1', top: '92%', left: '48%', rotate: 60, scale: 0.9 },
  ];

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden opacity-50 md:opacity-100" style={{ zIndex: 0 }}>
      {/* Trellis Lattice - Slightly narrower with thicker internal lines */}
      <div 
        className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-20 md:w-28 lg:w-32 opacity-40"
        style={{
          // Denser pattern: 25x25 diamonds, even thicker lines (stroke-width 2.5)
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='36' height='36' viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0L36 36M36 0L0 36' stroke='%23E5E7EB' stroke-width='2.5' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)',
        }}
      />
      
      {/* Flowers/Leaves */}
      <div className="relative w-full h-full max-w-7xl mx-auto opacity-50 md:opacity-100">
        {flowers.map((flower, i) => (
          <Flower key={i} {...flower} index={i} scrollYProgress={scrollYProgress} />
        ))}
      </div>
    </div>
  );
};

export default TrellisScrollAnimation;
