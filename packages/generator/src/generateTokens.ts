import type { BrandConfig } from './types.js';
import {
  toOklch,
  getGeneratedColor,
  generateOklchRamp,
  generateNeutralRamp,
  maxChromaForLH,
  NAMED_HUES,
} from './colorGeneration.js';
import type { ColorMode } from './colorGeneration.js';
import type { ColorRamp, NeutralColorRamp } from './colorUtils.js';
import { pickStep, pickContrastingFg } from './contrastUtils.js';
import { wcagContrast } from 'culori';

// ---------------------------------------------------------------------------
// Lightness targets — the tunable "knobs" for semantic mapping
// ---------------------------------------------------------------------------

// Targeting step 600 (~0.48 L) for filled surfaces keeps the primary/status
// backgrounds dark enough that neutral-0 foreground meets WCAG AA contrast,
// matching the sample tokens.css which uses step 600 for background-primary.
// Dark-mode `strong` targets step 400 (~0.42 L on the dark ramp) so the
// inverted neutral-0 (near-black) still passes AA against the tinted surface.
const LIGHTNESS_TARGETS = {
  strong:      { light: 0.48, dark: 0.42 },  // primary/accent/status filled backgrounds
  strongHover: { light: 0.42, dark: 0.5 },   // hover states
  subtle:      { light: 0.97, dark: 0.3 },   // subtle backgrounds
  fgColored:   { light: 0.42, dark: 0.65 },  // colored text on base surfaces
};

// ---------------------------------------------------------------------------
// Types for the semantic → primitive mapping (used by inspector)
// ---------------------------------------------------------------------------

export interface PrimitiveMapping {
  /** Hue-name of the referenced primitive ramp (e.g. 'blue', 'neutral'), or null for literal values. */
  ramp: string | null;
  /**
   * Override key consumed by `updateRampStep` when the inspector edits this token.
   * For primary/secondary/neutral this is the role name; for decoratives & status
   * it is the hue name. Null for literal-valued tokens.
   */
  role?: string | null;
  lightStep: number | null;
  darkStep: number | null;
}

export interface TokenResult {
  tokens: Record<string, string>;
  semanticMap: Record<string, PrimitiveMapping>;
  /** Step-500 representatives of the role ramps — used by UI swatches. */
  swatches: { primary: string; secondary: string; neutral: string };
}

// ---------------------------------------------------------------------------
// Hue allocation — one ramp per hue, priority-ordered
// ---------------------------------------------------------------------------

/** Lowercase hue-name identifiers emitted as color primitives. */
export const HUE_NAMES = NAMED_HUES.map((h) => h.name.toLowerCase()).concat('neutral');

/** Stable preference order for decorative hue slots. */
const DECORATIVE_HUE_PREFERENCE = ['amber', 'teal', 'indigo', 'purple', 'cyan', 'pink'];
/** How many decorative slots the generator fills (after collision pruning). */
const DECORATIVE_SLOT_COUNT = 4;

/** Return the lowercase hue name nearest to the given OKLCH hue angle. */
function hueNameFor(hue: number): string {
  const normalized = ((hue % 360) + 360) % 360;
  let best = NAMED_HUES[0];
  let bestDist = 360;
  for (const nh of NAMED_HUES) {
    const diff = Math.abs(normalized - nh.hue);
    const dist = Math.min(diff, 360 - diff);
    if (dist < bestDist) {
      bestDist = dist;
      best = nh;
    }
  }
  return best.name.toLowerCase();
}

/** Canonical OKLCH hue for a hue-name (used when seeding decorative ramps). */
function canonicalHue(name: string): number {
  const nh = NAMED_HUES.find((h) => h.name.toLowerCase() === name);
  return nh ? nh.hue : 0;
}

export interface RampAllocation {
  /** Final ramp for each emitted hue. Always includes 'neutral'. */
  byHue: Record<string, ColorRamp | NeutralColorRamp>;
  /** Role → hue assignment. Covers primary/secondary/success/warning/critical/info. */
  roleHue: Record<RampRole, string>;
  /** Hue names for decorative slots, ordered. */
  decorativeHues: string[];
}

type RampRole = 'primary' | 'secondary' | 'success' | 'warning' | 'critical' | 'info';

// ---------------------------------------------------------------------------
// Preset → token value mappings
// ---------------------------------------------------------------------------

/**
 * Radius presets — emit as `var(--dimension-...)` references so radii
 * scale with density alongside spacing.
 */
