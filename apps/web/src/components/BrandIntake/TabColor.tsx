import React, { useCallback, useState } from 'react';
import { useStore } from '@nanostores/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { $brandConfig, updateConfig, updateRampStep } from './store';
import { useColorRamps, type ColorSlot } from './useColorRamps';
import { HexColorInput, RampSliders, NeutralTintSelector, GenerationModeSelector } from './ColorRow';
import { ColorPickerPopover } from '../ui/ColorPickerPopover';
import { ColorRampView } from '../Showcase/ColorRampView';
import type { GenerationMode } from './colorGeneration';
import { SEMANTIC_HUES } from './colorGeneration';

const EXPAND_TRANSITION = { duration: 0.25, ease: [0.32, 0.72, 0, 1] as const };

const AdditionalColorRow: React.FC<ColorSlot & { onStepChange: (step: number, color: string) => void }> = ({ name, ramp, onStepChange }) => {
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
      <ColorRampView ramp={ramp} className="h-6 rounded-lg" onStepChange={onStepChange} />
    </div>
  );
};

const TabColor: React.FC = () => {
  const config = useStore($brandConfig);
  const derived = useColorRamps(config);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);

  const handlePrimaryChange = useCallback(
    (c: string) => updateConfig({ primaryColor: c, rampOverrides: {} }),
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

  const handleChromaFalloffChange = useCallback(
    (value: number) => updateConfig({ chromaFalloff: value }),
    [],
  );

  const handleUniformityChange = useCallback(
    (value: number) => updateConfig({ uniformity: value }),
    [],
  );

  const handleRampStep = useCallback(
    (rampKey: string) => (step: number, color: string) => updateRampStep(rampKey, step, color),
    [],
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Primary color picker */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-bold text-charcoal">Primary Color</label>
        <div className="flex items-center gap-3">
          <ColorPickerPopover color={config.primaryColor} onChange={handlePrimaryChange} />
          <HexColorInput color={config.primaryColor} onChange={handlePrimaryChange} />
        </div>
        <ColorRampView ramp={derived.primaryRamp} className="h-8 rounded-lg" onStepChange={handleRampStep('primary')} />
        <div>
        <button
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className={`flex items-center justify-between w-full py-2 text-sm font-medium transition-colors cursor-pointer rounded-lg ${
            isAdvancedOpen ? 'text-forest-green' : 'text-charcoal/70 hover:text-charcoal'
          }`}
        >
          <span>Advanced Settings</span>
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
              transition={{
                height: EXPAND_TRANSITION,
                opacity: { duration: 0.2, ease: 'easeInOut' },
              }}
              className="overflow-hidden"
            >
              <div className="bg-charcoal/5 rounded-xl p-4 mt-2">
                <RampSliders
                  chromaFalloff={config.chromaFalloff}
                  uniformity={config.uniformity}
                  onChromaFalloffChange={handleChromaFalloffChange}
                  onUniformityChange={handleUniformityChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>

      {/* Secondary color */}
      <div className="flex flex-col gap-3 pt-3 border-t border-charcoal/5">
        <label className="text-sm font-bold text-charcoal">Secondary</label>
        <div className="flex items-center gap-3">
          <ColorPickerPopover color={derived.secondaryColor} onChange={handleSecondaryChange} />
          <HexColorInput color={derived.secondaryColor} onChange={handleSecondaryChange} />
        </div>
        <ColorRampView ramp={derived.secondaryRamp} className="h-8 rounded-lg" onStepChange={handleRampStep('secondary')} />
        <GenerationModeSelector
          value={config.secondaryGenerationMode}
          onChange={handleSecondaryGeneration}
        />
      </div>

      {/* Neutral tint */}
      <div className="flex flex-col gap-3 pt-3 border-t border-charcoal/5">
        <label className="text-sm font-bold text-charcoal">Neutral</label>
        <ColorRampView ramp={derived.neutralRamp} className="h-8 rounded-lg" onStepChange={handleRampStep('neutral')} />
        <NeutralTintSelector
          value={config.neutralTint}
          onChange={handleNeutralTintChange}
        />
      </div>

      {/* Additional colors */}
      <div className="border-t border-charcoal/5 pt-3">
        <button
          onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
          className={`flex items-center justify-between w-full py-2 text-sm font-medium transition-colors cursor-pointer rounded-lg ${
            isAdditionalOpen ? 'text-forest-green' : 'text-charcoal/70 hover:text-charcoal'
          }`}
        >
          <span>Additional Colors</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isAdditionalOpen ? 'rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {isAdditionalOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                height: EXPAND_TRANSITION,
                opacity: { duration: 0.2, ease: 'easeInOut' },
              }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-6 py-4">
                {derived.additionalColors.map((slot) => (
                  <AdditionalColorRow key={slot.name} {...slot} onStepChange={handleRampStep(slot.name)} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TabColor;
