import React from 'react';
import { useStore } from '@nanostores/react';
import { $showcaseConfig, updateShowcase } from '../Showcase/store';
import LivePlayground from './LivePlayground';
import type { PlaygroundConfig } from './types';

const LandingPlayground: React.FC = () => {
  const showcase = useStore($showcaseConfig);

  const config: PlaygroundConfig = {
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

  const handleChange = (updates: Partial<PlaygroundConfig>) => {
    updateShowcase(updates);
  };

  return <LivePlayground config={config} onChange={handleChange} />;
};

export default LandingPlayground;
