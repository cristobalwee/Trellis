import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { HexColorPicker } from 'react-colorful';
import { $showcaseConfig, updateShowcase } from './store';
import { generateRamp } from './colorUtils';
import { ColorRampView } from './ColorRampView';
import { VisualPicker, type VisualPickerOption } from './VisualPicker';

const ROUNDNESS_OPTIONS: VisualPickerOption[] = [
  {
    id: 'sharp',
    label: 'Sharp',
    description: 'Precise and technical.',
    preview: <div className="w-10 h-10 border-2 border-charcoal/20" />,
  },
  {
    id: 'rounded',
    label: 'Rounded',
    description: 'Modern and balanced.',
    preview: <div className="w-10 h-10 border-2 border-charcoal/20 rounded-xl" />,
  },
  {
    id: 'pill',
    label: 'Pill',
    description: 'Soft and approachable.',
    preview: <div className="w-14 h-7 border-2 border-charcoal/20 rounded-full" />,
  },
];

const EXPRESSIVENESS_OPTIONS: VisualPickerOption[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Clean and understated.',
    preview: <div className="w-8 h-px bg-charcoal/20" />,
  },
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'Strategic accents.',
    preview: (
      <div className="relative">
        <div className="w-10 h-10 border-2 border-charcoal/20 rounded-lg" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-forest-green rounded-full" />
      </div>
    ),
  },
  {
    id: 'expressive',
    label: 'Expressive',
    description: 'Bold and energetic.',
    preview: (
      <div className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-3 bg-forest-green/20 rounded-full"
            style={{ height: `${i * 6 + 12}px` }}
          />
        ))}
      </div>
    ),
  },
];

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  label: string;
}

const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({ color, onChange, label }) => {
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
    <div className="relative flex flex-col gap-2" ref={popoverRef}>
      <label className="text-[12px] text-charcoal/70">
        {label}
      </label>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-xl shadow-sm border-2 border-white ring-1 ring-charcoal/10 cursor-pointer transition-shadow hover:ring-2 hover:ring-charcoal/20"
        style={{ backgroundColor: color }}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-2 z-50 bg-white rounded-2xl shadow-xl p-4 border border-charcoal/10"
          >
            <HexColorPicker color={color} onChange={onChange} style={{ width: '200px' }} />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-mono text-charcoal/60">{color.toUpperCase()}</span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-forest-green hover:underline"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShowcaseConfigurator: React.FC = () => {
  const config = useStore($showcaseConfig);

  const primaryRamp = useMemo(
    () => generateRamp(config.primaryColor),
    [config.primaryColor]
  );

  const secondaryRamp = useMemo(
    () => generateRamp(config.secondaryColor),
    [config.secondaryColor]
  );

  return (
    <div
      className="bg-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden border border-charcoal/5"
    >
      <div className="space-y-8">

        {/* Colors Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-1 flex-col gap-4">
              <ColorPickerPopover
                label="Primary"
                color={config.primaryColor}
                onChange={(color) => updateShowcase({ primaryColor: color })}
              />
              <ColorRampView ramp={primaryRamp} label="Primary Ramp" compact />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <ColorPickerPopover
                label="Secondary"
                color={config.secondaryColor}
                onChange={(color) => updateShowcase({ secondaryColor: color })}
              />
              <ColorRampView ramp={secondaryRamp} label="Secondary Ramp" compact />
            </div>
          </div>
        </div>

        {/* Typography Display */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] text-charcoal/70">
            Typography
          </label>
          <div className="bg-white rounded-xl border border-charcoal/10 p-4">
            <div className="flex items-baseline gap-4">
              <span className="text-2xl font-bold text-charcoal" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                Inter
              </span>
              <span className="text-charcoal/40 text-sm">
                Aa Bb Cc 123
              </span>
            </div>
          </div>
        </div>

        {/* Roundness & Expressiveness */}
        <div className="grid grid-cols-1 gap-6">
          <VisualPicker
            label="Roundness"
            value={config.roundness}
            options={ROUNDNESS_OPTIONS}
            onChange={(val) => updateShowcase({ roundness: val as 'sharp' | 'rounded' | 'pill' })}
            compact
          />
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-forest-green/5 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

export default ShowcaseConfigurator;
