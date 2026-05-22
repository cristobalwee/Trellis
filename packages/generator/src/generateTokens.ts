import type { BrandConfig } from './types.js';
import {
  toOklch,
  getGeneratedColor,
  generateOklchRamp,
  generateNeutralRamp,
  maxChromaForLH,
  clampPrimaryForContrast,
  NAMED_HUES,
} from './colorGeneration.js';
import type { ColorMode, PrimaryContrastClampResult } from './colorGeneration.js';
import { STEPS, flipRamp, type ColorRamp, type NeutralColorRamp } from './colorUtils.js';
import { pickStep } from './contrastUtils.js';
import { wcagContrast } from 'culori';

// ---------------------------------------------------------------------------
// Lightness targets — the tunable "knobs" for semantic mapping
// ---------------------------------------------------------------------------

// Most targets are mode-independent: a semantic token picks one ramp step (by
// lightness on the light-mode ramp) and dark mode is handled by flipping the
// chromatic primitive ramps. `strong` is the exception — a flipped filled
// surface lands mid-tone, too close to both neutral extremes to clear WCAG AA
// for its `on*` foreground, so it keeps a per-mode target: the dark surface is
// nudged lighter so dark text on it stays legible.
const LIGHTNESS_TARGETS = {
  strong:      { light: 0.48, dark: 0.66 },  // primary/accent/status filled backgrounds
  strongHover: 0.42,                         // hover states
  subtle:      0.97,                         // subtle backgrounds
  fgColored:   0.42,                         // colored text on base surfaces
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
  /**
   * Routing sentinel for inspector edits. When set to 'primaryColor', editing
   * this token writes the new hex back to `config.primaryColor` rather than
   * `rampOverrides`. Used by the saturated-primary tokens that resolve to the
   * exact-input primitive `--color-primary-base` (and its hover derivative).
   */
  target?: 'primaryColor';
}

