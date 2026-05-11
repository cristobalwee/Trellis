import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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

const Flower = ({ type, top, left, rotate, scale, index }: FlowerProps) => {
  const reducedMotion = useReducedMotion();

  const visible = { opacity: 1, scale, rotate };
  const hidden = { opacity: 0, scale: 0, rotate: rotate - 25 };

  return (
    <motion.div
      style={{
        position: 'absolute',
        top,
        left,
        width: 'clamp(40px, 5vw, 60px)',
        height: 'clamp(40px, 5vw, 60px)',
        zIndex: 0,
        pointerEvents: 'none',
        x: '-50%',
        y: '-50%',
      }}
      initial={reducedMotion ? visible : hidden}
      whileInView={visible}
      viewport={{ once: true, margin: '-40px' }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.7, delay: index * 0.08, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] }
      }
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
  const flowers: Omit<FlowerProps, 'index'>[] = [
    { type: 'pink',   top: '6%',  left: '48%', rotate: -15, scale: 0.9  },
    { type: 'leaf1',  top: '16%', left: '52%', rotate:  45, scale: 0.8  },
    { type: 'yellow', top: '28%', left: '47%', rotate:  10, scale: 1.1  },
    { type: 'leaf2',  top: '42%', left: '53%', rotate: -20, scale: 0.75 },
    { type: 'pink',   top: '56%', left: '49%', rotate:  25, scale: 1.0  },
    { type: 'yellow', top: '72%', left: '51%', rotate: -10, scale: 0.85 },
    { type: 'leaf1',  top: '88%', left: '48%', rotate:  60, scale: 0.9  },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-50 md:opacity-100" style={{ zIndex: 0 }}>
      {/* Trellis Lattice — fades in from the top so it reads as growing down from the hero */}
      <motion.div
        className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-20 md:w-28 lg:w-32 opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='36' height='36' viewBox='0 0 36 36' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0L36 36M36 0L0 36' stroke='%23E5E7EB' stroke-width='2.5' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center',
          maskImage: 'linear-gradient(to bottom, transparent, black 4%, black 96%, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 4%, black 96%, transparent)',
          transformOrigin: 'top center',
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
      />

      {/* Flowers/Leaves — each pops in once it scrolls into view */}
      <div className="relative w-full h-full max-w-7xl mx-auto opacity-50 md:opacity-100">
        {flowers.map((flower, i) => (
          <Flower key={i} {...flower} index={i} />
        ))}
      </div>
    </div>
  );
};

export default TrellisScrollAnimation;
