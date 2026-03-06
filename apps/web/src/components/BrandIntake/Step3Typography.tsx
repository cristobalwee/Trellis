import React, { useState, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Upload } from 'lucide-react';
import { $brandConfig, updateConfig } from './store';
import { Combobox } from '../ui/Combobox';

// ---------------------------------------------------------------------------
// Google Fonts list (popular subset)
// ---------------------------------------------------------------------------

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Playfair Display', 'Merriweather', 'Lora', 'IBM Plex Sans', 'Space Grotesk',
  'Poppins', 'Raleway', 'Nunito', 'Source Sans 3', 'Ubuntu',
  'Oswald', 'Noto Sans', 'Rubik', 'Work Sans', 'DM Sans',
  'Manrope', 'Outfit', 'Plus Jakarta Sans', 'Lexend', 'Sora',
  'Figtree', 'Geist', 'Onest', 'Instrument Sans', 'General Sans',
  'Fraunces', 'Crimson Pro', 'Libre Baskerville', 'Cormorant Garamond', 'EB Garamond',
  'Space Mono', 'JetBrains Mono', 'Fira Code', 'IBM Plex Mono', 'Source Code Pro',
];

// ---------------------------------------------------------------------------
// Heading scale (1 rem – 4 rem, bold)
// ---------------------------------------------------------------------------

const HEADING_SCALE = [
  { label: 'XXLarge', token: 'font.heading.xxlarge', remVal: 4, px: 64, lhRemVal: 4.5, lhPx: 72 },
  { label: 'XLarge', token: 'font.heading.xlarge', remVal: 3, px: 48, lhRemVal: 3.5, lhPx: 56 },
  { label: 'Large', token: 'font.heading.large', remVal: 2.25, px: 36, lhRemVal: 2.75, lhPx: 44 },
  { label: 'Medium', token: 'font.heading.medium', remVal: 1.75, px: 28, lhRemVal: 2.25, lhPx: 36 },
  { label: 'Small', token: 'font.heading.small', remVal: 1.5, px: 24, lhRemVal: 2, lhPx: 32 },
  { label: 'XSmall', token: 'font.heading.xsmall', remVal: 1.25, px: 20, lhRemVal: 1.75, lhPx: 28 },
  { label: 'XXSmall', token: 'font.heading.xxsmall', remVal: 1, px: 16, lhRemVal: 1.5, lhPx: 24 },
];

// ---------------------------------------------------------------------------
// Body scale (10–18 px, regular / medium / bold)
// ---------------------------------------------------------------------------

const BODY_SIZES = [
  { label: 'large', px: 18, remVal: 1.125, lhRemVal: 1.75, lhPx: 28 },
  { label: 'base', px: 16, remVal: 1, lhRemVal: 1.5, lhPx: 24 },
  { label: 'small', px: 14, remVal: 0.875, lhRemVal: 1.25, lhPx: 20 },
  { label: 'xsmall', px: 12, remVal: 0.75, lhRemVal: 1, lhPx: 16 },
  { label: 'xxsmall', px: 10, remVal: 0.625, lhRemVal: 0.875, lhPx: 14 },
];

