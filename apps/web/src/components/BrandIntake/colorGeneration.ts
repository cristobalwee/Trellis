import { converter, formatHex, displayable } from 'culori';
import { STEPS, type ColorRamp, type NeutralColorRamp } from '../Showcase/colorUtils';

export const toOklch = converter('oklch');

// ========== Generation Modes (for secondary color) ===========================

export const GENERATION_MODES = [
  { id: 'complementary', label: 'Complementary', offset: 180 },
  { id: 'split-complementary', label: 'Split Complementary', offset: 150 },
  { id: 'triadic', label: 'Triadic', offset: 120 },
  { id: 'analogous', label: 'Analogous', offset: 30 },
  { id: 'tetradic', label: 'Tetradic', offset: 90 },
  { id: 'monochromatic', label: 'Monochromatic', offset: 0 },
] as const;

export type GenerationMode = (typeof GENERATION_MODES)[number]['id'];

export function getGeneratedColor(baseHex: string, mode: GenerationMode): string {
  const base = toOklch(baseHex);
  if (!base) return baseHex;

  const modeConfig = GENERATION_MODES.find((m) => m.id === mode);
  const offset = modeConfig ? modeConfig.offset : 180;

  return (
    formatHex({
      mode: 'oklch',
      l: base.l,
      c: base.c,
      h: ((base.h || 0) + offset) % 360,
    }) || baseHex
  );
}

// ========== Named Hue System =================================================

export interface NamedHue {
  name: string;
  hue: number;
}

export const NAMED_HUES: NamedHue[] = [
  { name: 'Red', hue: 25 },
  { name: 'Orange', hue: 55 },
  { name: 'Amber', hue: 75 },
  { name: 'Yellow', hue: 95 },
  { name: 'Lime', hue: 125 },
  { name: 'Green', hue: 150 },
  { name: 'Teal', hue: 175 },
  { name: 'Cyan', hue: 200 },
  { name: 'Blue', hue: 240 },
  { name: 'Indigo', hue: 275 },
  { name: 'Purple', hue: 305 },
  { name: 'Pink', hue: 345 },
];

/** Hues that are always retained regardless of hue selection. */
export const SEMANTIC_HUES = ['Red', 'Green', 'Blue', 'Yellow'];
const SEMANTIC_OCCUPATION_THRESHOLD = 24;

// ========== Lightness Targets ================================================

export const LIGHT_MODE_LIGHTNESS: Record<number, number> = {
  50: 0.975,
  100: 0.93,
  200: 0.87,
  300: 0.78,
  400: 0.68,
  500: 0.58,
  600: 0.48,
  700: 0.39,
  800: 0.31,
  900: 0.24,
};

// Step 50 = lightest tint, step 900 = darkest tint — same semantic as light mode,
// just tuned for dark-mode surfaces (peaks are less extreme than light mode).
export const DARK_MODE_LIGHTNESS: Record<number, number> = {
  50: 0.88,
  100: 0.77,
  200: 0.65,
  300: 0.56,
  400: 0.48,
  500: 0.40,
  600: 0.33,
  700: 0.27,
  800: 0.22,
  900: 0.18,
};

// ========== Gamut Utilities ==================================================

function isInGamut(L: number, C: number, H: number): boolean {
  return displayable({ mode: 'oklch', l: L, c: C, h: H });
}

/** Max chroma cache: keyed by `${hue_rounded}-${lightness_rounded}` */
const maxChromaCache = new Map<string, number>();

/** Find the maximum chroma that fits in sRGB for a given lightness and hue. */
export function maxChromaForLH(L: number, H: number): number {
  // Round for cache efficiency (resolution ~0.01 L, ~1° H)
  const lKey = Math.round(L * 100);
  const hKey = Math.round(H);
  const key = `${hKey}-${lKey}`;

  const cached = maxChromaCache.get(key);
  if (cached !== undefined) return cached;

  let low = 0;
  let high = 0.4;

  while (high - low > 0.001) {
    const mid = (low + high) / 2;
    if (isInGamut(L, mid, H)) low = mid;
    else high = mid;
  }

  // 0.95 safety margin to avoid edge clipping
  const result = low * 0.95;
  maxChromaCache.set(key, result);
  return result;
}

// ========== Chroma Floor =====================================================

/**
 * Proportion of gamut-max chroma used as a floor at each step, scaled by input
 * saturation ratio. Lifts chroma at ramp extremes for vivid inputs so that the
 * entire ramp feels more cohesive with the input color.
 */
const CHROMA_FLOOR_FACTOR = 0.15;

// ========== Gaussian Chroma Distribution =====================================

