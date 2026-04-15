import { map } from 'nanostores';
import type { ColorRamp, NeutralColorRamp } from '../Showcase/colorUtils';

export type { ColorRamp, NeutralColorRamp };

export type TabId = 'color' | 'typography' | 'style';

// Typography weights — headings use a single weight; body uses light/regular/bold.
export const FONT_WEIGHT_OPTIONS = [300, 400, 500, 600, 700, 800, 900] as const;
export type FontWeight = (typeof FONT_WEIGHT_OPTIONS)[number];

export interface BodyFontWeights {
  light: FontWeight;
  regular: FontWeight;
  bold: FontWeight;
}

export const DEFAULT_HEADING_WEIGHT: FontWeight = 400;
export const DEFAULT_BODY_WEIGHTS: BodyFontWeights = { light: 300, regular: 400, bold: 700 };

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
  neutralRamp?: NeutralColorRamp;

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
  customHeadingFontName?: string;
  customBodyFontName?: string;
  headingWeight: FontWeight;
  bodyWeights: BodyFontWeights;
  fontScale: number;

  // Style
  roundness: 'sharp' | 'subtle' | 'rounded' | 'pill';
  shadows: 'none' | 'subtle' | 'dramatic';
  density: 'compact' | 'default' | 'comfortable';
  expressiveness: 'minimal' | 'balanced' | 'expressive';
}

export const initialConfig: BrandConfig = {
  primaryColor: '#2e7bab',
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
  primaryFont: 'Nunito',
  headingFont: 'Rubik',
  headingWeight: DEFAULT_HEADING_WEIGHT,
  bodyWeights: { ...DEFAULT_BODY_WEIGHTS },
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