const BODY_WEIGHTS = [
  { label: 'Regular', value: 400 },
  { label: 'Medium', value: 500 },
  { label: 'Bold', value: 700 },
];

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Step3Typography: React.FC = () => {
  const config = useStore($brandConfig);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Handlers for font selection
  const handlePrimaryFontChange = useCallback((font: string) => {
    if (config.useSingleTypeface) {
      updateConfig({ primaryFont: font, headingFont: font, customFontName: undefined });
    } else {
      updateConfig({ primaryFont: font, customBodyFontName: undefined });
    }
  }, [config.useSingleTypeface]);

  const handleHeadingFontChange = useCallback((font: string) => {
    updateConfig({ headingFont: font, customHeadingFontName: undefined });
  }, []);

  const handleToggleSingleTypeface = useCallback(() => {
    const next = !config.useSingleTypeface;
    if (next) {
      // Switching to single: unify to primary
      updateConfig({
        useSingleTypeface: true,
        headingFont: config.primaryFont,
        customHeadingFontName: undefined,
        customBodyFontName: undefined,
      });
    } else {
      updateConfig({
        useSingleTypeface: false,
        customFontName: undefined,
      });
    }
  }, [config.useSingleTypeface, config.primaryFont]);

  // Resolve which fonts to show in preview
  const bodyFont = config.primaryFont;
  const headingFont = config.useSingleTypeface ? config.primaryFont : config.headingFont;

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <span className="text-charcoal/80 mb-4 text-base">Step 3</span>
      <h2 className="text-5xl md:text-7xl mb-6">Set your typography</h2>
      <p className="text-base md:text-xl text-charcoal/80 mb-12">
        Choose your typeface and preview the type scales.
      </p>

      <div className="flex flex-col gap-16">
        {/* ----------------------------------------------------------------- */}
        {/* Font selection */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-12">
            <div
              className={`w-full transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                config.useSingleTypeface ? 'md:w-[calc(200%+3rem)]' : ''
              }`}
            >
              <Combobox
                label={config.useSingleTypeface ? 'Typeface' : 'Heading Typeface'}
                value={config.useSingleTypeface ? config.primaryFont : config.headingFont}
                onValueChange={config.useSingleTypeface ? handlePrimaryFontChange : handleHeadingFontChange}
                options={GOOGLE_FONTS}
                placeholder="Search Google Fonts…"
                displayValue={config.useSingleTypeface ? config.customFontName : config.customHeadingFontName}
              />
            </div>
            <AnimatePresence initial={false}>
              {!config.useSingleTypeface && (
                <motion.div
                  initial={{ opacity: 0, height: 0, x: 24 }}
                  animate={{ opacity: 1, height: 'auto', x: 0 }}
                  exit={{ opacity: 0, height: 0, x: 24 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pt-8 md:pt-0">
                    <Combobox
                      label="Body Typeface"
                      value={config.primaryFont}
                      onValueChange={handlePrimaryFontChange}
                      options={GOOGLE_FONTS}
                      placeholder="Search Google Fonts…"
                      displayValue={config.customBodyFontName}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Font weights */}
          <div className="flex flex-col gap-3">
            <label className="text-base text-charcoal font-medium">
              Font Weights
            </label>
            <div className="flex flex-wrap gap-2">
              {[300, 400, 500, 600, 700, 800, 900].map((weight) => (
                <button
                  key={weight}
                  onClick={() => {
                    const next = config.fontWeights.includes(weight)
                      ? config.fontWeights.filter((w) => w !== weight)
                      : [...config.fontWeights, weight].sort();
                    updateConfig({ fontWeights: next });
                  }}
                  className={`px-4 py-2.5 rounded-xl text-sm font-mono transition-all border-2 cursor-pointer ${
                    config.fontWeights.includes(weight)
                      ? 'border-forest-green bg-forest-green/5 text-forest-green font-bold'
                      : 'border-charcoal/5 text-charcoal/40 hover:border-charcoal/20'
                  }`}
                >
                  {weight}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced drawer toggle */}
          <div>
            <button
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                isAdvancedOpen
                  ? 'bg-forest-green/10 text-forest-green'
                  : 'bg-charcoal/5 text-charcoal/80 hover:bg-charcoal/10'
              }`}
            >
              <Settings size={14} />
              Advanced
            </button>

            <AnimatePresence initial={false}>
              {isAdvancedOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 p-6 bg-charcoal/5 rounded-xl space-y-8">
                    {/* Toggle: single vs dual typeface */}
                    <label className="flex items-center justify-between cursor-pointer">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-charcoal">
                          Use separate heading typeface
                        </span>
                        <span className="text-xs text-charcoal/60">
                          Choose a different font for headings and body text.
                        </span>
                      </div>
                      <button
                        role="switch"
                        aria-checked={!config.useSingleTypeface}
                        onClick={handleToggleSingleTypeface}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                          !config.useSingleTypeface ? 'bg-forest-green' : 'bg-charcoal/20'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${
                            !config.useSingleTypeface ? 'translate-x-[22px]' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </label>

                    {/* Custom font upload — coming soon */}
                    <div className="space-y-4 pt-4 border-t border-charcoal/10">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-charcoal">
                          Custom Fonts
                        </span>
                        <span className="text-xs text-charcoal/60">
                          Upload your own font files instead of using Google Fonts.
                        </span>
                      </div>

                      <div className="flex items-center gap-3 px-4 py-5 border border-dashed border-charcoal/15 rounded-xl bg-charcoal/2">
                        <Upload size={18} className="text-charcoal/25 shrink-0" />
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-charcoal/40">
                            Custom font uploads coming soon
                          </span>
                          <span className="text-xs text-charcoal/30">
                            Support for .ttf, .otf, .woff, and .woff2 files is on the roadmap.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Heading scale */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex flex-col gap-4">
          <label className="text-base text-charcoal font-medium">
            Heading Scale
          </label>

          <div className="bg-white rounded-2xl border border-charcoal/5 shadow-sm overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-charcoal/10">
                  <th className="text-left text-xs font-medium text-charcoal/50 pl-8 pr-4 py-3 w-1/2">Preview</th>
                  <th className="text-left text-xs font-medium text-charcoal/50 px-4 py-3">Token</th>
                  <th className="text-left text-xs font-medium text-charcoal/50 px-4 py-3">Font weight</th>
                  <th className="text-left text-xs font-medium text-charcoal/50 px-4 pr-8 py-3">Font size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {HEADING_SCALE.map((step) => (
                  <tr key={step.token}>
                    <td className="pl-8 pr-4 py-4 align-middle">
                      <span
                        style={{
                          fontSize: `${step.px}px`,
                          fontFamily: `'${headingFont}', sans-serif`,
                          fontWeight: 700,
                          lineHeight: 1.2,
                        }}
                        className="text-charcoal"
                      >
                        Title
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <code className="text-xs font-mono text-charcoal/70 bg-charcoal/4 px-2 py-1 rounded">
                        {step.token}
                      </code>
                    </td>
                    <td className="px-4 py-4 align-middle text-sm text-charcoal/80">Bold</td>
                    <td className="px-4 pr-8 py-4 align-middle text-sm text-charcoal/80">
                      {step.remVal} rem / {step.px} px
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Body scale */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex flex-col gap-4">
          <label className="text-base text-charcoal font-medium">
            Body Scale
          </label>

          <div className="bg-white rounded-2xl border border-charcoal/5 shadow-sm overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-charcoal/10">
                  <th className="text-left text-xs font-medium text-charcoal/50 pl-8 pr-4 py-3 w-1/2">Preview</th>
                  <th className="text-left text-xs font-medium text-charcoal/50 px-4 py-3">Token</th>
                  <th className="text-left text-xs font-medium text-charcoal/50 px-4 py-3">Font weight</th>
                  <th className="text-left text-xs font-medium text-charcoal/50 px-4 pr-8 py-3">Font size</th>
                </tr>
              </thead>
              <tbody>
                {BODY_SIZES.map((size, sizeIdx) => (
                  <React.Fragment key={size.label}>
                    {BODY_WEIGHTS.map((w, wIdx) => (
                      <tr
                        key={`${size.label}-${w.value}`}
                        className={wIdx === BODY_WEIGHTS.length - 1 && sizeIdx !== BODY_SIZES.length - 1 ? 'border-b border-charcoal/10' : ''}
                      >
                        <td className="pl-8 pr-4 py-3 align-middle">
                          <span
                            style={{
                              fontSize: `${size.px}px`,
                              fontFamily: `'${bodyFont}', sans-serif`,
                              fontWeight: w.value,
                              lineHeight: 1.5,
                            }}
                            className="text-charcoal"
                          >
                            Lorem Ipsum dolor sit amet
                          </span>
                        </td>
                        {wIdx === 0 && (
                          <td className="px-4 py-3 align-middle" rowSpan={BODY_WEIGHTS.length}>
                            <code className="text-xs font-mono text-charcoal/70 bg-charcoal/4 px-2 py-1 rounded">
                              {`font.body.${size.label}`}
                            </code>
                          </td>
                        )}
                        <td className="px-4 py-3 align-middle text-sm text-charcoal/80">{w.label}</td>
                        {wIdx === 0 && (
                          <td className="px-4 pr-8 py-3 align-middle text-sm text-charcoal/80" rowSpan={BODY_WEIGHTS.length}>
                            {size.remVal} rem / {size.px} px
                          </td>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Typography;
