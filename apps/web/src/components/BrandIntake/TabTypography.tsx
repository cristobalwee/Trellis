import React, { useState, useCallback, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, ChevronDown, Upload } from 'lucide-react';
import { $brandConfig, updateConfig } from './store';
import { Combobox } from '../ui/Combobox';

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

const EXPAND_TRANSITION = { duration: 0.25, ease: [0.32, 0.72, 0, 1] as const };

const TabTypography: React.FC = () => {
  const config = useStore($brandConfig);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const bodyFont = config.primaryFont;
  const headingFont = config.useSingleTypeface ? config.primaryFont : config.headingFont;

  // Load fonts for preview
  useEffect(() => {
    const fonts = new Set([bodyFont, headingFont]);
    fonts.forEach((font) => {
      const id = `tab-typo-font-${font.replace(/\s+/g, '+')}`;
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [bodyFont, headingFont]);

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

  return (
    <div className="flex flex-col gap-6">
      {/* Font selectors */}
      <div className="flex flex-col gap-4">
        <Combobox
          label={config.useSingleTypeface ? 'Typeface' : 'Heading Typeface'}
          value={config.useSingleTypeface ? config.primaryFont : config.headingFont}
          onValueChange={config.useSingleTypeface ? handlePrimaryFontChange : handleHeadingFontChange}
          options={GOOGLE_FONTS}
          placeholder="Search Google Fonts..."
          displayValue={config.useSingleTypeface ? config.customFontName : config.customHeadingFontName}
        />

        <AnimatePresence initial={false}>
          {!config.useSingleTypeface && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={EXPAND_TRANSITION}
              className="overflow-hidden"
            >
              <Combobox
                label="Body Typeface"
                value={config.primaryFont}
                onValueChange={handlePrimaryFontChange}
                options={GOOGLE_FONTS}
                placeholder="Search Google Fonts..."
                displayValue={config.customBodyFontName}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Font weights */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-charcoal">Font Weights</label>
        <div className="flex flex-wrap gap-1.5">
          {[300, 400, 500, 600, 700, 800, 900].map((weight) => (
            <button
              key={weight}
              onClick={() => {
                const next = config.fontWeights.includes(weight)
                  ? config.fontWeights.filter((w) => w !== weight)
                  : [...config.fontWeights, weight].sort();
                updateConfig({ fontWeights: next });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border cursor-pointer ${
                config.fontWeights.includes(weight)
                  ? 'border-forest-green bg-forest-green/5 text-forest-green font-bold'
                  : 'border-charcoal/10 text-charcoal/40 hover:border-charcoal/20'
              }`}
            >
              {weight}
            </button>
          ))}
        </div>
      </div>

      {/* Type scale preview — realistic card mockup */}
      <div className="flex flex-col gap-2 pt-3 border-t border-charcoal/5">
        <label className="text-xs font-medium text-charcoal/60 uppercase tracking-wider">Preview</label>
        <div className="bg-white border border-charcoal/10 rounded-xl p-5 flex flex-col gap-3">
          <h3
            style={{ fontFamily: `'${headingFont}', sans-serif`, fontWeight: 700 }}
            className="text-xl text-charcoal leading-tight"
          >
            Revenue Dashboard
          </h3>
          <h4
            style={{ fontFamily: `'${headingFont}', sans-serif`, fontWeight: 600 }}
            className="text-base text-charcoal/80 leading-snug"
          >
            Monthly Overview
          </h4>
          <p
            style={{ fontFamily: `'${bodyFont}', sans-serif`, fontWeight: 400 }}
            className="text-sm text-charcoal/70 leading-relaxed"
          >
            Your revenue increased by 12.5% compared to last month, with a total of 1,247 transactions processed across all payment methods.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <span
              style={{ fontFamily: `'${bodyFont}', sans-serif`, fontWeight: 500 }}
              className="text-xs text-charcoal/50"
            >
              Updated 3 min ago
            </span>
            <span
              style={{ fontFamily: `'${bodyFont}', sans-serif`, fontWeight: 700 }}
              className="text-xs text-forest-green"
            >
              +12.5%
            </span>
          </div>
        </div>
      </div>

      {/* Advanced toggle */}
      <div className="border-t border-charcoal/5 pt-3">
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className={`flex items-center justify-between w-full py-2 text-sm font-medium transition-colors cursor-pointer rounded-lg ${
            isAdvancedOpen ? 'text-forest-green' : 'text-charcoal/70 hover:text-charcoal'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Settings size={14} />
            Advanced
          </span>
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
              transition={EXPAND_TRANSITION}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-5 pt-3 pb-1">
                {/* Toggle: single vs dual typeface */}
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-charcoal">
                      Separate heading typeface
                    </span>
                    <span className="text-xs text-charcoal/60">
                      Use a different font for headings and body.
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

                {/* Custom font upload placeholder */}
                <div className="pt-3 border-t border-charcoal/10">
                  <div className="flex items-center gap-3 px-4 py-4 border border-dashed border-charcoal/15 rounded-xl bg-charcoal/2">
                    <Upload size={16} className="text-charcoal/25 shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-charcoal/40">
                        Custom font uploads coming soon
                      </span>
                      <span className="text-[10px] text-charcoal/30">
                        .ttf, .otf, .woff, .woff2
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
  );
};

export default TabTypography;
