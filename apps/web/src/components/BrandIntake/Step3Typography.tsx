import React, { useState, useRef, useCallback } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Upload, X } from 'lucide-react';
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
// Preset type scale
// ---------------------------------------------------------------------------

const TYPE_SCALE = [
  { token: '7xl', rem: '4.5rem',   px: 72, note: 'Display' },
  { token: '6xl', rem: '3.75rem',  px: 60 },
  { token: '5xl', rem: '3rem',     px: 48 },
  { token: '4xl', rem: '2.25rem',  px: 36 },
  { token: '3xl', rem: '1.875rem', px: 30 },
  { token: '2xl', rem: '1.5rem',   px: 24 },
  { token: 'xl',  rem: '1.25rem',  px: 20 },
  { token: 'lg',  rem: '1.125rem', px: 18, note: 'Lead paragraphs' },
  { token: 'base', rem: '1rem',    px: 16, note: 'Body text' },
  { token: 'sm',  rem: '0.875rem', px: 14, note: 'Secondary text, labels' },
  { token: 'xs',  rem: '0.75rem',  px: 12, note: 'Captions, fine print' },
  { token: 'xxs', rem: '0.625rem', px: 10, note: 'Smallest — semibold+ for readability' },
];

// ---------------------------------------------------------------------------
// Custom font upload
// ---------------------------------------------------------------------------

interface FontUploadProps {
  label: string;
  fontName?: string;
  onUpload: (name: string, file: File) => void;
  onClear: () => void;
}

