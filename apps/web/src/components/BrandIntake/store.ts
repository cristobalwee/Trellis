import { persistentMap } from '@nanostores/persistent';
import type { ColorRamp } from '../Showcase/colorUtils';

export type { ColorRamp };

export interface BrandConfig {
  // Step 1: Identity
  brandName: string;
  slug: string;
  packageScope: string;
  companySize: string;
  logoUrl?: string;

  // Step 2: Colors
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

  saturation: number; // 0-100
  uniformity: number; // 0-100
  statusColors: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // Step 3: Typography
  primaryFont: string;
  headingFont: string;
  useSingleTypeface: boolean;
  customFontName?: string;
  customHeadingFontName?: string;
  customBodyFontName?: string;
  fontWeights: number[];
  fontScale: number;

  // Step 4: Style
  roundness: 'sharp' | 'subtle' | 'rounded' | 'pill';
  density: 'compact' | 'default' | 'comfortable';
  expressiveness: 'minimal' | 'balanced' | 'expressive';

  // Step 5: Metadata
  email: string;
  currentStep: number;
}

export const initialConfig: BrandConfig = {
  brandName: '',
  slug: '',
  packageScope: '',
  companySize: '',
  primaryColor: '#2D5016',
  useCustomSecondary: false,
  secondaryGenerationMode: 'complementary',
  useTertiary: false,
  useCustomTertiary: false,
  tertiaryGenerationMode: 'analogous',
  neutralTint: 'brand-tinted',
  useAccent: false,
  useCustomAccent: false,
  accentGenerationMode: 'triadic',
  saturation: 100,
  uniformity: 100,
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
  density: 'default',
  expressiveness: 'balanced',
  email: '',
  currentStep: 1,
};

export const $brandConfig = persistentMap<BrandConfig>('trellis_brand_config_', initialConfig);

export function updateConfig(updates: Partial<BrandConfig>) {
  $brandConfig.set({ ...$brandConfig.get(), ...updates });
}

export function resetConfig() {
  $brandConfig.set(initialConfig);
}
