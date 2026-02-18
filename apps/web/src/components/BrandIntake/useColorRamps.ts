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

// Default chroma falloff (how much chroma decreases toward ramp extremes).
// Hardcoded for now; could be exposed as an advanced slider later.
const CHROMA_FALLOFF = 0.8;

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
  const { primaryColor, saturation, uniformity } = config;

  // --- Parse primary to OKLCH -------------------------------------------------
  const primaryOklch = useMemo(() => toOklch(primaryColor), [primaryColor]);

  const primaryH = primaryOklch?.h || 0;
  const primaryL = primaryOklch?.l ?? 0.5;
  const primaryC = primaryOklch?.c ?? 0;

  // --- Saturation ratio -------------------------------------------------------
  // The primary's chroma relative to the max achievable chroma at its L & H.
  // Non-primary hues use this ratio against their own max chroma so the whole
  // palette feels cohesive.  The saturation slider scales the ratio further.
  const saturationRatio = useMemo(() => {
    const maxC = maxChromaForLH(primaryL, primaryH);
    const naturalRatio = maxC > 0 ? primaryC / maxC : 0;
    return naturalRatio * (saturation / 100);
  }, [primaryL, primaryH, primaryC, saturation]);

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
        primaryC * (saturation / 100),
        primaryL,
        CHROMA_FALLOFF,
        uniformity,
      ),
    [primaryH, primaryC, primaryL, saturation, uniformity],
  );

  const secondaryRamp = useMemo(() => {
    const sec = toOklch(secondaryColor);
    if (!sec) return generateOklchRamp(0, 0, 0.5, CHROMA_FALLOFF, uniformity);
    return generateOklchRamp(
      sec.h || 0,
      (sec.c || 0) * (saturation / 100),
      sec.l,
      CHROMA_FALLOFF,
      uniformity,
    );
  }, [secondaryColor, saturation, uniformity]);

  // --- Neutral ----------------------------------------------------------------
  const neutralRamp = useMemo(
    () => generateNeutralRamp(primaryH, config.neutralTint, primaryL, CHROMA_FALLOFF, uniformity),
    [primaryH, config.neutralTint, primaryL, uniformity],
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
          CHROMA_FALLOFF,
          uniformity,
        );
        return {
          name: slot.name,
          hue: slot.hue,
          isPrimary: false,
          ramp,
        };
      });
  }, [hueSelection, primaryL, saturationRatio, uniformity]);

  return {
    primaryRamp,
    secondaryColor,
    secondaryRamp,
    neutralRamp,
    additionalColors,
    hueSelection,
  };
}
