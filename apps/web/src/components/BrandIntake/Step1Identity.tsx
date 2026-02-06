import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import slugify from 'slugify';
import { useStore } from '@nanostores/react';
import { $brandConfig, updateConfig } from './store';

const COMPANY_SIZES = [
  'Solo / Freelancer',
  'Small Studio (2-10)',
  'Startup (11-50)',
  'Scaleup (51-200)',
  'Enterprise (200+)',
];

const Step1Identity = () => {
  const config = useStore($brandConfig);

  useEffect(() => {
    if (config.brandName && !config.slug) {
      const generatedSlug = slugify(config.brandName, { lower: true, strict: true });
      updateConfig({ slug: generatedSlug });
    }
  }, [config.brandName]);

  return (
    <motion.div
      key="step1"
      className="flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="text-forest-green font-medium mb-4 tracking-wider uppercase text-sm">Step 01</span>
      <h2 className="text-5xl md:text-7xl mb-6">Let's define your brand.</h2>
      <p className="text-xl text-charcoal/60 mb-12 max-w-xl">
        This info will be used to generate your design system and package metadata.
      </p>

      <div className="space-y-12">
        {/* Brand Name */}
        <div className="flex flex-col">
          <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40 mb-4">Brand Name</label>
          <input
            type="text"
            value={config.brandName}
            onChange={(e) => updateConfig({ brandName: e.target.value })}
            placeholder="Acme Inc."
            className="text-4xl md:text-6xl font-serif italic p-0 bg-transparent border-none focus:outline-none placeholder:text-charcoal/10"
            autoFocus
          />
          <div className="h-px w-full bg-charcoal/10 mt-4" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Package Scope */}
          <div className="flex flex-col">
            <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40 mb-4">Package Scope</label>
            <div className="flex items-center text-2xl md:text-3xl font-mono">
              <span className="text-charcoal/30">@</span>
              <input
                type="text"
                value={config.packageScope.replace(/^@/, '')}
                onChange={(e) => updateConfig({ packageScope: `@${e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')}` })}
                placeholder="acme"
                className="bg-transparent border-none focus:outline-none placeholder:text-charcoal/10 w-full"
              />
            </div>
            <div className="h-px w-full bg-charcoal/10 mt-4" />
            <p className="text-xs text-charcoal/40 mt-2">Used for npm/pnpm scope (e.g., @acme/design-system)</p>
          </div>

          {/* Company Size */}
          <div className="flex flex-col">
            <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40 mb-4">Company Size</label>
            <select
              value={config.companySize}
              onChange={(e) => updateConfig({ companySize: e.target.value })}
              className="text-2xl md:text-3xl bg-transparent border-none focus:outline-none appearance-none cursor-pointer"
            >
              <option value="" disabled>Select size...</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <div className="h-px w-full bg-charcoal/10 mt-4" />
          </div>
        </div>

        {/* Logo Upload - Placeholder for now */}
        <div className="flex flex-col">
          <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40 mb-4">Logo (Optional)</label>
          <div className="border-2 border-dashed border-charcoal/10 rounded-3xl p-12 flex flex-col items-center justify-center hover:border-forest-green/20 transition-colors cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-charcoal/5 flex items-center justify-center mb-4 group-hover:bg-forest-green/5 transition-colors">
              <svg className="w-8 h-8 text-charcoal/40 group-hover:text-forest-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-charcoal/40 font-medium">Upload brand logo</p>
            <p className="text-xs text-charcoal/30 mt-1">SVG, PNG, or JPG (max 2MB)</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Step1Identity;
