import React, { useRef, useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

interface AnimatedCTAProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  id?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
}

const ASSETS = {
  pink: '/src/assets/flower-pink.png',
  yellow: '/src/assets/flower-yellow.png',
  leaf2: '/src/assets/leaf-2.png',
};

export const AnimatedCTA: React.FC<AnimatedCTAProps> = ({
  children,
  className = '',
  onClick,
  id,
  variant = 'primary',
  size = 'md',
  ariaLabel,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Mouse tracking for magnetic effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 150 };
  const translateX = useSpring(mouseX, springConfig);
  const translateY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rafRef.current !== null) return;

    const { clientX, clientY } = e;
    
    rafRef.current = requestAnimationFrame(() => {
      if (!buttonRef.current) {
        rafRef.current = null;
        return;
      }
      
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Subtle cursor tracking - buttons move around as pointer does
      const distanceX = (clientX - centerX) * 0.1;
      const distanceY = (clientY - centerY) * 0.2;
      
      mouseX.set(distanceX);
      mouseY.set(distanceY);
      rafRef.current = null;
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    mouseX.set(0);
    mouseY.set(0);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const variantClasses = variant === 'primary' 
    ? 'btn btn-primary' 
    : 'btn btn-secondary';

  const sizeClasses = size === 'sm' 
    ? 'text-sm px-6 py-3' 
    : size === 'lg' 
      ? 'text-lg px-12 py-5' 
      : 'px-8 py-4';

  const isFullWidth = className.includes('w-full');
  const isSecondary = variant === 'secondary';

  return (
    <motion.div 
      className={`relative ${isFullWidth ? 'w-full' : 'inline-block'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: translateX,
        y: translateY,
      }}
    >
      {/* Flower Decorations - scaling up and in */}
      <motion.img
        src={ASSETS.pink}
        alt=""
        className={`absolute ${isSecondary ? '-top-2.5 -left-2.5 w-7 h-7' : '-top-4 -left-4 w-10 h-10'} pointer-events-none z-0`}
        initial={{ scale: 0, opacity: 0, x: 15, y: 15, rotate: -15 }}
        animate={isHovered ? { scale: 1, opacity: 1, x: 0, y: 0, rotate: 0 } : { scale: 0, opacity: 0, x: 15, y: 15, rotate: -15 }}
        transition={{ type: 'spring', damping: 20, stiffness: 200 }}
      />
      <motion.img
        src={ASSETS.yellow}
        alt=""
        className={`absolute ${isSecondary ? '-bottom-4.5 right-11.5 w-7 h-7' : '-bottom-6 right-12 w-10 h-10'} pointer-events-none z-0`}
        initial={{ scale: 0, opacity: 0, x: -15, y: -15, rotate: 15 }}
        animate={isHovered ? { scale: 1, opacity: 1, x: 0, y: 0, rotate: 0 } : { scale: 0, opacity: 0, x: -15, y: -15, rotate: 15 }}
        transition={{ type: 'spring', damping: 20, stiffness: 150, delay: 0.05 }}
      />
      <motion.img
        src={ASSETS.leaf2}
        alt=""
        className={`absolute ${isSecondary ? 'top-0 -right-7 w-9 h-9' : '-top-2 -right-10 w-12 h-12'} pointer-events-none z-0`}
        initial={{ scale: 0, opacity: 0, x: -25, y: -15, rotate: 45 }}
        animate={isHovered ? { scale: 1, opacity: 1, x: 0, y: 0, rotate: 0, transformOrigin: 'bottom' } : { scale: 0, opacity: 0, x: -25, y: -15, rotate: 15, transformOrigin: 'bottom' }}
        transition={{ type: 'spring', damping: 20, stiffness: 150, delay: 0.1 }}
      />

      <motion.button
        ref={buttonRef}
        id={id}
        onClick={onClick}
        aria-label={ariaLabel}
        className={`btn relative z-10 ${variantClasses} ${sizeClasses} ${className}`}
      >
        {children}
      </motion.button>
    </motion.div>
  );
};
