import React, { useState, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { $brandConfig, updateConfig } from '../BrandIntake/store';
import LivePlayground from './LivePlayground';
import type { PlaygroundConfig } from './types';
import { generateDesignTokens } from '@trellis/generator';

const IntakePlayground: React.FC = () => {
  const brand = useStore($brandConfig);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const config: PlaygroundConfig = {
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor || '#8B5CF6',
    saturation: 100,
    lightness: 100,
    fontFamily: brand.primaryFont,
    roundness: brand.roundness === 'subtle' ? 'rounded' : brand.roundness,
    density: brand.density,
    expressiveness: brand.expressiveness,
    isDarkMode,
  };

  const handleChange = (updates: Partial<PlaygroundConfig>) => {
    const brandUpdates: Record<string, unknown> = {};

    if (updates.primaryColor !== undefined) brandUpdates.primaryColor = updates.primaryColor;
    if (updates.secondaryColor !== undefined) {
      brandUpdates.secondaryColor = updates.secondaryColor;
      brandUpdates.useCustomSecondary = true;
    }
    // playground saturation is a different concept; don't map to chromaFalloff

    if (updates.fontFamily !== undefined) {
      brandUpdates.primaryFont = updates.fontFamily;
    }
    if (updates.roundness !== undefined) brandUpdates.roundness = updates.roundness;
    if (updates.density !== undefined) brandUpdates.density = updates.density;
    if (updates.expressiveness !== undefined) brandUpdates.expressiveness = updates.expressiveness;
    if (updates.isDarkMode !== undefined) setIsDarkMode(updates.isDarkMode);

    if (Object.keys(brandUpdates).length > 0) {
      updateConfig(brandUpdates);
    }
  };

  const { tokens: designTokens } = useMemo(
    () => generateDesignTokens(brand, isDarkMode),
    [brand, isDarkMode]
  );

  return (
    <LivePlayground
      config={config}
      onChange={handleChange}
      designTokens={designTokens}
      compact
      showExternalDarkModeToggle={false}
      collapsibleControls={true}
      defaultControlsOpen={false}
    />
  );
};

export default IntakePlayground;
