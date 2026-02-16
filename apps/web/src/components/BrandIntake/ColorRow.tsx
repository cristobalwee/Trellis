import React, { useState, useRef, useEffect } from 'react';
import {
  Check,
  ChevronDown,
  ArrowLeftRight,
  GitFork,
  Triangle,
  Waves,
  Grid2x2,
  Circle,
  Snowflake,
  Flame,
  Palette,
} from 'lucide-react';

import { ColorPickerPopover } from '../ui/ColorPickerPopover';
import { ColorRampView } from '../Showcase/ColorRampView';
import { type GenerationMode } from './colorGeneration';
import type { ColorRamp } from '../Showcase/colorUtils';

// ---------------------------------------------------------------------------
// Small reusable pieces
// ---------------------------------------------------------------------------

export const HexColorInput: React.FC<{
  color: string;
  onChange: (color: string) => void;
}> = ({ color, onChange }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/70 font-mono text-sm">
      #
    </span>
    <input
      type="text"
      aria-label="Hex color value"
      value={color.replace('#', '')}
      onChange={(e) => onChange(`#${e.target.value}`)}
      className="w-26 pl-6 pr-3 py-2 border border-charcoal/20 rounded-xl text-base font-mono text-charcoal focus:outline-blue-500"
      maxLength={6}
    />
  </div>
);

// ---------------------------------------------------------------------------
// IconSelect — shared dropdown with Lucide icons
// ---------------------------------------------------------------------------

function IconSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { id: T; label: string; icon: React.ReactNode }[];
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.id === value);

  return (
    <div ref={ref} className="relative flex flex-col gap-3">
      <span className="text-sm text-charcoal">
        {label}
      </span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-white border border-charcoal/20 rounded-lg text-sm text-charcoal hover:border-charcoal/30 transition-colors"
      >
        {selected?.icon}
        <span className="flex-1 text-left">{selected?.label}</span>
        <ChevronDown
          size={14}
          className={`text-charcoal/50 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-charcoal/10 rounded-lg shadow-lg py-1">
          {options.map((option) => (
            <button
              type="button"
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-charcoal/5 transition-colors ${
                value === option.id ? 'text-forest-green font-medium' : 'text-charcoal'
              }`}
            >
              {option.icon}
              <span className="flex-1">{option.label}</span>
              {value === option.id && <Check size={14} strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generation mode options (monochromatic excluded)
// ---------------------------------------------------------------------------

const SECONDARY_MODE_OPTIONS: { id: GenerationMode; label: string; icon: React.ReactNode }[] = [
  { id: 'complementary', label: 'Complementary', icon: <ArrowLeftRight size={14} /> },
  { id: 'split-complementary', label: 'Split Complementary', icon: <GitFork size={14} /> },
  { id: 'triadic', label: 'Triadic', icon: <Triangle size={14} /> },
  { id: 'analogous', label: 'Analogous', icon: <Waves size={14} /> },
  { id: 'tetradic', label: 'Tetradic', icon: <Grid2x2 size={14} /> },
];

export const GenerationModeSelector: React.FC<{
  value?: GenerationMode;
  onChange: (mode: GenerationMode) => void;
}> = ({ value, onChange }) => (
  <IconSelect
    label="Generation Mode"
    value={value ?? 'complementary'}
    options={SECONDARY_MODE_OPTIONS}
    onChange={onChange}
  />
);

export const RampSliders: React.FC<{
  saturation: number;
  uniformity: number;
  onSaturationChange: (value: number) => void;
  onUniformityChange: (value: number) => void;
}> = ({ saturation, uniformity, onSaturationChange, onUniformityChange }) => (
  <div className="flex flex-col gap-8">
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <label className="text-sm text-charcoal">Saturation</label>
        <span className="text-xs font-mono text-charcoal">{saturation}%</span>
      </div>
      <input
        type="range"
        aria-label="Saturation"
        min="0"
        max="100"
        value={saturation}
        onChange={(e) => onSaturationChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-charcoal/10 rounded-full appearance-none cursor-pointer accent-forest-green"
      />
    </div>
    <div className="flex flex-col gap-4">
      <div className="flex justify-between">
        <label className="text-sm text-charcoal">Uniformity</label>
        <span className="text-xs font-mono text-charcoal">{uniformity}%</span>
      </div>
      <input
        type="range"
        aria-label="Uniformity"
        min="0"
        max="100"
        value={uniformity}
        onChange={(e) => onUniformityChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-charcoal/10 rounded-full appearance-none cursor-pointer accent-forest-green"
      />
    </div>
    <p className="text-xs text-charcoal pt-4 border-t border-charcoal/10">
      These settings affect all generated color ramps.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Neutral tint options
// ---------------------------------------------------------------------------

type NeutralTint = 'pure' | 'cool' | 'warm' | 'brand-tinted';

const NEUTRAL_TINT_OPTIONS: { id: NeutralTint; label: string; icon: React.ReactNode }[] = [
  { id: 'pure', label: 'Pure', icon: <Circle size={14} /> },
  { id: 'cool', label: 'Cool', icon: <Snowflake size={14} /> },
  { id: 'warm', label: 'Warm', icon: <Flame size={14} /> },
  { id: 'brand-tinted', label: 'Brand Tinted', icon: <Palette size={14} /> },
];

export const NeutralTintSelector: React.FC<{
  value: NeutralTint;
  onChange: (tint: NeutralTint) => void;
}> = ({ value, onChange }) => (
  <IconSelect
    label="Tint Strategy"
    value={value}
    options={NEUTRAL_TINT_OPTIONS}
    onChange={onChange}
  />
);

// ---------------------------------------------------------------------------
// PrimaryColorRow — dedicated layout for the primary color
// ---------------------------------------------------------------------------

export interface PrimaryColorRowProps {
  label: string;
  description?: string;
  color: string;
  onChange: (color: string) => void;
  ramp: ColorRamp;
  advancedContent: React.ReactNode;
}

export const PrimaryColorRow: React.FC<PrimaryColorRowProps> = ({
  label,
  description,
  color,
  onChange,
  ramp,
  advancedContent,
}) => (
  <div className="flex flex-col md:flex-row gap-8 items-stretch w-full">
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-base text-charcoal font-bold">{label}</label>
          {description && (
            <p className="text-sm text-charcoal/80 mb-2">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ColorPickerPopover color={color} onChange={onChange} />
          <HexColorInput color={color} onChange={onChange} />
        </div>
      </div>
      <ColorRampView ramp={ramp} className="h-full min-h-[64px] rounded-xl" />
    </div>

    <div className="w-full md:w-72 shrink-0 bg-charcoal/5 rounded-xl p-6 flex flex-col justify-start">
      {advancedContent}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// ColorRow — standard row for secondary / neutral
// ---------------------------------------------------------------------------

export interface ColorRowProps {
  label: string;
  description?: string;
  color: string;
  onChange: (color: string) => void;
  ramp: ColorRamp;
  onGenerationChange?: (mode: GenerationMode) => void;
  generationMode?: GenerationMode;
  advancedContent?: React.ReactNode;
  showInput?: boolean;
}

export const ColorRow: React.FC<ColorRowProps> = ({
  label,
  description,
  color,
  onChange,
  ramp,
  onGenerationChange,
  generationMode,
  advancedContent,
  showInput = true,
}) => {
  const hasSettings = Boolean(onGenerationChange || advancedContent);

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="flex flex-col gap-1">
        <label className="text-base text-charcoal font-bold">{label}</label>
        {description && (
          <p className="text-sm text-charcoal/80">{description}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <ColorPickerPopover color={color} onChange={onChange} />
        {showInput && <HexColorInput color={color} onChange={onChange} />}
      </div>

      <ColorRampView ramp={ramp} className="h-16 rounded-xl" />

      {hasSettings && (
        <div
          className="p-4 bg-charcoal/5 rounded-xl space-y-4"
          role="group"
          aria-label={`${label} settings`}
        >
          {onGenerationChange && (
            <GenerationModeSelector
              value={generationMode}
              onChange={onGenerationChange}
            />
          )}
          {advancedContent}
        </div>
      )}
    </div>
  );
};
