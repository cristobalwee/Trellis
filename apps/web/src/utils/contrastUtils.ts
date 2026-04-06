import { wcagContrast, converter } from 'culori';
import { STEPS, type ColorRamp } from '../components/Showcase/colorUtils';

const toOklch = converter('oklch');

type StepKey = (typeof STEPS)[number];

/**
 * Find the ramp step whose actual OKLCH lightness is closest to `targetL`.
 * Operates on resolved hex values so gamut clamping is already accounted for.
 */
export function pickStep(ramp: ColorRamp, targetL: number): StepKey {
  let bestStep: StepKey = STEPS[0];
  let bestDist = Infinity;

  for (const step of STEPS) {
    const oklch = toOklch(ramp[step]);
    const l = oklch?.l ?? 0;
    const dist = Math.abs(l - targetL);
    if (dist < bestDist) {
      bestDist = dist;
      bestStep = step;
    }
  }

  return bestStep;
}

/**
 * Walk a foreground ramp from the perceptual extreme toward the middle,
 * returning the first step that achieves WCAG AA contrast against `bgHex`.
 *
 * Light mode: walks 50 → 900 (lightest first, finds darkest-enough step)
 * Dark mode:  walks 900 → 50 (darkest first, finds lightest-enough step)
 *
 * Falls back to pure white or black if no ramp step passes.
 */
export function pickContrastingFg(
  bgHex: string,
  fgRamp: ColorRamp,
  isDark: boolean,
  minRatio: number = 4.5,
): { hex: string; step: StepKey | null } {
  const order: StepKey[] = isDark ? [...STEPS].reverse() : [...STEPS];

  for (const step of order) {
    const ratio = wcagContrast(bgHex, fgRamp[step]);
    if (ratio >= minRatio) {
      return { hex: fgRamp[step], step };
    }
  }

  // No ramp step passes — fall back to pure white or black
  return { hex: isDark ? '#000000' : '#ffffff', step: null };
}
