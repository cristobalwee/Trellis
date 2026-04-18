import React, { useRef, useMemo, useState, useEffect } from 'react';
import { motion, useSpring, useMotionValue, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';

type TokenKind = 'color' | 'radius' | 'spacing' | 'font';

interface TokenDef {
  name: string;
  kind: TokenKind;
  value: string;
}

interface Position {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
  type: 'pink' | 'yellow' | 'leaf1' | 'leaf2' | 'bubble';
  token?: TokenDef;
}

const ASSETS = {
  pink: '/src/assets/flower-pink.png',
  yellow: '/src/assets/flower-yellow.png',
  leaf1: '/src/assets/leaf-1.png',
  leaf2: '/src/assets/leaf-2.png',
};

const LEFT_CLUSTER: Position[] = [
  // Extreme Outer Vertical Edge (Denser at bottom, less high)
  { x: 1, y: 98, rotation: -10, scale: 0.95, delay: 0.05, type: 'pink' },
  { x: 2, y: 88, rotation: 15, scale: 1.1, delay: 0.08, type: 'yellow' },
  { x: 0, y: 78, rotation: -20, scale: 0.85, delay: 0.12, type: 'pink' },
  { x: 3, y: 68, rotation: 30, scale: 1.05, delay: 0.15, type: 'yellow' },
  { x: 1, y: 58, rotation: -5, scale: 0.9, delay: 0.18, type: 'pink' },
  { x: 4, y: 48, rotation: 10, scale: 0.8, delay: 0.22, type: 'yellow' },
  { x: 2, y: 38, rotation: -15, scale: 0.75, delay: 0.25, type: 'pink' },
  { x: 3, y: 32, rotation: 25, scale: 0.85, delay: 0.28, type: 'yellow' }, // Reduced verticality
  
  // Second Vertical Layer
  { x: 8, y: 95, rotation: 5, scale: 1.2, delay: 0.28, type: 'pink' },
  { x: 7, y: 82, rotation: -10, scale: 0.9, delay: 0.31, type: 'yellow' },
  { x: 9, y: 72, rotation: 20, scale: 1.15, delay: 0.34, type: 'pink' },
  { x: 20, y: 60, rotation: 0, scale: 1, delay: 0.3, type: 'bubble', token: { name: '--foreground-primary', kind: 'color', value: '#1c7583' } },
  { x: 10, y: 52, rotation: -25, scale: 0.85, delay: 0.4, type: 'yellow' },
  { x: 11, y: 42, rotation: 15, scale: 0.7, delay: 0.43, type: 'pink' },
  { x: 9, y: 35, rotation: -15, scale: 0.75, delay: 0.46, type: 'pink' }, // Reduced verticality
  
  // Third Layer (Spreading)
  { x: 18, y: 92, rotation: -15, scale: 1.0, delay: 0.46, type: 'yellow' },
  { x: 22, y: 80, rotation: 10, scale: 0.85, delay: 0.49, type: 'pink' },
  { x: 25, y: 96, rotation: -5, scale: 1.1, delay: 0.52, type: 'yellow' },
  { x: 20, y: 70, rotation: 25, scale: 0.9, delay: 0.55, type: 'pink' },
  { x: 34, y: 90, rotation: 15, scale: 1, delay: 0.45, type: 'bubble', token: { name: '--radius-container', kind: 'radius', value: '8px' } },
  { x: 24, y: 55, rotation: -10, scale: 0.8, delay: 0.61, type: 'yellow' },
  { x: 21, y: 45, rotation: 20, scale: 0.7, delay: 0.64, type: 'pink' },
  
  // Transition Layers
  { x: 35, y: 94, rotation: 20, scale: 1.2, delay: 0.64, type: 'pink' },
  { x: 42, y: 85, rotation: -5, scale: 0.95, delay: 0.67, type: 'yellow' },
  { x: 48, y: 98, rotation: 15, scale: 1.05, delay: 0.7, type: 'pink' },
  { x: 55, y: 88, rotation: -10, scale: 0.8, delay: 0.73, type: 'yellow' },
  { x: 54, y: 76, rotation: 0, scale: 1, delay: 0.6, type: 'bubble', token: { name: '--spacing-lg', kind: 'spacing', value: '16px' } },
  
  // Tapering
  { x: 65, y: 95, rotation: 10, scale: 1.1, delay: 0.79, type: 'pink' },
  { x: 75, y: 98, rotation: -5, scale: 0.9, delay: 0.82, type: 'yellow' },
  { x: 15, y: 88, rotation: 35, scale: 0.75, delay: 0.85, type: 'yellow' },
  { x: 32, y: 78, rotation: -15, scale: 0.8, delay: 0.88, type: 'pink' },
  { x: 50, y: 92, rotation: -20, scale: 0.85, delay: 0.94, type: 'pink' },
  
  // New Leaves at Bottom
  { x: 5, y: 92, rotation: 45, scale: 0.8, delay: 0.1, type: 'leaf1' },
  { x: 12, y: 85, rotation: -10, scale: 0.75, delay: 0.2, type: 'leaf2' },
  { x: 28, y: 96, rotation: 20, scale: 0.9, delay: 0.3, type: 'leaf1' },
  
  // Diagonal Accents (Down and In)
  { x: 60, y: 80, rotation: -15, scale: 0.8, delay: 0.65, type: 'pink' },
  { x: 30, y: 50, rotation: -5, scale: 0.85, delay: 0.55, type: 'pink' },
  { x: 40, y: 70, rotation: 15, scale: 0.95, delay: 0.65, type: 'yellow' },

  // Shallow Diagonal Accents (~25º Down and In)
  { x: 4, y: 45, rotation: 10, scale: 0.8, delay: 0.3, type: 'pink' },
  { x: 18, y: 52, rotation: -5, scale: 0.85, delay: 0.4, type: 'yellow' },
  { x: 32, y: 59, rotation: 15, scale: 0.9, delay: 0.5, type: 'pink' },
  { x: 46, y: 66, rotation: -10, scale: 0.8, delay: 0.6, type: 'yellow' },
  ];

const RIGHT_CLUSTER: Position[] = [
  // Extreme Outer Vertical Edge (Denser at bottom, less high)
  { x: 99, y: 98, rotation: 10, scale: 0.95, delay: 0.05, type: 'yellow' },
  { x: 98, y: 88, rotation: -15, scale: 1.1, delay: 0.08, type: 'pink' },
  { x: 100, y: 78, rotation: 20, scale: 0.85, delay: 0.12, type: 'yellow' },
  { x: 97, y: 68, rotation: -30, scale: 1.05, delay: 0.15, type: 'pink' },
  { x: 99, y: 58, rotation: 5, scale: 0.9, delay: 0.18, type: 'yellow' },
  { x: 96, y: 48, rotation: -10, scale: 0.8, delay: 0.22, type: 'pink' },
  { x: 98, y: 38, rotation: 15, scale: 0.75, delay: 0.25, type: 'pink' },
  { x: 97, y: 32, rotation: -25, scale: 0.85, delay: 0.28, type: 'yellow' }, // Reduced verticality
  
  // Second Vertical Layer
  { x: 92, y: 95, rotation: -5, scale: 1.2, delay: 0.28, type: 'yellow' },
  { x: 93, y: 82, rotation: 10, scale: 0.9, delay: 0.31, type: 'pink' },
  { x: 91, y: 72, rotation: -20, scale: 1.15, delay: 0.34, type: 'yellow' },
  { x: 82, y: 62, rotation: 0, scale: 1, delay: 0.3, type: 'bubble', token: { name: '--foreground-accent', kind: 'color', value: '#8f5466' } },
  { x: 90, y: 52, rotation: 25, scale: 0.85, delay: 0.4, type: 'pink' },
  { x: 89, y: 42, rotation: -15, scale: 0.7, delay: 0.43, type: 'yellow' },
  { x: 91, y: 35, rotation: 15, scale: 0.75, delay: 0.46, type: 'pink' }, // Reduced verticality
  
  // Third Layer (Spreading)
  { x: 82, y: 92, rotation: 15, scale: 1.0, delay: 0.46, type: 'pink' },
  { x: 78, y: 80, rotation: -10, scale: 0.85, delay: 0.49, type: 'yellow' },
  { x: 75, y: 96, rotation: 5, scale: 1.1, delay: 0.52, type: 'pink' },
  { x: 80, y: 70, rotation: -25, scale: 0.9, delay: 0.55, type: 'yellow' },
  { x: 66, y: 90, rotation: -15, scale: 1, delay: 0.45, type: 'bubble', token: { name: '--font-heading-md-size', kind: 'font', value: '24px' } },
  { x: 76, y: 55, rotation: 10, scale: 0.8, delay: 0.61, type: 'pink' },
  { x: 79, y: 45, rotation: -20, scale: 0.7, delay: 0.64, type: 'yellow' },
  
  // Transition Layers
  { x: 65, y: 94, rotation: -20, scale: 1.2, delay: 0.64, type: 'yellow' },
  { x: 58, y: 85, rotation: 5, scale: 0.95, delay: 0.67, type: 'pink' },
  { x: 52, y: 98, rotation: -15, scale: 1.05, delay: 0.7, type: 'yellow' },
  { x: 45, y: 88, rotation: 10, scale: 0.8, delay: 0.73, type: 'pink' },
  { x: 48, y: 72, rotation: 0, scale: 1, delay: 0.6, type: 'bubble', token: { name: '--background-critical', kind: 'color', value: '#e23d3f' } },
  
  // Tapering
  { x: 35, y: 95, rotation: -10, scale: 1.1, delay: 0.79, type: 'yellow' },
  { x: 25, y: 98, rotation: 5, scale: 0.9, delay: 0.82, type: 'pink' },
  { x: 85, y: 88, rotation: -35, scale: 0.75, delay: 0.85, type: 'yellow' },
  { x: 68, y: 78, rotation: 15, scale: 0.8, delay: 0.88, type: 'yellow' },
  { x: 50, y: 92, rotation: 20, scale: 0.85, delay: 0.94, type: 'yellow' },

  // New Leaves at Bottom
  { x: 95, y: 92, rotation: -45, scale: 0.8, delay: 0.1, type: 'leaf2' },
  { x: 88, y: 85, rotation: 10, scale: 0.75, delay: 0.2, type: 'leaf1' },
  { x: 72, y: 96, rotation: -20, scale: 0.9, delay: 0.3, type: 'leaf2' },

  // Diagonal Accents (Down and In)
  { x: 40, y: 80, rotation: 15, scale: 0.8, delay: 0.65, type: 'yellow' },
  { x: 80, y: 45, rotation: -10, scale: 0.9, delay: 0.45, type: 'pink' },
  { x: 70, y: 50, rotation: 5, scale: 0.85, delay: 0.55, type: 'yellow' },
  { x: 60, y: 70, rotation: -15, scale: 0.95, delay: 0.65, type: 'pink' },

  // Shallow Diagonal Accents (~25º Down and In)
  { x: 96, y: 45, rotation: -10, scale: 0.8, delay: 0.3, type: 'yellow' },
  { x: 68, y: 59, rotation: -15, scale: 0.9, delay: 0.5, type: 'yellow' },
  { x: 54, y: 66, rotation: 10, scale: 0.8, delay: 0.6, type: 'pink' },
  ];

const FloralElement = React.memo(({ pos, mouseX, mouseY, isScrolling, scrollYProgress, cluster, masterDelay = 0 }: {
  pos: Position;
  mouseX: any;
  mouseY: any;
  isScrolling: boolean;
  scrollYProgress: any;
  cluster: 'left' | 'right';
  masterDelay?: number;
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  
  const springConfig = { damping: 25, stiffness: 200 };
  const translateX = useSpring(0, springConfig);
  const translateY = useSpring(0, springConfig);

  // Randomize sway parameters for natural feel
  const swayOffset = useMemo(() => Math.random() * Math.PI, []);
  const swayDuration = useMemo(() => 3 + Math.random() * 2, []);
  const swayAmount = useMemo(() => 4 + Math.random() * 4, []);

  // Staggered fade out from inside out
  const fadeStart = useMemo(() => {
    if (cluster === 'left') {
      // higher x is more inside, should start first
      return Math.max(0, (75 - pos.x) / 75 * 0.4);
    } else {
      // lower x is more inside, should start first
      return Math.max(0, (pos.x - 25) / 75 * 0.4);
    }
  }, [pos.x, cluster]);

  const fadeEnd = fadeStart + 0.3;

  const scrollOpacity = useTransform(scrollYProgress, [fadeStart, fadeEnd], [1, 0]);
  const scrollScale = useTransform(scrollYProgress, [fadeStart, fadeEnd], [pos.scale, 0]);

  useEffect(() => {
    const updateMovement = () => {
      if (!elementRef.current) return;
      
      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const dist = Math.hypot(mouseX.get() - centerX, mouseY.get() - centerY);
      const maxDist = 250;
      
      if (dist < maxDist) {
        const power = (1 - dist / maxDist) * 30;
        const angle = Math.atan2(mouseY.get() - centerY, mouseX.get() - centerX);
        translateX.set(Math.cos(angle) * -power);
        translateY.set(Math.sin(angle) * -power);
      } else {
        translateX.set(0);
        translateY.set(0);
      }
    };

    const unsubscribeX = mouseX.on("change", updateMovement);
    const unsubscribeY = mouseY.on("change", updateMovement);
    
    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [mouseX, mouseY, translateX, translateY]);

  const renderContent = () => {
    if (pos.type === 'bubble' && pos.token) {
      const { name, kind, value } = pos.token;
      let visual: React.ReactNode = null;
      if (kind === 'color') {
        visual = (
          <div
            className="w-4 h-4 rounded-full border border-black/10 shrink-0"
            style={{ backgroundColor: value }}
          />
        );
      } else if (kind === 'radius') {
        visual = (
          <div
            className="w-4 h-4 bg-neutral-100 border border-black/10 shrink-0"
            style={{ borderRadius: value }}
          />
        );
      } else if (kind === 'spacing') {
        visual = (
          <div className="w-4 h-4 flex items-center justify-center shrink-0 border border-neutral-300 rounded-sm">
            <div
              className="bg-neutral-100 rounded-sm max-w-full max-h-full"
              style={{ width: value, height: value }}
            />
          </div>
        );
      } else if (kind === 'font') {
        visual = (
          <div className="w-4 h-4 flex items-center justify-center font-semibold text-neutral-900 leading-none shrink-0 text-[13px]">
            Aa
          </div>
        );
      }
      return (
        <div className="px-3 py-1.5 bg-white rounded-full shadow-lg flex-row items-center gap-2 border border-gray-100/50 backdrop-blur-sm transition-transform hover:scale-110 active:scale-95 hidden md:inline-flex">
          {visual}
          <span className="text-[13px] font-mono text-neutral-700 whitespace-nowrap">{name}</span>
        </div>
      );
    }
    if (pos.type === 'bubble') return null;
    return (
      <img
        src={ASSETS[pos.type]}
        alt="" 
        className="w-full h-full object-contain drop-shadow-sm select-none" 
        draggable={false}
      />
    );
  };

  return (
    <div
      ref={elementRef}
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: pos.type === 'bubble' ? 20 : 10,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0, rotate: pos.rotation - 20 }}
        animate={{ 
          opacity: 1, 
          scale: pos.scale, 
          rotate: isScrolling ? pos.rotation : [pos.rotation, pos.rotation + 2, pos.rotation - 2, pos.rotation] 
        }}
        transition={{
          opacity: { duration: 0.8, delay: pos.delay + masterDelay, ease: [0.34, 1.56, 0.64, 1] },
          scale: { duration: 0.8, delay: pos.delay + masterDelay, ease: [0.34, 1.56, 0.64, 1] },
          rotate: isScrolling 
            ? { duration: 0.8, ease: "easeOut" }
            : {
                duration: swayDuration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: pos.delay + masterDelay
              }
        }}
        style={{
          width: pos.type === 'bubble' ? 'auto' : 'clamp(60px, 8vw, 100px)',
          height: pos.type === 'bubble' ? 'auto' : 'clamp(60px, 8vw, 100px)',
          x: translateX,
          y: translateY,
          opacity: scrollOpacity,
          scale: scrollScale,
        }}
        className="cursor-pointer will-change-transform"
      >
        <motion.div
          animate={{
            x: isScrolling ? 0 : [0, swayAmount, -swayAmount, 0],
            y: isScrolling ? 0 : [0, swayAmount / 2, -swayAmount / 2, 0]
          }}
          transition={isScrolling 
            ? { duration: 0.8, ease: "easeOut" }
            : {
                duration: swayDuration * 1.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: swayOffset
              }
          }
          style={{ width: '100%', height: '100%' }}
        >
          {renderContent()}
        </motion.div>
      </motion.div>
    </div>
  );
});

export const FloralDecoration = ({ masterDelay = 0 }: { masterDelay?: number }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const { scrollY, scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });
  const scrollTimeout = useRef<any>(null);

  useMotionValueEvent(scrollY, "change", () => {
    if (!isScrolling) setIsScrolling(true);
    
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 50);
  });

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Left Corner Cluster */}
      <div className="absolute bottom-[120px] left-[-50px] w-[45vw] h-[600px] pointer-events-auto">
        {LEFT_CLUSTER.map((pos, i) => (
          <FloralElement
            key={`left-${i}`}
            pos={pos}
            mouseX={mouseX}
            mouseY={mouseY}
            isScrolling={isScrolling}
            scrollYProgress={scrollYProgress}
            cluster="left"
            masterDelay={masterDelay}
          />
        ))}
      </div>

      {/* Right Corner Cluster */}
      <div className="absolute bottom-[120px] right-[-50px] w-[45vw] h-[600px] pointer-events-auto">
        <div className="relative w-full h-full">
          {RIGHT_CLUSTER.map((pos, i) => (
            <FloralElement
              key={`right-${i}`}
              pos={pos}
              mouseX={mouseX}
              mouseY={mouseY}
              isScrolling={isScrolling}
              scrollYProgress={scrollYProgress}
              cluster="right"
              masterDelay={masterDelay}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloralDecoration;
