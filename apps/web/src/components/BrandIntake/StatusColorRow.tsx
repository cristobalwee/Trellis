import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { ColorPickerPopover } from '../ui/ColorPickerPopover';
import { ColorRampView } from '../Showcase/ColorRampView';
import type { ColorRamp } from '../Showcase/colorUtils';

export interface StatusColorRowProps {
  label: string;
  ramp: ColorRamp;
  baseColor: string;
  onChange: (color: string) => void;
  description?: string;
}

export const StatusColorRow: React.FC<StatusColorRowProps> = ({
  label,
  ramp,
  baseColor,
  onChange,
  description,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <label className="text-base text-charcoal/80">{label}</label>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`text-sm transition-colors ${
            isOpen
              ? 'text-forest-green'
              : 'text-charcoal/20 hover:text-charcoal/80'
          }`}
        >
          {isOpen ? 'Close' : 'Edit Base'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-charcoal/5 rounded-xl flex items-center gap-4">
              <ColorPickerPopover color={baseColor} onChange={onChange} />
              <div className="flex flex-col">
                <span className="text-xs font-mono text-charcoal">
                  {baseColor.toUpperCase()}
                </span>
                <span className="text-[10px] text-charcoal/80">Base Hex</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ColorRampView ramp={ramp} className="h-12 rounded-xl" />
    </div>
  );
};

export default StatusColorRow;
