// ---------------------------------------------------------------------------
// Inspect-mode utilities — token extraction & semantic-to-primitive mapping
// ---------------------------------------------------------------------------

import type { PrimitiveMapping } from '../../utils/generateTokens';

export type TokenCategory =
  | 'color'
  | 'spacing'
  | 'radius'
  | 'typography'
  | 'shadow'
  | 'transition'
  | 'gradient';

export interface TokenInfo {
  /** Full token name without leading `--`, e.g. "color-background-primary" */
  tokenName: string;
  /** CSS property that references this token, e.g. "backgroundColor" */
  cssProperty: string;
  /** Resolved (computed) value, e.g. "#2d5016" */
  resolvedValue: string;
  /** High-level category for grouping in the flyout */
  category: TokenCategory;
}

// ---------------------------------------------------------------------------
// Token extraction
// ---------------------------------------------------------------------------

const VAR_RE = /var\(--([^)]+)\)/g;

function categorize(tokenName: string): TokenCategory {
  if (tokenName.startsWith('color-')) return 'color';
  if (tokenName.startsWith('spacing-')) return 'spacing';
  if (tokenName.startsWith('radius-')) return 'radius';
  if (tokenName.startsWith('font-')) return 'typography';
  if (tokenName.startsWith('shadow-')) return 'shadow';
  if (tokenName.startsWith('transition-')) return 'transition';
  if (tokenName.startsWith('gradient-')) return 'gradient';
  return 'color'; // fallback
}

/**
 * Extract all design-token references from an element's inline `style` attribute.
 * Returns de-duplicated tokens with their resolved (computed) values.
 */
export function extractTokensFromElement(el: HTMLElement): TokenInfo[] {
  const cssText = el.style.cssText;
  if (!cssText) return [];

  const computed = getComputedStyle(el);
  const seen = new Set<string>();
  const tokens: TokenInfo[] = [];

  // Parse each inline style declaration
  const declarations = cssText.split(';');
  for (const decl of declarations) {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) continue;
    const prop = decl.slice(0, colonIdx).trim();
    const value = decl.slice(colonIdx + 1).trim();

    VAR_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = VAR_RE.exec(value)) !== null) {
      const tokenName = match[1];
      if (seen.has(tokenName)) continue;
      seen.add(tokenName);

      tokens.push({
        tokenName,
        cssProperty: prop,
        resolvedValue: computed.getPropertyValue(`--${tokenName}`).trim(),
        category: categorize(tokenName),
      });
    }
  }

  return tokens;
}

/**
 * Walk up the DOM from `el` to find the nearest ancestor (inclusive) that has
 * inline style token references. Stops at `boundary`.
 */
export function findStyledAncestor(
  el: HTMLElement,
  boundary: HTMLElement,
  predicate?: (el: HTMLElement) => boolean,
): HTMLElement | null {
  let current: HTMLElement | null = el;
  while (current && current !== boundary) {
    if (current.style.cssText && VAR_RE.test(current.style.cssText)) {
      VAR_RE.lastIndex = 0;
      if (!predicate || predicate(current)) {
        return current;
      }
    }
    VAR_RE.lastIndex = 0;
    current = current.parentElement;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Semantic → Primitive ramp mapping (now dynamic, provided by generateTokens)
// ---------------------------------------------------------------------------

/**
 * Returns the ramp key and step for a given semantic color token, or null
 * if the token is not editable (hardcoded value, non-color, or unknown).
 *
 * Also handles primitive tokens like `color-primary-500` directly.
 */
export function getTokenEditInfo(
  tokenName: string,
  isDarkMode: boolean,
  semanticMap: Record<string, PrimitiveMapping>,
): { rampKey: string; step: number } | null {
  // 1. Check dynamic semantic map
  const mapping = semanticMap[tokenName];
  if (mapping) {
    const step = isDarkMode ? mapping.darkStep : mapping.lightStep;
    if (mapping.ramp && step != null) {
      return { rampKey: mapping.ramp, step };
    }
    return null; // hardcoded value
  }

  // 2. Check if it's a primitive ramp token like "color-primary-500"
  const primitiveMatch = tokenName.match(
    /^color-(primary|secondary|neutral|success|warning|critical|info)-(\d+)$/,
  );
  if (primitiveMatch) {
    return { rampKey: primitiveMatch[1], step: Number(primitiveMatch[2]) };
  }

  return null;
}

/**
 * Quick check: is this token editable (backed by a ramp step)?
 */
export function isEditableToken(
  tokenName: string,
  isDarkMode: boolean,
  semanticMap: Record<string, PrimitiveMapping>,
): boolean {
  return getTokenEditInfo(tokenName, isDarkMode, semanticMap) !== null;
}

/** Human-readable label for a token edit, e.g. "primary · 500" */
export function getEditLabel(
  tokenName: string,
  isDarkMode: boolean,
  semanticMap: Record<string, PrimitiveMapping>,
): string | null {
  const info = getTokenEditInfo(tokenName, isDarkMode, semanticMap);
  if (!info) return null;
  return `${info.rampKey} \u00b7 ${info.step}`;
}

/** Category display name */
export const CATEGORY_LABELS: Record<TokenCategory, string> = {
  color: 'Color',
  spacing: 'Space',
  radius: 'Radius',
  typography: 'Typography',
  shadow: 'Shadow',
  transition: 'Transition',
  gradient: 'Gradient',
};
