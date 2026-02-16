import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';

export interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  /** Optional label rendered above the swatch */
  label?: string;
  /** aria-label for the swatch button (defaults to label or "Pick color") */
  ariaLabel?: string;
  /** Show hex value and Done button inside the popover */
  showFooter?: boolean;
  /** CSS class for the swatch button (defaults to a sensible size) */
  swatchClassName?: string;
  /** Fixed width for the HexColorPicker (e.g. '200px') */
  pickerWidth?: string;
}

const DEFAULT_SWATCH_CLASS =
  'w-16 h-16 rounded-2xl shadow-sm border-2 border-white cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shrink-0';

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color,
  onChange,
  label,
  ariaLabel,
  showFooter = false,
  swatchClassName = DEFAULT_SWATCH_CLASS,
  pickerWidth,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative${label ? ' flex flex-col gap-2' : ''}`} ref={popoverRef}>
      {label && (
        <label className="text-[12px] text-charcoal/80">{label}</label>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={swatchClassName}
        style={{ backgroundColor: color }}
        aria-label={ariaLabel || label || 'Pick color'}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl p-3 border border-charcoal/10"
          >
            <HexColorPicker
              color={color}
              onChange={onChange}
              {...(pickerWidth ? { style: { width: pickerWidth } } : {})}
            />
            {showFooter && (
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-mono text-charcoal/60">
                  {color.toUpperCase()}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-forest-green hover:underline"
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ColorPickerPopover;
