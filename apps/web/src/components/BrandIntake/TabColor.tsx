import React, { useCallback, useState } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { $brandConfig, updateConfig } from './store';
import { useColorRamps, type ColorSlot } from './useColorRamps';
import { HexColorInput, RampSliders, NeutralTintSelector, GenerationModeSelector } from './ColorRow';
import { ColorPickerPopover } from '../ui/ColorPickerPopover';
import { ColorRampView } from '../Showcase/ColorRampView';
import type { GenerationMode } from './colorGeneration';
import { SEMANTIC_HUES } from './colorGeneration';

// Compact row for additional auto-generated hue ramps
const AdditionalColorRow: React.FC<ColorSlot> = ({ name, ramp }) => {
  const isSemantic = SEMANTIC_HUES.includes(name);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-charcoal/70">{name}</span>
        {isSemantic && (
          <span className="text-[10px] font-medium text-charcoal/50 bg-charcoal/5 px-1.5 py-0.5 rounded">
            core
          </span>
        )}
      </div>
      <ColorRampView ramp={ramp} className="h-6 rounded-lg" />
    </div>
  );
};

const EXPAND_TRANSITION = { duration: 0.25, ease: [0.32, 0.72, 0, 1] as const };

const TabColor: React.FC = () => {
  const config = useStore($brandConfig);
  const derived = useColorRamps(config);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const handlePrimaryChange = useCallback(
    (c: string) => updateConfig({ primaryColor: c }),
    [],
  );

  const handleSecondaryChange = useCallback(
    (c: string) => updateConfig({ useCustomSecondary: true, secondaryColor: c }),
    [],
  );

  const handleSecondaryGeneration = useCallback(
    (mode: GenerationMode) =>
      updateConfig({ useCustomSecondary: false, secondaryGenerationMode: mode }),
    [],
  );

  const handleNeutralTintChange = useCallback(
    (tint: 'pure' | 'cool' | 'warm' | 'brand-tinted') => updateConfig({ neutralTint: tint }),
    [],
  );

  const handleSaturationChange = useCallback(
    (value: number) => updateConfig({ saturation: value }),
    [],
  );

  const handleUniformityChange = useCallback(
    (value: number) => updateConfig({ uniformity: value }),
    [],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Primary color picker */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-bold text-charcoal">Primary Color</label>
        <div className="flex items-center gap-3">
          <ColorPickerPopover color={config.primaryColor} onChange={handlePrimaryChange} />
          <HexColorInput color={config.primaryColor} onChange={handlePrimaryChange} />
        </div>
        <ColorRampView ramp={derived.primaryRamp} className="h-8 rounded-lg" />
      </div>

      {/* Palette overview — compact read-only ramps */}
      <div className="flex flex-col gap-3 pt-3 border-t border-charcoal/5">
        <label className="text-xs font-medium text-charcoal/60 uppercase tracking-wider">Generated Palette</label>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-charcoal/50">Secondary</span>
            <ColorRampView ramp={derived.secondaryRamp} className="h-5 rounded-md" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-charcoal/50">Neutral</span>
            <ColorRampView ramp={derived.neutralRamp} className="h-5 rounded-md" />
          </div>
        </div>
      </div>

      {/* Customize palette — collapsible */}
      <div className="border-t border-charcoal/5 pt-3">
        <button
          onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
          className={`flex items-center justify-between w-full py-2 text-sm font-medium transition-colors cursor-pointer rounded-lg ${
            isCustomizeOpen ? 'text-forest-green' : 'text-charcoal/70 hover:text-charcoal'
          }`}
        >
          <span>Customize palette</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isCustomizeOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {isCustomizeOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={EXPAND_TRANSITION}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-6 pt-3 pb-1">
                {/* Secondary color */}
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-charcoal">Secondary</label>
                  <div className="flex items-center gap-3">
                    <ColorPickerPopover color={derived.secondaryColor} onChange={handleSecondaryChange} />
                    <HexColorInput color={derived.secondaryColor} onChange={handleSecondaryChange} />
                  </div>
                  <GenerationModeSelector
                    value={config.secondaryGenerationMode}
                    onChange={handleSecondaryGeneration}
                  />
                  <ColorRampView ramp={derived.secondaryRamp} className="h-8 rounded-lg" />
                </div>

                {/* Neutral tint */}
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-bold text-charcoal">Neutral</label>
                  <NeutralTintSelector
                    value={config.neutralTint}
                    onChange={handleNeutralTintChange}
                  />
                  <ColorRampView ramp={derived.neutralRamp} className="h-8 rounded-lg" />
                </div>

                {/* Saturation & Uniformity */}
                <div className="bg-charcoal/5 rounded-xl p-4">
                  <RampSliders
                    saturation={config.saturation}
                    uniformity={config.uniformity}
                    onSaturationChange={handleSaturationChange}
                    onUniformityChange={handleUniformityChange}
                  />
                </div>

                {/* Additional colors */}
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-medium text-charcoal/60 uppercase tracking-wider">
                    Additional Colors
                  </label>
                  <div className="flex flex-col gap-3">
                    {derived.additionalColors.map((slot) => (
                      <AdditionalColorRow key={slot.name} {...slot} />
                    ))}
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

export default TabColor;
