import { useMemo } from 'react';

import type { BrandConfig } from './store';
import type { ColorRamp, NeutralColorRamp } from '@trellis/generator';
import {
  toOklch,
  getGeneratedColor,
  selectHues,
  generateOklchRamp,
  generateNeutralRamp,
  maxChromaForLH,
  applyChromaGuardrails,
  falloffToSigma,
  flipRamp,
  type ColorMode,
  type HueSlot,
  type HueSelection,
} from '@trellis/generator';

function applyOverrides(ramp: NeutralColorRamp, overrides?: Partial<NeutralColorRamp>): NeutralColorRamp;
function applyOverrides(ramp: ColorRamp, overrides?: Partial<ColorRamp>): ColorRamp;
function applyOverrides(ramp: ColorRamp, overrides?: Partial<ColorRamp>): ColorRamp {
  if (!overrides) return ramp;
  const result = { ...ramp };
  for (const [key, val] of Object.entries(overrides)) {
    if (val) (result as Record<string, string>)[key] = val;
  }
  return result;
}

export interface ColorSlot {
  name: string;
  hue: number;
  isPrimary: boolean;
  ramp: ColorRamp;
}

export interface DerivedColors {
  primaryRamp: ColorRamp;
  secondaryColor: string;
  secondaryRamp: ColorRamp;
  neutralRamp: NeutralColorRamp;
  /** Named hue slots (excluding the primary's slot, which is shown separately). */
  additionalColors: ColorSlot[];
  /** Full hue selection metadata (for debug / tooltips). */
  hueSelection: HueSelection;
  /** Dark mode variants */
  dark: {
    primaryRamp: ColorRamp;
    secondaryRamp: ColorRamp;
    neutralRamp: NeutralColorRamp;
    additionalColors: ColorSlot[];
  } | null;
}

function generateRampsForMode(
  mode: ColorMode,
  primaryH: number,
  primaryC: number,
  primaryL: number,
  sigma: number,
  secondaryColor: string,
  neutralTint: BrandConfig['neutralTint'],
  hueSelection: HueSelection,
  saturationRatio: number,
): {
  primaryRamp: ColorRamp;
  secondaryRamp: ColorRamp;
  neutralRamp: NeutralColorRamp;
  additionalColors: ColorSlot[];
} {
  const opts = { mode, sigma };

  // Primary ramp
  const primaryRamp = generateOklchRamp(
    primaryH, primaryC, primaryL, 0,
    { ...opts, satRatio: saturationRatio },
  );

  // Secondary ramp
  const sec = toOklch(secondaryColor);
  const secMaxC = sec ? maxChromaForLH(sec.l, sec.h || 0) : 0;
  const secSatRatio = secMaxC > 0 ? (sec?.c ?? 0) / secMaxC : 0;
  const secondaryRamp = sec
    ? generateOklchRamp(sec.h || 0, sec.c || 0, sec.l, 0, { ...opts, satRatio: secSatRatio })
    : generateOklchRamp(0, 0, 0.5, 0, opts);

  // Neutral ramp
  const neutralRamp = generateNeutralRamp(primaryH, neutralTint, primaryL, 0, { mode });

  // Additional named hue ramps
  const additionalRamps = hueSelection.selected
    .filter((slot) => !slot.isPrimary)
    .map((slot: HueSlot) => {
      const peakL = mode === 'dark' ? 0.65 : 0.60;
      const hueMaxC = maxChromaForLH(peakL, slot.hue);
      const baseChroma = Math.min(hueMaxC * Math.min(saturationRatio, 1.0), hueMaxC);
      const ramp = generateOklchRamp(slot.hue, baseChroma, peakL, 0, { ...opts, satRatio: saturationRatio });
      return { name: slot.name, hue: slot.hue, isPrimary: false, ramp };
    });

  // Apply chroma guardrails to balance semantic colors
  const balanced = applyChromaGuardrails(additionalRamps);
  const additionalColors: ColorSlot[] = balanced.map((r) => ({
    ...r,
    isPrimary: false,
  }));

  return {
    primaryRamp,
    secondaryRamp,
    neutralRamp,
    additionalColors,
  };
}

