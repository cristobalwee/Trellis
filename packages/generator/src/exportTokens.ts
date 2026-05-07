import { parse, formatHex, formatRgb, formatHsl, converter } from 'culori';
import { HUE_NAMES } from './generateTokens.js';

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
// Category mapping (drives grouped output in CSS / DTCG / Tailwind / shadcn)
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
// Public API
//
// The previous markdown "Guide" export has been retired in favor of the
// dedicated skill markdown files generated by `./skills.ts`. See
// `generateSkills(config, set)`.
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
