import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { HexColorPicker } from 'react-colorful';
import { oklch, formatHex, converter } from 'culori';
import { $brandConfig, updateConfig, type ColorRamp } from './store';

const toHex = converter('hex');
const toOklch = converter('oklch');

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

function generateRamp(baseHex: string, saturation: number, uniformity: number, isNeutral = false): ColorRamp {
  const base = toOklch(baseHex);
  const ramp: Partial<ColorRamp> = {};

  STEPS.forEach((step) => {
    // Lightness: 1000 is ~0.3-0.4, 50 is ~0.96-0.97
    const t = (step - 50) / 950; // 0 to 1
    
    // Uniformity controls the linearity of the lightness scale
    // 100% uniformity = linear distribution
    // Lower uniformity = more contrast in midtones (pow > 1 or < 1)
    const exponent = 1 + (100 - uniformity) / 100;
    const lightness = 0.98 - Math.pow(t, exponent) * (0.98 - 0.32);
    
    // Chroma adjustment
    let chroma = (base.c || 0);
    if (isNeutral) {
      chroma = Math.min(chroma, 0.01 + (t * 0.01)); // Very desaturated
    } else {
      // Saturation affects the base chroma
      chroma *= (saturation / 100);
      // Uniformity also affects chroma drop-off
      chroma *= (1 - t * 0.2 * (1 - uniformity / 100));
    }

    const color = {
      mode: 'oklch' as const,
      l: lightness,
      c: chroma,
      h: base.h || 0,
    };

    ramp[step as keyof ColorRamp] = formatHex(color);
  });

  return ramp as ColorRamp;
}

function getSecondaryColor(primaryHex: string): string {
  const base = toOklch(primaryHex);
  return formatHex({
    mode: 'oklch',
    l: base.l,
    c: base.c,
    h: ((base.h || 0) + 180) % 360, // Complementary
  }) || primaryHex;
}

const ColorRampView = ({ ramp, label }: { ramp: ColorRamp; label: string }) => (
  <div className="space-y-4">
    <div className="flex justify-between items-baseline">
      <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">{label}</label>
      <span className="text-[10px] font-mono text-charcoal/20">OKLCH</span>
    </div>
    <div className="flex w-full h-10 rounded-xl overflow-hidden shadow-sm border border-charcoal/5">
      {STEPS.map((step) => (
        <div
          key={step}
          className="flex-1 group relative"
          style={{ backgroundColor: ramp[step as keyof ColorRamp] }}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/10 flex items-center justify-center transition-opacity">
            <span className="text-[8px] font-mono text-white font-bold">{step}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Step2Colors = () => {
  const config = useStore($brandConfig);

  const primaryRamp = useMemo(() => 
    generateRamp(config.primaryColor, config.saturation, config.uniformity),
    [config.primaryColor, config.saturation, config.uniformity]
  );

  const secondaryColor = config.useCustomSecondary 
    ? (config.secondaryColor || '#000000') 
    : getSecondaryColor(config.primaryColor);

  const secondaryRamp = useMemo(() => 
    generateRamp(secondaryColor, config.saturation, config.uniformity),
    [secondaryColor, config.saturation, config.uniformity]
  );

  return (
    <motion.div
      key="step2"
      className="flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="text-forest-green font-medium mb-4 tracking-wider uppercase text-sm">Step 02</span>
      <h2 className="text-5xl md:text-7xl mb-6">Choose your colors.</h2>
      <p className="text-xl text-charcoal/60 mb-12 max-w-xl">
        We use OKLCH for perceptually uniform color ramps that look great in any theme.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Color Picker & Sliders */}
        <div className="space-y-12">
          {/* Primary */}
          <div className="space-y-6">
            <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40">Primary Color</label>
            <div className="flex gap-8 items-start">
              <div className="w-full max-w-[280px]">
                <HexColorPicker
                  color={config.primaryColor}
                  onChange={(color) => updateConfig({ primaryColor: color })}
                  style={{ width: '100%', height: '200px' }}
                />
              </div>
              <div className="flex-1 space-y-4">
                <div className="p-6 bg-white rounded-3xl border border-charcoal/5 shadow-sm flex flex-col items-center">
                  <div
                    className="w-20 h-20 rounded-2xl mb-4 shadow-inner"
                    style={{ backgroundColor: config.primaryColor }}
                  />
                  <span className="font-mono font-bold text-sm text-charcoal">{config.primaryColor.toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40">Secondary Color</label>
              <button 
                onClick={() => updateConfig({ useCustomSecondary: !config.useCustomSecondary })}
                className="text-[10px] font-bold uppercase tracking-widest text-forest-green hover:underline"
              >
                {config.useCustomSecondary ? 'Switch to Auto' : 'Customize'}
              </button>
            </div>
            
            {config.useCustomSecondary ? (
              <div className="flex gap-8 items-start">
                <div className="w-full max-w-[280px]">
                  <HexColorPicker
                    color={config.secondaryColor || '#000000'}
                    onChange={(color) => updateConfig({ secondaryColor: color })}
                    style={{ width: '100%', height: '200px' }}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="p-6 bg-white rounded-3xl border border-charcoal/5 shadow-sm flex flex-col items-center">
                    <div
                      className="w-20 h-20 rounded-2xl mb-4 shadow-inner"
                      style={{ backgroundColor: config.secondaryColor || '#000000' }}
                    />
                    <span className="font-mono font-bold text-sm text-charcoal">{(config.secondaryColor || '#000000').toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-charcoal/5 rounded-3xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl shadow-inner" style={{ backgroundColor: secondaryColor }} />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-charcoal/40 block">Generated Complementary</span>
                    <span className="font-mono font-bold">{secondaryColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sliders */}
          <div className="space-y-8 p-8 bg-charcoal/5 rounded-3xl">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider">Saturation</label>
                <span className="text-xs font-mono text-charcoal/40">{config.saturation}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                value={config.saturation}
                onChange={(e) => updateConfig({ saturation: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-charcoal/10 rounded-full appearance-none cursor-pointer accent-forest-green"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-charcoal/60 uppercase tracking-wider">Uniformity</label>
                <span className="text-xs font-mono text-charcoal/40">{config.uniformity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.uniformity}
                onChange={(e) => updateConfig({ uniformity: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-charcoal/10 rounded-full appearance-none cursor-pointer accent-forest-green"
              />
            </div>
          </div>
        </div>

        {/* Ramps & Advanced */}
        <div className="space-y-12">
          <div className="space-y-10">
            <ColorRampView ramp={primaryRamp} label="Primary Ramp" />
            <ColorRampView ramp={secondaryRamp} label="Secondary Ramp" />
            
            {/* Neutral Tints */}
            <div className="space-y-6">
              <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40">Neutral Tint</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(['pure', 'cool', 'warm', 'brand-tinted'] as const).map((tint) => (
                  <button
                    key={tint}
                    onClick={() => updateConfig({ neutralTint: tint })}
                    className={`px-4 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${
                      config.neutralTint === tint
                        ? 'border-forest-green bg-forest-green/5 text-forest-green'
                        : 'border-charcoal/5 text-charcoal/40 hover:border-charcoal/20'
                    }`}
                  >
                    {tint.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Status Colors - Collapsible ideally but for now just show */}
          <div className="pt-8 border-t border-charcoal/10">
            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/40 mb-6">Status Colors</h4>
            <div className="grid grid-cols-2 gap-6">
              {Object.entries(config.statusColors).map(([key, value]) => (
                <div key={key} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg shadow-inner" style={{ backgroundColor: value }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">{key}</span>
                    <span className="text-sm font-mono">{value.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Step2Colors;
