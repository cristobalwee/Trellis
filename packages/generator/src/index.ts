import { generateDesignTokens } from './generateTokens.js';
import { createBrandConfig, type BrandConfigInput } from './types.js';
import { exportTokens, type ColorSpace, type ExportFormat, type TokenSet } from './exportTokens.js';

export * from './colorGeneration.js';
export * from './colorUtils.js';
export * from './contrastUtils.js';
export * from './accessibility.js';
export * from './exportTokens.js';
export * from './generateTokens.js';
export * from './types.js';

export interface GenerateThemeOptions {
  colorSpace?: ColorSpace;
  formats?: ExportFormat[];
  includeSemantic?: boolean;
}

export interface ThemeArtifact {
  format: ExportFormat;
  content: string;
}

export interface GeneratedTheme {
  config: ReturnType<typeof createBrandConfig>;
  tokens: TokenSet;
  artifacts: ThemeArtifact[];
}

export function generateTheme(
  input: BrandConfigInput = {},
  options: GenerateThemeOptions = {},
): GeneratedTheme {
  const config = createBrandConfig(input);
  const tokens: TokenSet = {
    light: generateDesignTokens(config, false).tokens,
    dark: generateDesignTokens(config, true).tokens,
  };
  const colorSpace = options.colorSpace ?? 'oklch';
  const formats = options.formats ?? [];
  const artifacts = formats.map((format) => ({
    format,
    content: exportTokens(tokens, format, colorSpace, {
      includeSemantic: options.includeSemantic,
    }),
  }));

  return { config, tokens, artifacts };
}
