# @trellis/generator

Pure TypeScript library that turns a small `BrandConfig` (a few colors, a couple of fonts, some style knobs) into a full design-token system: OKLCH primitive ramps, semantic tokens with WCAG-AA-validated contrast pairings, and exporters for CSS, [DTCG](https://design-tokens.github.io/community-group/format/) JSON, Tailwind, and shadcn-style themes.

It has no DOM dependencies — it runs in Node, in the browser, or inside the [`@trellis/web`](../../apps/web/) Configurator that ships in this repo.

## Install (workspace use)

The `@trellis/web` package already depends on it via `workspace:*`. To consume it from another workspace package, add:

```jsonc
// package.json
"dependencies": {
  "@trellis/generator": "workspace:*"
}
```

The package is built to `dist/` and exports its public surface from [`src/index.ts`](src/index.ts).

## Quick start

One-shot: produce tokens and exported artifacts in a single call.

```ts
import { generateTheme } from '@trellis/generator';

const theme = generateTheme(
  {
    primaryColor: '#2e7bab',
    primaryFont: 'Inter',
    headingFont: 'Cormorant Garamond',
  },
  { formats: ['css', 'shadcn'], colorSpace: 'oklch' },
);

theme.tokens.light;             // Record<string, string> of CSS custom properties
theme.tokens.dark;
theme.artifacts[0].content;     // CSS string with :root + :root[data-theme="dark"]
theme.artifacts[1].content;     // shadcn-style @layer base output
```

Step-by-step: build the config, generate light/dark token sets, then export.

```ts
import {
  createBrandConfig,
  generateDesignTokens,
  exportTokens,
  validateWcagAaContrast,
} from '@trellis/generator';

const config = createBrandConfig({ primaryColor: '#2e7bab' });

const light = generateDesignTokens(config, false).tokens;
const dark  = generateDesignTokens(config, true).tokens;

const css = exportTokens({ light, dark }, 'css', 'oklch');

const failures = validateWcagAaContrast(light); // [] when all pairs pass AA
```

## Public API surface

| Symbol | What it does |
|---|---|
| `createBrandConfig(input)` | Merges partial input with `initialConfig` defaults; safe for all-optional input. |
| `generateDesignTokens(config, isDark)` | Returns `{ tokens, semanticMap }`. `semanticMap` records which primitive each semantic token resolves to (used by the inspector UI). |
| `generateTheme(input, options)` | Convenience wrapper: builds the config, both modes, and any requested export artifacts in one call. |
| `exportTokens(tokens, format, colorSpace, options?)` | `format`: `'css' \| 'dtcg' \| 'tailwind' \| 'shadcn'`. `colorSpace`: `'hex' \| 'rgb' \| 'hsl' \| 'oklch'`. |
| `generateRamp`, `generateOklchRamp`, `generateNeutralRamp` | Lower-level OKLCH ramp builders. |
| `getGeneratedColor(hex, mode)` | Compute a complementary / triadic / analogous / etc. partner from a base color. |
| `validateWcagAaContrast(tokens, pairs?)` | Returns failing `ContrastValidationFailure[]` for the default 16 semantic pairs, or for a custom list. |
| `pickContrastingFg(bg, ramp, isDark)` | Walk a ramp until a step meets WCAG AA against a background. |
| `NAMED_HUES`, `STEPS`, `NEUTRAL_STEPS`, `GENERATION_MODES`, `SEMANTIC_HUES` | Constant tables consumed by the generator and re-exported for UI use. |

Types: `BrandConfig`, `BrandConfigInput`, `ColorRamp`, `NeutralColorRamp`, `TokenSet`, `ExportFormat`, `ColorSpace`, `PrimitiveMapping`, `ContrastPair`, `ContrastValidationFailure`, `GenerationMode`.

## Source layout

```
src/
├── index.ts            # Public exports + generateTheme()
├── types.ts            # BrandConfig, defaults, createBrandConfig()
├── colorUtils.ts       # STEPS, ColorRamp types, generateRamp, helpers
├── colorGeneration.ts  # OKLCH math: gamut clamp, Gaussian chroma, hue allocation
├── contrastUtils.ts    # pickStep / pickContrastingFg
├── generateTokens.ts   # Semantic mapping → CSS custom properties (light + dark)
├── exportTokens.ts     # Format-specific writers (CSS, DTCG, Tailwind, shadcn)
├── accessibility.ts    # WCAG AA validation against the 16 default pairs
└── culori.d.ts         # Local types for the subset of culori we use
```

## Scripts

```bash
pnpm --filter @trellis/generator build   # tsc → dist/
pnpm --filter @trellis/generator test    # vitest run
```

The single test in [`test/generator.test.ts`](test/generator.test.ts) covers config normalization, deterministic token output, all four export formats, and the AA contrast guarantees for both modes.

## Implementation notes

- Color math is OKLCH-first via [culori](https://culorijs.org/). Lightness targets in [colorGeneration.ts](src/colorGeneration.ts) are tuned so that primary/status backgrounds land near step 600 in light mode and step 400 in dark mode, which keeps neutral-0 foregrounds above 4.5:1 contrast without per-token overrides.
- Semantic tokens are emitted as `var(--color-<hue>-<step>)` references rather than literal hex, so consumers can edit primitives without rebuilding the whole token set.
- Exporters share a single category mapping (`primitive-color`, `background`, `border`, `foreground`, `interactive`, `chart`, `gradient`, `font`, `space`, `typography`, `dimension`, `shape`, `shadow`, `state`, `transition`, `other`), so output ordering and grouping stay consistent across formats.
