import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { $brandConfig, updateConfig } from './store';

// ---------------------------------------------------------------------------
// Compact segmented control for style presets
// ---------------------------------------------------------------------------

interface PresetOption {
  id: string;
  label: string;
  hint?: React.ReactNode;
}

interface PresetSelectorProps {
  label: string;
  description?: string;
  value: string;
  options: PresetOption[];
  onChange: (id: string) => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ label, description, value, options, onChange }) => (
  <div className="flex flex-col gap-2">
    <div className="flex flex-col gap-0.5">
      <label className="text-sm font-bold text-charcoal">{label}</label>
      {description && <p className="text-xs text-charcoal/60">{description}</p>}
    </div>
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all border cursor-pointer ${
            value === opt.id
              ? 'border-forest-green bg-forest-green/5 text-forest-green font-bold'
              : 'border-charcoal/10 text-charcoal/60 hover:border-charcoal/20 hover:text-charcoal/80'
          }`}
        >
          {opt.hint && <span className="shrink-0">{opt.hint}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Preset definitions
// ---------------------------------------------------------------------------

const ROUNDNESS_OPTIONS: PresetOption[] = [
  { id: 'sharp', label: 'Sharp', hint: <div className="w-3 h-3 border border-current" /> },
  { id: 'subtle', label: 'Soft', hint: <div className="w-3 h-3 border border-current rounded-[3px]" /> },
  { id: 'rounded', label: 'Rounded', hint: <div className="w-3 h-3 border border-current rounded-md" /> },
  { id: 'pill', label: 'Pill', hint: <div className="w-4 h-3 border border-current rounded-full" /> },
];

const SHADOW_OPTIONS: PresetOption[] = [
  { id: 'flat', label: 'Flat' },
  { id: 'subtle', label: 'Subtle' },
  { id: 'elevated', label: 'Elevated' },
  { id: 'dramatic', label: 'Dramatic' },
];

const DENSITY_OPTIONS: PresetOption[] = [
  {
    id: 'compact',
    label: 'Compact',
    hint: (
      <div className="flex flex-col gap-0.5 w-3">
        <div className="h-[2px] bg-current rounded-full w-full" />
        <div className="h-[2px] bg-current rounded-full w-2/3" />
      </div>
    ),
  },
  {
    id: 'default',
    label: 'Comfortable',
    hint: (
      <div className="flex flex-col gap-1 w-3">
        <div className="h-[2px] bg-current rounded-full w-full" />
        <div className="h-[2px] bg-current rounded-full w-2/3" />
      </div>
    ),
  },
  {
    id: 'comfortable',
    label: 'Spacious',
    hint: (
      <div className="flex flex-col gap-1.5 w-3">
        <div className="h-[2px] bg-current rounded-full w-full" />
        <div className="h-[2px] bg-current rounded-full w-2/3" />
      </div>
    ),
  },
];

const MOTION_OPTIONS: PresetOption[] = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'expressive', label: 'Expressive' },
];

const EXPAND_TRANSITION = { duration: 0.25, ease: [0.32, 0.72, 0, 1] as const };

// ---------------------------------------------------------------------------
// TabStyle
// ---------------------------------------------------------------------------

const TabStyle: React.FC = () => {
  const config = useStore($brandConfig);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PresetSelector
        label="Rounding"
        description="Controls border radius across all components."
        value={config.roundness}
        options={ROUNDNESS_OPTIONS}
        onChange={(val) => updateConfig({ roundness: val as typeof config.roundness })}
      />

      <PresetSelector
        label="Shadows"
        description="Elevation and depth across surfaces."
        value={config.shadows}
        options={SHADOW_OPTIONS}
        onChange={(val) => updateConfig({ shadows: val as typeof config.shadows })}
      />

      <PresetSelector
        label="Spacing"
        description="Density of content and whitespace."
        value={config.density}
        options={DENSITY_OPTIONS}
        onChange={(val) => updateConfig({ density: val as typeof config.density })}
      />

      <PresetSelector
        label="Motion"
        description="Animation and transition intensity."
        value={config.expressiveness}
        options={MOTION_OPTIONS}
        onChange={(val) => updateConfig({ expressiveness: val as typeof config.expressiveness })}
      />

      {/* Advanced (placeholder for future fine-grained controls) */}
      <div className="border-t border-charcoal/5 pt-3">
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className={`flex items-center justify-between w-full py-2 text-sm font-medium transition-colors cursor-pointer rounded-lg ${
            isAdvancedOpen ? 'text-forest-green' : 'text-charcoal/70 hover:text-charcoal'
          }`}
        >
          <span>Advanced</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {isAdvancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: EXPAND_TRANSITION,
                opacity: { duration: 0.2, ease: 'easeInOut' },
              }}
              className="overflow-hidden"
            >
              <div className="py-4 px-4 bg-charcoal/5 rounded-xl mt-2">
                <p className="text-xs text-charcoal/50">
                  Fine-grained controls for exact border-radius, shadow, spacing, and transition values coming soon.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabStyle;