export function useColorRamps(config: BrandConfig, isDarkMode = false): DerivedColors {
  const { primaryColor, chromaFalloff } = config;

  // --- Parse primary to OKLCH -------------------------------------------------
  const primaryOklch = useMemo(() => toOklch(primaryColor), [primaryColor]);

  const primaryH = primaryOklch?.h || 0;
  const primaryL = primaryOklch?.l ?? 0.5;
  const primaryC = primaryOklch?.c ?? 0;

  const sigma = useMemo(() => falloffToSigma(chromaFalloff), [chromaFalloff]);

  // --- Saturation ratio -------------------------------------------------------
  const saturationRatio = useMemo(() => {
    const maxC = maxChromaForLH(primaryL, primaryH);
    return maxC > 0 ? primaryC / maxC : 0;
  }, [primaryL, primaryH, primaryC]);

  // --- Secondary --------------------------------------------------------------
  const secondaryColor = useMemo(() => {
    if (config.useCustomSecondary && config.secondaryColor) return config.secondaryColor;
    return getGeneratedColor(primaryColor, config.secondaryGenerationMode || 'complementary');
  }, [primaryColor, config.useCustomSecondary, config.secondaryColor, config.secondaryGenerationMode]);

  const secondaryH = useMemo(() => {
    const sec = toOklch(secondaryColor);
    return sec?.h;
  }, [secondaryColor]);

  // --- Hue selection ----------------------------------------------------------
  const hueSelection = useMemo(() => selectHues(primaryH, secondaryH), [primaryH, secondaryH]);

  // --- Light mode ramps -------------------------------------------------------
  const lightRamps = useMemo(
    () => generateRampsForMode(
      'light', primaryH, primaryC, primaryL, sigma,
      secondaryColor, config.neutralTint, hueSelection, saturationRatio,
    ),
    [primaryH, primaryC, primaryL, sigma, secondaryColor, config.neutralTint, hueSelection, saturationRatio],
  );

  // --- Dark mode ramps --------------------------------------------------------
  const darkRamps = useMemo(
    () => generateRampsForMode(
      'dark', primaryH, primaryC, primaryL, sigma,
      secondaryColor, config.neutralTint, hueSelection, saturationRatio,
    ),
    [primaryH, primaryC, primaryL, sigma, secondaryColor, config.neutralTint, hueSelection, saturationRatio],
  );

  // --- Flip dark-mode chromatic ramps ----------------------------------------
  // Dark mode reuses the same semantic mappings: the chromatic ramps are flipped
  // so the darkest shade sits on the lowest step. The neutral ramp keeps its
  // natural ordering — its surface-elevation hierarchy can't survive a flip.
  const flippedDarkRamps = useMemo(
    () => ({
      primaryRamp: flipRamp(darkRamps.primaryRamp),
      secondaryRamp: flipRamp(darkRamps.secondaryRamp),
      neutralRamp: darkRamps.neutralRamp,
      additionalColors: darkRamps.additionalColors.map((slot) => ({
        ...slot,
        ramp: flipRamp(slot.ramp),
      })),
    }),
    [darkRamps],
  );

  // The active ramp set follows the dark-mode toggle so the picker shows the
  // shades actually emitted for the current mode.
  const activeRamps = isDarkMode ? flippedDarkRamps : lightRamps;

  // --- Apply overrides (after the flip, so an edited swatch stays in place) ---
  const overrides = config.rampOverrides;

  const finalPrimaryRamp = useMemo(
    () => applyOverrides(activeRamps.primaryRamp, overrides.primary),
    [activeRamps.primaryRamp, overrides.primary],
  );

  const finalSecondaryRamp = useMemo(
    () => applyOverrides(activeRamps.secondaryRamp, overrides.secondary),
    [activeRamps.secondaryRamp, overrides.secondary],
  );

  const finalNeutralRamp = useMemo(
    () => applyOverrides(activeRamps.neutralRamp, overrides.neutral as Partial<NeutralColorRamp>),
    [activeRamps.neutralRamp, overrides.neutral],
  );

  const finalAdditionalColors = useMemo(
    (): ColorSlot[] =>
      activeRamps.additionalColors.map((slot) => ({
        ...slot,
        ramp: applyOverrides(slot.ramp, overrides[slot.name]),
      })),
    [activeRamps.additionalColors, overrides],
  );

  return {
    primaryRamp: finalPrimaryRamp,
    secondaryColor,
    secondaryRamp: finalSecondaryRamp,
    neutralRamp: finalNeutralRamp,
    additionalColors: finalAdditionalColors,
    hueSelection,
    dark: flippedDarkRamps,
  };
}
