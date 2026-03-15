export interface PlaygroundConfig {
  primaryColor: string;
  secondaryColor: string;
  saturation: number;
  lightness: number;
  fontFamily: string;
  roundness: 'sharp' | 'rounded' | 'pill';
  density: 'compact' | 'default' | 'comfortable';
  expressiveness: 'minimal' | 'balanced' | 'expressive';
  shadows?: 'flat' | 'subtle' | 'elevated' | 'dramatic';
  isDarkMode: boolean;
}

export interface LivePlaygroundProps {
  config: PlaygroundConfig;
  onChange: (updates: Partial<PlaygroundConfig>) => void;
  compact?: boolean;
  showExternalDarkModeToggle?: boolean;
  collapsibleControls?: boolean;
  defaultControlsOpen?: boolean;
}

export const DEFAULT_PLAYGROUND_CONFIG: PlaygroundConfig = {
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

export const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito Sans',
  'Source Sans 3',
  'Work Sans',
  'DM Sans',
  'Plus Jakarta Sans',
  'Manrope',
  'Space Grotesk',
  'IBM Plex Sans',
] as const;
