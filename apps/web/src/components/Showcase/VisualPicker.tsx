import React from 'react';
import { motion } from 'framer-motion';

export interface VisualPickerOption {
  id: string;
  label: string;
  description: string;
  preview: React.ReactNode;
}

interface VisualPickerProps {
  label: string;
  value: string;
  options: VisualPickerOption[];
  onChange: (id: string) => void;
  compact?: boolean;
}

export const VisualPicker: React.FC<VisualPickerProps> = ({
  label,
  value,
  options,
  onChange,
  compact = false,
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-[12px] text-charcoal/70">
      {label}
    </label>
    <div className={`grid gap-3 ${compact ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 md:grid-cols-3'}`}>
      {options.map((option) => (
        <motion.button
          key={option.id}
          onClick={() => onChange(option.id)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 cursor-pointer ${
            value === option.id
              ? 'border-forest-green bg-forest-green/5 ring-2 ring-forest-green/10'
              : 'border-charcoal/5 bg-white hover:border-charcoal/20'
          }`}
        >
          <div className="mb-3 p-4 flex items-center justify-center bg-charcoal/5 rounded-lg">
            {option.preview}
          </div>
          <div className="font-bold text-sm mb-0.5">{option.label}</div>
          <div className="text-charcoal/50 text-[12px] leading-relaxed">{option.description}</div>
        </motion.button>
      ))}
    </div>
  </div>
);

export default VisualPicker;
