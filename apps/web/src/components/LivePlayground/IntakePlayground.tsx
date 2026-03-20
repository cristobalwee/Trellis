import React, { useState, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { $brandConfig, updateConfig } from '../BrandIntake/store';
import LivePlayground from './LivePlayground';
import type { PlaygroundConfig } from './types';
import { generateDesignTokens } from '../../utils/generateTokens';

const IntakePlayground: React.FC = () => {
  const brand = useStore($brandConfig);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const config: PlaygroundConfig = {
    primaryColor: brand.primaryColor,
    secondaryColor: brand.secondaryColor || '#8B5CF6',
    saturation: brand.saturation,
    lightness: brand.uniformity,
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
    if (updates.saturation !== undefined) brandUpdates.saturation = updates.saturation;
    if (updates.lightness !== undefined) brandUpdates.uniformity = updates.lightness;
    if (updates.fontFamily !== undefined) {
      brandUpdates.primaryFont = updates.fontFamily;
      if (brand.useSingleTypeface) {
        brandUpdates.headingFont = updates.fontFamily;
      }
    }
    if (updates.roundness !== undefined) brandUpdates.roundness = updates.roundness;
    if (updates.density !== undefined) brandUpdates.density = updates.density;
    if (updates.expressiveness !== undefined) brandUpdates.expressiveness = updates.expressiveness;
    if (updates.isDarkMode !== undefined) setIsDarkMode(updates.isDarkMode);

    if (Object.keys(brandUpdates).length > 0) {
      updateConfig(brandUpdates);
    }
  };

  const designTokens = useMemo(
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
