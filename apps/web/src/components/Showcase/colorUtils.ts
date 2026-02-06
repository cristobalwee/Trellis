import { converter, formatHex } from 'culori';

const toOklch = converter('oklch');

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000] as const;

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

export function generateRamp(
  baseHex: string,
  saturation = 100,
  uniformity = 100,
  isNeutral = false
): ColorRamp {
  const base = toOklch(baseHex);
  const ramp: Partial<ColorRamp> = {};

  STEPS.forEach((step) => {
    const t = (step - 50) / 950; // 0 to 1
    const exponent = 1 + (100 - uniformity) / 100;
    const lightness = 0.98 - Math.pow(t, exponent) * (0.98 - 0.32);

    let chroma = base?.c || 0;
    if (isNeutral) {
      chroma = Math.min(chroma, 0.01 + t * 0.01);
    } else {
      chroma *= saturation / 100;
      chroma *= 1 - t * 0.2 * (1 - uniformity / 100);
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

export function getContrastColor(hex: string): string {
  const color = toOklch(hex);
  if (!color) return '#000000';
  return color.l > 0.6 ? '#000000' : '#ffffff';
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
