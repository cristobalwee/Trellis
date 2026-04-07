import { parse, formatHex, formatRgb, formatHsl, converter } from 'culori';

// ---------------------------------------------------------------------------
// Color space formatting
// ---------------------------------------------------------------------------

export type ColorSpace = 'hex' | 'rgb' | 'hsl' | 'oklch';

const toOklch = converter('oklch');

function formatColor(hex: string, space: ColorSpace): string {
  if (space === 'hex') return formatHex(parse(hex)) || hex;

  if (space === 'rgb') return formatRgb(parse(hex)) || hex;

  if (space === 'hsl') return formatHsl(parse(hex)) || hex;

  // oklch
  const o = toOklch(hex);
  if (!o) return hex;
  const l = (o.l * 100).toFixed(2);
  const c = o.c.toFixed(4);
  const h = (o.h ?? 0).toFixed(2);
  return `oklch(${l}% ${c} ${h})`;
}

/** Returns true if the value looks like a color (hex or function-style). */
function isColorValue(v: string): boolean {
  return /^#[0-9a-f]{3,8}$/i.test(v) || /^(rgb|hsl|oklch|lch|lab)\(/i.test(v);
}

/**
 * Resolve a CSS token value to a single hex-like colour we can reformat.
 * Handles hex, rgb(), hsl(), oklch(), and linear-gradient().
 * For gradients we leave the value unchanged.
 */
function resolveColor(raw: string): string | null {
  const trimmed = raw.trim();
  // Skip gradients, compound values, etc.
  if (trimmed.startsWith('linear-gradient') || trimmed.includes(',') && !trimmed.startsWith('rgb') && !trimmed.startsWith('hsl') && !trimmed.startsWith('oklch')) {
    return null;
  }
  if (isColorValue(trimmed)) return trimmed;
  // Try culori parse as last resort
  const parsed = parse(trimmed);
  if (parsed) return formatHex(parsed) || null;
  return null;
}

// ---------------------------------------------------------------------------
// Gather only colour tokens from the generated token map
// ---------------------------------------------------------------------------

interface TokenEntry {
  prop: string;    // e.g. "--color-primary-500"
  value: string;   // original value
}

function extractColorTokens(tokens: Record<string, string>): TokenEntry[] {
  return Object.entries(tokens)
    .filter(([, v]) => resolveColor(v) !== null)
    .map(([prop, value]) => ({ prop, value }));
}

function convertValue(raw: string, space: ColorSpace): string {
  const resolved = resolveColor(raw);
  if (!resolved) return raw;
  return formatColor(resolved, space);
}

// ---------------------------------------------------------------------------
// Export formats
// ---------------------------------------------------------------------------

export type ExportFormat = 'css' | 'dtcg' | 'tailwind' | 'shadcn';

// ---- CSS custom properties ------------------------------------------------

function exportCSS(tokens: Record<string, string>, space: ColorSpace): string {
  const lines: string[] = [':root {'];
  for (const [prop, raw] of Object.entries(tokens)) {
    if (!prop.startsWith('--color-')) continue;
    const value = convertValue(raw, space);
    lines.push(`  ${prop}: ${value};`);
  }
  lines.push('}');
  return lines.join('\n');
}

// ---- DTCG (Design Token Community Group) JSON -----------------------------

function tokenName(prop: string): string {
  // --color-primary-500 → color.primary.500
  return prop.replace(/^--/, '').replace(/-/g, '.');
}

function exportDTCG(tokens: Record<string, string>, space: ColorSpace): string {
  const obj: Record<string, unknown> = {};
  for (const [prop, raw] of Object.entries(tokens)) {
    if (!prop.startsWith('--color-')) continue;
    const name = tokenName(prop);
    const parts = name.split('.');
    let cursor: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cursor[parts[i]]) cursor[parts[i]] = {};
      cursor = cursor[parts[i]] as Record<string, unknown>;
    }
    cursor[parts[parts.length - 1]] = {
      $type: 'color',
      $value: convertValue(raw, space),
    };
  }
  return JSON.stringify(obj, null, 2);
}

// ---- Tailwind CSS config --------------------------------------------------

function exportTailwind(tokens: Record<string, string>, space: ColorSpace): string {
  const colors: Record<string, Record<string, string>> = {};
  for (const [prop, raw] of Object.entries(tokens)) {
    if (!prop.startsWith('--color-')) continue;
    // e.g. --color-primary-500 → group="primary", key="500"
    const stripped = prop.replace('--color-', '');
    const lastDash = stripped.lastIndexOf('-');
    let group: string;
    let key: string;
    if (lastDash > 0) {
      group = stripped.substring(0, lastDash);
      key = stripped.substring(lastDash + 1);
    } else {
      group = stripped;
      key = 'DEFAULT';
    }
    if (!colors[group]) colors[group] = {};
    colors[group][key] = convertValue(raw, space);
  }

  const inner = Object.entries(colors)
    .map(([group, shades]) => {
      const entries = Object.entries(shades)
        .map(([k, v]) => `        ${/^\d+$/.test(k) ? k : `'${k}'`}: '${v}'`)
        .join(',\n');
      return `      '${group}': {\n${entries}\n      }`;
    })
    .join(',\n');

  return `/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
${inner}
      }
    }
  }
}`;
}

// ---- shadcn/ui CSS variables ----------------------------------------------

function exportShadcn(tokens: Record<string, string>, space: ColorSpace): string {
  // shadcn convention uses CSS variables without the --color- prefix
  const lines: string[] = ['@layer base {', '  :root {'];
  for (const [prop, raw] of Object.entries(tokens)) {
    if (!prop.startsWith('--color-')) continue;
    const name = prop.replace('--color-', '');
    const value = convertValue(raw, space);
    lines.push(`    --${name}: ${value};`);
  }
  lines.push('  }', '}');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function exportTokens(
  tokens: Record<string, string>,
  format: ExportFormat,
  space: ColorSpace,
): string {
  switch (format) {
    case 'css':      return exportCSS(tokens, space);
    case 'dtcg':     return exportDTCG(tokens, space);
    case 'tailwind': return exportTailwind(tokens, space);
    case 'shadcn':   return exportShadcn(tokens, space);
  }
}
