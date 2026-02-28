import React, { useMemo } from 'react';
import { ColorPickerPopover } from '../ui/ColorPickerPopover';
import { ColorRampView } from '../Showcase/ColorRampView';
import { Select } from '../ui/Select';
import { generateRamp } from '../Showcase/colorUtils';
import type { PlaygroundConfig } from './types';
import { GOOGLE_FONTS } from './types';
import { Sun, Moon, X, Settings2 } from 'lucide-react';

const FONT_OPTIONS = GOOGLE_FONTS.map((font) => ({ value: font, label: font }));

interface PlaygroundControlsProps {
  config: PlaygroundConfig;
  onChange: (updates: Partial<PlaygroundConfig>) => void;
  onClose?: () => void;
  showDarkModeToggle?: boolean;
}

const DarkModeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({
  isDark,
  onToggle,
}) => (
  <button
    onClick={onToggle}
    className="relative w-12 h-7 rounded-full p-1 hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200 shrink-0"
    style={{
      backgroundColor: isDark ? '#374151' : '#e5e7eb',
    }}
  >
    <div
      className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center"
      style={{
        transform: `translateX(${isDark ? 20 : 0}px)`,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {isDark ? <Moon size={10} className="text-gray-600" /> : <Sun size={10} className="text-amber-500" />}
    </div>
  </button>
);

const SWATCH_CLASS =
  'w-10 h-10 rounded-xl shadow-sm border-2 border-white ring-1 ring-charcoal/10 cursor-pointer transition-shadow hover:ring-2 hover:ring-charcoal/20 hover:scale-105 active:scale-95';

interface SegmentedControlProps {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-medium text-charcoal/80">{label}</label>
    <div className="flex rounded-lg bg-charcoal/5 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex-1 py-1.5 px-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
            value === opt.id
              ? 'bg-white text-charcoal shadow-sm'
              : 'text-charcoal/50 hover:text-charcoal/70'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

const SliderControl: React.FC<SliderControlProps> = ({ label, value, onChange, min = 0, max = 100 }) => (
  <div className="flex flex-col gap-4">
    <div className="flex justify-between items-baseline">
      <label className="text-sm font-medium text-charcoal/80">{label}</label>
      <span className="text-xs font-mono text-charcoal/80">{value}%</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-charcoal/10 rounded-full appearance-none cursor-pointer accent-forest-green [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-forest-green [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:cursor-pointer"
    />
  </div>
);

const PlaygroundControls: React.FC<PlaygroundControlsProps> = ({ config, onChange, onClose, showDarkModeToggle }) => {
  const primaryRamp = useMemo(
    () => generateRamp(config.primaryColor, config.saturation, 100, false, config.lightness),
    [config.primaryColor, config.saturation, config.lightness]
  );

  const secondaryRamp = useMemo(
    () => generateRamp(config.secondaryColor, config.saturation, 100, false, config.lightness),
    [config.secondaryColor, config.saturation, config.lightness]
  );

  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-charcoal/80 font-medium text-sm">
          <Settings2 size={16} />
          <span>Appearance</span>
        </div>
        <div className="flex items-center gap-3">
          {showDarkModeToggle && (
            <DarkModeToggle
              isDark={config.isDarkMode}
              onToggle={() => onChange({ isDarkMode: !config.isDarkMode })}
            />
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-charcoal/40 hover:text-charcoal/80 hover:bg-charcoal/5 rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="border-t border-charcoal/10" />

      {/* Colors */}
      <div className="flex flex-col gap-8">
        <div className="flex gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <ColorPickerPopover
              label="Primary"
              color={config.primaryColor}
              onChange={(color) => onChange({ primaryColor: color })}
              showFooter
              swatchClassName={SWATCH_CLASS}
              pickerWidth="180px"
            />
            <ColorRampView ramp={primaryRamp} compact className="h-4" />
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <ColorPickerPopover
              label="Secondary"
              color={config.secondaryColor}
              onChange={(color) => onChange({ secondaryColor: color })}
              showFooter
              swatchClassName={SWATCH_CLASS}
              pickerWidth="180px"
            />
            <ColorRampView ramp={secondaryRamp} compact className="h-4" />
          </div>
        </div>

        <SliderControl
          label="Saturation"
          value={config.saturation}
          onChange={(v) => onChange({ saturation: v })}
        />

        <SliderControl
          label="Lightness"
          value={config.lightness}
          min={50}
          max={150}
          onChange={(v) => onChange({ lightness: v })}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-charcoal/10" />

      {/* Typography */}
      <Select
        label="Typography"
        value={config.fontFamily}
        onValueChange={(value) => onChange({ fontFamily: value })}
        options={FONT_OPTIONS}
        size="compact"
        triggerClassName="border-charcoal/10"
      />

      {/* Divider */}
      <div className="border-t border-charcoal/10" />

      {/* Style Controls */}
      <div className="flex flex-col gap-6">
        <SegmentedControl
          label="Roundness"
          value={config.roundness}
          options={[
            { id: 'sharp', label: 'Sharp' },
            { id: 'rounded', label: 'Rounded' },
            { id: 'pill', label: 'Pill' },
          ]}
          onChange={(id) => onChange({ roundness: id as PlaygroundConfig['roundness'] })}
        />

        <SegmentedControl
          label="Density"
          value={config.density}
          options={[
            { id: 'compact', label: 'Compact' },
            { id: 'default', label: 'Default' },
            { id: 'comfortable', label: 'Comfy' },
          ]}
          onChange={(id) => onChange({ density: id as PlaygroundConfig['density'] })}
        />

        <SegmentedControl
          label="Expressiveness"
          value={config.expressiveness}
          options={[
            { id: 'minimal', label: 'Minimal' },
            { id: 'balanced', label: 'Balanced' },
            { id: 'expressive', label: 'Bold' },
          ]}
          onChange={(id) => onChange({ expressiveness: id as PlaygroundConfig['expressiveness'] })}
        />
      </div>
    </div>
  );
};

export default PlaygroundControls;
