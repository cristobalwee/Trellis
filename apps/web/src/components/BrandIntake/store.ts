import { map } from 'nanostores';
import type { ColorRamp } from '../Showcase/colorUtils';

export type { ColorRamp };

export type TabId = 'color' | 'typography' | 'style';

export interface BrandConfig {
  // Identity
  logoUrl?: string;

  // Colors
  primaryColor: string;
  primaryRamp?: ColorRamp;
  secondaryColor?: string;
  secondaryRamp?: ColorRamp;
  useCustomSecondary: boolean;
  secondaryGenerationMode?: 'complementary' | 'split-complementary' | 'triadic' | 'analogous' | 'tetradic' | 'monochromatic';

  tertiaryColor?: string;
  useTertiary: boolean;
  useCustomTertiary: boolean;
  tertiaryGenerationMode?: 'complementary' | 'split-complementary' | 'triadic' | 'analogous' | 'tetradic' | 'monochromatic';
  tertiaryRamp?: ColorRamp;

  neutralTint: 'pure' | 'cool' | 'warm' | 'brand-tinted';
  neutralRamp?: ColorRamp;

  accentColor?: string;
  useAccent: boolean;
  useCustomAccent: boolean;
  accentGenerationMode?: 'complementary' | 'split-complementary' | 'triadic' | 'analogous' | 'tetradic' | 'monochromatic';
  accentRamp?: ColorRamp;

  /** Per-step color overrides keyed by ramp id ('primary', 'secondary', 'neutral', or hue name). */
  rampOverrides: Record<string, Partial<ColorRamp>>;

  chromaFalloff: number; // 0-100: how much chroma decreases toward ramp extremes
  statusColors: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // Typography
  primaryFont: string;
  headingFont: string;
  useSingleTypeface: boolean;
  customFontName?: string;
  customHeadingFontName?: string;
  customBodyFontName?: string;
  fontWeights: number[];
  fontScale: number;

  // Style
  roundness: 'sharp' | 'subtle' | 'rounded' | 'pill';
  shadows: 'none' | 'subtle' | 'elevated';
  density: 'compact' | 'default' | 'comfortable';
  expressiveness: 'minimal' | 'balanced' | 'expressive';
}

export const initialConfig: BrandConfig = {
  primaryColor: '#2D5016',
  rampOverrides: {},
  useCustomSecondary: false,
  secondaryGenerationMode: 'complementary',
  useTertiary: false,
  useCustomTertiary: false,
  tertiaryGenerationMode: 'analogous',
  neutralTint: 'brand-tinted',
  useAccent: false,
  useCustomAccent: false,
  accentGenerationMode: 'triadic',
  chromaFalloff: 80,
  statusColors: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  primaryFont: 'Inter',
  headingFont: 'Inter',
  useSingleTypeface: true,
  fontWeights: [400, 500, 600, 700],
  fontScale: 1.25,
  roundness: 'rounded',
  shadows: 'subtle',
  density: 'default',
  expressiveness: 'balanced',
};

export const $brandConfig = map<BrandConfig>(initialConfig);

export function updateConfig(updates: Partial<BrandConfig>) {
  $brandConfig.set({ ...$brandConfig.get(), ...updates });
}

export function updateRampStep(rampKey: string, step: number, color: string) {
  const current = $brandConfig.get();
  const existing = current.rampOverrides[rampKey] ?? {};
  $brandConfig.set({
    ...current,
    rampOverrides: {
      ...current.rampOverrides,
      [rampKey]: { ...existing, [step]: color },
    },
  });
}

export function resetConfig() {
  $brandConfig.set(initialConfig);
}