export interface TokenResult {
  tokens: Record<string, string>;
  semanticMap: Record<string, PrimitiveMapping>;
  /** Step-500 representatives of the role ramps — used by UI swatches. */
  swatches: { primary: string; secondary: string; neutral: string };
  /**
   * Populated when the input primary color failed the contrast guardrail
   * against the current mode's base background and was nudged toward
   * readability. Undefined when no adjustment was needed.
   */
  primaryAdjustment?: PrimaryContrastClampResult;
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

// `red`/`yellow`/`green` are reserved for the status roles (critical/warning/
// success). When bucketing a *brand* input (primary/secondary) they only count
// as a match within this tight tolerance — so an orange-red primary snaps to
// `orange`, leaving `red` free for `critical` instead of greedily swallowing it.
const RESERVED_SEMANTIC_HUES = new Set(['red', 'yellow', 'green']);
const RESERVED_HUE_TOLERANCE = 10; // degrees

/**
 * Like `hueNameFor`, but for brand roles: the reserved status hues only win
 * when the input is genuinely close to them, so they stay available for the
 * status roles that semantically need them.
 */
function hueNameForRole(hue: number): string {
  const normalized = ((hue % 360) + 360) % 360;
  let best = NAMED_HUES[0];
  let bestDist = 360;
  for (const nh of NAMED_HUES) {
    const diff = Math.abs(normalized - nh.hue);
    const dist = Math.min(diff, 360 - diff);
    if (RESERVED_SEMANTIC_HUES.has(nh.name.toLowerCase()) && dist > RESERVED_HUE_TOLERANCE) {
      continue; // reserved hue too far — let a non-semantic neighbour take it
    }
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
  /** Light-mode ramps (overrides applied). Used for mode-stable step picking. */
  byHueLight: Record<string, ColorRamp | NeutralColorRamp>;
  /**
   * Dark-mode ramps (overrides applied). Chromatic ramps are flipped so the
   * darkest shade sits on step 50; the neutral ramp keeps its natural ordering.
   */
  byHueDark: Record<string, ColorRamp | NeutralColorRamp>;
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

// Shared alpha scale for interaction states. Consumed both by the raw
// `--state-opacity-*` primitives and by the interactive scrim tokens below, so
// the hover/active overlay opacity stays in lockstep with the primitive scale.
const STATE_OPACITY = {
  active:   0.24,
  disabled: 0.4,
  hover:    0.12,
} as const;

function stateTokens(): Record<string, string> {
  return {
    '--state-opacity-active':   String(STATE_OPACITY.active),
    '--state-opacity-disabled': String(STATE_OPACITY.disabled),
    '--state-opacity-hover':    String(STATE_OPACITY.hover),
  };
}

/** Parse a `#rrggbb` hex into a `r, g, b` triple for use inside `rgba()`. */
function hexToRgbTriple(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
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

/** Build raw ramps for a single mode (no per-step overrides applied yet). */
function buildModeRamps(
  config: BrandConfig,
  mode: ColorMode,
): {
  byHue: Record<string, ColorRamp | NeutralColorRamp>;
  roleHue: Record<RampRole, string>;
  decorativeHues: string[];
} {
  const isDark = mode === 'dark';
  const falloff = config.chromaFalloff / 100;

  // --- Primary ---
  const primaryOklch = toOklch(config.primaryColor);
  const primaryH = primaryOklch?.h || 0;
  const primaryL = primaryOklch?.l ?? 0.5;
  const primaryC = primaryOklch?.c ?? 0;
  const primaryMaxC = maxChromaForLH(primaryL, primaryH);
  const primarySatRatio = primaryMaxC > 0 ? primaryC / primaryMaxC : 0;
  const primaryRamp = generateOklchRamp(
    primaryH, primaryC, primaryL, falloff,
    { mode, satRatio: primarySatRatio },
  );
  const primaryHue = hueNameForRole(primaryH);

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
  const secondaryRamp = generateOklchRamp(
    secondaryH, secondaryC, secondaryL, falloff,
    { mode, satRatio: secondarySatRatio },
  );
  const secondaryHue = hueNameForRole(secondaryH);

  // --- Neutral ---
  const neutralRamp = generateNeutralRamp(
    primaryH, config.neutralTint, primaryL, falloff,
    { mode },
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
    // Brand roles (primary/secondary) bucket with the narrow rule so they don't
    // greedily occupy a reserved status hue; status roles bucket normally.
    const hueName =
      role === 'primary' || role === 'secondary' ? hueNameForRole(h) : hueNameFor(h);
    roleHue[role] = hueName;

    // Skip emission if a higher-priority role already occupies this hue slot.
    if (byHue[hueName]) continue;

    // Primary/secondary use the configured falloff for soft ramps; status uses 0.8.
    const sigma = role === 'primary' || role === 'secondary' ? falloff : 0.8;
    const maxC = maxChromaForLH(l, h);
    const satRatio = maxC > 0 ? c / maxC : 0;
    byHue[hueName] =
      role === 'primary'    ? primaryRamp :
      role === 'secondary'  ? secondaryRamp :
      generateOklchRamp(h, c, l, sigma, { mode, satRatio });
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
    byHue[candidate] = generateOklchRamp(h, c, peakL, 0.8, { mode, satRatio: 0.8 });
  }

  return { byHue, roleHue, decorativeHues };
}

/** Map a hue name back to its `config.rampOverrides` key. */
function overrideKeyForHue(hue: string, roleHue: Record<RampRole, string>): string {
  if (hue === 'neutral') return 'neutral';
  if (roleHue.primary === hue) return 'primary';
  if (roleHue.secondary === hue) return 'secondary';
  if (roleHue.success === hue) return 'success';
  if (roleHue.warning === hue) return 'warning';
  if (roleHue.critical === hue) return 'critical';
  if (roleHue.info === hue) return 'info';
  return hue;
}

/**
 * Build both light and dark ramp sets. Dark-mode chromatic ramps are flipped
 * (darkest shade → step 50) so a single semantic mapping works in both modes;
 * the neutral ramp keeps its natural ordering. Per-step overrides are applied
 * *after* the flip, so an inspector-edited swatch stays at its displayed step.
 */
function allocateRamps(config: BrandConfig): RampAllocation {
  const light = buildModeRamps(config, 'light');
  const dark = buildModeRamps(config, 'dark');
  const overrides = config.rampOverrides;
  // Hue selection is mode-independent — light and dark agree.
  const { roleHue, decorativeHues } = light;

  const withOverride = (hue: string, ramp: ColorRamp | NeutralColorRamp) =>
    applyRampOverrides(
      ramp,
      overrides[overrideKeyForHue(hue, roleHue)] as Partial<ColorRamp> | undefined,
    );

  const byHueLight: Record<string, ColorRamp | NeutralColorRamp> = {};
  for (const [hue, ramp] of Object.entries(light.byHue)) {
    byHueLight[hue] = withOverride(hue, ramp);
  }

  const byHueDark: Record<string, ColorRamp | NeutralColorRamp> = {};
  for (const [hue, ramp] of Object.entries(dark.byHue)) {
    const oriented = hue === 'neutral' ? ramp : flipRamp(ramp as ColorRamp);
    byHueDark[hue] = withOverride(hue, oriented);
  }

  return { byHueLight, byHueDark, roleHue, decorativeHues };
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

  const allocation = allocateRamps(config);
  const { byHueLight, byHueDark, roleHue, decorativeHues } = allocation;
  // Active ramp set for primitive emission: chromatic ramps flipped when dark.
  const byHue = isDark ? byHueDark : byHueLight;

  // =========================================================================
  // Primitive color tokens — emit one ramp per hue
  // =========================================================================

  /** Reverse lookup: hue name → override role (for inspector). */
  const overrideRoleFor = (hue: string): string => overrideKeyForHue(hue, roleHue);

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

  // Exact-input primitive: bypasses ramp clamping so saturated primary surfaces
  // (button background, border, hover) preserve the user's chosen hex verbatim.
  // Same hex in both light and dark modes — branding wins over mode-specific tuning.
  //
  // Guardrail: if the input would be illegible against this mode's base
  // background (e.g. a near-black primary in dark mode), nudge it toward the
  // opposite of the bg until WCAG 3:1 is met. `config.primaryColor` itself is
  // left untouched so the picker keeps showing the user's chosen hex.
  const neutralRampOut = byHue.neutral as NeutralColorRamp;
  const baseBgHex = (isDark ? neutralRampOut[800] : neutralRampOut[0]) as string;
  const primaryAdjustment = clampPrimaryForContrast(
    config.primaryColor,
    baseBgHex,
    isDark ? 'dark' : 'light',
  );
  const primaryBaseHex = primaryAdjustment.applied;
  tokens['--color-primary-base'] = primaryBaseHex;
  semanticMap['color-primary-base'] = {
    ramp: roleHue.primary,
    role: 'primary',
    lightStep: null,
    darkStep: null,
    target: 'primaryColor',
  };

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

  /**
   * Emit a token that picks the ramp step closest to a lightness target.
   *
   * A plain `number` target picks one step on the light ramp and reuses it in
   * both modes — dark mode is handled by the flipped primitive ramp. A
   * `{light,dark}` target picks per mode (light step on the light ramp, dark
   * step on the flipped dark ramp) for the rare token whose flip lands wrong.
   */
  function assignPicked(
    tokenSuffix: string,
    hue: string,
    target: number | { light: number; dark: number },
  ) {
    let lightStep: number;
    let darkStep: number;
    if (typeof target === 'number') {
      lightStep = darkStep = pickStep(byHueLight[hue] as ColorRamp, target);
    } else {
      lightStep = pickStep(byHueLight[hue] as ColorRamp, target.light);
      darkStep = pickStep(byHueDark[hue] as ColorRamp, target.dark);
    }
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
   * Picks a single mode-independent step that clears AA against the resolved
   * background in *both* the light ramp and the flipped dark ramp; if none does,
   * falls back to the step with the best worst-case contrast.
   */
  function assignContrastFg(
    tokenSuffix: string,
    bgTokenSuffix: string,
    hue: string,
  ) {
    const lightRamp = byHueLight[hue] as ColorRamp;
    const darkRamp = byHueDark[hue] as ColorRamp;
    const bgValue = tokens[`--color-${bgTokenSuffix}`];
    const bgLight = resolveStepRef(bgValue, byHueLight);
    const bgDark = resolveStepRef(bgValue, byHueDark);

    let chosen: number | null = null;
    let bestStep: number = STEPS[STEPS.length - 1];
    let bestMin = -1;
    for (const step of STEPS) {
      const cLight = wcagContrast(bgLight, lightRamp[step]) ?? 0;
      const cDark = wcagContrast(bgDark, darkRamp[step]) ?? 0;
      if (cLight >= 4.5 && cDark >= 4.5) { chosen = step; break; }
      const worst = Math.min(cLight, cDark);
      if (worst > bestMin) { bestMin = worst; bestStep = step; }
    }
    const step = chosen ?? bestStep;
    tokens[`--color-${tokenSuffix}`] = `var(--color-${hue}-${step})`;
    semanticMap[`color-${tokenSuffix}`] = {
      ramp: hue,
      role: overrideRoleFor(hue),
      lightStep: step,
      darkStep: step,
    };
  }

  /**
   * Pick between `--color-neutral-0` and `--color-neutral-1000` based on which
   * has higher WCAG contrast against the resolved background.
   *
   * Used for foregrounds on solid, fully-saturated surfaces (e.g. `onAccent`,
   * `onSuccess`). The chromatic background flips between modes but the neutral
   * ramp does not, so the winning extreme is computed per mode — `lightStep`
   * and `darkStep` may differ.
   */
  function assignNeutralContrastFg(tokenSuffix: string, bgTokenSuffix: string) {
    const bgValue = tokens[`--color-${bgTokenSuffix}`];
    const neutralLight = byHueLight.neutral as NeutralColorRamp;
    const neutralDark = byHueDark.neutral as NeutralColorRamp;

    const pick = (bg: string, neutral: NeutralColorRamp): 0 | 1000 =>
      (wcagContrast(bg, neutral[0]) ?? 0) >= (wcagContrast(bg, neutral[1050]) ?? 0) ? 0 : 1000;

    const lightStep = pick(resolveStepRef(bgValue, byHueLight), neutralLight);
    const darkStep = pick(resolveStepRef(bgValue, byHueDark), neutralDark);
    const step = isDark ? darkStep : lightStep;
    tokens[`--color-${tokenSuffix}`] = `var(--color-neutral-${step})`;

    semanticMap[`color-${tokenSuffix}`] = {
      ramp: 'neutral',
      role: overrideRoleFor('neutral'),
      lightStep,
      darkStep,
    };
  }

  /** Emit a literal (non-primitive) value; records null mapping for the inspector. */
  function assignLiteral(tokenSuffix: string, value: string) {
    tokens[`--color-${tokenSuffix}`] = value;
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
  // background-primary routes through the exact-input primitive — see the
  // `--color-primary-base` block above. primaryHover is a normal semantic step
  // on the primary ramp, so it flips with the ramp in dark mode.
  tokens['--color-background-primary'] = `var(--color-primary-base)`;
  semanticMap['color-background-primary'] = {
    ramp: roleHue.primary,
    role: 'primary',
    lightStep: null,
    darkStep: null,
    target: 'primaryColor',
  };
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
  //
  // foreground-onPrimary's background is the exact-input `--color-primary-base`,
  // which isn't a ramp step — so it's resolved against `primaryBaseHex` directly
  // rather than via `assignNeutralContrastFg`. Still emits a neutral primitive
  // (the neutral ramp doesn't flip, so one step works in both modes), matching
  // the sample tokens.css.
  {
    const neutral = byHue.neutral as NeutralColorRamp;
    const onPrimaryStep =
      (wcagContrast(primaryBaseHex, neutral[0]) ?? 0) >= (wcagContrast(primaryBaseHex, neutral[1050]) ?? 0)
        ? 0
        : 1000;
    tokens['--color-foreground-onPrimary'] = `var(--color-neutral-${onPrimaryStep})`;
    semanticMap['color-foreground-onPrimary'] = {
      ramp: 'neutral',
      role: 'neutral',
      lightStep: onPrimaryStep,
      darkStep: onPrimaryStep,
    };
  }
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

  // CTA / gradient surfaces. `onGradient` is opaque white → the neutral-0
  // primitive (light in both modes, since the neutral ramp doesn't flip).
  // `onGradientMuted` and `gradientSoft` are *translucent* white — a muted
  // text that lets the gradient bleed through, and a 15%-white ghost-button
  // fill — so they can't map to an opaque primitive and stay literal as the
  // documented gradient exception.
  assignPrimitiveRef('foreground-onGradient', 'neutral', 0);
  assignPrimitiveRef('foreground-onGradientMuted', 'neutral', 100);
  assignPrimitiveRef('background-gradientSoft', 'neutral', 0);

  // =========================================================================
  // Semantic border tokens
  // =========================================================================

  // Hairline borders reference the neutral ramp (matches the sample tokens.css:
  // border-neutral → neutral-100, border-strong → neutral-200). Dark mode uses
  // mid steps, not deep ones, so borders stay visible on raised surfaces
  // (which themselves sit at neutral-700).
  assignPrimitiveRef('border-neutral', 'neutral', isDark ? 600 : 100);
  assignPrimitiveRef('border-strong',  'neutral', isDark ? 500 : 200);
  // border-primary mirrors the exact-input primary fill so a primary button
  // doesn't get a hue mismatch between fill and outline.
  tokens['--color-border-primary'] = `var(--color-primary-base)`;
  semanticMap['color-border-primary'] = {
    ramp: roleHue.primary,
    role: 'primary',
    lightStep: null,
    darkStep: null,
    target: 'primaryColor',
  };
  assignPicked('border-accent',  roleHue.secondary, LIGHTNESS_TARGETS.strong);
  for (const role of ['success', 'warning', 'critical', 'info'] as const) {
    assignPicked(`border-${role}`, roleHue[role], LIGHTNESS_TARGETS.strong);
  }

  // =========================================================================
  // Chart tokens
  // =========================================================================

  // Chart gridlines — a faint neutral primitive (no hardcoded literal). Dark
  // mode uses a mid step so gridlines read against the chart surface.
  assignPrimitiveRef('chart-grid', 'neutral', isDark ? 600 : 100);
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
  // Semantic interactive tokens
  // =========================================================================

  // A translucent scrim laid over an interactive element on hover/active.
  // Light mode darkens the underlying surface with a deep neutral; dark mode
  // lightens it with a pale neutral. Because the overlay only shifts whatever
  // color sits beneath it, a single pair of tokens drives the hover affordance
  // for every interactive element regardless of its own background. Alpha
  // tracks the shared `STATE_OPACITY` scale.
  {
    const neutral = byHue.neutral as NeutralColorRamp;
    const scrim = hexToRgbTriple((isDark ? neutral[50] : neutral[700]) as string);
    assignLiteral('interactive-background-hover',  `rgba(${scrim}, ${STATE_OPACITY.hover})`);
    assignLiteral('interactive-background-active', `rgba(${scrim}, ${STATE_OPACITY.active})`);
  }

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

  return {
    tokens,
    semanticMap,
    swatches,
    ...(primaryAdjustment.adjusted ? { primaryAdjustment } : {}),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a `var(--color-<hue>-<step>)` reference to a concrete hex via the
 * given ramp set. Returns the input unchanged if it isn't a step reference.
 * Used by the contrast helpers, which need a real color to measure against.
 */
function resolveStepRef(
  value: string | undefined,
  byHue: Record<string, ColorRamp | NeutralColorRamp>,
): string {
  if (!value) return '#808080';
  const m = value.trim().match(/^var\(--color-([a-z]+)-(\d+)\)$/);
  if (!m) return value;
  const ramp = byHue[m[1]] as unknown as Record<number, string> | undefined;
  if (!ramp) return value;
  let step = Number(m[2]);
  // The neutral ramp's deepest endpoint is keyed `1050` internally but emitted
  // as `1000`; map back when resolving.
  if (ramp[step] === undefined && step === 1000) step = 1050;
  return ramp[step] ?? value;
}
