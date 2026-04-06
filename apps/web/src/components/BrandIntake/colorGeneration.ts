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
//
// 12 canonical OKLCH hue angles that form a perceptually balanced color wheel.
// The primary color replaces the nearest slot; semantic hues (Red, Green, Blue,
// Yellow) are always retained to guarantee stable baselines for feedback colors.

export interface NamedHue {
  name: string;
  hue: number;
}

export const NAMED_HUES: NamedHue[] = [
  { name: 'Red', hue: 25 },
  { name: 'Orange', hue: 55 },
  { name: 'Amber', hue: 75 },
  { name: 'Yellow', hue: 95 },
  { name: 'Lime', hue: 130 },
  { name: 'Green', hue: 150 },
  { name: 'Teal', hue: 175 },
  { name: 'Cyan', hue: 200 },
  { name: 'Blue', hue: 255 },
  { name: 'Indigo', hue: 280 },
  { name: 'Purple', hue: 305 },
  { name: 'Pink', hue: 350 },
];

/** Hues that are always retained regardless of hue selection. */
export const SEMANTIC_HUES = ['Red', 'Green', 'Blue', 'Yellow'];
const SEMANTIC_OCCUPATION_THRESHOLD = 24;

// ========== Gamut Utilities ==================================================

function isInGamut(L: number, C: number, H: number): boolean {
  return displayable({ mode: 'oklch', l: L, c: C, h: H });
}

/** Find the maximum chroma that fits in sRGB for a given lightness and hue. */
export function maxChromaForLH(L: number, H: number): number {
  let low = 0;
  let high = 0.4;

  while (high - low > 0.001) {
    const mid = (low + high) / 2;
    if (isInGamut(L, mid, H)) low = mid;
    else high = mid;
  }

  return low;
}

// ========== Additional Hue Seeding ===========================================

export interface AdditionalRampSeed {
  baseL: number;
  baseChroma: number;
}

interface AdditionalHueProfile {
  baseL: number;
  baseChroma: number;
  minL: number;
  maxL: number;
  minC: number;
  maxC: number;
}

/**
 * Baseline perceptual anchors for additional ramps.
 * Core semantic colors stay close to these targets so they preserve meaning.
 */
const ADDITIONAL_HUE_PROFILES: Record<string, AdditionalHueProfile> = {
  Red: { baseL: 0.62, baseChroma: 0.19, minL: 0.56, maxL: 0.68, minC: 0.14, maxC: 0.24 },
  Yellow: { baseL: 0.82, baseChroma: 0.18, minL: 0.76, maxL: 0.9, minC: 0.13, maxC: 0.24 },
  Green: { baseL: 0.71, baseChroma: 0.17, minL: 0.64, maxL: 0.79, minC: 0.12, maxC: 0.23 },
  Blue: { baseL: 0.6, baseChroma: 0.16, minL: 0.54, maxL: 0.68, minC: 0.11, maxC: 0.22 },
};

const DEFAULT_ADDITIONAL_PROFILE: AdditionalHueProfile = {
  baseL: 0.66,
  baseChroma: 0.15,
  minL: 0.58,
  maxL: 0.78,
  minC: 0.1,
  maxC: 0.21,
};

/**
 * Compute seeded base lightness/chroma for additional ramps.
 *
 * Ramps are anchored to stable hue-specific targets and only mildly influenced
 * by the primary's characteristics to keep semantic colors recognizable.
 */
