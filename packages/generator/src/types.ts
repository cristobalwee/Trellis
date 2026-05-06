import type { ColorRamp, NeutralColorRamp } from './colorUtils.js';
import type { GenerationMode } from './colorGeneration.js';

export type { ColorRamp, NeutralColorRamp };

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
  logoUrl?: string;
  primaryColor: string;
  primaryRamp?: ColorRamp;
  secondaryColor?: string;
  secondaryRamp?: ColorRamp;
  useCustomSecondary: boolean;
  secondaryGenerationMode?: GenerationMode;
  tertiaryColor?: string;
  useTertiary: boolean;
  useCustomTertiary: boolean;
  tertiaryGenerationMode?: GenerationMode;
  tertiaryRamp?: ColorRamp;
  neutralTint: 'pure' | 'cool' | 'warm' | 'brand-tinted';
  neutralRamp?: NeutralColorRamp;
  accentColor?: string;
  useAccent: boolean;
  useCustomAccent: boolean;
  accentGenerationMode?: GenerationMode;
  accentRamp?: ColorRamp;
  rampOverrides: Record<string, Partial<ColorRamp>>;
  chromaFalloff: number;
  statusColors: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  primaryFont: string;
  headingFont: string;
  customHeadingFontName?: string;
  customBodyFontName?: string;
  headingWeight: FontWeight;
  bodyWeights: BodyFontWeights;
  fontScale: number;
  roundness: 'sharp' | 'subtle' | 'rounded' | 'pill';
  shadows: 'none' | 'subtle' | 'dramatic';
  density: 'compact' | 'default' | 'comfortable';
  expressiveness: 'minimal' | 'balanced' | 'expressive';
}

export type BrandConfigInput = Partial<
  Omit<BrandConfig, 'statusColors' | 'bodyWeights' | 'rampOverrides'>
> & {
  statusColors?: Partial<BrandConfig['statusColors']>;
  bodyWeights?: Partial<BodyFontWeights>;
  rampOverrides?: BrandConfig['rampOverrides'];
};

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

export function createBrandConfig(input: BrandConfigInput = {}): BrandConfig {
  return {
    ...initialConfig,
    ...input,
    statusColors: {
      ...initialConfig.statusColors,
      ...input.statusColors,
    },
    bodyWeights: {
      ...initialConfig.bodyWeights,
      ...input.bodyWeights,
    },
    rampOverrides: input.rampOverrides ?? {},
  };
}
