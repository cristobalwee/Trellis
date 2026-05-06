import { describe, expect, it } from 'vitest';
import {
  createBrandConfig,
  exportTokens,
  generateDesignTokens,
  generateTheme,
  initialConfig,
  validateWcagAaContrast,
  type ExportFormat,
} from '../src/index.js';

describe('@trellis/generator', () => {
  it('normalizes partial brand input without mutating defaults', () => {
    const config = createBrandConfig({
      primaryColor: '#ffcdcf',
      primaryFont: 'Roboto sans',
      statusColors: { success: '#008a45' },
      bodyWeights: { regular: 500 },
    });

    expect(config.primaryColor).toBe('#ffcdcf');
    expect(config.primaryFont).toBe('Roboto sans');
    expect(config.headingFont).toBe(initialConfig.headingFont);
    expect(config.statusColors.success).toBe('#008a45');
    expect(config.statusColors.warning).toBe(initialConfig.statusColors.warning);
    expect(config.bodyWeights.regular).toBe(500);
    expect(config.bodyWeights.bold).toBe(initialConfig.bodyWeights.bold);
    expect(config.rampOverrides).toEqual({});
  });

  it('generates deterministic light and dark token sets', () => {
    const light = generateDesignTokens(initialConfig, false).tokens;
    const dark = generateDesignTokens(initialConfig, true).tokens;
    const lightAgain = generateDesignTokens(initialConfig, false).tokens;

    expect(light).toEqual(lightAgain);
    expect(light['--color-background-base']).toBe('var(--color-neutral-0)');
    expect(dark['--color-background-base']).toBe('var(--color-neutral-800)');
    expect(light['--typography-font-family-body']).toContain(initialConfig.primaryFont);
    expect(Object.keys(light).length).toBeGreaterThan(150);
  });

  it.each<ExportFormat>(['css', 'dtcg', 'tailwind', 'shadcn'])('exports %s artifacts', (format) => {
    const tokens = {
      light: generateDesignTokens(initialConfig, false).tokens,
      dark: generateDesignTokens(initialConfig, true).tokens,
    };
    const output = exportTokens(tokens, format, 'oklch');

    expect(output.length).toBeGreaterThan(500);
    if (format === 'css') expect(output).toContain(':root[data-theme="dark"]');
    if (format === 'dtcg') expect(() => JSON.parse(output)).not.toThrow();
    if (format === 'tailwind') expect(output).toContain('export default');
    if (format === 'shadcn') expect(output).toContain('@layer base');
  });

  it('generates CLI-ready artifacts from one-shot inputs', () => {
    const theme = generateTheme(
      {
        primaryColor: '#ffcdcf',
        primaryFont: 'Roboto sans',
        headingFont: 'Roboto sans',
      },
      { formats: ['css', 'shadcn'], colorSpace: 'hex' },
    );

    expect(theme.config.primaryColor).toBe('#ffcdcf');
    expect(theme.artifacts.map((artifact) => artifact.format)).toEqual(['css', 'shadcn']);
    expect(theme.artifacts[0].content).toContain(':root');
    expect(theme.artifacts[1].content).toContain('--primary');
  });

  it('meets WCAG AA contrast for generated semantic pairs', () => {
    const light = generateDesignTokens(initialConfig, false).tokens;
    const dark = generateDesignTokens(initialConfig, true).tokens;

    expect(validateWcagAaContrast(light)).toEqual([]);
    expect(validateWcagAaContrast(dark)).toEqual([]);
  });
});