function gaussianChroma(L: number, peakL: number, sigma: number, peakC: number): number {
  return peakC * Math.exp(-0.5 * ((L - peakL) / sigma) ** 2);
}

// ========== Sigma Mapping ====================================================

/**
 * Map the UI chromaFalloff (0–100) to a Gaussian sigma.
 * Higher falloff → tighter bell → smaller sigma.
 *   falloff=0   → sigma=0.40 (very wide, uniform chroma)
 *   falloff=80  → sigma=0.20 (default-like)
 *   falloff=100 → sigma=0.15 (tight, chroma drops fast)
 */
export function falloffToSigma(chromaFalloff: number): number {
  return 0.15 + (1 - chromaFalloff / 100) * 0.25;
}

// ========== Hue Selection ====================================================

function angularDistance(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return Math.min(diff, 360 - diff);
}

function findNearestHue(hue: number): NamedHue {
  let nearest = NAMED_HUES[0];
  let minDist = angularDistance(hue, nearest.hue);

  for (const nh of NAMED_HUES) {
    const dist = angularDistance(hue, nh.hue);
    if (dist < minDist) {
      minDist = dist;
      nearest = nh;
    }
  }

  return nearest;
}

export interface HueSlot {
  name: string;
  hue: number;
  isPrimary: boolean;
  isOriginal: boolean;
}

export interface HueSelection {
  selected: HueSlot[];
  dropped: { name: string; reason: string }[];
  primaryName: string;
}

/**
 * Select 9 chromatic hues from the 12 named hues using a greedy algorithm.
 */
export function selectHues(primaryHue: number, secondaryHue?: number): HueSelection {
  const nearestNamed = findNearestHue(primaryHue);
  const secondary = typeof secondaryHue === 'number' ? secondaryHue : null;

  const candidates: HueSlot[] = NAMED_HUES.map((h) => ({
    name: h.name,
    hue: h.name === nearestNamed.name ? primaryHue : h.hue,
    isPrimary: h.name === nearestNamed.name,
    isOriginal: h.name !== nearestNamed.name,
  }));

  const semanticCandidates = candidates.filter((c) => SEMANTIC_HUES.includes(c.name));
  const occupiedSemanticBy = new Map<string, 'primary' | 'secondary'>();
  for (const semantic of semanticCandidates) {
    const primaryDistance = angularDistance(primaryHue, semantic.hue);
    const secondaryDistance = secondary !== null ? angularDistance(secondary, semantic.hue) : Infinity;
    const minDistance = Math.min(primaryDistance, secondaryDistance);
    if (minDistance <= SEMANTIC_OCCUPATION_THRESHOLD) {
      occupiedSemanticBy.set(
        semantic.name,
        primaryDistance <= secondaryDistance ? 'primary' : 'secondary',
      );
    }
  }

  const selected: HueSlot[] = [];
  const primaryCandidate = candidates.find((c) => c.name === nearestNamed.name)!;
  selected.push(primaryCandidate);

  for (const semantic of SEMANTIC_HUES) {
    if (semantic !== nearestNamed.name && !occupiedSemanticBy.has(semantic)) {
      const candidate = candidates.find((c) => c.name === semantic)!;
      selected.push(candidate);
    }
  }

  const excludedSemanticNames = new Set(
    Array.from(occupiedSemanticBy.keys()).filter((name) => name !== nearestNamed.name),
  );
  const remaining = candidates.filter(
    (c) => !selected.includes(c) && !excludedSemanticNames.has(c.name),
  );

  while (selected.length < 9 && remaining.length > 0) {
    let bestCandidate: HueSlot | null = null;
    let bestMinDist = -1;

    for (const candidate of remaining) {
      let minDist = Infinity;
      for (const sel of selected) {
        minDist = Math.min(minDist, angularDistance(candidate.hue, sel.hue));
      }
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      selected.push(bestCandidate);
      remaining.splice(remaining.indexOf(bestCandidate), 1);
    }
  }

  const dropped = Array.from(occupiedSemanticBy.entries())
    .filter(([name]) => name !== nearestNamed.name)
    .map(([name, source]) => ({
      name,
      reason: `covered by ${source}`,
    }));

  dropped.push(
    ...remaining.map((r) => {
      let closestSelected = selected[0];
      let closestDist = angularDistance(r.hue, closestSelected.hue);
      for (const s of selected) {
        const dist = angularDistance(r.hue, s.hue);
        if (dist < closestDist) {
          closestDist = dist;
          closestSelected = s;
        }
      }
      return { name: r.name, reason: `too close to ${closestSelected.name}` };
    }),
  );

  selected.sort((a, b) => a.hue - b.hue);

  return { selected, dropped, primaryName: nearestNamed.name };
}

