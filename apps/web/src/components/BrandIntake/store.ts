import { map } from 'nanostores';
import {
  DEFAULT_BODY_WEIGHTS,
  DEFAULT_HEADING_WEIGHT,
  FONT_WEIGHT_OPTIONS,
  initialConfig,
  type BrandConfig,
  type BodyFontWeights,
  type ColorRamp,
  type FontWeight,
  type NeutralColorRamp,
} from '@trellis/generator';

export type TabId = 'color' | 'typography' | 'style';

export type { BrandConfig, BodyFontWeights, ColorRamp, FontWeight, NeutralColorRamp };
export {
  DEFAULT_BODY_WEIGHTS,
  DEFAULT_HEADING_WEIGHT,
  FONT_WEIGHT_OPTIONS,
  initialConfig,
};

export const $brandConfig = map<BrandConfig>(initialConfig);

export function updateConfig(updates: Partial<BrandConfig>) {
  $brandConfig.set({ ...$brandConfig.get(), ...updates });
}

export function updateRampStep(rampKey: string, step: number, color: string) {
  const current = $brandConfig.get();
  const existing = current.rampOverrides[rampKey] ?? {};
  $brandConfig.set({
    ...current,
    rampOverrides: {
      ...current.rampOverrides,
      [rampKey]: { ...existing, [step]: color },
    },
  });
}

export function resetConfig() {
  $brandConfig.set(initialConfig);
}
