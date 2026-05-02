import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { HexColorPicker } from 'react-colorful';
import { getTokenEditInfo } from './inspectUtils';
import { updateRampStep } from '../BrandIntake/store';
import type { PrimitiveMapping } from '../../utils/generateTokens';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const POPOVER_W = 224; // 200px picker + p-3 * 2
const MARGIN = 12;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InspectTokenEditorProps {
  tokenName: string;
  isDarkMode: boolean;
  semanticMap: Record<string, PrimitiveMapping>;
  anchorRect: DOMRect;
  onClose: () => void;
  /** Same as inspect flyout — keeps highlight alive when `relatedTarget` is missing on leave */
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
}

export const InspectTokenEditor: React.FC<InspectTokenEditorProps> = ({
  tokenName,
  isDarkMode,
  semanticMap,
  anchorRect,
  onClose,
  onMouseEnter,
}) => {
  const info = getTokenEditInfo(tokenName, isDarkMode, semanticMap);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Get current resolved value from the DOM
  const initialColor =
    getComputedStyle(document.documentElement).getPropertyValue(
      `--${tokenName}`,
    ).trim() || '#000000';

  const [color, setColor] = useState(initialColor);

  // Position next to the anchor (edit button)
  useLayoutEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = anchorRect.top;
    let left = anchorRect.right + 8;

    // Flip left if not enough room to the right
    if (left + POPOVER_W > vw - MARGIN) {
      left = anchorRect.left - POPOVER_W - 8;
    }
    if (left < MARGIN) left = MARGIN;

    // Keep vertically in viewport
    const estimatedH = 280;
    if (top + estimatedH > vh - MARGIN) {
      top = vh - estimatedH - MARGIN;
    }
    if (top < MARGIN) top = MARGIN;

    setPosition({ top, left });
  }, [anchorRect]);

  // Click-outside detection
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current && !popoverRef.current.contains(target)) {
        onClose();
      }
    };
    // Delay to avoid catching the opening click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!info) return null;

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    updateRampStep(info.rampKey, info.step, newColor);
  };

  const handleHexInput = (raw: string) => {
    const cleaned = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
    if (cleaned.length === 6) {
      handleColorChange(`#${cleaned}`);
    }
  };

  return (
    <motion.div
      ref={popoverRef}
      data-inspect-overlay
      onMouseEnter={onMouseEnter}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[10000] bg-white rounded-xl shadow-xl p-3 border border-charcoal/10"
      style={{ top: position.top, left: position.left }}
    >
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-charcoal/60">
          {info.displayRamp} &middot; {info.step}
        </span>
      </div>

      {/* Color picker */}
      <HexColorPicker
        color={color}
        onChange={handleColorChange}
        style={{ width: '200px' }}
      />

      {/* Hex input + done */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="relative flex items-center">
          <span className="absolute left-1.5 text-xs font-mono text-charcoal/40">
            #
          </span>
          <input
            aria-label="Hex color value"
            value={color.replace('#', '').toUpperCase()}
            onChange={(e) => handleHexInput(e.target.value)}
            maxLength={6}
            className="w-22 pl-5 pr-1.5 py-1 text-xs font-mono bg-charcoal/5 rounded-md border border-charcoal/10 outline-none focus:border-forest-green"
          />
        </div>
        <button
          onClick={onClose}
          className="text-xs font-bold text-forest-green hover:underline cursor-pointer"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
};