// ========== Core Ramp Generation (Gaussian OKLCH) ============================

export type ColorMode = 'light' | 'dark';

interface GaussianParams {
  peakL: number;
  sigma: number;
  peakC: number;
}

/**
 * Compute the Gaussian parameters for a ramp given a hue and an anchor
 * chroma/lightness. This decouples peakC from the input: peakC is solved
 * such that the Gaussian passes through `anchorC` at `anchorL`.
 */
function computeGaussianParams(
  hue: number,
  anchorL: number,
  anchorC: number,
  sigma: number,
  mode: ColorMode,
): GaussianParams {
  const peakL = mode === 'dark' ? 0.65 : 0.60;
  const hueMaxC = maxChromaForLH(peakL, hue);

  // Normalized Gaussian value at the anchor's lightness (peakC = 1)
  const gaussianAtAnchor = gaussianChroma(anchorL, peakL, sigma, 1.0);

  let peakC: number;
  if (gaussianAtAnchor > 0.001) {
    peakC = Math.min(anchorC / gaussianAtAnchor, hueMaxC);
  } else {
    // Anchor is far from the peak — use hue max
    peakC = hueMaxC;
  }

  return { peakL, sigma, peakC };
}

/**
 * Generate a 10-step OKLCH color ramp using Gaussian chroma distribution.
 *
 * @param hue          OKLCH hue angle
 * @param baseChroma   Chroma of the anchor color (used to derive peakC)
 * @param baseL        Lightness of the anchor color
 * @param chromaFalloff 0–100 UI slider value (mapped to sigma internally)
 * @param options      Optional: mode ('light'|'dark'), sigma override, satRatio
 */
export function generateOklchRamp(
  hue: number,
  baseChroma: number,
  baseL: number,
  chromaFalloff: number = 0.8,
  options?: {
    mode?: ColorMode;
    sigma?: number;
    satRatio?: number;
  },
): ColorRamp {
  const mode = options?.mode ?? 'light';
  const sigma = options?.sigma ?? falloffToSigma(
    // Support legacy 0–1 range: if < 1.5 treat as fraction
    chromaFalloff > 1.5 ? chromaFalloff : chromaFalloff * 100,
  );
  const satRatio = options?.satRatio ?? 0;

  const lightnessMap = mode === 'dark' ? DARK_MODE_LIGHTNESS : LIGHT_MODE_LIGHTNESS;
  const { peakL, peakC } = computeGaussianParams(hue, baseL, baseChroma, sigma, mode);

  // Build the ramp
  const ramp: Partial<ColorRamp> = {};
  for (const step of STEPS) {
    const L = lightnessMap[step];
    const C_gaussian = gaussianChroma(L, peakL, sigma, peakC);
    const C_max = maxChromaForLH(L, hue);
    const C_floor = C_max * satRatio * CHROMA_FLOOR_FACTOR;
    const C = Math.min(Math.max(C_gaussian, C_floor), C_max);
    ramp[step as keyof ColorRamp] =
      formatHex({ mode: 'oklch', l: L, c: C, h: hue }) || '#808080';
  }

  return ramp as ColorRamp;
}

/**
 * Generate a neutral ramp tinted according to the chosen strategy.
 *
 * The neutral ramp includes two extra extremes beyond the standard 10 steps:
 *   - `0`    → near-white (L 0.99) for light mode / near-black for dark mode
 *   - `1050` → near-black (L ~0.20) for light mode / near-white for dark mode
 */
