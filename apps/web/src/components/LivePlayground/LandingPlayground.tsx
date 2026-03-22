import React, { useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { $showcaseConfig, updateShowcase } from '../Showcase/store';
import { $brandConfig, initialConfig } from '../BrandIntake/store';
import LivePlayground from './LivePlayground';
import type { PlaygroundConfig } from './types';
import { generateDesignTokens } from '../../utils/generateTokens';

/**
 * Landing page playground that bridges to LivePlayground.
 * Reads from brandConfig if modified during this session,
 * otherwise falls back to the showcase in-memory defaults.
 */
const LandingPlayground: React.FC = () => {
  const showcase = useStore($showcaseConfig);
  const brand = useStore($brandConfig);

  const hasBrandConfig = brand.primaryColor !== initialConfig.primaryColor;

  const config: PlaygroundConfig = useMemo(() => {
    if (hasBrandConfig) {
      return {
        primaryColor: brand.primaryColor,
        secondaryColor: brand.secondaryColor || '#8B5CF6',
        saturation: 100,
        lightness: brand.uniformity,
        fontFamily: brand.primaryFont,
        roundness: brand.roundness,
        density: brand.density,
        expressiveness: brand.expressiveness,
        shadows: brand.shadows,
        isDarkMode: showcase.isDarkMode,
      };
    }

    return {
      primaryColor: showcase.primaryColor,
      secondaryColor: showcase.secondaryColor,
      saturation: showcase.saturation,
      lightness: showcase.lightness,
      fontFamily: showcase.fontFamily,
      roundness: showcase.roundness,
      density: showcase.density,
      expressiveness: showcase.expressiveness,
      shadows: showcase.shadows,
      isDarkMode: showcase.isDarkMode,
    };
  }, [hasBrandConfig, brand, showcase]);

  const sourceConfig = hasBrandConfig ? brand : undefined;
  const designTokens = useMemo(() => {
    if (sourceConfig) {
      return generateDesignTokens(sourceConfig, config.isDarkMode);
    }
    // For showcase mode, build a minimal BrandConfig from showcase values
    return generateDesignTokens({
      ...initialConfig,
      primaryColor: showcase.primaryColor,
      secondaryColor: showcase.secondaryColor,
      chromaFalloff: 80,
      uniformity: showcase.lightness,
      primaryFont: showcase.fontFamily,
      headingFont: showcase.fontFamily,
      roundness: showcase.roundness as typeof initialConfig.roundness,
      density: showcase.density as typeof initialConfig.density,
      expressiveness: showcase.expressiveness as typeof initialConfig.expressiveness,
      shadows: showcase.shadows as typeof initialConfig.shadows,
    }, config.isDarkMode);
  }, [sourceConfig, showcase, config.isDarkMode]);

  const handleChange = (updates: Partial<PlaygroundConfig>) => {
    updateShowcase(updates);
  };

  return <LivePlayground config={config} onChange={handleChange} designTokens={designTokens} />;
};

export default LandingPlayground;
