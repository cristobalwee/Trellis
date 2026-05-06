import { parse, formatHex, formatRgb, formatHsl, converter } from 'culori';
import { HUE_NAMES } from './generateTokens.js';
import { NAMED_HUES } from './colorGeneration.js';
import type { BrandConfig } from './types.js';

// ---------------------------------------------------------------------------
// Color-space formatting
// ---------------------------------------------------------------------------

export type ColorSpace = 'hex' | 'rgb' | 'hsl' | 'oklch';

const toOklch = converter('oklch');

function formatColor(raw: string, space: ColorSpace): string {
  const parsed = parse(raw);
  if (!parsed) return raw;
  if (space === 'hex') return formatHex(parsed) || raw;
  if (space === 'rgb') return formatRgb(parsed) || raw;
  if (space === 'hsl') return formatHsl(parsed) || raw;
  const o = toOklch(parsed);
  if (!o) return raw;
  const l = o.l.toFixed(4);
  const c = o.c.toFixed(4);
  const h = (o.h ?? 0).toFixed(4);
  return `oklch(${l} ${c} ${h})`;
}

function isColorLiteral(v: string): boolean {
  const t = v.trim();
  return /^#[0-9a-f]{3,8}$/i.test(t) || /^(rgb|rgba|hsl|hsla|oklch|lch|lab)\(/i.test(t);
}

function convertLiteral(raw: string, space: ColorSpace): string {
  const t = raw.trim();
  if (t.startsWith('linear-gradient') || t.startsWith('radial-gradient')) return raw;
  if (!isColorLiteral(t)) return raw;
  // rgba/hsla with alpha — keep as-is to preserve transparency (OKLCH has no alpha literal parity here)
  if (/^rgba?\([^)]*,[^)]*,[^)]*,/.test(t) || /^hsla?\([^)]*,[^)]*,[^)]*,/.test(t)) {
    if (space === 'rgb' || space === 'hsl') return raw;
  }
  return formatColor(t, space);
}

// ---------------------------------------------------------------------------
// Primitive vs semantic classification
// ---------------------------------------------------------------------------

const HUE_PATTERN = new RegExp(`^--color-(${HUE_NAMES.join('|')})-(\\d+)$`);

function parsePrimitive(prop: string): { hue: string; step: string } | null {
  const m = prop.match(HUE_PATTERN);
  return m ? { hue: m[1], step: m[2] } : null;
}

function isPrimitiveColorToken(prop: string): boolean {
  return parsePrimitive(prop) !== null;
}

function isSemanticColorToken(prop: string): boolean {
  return prop.startsWith('--color-') && !isPrimitiveColorToken(prop);
}

// ---------------------------------------------------------------------------
// var() reference handling
// ---------------------------------------------------------------------------

const VAR_REF_RE = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/;

function varReferencedName(value: string): string | null {
  const m = value.trim().match(VAR_REF_RE);
  return m ? m[1] : null;
}

/** Follow `var(...)` indirection until a literal is reached. */
function resolveVar(value: string, tokens: Record<string, string>, depth = 0): string {
  if (depth > 8) return value;
  const ref = varReferencedName(value);
  if (!ref) return value;
  const next = tokens[ref];
  if (next === undefined) return value;
  return resolveVar(next, tokens, depth + 1);
}

// ---------------------------------------------------------------------------
// Tokens input
// ---------------------------------------------------------------------------

