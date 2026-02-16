import React from 'react';
import { motion } from 'framer-motion';
import { STEPS, type ColorRamp } from './colorUtils';

interface ColorRampViewProps {
  ramp: ColorRamp;
  label?: string;
  compact?: boolean;
  className?: string;
}

export const ColorRampView: React.FC<ColorRampViewProps> = ({ ramp, label, compact = false, className = '' }) => (
  <div className="space-y-2">
    {label && (
      <div className="flex justify-between items-baseline gap-2">
        <label className="text-[12px] text-charcoal/80">
          {label}
        </label>
        <span className="text-[8px] font-mono text-charcoal/20">OKLCH</span>
      </div>
    )}
    <div
      className={`flex w-full rounded-lg overflow-hidden shadow-sm border border-charcoal/5 ${
        className ? className : (compact ? 'h-6' : 'h-8')
      }`}
    >
      {STEPS.map((step) => (
        <motion.div
          key={step}
          className="flex-1 group relative"
          style={{ backgroundColor: ramp[step as keyof ColorRamp] }}
          animate={{ backgroundColor: ramp[step as keyof ColorRamp] }}
          transition={{ duration: 0.3 }}
        >
        </motion.div>
      ))}
    </div>
  </div>
);

export default ColorRampView;