const RADIUS_PRESETS: Record<BrandConfig['roundness'], Record<string, string>> = {
  sharp: {
    'container':      'var(--dimension-0)',
    'action':         'var(--dimension-25)',
    'field':          'var(--dimension-25)',
    'subcontainer':   'var(--dimension-0)',
    'badge':          'var(--dimension-25)',
    'supercontainer': 'var(--dimension-0)',
  },
  subtle: {
    'container':      'var(--dimension-100)',
    'action':         'var(--dimension-75)',
    'field':          'var(--dimension-75)',
    'subcontainer':   'var(--dimension-50)',
    'badge':          'var(--dimension-50)',
    'supercontainer': 'var(--dimension-150)',
  },
  rounded: {
    'container':      'var(--dimension-200)',
    'action':         'var(--dimension-125)',
    'field':          'var(--dimension-125)',
    'subcontainer':   'var(--dimension-100)',
    'badge':          'var(--dimension-100)',
    'supercontainer': 'var(--dimension-300)',
  },
  pill: {
    'container':      'var(--dimension-300)',
    'action':         'var(--dimension-max)',
    'field':          'var(--dimension-max)',
    'subcontainer':   'var(--dimension-200)',
    'badge':          'var(--dimension-max)',
    'supercontainer': 'var(--dimension-400)',
  },
};

/** Core primitive (dimension-100) per density. */
const DIMENSION_BASE_PX: Record<BrandConfig['density'], number> = {
  compact: 6,
  default: 8,
  comfortable: 10,
};

/** Dimension step ladder — matches the shape of the sample tokens.css. */
const DIMENSION_STEPS = [
  0, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 500, 600, 800, 1000,
] as const;

/** Semantic t-shirt scale → dimension step. */
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

// ---------------------------------------------------------------------------
// Typography ladder (mirrors tokens.css primitive tier)
// ---------------------------------------------------------------------------

/** px values for typography-size-<step>. */
const TYPOGRAPHY_SIZE_STEPS: Record<number, number> = {
  100: 8,
  125: 10,
  150: 12,
  175: 14,
  200: 16,
  225: 18,
  250: 20,
  300: 24,
  350: 28,
  400: 32,
  500: 40,
  600: 48,
  800: 64,
};

/** Heading size ladder (semantic → primitive step). */
const HEADING_SIZE_STEPS: Record<string, number> = {
  xs: 200,
  sm: 225,
  md: 300,
  lg: 350,
  xl: 400,
  '2xl': 500,
  '3xl': 600,
  '4xl': 800,
};

/** Body size ladder (semantic → primitive step). */
const BODY_SIZE_STEPS: Record<string, number> = {
  '2xs': 125,
  xs: 150,
  sm: 175,
  md: 200,
  lg: 225,
};

/**
 * Action / field size ladder (semantic → primitive step).
 *
 * Each text size pairs with an icon-only button one step up the icon ladder:
 *   xs → 12px text + 14px icon
 *   sm → 14px text + 16px icon
 *   md → 16px text + 20px icon
 *   lg → 18px text + 24px icon
 * The per-size line-heights in `fontSemantics` are set to the matching icon
 * height so text buttons and icon buttons have identical outer heights.
 */
const ACTION_SIZE_STEPS: Record<string, number> = {
  xs: 150, // 12px
  sm: 175, // 14px
  md: 200, // 16px
  lg: 225, // 18px
};

// ---------------------------------------------------------------------------
// Non-color token builders
// ---------------------------------------------------------------------------

function dimensionPrimitives(density: BrandConfig['density']): Record<string, string> {
  const base = DIMENSION_BASE_PX[density];
  const out: Record<string, string> = {};
  for (const step of DIMENSION_STEPS) {
    out[`--dimension-${step}`] = `${(base * step) / 100}px`;
  }
  out['--dimension-max'] = '999px';
  return out;
}

function spaceSemantics(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, step] of Object.entries(SPACING_SCALE)) {
    out[`--space-${name}`] = `var(--dimension-${step})`;
  }
  return out;
}

function shapeTokens(roundness: BrandConfig['roundness']): Record<string, string> {
  const out: Record<string, string> = {
    '--shape-border-thin':    '0.5px',
    '--shape-border-regular': '1px',
    '--shape-border-thick':   '2px',
    '--shape-ringOffset':     'var(--dimension-25)',
    '--shape-radius-max':     'var(--dimension-max)',
  };
  for (const [key, value] of Object.entries(RADIUS_PRESETS[roundness])) {
    out[`--shape-radius-${key}`] = value;
  }
  return out;
}

