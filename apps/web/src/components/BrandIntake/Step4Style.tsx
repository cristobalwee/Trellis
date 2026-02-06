import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { $brandConfig, updateConfig } from './store';

interface VisualPickerProps {
  label: string;
  value: string;
  options: {
    id: string;
    label: string;
    description: string;
    preview: React.ReactNode;
  }[];
  onChange: (id: any) => void;
}

const VisualPicker = ({ label, value, options, onChange }: VisualPickerProps) => (
  <div className="space-y-6">
    <label className="text-sm font-bold uppercase tracking-widest text-charcoal/40">{label}</label>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={`p-6 rounded-3xl border-2 text-left transition-all duration-300 ${
            value === option.id
              ? 'border-forest-green bg-forest-green/5 ring-4 ring-forest-green/10'
              : 'border-charcoal/5 bg-white hover:border-charcoal/20'
          }`}
        >
          <div className="mb-6 h-24 flex items-center justify-center bg-charcoal/5 rounded-2xl">
            {option.preview}
          </div>
          <div className="font-bold text-lg mb-1">{option.label}</div>
          <div className="text-charcoal/50 text-xs leading-relaxed">{option.description}</div>
        </button>
      ))}
    </div>
  </div>
);

const Step4Style = () => {
  const config = useStore($brandConfig);

  return (
    <motion.div
      key="step4"
      className="flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <span className="text-forest-green font-medium mb-4 tracking-wider uppercase text-sm">Step 04</span>
      <h2 className="text-5xl md:text-7xl mb-6">Define the vibe.</h2>
      <p className="text-xl text-charcoal/60 mb-12 max-w-xl">
        Select the visual characteristics that match your brand's personality.
      </p>

      <div className="space-y-16">
        <VisualPicker
          label="Roundness"
          value={config.roundness}
          onChange={(val) => updateConfig({ roundness: val })}
          options={[
            {
              id: 'sharp',
              label: 'Sharp',
              description: 'Precise, technical, and brutalist.',
              preview: <div className="w-12 h-12 border-2 border-charcoal/20" />,
            },
            {
              id: 'rounded',
              label: 'Rounded',
              description: 'Friendly, modern, and balanced.',
              preview: <div className="w-12 h-12 border-2 border-charcoal/20 rounded-xl" />,
            },
            {
              id: 'pill',
              label: 'Pill',
              description: 'Playful, soft, and approachable.',
              preview: <div className="w-16 h-8 border-2 border-charcoal/20 rounded-full" />,
            },
          ]}
        />

        <VisualPicker
          label="Density"
          value={config.density}
          onChange={(val) => updateConfig({ density: val })}
          options={[
            {
              id: 'compact',
              label: 'Compact',
              description: 'Information-rich and efficient.',
              preview: (
                <div className="flex flex-col gap-1 w-20">
                  <div className="h-2 bg-charcoal/10 rounded w-full" />
                  <div className="h-2 bg-charcoal/10 rounded w-2/3" />
                </div>
              ),
            },
            {
              id: 'default',
              label: 'Default',
              description: 'Balanced white space and focus.',
              preview: (
                <div className="flex flex-col gap-3 w-20">
                  <div className="h-2 bg-charcoal/10 rounded w-full" />
                  <div className="h-2 bg-charcoal/10 rounded w-2/3" />
                </div>
              ),
            },
            {
              id: 'comfortable',
              label: 'Comfortable',
              description: 'Airy, luxurious, and easy to read.',
              preview: (
                <div className="flex flex-col gap-6 w-20">
                  <div className="h-2 bg-charcoal/10 rounded w-full" />
                  <div className="h-2 bg-charcoal/10 rounded w-2/3" />
                </div>
              ),
            },
          ]}
        />

        <VisualPicker
          label="Expressiveness"
          value={config.expressiveness}
          onChange={(val) => updateConfig({ expressiveness: val })}
          options={[
            {
              id: 'minimal',
              label: 'Minimal',
              description: 'Utilitarian and understated.',
              preview: <div className="w-8 h-px bg-charcoal/20" />,
            },
            {
              id: 'balanced',
              label: 'Balanced',
              description: 'Strategic use of accents.',
              preview: (
                <div className="relative">
                  <div className="w-12 h-12 border-2 border-charcoal/20 rounded-lg" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-forest-green rounded-full" />
                </div>
              ),
            },
            {
              id: 'expressive',
              label: 'Expressive',
              description: 'Bold, energetic, and distinct.',
              preview: (
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-4 h-8 bg-forest-green/20 rounded-full" style={{ height: `${i * 8 + 16}px` }} />
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>
    </motion.div>
  );
};

export default Step4Style;
