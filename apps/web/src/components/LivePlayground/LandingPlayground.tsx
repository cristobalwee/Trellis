import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { Sun, Moon } from 'lucide-react';

import { $brandConfig, updateConfig } from '../BrandIntake/store';
import { useColorRamps } from '../BrandIntake/useColorRamps';
import { GOOGLE_FONTS } from '../BrandIntake/TabTypography';
import { ColorPickerPopover } from '../ui/ColorPickerPopover';
import { ColorRampView } from '../Showcase/ColorRampView';
import { Combobox } from '../ui/Combobox';
import PreviewComponents from '../ComponentSampler';
import { generateDesignTokens } from '../../utils/generateTokens';
import { appendGoogleFontStylesheet } from '../../data/googleFonts';

const DarkModeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({ isDark, onToggle }) => (
  <button
    onClick={onToggle}
    className="relative w-14 h-8 rounded-full p-1 hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200"
    style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}
    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    <div
      className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center"
      style={{
        transform: `translateX(${isDark ? 24 : 0}px)`,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {isDark ? <Moon size={12} className="text-gray-600" /> : <Sun size={12} className="text-amber-500" />}
    </div>
  </button>
);

type PlaygroundPanel = 'configure' | 'preview';

const PlaygroundSegmentedControl: React.FC<{
  active: PlaygroundPanel;
  onChange: (panel: PlaygroundPanel) => void;
}> = ({ active, onChange }) => (
  <div className="mb-3 flex w-full gap-1 rounded-lg bg-charcoal/5 p-0.5 lg:hidden">
    {(['configure', 'preview'] as const).map((panel) => (
      <button
        key={panel}
        onClick={() => onChange(panel)}
        className={`flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-all cursor-pointer ${
          active === panel
            ? 'bg-white text-charcoal shadow-sm'
            : 'text-charcoal/50 hover:text-charcoal/80'
        }`}
      >
        {panel}
      </button>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Preset selector (compressed, shared style from TabStyle)
// ---------------------------------------------------------------------------

interface PresetOption { id: string; label: string; hint?: React.ReactNode }

const PresetSelector: React.FC<{
  label: string;
  value: string;
  options: PresetOption[];
  onChange: (id: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-medium text-charcoal/80">{label}</label>
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border cursor-pointer ${
            value === opt.id
              ? 'border-forest-green bg-forest-green/5 text-forest-green font-bold'
              : 'border-charcoal/10 text-charcoal/80 hover:border-charcoal/20'
          }`}
        >
          {opt.hint && <span className="shrink-0">{opt.hint}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const ROUNDNESS_OPTIONS: PresetOption[] = [
  { id: 'sharp', label: 'Sharp', hint: <div className="w-2.5 h-2.5 border border-current" /> },
  { id: 'subtle', label: 'Soft', hint: <div className="w-2.5 h-2.5 border border-current rounded-[2px]" /> },
  { id: 'rounded', label: 'Rounded', hint: <div className="w-2.5 h-2.5 border border-current rounded-md" /> },
  { id: 'pill', label: 'Pill', hint: <div className="w-3.5 h-2.5 border border-current rounded-full" /> },
];

const SHADOW_OPTIONS: PresetOption[] = [
  { id: 'none', label: 'None' },
  { id: 'subtle', label: 'Subtle' },
  { id: 'dramatic', label: 'Dramatic' },
];

const DENSITY_OPTIONS: PresetOption[] = [
  { id: 'compact', label: 'Compact' },
  { id: 'default', label: 'Comfortable' },
  { id: 'comfortable', label: 'Spacious' },
];

// ---------------------------------------------------------------------------
// Compressed color slot: swatch + mini ramp underneath
// ---------------------------------------------------------------------------

const ColorSlot: React.FC<{
  label: string;
  color: string;
  onChange: (c: string) => void;
  ramp: Record<number, string> | Parameters<typeof ColorRampView>[0]['ramp'];
}> = ({ label, color, onChange, ramp }) => (
  <div className="flex flex-col gap-2 min-w-0">
    <label className="text-xs font-medium text-charcoal/80">{label}</label>
    <ColorPickerPopover
      color={color}
      onChange={onChange}
      ariaLabel={`${label} color`}
      showHexInput
      swatchClassName="w-12 aspect-[1/1] rounded-xl shadow-sm border-2 border-white cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
    />
    <ColorRampView ramp={ramp as never} className="h-4 rounded-md" />
  </div>
);

// ---------------------------------------------------------------------------
// LandingPlayground — compressed Configurator controls + ComponentSampler
// ---------------------------------------------------------------------------

const LandingPlayground: React.FC = () => {
  const config = useStore($brandConfig);
  const derived = useColorRamps(config);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activePanel, setActivePanel] = useState<PlaygroundPanel>('configure');

  // Load Google Fonts for both heading and body typefaces
  useEffect(() => {
    for (const [family, role] of [[config.headingFont, 'heading'], [config.primaryFont, 'body']] as const) {
      const id = `playground-font-${role}-${family.replace(/\s+/g, '+')}`;
      appendGoogleFontStylesheet(family, id);
    }
  }, [config.primaryFont, config.headingFont]);

  const { tokens: designTokens } = useMemo(
    () => generateDesignTokens(config, isDarkMode),
    [config, isDarkMode]
  );

  return (
    <div className="flex flex-col items-center" data-step-animate-children="ignore">
      {/* Dark Mode Toggle - above container */}
      <div className="relative rounded-2xl bg-gray/70 pt-3 pb-8 px-4 -mb-6 max-w-xs mx-auto flex-row justify-between items-center self-center w-full hidden md:flex z-0">
        <p className="text-xs">Dark mode included</p>
        <DarkModeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
      </div>

      <PlaygroundSegmentedControl active={activePanel} onChange={setActivePanel} />

      {/* Main Container */}
      <div
        className="relative z-10 flex h-[620px] w-full flex-col gap-3 overflow-hidden rounded-4xl bg-gray p-3 sm:h-[660px] md:h-[680px] md:gap-4 md:p-4 lg:h-[min(720px,85vh)] lg:flex-row"
      >
        {/* Component Sampler */}
        <div
          className={`relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-3xl border-2 border-white shadow-sm lg:block ${
            activePanel === 'configure' ? 'hidden' : 'block'
          }`}
          style={designTokens as React.CSSProperties}
        >
          <PreviewComponents />
        </div>

        {/* Compressed controls */}
        <div className={`order-first min-h-0 w-full flex-1 flex-col overflow-y-auto rounded-3xl bg-white lg:order-last lg:flex lg:w-[320px] lg:flex-none ${
          activePanel === 'preview' ? 'hidden' : 'flex'
        }`}>
          <div className="flex flex-col gap-6 p-5">
            {/* Color */}
            <section className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <ColorSlot
                  label="Primary"
                  color={config.primaryColor}
                  onChange={(c) => updateConfig({ primaryColor: c, rampOverrides: {} })}
                  ramp={derived.primaryRamp}
                />
                <ColorSlot
                  label="Secondary"
                  color={derived.secondaryColor}
                  onChange={(c) => updateConfig({ useCustomSecondary: true, secondaryColor: c })}
                  ramp={derived.secondaryRamp}
                />
              </div>
            </section>

            {/* Typography */}
            <section className="flex flex-col gap-3 pt-5 border-t border-charcoal/10">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-charcoal/80">Heading</label>
                <Combobox
                  value={config.headingFont}
                  onValueChange={(f) => updateConfig({ headingFont: f, customHeadingFontName: undefined })}
                  options={GOOGLE_FONTS}
                  placeholder="Search Google Fonts..."
                  displayValue={config.customHeadingFontName}
                  size="compact"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-charcoal/80">Body</label>
                <Combobox
                  value={config.primaryFont}
                  onValueChange={(f) => updateConfig({ primaryFont: f, customBodyFontName: undefined })}
                  options={GOOGLE_FONTS}
                  placeholder="Search Google Fonts..."
                  displayValue={config.customBodyFontName}
                  size="compact"
                />
              </div>
            </section>

            {/* Style */}
            <section className="flex flex-col gap-4 pt-5 border-t border-charcoal/10">
              <PresetSelector
                label="Rounding"
                value={config.roundness}
                options={ROUNDNESS_OPTIONS}
                onChange={(val) => updateConfig({ roundness: val as typeof config.roundness })}
              />
              <PresetSelector
                label="Shadows"
                value={config.shadows}
                options={SHADOW_OPTIONS}
                onChange={(val) => updateConfig({ shadows: val as typeof config.shadows })}
              />
              <PresetSelector
                label="Spacing"
                value={config.density}
                options={DENSITY_OPTIONS}
                onChange={(val) => updateConfig({ density: val as typeof config.density })}
              />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPlayground;
