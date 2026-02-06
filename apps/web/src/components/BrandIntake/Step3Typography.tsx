import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { $brandConfig, updateConfig } from './store';

const POPULAR_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
  'Playfair Display', 'Merriweather', 'Lora', 'IBM Plex Sans', 'Space Grotesk'
];

const Step3Typography = () => {
  const config = useStore($brandConfig);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFonts = POPULAR_FONTS.filter(font => 
    font.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fontScaleSteps = [
    { label: 'Display Large', size: Math.pow(config.fontScale, 4) * 16 },
    { label: 'Display Small', size: Math.pow(config.fontScale, 3) * 16 },
    { label: 'Heading Large', size: Math.pow(config.fontScale, 2) * 16 },
    { label: 'Heading Small', size: config.fontScale * 16 },
    { label: 'Body Text', size: 16 },
    { label: 'Caption', size: 16 / config.fontScale },
  ];

  return (
    <motion.div
      key="step3"
      className="flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="text-forest-green font-medium mb-4 tracking-wider uppercase text-sm">Step 03</span>
      <h2 className="text-5xl md:text-7xl mb-6">Set your typography.</h2>
      <p className="text-xl text-charcoal/60 mb-12 max-w-xl">
        Select a primary font and fine-tune your typographic scale.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Font Selection */}
        <div className="space-y-12">
          <div className="space-y-6">
            <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40">Primary Font</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm || config.primaryFont}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  updateConfig({ primaryFont: e.target.value });
                }}
                placeholder="Search Google Fonts..."
                className="w-full text-2xl md:text-3xl font-medium p-0 bg-transparent border-none focus:outline-none placeholder:text-charcoal/10"
              />
              <div className="h-px w-full bg-charcoal/10 mt-4" />
              
              {searchTerm && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-2xl shadow-xl border border-charcoal/5 p-4 z-10 max-h-60 overflow-y-auto">
                  {filteredFonts.map(font => (
                    <button
                      key={font}
                      onClick={() => {
                        updateConfig({ primaryFont: font });
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-charcoal/5 rounded-xl transition-colors font-medium"
                    >
                      {font}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40">Font Weights</label>
            <div className="flex flex-wrap gap-3">
              {[300, 400, 500, 600, 700, 800, 900].map(weight => (
                <button
                  key={weight}
                  onClick={() => {
                    const newWeights = config.fontWeights.includes(weight)
                      ? config.fontWeights.filter(w => w !== weight)
                      : [...config.fontWeights, weight].sort();
                    updateConfig({ fontWeights: newWeights });
                  }}
                  className={`px-4 py-3 rounded-xl text-sm font-mono transition-all border-2 ${
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

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40">Font Scale</label>
              <span className="text-sm font-mono text-charcoal/40">{config.fontScale.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="1.067"
              max="1.618"
              step="0.001"
              value={config.fontScale}
              onChange={(e) => updateConfig({ fontScale: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-charcoal/10 rounded-full appearance-none cursor-pointer accent-forest-green"
            />
            <div className="flex justify-between text-[10px] text-charcoal/30 font-bold uppercase tracking-widest">
              <span>Minor Second</span>
              <span>Golden Ratio</span>
            </div>
          </div>
        </div>

        {/* Preview Scale */}
        <div className="space-y-8 p-8 bg-white rounded-3xl border border-charcoal/5 shadow-sm">
          <label className="text-xs font-bold uppercase tracking-widest text-charcoal/40">Type Scale Specimen</label>
          <div className="space-y-8">
            {fontScaleSteps.map((step, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal/30">{step.label}</span>
                  <span className="text-[10px] font-mono text-charcoal/20">{Math.round(step.size)}px</span>
                </div>
                <p 
                  style={{ 
                    fontSize: `${step.size}px`,
                    fontFamily: `'${config.primaryFont}', sans-serif`,
                    fontWeight: config.fontWeights[Math.floor(config.fontWeights.length / 2)] || 400,
                    lineHeight: 1.2
                  }}
                  className="text-charcoal truncate"
                >
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Step3Typography;
