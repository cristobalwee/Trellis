import React, { useEffect } from 'react';
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
    <form id="brand-intake-step1" className="flex flex-col" onSubmit={(e) => e.preventDefault()}>
      <span className="text-charcoal/80 mb-4 text-base">Step 1</span>
      <h2 className="text-5xl md:text-7xl mb-6">Let's start with the basics</h2>
      <p className="text-xl text-charcoal/80 mb-16">
        We’ll need to know more about your brand identity and development preferences in order to generate your system appropriately.
      </p>

      <div className="space-y-12">
        {/* Brand Name */}
        <div className="flex flex-col">
          <label className="text-base text-charcoal mb-4 font-medium">Brand Name<span className="text-red-500">*</span></label>
          <input
            type="text"
            value={config.brandName}
            onChange={(e) => updateConfig({ brandName: e.target.value })}
            placeholder="Acme Inc."
            className="text-xl md:text-2xl px-8 py-6 rounded-3xl border border-charcoal/20 focus:outline-blue-500 placeholder:text-charcoal/50"
            required
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Package Scope */}
          <div className="flex flex-col">
            <label className="text-base text-charcoal mb-4 font-medium">What should we call your system?<span className="text-red-500">*</span></label>
            <div className="flex items-stretch text-2xl md:text-3xl">
              <input
                type="text"
                value={config.packageScope.replace(/^@/, '')}
                onChange={(e) => updateConfig({ packageScope: `@${e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')}` })}
                placeholder="acme"
                className="text-xl md:text-2xl px-8 py-6 rounded-3xl border border-charcoal/20 focus:outline-blue-500 placeholder:text-charcoal/50 w-full"
                required
              />
            </div>
            <p className="text-sm text-charcoal/80 mt-4">Used for npm/pnpm scope (e.g., @acme/design-system)</p>
          </div>

          {/* Company Size */}
          <div className="flex flex-col">
            <label className="text-base text-charcoal mb-4 font-medium">Company Size</label>
            <select
              value={config.companySize}
              onChange={(e) => updateConfig({ companySize: e.target.value })}
              className="text-xl md:text-2xl px-8 py-6 rounded-3xl border border-charcoal/20 focus:outline-blue-500 placeholder:text-charcoal/50"
            >
              <option value="" disabled>Select size...</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Logo Upload - Placeholder for now */}
        <div className="flex flex-col">
          <label className="text-base text-charcoal mb-4 font-medium">Logo</label>
          <div className="border-2 border-dashed border-charcoal/20 rounded-3xl p-12 flex flex-col items-center justify-center hover:border-forest-green/20 transition-colors cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-charcoal/5 flex items-center justify-center mb-4 group-hover:bg-forest-green/5 transition-colors">
              <svg className="w-8 h-8 text-charcoal/80 group-hover:text-forest-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-charcoal font-medium">Upload brand logo</p>
            <p className="text-xs text-charcoal/80 mt-1">SVG, PNG, or JPG (max 2MB)</p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Step1Identity;