export interface TokenSet {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export type ExportFormat = 'css' | 'dtcg' | 'tailwind' | 'shadcn';

// ---------------------------------------------------------------------------
// Category mapping (mirrors the ordering in `utils/tokens.css`)
// ---------------------------------------------------------------------------

type Category =
  | 'primitive-color'
  | 'background'
  | 'border'
  | 'foreground'
  | 'interactive'
  | 'chart'
  | 'gradient'
  | 'font'
  | 'space'
  | 'typography'
  | 'dimension'
  | 'shape'
  | 'shadow'
  | 'state'
  | 'transition'
  | 'other';

const CATEGORY_ORDER: Category[] = [
  'primitive-color',
  'background',
  'border',
  'foreground',
  'interactive',
  'chart',
  'gradient',
  'font',
  'space',
  'typography',
  'dimension',
  'shape',
  'shadow',
  'state',
  'transition',
  'other',
];

const CATEGORY_LABELS: Record<Category, string> = {
  'primitive-color': 'Color primitives',
  'background':     'Semantic background tokens',
  'border':         'Semantic border tokens',
  'foreground':     'Semantic foreground tokens',
  'interactive':    'Interactive tokens',
  'chart':          'Chart tokens',
  'gradient':       'Gradient tokens',
  'font':           'Font tokens',
  'space':          'Space tokens',
  'typography':     'Typography tokens',
  'dimension':      'Dimension tokens',
  'shape':          'Shape tokens',
  'shadow':         'Shadow tokens',
  'state':          'State tokens',
  'transition':     'Transition tokens',
  'other':          'Other',
};

function categorize(prop: string): Category {
  if (isPrimitiveColorToken(prop))                return 'primitive-color';
  if (prop.startsWith('--color-background-'))     return 'background';
  if (prop.startsWith('--color-border-'))         return 'border';
  if (prop.startsWith('--color-foreground-'))     return 'foreground';
  if (prop.startsWith('--color-interactive-'))    return 'interactive';
  if (prop.startsWith('--color-chart-'))          return 'chart';
  if (prop.startsWith('--color-'))                return 'foreground'; // fallback bucket
  if (prop.startsWith('--gradient-'))             return 'gradient';
  if (prop.startsWith('--font-'))                 return 'font';
  if (prop.startsWith('--space-'))                return 'space';
  if (prop.startsWith('--typography-'))           return 'typography';
  if (prop.startsWith('--dimension-'))            return 'dimension';
  if (prop.startsWith('--shape-'))                return 'shape';
  if (prop.startsWith('--shadow-'))               return 'shadow';
  if (prop.startsWith('--state-'))                return 'state';
  if (prop.startsWith('--transition-'))           return 'transition';
  return 'other';
}

function groupByCategory(tokens: Record<string, string>): Record<Category, [string, string][]> {
  const groups = Object.fromEntries(
    CATEGORY_ORDER.map((c) => [c, [] as [string, string][]]),
  ) as Record<Category, [string, string][]>;
  for (const entry of Object.entries(tokens)) {
    groups[categorize(entry[0])].push(entry);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// CSS export
// ---------------------------------------------------------------------------

/**
 * Format a single token value for CSS output.
 *
 * - `var(...)` references: emitted verbatim so the downstream cascade resolves them.
 * - Color literals (hex / rgb / hsl / oklch): converted to the requested space.
 * - Other values (duration strings, shadow shorthands, gradients, etc.): untouched.
 */
function formatCssValue(prop: string, raw: string, space: ColorSpace): string {
  if (varReferencedName(raw)) return raw;
  if (prop.startsWith('--color-') && isColorLiteral(raw)) return convertLiteral(raw, space);
  return raw;
}

function categoryBlockLines(
  tokens: Record<string, string>,
  space: ColorSpace,
  includeSemantic: boolean,
): string[] {
  const groups = groupByCategory(tokens);
  const lines: string[] = [];
  let firstSection = true;

  for (const category of CATEGORY_ORDER) {
    if (!includeSemantic && category !== 'primitive-color') continue;
    const entries = groups[category];
    if (entries.length === 0) continue;

    if (!firstSection) lines.push('');
    firstSection = false;
    lines.push(`  /* ${CATEGORY_LABELS[category]} */`);
    for (const [prop, raw] of entries) {
      lines.push(`  ${prop}: ${formatCssValue(prop, raw, space)};`);
    }
  }
  return lines;
}

function cssBlock(
  selector: string,
  tokens: Record<string, string>,
  space: ColorSpace,
  includeSemantic: boolean,
): string {
  const body = categoryBlockLines(tokens, space, includeSemantic);
  return [`${selector} {`, ...body, '}'].join('\n');
}

/**
 * Diff between light and dark token sets.
 *
 * Because semantic tokens are emitted as `var(--color-<hue>-<step>)`, the
 * diff captures:
 *   1. Primitive hex values that differ per mode (re-emitted for the dark ramp).
 *   2. Semantic tokens whose *chosen ramp step* changes across modes (the
 *      var() reference points at a different step in dark mode).
 */
function diffFromLight(
  light: Record<string, string>,
  dark: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [prop, raw] of Object.entries(dark)) {
    if (light[prop] !== raw) out[prop] = raw;
  }
  return out;
}

function exportCSS(set: TokenSet, space: ColorSpace, includeSemantic: boolean): string {
  const light = cssBlock(':root', set.light, space, includeSemantic);
  const darkOverrides = diffFromLight(set.light, set.dark);
  const dark = cssBlock(':root[data-theme="dark"]', darkOverrides, space, includeSemantic);
  return `${light}\n\n${dark}`;
}

// ---------------------------------------------------------------------------
// DTCG JSON export
// ---------------------------------------------------------------------------

function dtcgTypeFor(prop: string): string {
  if (prop.startsWith('--color-'))         return 'color';
  if (prop.startsWith('--gradient-'))      return 'other';
  if (prop.startsWith('--font-')) {
    if (prop.endsWith('-family'))          return 'fontFamily';
    if (prop.includes('-weight'))          return 'fontWeight';
    if (prop.includes('-size'))            return 'dimension';
    if (prop.includes('-lineheight'))      return 'other';
    return 'other';
  }
  if (prop.startsWith('--typography-')) {
    if (prop.includes('-family'))          return 'fontFamily';
    if (prop.startsWith('--typography-weight-')) return 'fontWeight';
    return 'dimension';
  }
  if (prop.startsWith('--space-'))         return 'dimension';
  if (prop.startsWith('--dimension-'))     return 'dimension';
  if (prop.startsWith('--shape-'))         return 'dimension';
  if (prop.startsWith('--shadow-'))        return 'shadow';
  if (prop.startsWith('--state-'))         return 'other';
  if (prop.startsWith('--transition-'))    return 'other';
  return 'other';
}

/** Convert a `var(--foo-bar-baz)` reference into a DTCG reference `{foo.bar.baz}`. */
function dtcgReferenceFor(value: string): string | null {
  const name = varReferencedName(value);
  if (!name) return null;
  return `{${name.replace(/^--/, '').split('-').join('.')}}`;
}

function dtcgValue(prop: string, value: string, space: ColorSpace): string {
  const ref = dtcgReferenceFor(value);
  if (ref) return ref;
  if (prop.startsWith('--color-') && isColorLiteral(value)) return convertLiteral(value, space);
  return value;
}

function tokenPath(prop: string): string[] {
  return prop.replace(/^--/, '').split('-');
}

function insertDTCG(
  root: Record<string, unknown>,
  prop: string,
  value: string,
  space: ColorSpace,
) {
  const parts = tokenPath(prop);
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cursor[parts[i]]) cursor[parts[i]] = {};
    cursor = cursor[parts[i]] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = {
    $type: dtcgTypeFor(prop),
    $value: dtcgValue(prop, value, space),
  };
}

function buildDTCG(tokens: Record<string, string>, space: ColorSpace) {
  const primitive: Record<string, unknown> = {};
  const semantic: Record<string, unknown> = {};
  for (const [prop, val] of Object.entries(tokens)) {
    const bucket = isPrimitiveColorToken(prop) ? primitive : semantic;
    insertDTCG(bucket, prop, val, space);
  }
  return { primitive, semantic };
}

function exportDTCG(set: TokenSet, space: ColorSpace): string {
  const obj = {
    light: buildDTCG(set.light, space),
    dark: buildDTCG(set.dark, space),
  };
  return JSON.stringify(obj, null, 2);
}

// ---------------------------------------------------------------------------
// Tailwind export
// ---------------------------------------------------------------------------

/**
 * Build a Tailwind `colors` block.
 *
 * Primitive ramps emit concrete hex values (so `bg-blue-500` etc. work even
 * without CSS-var runtime). Semantic entries reference the CSS variables so
 * that dark-mode and runtime theme switches stay reactive through the same
 * `:root[data-theme="dark"]` selector emitted by the CSS export.
 */
function buildColorGroups(tokens: Record<string, string>, space: ColorSpace) {
  const primitives: Record<string, Record<string, string>> = {};
  const semantic: Record<string, string | Record<string, string>> = {};

  for (const [prop, raw] of Object.entries(tokens)) {
    if (!prop.startsWith('--color-')) continue;
    const primParts = parsePrimitive(prop);
    if (primParts) {
      if (!primitives[primParts.hue]) primitives[primParts.hue] = {};
      primitives[primParts.hue][primParts.step] = convertLiteral(raw, space);
      continue;
    }
    const rest = prop.slice('--color-'.length);
    const [group, ...tail] = rest.split('-');
    const semanticValue = `var(${prop})`;
    if (tail.length === 0) {
      semantic[group] = semanticValue;
    } else {
      if (typeof semantic[group] !== 'object') semantic[group] = {};
      (semantic[group] as Record<string, string>)[tail.join('-')] = semanticValue;
    }
  }
  return { primitives, semantic };
}

function serializeGroup(
  map: Record<string, string | Record<string, string>>,
  indent: string,
): string {
  return Object.entries(map)
    .map(([k, v]) => {
      if (typeof v === 'string') return `${indent}'${k}': '${v}'`;
      const inner = Object.entries(v)
        .map(([kk, vv]) => `${indent}  ${/^\d+$/.test(kk) ? kk : `'${kk}'`}: '${vv}'`)
        .join(',\n');
      return `${indent}'${k}': {\n${inner}\n${indent}}`;
    })
    .join(',\n');
}

function exportTailwind(set: TokenSet, space: ColorSpace): string {
  const { primitives, semantic } = buildColorGroups(set.light, space);
  const primitivesSerialized = serializeGroup(primitives, '        ');
  const semanticSerialized = serializeGroup(semantic, '        ');

  return `/** @type {import('tailwindcss').Config} */
/* Primitive ramps are concrete hex values; semantic tokens reference CSS vars
   defined by the generated :root / :root[data-theme="dark"] blocks, so
   dark-mode and runtime edits flow through naturally. */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        /* Primitive ramps */
${primitivesSerialized},
        /* Semantic tokens */
${semanticSerialized}
      }
    }
  }
}`;
}

// ---------------------------------------------------------------------------
// shadcn export — uses shadcn-canonical semantic variable names
// ---------------------------------------------------------------------------

type ShadcnEntry = [string, string];
type MaybeEntry = [string, string | undefined];

/** Resolve a semantic token to its concrete hex (following var() indirection). */
function resolved(tokens: Record<string, string>, prop: string): string | undefined {
  const v = tokens[prop];
  return v ? resolveVar(v, tokens) : undefined;
}

function shadcnSemantic(tokens: Record<string, string>, isDark: boolean): ShadcnEntry[] {
  const t = (k: string) => resolved(tokens, `--color-${k}`);
  const neutralStep = (step: number) => tokens[`--color-neutral-${step}`];
  const secondary = isDark ? neutralStep(800) : neutralStep(100);
  const input = isDark ? neutralStep(700) : neutralStep(200);

  // shadcn's chart palette intentionally reaches across the brand + status
  // palette; look up via semantic tokens so it tracks the user's configured
  // primary/accent/status hues rather than hard-coded role names.
  const chart = (name: string) => t(`background-${name}`) ?? '';

  const entries: MaybeEntry[] = [
    ['--background',                  t('background-base')],
    ['--foreground',                  t('foreground-onBase')],
    ['--card',                        t('background-raised')],
    ['--card-foreground',             t('foreground-onRaised')],
    ['--popover',                     t('background-overlay')],
    ['--popover-foreground',          t('foreground-onBase')],
    ['--primary',                     t('background-primary')],
    ['--primary-foreground',          t('foreground-onPrimary')],
    ['--secondary',                   secondary],
    ['--secondary-foreground',        t('foreground-onBase')],
    ['--muted',                       t('background-sunken')],
    ['--muted-foreground',            t('foreground-onBaseMuted')],
    ['--accent',                      t('background-accent')],
    ['--accent-foreground',           t('foreground-onAccent')],
    ['--destructive',                 t('background-critical')],
    ['--destructive-foreground',      t('foreground-onCritical')],
    ['--border',                      isDark ? neutralStep(700) : neutralStep(200)],
    ['--input',                       input],
    ['--ring',                        t('background-primary')],
    ['--chart-1',                     chart('primary')],
    ['--chart-2',                     chart('accent')],
    ['--chart-3',                     chart('success')],
    ['--chart-4',                     chart('warning')],
    ['--chart-5',                     chart('info')],
    ['--sidebar',                     t('background-sunken')],
    ['--sidebar-foreground',          t('foreground-onSunken')],
    ['--sidebar-primary',             t('background-primary')],
    ['--sidebar-primary-foreground',  t('foreground-onPrimary')],
    ['--sidebar-accent',              t('background-accent')],
    ['--sidebar-accent-foreground',   t('foreground-onAccent')],
    ['--sidebar-border',              isDark ? neutralStep(700) : neutralStep(200)],
    ['--sidebar-ring',                t('background-primary')],
  ];
  return entries.filter((e): e is ShadcnEntry => typeof e[1] === 'string' && e[1].length > 0);
}

function shadcnExtras(tokens: Record<string, string>): ShadcnEntry[] {
  const fontPrimaryRaw = tokens['--typography-font-family-body'] || "system-ui, sans-serif";
  const fontPrimary = fontPrimaryRaw.replace(/^'|'$/g, '');
  const radiusContainer = resolveVar(tokens['--shape-radius-container'] || '0.5rem', tokens);
  return [
    ['--font-sans',         fontPrimary],
    ['--font-serif',        `"Lora", Georgia, serif`],
    ['--font-mono',         `"Fira Code", "Courier New", monospace`],
    ['--radius',            radiusContainer],
    ['--shadow-x',          '1px'],
    ['--shadow-y',          '2px'],
    ['--shadow-blur',       '5px'],
    ['--shadow-spread',     '1px'],
    ['--shadow-opacity',    '0.06'],
    ['--shadow-color',      'hsl(0 0% 0%)'],
    ['--shadow-2xs',        '1px 2px 5px 1px hsl(0 0% 0% / 0.03)'],
    ['--shadow-xs',         '1px 2px 5px 1px hsl(0 0% 0% / 0.03)'],
    ['--shadow-sm',         '1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 1px 2px 0px hsl(0 0% 0% / 0.06)'],
    ['--shadow',            '1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 1px 2px 0px hsl(0 0% 0% / 0.06)'],
    ['--shadow-md',         '1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 2px 4px 0px hsl(0 0% 0% / 0.06)'],
    ['--shadow-lg',         '1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 4px 6px 0px hsl(0 0% 0% / 0.06)'],
    ['--shadow-xl',         '1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 8px 10px 0px hsl(0 0% 0% / 0.06)'],
    ['--shadow-2xl',        '1px 2px 5px 1px hsl(0 0% 0% / 0.15)'],
    ['--tracking-normal',   '0em'],
    ['--spacing',           '0.25rem'],
  ];
}

function shadcnPrimitives(tokens: Record<string, string>, space: ColorSpace): ShadcnEntry[] {
  return Object.entries(tokens)
    .filter(([p]) => isPrimitiveColorToken(p))
    .map(([prop, v]) => {
      const name = prop.replace('--color-', '--');
      return [name, convertLiteral(v, space)] as ShadcnEntry;
    });
}

function renderShadcnBlock(selector: string, sections: { label: string; entries: ShadcnEntry[] }[], space: ColorSpace): string {
  const lines = [`  ${selector} {`];
  sections.forEach((section, i) => {
    if (i > 0) lines.push('');
    lines.push(`    /* ${section.label} */`);
    for (const [prop, raw] of section.entries) {
      const value = /^(#|rgb|hsl|oklch|lab|lch)/i.test(raw.trim()) ? convertLiteral(raw, space) : raw;
      lines.push(`    ${prop}: ${value};`);
    }
  });
  lines.push('  }');
  return lines.join('\n');
}

function exportShadcn(set: TokenSet, space: ColorSpace): string {
  const lightBlock = renderShadcnBlock(
    ':root',
    [
      { label: 'Primitive tokens', entries: shadcnPrimitives(set.light, space) },
      { label: 'Semantic tokens',  entries: shadcnSemantic(set.light, false) },
      { label: 'Typography, radius, shadows, spacing', entries: shadcnExtras(set.light) },
    ],
    space,
  );
  const darkBlock = renderShadcnBlock(
    '.dark',
    [
      { label: 'Primitive tokens', entries: shadcnPrimitives(set.dark, space) },
      { label: 'Semantic tokens',  entries: shadcnSemantic(set.dark, true) },
    ],
    space,
  );
  return `@layer base {\n${lightBlock}\n\n${darkBlock}\n}`;
}

// ---------------------------------------------------------------------------
// Guide (markdown) export
// ---------------------------------------------------------------------------

const FORMAT_DISPLAY_NAMES: Record<ExportFormat, string> = {
  css:      'CSS',
  dtcg:     'DTCG JSON',
  tailwind: 'Tailwind',
  shadcn:   'shadcn',
};

/** Find the closest NAMED_HUES entry for an OKLCH hue angle. */
function findNearestNamedHue(hue: number): { name: string; hue: number } {
  const normalized = ((hue % 360) + 360) % 360;
  let best = NAMED_HUES[0];
  let bestDist = 360;
  for (const nh of NAMED_HUES) {
    const diff = Math.abs(normalized - nh.hue);
    const dist = Math.min(diff, 360 - diff);
    if (dist < bestDist) {
      bestDist = dist;
      best = nh;
    }
  }
  return best;
}

/** Extract the set of primitive hue names emitted in a token map. */
function extractEmittedHues(tokens: Record<string, string>): string[] {
  const hues = new Set<string>();
  for (const prop of Object.keys(tokens)) {
    const m = prop.match(/^--color-([a-z]+)-\d+$/);
    if (m) hues.add(m[1]);
  }
  return Array.from(hues);
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

/** Return the first token name that exists in the map, or `fallback` if none do. */
function pickToken(tokens: Record<string, string>, candidates: string[], fallback: string): string {
  for (const name of candidates) {
    if (name in tokens) return name;
  }
  return fallback;
}

/**
 * Resolve a token's value to a trimmed pixel string (e.g. `"8px"`) by
 * following a single `var(--…)` hop if present. Falls back to `"?px"` for
 * tokens that don't resolve — the guide treats these as informational and
 * continues to reference the token name verbatim.
 */
function resolvePx(tokens: Record<string, string>, name: string): string {
  const raw = tokens[name];
  if (!raw) return '?px';
  const m = raw.match(/^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/);
  const value = m ? tokens[m[1]] ?? raw : raw;
  return value.trim();
}

/** Pad-right a string to a fixed width so generated tables line up in a monospace block. */
function padRight(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

/**
 * Generate a human- and LLM-readable markdown guide describing the configured
 * token system: hue palette, token architecture, interactive-state model,
 * usage quick reference, and the cascade-layer convention.
 *
 * Pure: takes the current `BrandConfig` and generated `TokenSet` and produces
 * a string. No new dependencies — re-uses the OKLCH parser already imported
 * for color conversion and the `NAMED_HUES` table used by the ramp generator.
 */
export function generateGuide(
  config: BrandConfig,
  set: TokenSet,
  lastFormat: ExportFormat | null = null,
): string {
  // System identity — pull an explicit name off the config if the intake ever
  // exposes one, otherwise fall back to "Your" so the header reads naturally
  // ("Your Design Tokens").
  const systemName = (config as { systemName?: string }).systemName || 'Your';

  // Primary hue identification.
  const oklch = toOklch(parse(config.primaryColor) ?? config.primaryColor);
  const primaryAngle = oklch ? (((oklch.h ?? 0) % 360) + 360) % 360 : 0;
  const primaryNamed = findNearestNamedHue(primaryAngle);
  const primaryHueKey = primaryNamed.name.toLowerCase();

  // All emitted primitive ramps (minus `neutral`, surfaced separately).
  const emittedHues = extractEmittedHues(set.light);
  const supportingHues = emittedHues
    .filter((h) => h !== 'neutral' && h !== primaryHueKey)
    .map(capitalize);

  const tokenCount = Object.keys(set.light).length;

  const formatPhrase = lastFormat
    ? `most recently exported as ${FORMAT_DISPLAY_NAMES[lastFormat]}`
    : 'available in CSS, DTCG JSON, Tailwind, and shadcn formats';

  // Resolve usage-reference tokens against what actually got emitted so the
  // guide is accurate for partial configurations (e.g. when a role was
  // collapsed into the primary hue and its dedicated token didn't ship).
  const bgBase     = pickToken(set.light, ['--color-background-base'],        '--color-background-base');
  const bgRaised   = pickToken(set.light, ['--color-background-raised'],      '--color-background-raised');
  const bgOverlay  = pickToken(set.light, ['--color-background-overlay'],     '--color-background-overlay');
  const bgSunken   = pickToken(set.light, ['--color-background-sunken'],      '--color-background-sunken');
  const bgPrimary  = pickToken(set.light, ['--color-background-primary'],     '--color-background-primary');
  const fgOnPri    = pickToken(set.light, ['--color-foreground-onPrimary'],   '--color-foreground-onPrimary');
  const fgOnBase   = pickToken(set.light, ['--color-foreground-onBase'],      '--color-foreground-onBase');
  const fgMuted    = pickToken(set.light, ['--color-foreground-onBaseMuted'], '--color-foreground-onBaseMuted');
  const fgPrimary  = pickToken(set.light, ['--color-foreground-primary'],     '--color-foreground-primary');
  const borderTok  = pickToken(set.light, ['--color-border-neutral', '--color-border-strong'], '--color-border-neutral');

  const supportingLine = supportingHues.length > 0
    ? supportingHues.map((h) => `\`${h}\``).join(', ')
    : '_(none — primary hue covers all accent roles)_';

  // --- Spacing facts -------------------------------------------------------
  // Density (compact / default / comfortable) rescales the dimension base;
  // we pull px values from the emitted tokens rather than re-deriving so the
  // guide always matches what downstream consumers see.
  const densityBase = resolvePx(set.light, '--dimension-100');
  const spaceRows = [
    ['--space-xs',  '--dimension-50',   '--space-xs'],
    ['--space-sm',  '--dimension-100',  '--space-sm'],
    ['--space-md',  '--dimension-150',  '--space-md'],
    ['--space-lg',  '--dimension-200',  '--space-lg'],
    ['--space-xl',  '--dimension-300',  '--space-xl'],
    ['--space-2xl', '--dimension-400',  '--space-2xl'],
    ['--space-3xl', '--dimension-500',  '--space-3xl'],
    ['--space-4xl', '--dimension-600',  '--space-4xl'],
    ['--space-5xl', '--dimension-800',  '--space-5xl'],
    ['--space-6xl', '--dimension-1000', '--space-6xl'],
  ] as const;
  const spaceTable = spaceRows
    .map(([semantic, primitive, tokenForPx]) =>
      `${padRight(semantic, 11)} → ${padRight(primitive, 18)} (${resolvePx(set.light, tokenForPx)})`,
    )
    .join('\n');

  // --- Typography facts ----------------------------------------------------
  const bodyMd    = resolvePx(set.light, '--typography-size-200');
  const heading2xl = resolvePx(set.light, '--typography-size-500');
  const radiusContainer = pickToken(set.light, ['--shape-radius-container'], '--shape-radius-container');
  const radiusAction    = pickToken(set.light, ['--shape-radius-action'],    '--shape-radius-action');

  return `# ${systemName} Design Tokens
Generated by [Trellis](https://trellisdesign.io)

## Overview

A design token system generated in OKLCH color space, ${formatPhrase}. The export contains ${tokenCount} tokens spanning color primitives, semantic surfaces, typography, spacing, shape, and motion — each primitive ramp generated perceptually so contrast relationships hold across hues.

## Color palette

- Primary hue: \`${primaryNamed.name}\` (OKLCH hue angle ≈ ${primaryAngle.toFixed(1)}°)
- Supporting hues: ${supportingLine}
- Neutral ramp

## Token architecture

The system uses three complementary mental models.

### Backgrounds

The elevation hierarchy — \`sunken\` → \`base\` → \`raised\` → \`overlay\` — plus identity surfaces (\`primary\`, \`accent\`, and status colors like \`success\`, \`warning\`, \`critical\`, \`info\`). Elevation layers are opaque and define visual hierarchy; identity surfaces carry semantic meaning.

### Foregrounds

Foregrounds split into on-surface colors for elevation layers (\`foreground/onBase\`, \`foreground/onBaseMuted\`) and on-surface colors for identity surfaces (\`foreground/onPrimary\`, \`foreground/onAccent\`). \`foreground/primary\` and \`foreground/accent\` are the saturated brand colors used for accents and links, not body text.

Use \`foreground/onBase\` for body text on elevation backgrounds. Use \`foreground/on*\` tokens on identity backgrounds. Use \`foreground/primary\` for accented text like links.

### Modifiers

\`*Subtle\` backgrounds (e.g. \`background/primarySubtle\`) provide desaturated, lighter surface variants based on relative lightness — not alpha transparency. Similarly, \`foreground/onBaseMuted\` provides a reduced-contrast text color via relative lightness, not alpha. High-contrast foreground tokens are available for situations requiring maximum emphasis.

## Spacing & dimensions

Space lives in two tiers. The primitive tier — \`--dimension-0\` through \`--dimension-1000\` plus \`--dimension-max\` — is a fixed px ladder. The configured **${config.density}** density sets the base unit: \`--dimension-100\` = ${densityBase}. Every other step is a multiple of that base, so changing density rescales every semantic space, radius, and control size at once.

Semantic \`--space-*\` tokens (t-shirt scale) reference the primitive ladder and are what components should actually use:

\`\`\`
${spaceTable}
\`\`\`

**Rule of thumb:** reach for \`--space-*\` first for padding, gap, and margin. Only use \`--dimension-*\` directly for structural measurements (grid tracks, fixed rails, stroke widths) where a t-shirt name would be misleading. Avoid hard-coded pixel values in component CSS — they won't track density.

Corner radii follow the same pattern: \`--shape-radius-{container, subcontainer, supercontainer, action, field, badge, max}\` resolve through \`--dimension-*\` and shift with the configured \`roundness\` preset (\`${config.roundness}\`). Stroke widths live at \`--shape-border-{thin, regular, thick}\`.

## Typography

Typography splits into primitives and semantic aliases, mirroring the color pattern.

**Primitives**

- Size ladder: \`--typography-size-100\` (${resolvePx(set.light, '--typography-size-100')}) → \`--typography-size-800\` (${resolvePx(set.light, '--typography-size-800')}), roughly a minor-third stepped scale.
- Weights: \`--typography-weight-{300..900}\` — emitted for every weight the configured fonts actually use.
- Families: \`--typography-font-family-body\` and \`--typography-font-family-heading\`.

**Semantic aliases (\`--font-*\`)**

Four type styles cover every UI surface. Pick the one that matches the element's *role*, then pick a size from its ramp.

- **heading** — marketing titles and page/section headings. Single weight (\`--font-heading-weight\`), 125% line-height. Size ramp: \`xs sm md lg xl 2xl 3xl 4xl\`.
- **body** — prose, paragraphs, inline labels. Three weights (\`light\`, \`regular\`, \`medium\`, \`bold\`), 150% line-height. Size ramp: \`2xs xs sm md lg\`.
- **action** — buttons, tabs, menu items. Fixed weight (500), per-size line-heights tuned to match icon-only buttons at the same size (xs→14px icon, sm→16px, md→20px, lg→24px). Sizes: \`xs sm md lg\` (12 / 14 / 16 / 18 px).
- **field** — inputs, selects, textareas. Body-regular weight so typed content stays readable; per-size line-heights mirror action so inputs and buttons line up. Sizes: \`xs sm md lg\` (12 / 14 / 16 / 18 px).

\`\`\`css
.page-title {
  font-family: var(--font-heading-family);
  font-size:   var(--font-heading-2xl-size);   /* ≈ ${heading2xl} */
  font-weight: var(--font-heading-weight);
  line-height: var(--font-heading-lineheight);
}

.body-copy {
  font-family: var(--font-body-family);
  font-size:   var(--font-body-md-size);       /* ≈ ${bodyMd} */
  font-weight: var(--font-body-weight-regular);
  line-height: var(--font-body-lineheight);
}
\`\`\`

**Rule of thumb:** never set \`font-size\` with a raw \`px\` / \`rem\` value in a component — always reach for a \`--font-*-size\` token. Line-heights are expressed as percentages so they compose correctly with the size scale.

## Interactive states

Hover and pressed states use a \`::after\` pseudo-element overlaying the component's own foreground color at a configurable opacity — a scrim that reads correctly against any surface without duplicating per-variant hover colors.

\`\`\`css
.interactive-element {
  position: relative;
}
.interactive-element::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transition: opacity 150ms ease;
  pointer-events: none;
}
.interactive-element:hover::after {
  opacity: var(--state-hover-opacity, 0.06);
}
.interactive-element:active::after {
  opacity: var(--state-pressed-opacity, 0.12);
}
\`\`\`

Components sitting on dark or highly saturated backgrounds need higher opacity values to stay visible; the generation pipeline computes appropriate values per variant.

## Usage quick reference

\`\`\`
Page background       → var(${bgBase})
Card / raised surface → var(${bgRaised})
Modal / popover       → var(${bgOverlay})
Recessed area         → var(${bgSunken})
Primary action        → var(${bgPrimary}) + var(${fgOnPri})
Body text             → var(${fgOnBase})
Secondary text        → var(${fgMuted})
Link or accent text   → var(${fgPrimary})
Border                → var(${borderTok})

Tight control padding → var(--space-xs) / var(--space-sm)
Card / form padding   → var(--space-md) / var(--space-lg)
Section gap           → var(--space-2xl) / var(--space-3xl)
Page rhythm           → var(--space-5xl) / var(--space-6xl)

Heading size          → var(--font-heading-md-size) … var(--font-heading-4xl-size)
Body copy             → var(--font-body-md-size) + var(--font-body-weight-regular)
Small / helper text   → var(--font-body-sm-size) + var(${fgMuted})
Button label          → var(--font-action-md-size) + var(--font-action-weight)
Input text            → var(--font-field-md-size) + var(--font-field-weight)

Container radius      → var(${radiusContainer})
Button / field radius → var(${radiusAction})
Border width          → var(--shape-border-regular)
\`\`\`

## Component overrides

\`\`\`css
/* Component-level override — change a card's background without touching the system */
.card {
  background: var(--card-bg, var(${bgRaised}));
}
\`\`\`

This pattern is used throughout the full Trellis component library, available in the Pro tier.

## CSS cascade layers

\`\`\`css
@layer trellis.base, trellis.theme, trellis.overrides;
\`\`\`

\`base\` holds defaults, \`theme\` holds the generated values, and \`overrides\` is where consumers place their customizations.
`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ExportOptions {
  includeSemantic?: boolean;
}

export function exportTokens(
  set: TokenSet,
  format: ExportFormat,
  space: ColorSpace,
  options: ExportOptions = {},
): string {
  const includeSemantic = options.includeSemantic ?? true;
  switch (format) {
    case 'css':      return exportCSS(set, space, includeSemantic);
    case 'dtcg':     return exportDTCG(set, space);
    case 'tailwind': return exportTailwind(set, space);
    case 'shadcn':   return exportShadcn(set, space);
  }
}
