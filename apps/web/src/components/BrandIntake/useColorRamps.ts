import { useMemo } from 'react';

import type { BrandConfig } from './store';
import type { ColorRamp, NeutralColorRamp } from '../Showcase/colorUtils';
import {
  toOklch,
  getGeneratedColor,
  selectHues,
  generateOklchRamp,
  generateNeutralRamp,
  maxChromaForLH,
  applyChromaGuardrails,
  falloffToSigma,
  type ColorMode,
  type HueSlot,
  type HueSelection,
} from './colorGeneration';

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

  // Primary ramp — pinned in light mode, unpinned in dark
  const primaryRamp = generateOklchRamp(
    primaryH, primaryC, primaryL, 0,
    { ...opts, pin: mode === 'light' },
  );

  // Secondary ramp
  const sec = toOklch(secondaryColor);
  const secondaryRamp = sec
    ? generateOklchRamp(sec.h || 0, sec.c || 0, sec.l, 0, opts)
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
      const ramp = generateOklchRamp(slot.hue, baseChroma, peakL, 0, opts);
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

export function useColorRamps(config: BrandConfig): DerivedColors {
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

  // --- Apply overrides (light mode only — dark mode is auto-generated) --------
  const overrides = config.rampOverrides;

  const finalPrimaryRamp = useMemo(
    () => applyOverrides(lightRamps.primaryRamp, overrides.primary),
    [lightRamps.primaryRamp, overrides.primary],
  );

  const finalSecondaryRamp = useMemo(
    () => applyOverrides(lightRamps.secondaryRamp, overrides.secondary),
    [lightRamps.secondaryRamp, overrides.secondary],
  );

  const finalNeutralRamp = useMemo(
    () => applyOverrides(lightRamps.neutralRamp, overrides.neutral as Partial<NeutralColorRamp>),
    [lightRamps.neutralRamp, overrides.neutral],
  );

  const finalAdditionalColors = useMemo(
    (): ColorSlot[] =>
      lightRamps.additionalColors.map((slot) => ({
        ...slot,
        ramp: applyOverrides(slot.ramp, overrides[slot.name]),
      })),
    [lightRamps.additionalColors, overrides],
  );

  return {
    primaryRamp: finalPrimaryRamp,
    secondaryColor,
    secondaryRamp: finalSecondaryRamp,
    neutralRamp: finalNeutralRamp,
    additionalColors: finalAdditionalColors,
    hueSelection,
    dark: darkRamps,
  };
}
