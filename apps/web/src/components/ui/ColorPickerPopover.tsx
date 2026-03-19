import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
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
  'w-12 h-12 rounded-xl shadow-sm border-2 border-white cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 shrink-0';

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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Update popover position when opened or on scroll/resize (fixed = viewport coords)
  const updatePosition = () => {
    if (triggerRef.current && isOpen) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        left: rect.left,
      });
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
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={label ? 'flex flex-col gap-2' : ''}>
      {label && (
        <label className="text-[12px] text-charcoal/80">{label}</label>
      )}
      <button
        ref={triggerRef}
        onClick={() => {
          if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({ top: rect.bottom + 8, left: rect.left });
          }
          setIsOpen(!isOpen);
        }}
        className={swatchClassName}
        style={{ backgroundColor: color }}
        aria-label={ariaLabel || label || 'Pick color'}
      />
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="fixed z-[9999] bg-white rounded-xl shadow-xl p-3 border border-charcoal/10"
                style={{
                  top: position.top,
                  left: position.left,
                }}
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
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
};

export default ColorPickerPopover;
