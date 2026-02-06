import { map } from 'nanostores';

export interface ShowcaseConfig {
  // Panel 1: Design System Configurator
  brandName: string;
  systemName: string;
  primaryColor: string;
  secondaryColor: string;
  roundness: 'sharp' | 'rounded' | 'pill';
  expressiveness: 'minimal' | 'balanced' | 'expressive';

  // Panel 2: Component Showcase
  isDarkMode: boolean;
}

export const $showcaseConfig = map<ShowcaseConfig>({
  brandName: 'Acme',
  systemName: 'Atlas',
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  roundness: 'rounded',
  expressiveness: 'balanced',
  isDarkMode: false,
});

export function updateShowcase(updates: Partial<ShowcaseConfig>) {
  $showcaseConfig.set({ ...$showcaseConfig.get(), ...updates });
}

export function resetShowcase() {
  $showcaseConfig.set({
    brandName: 'Acme',
    systemName: 'Atlas',
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    roundness: 'rounded',
    expressiveness: 'balanced',
    isDarkMode: false,
  });
}