const FontUpload: React.FC<FontUploadProps> = ({ label, fontName, onUpload, onClear }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.replace(/\.[^.]+$/, '');
    onUpload(name, file);
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/60">
        {label}
      </span>
      {fontName ? (
        <div className="flex items-center gap-2 bg-forest-green/5 border border-forest-green/20 rounded-lg px-3 py-2">
          <span className="text-sm font-medium text-forest-green flex-1 truncate">
            {fontName}
          </span>
          <button
            onClick={() => {
              onClear();
              if (fileRef.current) fileRef.current.value = '';
            }}
            className="text-charcoal/30 hover:text-charcoal/60 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 border border-dashed border-charcoal/20 rounded-lg text-sm text-charcoal/60 hover:border-charcoal/40 hover:text-charcoal/80 transition-colors cursor-pointer"
        >
          <Upload size={14} />
          Upload font file
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Step3Typography: React.FC = () => {
  const config = useStore($brandConfig);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Local state for custom font files (can't persist File objects)
  const [customFontFile, setCustomFontFile] = useState<File | null>(null);
  const [customHeadingFile, setCustomHeadingFile] = useState<File | null>(null);
  const [customBodyFile, setCustomBodyFile] = useState<File | null>(null);

  // Load a custom font via FontFace API
  const loadCustomFont = useCallback(async (name: string, file: File) => {
    const url = URL.createObjectURL(file);
    try {
      const face = new FontFace(name, `url(${url})`);
      await face.load();
      document.fonts.add(face);
    } catch {
      // silently fail — font just won't render
    }
  }, []);

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

  // Custom font upload handlers
  const handleCustomFontUpload = useCallback(
    async (name: string, file: File) => {
      await loadCustomFont(name, file);
      setCustomFontFile(file);
      if (config.useSingleTypeface) {
        updateConfig({ customFontName: name, primaryFont: name, headingFont: name });
      }
    },
    [config.useSingleTypeface, loadCustomFont],
  );

  const handleCustomHeadingUpload = useCallback(
    async (name: string, file: File) => {
      await loadCustomFont(name, file);
      setCustomHeadingFile(file);
      updateConfig({ customHeadingFontName: name, headingFont: name });
    },
    [loadCustomFont],
  );

  const handleCustomBodyUpload = useCallback(
    async (name: string, file: File) => {
      await loadCustomFont(name, file);
      setCustomBodyFile(file);
      updateConfig({ customBodyFontName: name, primaryFont: name });
    },
    [loadCustomFont],
  );

  const clearCustomFont = useCallback(() => {
    setCustomFontFile(null);
    updateConfig({ customFontName: undefined, primaryFont: 'Inter', headingFont: 'Inter' });
  }, []);

  const clearCustomHeadingFont = useCallback(() => {
    setCustomHeadingFile(null);
    updateConfig({ customHeadingFontName: undefined, headingFont: 'Inter' });
  }, []);

  const clearCustomBodyFont = useCallback(() => {
    setCustomBodyFile(null);
    updateConfig({ customBodyFontName: undefined, primaryFont: 'Inter' });
  }, []);

  // Resolve which fonts to show in preview
  const bodyFont = config.primaryFont;
  const headingFont = config.useSingleTypeface ? config.primaryFont : config.headingFont;

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <span className="text-charcoal/80 mb-4 text-base">Step 3</span>
      <h2 className="text-5xl md:text-7xl mb-6">Set your typography</h2>
      <p className="text-xl text-charcoal/80 mb-12">
        Choose your typeface{config.useSingleTypeface ? '' : 's'} and preview the preset type scale.
      </p>

      <div className="flex flex-col gap-16">
        {/* ----------------------------------------------------------------- */}
        {/* Font selection */}
        {/* ----------------------------------------------------------------- */}
        <div className="flex flex-col gap-8">
          {config.useSingleTypeface ? (
            <Combobox
              label="Typeface"
              value={config.primaryFont}
              onValueChange={handlePrimaryFontChange}
              options={GOOGLE_FONTS}
              placeholder="Search Google Fonts…"
              displayValue={config.customFontName}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <Combobox
                label="Heading Typeface"
                value={config.headingFont}
                onValueChange={handleHeadingFontChange}
                options={GOOGLE_FONTS}
                placeholder="Search Google Fonts…"
                displayValue={config.customHeadingFontName}
              />
              <Combobox
                label="Body Typeface"
                value={config.primaryFont}
                onValueChange={handlePrimaryFontChange}
                options={GOOGLE_FONTS}
                placeholder="Search Google Fonts…"
                displayValue={config.customBodyFontName}
              />
            </div>
          )}

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
                  : 'bg-charcoal/5 text-charcoal/60 hover:bg-charcoal/10'
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

                    {/* Custom font upload */}
                    <div className="space-y-4 pt-4 border-t border-charcoal/10">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-charcoal">
                          Custom Fonts
                        </span>
                        <span className="text-xs text-charcoal/60">
                          Upload .ttf, .otf, .woff, or .woff2 files to use a custom font instead
                          of Google Fonts.
                        </span>
                      </div>

                      {config.useSingleTypeface ? (
                        <FontUpload
                          label="Font File"
                          fontName={config.customFontName}
                          onUpload={handleCustomFontUpload}
                          onClear={clearCustomFont}
                        />
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FontUpload
                            label="Heading Font File"
                            fontName={config.customHeadingFontName}
                            onUpload={handleCustomHeadingUpload}
                            onClear={clearCustomHeadingFont}
                          />
                          <FontUpload
                            label="Body Font File"
                            fontName={config.customBodyFontName}
                            onUpload={handleCustomBodyUpload}
                            onClear={clearCustomBodyFont}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Preset type scale */}
        {/* ----------------------------------------------------------------- */}
        <div className="space-y-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40">
              Type Scale
            </label>
            <p className="text-sm text-charcoal/60">
              A fixed scale used across all generated tokens.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-charcoal/5 shadow-sm overflow-hidden divide-y divide-charcoal/5">
            {TYPE_SCALE.map((step) => {
              const isHeading = step.px >= 24;
              const font = isHeading ? headingFont : bodyFont;
              const weight =
                config.fontWeights[Math.floor(config.fontWeights.length / 2)] || 400;

              return (
                <div
                  key={step.token}
                  className="flex items-baseline gap-4 md:gap-8 px-6 py-4"
                >
                  {/* Token */}
                  <span className="w-12 shrink-0 text-xs font-mono font-bold text-charcoal/30 text-right">
                    {step.token}
                  </span>

                  {/* Size */}
                  <span className="w-24 shrink-0 text-xs font-mono text-charcoal/40">
                    {step.rem}
                    <span className="hidden md:inline text-charcoal/20 ml-1">
                      ({step.px}px)
                    </span>
                  </span>

                  {/* Specimen */}
                  <p
                    style={{
                      fontSize: `${step.px}px`,
                      fontFamily: `'${font}', sans-serif`,
                      fontWeight: weight,
                      lineHeight: 1.2,
                    }}
                    className="text-charcoal truncate flex-1 min-w-0"
                  >
                    Aa
                  </p>

                  {/* Note */}
                  {step.note && (
                    <span className="hidden lg:block text-xs text-charcoal/30 shrink-0 max-w-48 text-right">
                      {step.note}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Typography;
