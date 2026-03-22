import { useMemo } from 'react';

import type { BrandConfig } from './store';
import type { ColorRamp } from '../Showcase/colorUtils';
import {
  toOklch,
  getGeneratedColor,
  selectHues,
  generateOklchRamp,
  generateNeutralRamp,
  getAdditionalRampSeed,
  maxChromaForLH,
  type HueSlot,
  type HueSelection,
} from './colorGeneration';

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
  neutralRamp: ColorRamp;
  /** Named hue slots (excluding the primary's slot, which is shown separately). */
  additionalColors: ColorSlot[];
  /** Full hue selection metadata (for debug / tooltips). */
  hueSelection: HueSelection;
}

export function useColorRamps(config: BrandConfig): DerivedColors {
  const { primaryColor, chromaFalloff, uniformity } = config;

  // --- Parse primary to OKLCH -------------------------------------------------
  const primaryOklch = useMemo(() => toOklch(primaryColor), [primaryColor]);

  const primaryH = primaryOklch?.h || 0;
  const primaryL = primaryOklch?.l ?? 0.5;
  const primaryC = primaryOklch?.c ?? 0;

  // --- Chroma falloff (0–1) ---------------------------------------------------
  // Passed directly to generateOklchRamp. The base color is always anchored;
  // only surrounding shades lose chroma toward the ramp extremes.
  const falloff = chromaFalloff / 100;

  // --- Saturation ratio -------------------------------------------------------
  // The primary's chroma relative to the max achievable chroma at its L & H.
  // Non-primary hues use this ratio against their own max chroma so the whole
  // palette feels cohesive.
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

  // --- Primary ramp -----------------------------------------------------------
  const primaryRamp = useMemo(
    () =>
      generateOklchRamp(
        primaryH,
        primaryC,
        primaryL,
        falloff,
        uniformity,
      ),
    [primaryH, primaryC, primaryL, falloff, uniformity],
  );

  const secondaryRamp = useMemo(() => {
    const sec = toOklch(secondaryColor);
    if (!sec) return generateOklchRamp(0, 0, 0.5, falloff, uniformity);
    return generateOklchRamp(
      sec.h || 0,
      sec.c || 0,
      sec.l,
      falloff,
      uniformity,
    );
  }, [secondaryColor, falloff, uniformity]);

  // --- Neutral ----------------------------------------------------------------
  const neutralRamp = useMemo(
    () => generateNeutralRamp(primaryH, config.neutralTint, primaryL, falloff, uniformity),
    [primaryH, config.neutralTint, primaryL, falloff, uniformity],
  );

  // --- Additional named hue ramps --------------------------------------------
  // Every selected hue except the primary's slot (which is already displayed
  // as "Primary"). Each ramp's base chroma is derived from the primary's
  // saturation ratio applied to that hue's maximum gamut chroma.
  const additionalColors = useMemo((): ColorSlot[] => {
    return hueSelection.selected
      .filter((slot) => !slot.isPrimary)
      .map((slot: HueSlot) => {
        const { baseL, baseChroma } = getAdditionalRampSeed(
          slot.name,
          slot.hue,
          primaryL,
          saturationRatio,
        );
        const ramp = generateOklchRamp(
          slot.hue,
          baseChroma,
          baseL,
          falloff,
          uniformity,
        );
        return {
          name: slot.name,
          hue: slot.hue,
          isPrimary: false,
          ramp,
        };
      });
  }, [hueSelection, primaryL, saturationRatio, falloff, uniformity]);

  return {
    primaryRamp,
    secondaryColor,
    secondaryRamp,
    neutralRamp,
    additionalColors,
    hueSelection,
  };
}