function typographyPrimitives(config: BrandConfig): Record<string, string> {
  const out: Record<string, string> = {
    '--typography-font-family-body':    `'${config.primaryFont}', system-ui, -apple-system, sans-serif`,
    '--typography-font-family-heading': `'${config.headingFont}', system-ui, -apple-system, sans-serif`,
  };
  for (const [step, px] of Object.entries(TYPOGRAPHY_SIZE_STEPS)) {
    out[`--typography-size-${step}`] = `${px}px`;
  }
  // Weight primitives — include whatever the config actually uses.
  const weights = new Set<number>([
    config.headingWeight,
    config.bodyWeights.light,
    config.bodyWeights.regular,
    config.bodyWeights.bold,
    400, 500, 600,
  ]);
  for (const w of Array.from(weights).sort((a, b) => a - b)) {
    out[`--typography-weight-${w}`] = String(w);
  }
  return out;
}

function fontSemantics(config: BrandConfig): Record<string, string> {
  const out: Record<string, string> = {
    // Heading
    '--font-heading-family':       'var(--typography-font-family-heading)',
    '--font-heading-weight':       `var(--typography-weight-${config.headingWeight})`,
    '--font-heading-lineheight':   '125%',
    // Body
    '--font-body-family':          'var(--typography-font-family-body)',
    '--font-body-weight-light':    `var(--typography-weight-${config.bodyWeights.light})`,
    '--font-body-weight-regular':  `var(--typography-weight-${config.bodyWeights.regular})`,
    '--font-body-weight-medium':   `var(--typography-weight-${Math.min(600, Math.max(500, config.bodyWeights.regular))})`,
    '--font-body-weight-bold':     `var(--typography-weight-${config.bodyWeights.bold})`,
    '--font-body-lineheight':      '150%',
    // Action
    // Line-heights are sized to match icon-only buttons at the same t-shirt
    // size, so text buttons and icon buttons have identical outer heights:
    //   xs → 12px text + 14px icon (14/12 → calc(140% / 120%))
    //   sm → 14px text + 16px icon (16/14 → calc(160% / 140%))
    //   md → 16px text + 20px icon (20/16 = 125%)
    //   lg → 18px text + 24px icon (24/18 → calc(240% / 180%))
    '--font-action-family':        'var(--typography-font-family-body)',
    '--font-action-weight':        'var(--typography-weight-500)',
    '--font-action-xs-lineheight': 'calc(140% / 120%)',
    '--font-action-sm-lineheight': 'calc(160% / 140%)',
    '--font-action-md-lineheight': '125%',
    '--font-action-lg-lineheight': 'calc(240% / 180%)',
    // Field — mirrors action so inputs and buttons line up at every size.
    '--font-field-family':         'var(--typography-font-family-body)',
    '--font-field-weight':         `var(--typography-weight-${config.bodyWeights.regular})`,
    '--font-field-xs-lineheight':  'calc(140% / 120%)',
    '--font-field-sm-lineheight':  'calc(160% / 140%)',
    '--font-field-md-lineheight':  '125%',
    '--font-field-lg-lineheight':  'calc(240% / 180%)',
  };
  for (const [name, step] of Object.entries(HEADING_SIZE_STEPS)) {
    out[`--font-heading-${name}-size`] = `var(--typography-size-${step})`;
  }
  for (const [name, step] of Object.entries(BODY_SIZE_STEPS)) {
    out[`--font-body-${name}-size`] = `var(--typography-size-${step})`;
  }
  for (const [name, step] of Object.entries(ACTION_SIZE_STEPS)) {
    out[`--font-action-${name}-size`] = `var(--typography-size-${step})`;
    out[`--font-field-${name}-size`] = `var(--typography-size-${step})`;
  }
  return out;
}

// Elevation system
// ----------------
// Four conceptual elevation tiers exist regardless of the configured level:
//   sunken  — recessed gutter surfaces (never casts a shadow)
//   base    — the default page surface (never casts a shadow)
//   raised  — cards, panels, inset surfaces lifted above base
//   overlay — modals, popovers, menus floating above the page
// Only `raised` and `overlay` emit visible shadow tokens.
function shadowTokens(
  level: BrandConfig['shadows'],
  isDark: boolean,
): Record<string, string> {
  const base = isDark ? '0,0,0' : '15,23,42';
  switch (level) {
    case 'none':
      return {
        '--shadow-raised': 'none',
        '--shadow-overlay': isDark
          ? `0 2px 6px rgba(${base},0.25), 0 1px 2px rgba(${base},0.18)`
          : `0 2px 6px rgba(${base},0.05), 0 1px 2px rgba(${base},0.03)`,
      };
    case 'dramatic':
      return {
        '--shadow-raised': isDark
          ? `0 2px 6px rgba(${base},0.08)`
          : `0 2px 6px rgba(${base},0.06)`,
        '--shadow-overlay': isDark
          ? `0 20px 40px rgba(${base},0.55), 0 8px 16px rgba(${base},0.35)`
          : `0 20px 40px rgba(${base},0.18), 0 8px 16px rgba(${base},0.1)`,
      };
    default:
      return {
        '--shadow-raised': isDark
          ? `0 1px 3px rgba(${base},0.1)`
          : `0 1px 3px rgba(${base},0.06)`,
        '--shadow-overlay': isDark
          ? `0 10px 25px rgba(${base},0.45), 0 4px 10px rgba(${base},0.25)`
          : `0 10px 25px rgba(${base},0.1), 0 4px 10px rgba(${base},0.06)`,
      };
  }
}

