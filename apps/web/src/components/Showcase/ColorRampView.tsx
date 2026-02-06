import React from 'react';
import { motion } from 'framer-motion';
import { STEPS, type ColorRamp } from './colorUtils';

interface ColorRampViewProps {
  ramp: ColorRamp;
  label?: string;
  compact?: boolean;
}

export const ColorRampView: React.FC<ColorRampViewProps> = ({ ramp, label, compact = false }) => (
  <div className="space-y-2">
    {label && (
      <div className="flex justify-between items-baseline gap-2">
        <label className="text-[12px] text-charcoal/70">
          {label}
        </label>
        <span className="text-[8px] font-mono text-charcoal/20">OKLCH</span>
      </div>
    )}
    <div
      className={`flex w-full rounded-lg overflow-hidden shadow-sm border border-charcoal/5 ${
        compact ? 'h-6' : 'h-8'
      }`}
    >
      {STEPS.map((step) => (
        <motion.div
          key={step}
          className="flex-1 group relative cursor-pointer"
          style={{ backgroundColor: ramp[step as keyof ColorRamp] }}
          animate={{ backgroundColor: ramp[step as keyof ColorRamp] }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.1, zIndex: 10 }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/10 flex items-center justify-center transition-opacity">
            <span className="text-[7px] font-mono text-white font-bold drop-shadow-sm">{step}</span>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

export default ColorRampView;
