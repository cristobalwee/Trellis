import type { BrandConfig } from '../components/BrandIntake/store';
import {
  toOklch,
  getGeneratedColor,
  generateOklchRamp,
  generateNeutralRamp,
  maxChromaForLH,
} from '../components/BrandIntake/colorGeneration';
import type { ColorMode } from '../components/BrandIntake/colorGeneration';
import type { ColorRamp, NeutralColorRamp } from '../components/Showcase/colorUtils';
import { pickStep, pickContrastingFg } from './contrastUtils';

// ---------------------------------------------------------------------------
// Lightness targets — the tunable "knobs" for semantic mapping
// ---------------------------------------------------------------------------

const LIGHTNESS_TARGETS = {
  strong:      { light: 0.50, dark: 0.55 },  // primary/accent/status filled backgrounds
  strongHover: { light: 0.43, dark: 0.62 },  // hover states
  subtle:      { light: 0.97, dark: 0.3 },  // subtle backgrounds
  fgColored:   { light: 0.42, dark: 0.65 },  // colored text on base surfaces
};

// ---------------------------------------------------------------------------
// Types for the semantic → primitive mapping (used by inspector)
// ---------------------------------------------------------------------------

export interface PrimitiveMapping {
  ramp: string | null;
  lightStep: number | null;
  darkStep: number | null;
}

export interface TokenResult {
  tokens: Record<string, string>;
  semanticMap: Record<string, PrimitiveMapping>;
}

// ---------------------------------------------------------------------------
// Preset → token value mappings
// ---------------------------------------------------------------------------

const RADIUS_PRESETS: Record<BrandConfig['roundness'], Record<string, string>> = {
  sharp: {
    '--radius-container': '0px',
    '--radius-action': '2px',
    '--radius-field': '2px',
    '--radius-subcontainer': '0px',
    '--radius-badge': '2px',
  },
  subtle: {
    '--radius-container': '8px',
    '--radius-action': '6px',
    '--radius-field': '6px',
    '--radius-subcontainer': '4px',
    '--radius-badge': '4px',
  },
  rounded: {
    '--radius-container': '16px',
    '--radius-action': '10px',
    '--radius-field': '10px',
    '--radius-subcontainer': '8px',
    '--radius-badge': '8px',
  },
  pill: {
    '--radius-container': '24px',
    '--radius-action': '999px',
    '--radius-field': '999px',
    '--radius-subcontainer': '16px',
    '--radius-badge': '999px',
  },
};

// Core primitive (dimension-100) per density — everything else scales from this.
const DIMENSION_BASE_PX: Record<BrandConfig['density'], number> = {
  compact: 6,
  default: 8,
  comfortable: 10,
};

// Derived ramp: each step is core × (step / 100).
const DIMENSION_STEPS = [0, 25, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 800, 1000] as const;

// Semantic t-shirt scale → dimension step.
const SPACING_SCALE: Record<string, number> = {
  xs: 50,
  sm: 100,
  md: 150,
  lg: 200,
  xl: 300,
  '2xl': 400,
  '3xl': 500,
  '4xl': 600,
  '5xl': 800,
  '6xl': 1000,
};

function spacingTokens(density: BrandConfig['density']): Record<string, string> {
  const base = DIMENSION_BASE_PX[density];
  const out: Record<string, string> = {};
  for (const step of DIMENSION_STEPS) {
    out[`--dimension-${step}`] = `${(base * step) / 100}px`;
  }
  for (const [name, step] of Object.entries(SPACING_SCALE)) {
    out[`--spacing-${name}`] = `var(--dimension-${step})`;
  }
  return out;
}

function shadowTokens(
  level: BrandConfig['shadows'],
  isDark: boolean
): Record<string, string> {
  const base = isDark ? '2,6,23' : '15,23,42';
  switch (level) {
    case 'none':
      return {
        '--shadow-card': 'none',
        '--shadow-elevated': 'none',
      };
    case 'subtle':
      return {
        '--shadow-card': isDark
          ? `0 1px 4px rgba(${base},0.06)`
          : `0 1px 4px rgba(${base},0.06)`,
        '--shadow-elevated': isDark
          ? `0 1px 4px rgba(${base},0.06)`
          : `0 1px 4px rgba(${base},0.06)`,
      };
    default: // elevated
      return {
        '--shadow-card': isDark
          ? `0 2px 8px rgba(${base},0.1)`
          : `0 2px 8px rgba(${base},0.1)`,
        '--shadow-elevated': isDark
          ? `0 2px 8px rgba(${base},0.1)`
          : `0 2px 8px rgba(${base},0.1)`,
      };
  }
}

