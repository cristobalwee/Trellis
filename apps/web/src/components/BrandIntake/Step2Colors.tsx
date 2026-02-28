import React, { useCallback } from 'react';
import { useStore } from '@nanostores/react';

import { $brandConfig, updateConfig } from './store';
import { useColorRamps, type ColorSlot } from './useColorRamps';
import { PrimaryColorRow, ColorRow, RampSliders, NeutralTintSelector } from './ColorRow';
import { ColorRampView } from '../Showcase/ColorRampView';
import type { GenerationMode } from './colorGeneration';
import { SEMANTIC_HUES } from './colorGeneration';

// ---------------------------------------------------------------------------
// AdditionalColorRow — lightweight row for auto-generated named hue ramps
// ---------------------------------------------------------------------------

const AdditionalColorRow: React.FC<ColorSlot> = ({ name, hue, ramp }) => {
  const isSemantic = SEMANTIC_HUES.includes(name);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-base text-charcoal/80">{name}</span>
        {isSemantic && (
          <span className="text-[10px] font-medium text-charcoal/50 bg-charcoal/5 px-1.5 py-0.5 rounded">
            core
          </span>
        )}
      </div>
      <ColorRampView ramp={ramp} className="h-12 rounded-xl" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Step2Colors
// ---------------------------------------------------------------------------

const Step2Colors: React.FC = () => {
  const config = useStore($brandConfig);
  const derived = useColorRamps(config);
  console.log(derived);

  // --- Memoized callbacks ---------------------------------------------------

  const handlePrimaryChange = useCallback(
    (c: string) => updateConfig({ primaryColor: c }),
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

  // --- Render ---------------------------------------------------------------

  return (
    <div className="flex flex-col animate-in fade-in duration-500">
      <span className="text-charcoal/80 mb-4 text-base">Step 2</span>
      <h2 className="text-5xl md:text-7xl mb-6">Choose your colors</h2>
      <p className="text-xl text-charcoal/80 mb-12">
        We use OKLCH to ensure your color system is accessible and perceptually
        uniform across all themes.
      </p>

      <div className="flex flex-col gap-24">
        {/* Row 1: Primary */}
        <div className="w-full">
          <PrimaryColorRow
            label="Primary"
            description="Your core brand – we'll use this color as a base for the rest of your palette. Used for main actions and key branding elements."
            color={config.primaryColor}
            onChange={handlePrimaryChange}
            ramp={derived.primaryRamp}
            advancedContent={
              <RampSliders
                saturation={config.saturation}
                uniformity={config.uniformity}
                onSaturationChange={handleSaturationChange}
                onUniformityChange={handleUniformityChange}
              />
            }
          />
        </div>

        {/* Row 2: Secondary & Neutral */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          <ColorRow
            label="Secondary"
            description="Supports the primary color. Used for variety and secondary actions."
            color={derived.secondaryColor}
            onChange={handleSecondaryChange}
            ramp={derived.secondaryRamp}
            generationMode={config.secondaryGenerationMode}
            onGenerationChange={handleSecondaryGeneration}
          />

          <ColorRow
            label="Neutral"
            description="Used for text, backgrounds, and subtle borders. Can be tinted."
            color={derived.neutralRamp[500]}
            onChange={() => {}}
            showInput={false}
            ramp={derived.neutralRamp}
            advancedContent={
              <NeutralTintSelector
                value={config.neutralTint}
                onChange={handleNeutralTintChange}
              />
            }
          />
        </div>

        {/* Row 3: Additional Colors (named hue slots) */}
        <div className="space-y-6 pt-8 border-t border-charcoal/5">
          <div className="flex flex-col gap-2">
            <h4 className="text-sm text-charcoal/80">Additional Colors</h4>
            <p className="text-base text-charcoal/80 mb-4">
              Auto-generated from your primary color. These cover statuses,
              data visualizations, and accent needs. Core colors (Red, Green,
              Blue, Yellow) stay stable regardless of your primary hue.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {derived.additionalColors.map((slot) => (
              <AdditionalColorRow key={slot.name} {...slot} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Colors;
