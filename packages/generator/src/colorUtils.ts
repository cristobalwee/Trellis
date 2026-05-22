import { converter, formatHex } from 'culori';

const toOklch = converter('oklch');

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export const NEUTRAL_STEPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1050] as const;

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
}

export interface NeutralColorRamp extends ColorRamp {
  0: string;
  1050: string;
}

export function generateRamp(
  baseHex: string,
  saturation = 100,
  isNeutral = false,
  lightnessShift = 100
): ColorRamp {
  const base = toOklch(baseHex);
  const ramp: Partial<ColorRamp> = {};

  const lShift = (lightnessShift - 100) / 200; // -0.5 to +0.5

  STEPS.forEach((step) => {
    const t = (step - 50) / 850; // 0 to 1
    let lightness = 0.98 - t * (0.98 - 0.32);
    lightness = Math.max(0.05, Math.min(0.99, lightness + lShift));

    let chroma = base?.c || 0;
    if (isNeutral) {
      chroma = Math.min(chroma, 0.01 + t * 0.01);
    } else {
      chroma *= saturation / 100;
    }

    const color = {
      mode: 'oklch' as const,
      l: lightness,
      c: chroma,
      h: base?.h || 0,
    };

    ramp[step as keyof ColorRamp] = formatHex(color) || baseHex;
  });

  return ramp as ColorRamp;
}

/**
 * Flip a chromatic ramp's step→hex assignment so the darkest shade lands on the
 * lowest step (50) and the lightest on the highest (900): 50↔900, 100↔800,
 * 200↔700, 300↔600, 400↔500.
 *
 * Used to invert dark-mode ramps. With the flip, a single semantic mapping such
 * as `--color-background-primary → --color-<hue>-600` resolves to a darker shade
 * in light mode and a lighter one in dark mode — no per-mode remapping needed.
 * Pure, immutable, self-inverse.
 */
export function flipRamp(ramp: ColorRamp): ColorRamp {
  const out: Partial<ColorRamp> = {};
  const n = STEPS.length;
  for (let i = 0; i < n; i++) {
    out[STEPS[i] as keyof ColorRamp] = ramp[STEPS[n - 1 - i] as keyof ColorRamp];
  }
  return out as ColorRamp;
}

export function invertForDarkMode(ramp: ColorRamp): ColorRamp {
  const inverted: Partial<ColorRamp> = {};

  STEPS.forEach((step) => {
    const originalColor = toOklch(ramp[step as keyof ColorRamp]);
    if (!originalColor) {
      inverted[step as keyof ColorRamp] = ramp[step as keyof ColorRamp];
      return;
    }

    const newLightness = Math.max(0.08, Math.min(0.95, 1 - originalColor.l));

    inverted[step as keyof ColorRamp] =
      formatHex({
        mode: 'oklch',
        l: newLightness,
        c: (originalColor.c || 0) * 0.95,
        h: originalColor.h || 0,
      }) || ramp[step as keyof ColorRamp];
  });

  return inverted as ColorRamp;
}

const toLrgb = converter('lrgb');

export function getContrastColor(hex: string): string {
  const c = toLrgb(hex);
  if (!c) return '#000000';
  // WCAG relative luminance
  const L = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  // Compare contrast against white vs black
  const contrastWhite = (1.05) / (L + 0.05);
  const contrastBlack = (L + 0.05) / (0.05);
  return contrastWhite >= contrastBlack ? '#ffffff' : '#000000';
}

export function adjustLightness(hex: string, amount: number): string {
  const color = toOklch(hex);
  if (!color) return hex;

  return (
    formatHex({
      mode: 'oklch',
      l: Math.max(0, Math.min(1, color.l + amount)),
      c: color.c || 0,
      h: color.h || 0,
    }) || hex
  );
}
