import React from 'react';
import {
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

import { Input } from '../ui/Input';
import { Select, type SelectOption } from '../ui/Select';
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
    <Input
      size="compact"
      aria-label="Hex color value"
      value={color.replace('#', '')}
      onChange={(e) => onChange(`#${(e.target as HTMLInputElement).value}`)}
      className="w-26 pl-6 font-mono"
      maxLength={6}
    />
  </div>
);

// ---------------------------------------------------------------------------
// Generation mode options (monochromatic excluded)
// ---------------------------------------------------------------------------

const SECONDARY_MODE_OPTIONS: SelectOption[] = [
  { value: 'complementary', label: 'Complementary', icon: <ArrowLeftRight size={14} /> },
  { value: 'split-complementary', label: 'Split Complementary', icon: <GitFork size={14} /> },
  { value: 'triadic', label: 'Triadic', icon: <Triangle size={14} /> },
  { value: 'analogous', label: 'Analogous', icon: <Waves size={14} /> },
  { value: 'tetradic', label: 'Tetradic', icon: <Grid2x2 size={14} /> },
];

export const GenerationModeSelector: React.FC<{
  value?: GenerationMode;
  onChange: (mode: GenerationMode) => void;
}> = ({ value, onChange }) => (
  <Select
    label="Generation Mode"
    value={value ?? 'complementary'}
    options={SECONDARY_MODE_OPTIONS}
    onValueChange={(v) => onChange(v as GenerationMode)}
    size="compact"
  />
);

export const RampSliders: React.FC<{
  chromaFalloff: number;
  onChromaFalloffChange: (value: number) => void;
}> = ({ chromaFalloff, onChromaFalloffChange }) => (
  <div className="flex flex-col gap-4" data-step-animate-children="ignore">
    <div className="flex justify-between">
      <label className="text-sm font-medium text-charcoal">Chroma Falloff</label>
      <span className="text-xs font-mono text-charcoal">{chromaFalloff}%</span>
    </div>
    <input
      type="range"
      aria-label="Chroma Falloff"
      min="0"
      max="100"
      value={chromaFalloff}
      onChange={(e) => onChromaFalloffChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-charcoal/10 rounded-full appearance-none cursor-pointer accent-forest-green"
    />
    <p className="text-xs text-charcoal/60">
      How much color intensity fades in lighter and darker shades. Your chosen color is always preserved.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Neutral tint options
// ---------------------------------------------------------------------------

type NeutralTint = 'pure' | 'cool' | 'warm' | 'brand-tinted';

const NEUTRAL_TINT_OPTIONS: SelectOption[] = [
  { value: 'pure', label: 'Pure', icon: <Circle size={14} /> },
  { value: 'cool', label: 'Cool', icon: <Snowflake size={14} /> },
  { value: 'warm', label: 'Warm', icon: <Flame size={14} /> },
  { value: 'brand-tinted', label: 'Brand Tinted', icon: <Palette size={14} /> },
];

export const NeutralTintSelector: React.FC<{
  value: NeutralTint;
  onChange: (tint: NeutralTint) => void;
}> = ({ value, onChange }) => (
  <Select
    label="Tint Strategy"
    value={value}
    options={NEUTRAL_TINT_OPTIONS}
    onValueChange={(v) => onChange(v as NeutralTint)}
    size="compact"
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
