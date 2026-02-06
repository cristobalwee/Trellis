import { persistentMap } from '@nanostores/persistent';

export interface ColorRamp {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  1000: string;
}

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
  neutralTint: 'pure' | 'cool' | 'warm' | 'brand-tinted';
  neutralRamp?: ColorRamp;
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
  neutralTint: 'brand-tinted',
  saturation: 100,
  uniformity: 100,
  statusColors: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  primaryFont: 'Inter',
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
