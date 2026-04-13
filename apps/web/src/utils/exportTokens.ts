import { parse, formatHex, formatRgb, formatHsl, converter } from 'culori';

// ---------------------------------------------------------------------------
// Color space formatting
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

function isColorValue(v: string): boolean {
  const t = v.trim();
  return /^#[0-9a-f]{3,8}$/i.test(t) || /^(rgb|rgba|hsl|hsla|oklch|lch|lab)\(/i.test(t);
}

function convertValue(raw: string, space: ColorSpace): string {
  const t = raw.trim();
  if (t.startsWith('linear-gradient') || t.startsWith('radial-gradient')) return raw;
  if (!isColorValue(t)) return raw;
  // rgba/hsla with alpha — keep as-is to preserve transparency (OKLCH has no alpha literal parity here)
  if (/^rgba?\([^)]*,[^)]*,[^)]*,/.test(t) || /^hsla?\([^)]*,[^)]*,[^)]*,/.test(t)) {
    if (space === 'rgb' || space === 'hsl') return raw;
  }
  return formatColor(t, space);
}

// ---------------------------------------------------------------------------
// Primitive vs semantic classification
// ---------------------------------------------------------------------------

const PRIMITIVE_RAMPS = ['primary', 'secondary', 'neutral', 'success', 'warning', 'critical', 'info'];

function isPrimitiveColorToken(prop: string): boolean {
  if (!prop.startsWith('--color-')) return false;
  const rest = prop.slice('--color-'.length);
  const m = rest.match(/^([a-z]+)-(\d+)$/);
  return !!m && PRIMITIVE_RAMPS.includes(m[1]);
}

function isSemanticColorToken(prop: string): boolean {
  return prop.startsWith('--color-') && !isPrimitiveColorToken(prop);
}

// ---------------------------------------------------------------------------
// Tokens input
// ---------------------------------------------------------------------------

export interface TokenSet {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export type ExportFormat = 'css' | 'dtcg' | 'tailwind' | 'shadcn';

function primitiveEntries(tokens: Record<string, string>) {
  return Object.entries(tokens).filter(([p]) => isPrimitiveColorToken(p));
}
function semanticColorEntries(tokens: Record<string, string>) {
  return Object.entries(tokens).filter(([p]) => isSemanticColorToken(p));
}
function nonColorEntries(tokens: Record<string, string>) {
  return Object.entries(tokens).filter(([p]) => !p.startsWith('--color-') && !p.startsWith('--gradient-'));
}

// ---------------------------------------------------------------------------
// CSS export
// ---------------------------------------------------------------------------

function cssBlock(selector: string, entries: [string, string][], space: ColorSpace): string {
  const lines = [`${selector} {`];
  for (const [prop, raw] of entries) {
    const value = prop.startsWith('--color-') ? convertValue(raw, space) : raw;
    lines.push(`  ${prop}: ${value};`);
  }
  lines.push('}');
  return lines.join('\n');
}

function exportCSS(set: TokenSet, space: ColorSpace): string {
  const sections: string[] = [];

  sections.push('/* ----------------------------------------------------------- */');
  sections.push('/* Primitive tokens                                            */');
  sections.push('/* ----------------------------------------------------------- */');
  sections.push(cssBlock(':root', primitiveEntries(set.light), space));
  sections.push(cssBlock(':root.dark, .dark', primitiveEntries(set.dark), space));

  sections.push('');
  sections.push('/* ----------------------------------------------------------- */');
  sections.push('/* Semantic tokens                                             */');
  sections.push('/* ----------------------------------------------------------- */');
  const lightSemanticAndRest = [
    ...semanticColorEntries(set.light),
    ...nonColorEntries(set.light),
  ];
  const darkSemanticAndRest = [
    ...semanticColorEntries(set.dark),
    ...nonColorEntries(set.dark),
  ];
  sections.push(cssBlock(':root', lightSemanticAndRest, space));
  sections.push(cssBlock(':root.dark, .dark', darkSemanticAndRest, space));

  return sections.join('\n');
}

// ---------------------------------------------------------------------------
// DTCG JSON export
// ---------------------------------------------------------------------------

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
  const isColor = prop.startsWith('--color-');
  cursor[parts[parts.length - 1]] = {
    $type: isColor ? 'color' : 'other',
    $value: isColor ? convertValue(value, space) : value,
  };
}

