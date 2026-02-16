import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $brandConfig, updateConfig } from './store';

const Step5Preview = () => {
  const config = useStore($brandConfig);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const borderRadius = {
    sharp: '0px',
    subtle: '4px',
    rounded: '12px',
    pill: '9999px',
  }[config.roundness];

  const padding = {
    compact: '8px 16px',
    default: '12px 24px',
    comfortable: '20px 32px',
  }[config.density];

  return (
    <div className="flex flex-col">
      <span className="text-charcoal/80 mb-4">Step 5</span>
      <h2 className="text-5xl md:text-7xl mb-6">Review and purchase</h2>
      <p className="text-xl text-charcoal/80 mb-12 max-w-xl">
        Here's a preview of how your components will look. Ready to generate your library?
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Preview Area */}
        <div className={`lg:col-span-2 rounded-[40px] p-12 transition-colors duration-500 border border-charcoal/5 ${isDarkMode ? 'bg-charcoal text-white' : 'bg-white text-charcoal'}`}>
          <div className="flex justify-between items-center mb-12">
            <h3 className="font-bold uppercase tracking-widest text-xs opacity-40">Component Preview</h3>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full border transition-colors ${isDarkMode ? 'border-white/20 hover:bg-white/10' : 'border-charcoal/10 hover:bg-charcoal/5'}`}
            >
              {isDarkMode ? '🌙' : '☀️'}
            </button>
          </div>

          <div className="space-y-16">
            {/* Buttons */}
            <div className="space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Buttons</span>
              <div className="flex flex-wrap gap-4">
                <button
                  style={{ 
                    backgroundColor: config.primaryColor,
                    borderRadius,
                    padding,
                    color: '#fff',
                  }}
                  className="font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Primary Button
                </button>
                <button
                  style={{ 
                    border: `2px solid ${config.primaryColor}`,
                    borderRadius,
                    padding,
                    color: isDarkMode ? '#fff' : config.primaryColor,
                  }}
                  className="font-bold hover:bg-forest-green/5 transition-colors"
                >
                  Secondary
                </button>
                <button
                  style={{ 
                    borderRadius,
                    padding,
                    opacity: 0.6
                  }}
                  className="font-bold"
                >
                  Ghost
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Inputs</span>
              <div className="max-w-md space-y-4">
                <input
                  type="text"
                  placeholder="Enter your name..."
                  style={{ 
                    borderRadius,
                    padding: '12px 20px',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                  }}
                  className="w-full focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Typography</span>
              <div className="space-y-4">
                <h1 style={{ fontFamily: config.primaryFont, fontSize: '32px', fontWeight: 700 }}>
                  This is a heading
                </h1>
                <p style={{ fontFamily: config.primaryFont, fontSize: '16px', opacity: 0.7, lineHeight: 1.6 }}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris. 
                  Vivamus hendrerit arcu sed erat molestie vehicula.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary & Checkout */}
        <div className="space-y-12">
          <div className="bg-charcoal/5 rounded-[32px] p-8 space-y-8">
            <h4 className="font-bold uppercase tracking-widest text-xs text-charcoal/40">Configuration Summary</h4>
            <div className="space-y-6">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-charcoal/40 font-bold uppercase tracking-widest">Brand</span>
                <span className="font-serif italic text-lg">{config.brandName || 'Untitled'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-charcoal/40 font-bold uppercase tracking-widest">Primary Color</span>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                  <span className="font-mono text-sm">{config.primaryColor}</span>
                </div>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-charcoal/40 font-bold uppercase tracking-widest">Typography</span>
                <span className="font-bold text-sm">{config.primaryFont}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-charcoal/40 font-bold uppercase tracking-widest">Style</span>
                <span className="text-sm capitalize">{config.roundness} / {config.density}</span>
              </div>
            </div>
            
            <button 
              onClick={() => updateConfig({ currentStep: 1 })}
              className="text-xs font-bold text-forest-green uppercase tracking-widest hover:underline"
            >
              Edit all details
            </button>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col">
              <label className="text-xs font-bold uppercase tracking-widest text-charcoal/40 mb-3">Delivery Email</label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => updateConfig({ email: e.target.value })}
                placeholder="you@company.com"
                className="w-full bg-white border border-charcoal/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-forest-green focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="pt-6 border-t border-charcoal/5">
              <div className="flex justify-between items-baseline mb-8">
                <span className="text-3xl font-serif italic">$75</span>
                <span className="text-charcoal/40 text-sm">one-time build fee</span>
              </div>
              
              <button
                disabled={!config.email}
                className="w-full bg-forest-green text-white rounded-2xl py-6 font-bold text-xl shadow-lg shadow-forest-green/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => alert('Proceeding to checkout...')}
              >
                Generate Library
              </button>
              <p className="text-[10px] text-center text-charcoal/30 mt-4 uppercase tracking-widest font-bold">
                Includes full source code & documentation
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5Preview;