function stateTokens(): Record<string, string> {
  return {
    '--state-opacity-active':   '0.24',
    '--state-opacity-disabled': '0.4',
    '--state-opacity-hover':    '0.12',
  };
}

function transitionTokens(
  expressiveness: BrandConfig['expressiveness'],
): Record<string, string> {
  const swift =
    expressiveness === 'minimal' ? '100ms' :
    expressiveness === 'expressive' ? '250ms' : '150ms';
  const gradual =
    expressiveness === 'minimal' ? '250ms' :
    expressiveness === 'expressive' ? '500ms' : '350ms';

  const out: Record<string, string> = {
    // Primitives
    '--transition-swift-duration':   swift,
    '--transition-swift-easing':     'cubic-bezier(0.22, 0.61, 0.36, 1)',
    '--transition-gradual-duration': gradual,
    '--transition-gradual-easing':   'cubic-bezier(0.65, 0.05, 0.36, 1)',
  };

  // Consumer-facing composite aliases — a minor deviation from tokens.css to
  // preserve the single-var shorthand used by ComponentSampler/PlaygroundDashboard.
  const themeProps = [
    'background-color', 'border-color', 'color', 'border-radius',
    'padding', 'gap', 'box-shadow',
  ];
  out['--transition-theme'] = themeProps
    .map((p) => `${p} var(--transition-gradual-duration) var(--transition-gradual-easing)`)
    .join(', ');
  out['--transition-interactive'] = 'all var(--transition-swift-duration) var(--transition-swift-easing)';
  out['--transition-chart'] = [
    'stroke var(--transition-gradual-duration) var(--transition-gradual-easing)',
    'fill var(--transition-gradual-duration) var(--transition-gradual-easing)',
    'opacity var(--transition-gradual-duration) var(--transition-gradual-easing)',
  ].join(', ');

  return out;
}

// ---------------------------------------------------------------------------
// Ramp allocation
// ---------------------------------------------------------------------------

/** Merge user per-step overrides into a generated ramp (immutably). */
function applyRampOverrides<T extends ColorRamp | NeutralColorRamp>(
  ramp: T,
  overrides: Partial<ColorRamp> | undefined,
): T {
  if (!overrides) return ramp;
  const out = { ...ramp } as Record<string | number, string>;
  for (const [step, value] of Object.entries(overrides)) {
    if (value) out[step] = value;
  }
  return out as unknown as T;
}

