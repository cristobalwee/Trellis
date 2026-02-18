import React from 'react';
import { useStore } from '@nanostores/react';
import { $brandConfig, updateConfig } from './store';
import IntakePlayground from '../LivePlayground/IntakePlayground';

const Step5Preview = () => {
  const config = useStore($brandConfig);

  return (
    <div className="flex flex-col">
      <span className="text-charcoal/80 mb-4">Step 5</span>
      <h2 className="text-5xl md:text-7xl mb-6">Review and purchase</h2>
      <p className="text-xl text-charcoal/80 mb-8">
        Preview your design system live. Tweak anything you'd like, and when you're ready click "finish" to purchase and generate your library.
      </p>

      {/* Live Playground */}
      <div className="mb-12">
        <IntakePlayground />
      </div>

      {/* Summary & Checkout */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
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
              {config.secondaryColor && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-charcoal/40 font-bold uppercase tracking-widest">Secondary Color</span>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: config.secondaryColor }} />
                    <span className="font-mono text-sm">{config.secondaryColor}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-charcoal/40 font-bold uppercase tracking-widest">Typography</span>
                <span className="font-bold text-sm">{config.primaryFont}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-charcoal/40 font-bold uppercase tracking-widest">Style</span>
                <span className="text-sm capitalize">{config.roundness} / {config.density} / {config.expressiveness}</span>
              </div>
            </div>

            <button
              onClick={() => updateConfig({ currentStep: 1 })}
              className="text-xs font-bold text-forest-green uppercase tracking-widest hover:underline"
            >
              Edit all details
            </button>
          </div>
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
              <span className="text-3xl font-serif italic">$99</span>
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
      </div> */}
    </div>
  );
};

export default Step5Preview;
