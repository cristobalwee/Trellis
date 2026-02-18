import { map } from 'nanostores';

export interface ShowcaseConfig {
  // Panel 1: Design System Configurator
  brandName: string;
  systemName: string;
  primaryColor: string;
  secondaryColor: string;
  saturation: number;
  lightness: number;
  fontFamily: string;
  roundness: 'sharp' | 'rounded' | 'pill';
  density: 'compact' | 'default' | 'comfortable';
  expressiveness: 'minimal' | 'balanced' | 'expressive';

  // Panel 2: Component Showcase
  isDarkMode: boolean;
}

const defaultShowcaseConfig: ShowcaseConfig = {
  brandName: 'Acme',
  systemName: 'Atlas',
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  saturation: 100,
  lightness: 100,
  fontFamily: 'Inter',
  roundness: 'rounded',
  density: 'default',
  expressiveness: 'balanced',
  isDarkMode: false,
};

export const $showcaseConfig = map<ShowcaseConfig>(defaultShowcaseConfig);

export function updateShowcase(updates: Partial<ShowcaseConfig>) {
  $showcaseConfig.set({ ...$showcaseConfig.get(), ...updates });
}

export function resetShowcase() {
  $showcaseConfig.set({ ...defaultShowcaseConfig });
}
