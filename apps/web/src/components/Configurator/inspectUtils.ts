// ---------------------------------------------------------------------------
// Inspect-mode utilities — token extraction & semantic-to-primitive mapping
// ---------------------------------------------------------------------------

import type { PrimitiveMapping } from '@trellis/generator';

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
 * Returns edit info for a given semantic or primitive color token, or null
 * if the token is not editable (hardcoded value, non-color, or unknown).
 *
 * Two kinds of editable tokens:
 *  - `kind: 'ramp'` — edits flow to `rampOverrides[rampKey][step]` via
 *    `updateRampStep`. Default for ramp-backed tokens.
 *  - `kind: 'primaryColor'` — edits flow to `config.primaryColor` directly,
 *    re-deriving every primary-base-routed token. Used by the saturated-input
 *    primary surfaces (background-primary, primaryHover, border-primary, the
 *    primary-base primitive, and chart aliases).
 *
 * `displayRamp` is the hue name displayed to the user (e.g. "blue", "teal").
 */
export type TokenEditInfo =
  | { kind: 'ramp'; rampKey: string; displayRamp: string; step: number }
  | { kind: 'primaryColor'; displayRamp: string };

export function getTokenEditInfo(
  tokenName: string,
  isDarkMode: boolean,
  semanticMap: Record<string, PrimitiveMapping>,
): TokenEditInfo | null {
  const mapping = semanticMap[tokenName];
  if (!mapping) return null;

  if (mapping.target === 'primaryColor') {
    return { kind: 'primaryColor', displayRamp: mapping.ramp ?? 'primary' };
  }

  const step = isDarkMode ? mapping.darkStep : mapping.lightStep;
  if (!mapping.ramp || step == null) return null;
  const rampKey = mapping.role ?? mapping.ramp;
  return { kind: 'ramp', rampKey, displayRamp: mapping.ramp, step };
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
  if (info.kind === 'primaryColor') return `${info.displayRamp} \u00b7 base`;
  return `${info.displayRamp} \u00b7 ${info.step}`;
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
