import React, { useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { $showcaseConfig, updateShowcase } from '../Showcase/store';
import { $brandConfig } from '../BrandIntake/store';
import LivePlayground from './LivePlayground';
import type { PlaygroundConfig } from './types';

/**
 * Landing page playground that bridges to LivePlayground.
 * Reads from brandConfig (localStorage) if a previous configuration exists,
 * otherwise falls back to the showcase in-memory defaults.
 */
const LandingPlayground: React.FC = () => {
  const showcase = useStore($showcaseConfig);
  const brand = useStore($brandConfig);

  const hasBrandConfig = Boolean(brand.brandName || brand.primaryColor !== '#2D5016');

  const config: PlaygroundConfig = useMemo(() => {
    if (hasBrandConfig) {
      return {
        primaryColor: brand.primaryColor,
        secondaryColor: brand.secondaryColor || '#8B5CF6',
        saturation: brand.saturation,
        lightness: brand.uniformity,
        fontFamily: brand.primaryFont,
        roundness: brand.roundness === 'subtle' ? 'rounded' : brand.roundness,
        density: brand.density,
        expressiveness: brand.expressiveness,
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
      isDarkMode: showcase.isDarkMode,
    };
  }, [hasBrandConfig, brand, showcase]);

  const handleChange = (updates: Partial<PlaygroundConfig>) => {
    updateShowcase(updates);
  };

  return <LivePlayground config={config} onChange={handleChange} />;
};

export default LandingPlayground;