function transitionTokens(
  expressiveness: BrandConfig['expressiveness']
): Record<string, string> {
  const dur =
    expressiveness === 'minimal' ? '0.15s' :
    expressiveness === 'expressive' ? '0.4s' : '0.25s';
  const interDur =
    expressiveness === 'minimal' ? '0.1s' :
    expressiveness === 'expressive' ? '0.3s' : '0.2s';

  return {
    '--transition-theme': `background-color ${dur} ease, border-color ${dur} ease, color ${dur} ease, border-radius ${dur} ease, padding ${dur} ease, gap ${dur} ease, box-shadow ${dur} ease`,
    '--transition-interactive': `all ${interDur} ease`,
    '--transition-chart': `stroke ${dur} ease, fill ${dur} ease, opacity ${dur} ease`,
  };
}

// ---------------------------------------------------------------------------
// Main token generator
// ---------------------------------------------------------------------------

export function generateDesignTokens(
  config: BrandConfig,
  isDarkMode: boolean
): TokenResult {
  const tokens: Record<string, string> = {};

  // --- Resolve colors using OKLCH pipeline ---
  const falloff = config.chromaFalloff / 100;

  const primaryOklch = toOklch(config.primaryColor);
  const primaryH = primaryOklch?.h || 0;
  const primaryL = primaryOklch?.l ?? 0.5;
  const primaryC = primaryOklch?.c ?? 0;

  // Resolve secondary color: use generation mode when not custom
  const secondaryColor =
    config.useCustomSecondary && config.secondaryColor
      ? config.secondaryColor
      : getGeneratedColor(config.primaryColor, config.secondaryGenerationMode || 'complementary');

  const secondaryOklch = toOklch(secondaryColor);
  const secondaryH = secondaryOklch?.h || 0;
  const secondaryL = secondaryOklch?.l ?? 0.5;
  const secondaryC = secondaryOklch?.c ?? 0;

  // --- Color ramps (Gaussian OKLCH) ---
  const mode: ColorMode = isDarkMode ? 'dark' : 'light';

  const primaryMaxC = maxChromaForLH(primaryL, primaryH);
  const primarySatRatio = primaryMaxC > 0 ? primaryC / primaryMaxC : 0;
  const primaryRamp = generateOklchRamp(
    primaryH, primaryC, primaryL, falloff,
    { mode, satRatio: primarySatRatio },
  );

  const secondaryMaxC = maxChromaForLH(secondaryL, secondaryH);
  const secondarySatRatio = secondaryMaxC > 0 ? secondaryC / secondaryMaxC : 0;
  const secondaryRamp = generateOklchRamp(
    secondaryH, secondaryC, secondaryL, falloff,
    { mode, satRatio: secondarySatRatio },
  );
  const neutralRamp = generateNeutralRamp(
    primaryH, config.neutralTint, primaryL, falloff,
    { mode },
  );

  // Primitive color tokens
  const ramps = { primary: primaryRamp, secondary: secondaryRamp, neutral: neutralRamp };
  for (const [name, ramp] of Object.entries(ramps)) {
    for (const [step, hex] of Object.entries(ramp)) {
      tokens[`--color-${name}-${step}`] = hex as string;
    }
  }

  // --- Status color ramps (single generation, used for both primitive + semantic) ---
  const statusMap = {
    success: config.statusColors.success,
    warning: config.statusColors.warning,
    critical: config.statusColors.error,
    info: config.statusColors.info,
  };
  const statusRampCache: Record<string, ColorRamp> = {};
  for (const [name, hex] of Object.entries(statusMap)) {
    const statusOklch = toOklch(hex);
    const ramp = generateOklchRamp(
      statusOklch?.h || 0, statusOklch?.c ?? 0, statusOklch?.l ?? 0.5, 0.8,
      { mode },
    );
    statusRampCache[name] = ramp;
    for (const [step, color] of Object.entries(ramp)) {
      tokens[`--color-${name}-${step}`] = color as string;
    }
  }

  const isDark = isDarkMode;
  const semanticMap: Record<string, PrimitiveMapping> = {};

  // --- Helpers for building semanticMap entries alongside token assignments ---

  /** Assign a token from a fixed value (not ramp-derived, or fixed ramp steps). */
  function assignFixed(
    tokenSuffix: string,
    light: string,
    dark: string,
    mapping: PrimitiveMapping,
  ) {
    tokens[`--color-${tokenSuffix}`] = isDark ? dark : light;
    semanticMap[`color-${tokenSuffix}`] = mapping;
  }

  /** Assign a token by picking the ramp step closest to a lightness target. */
  function assignPicked(
    tokenSuffix: string,
    rampName: string,
    ramp: ColorRamp,
    target: { light: number; dark: number },
  ) {
    const lightStep = pickStep(ramp, target.light);
    const darkStep = pickStep(ramp, target.dark);
    const step = isDark ? darkStep : lightStep;
    tokens[`--color-${tokenSuffix}`] = ramp[step];
    semanticMap[`color-${tokenSuffix}`] = { ramp: rampName, lightStep, darkStep };
  }

  /** Assign a foreground token by walking the ramp for WCAG AA contrast. */
  function assignContrastFg(
    tokenSuffix: string,
    bgTokenSuffix: string,
    rampName: string,
    ramp: ColorRamp,
  ) {
    const bgHex = tokens[`--color-${bgTokenSuffix}`];
    const result = pickContrastingFg(bgHex, ramp, isDark);
    tokens[`--color-${tokenSuffix}`] = result.hex;

    // Compute both light/dark steps for the inspector
    const lightBg = tokens[`--color-${bgTokenSuffix}`]; // current mode bg
    const lightResult = pickContrastingFg(lightBg, ramp, false);
    const darkResult = pickContrastingFg(lightBg, ramp, true);
    semanticMap[`color-${tokenSuffix}`] = {
      ramp: result.step !== null ? rampName : null,
      lightStep: lightResult.step,
      darkStep: darkResult.step,
    };
  }

  // =========================================================================
  // Phase A — Backgrounds & non-contrast-dependent foregrounds
  // =========================================================================

  // --- Surface backgrounds (fixed ramp steps) ---
  assignFixed('background-base', '#ffffff', neutralRamp[800],
    { ramp: 'neutral', lightStep: null, darkStep: 900 });
  assignFixed('background-sunken', neutralRamp[50], neutralRamp[900],
    { ramp: 'neutral', lightStep: 50, darkStep: 900 });
  assignFixed('background-sunkenStrong', neutralRamp[100], neutralRamp[800],
    { ramp: 'neutral', lightStep: 100, darkStep: 800 });
  assignFixed('background-raised', '#ffffff', neutralRamp[700],
    { ramp: 'neutral', lightStep: null, darkStep: 800 });
  assignFixed('background-raisedHover', neutralRamp[50], neutralRamp[600],
    { ramp: 'neutral', lightStep: 50, darkStep: 700 });
  assignFixed('background-overlay', '#ffffff', neutralRamp[800],
    { ramp: 'neutral', lightStep: null, darkStep: 800 });

  // --- Colored backgrounds ---
  // Light mode: use the raw input color as the "solid" primary/accent (Radix-style).
  // Dark mode: derive from ramp since the input is typically a light-mode color.
  if (isDark) {
    assignPicked('background-primary', 'primary', primaryRamp, LIGHTNESS_TARGETS.strong);
    assignPicked('background-accent', 'secondary', secondaryRamp, LIGHTNESS_TARGETS.strong);
  } else {
    const darkPrimaryStep = pickStep(primaryRamp, LIGHTNESS_TARGETS.strong.dark);
    tokens['--color-background-primary'] = config.primaryColor;
    semanticMap['color-background-primary'] = { ramp: null, lightStep: null, darkStep: darkPrimaryStep };

    const darkAccentStep = pickStep(secondaryRamp, LIGHTNESS_TARGETS.strong.dark);
    tokens['--color-background-accent'] = secondaryColor;
    semanticMap['color-background-accent'] = { ramp: null, lightStep: null, darkStep: darkAccentStep };
  }
  assignPicked('background-primaryHover', 'primary', primaryRamp, LIGHTNESS_TARGETS.strongHover);
  assignPicked('background-primarySubtle', 'primary', primaryRamp, LIGHTNESS_TARGETS.subtle);
  assignPicked('background-accentSubtle', 'secondary', secondaryRamp, LIGHTNESS_TARGETS.subtle);

  // Status backgrounds
  for (const [name, ramp] of Object.entries(statusRampCache)) {
    assignPicked(`background-${name}`, name, ramp, LIGHTNESS_TARGETS.strong);
    assignPicked(`background-${name}Subtle`, name, ramp, LIGHTNESS_TARGETS.subtle);
  }

  // --- Neutral foreground hierarchy (fixed ramp steps) ---
  assignFixed('foreground-onBase', neutralRamp[900], neutralRamp[50],
    { ramp: 'neutral', lightStep: 900, darkStep: 50 });
  assignFixed('foreground-onBaseMuted', neutralRamp[600], neutralRamp[200],
    { ramp: 'neutral', lightStep: 600, darkStep: 200 });
  assignFixed('foreground-onBaseFaint', neutralRamp[500], neutralRamp[300],
    { ramp: 'neutral', lightStep: 500, darkStep: 300 });
  assignFixed('foreground-onRaised', neutralRamp[900], neutralRamp[50],
    { ramp: 'neutral', lightStep: 900, darkStep: 50 });
  assignFixed('foreground-onSunken', neutralRamp[900], neutralRamp[100],
    { ramp: 'neutral', lightStep: 900, darkStep: 100 });

  // --- Colored foregrounds on base surfaces (lightness-target-based) ---
  assignPicked('foreground-primary', 'primary', primaryRamp, LIGHTNESS_TARGETS.fgColored);
  assignPicked('foreground-accent', 'secondary', secondaryRamp, LIGHTNESS_TARGETS.fgColored);
  for (const [name, ramp] of Object.entries(statusRampCache)) {
    assignPicked(`foreground-${name}`, name, ramp, LIGHTNESS_TARGETS.fgColored);
  }

  // =========================================================================
  // Phase B — Contrast-dependent foregrounds (require resolved backgrounds)
  // =========================================================================

  assignContrastFg('foreground-onPrimary', 'background-primary', 'primary', primaryRamp);
  assignContrastFg('foreground-onAccent', 'background-accent', 'secondary', secondaryRamp);

  for (const [name, ramp] of Object.entries(statusRampCache)) {
    const cap = name.charAt(0).toUpperCase() + name.slice(1);
    assignContrastFg(`foreground-on${cap}`, `background-${name}`, name, ramp);
    assignContrastFg(`foreground-on${cap}Subtle`, `background-${name}Subtle`, name, ramp);
  }

  // CTA / gradient surface (hardcoded — always on gradient backgrounds)
  assignFixed('foreground-onGradient', '#ffffff', '#ffffff',
    { ramp: null, lightStep: null, darkStep: null });
  assignFixed('foreground-onGradientMuted', 'rgba(255,255,255,0.8)', 'rgba(255,255,255,0.8)',
    { ramp: null, lightStep: null, darkStep: null });
  assignFixed('background-gradientSoft', 'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.15)',
    { ramp: null, lightStep: null, darkStep: null });

  // --- Semantic border tokens ---
  assignFixed('border-neutral',
    'rgba(15,23,42,0.08)', 'rgba(255,255,255,0.09)',
    { ramp: null, lightStep: null, darkStep: null });
  assignFixed('border-strong',
    'rgba(15,23,42,0.14)', 'rgba(255,255,255,0.14)',
    { ramp: null, lightStep: null, darkStep: null });
  if (isDark) {
    assignPicked('border-primary', 'primary', primaryRamp, LIGHTNESS_TARGETS.strong);
  } else {
    const darkBorderStep = pickStep(primaryRamp, LIGHTNESS_TARGETS.strong.dark);
    tokens['--color-border-primary'] = config.primaryColor;
    semanticMap['color-border-primary'] = { ramp: null, lightStep: null, darkStep: darkBorderStep };
  }
  assignPicked('border-accent', 'secondary', secondaryRamp, LIGHTNESS_TARGETS.strong);
  for (const [name, ramp] of Object.entries(statusRampCache)) {
    assignPicked(`border-${name}`, name, ramp, LIGHTNESS_TARGETS.strong);
  }

  // --- Chart-specific tokens ---
  assignFixed('chart-grid',
    'rgba(15,23,42,0.08)', 'rgba(241,245,249,0.07)',
    { ramp: null, lightStep: null, darkStep: null });
  // Chart colors mirror the primary background
  const bgPrimaryMapping = semanticMap['color-background-primary'];
  tokens['--color-chart-primary'] = tokens['--color-background-primary'];
  tokens['--color-chart-primaryGradientStart'] = tokens['--color-background-primary'];
  tokens['--color-chart-primaryGradientEnd'] = tokens['--color-background-primary'];
  semanticMap['color-chart-primary'] = { ...bgPrimaryMapping };
  semanticMap['color-chart-primaryGradientStart'] = { ...bgPrimaryMapping };
  semanticMap['color-chart-primaryGradientEnd'] = { ...bgPrimaryMapping };

  // --- Gradient ---
  tokens['--gradient-primary'] = `linear-gradient(135deg, ${tokens['--color-background-primary']}, ${tokens['--color-background-accent']})`;

  // --- Typography tokens ---
  tokens['--font-family-primary'] = `'${config.primaryFont}', system-ui, sans-serif`;
  tokens['--font-family-secondary'] = `'${config.headingFont}', system-ui, sans-serif`;
  tokens['--font-weight-heading'] = String(config.headingWeight);
  tokens['--font-weight-body-light'] = String(config.bodyWeights.light);
  tokens['--font-weight-body-regular'] = String(config.bodyWeights.regular);
  tokens['--font-weight-body-bold'] = String(config.bodyWeights.bold);

  // --- Radius tokens ---
  Object.assign(tokens, RADIUS_PRESETS[config.roundness]);

  // --- Spacing tokens ---
  Object.assign(tokens, spacingTokens(config.density));

  // --- Shadow tokens ---
  Object.assign(tokens, shadowTokens(config.shadows, isDark));

  // --- Transition tokens ---
  Object.assign(tokens, transitionTokens(config.expressiveness));

  return { tokens, semanticMap };
}
