import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import { STEPS, type ColorRamp } from './colorUtils';
import { Tooltip } from '../ui/Tooltip';

interface ColorRampViewProps {
  ramp: ColorRamp;
  label?: string;
  compact?: boolean;
  className?: string;
  /** When provided, each swatch becomes editable on click. Called with (step, newColor). */
  onStepChange?: (step: number, color: string) => void;
}

const EditableSwatch: React.FC<{
  step: number;
  color: string;
  onStepChange: (step: number, color: string) => void;
}> = ({ step, color, onStepChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const POPOVER_OUTER_W = 200 + 24; // picker width + p-3 * 2
  const MARGIN = 8;

  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - POPOVER_OUTER_W / 2;
      left = Math.max(MARGIN, Math.min(left, window.innerWidth - POPOVER_OUTER_W - MARGIN));
      setPosition({ top: rect.bottom + 8, left });
    }
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <Tooltip
        label={
          <span className="flex flex-col items-center gap-0.5">
            <span className="font-bold font-mono">{color.toUpperCase()}</span>
            <span className="text-white/70">click to edit</span>
          </span>
        }
        side="top"
      >
        <motion.div
          ref={triggerRef}
          className="flex-1 group relative cursor-pointer transition-transform hover:scale-y-110 hover:z-10"
          style={{ backgroundColor: color }}
          animate={{ backgroundColor: color }}
          transition={{ duration: 0.3 }}
          onClick={() => {
            if (!isOpen && triggerRef.current) {
              const rect = triggerRef.current.getBoundingClientRect();
              let left = rect.left + rect.width / 2 - POPOVER_OUTER_W / 2;
              left = Math.max(MARGIN, Math.min(left, window.innerWidth - POPOVER_OUTER_W - MARGIN));
              setPosition({ top: rect.bottom + 8, left });
            }
            setIsOpen(!isOpen);
          }}
        />
      </Tooltip>
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="fixed z-9999 bg-white rounded-xl shadow-xl p-3 border border-charcoal/10"
                style={{ top: position.top, left: position.left }}
              >
                <HexColorPicker
                  color={color}
                  onChange={(c) => onStepChange(step, c)}
                  style={{ width: '200px' }}
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-1.5 text-xs font-mono text-charcoal/40">#</span>
                    <input
                      aria-label="Hex color value"
                      value={color.replace('#', '').toUpperCase()}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
                        if (raw.length === 6) onStepChange(step, `#${raw}`);
                      }}
                      maxLength={6}
                      className="w-22 pl-5 pr-1.5 py-1 text-xs font-mono bg-charcoal/5 rounded-md border border-charcoal/10 outline-none focus:border-forest-green"
                    />
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold text-forest-green hover:underline cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
};

export const ColorRampView: React.FC<ColorRampViewProps> = ({
  ramp,
  label,
  compact = false,
  className = '',
  onStepChange,
}) => (
  <div className="space-y-2">
    {label && (
      <div className="flex justify-between items-baseline gap-2">
        <label className="text-[12px] text-charcoal/80">{label}</label>
        <span className="text-[8px] font-mono text-charcoal/20">OKLCH</span>
      </div>
    )}
    <div
      className={`flex w-full rounded-lg overflow-hidden shadow-sm border border-charcoal/5 ${
        className ? className : compact ? 'h-6' : 'h-8'
      }`}
    >
      {STEPS.map((step) =>
        onStepChange ? (
          <EditableSwatch
            key={step}
            step={step}
            color={ramp[step as keyof ColorRamp]}
            onStepChange={onStepChange}
          />
        ) : (
          <motion.div
            key={step}
            className="flex-1 group relative"
            style={{ backgroundColor: ramp[step as keyof ColorRamp] }}
            animate={{ backgroundColor: ramp[step as keyof ColorRamp] }}
            transition={{ duration: 0.3 }}
          />
        ),
      )}
    </div>
  </div>
);

export default ColorRampView;