function allocateRamps(config: BrandConfig, isDark: boolean): RampAllocation {
  const mode: ColorMode = isDark ? 'dark' : 'light';
  const falloff = config.chromaFalloff / 100;
  const overrides = config.rampOverrides;

  // --- Primary ---
  const primaryOklch = toOklch(config.primaryColor);
  const primaryH = primaryOklch?.h || 0;
  const primaryL = primaryOklch?.l ?? 0.5;
  const primaryC = primaryOklch?.c ?? 0;
  const primaryMaxC = maxChromaForLH(primaryL, primaryH);
  const primarySatRatio = primaryMaxC > 0 ? primaryC / primaryMaxC : 0;
  const primaryRamp = applyRampOverrides(
    generateOklchRamp(
      primaryH, primaryC, primaryL, falloff,
      { mode, satRatio: primarySatRatio },
    ),
    overrides.primary,
  );
  const primaryHue = hueNameFor(primaryH);

  // --- Secondary ---
  const secondaryColor =
    config.useCustomSecondary && config.secondaryColor
      ? config.secondaryColor
      : getGeneratedColor(config.primaryColor, config.secondaryGenerationMode || 'complementary');
  const secondaryOklch = toOklch(secondaryColor);
  const secondaryH = secondaryOklch?.h || 0;
  const secondaryL = secondaryOklch?.l ?? 0.5;
  const secondaryC = secondaryOklch?.c ?? 0;
  const secondaryMaxC = maxChromaForLH(secondaryL, secondaryH);
  const secondarySatRatio = secondaryMaxC > 0 ? secondaryC / secondaryMaxC : 0;
  const secondaryRamp = applyRampOverrides(
    generateOklchRamp(
      secondaryH, secondaryC, secondaryL, falloff,
      { mode, satRatio: secondarySatRatio },
    ),
    overrides.secondary,
  );
  const secondaryHue = hueNameFor(secondaryH);

  // --- Neutral ---
  const neutralRamp = applyRampOverrides(
    generateNeutralRamp(
      primaryH, config.neutralTint, primaryL, falloff,
      { mode },
    ),
    overrides.neutral as Partial<ColorRamp> | undefined,
  );

  // --- Status colors ---
  const statusInput: Record<RampRole, string> = {
    primary: config.primaryColor,
    secondary: secondaryColor,
    success: config.statusColors.success,
    warning: config.statusColors.warning,
    critical: config.statusColors.error,
    info: config.statusColors.info,
  };

  const byHue: Record<string, ColorRamp | NeutralColorRamp> = {
    neutral: neutralRamp,
  };
  const roleHue: Record<RampRole, string> = {
    primary: primaryHue,
    secondary: secondaryHue,
    success: 'green',
    warning: 'yellow',
    critical: 'red',
    info: 'blue',
  };

  // Priority-order assignment: primary wins collisions, then secondary, then status.
  const PRIORITY: RampRole[] = ['primary', 'secondary', 'success', 'warning', 'critical', 'info'];

  for (const role of PRIORITY) {
    const hex = statusInput[role];
    const oklch = toOklch(hex);
    const h = oklch?.h || 0;
    const l = oklch?.l ?? 0.5;
    const c = oklch?.c ?? 0;
    const hueName = hueNameFor(h);
    roleHue[role] = hueName;

    // Skip emission if a higher-priority role already occupies this hue slot.
    if (byHue[hueName]) continue;

    // Primary/secondary use the configured falloff for soft ramps; status uses 0.8.
    const sigma = role === 'primary' || role === 'secondary' ? falloff : 0.8;
    const maxC = maxChromaForLH(l, h);
    const satRatio = maxC > 0 ? c / maxC : 0;
    const rawRamp =
      role === 'primary'    ? primaryRamp :
      role === 'secondary'  ? secondaryRamp :
      generateOklchRamp(h, c, l, sigma, { mode, satRatio });

    byHue[hueName] = applyRampOverrides(rawRamp, overrides[role]);
  }

  // --- Decoratives: pick hues not already occupied ---
  const decorativeHues: string[] = [];
  for (const candidate of DECORATIVE_HUE_PREFERENCE) {
    if (decorativeHues.length >= DECORATIVE_SLOT_COUNT) break;
    if (byHue[candidate]) continue;
    decorativeHues.push(candidate);
    const h = canonicalHue(candidate);
    const peakL = isDark ? 0.65 : 0.60;
    const hueMaxC = maxChromaForLH(peakL, h);
    const c = hueMaxC * 0.8;
    const rawRamp = generateOklchRamp(h, c, peakL, 0.8, { mode, satRatio: 0.8 });
    byHue[candidate] = applyRampOverrides(rawRamp, overrides[candidate]);
  }

  return { byHue, roleHue, decorativeHues };
}

// ---------------------------------------------------------------------------
// Main token generator
// ---------------------------------------------------------------------------