export function generateNeutralRamp(
  primaryHue: number,
  tintMode: 'pure' | 'cool' | 'warm' | 'brand-tinted',
  _baseL: number,
  _chromaFalloff: number = 0.8,
  options?: { mode?: ColorMode },
): NeutralColorRamp {
  const mode = options?.mode ?? 'light';
  const isDark = mode === 'dark';
  const lightnessMap = isDark ? DARK_MODE_LIGHTNESS : LIGHT_MODE_LIGHTNESS;

  let hue = 0;
  let peakNeutralC = 0;

  switch (tintMode) {
    case 'pure':
      peakNeutralC = 0;
      break;
    case 'warm':
      hue = 60;
      peakNeutralC = 0.012;
      break;
    case 'cool':
      hue = 255;
      peakNeutralC = 0.012;
      break;
    case 'brand-tinted':
      hue = primaryHue;
      // Slightly reduce tint for yellow-green hues which can feel overpowering
      peakNeutralC = primaryHue >= 70 && primaryHue <= 140 ? 0.007 : 0.009;
      break;
  }

  // Use a gentle Gaussian for neutral chroma distribution
  const neutralPeakL = 0.55;
  const neutralSigma = 0.3;

  const ramp: Partial<ColorRamp> = {};
  for (const step of STEPS) {
    const L = lightnessMap[step];
    const C = peakNeutralC > 0
      ? Math.min(
          gaussianChroma(L, neutralPeakL, neutralSigma, peakNeutralC),
          maxChromaForLH(L, hue),
        )
      : 0;
    ramp[step as keyof ColorRamp] =
      formatHex({ mode: 'oklch', l: L, c: C, h: hue }) || '#808080';
  }

  // Extreme endpoints
  const endpointC = (v: number) =>
    peakNeutralC > 0
      ? Math.min(gaussianChroma(v, neutralPeakL, neutralSigma, peakNeutralC), maxChromaForLH(v, hue))
      : 0;

  if (isDark) {
    // Dark mode: step 0 is very dark, step 1050 is very light
    return {
      ...ramp as ColorRamp,
      0: formatHex({ mode: 'oklch', l: 0.13, c: endpointC(0.13), h: hue }) || '#121212',
      1050: formatHex({ mode: 'oklch', l: 0.95, c: endpointC(0.95), h: hue }) || '#f0f0f0',
    };
  }

  return {
    ...ramp as ColorRamp,
    0: formatHex({ mode: 'oklch', l: 0.99, c: 0, h: hue }) || '#fefefe',
    1050: formatHex({ mode: 'oklch', l: 0.20, c: endpointC(0.20), h: hue }) || '#1a1a1a',
  };
}

// ========== Chroma Guardrails for Semantic/Accent Colors =====================

/**
 * Balance chroma across multiple ramps so no single hue dominates or recedes.
 * Operates on step 600 (the "solid" step) — if any ramp's chroma exceeds
 * 1.4× the average or falls below 0.6×, it's scaled proportionally.
 */
export function applyChromaGuardrails(
  ramps: { name: string; hue: number; ramp: ColorRamp }[],
): { name: string; hue: number; ramp: ColorRamp }[] {
  if (ramps.length === 0) return ramps;

  // Measure chroma at step 600 for each ramp
  const step600Chromas: { idx: number; C: number }[] = ramps.map((r, idx) => {
    const color = toOklch(r.ramp[600]);
    return { idx, C: color?.c ?? 0 };
  });

  const avgC = step600Chromas.reduce((sum, s) => sum + s.C, 0) / step600Chromas.length;
  if (avgC < 0.001) return ramps; // all near-zero, nothing to balance

  const upperBound = avgC * 1.4;
  const lowerBound = avgC * 0.6;

  // Find ramps that need scaling
  const needsScaling = step600Chromas.some((s) => s.C > upperBound || s.C < lowerBound);
  if (!needsScaling) return ramps;

  return ramps.map((r, idx) => {
    const measured = step600Chromas[idx].C;
    if (measured <= upperBound && measured >= lowerBound) return r;

    // Compute scaling factor
    const targetC = measured > upperBound ? upperBound : lowerBound;
    const scale = measured > 0.001 ? targetC / measured : 1;

    // Re-generate ramp with scaled chroma
    const newRamp: Partial<ColorRamp> = {};
    for (const step of STEPS) {
      const color = toOklch(r.ramp[step as keyof ColorRamp]);
      if (!color) {
        newRamp[step as keyof ColorRamp] = r.ramp[step as keyof ColorRamp];
        continue;
      }
      const scaledC = Math.min(color.c * scale, maxChromaForLH(color.l, color.h || 0));
      newRamp[step as keyof ColorRamp] =
        formatHex({ mode: 'oklch', l: color.l, c: scaledC, h: color.h || 0 }) ||
        r.ramp[step as keyof ColorRamp];
    }

    return { ...r, ramp: newRamp as ColorRamp };
  });
}

// ========== Legacy Compatibility =============================================

/**
 * Compute seeded base lightness/chroma for additional ramps.
 * Now delegates to the Gaussian algorithm — the seed values feed into
 * generateOklchRamp which handles the full curve computation.
 *
 * @deprecated Use generateOklchRamp directly with the hue's natural parameters.
 */
export interface AdditionalRampSeed {
  baseL: number;
  baseChroma: number;
}

export function getAdditionalRampSeed(
  _slotName: string,
  hue: number,
  _primaryL: number,
  saturationRatio: number,
): AdditionalRampSeed {
  // Use the Gaussian peak lightness as the base
  const peakL = 0.60;
  const hueMaxC = maxChromaForLH(peakL, hue);
  // Scale chroma by the primary's saturation ratio
  const baseChroma = Math.min(hueMaxC * Math.min(saturationRatio, 1.0), hueMaxC);

  return { baseL: peakL, baseChroma };
}