function buildDTCG(tokens: Record<string, string>, space: ColorSpace) {
  const primitive: Record<string, unknown> = {};
  const semantic: Record<string, unknown> = {};
  for (const [prop, val] of Object.entries(tokens)) {
    if (isPrimitiveColorToken(prop)) insertDTCG(primitive, prop, val, space);
    else if (prop.startsWith('--color-')) insertDTCG(semantic, prop, val, space);
    else if (!prop.startsWith('--gradient-')) insertDTCG(semantic, prop, val, space);
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

function buildColorGroups(tokens: Record<string, string>, space: ColorSpace) {
  const primitives: Record<string, Record<string, string>> = {};
  const semantic: Record<string, string | Record<string, string>> = {};

  for (const [prop, raw] of Object.entries(tokens)) {
    if (!prop.startsWith('--color-')) continue;
    const value = convertValue(raw, space);
    if (isPrimitiveColorToken(prop)) {
      const m = prop.slice('--color-'.length).match(/^([a-z]+)-(\d+)$/)!;
      if (!primitives[m[1]]) primitives[m[1]] = {};
      primitives[m[1]][m[2]] = value;
    } else {
      const rest = prop.slice('--color-'.length);
      const [group, ...tail] = rest.split('-');
      if (tail.length === 0) {
        semantic[group] = value;
      } else {
        if (typeof semantic[group] !== 'object') semantic[group] = {};
        (semantic[group] as Record<string, string>)[tail.join('-')] = value;
      }
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
/* Light mode values shown. Use the generated CSS export for dark-mode variants
   via the :root.dark selector, or wire these through CSS variables. */
export default {
  darkMode: 'class',
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

function shadcnSemantic(tokens: Record<string, string>, isDark: boolean): ShadcnEntry[] {
  const t = (k: string) => tokens[`--color-${k}`];
  const neutralStep = (step: number) => tokens[`--color-neutral-${step}`];
  const secondary = isDark ? neutralStep(800) : neutralStep(100);
  const input = isDark ? neutralStep(700) : neutralStep(200);

  const entries: ShadcnEntry[] = [
    ['--background', t('background-base')],
    ['--foreground', t('foreground-onBase')],
    ['--card', t('background-raised')],
    ['--card-foreground', t('foreground-onRaised')],
    ['--popover', t('background-overlay')],
    ['--popover-foreground', t('foreground-onBase')],
    ['--primary', t('background-primary')],
    ['--primary-foreground', t('foreground-onPrimary')],
    ['--secondary', secondary],
    ['--secondary-foreground', t('foreground-onBase')],
    ['--muted', t('background-sunken')],
    ['--muted-foreground', t('foreground-onBaseMuted')],
    ['--accent', t('background-accent')],
    ['--accent-foreground', t('foreground-onAccent')],
    ['--destructive', t('background-critical')],
    ['--destructive-foreground', t('foreground-onCritical')],
    ['--border', isDark ? neutralStep(700) : neutralStep(200)],
    ['--input', input],
    ['--ring', t('background-primary')],
    ['--chart-1', tokens['--color-primary-500']],
    ['--chart-2', tokens['--color-secondary-500']],
    ['--chart-3', tokens['--color-success-500']],
    ['--chart-4', tokens['--color-warning-500']],
    ['--chart-5', tokens['--color-info-500']],
    ['--sidebar', t('background-sunken')],
    ['--sidebar-foreground', t('foreground-onSunken')],
    ['--sidebar-primary', t('background-primary')],
    ['--sidebar-primary-foreground', t('foreground-onPrimary')],
    ['--sidebar-accent', t('background-accent')],
    ['--sidebar-accent-foreground', t('foreground-onAccent')],
    ['--sidebar-border', isDark ? neutralStep(700) : neutralStep(200)],
    ['--sidebar-ring', t('background-primary')],
  ];
  return entries.filter(([, v]) => v !== undefined);
}

function shadcnExtras(tokens: Record<string, string>): ShadcnEntry[] {
  const fontPrimary = (tokens['--font-family-primary'] || "system-ui, sans-serif").replace(/^'|'$/g, '');
  return [
    ['--font-sans', fontPrimary],
    ['--font-serif', `"Lora", Georgia, serif`],
    ['--font-mono', `"Fira Code", "Courier New", monospace`],
    ['--radius', tokens['--radius-container'] || '0.5rem'],
    ['--shadow-x', '1px'],
    ['--shadow-y', '2px'],
    ['--shadow-blur', '5px'],
    ['--shadow-spread', '1px'],
    ['--shadow-opacity', '0.06'],
    ['--shadow-color', 'hsl(0 0% 0%)'],
    ['--shadow-2xs', '1px 2px 5px 1px hsl(0 0% 0% / 0.03)'],
    ['--shadow-xs', '1px 2px 5px 1px hsl(0 0% 0% / 0.03)'],
    ['--shadow-sm', '1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 1px 2px 0px hsl(0 0% 0% / 0.06)'],
    ['--shadow', '1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 1px 2px 0px hsl(0 0% 0% / 0.06)'],
    ['--shadow-md', '1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 2px 4px 0px hsl(0 0% 0% / 0.06)'],
    ['--shadow-lg', '1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 4px 6px 0px hsl(0 0% 0% / 0.06)'],
    ['--shadow-xl', '1px 2px 5px 1px hsl(0 0% 0% / 0.06), 1px 8px 10px 0px hsl(0 0% 0% / 0.06)'],
    ['--shadow-2xl', '1px 2px 5px 1px hsl(0 0% 0% / 0.15)'],
    ['--tracking-normal', '0em'],
    ['--spacing', '0.25rem'],
  ];
}

function shadcnPrimitives(tokens: Record<string, string>, space: ColorSpace): ShadcnEntry[] {
  return primitiveEntries(tokens).map(([prop, v]) => {
    const name = prop.replace('--color-', '--');
    return [name, convertValue(v, space)] as ShadcnEntry;
  });
}

function renderShadcnBlock(selector: string, sections: { label: string; entries: ShadcnEntry[] }[], space: ColorSpace): string {
  const lines = [`  ${selector} {`];
  sections.forEach((section, i) => {
    if (i > 0) lines.push('');
    lines.push(`    /* ${section.label} */`);
    for (const [prop, raw] of section.entries) {
      const value = /^(#|rgb|hsl|oklch|lab|lch)/i.test(raw.trim()) ? convertValue(raw, space) : raw;
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
      { label: 'Semantic tokens', entries: shadcnSemantic(set.light, false) },
      { label: 'Typography, radius, shadows, spacing', entries: shadcnExtras(set.light) },
    ],
    space,
  );
  const darkBlock = renderShadcnBlock(
    '.dark',
    [
      { label: 'Primitive tokens', entries: shadcnPrimitives(set.dark, space) },
      { label: 'Semantic tokens', entries: shadcnSemantic(set.dark, true) },
    ],
    space,
  );
  return `@layer base {\n${lightBlock}\n\n${darkBlock}\n}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function exportTokens(
  set: TokenSet,
  format: ExportFormat,
  space: ColorSpace,
): string {
  switch (format) {
    case 'css':      return exportCSS(set, space);
    case 'dtcg':     return exportDTCG(set, space);
    case 'tailwind': return exportTailwind(set, space);
    case 'shadcn':   return exportShadcn(set, space);
  }
}