export function generateDesignTokens(
  config: BrandConfig,
  isDarkMode: boolean,
): TokenResult {
  const tokens: Record<string, string> = {};
  const semanticMap: Record<string, PrimitiveMapping> = {};
  const isDark = isDarkMode;

  const allocation = allocateRamps(config, isDark);
  const { byHue, roleHue, decorativeHues } = allocation;

  // =========================================================================
  // Primitive color tokens — emit one ramp per hue
  // =========================================================================

  /** Reverse lookup: hue name → override role (for inspector). */
  function overrideRoleFor(hue: string): string {
    if (hue === 'neutral') return 'neutral';
    if (roleHue.primary === hue) return 'primary';
    if (roleHue.secondary === hue) return 'secondary';
    // Status roles — if the hue matches one, use the status role name as the
    // override key. Otherwise, decorative/hue-named overrides use the hue itself.
    if (roleHue.success === hue) return 'success';
    if (roleHue.warning === hue) return 'warning';
    if (roleHue.critical === hue) return 'critical';
    if (roleHue.info === hue) return 'info';
    return hue;
  }

  // The legacy neutral ramp uses `1050` as its near-black / near-white endpoint;
  // tokens.css names that step `1000` instead. Keep the internal ramp identifier
  // for compatibility with ColorRampView etc., but emit the canonical name.
  const emittedStep = (step: string) => (step === '1050' ? '1000' : step);

  for (const [hue, ramp] of Object.entries(byHue)) {
    const role = overrideRoleFor(hue);
    for (const [step, hex] of Object.entries(ramp)) {
      const out = emittedStep(step);
      const tokenName = `color-${hue}-${out}`;
      tokens[`--${tokenName}`] = hex as string;
      semanticMap[tokenName] = {
        ramp: hue,
        role,
        lightStep: Number(step),
        darkStep: Number(step),
      };
    }
  }

  // =========================================================================
  // Semantic color helpers — every write emits `var(--color-<hue>-<step>)`
  // =========================================================================

  /** Emit a token that references a primitive at a fixed step. */
  function assignPrimitiveRef(
    tokenSuffix: string,
    hue: string,
    step: number,
  ) {
    tokens[`--color-${tokenSuffix}`] = `var(--color-${hue}-${step})`;
    semanticMap[`color-${tokenSuffix}`] = {
      ramp: hue,
      role: overrideRoleFor(hue),
      lightStep: step,
      darkStep: step,
    };
  }

  /** Emit a token that picks the ramp step closest to a per-mode lightness target. */
  function assignPicked(
    tokenSuffix: string,
    hue: string,
    target: { light: number; dark: number },
  ) {
    const ramp = byHue[hue] as ColorRamp;
    const lightStep = pickStep(ramp, target.light);
    const darkStep = pickStep(ramp, target.dark);
    const step = isDark ? darkStep : lightStep;
    tokens[`--color-${tokenSuffix}`] = `var(--color-${hue}-${step})`;
    semanticMap[`color-${tokenSuffix}`] = {
      ramp: hue,
      role: overrideRoleFor(hue),
      lightStep,
      darkStep,
    };
  }

  /**
   * Emit a foreground token chosen to meet WCAG AA contrast with its background.
   * Walks the ramp from the perceptual extreme inward until a passing step is found.
   */
  function assignContrastFg(
    tokenSuffix: string,
    bgTokenSuffix: string,
    hue: string,
  ) {
    const ramp = byHue[hue] as ColorRamp;
    // Resolve the background to a concrete hex via the emitted primitive tokens.
    const bgValue = tokens[`--color-${bgTokenSuffix}`];
    const bgHex = resolveToHex(bgValue, tokens);

    const result = pickContrastingFg(bgHex, ramp, isDark);
    const step = result.step;
    if (step === null) {
      // No ramp step passes — fall back to pure white/black literal.
      tokens[`--color-${tokenSuffix}`] = result.hex;
      semanticMap[`color-${tokenSuffix}`] = { ramp: null, role: null, lightStep: null, darkStep: null };
      return;
    }
    tokens[`--color-${tokenSuffix}`] = `var(--color-${hue}-${step})`;

    // Compute the opposite-mode step for the inspector.
    // We re-run the picker against the light/dark equivalents of the same bg token.
    const lightResult = pickContrastingFg(bgHex, ramp, false);
    const darkResult = pickContrastingFg(bgHex, ramp, true);
    semanticMap[`color-${tokenSuffix}`] = {
      ramp: hue,
      role: overrideRoleFor(hue),
      lightStep: lightResult.step,
      darkStep: darkResult.step,
    };
  }

  /**
   * Pick between `--color-neutral-0` and `--color-neutral-1000` based on
   * which has higher WCAG contrast against the resolved background hex.
   *
   * Used for foregrounds on solid, fully-saturated surfaces (e.g. `onPrimary`,
   * `onSuccess`) where a same-hue ramp step rarely reads well and the sample
   * `tokens.css` consistently uses a neutral extreme.
   */
  function assignNeutralContrastFg(tokenSuffix: string, bgTokenSuffix: string) {
    const bgValue = tokens[`--color-${bgTokenSuffix}`];
    const bgHex = resolveToHex(bgValue, tokens);

    const neutral = byHue.neutral as NeutralColorRamp;
    const lightEnd = neutral[0];
    const darkEnd  = neutral[1050];

    // For each mode, pick whichever neutral extreme has better contrast.
    // Uses the resolved bg for the *current* mode; for the opposite-mode step
    // we recompute against the same bg hex since the emitted token is a
    // `var(--color-neutral-*)` reference — the dark-mode primitive override
    // flips the actual hex anyway.
    const pickNeutralStep = (bg: string): 0 | 1000 =>
      wcagContrast(bg, lightEnd) >= wcagContrast(bg, darkEnd) ? 0 : 1000;

    const step = pickNeutralStep(bgHex);
    tokens[`--color-${tokenSuffix}`] = `var(--color-neutral-${step})`;

    semanticMap[`color-${tokenSuffix}`] = {
      ramp: 'neutral',
      role: overrideRoleFor('neutral'),
      // Both modes reference the same semantic neutral step — the primitive
      // itself inverts across themes, so `onPrimary` stays legible.
      lightStep: step,
      darkStep: step,
    };
  }

  /** Emit a literal (non-primitive) value; records null mapping for the inspector. */
  function assignLiteral(tokenSuffix: string, light: string, dark: string) {
    tokens[`--color-${tokenSuffix}`] = isDark ? dark : light;
    semanticMap[`color-${tokenSuffix}`] = { ramp: null, role: null, lightStep: null, darkStep: null };
  }

  // =========================================================================
  // Semantic background tokens
  // =========================================================================

  // Neutral surfaces — step-based references for both modes.
  if (isDark) {
    assignPrimitiveRef('background-base',        'neutral', 800);
    assignPrimitiveRef('background-sunken',      'neutral', 900);
    assignPrimitiveRef('background-sunkenStrong','neutral', 1000);
    assignPrimitiveRef('background-raised',      'neutral', 700);
    assignPrimitiveRef('background-raisedHover', 'neutral', 600);
    assignPrimitiveRef('background-overlay',     'neutral', 700);
  } else {
    assignPrimitiveRef('background-base',        'neutral', 0);
    assignPrimitiveRef('background-sunken',      'neutral', 50);
    assignPrimitiveRef('background-sunkenStrong','neutral', 100);
    assignPrimitiveRef('background-raised',      'neutral', 0);
    assignPrimitiveRef('background-raisedHover', 'neutral', 50);
    assignPrimitiveRef('background-overlay',     'neutral', 0);
  }

  // Brand / accent backgrounds
  assignPicked('background-primary',        roleHue.primary,   LIGHTNESS_TARGETS.strong);
  assignPicked('background-primaryHover',   roleHue.primary,   LIGHTNESS_TARGETS.strongHover);
  assignPicked('background-primarySubtle',  roleHue.primary,   LIGHTNESS_TARGETS.subtle);
  assignPicked('background-accent',         roleHue.secondary, LIGHTNESS_TARGETS.strong);
  assignPicked('background-accentSubtle',   roleHue.secondary, LIGHTNESS_TARGETS.subtle);

  // Status backgrounds
  for (const role of ['success', 'warning', 'critical', 'info'] as const) {
    const hue = roleHue[role];
    assignPicked(`background-${role}`,        hue, LIGHTNESS_TARGETS.strong);
    assignPicked(`background-${role}Subtle`,  hue, LIGHTNESS_TARGETS.subtle);
  }

  // Decorative backgrounds + borders
  for (const hue of decorativeHues) {
    assignPicked(`background-decorative-${hue}`,       hue, LIGHTNESS_TARGETS.strong);
    assignPicked(`background-decorative-${hue}Subtle`, hue, LIGHTNESS_TARGETS.subtle);
    assignPicked(`border-decorative-${hue}`,           hue, LIGHTNESS_TARGETS.strong);
  }

  // =========================================================================
  // Foreground tokens (neutral hierarchy + colored + contrast-dependent)
  // =========================================================================

  if (isDark) {
    assignPrimitiveRef('foreground-onBase',       'neutral', 50);
    assignPrimitiveRef('foreground-onBaseMuted',  'neutral', 200);
    assignPrimitiveRef('foreground-onBaseFaint',  'neutral', 300);
    assignPrimitiveRef('foreground-onRaised',     'neutral', 50);
    assignPrimitiveRef('foreground-onSunken',     'neutral', 100);
  } else {
    assignPrimitiveRef('foreground-onBase',       'neutral', 900);
    assignPrimitiveRef('foreground-onBaseMuted',  'neutral', 600);
    assignPrimitiveRef('foreground-onBaseFaint',  'neutral', 500);
    assignPrimitiveRef('foreground-onRaised',     'neutral', 900);
    assignPrimitiveRef('foreground-onSunken',     'neutral', 900);
  }

  // Colored foregrounds on base surfaces
  assignPicked('foreground-primary', roleHue.primary,   LIGHTNESS_TARGETS.fgColored);
  assignPicked('foreground-accent',  roleHue.secondary, LIGHTNESS_TARGETS.fgColored);
  for (const role of ['success', 'warning', 'critical', 'info'] as const) {
    assignPicked(`foreground-${role}`, roleHue[role], LIGHTNESS_TARGETS.fgColored);
  }
  for (const hue of decorativeHues) {
    assignPicked(`foreground-decorative-${hue}`, hue, LIGHTNESS_TARGETS.fgColored);
  }

  // Contrast-dependent foregrounds — solid (fully-saturated) backgrounds snap
  // to a neutral extreme (neutral-0 / neutral-1000) for maximum legibility.
  assignNeutralContrastFg('foreground-onPrimary', 'background-primary');
  assignNeutralContrastFg('foreground-onAccent',  'background-accent');
  for (const role of ['success', 'warning', 'critical', 'info'] as const) {
    const cap = role.charAt(0).toUpperCase() + role.slice(1);
    assignNeutralContrastFg(`foreground-on${cap}`, `background-${role}`);
  }
  for (const hue of decorativeHues) {
    const cap = hue.charAt(0).toUpperCase() + hue.slice(1);
    assignNeutralContrastFg(`foreground-decorative-on${cap}`, `background-decorative-${hue}`);
  }

  // Subtle tinted backgrounds read best with a dark step of the same hue —
  // matches the sample tokens.css pattern (e.g. `onPrimarySubtle` → blue-700).
  assignContrastFg('foreground-onPrimarySubtle', 'background-primarySubtle', roleHue.primary);
  assignContrastFg('foreground-onAccentSubtle',  'background-accentSubtle',  roleHue.secondary);
  for (const role of ['success', 'warning', 'critical', 'info'] as const) {
    const cap = role.charAt(0).toUpperCase() + role.slice(1);
    assignContrastFg(`foreground-on${cap}Subtle`, `background-${role}Subtle`, roleHue[role]);
  }
  for (const hue of decorativeHues) {
    const cap = hue.charAt(0).toUpperCase() + hue.slice(1);
    assignContrastFg(`foreground-decorative-on${cap}Subtle`, `background-decorative-${hue}Subtle`, hue);
  }

  // CTA / gradient surface (hardcoded — always on gradient backgrounds)
  assignLiteral('foreground-onGradient',       '#ffffff',                '#ffffff');
  assignLiteral('foreground-onGradientMuted',  'rgba(255,255,255,0.8)',  'rgba(255,255,255,0.8)');
  assignLiteral('background-gradientSoft',     'rgba(255,255,255,0.15)', 'rgba(255,255,255,0.15)');

  // =========================================================================
  // Semantic border tokens
  // =========================================================================

  assignLiteral('border-neutral',
    'rgba(15,23,42,0.08)', 'rgba(255,255,255,0.09)');
  assignLiteral('border-strong',
    'rgba(15,23,42,0.14)', 'rgba(255,255,255,0.14)');
  assignPicked('border-primary', roleHue.primary,   LIGHTNESS_TARGETS.strong);
  assignPicked('border-accent',  roleHue.secondary, LIGHTNESS_TARGETS.strong);
  for (const role of ['success', 'warning', 'critical', 'info'] as const) {
    assignPicked(`border-${role}`, roleHue[role], LIGHTNESS_TARGETS.strong);
  }

  // =========================================================================
  // Chart tokens
  // =========================================================================

  assignLiteral('chart-grid',
    'rgba(15,23,42,0.08)', 'rgba(241,245,249,0.07)');
  const bgPrimaryMapping = semanticMap['color-background-primary'];
  tokens['--color-chart-primary'] = tokens['--color-background-primary'];
  tokens['--color-chart-primaryGradientStart'] = tokens['--color-background-primary'];
  tokens['--color-chart-primaryGradientEnd']   = tokens['--color-background-primary'];
  semanticMap['color-chart-primary']              = { ...bgPrimaryMapping };
  semanticMap['color-chart-primaryGradientStart'] = { ...bgPrimaryMapping };
  semanticMap['color-chart-primaryGradientEnd']   = { ...bgPrimaryMapping };

  // =========================================================================
  // Gradient
  // =========================================================================

  tokens['--gradient-primary'] = `linear-gradient(135deg, var(--color-background-primary), var(--color-background-accent))`;

  // =========================================================================
  // Non-color tokens
  // =========================================================================

  Object.assign(tokens, dimensionPrimitives(config.density));
  Object.assign(tokens, typographyPrimitives(config));
  Object.assign(tokens, spaceSemantics());
  Object.assign(tokens, shapeTokens(config.roundness));
  Object.assign(tokens, fontSemantics(config));
  Object.assign(tokens, shadowTokens(config.shadows, isDark));
  Object.assign(tokens, stateTokens());
  Object.assign(tokens, transitionTokens(config.expressiveness));

  const swatches = {
    primary:   (byHue[roleHue.primary] as ColorRamp)[500],
    secondary: (byHue[roleHue.secondary] as ColorRamp)[500],
    neutral:   (byHue.neutral as ColorRamp)[500],
  };

  return { tokens, semanticMap, swatches };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a token value to a concrete hex — follows a single level of
 * `var(--color-...)` indirection. Used by the contrast walker since it needs
 * a real color to measure against.
 */
function resolveToHex(value: string, tokens: Record<string, string>): string {
  const m = value.match(/^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/);
  if (!m) return value;
  const referenced = tokens[m[1]];
  if (!referenced) return value;
  // Only one hop — primitives are always literal hex.
  return referenced;
}