export function getAdditionalRampSeed(
  slotName: string,
  hue: number,
  primaryL: number,
  saturationRatio: number,
): AdditionalRampSeed {
  const profile = ADDITIONAL_HUE_PROFILES[slotName] ?? DEFAULT_ADDITIONAL_PROFILE;

  // Keep lightness centered around hue defaults with only subtle primary bias.
  const normalizedPrimaryL = clampValue(primaryL, 0, 1);
  const lightnessBias = (normalizedPrimaryL - 0.62) * 0.12;
  const baseL = clampValue(profile.baseL + lightnessBias, profile.minL, profile.maxL);

  // Keep chroma near semantic defaults; let saturation nudge within a tight band.
  const normalizedSaturation = clampValue(saturationRatio, 0, 1.35);
  const saturationBias = (normalizedSaturation - 0.7) * 0.3;
  const seededChroma = clampValue(
    profile.baseChroma * (1 + saturationBias),
    profile.minC,
    profile.maxC,
  );

  // Final safety clamp against sRGB gamut at the seeded base lightness.
  const maxC = maxChromaForLH(baseL, hue);
  return {
    baseL,
    baseChroma: Math.min(seededChroma, maxC),
  };
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
 *
 * The primary's actual hue replaces the nearest named slot. Semantic hues
 * (Red, Green, Blue, Yellow) are locked in unless either the primary or
 * secondary hue is already close to that semantic target. In that case, the
 * semantic ramp is omitted to avoid near-duplicate clashes and another hue is
 * selected instead. Remaining slots are chosen to maximise the minimum angular
 * distance between any two selected hues, ensuring a well-distributed palette.
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

  // Start with the primary slot + locked semantic hues
  const selected: HueSlot[] = [];
  const primaryCandidate = candidates.find((c) => c.name === nearestNamed.name)!;
  selected.push(primaryCandidate);

  for (const semantic of SEMANTIC_HUES) {
    if (semantic !== nearestNamed.name && !occupiedSemanticBy.has(semantic)) {
      const candidate = candidates.find((c) => c.name === semantic)!;
      selected.push(candidate);
    }
  }

  // Remaining candidates for greedy selection
  const excludedSemanticNames = new Set(
    Array.from(occupiedSemanticBy.keys()).filter((name) => name !== nearestNamed.name),
  );
  const remaining = candidates.filter(
    (c) => !selected.includes(c) && !excludedSemanticNames.has(c.name),
  );

  // Greedy: pick the hue with the greatest minimum distance to selected set
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

  // Record which hues were dropped and why
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

// ========== Ramp Generation ==================================================

const RAMP_STEPS = STEPS.length;

function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generate baseline lightness values for N steps.
 *
 * Uses a gentle gamma curve from bright to dark. Endpoints sit slightly inside
 * pure white/black so ramp edges don’t read as washed or crushed.
 */
function baselineLightness(steps: number): number[] {
  const maxL = 0.976;
  const minL = 0.279;
  const gamma = 0.9;
  const out: number[] = [];

  for (let i = 0; i < steps; i++) {
    const t = steps === 1 ? 0 : i / (steps - 1);
    out.push(maxL + (minL - maxL) * Math.pow(t, gamma));
  }

  return out;
}

function closestIndex(values: number[], target: number): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < values.length; i++) {
    const dist = Math.abs(values[i] - target);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Generate a gamut-safe OKLCH color ramp.
 *
 * Chroma and lightness dropoff accelerate progressively toward the ramp edges
 * (quadratic easing), so fewer steps can span the same perceptual range as a
 * 12-step ramp while preserving richness in the mid-tones.
 *
 * @param hue          OKLCH hue angle
 * @param baseChroma   Chroma at the base lightness position
 * @param baseL        The base lightness (typically the primary's L)
 * @param chromaFalloff 0–1: how much chroma decreases toward ramp extremes
 */
export function generateOklchRamp(
  hue: number,
  baseChroma: number,
  baseL: number,
  chromaFalloff: number = 0.8,
): ColorRamp {
  const steps = RAMP_STEPS;

  const targetLightness = baselineLightness(steps);
  const basePosition = closestIndex(targetLightness, baseL);

  const maxDistance = Math.max(basePosition, steps - 1 - basePosition);

  const ramp: Partial<ColorRamp> = {};

  for (let i = 0; i < steps; i++) {
    let shadeL: number;
    let shadeC: number;

    const distance = Math.abs(i - basePosition);
    // Normalized 0→1 distance from base to the farthest edge
    const tNorm = maxDistance > 0 ? distance / maxDistance : 0;
    // Progressive (quadratic) easing — accelerates toward extremes
    const tProg = tNorm * tNorm;

    if (i === basePosition) {
      shadeL = baseL;
    } else {
      const baseLTarget = targetLightness[basePosition];
      const lDiff = baseL - baseLTarget;
      // Weight decays progressively instead of linearly
      const weight = 1 - tProg;
      shadeL = targetLightness[i] + lDiff * weight * 0.5;
      shadeL = clampValue(shadeL, 0.05, 0.99);
    }

    // Chroma drops progressively rather than linearly
    shadeC = baseChroma * (1 - chromaFalloff * tProg);
    shadeC = Math.max(shadeC, baseChroma * (1 - chromaFalloff));

    // Clamp chroma to fit in sRGB gamut
    const maxC = maxChromaForLH(shadeL, hue);
    shadeC = Math.min(shadeC, maxC);

    const hex = formatHex({ mode: 'oklch', l: shadeL, c: shadeC, h: hue });
    ramp[STEPS[i] as keyof ColorRamp] = hex || '#808080';
  }

  return ramp as ColorRamp;
}

/**
 * Generate a neutral ramp tinted according to the chosen strategy.
 *
 * The neutral ramp includes two extra extremes beyond the standard 10 steps:
 *   - `0`    → near-white (L 0.99) for true white-like backgrounds
 *   - `1050` → near-black (L 0.20) for true black-like foregrounds
 */
export function generateNeutralRamp(
  primaryHue: number,
  mode: 'pure' | 'cool' | 'warm' | 'brand-tinted',
  baseL: number,
  chromaFalloff: number = 0.8,
): NeutralColorRamp {
  let hue = 0;
  let chroma = 0;

  switch (mode) {
    case 'pure':
      chroma = 0;
      break;
    case 'warm':
      hue = 75;
      chroma = 0.01;
      break;
    case 'cool':
      hue = 260;
      chroma = 0.01;
      break;
    case 'brand-tinted':
      hue = primaryHue;
      // Slightly reduce tint for yellow-green hues which can feel overpowering
      chroma = primaryHue >= 70 && primaryHue <= 140 ? 0.008 : 0.015;
      break;
  }

  const baseRamp = generateOklchRamp(hue, chroma, baseL, chromaFalloff);
  const shade1050C = Math.min(chroma, maxChromaForLH(0.24, hue));

  return {
    ...baseRamp,
    0: formatHex({ mode: 'oklch', l: 0.99, c: 0, h: hue }) || '#fefefe',
    1050: formatHex({ mode: 'oklch', l: 0.24, c: shade1050C, h: hue }) || '#1a1a1a',
  };
}
