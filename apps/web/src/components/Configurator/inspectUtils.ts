// ---------------------------------------------------------------------------
// Inspect-mode utilities — token extraction & semantic-to-primitive mapping
// ---------------------------------------------------------------------------

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
): HTMLElement | null {
  let current: HTMLElement | null = el;
  while (current && current !== boundary) {
    if (current.style.cssText && VAR_RE.test(current.style.cssText)) {
      VAR_RE.lastIndex = 0;
      return current;
    }
    VAR_RE.lastIndex = 0;
    current = current.parentElement;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Semantic → Primitive ramp mapping
// ---------------------------------------------------------------------------

interface PrimitiveMapping {
  ramp: string | null; // null = hardcoded (e.g. #ffffff)
  lightStep: number | null;
  darkStep: number | null;
}

/**
 * Maps semantic color token names → their primitive ramp + step.
 * Built from the assignments in generateTokens.ts lines 192-249.
 */
const SEMANTIC_TO_PRIMITIVE: Record<string, PrimitiveMapping> = {
  // --- Background ---
  'color-background-base': { ramp: 'neutral', lightStep: null, darkStep: 900 },
  'color-background-sunken': { ramp: 'neutral', lightStep: 50, darkStep: 1000 },
  'color-background-raised': { ramp: 'neutral', lightStep: null, darkStep: 800 },
  'color-background-raisedHover': { ramp: 'neutral', lightStep: 50, darkStep: 700 },
  'color-background-overlay': { ramp: 'neutral', lightStep: null, darkStep: 800 },
  'color-background-primary': { ramp: 'primary', lightStep: 500, darkStep: 400 },
  'color-background-primaryHover': { ramp: 'primary', lightStep: 600, darkStep: 300 },
  'color-background-primarySubtle': { ramp: 'primary', lightStep: 50, darkStep: 900 },
  'color-background-accent': { ramp: 'secondary', lightStep: 500, darkStep: 400 },
  'color-background-accentSubtle': { ramp: 'secondary', lightStep: 50, darkStep: 900 },
  // Status backgrounds
  'color-background-success': { ramp: 'success', lightStep: 500, darkStep: 400 },
  'color-background-successSubtle': { ramp: 'success', lightStep: 50, darkStep: 900 },
  'color-background-warning': { ramp: 'warning', lightStep: 500, darkStep: 400 },
  'color-background-warningSubtle': { ramp: 'warning', lightStep: 50, darkStep: 900 },
  'color-background-critical': { ramp: 'critical', lightStep: 500, darkStep: 400 },
  'color-background-criticalSubtle': { ramp: 'critical', lightStep: 50, darkStep: 900 },
  'color-background-info': { ramp: 'info', lightStep: 500, darkStep: 400 },
  'color-background-infoSubtle': { ramp: 'info', lightStep: 50, darkStep: 900 },
  // Gradient/CTA
  'color-background-gradientSoft': { ramp: null, lightStep: null, darkStep: null },

  // --- Foreground ---
  'color-foreground-onBase': { ramp: 'neutral', lightStep: 1000, darkStep: 50 },
  'color-foreground-onBaseMuted': { ramp: 'neutral', lightStep: 500, darkStep: 400 },
  'color-foreground-onBaseFaint': { ramp: 'neutral', lightStep: 300, darkStep: 600 },
  'color-foreground-onRaised': { ramp: 'neutral', lightStep: 1000, darkStep: 50 },
  'color-foreground-onSunken': { ramp: 'neutral', lightStep: 900, darkStep: 100 },
  'color-foreground-primary': { ramp: 'primary', lightStep: 600, darkStep: 400 },
  'color-foreground-onPrimary': { ramp: 'primary', lightStep: null, darkStep: 1000 },
  'color-foreground-accent': { ramp: 'secondary', lightStep: 600, darkStep: 400 },
  'color-foreground-onAccent': { ramp: 'secondary', lightStep: null, darkStep: 1000 },
  // Status foregrounds
  'color-foreground-success': { ramp: 'success', lightStep: 600, darkStep: 300 },
  'color-foreground-onSuccess': { ramp: null, lightStep: null, darkStep: null },
  'color-foreground-onSuccessSubtle': { ramp: 'success', lightStep: 800, darkStep: 200 },
  'color-foreground-warning': { ramp: 'warning', lightStep: 600, darkStep: 300 },
  'color-foreground-onWarning': { ramp: null, lightStep: null, darkStep: null },
  'color-foreground-onWarningSubtle': { ramp: 'warning', lightStep: 800, darkStep: 200 },
  'color-foreground-critical': { ramp: 'critical', lightStep: 600, darkStep: 300 },
  'color-foreground-onCritical': { ramp: null, lightStep: null, darkStep: null },
  'color-foreground-onCriticalSubtle': { ramp: 'critical', lightStep: 800, darkStep: 200 },
  'color-foreground-info': { ramp: 'info', lightStep: 600, darkStep: 300 },
  'color-foreground-onInfo': { ramp: null, lightStep: null, darkStep: null },
  'color-foreground-onInfoSubtle': { ramp: 'info', lightStep: 800, darkStep: 200 },
  'color-foreground-onGradient': { ramp: null, lightStep: null, darkStep: null },
  'color-foreground-onGradientMuted': { ramp: null, lightStep: null, darkStep: null },

  // --- Border ---
  'color-border-neutral': { ramp: null, lightStep: null, darkStep: null },
  'color-border-strong': { ramp: null, lightStep: null, darkStep: null },
  'color-border-primary': { ramp: 'primary', lightStep: 500, darkStep: 400 },
  'color-border-accent': { ramp: 'secondary', lightStep: 500, darkStep: 400 },
  'color-border-success': { ramp: 'success', lightStep: 500, darkStep: 400 },
  'color-border-warning': { ramp: 'warning', lightStep: 500, darkStep: 400 },
  'color-border-critical': { ramp: 'critical', lightStep: 500, darkStep: 400 },
  'color-border-info': { ramp: 'info', lightStep: 500, darkStep: 400 },

  // --- Chart ---
  'color-chart-grid': { ramp: null, lightStep: null, darkStep: null },
  'color-chart-primary': { ramp: 'primary', lightStep: 500, darkStep: 400 },
  'color-chart-primaryGradientStart': { ramp: 'primary', lightStep: 500, darkStep: 400 },
  'color-chart-primaryGradientEnd': { ramp: 'primary', lightStep: 500, darkStep: 400 },
};

/**
 * Returns the ramp key and step for a given semantic color token, or null
 * if the token is not editable (hardcoded value, non-color, or unknown).
 *
 * Also handles primitive tokens like `color-primary-500` directly.
 */
export function getTokenEditInfo(
  tokenName: string,
  isDarkMode: boolean,
): { rampKey: string; step: number } | null {
  // 1. Check semantic map
  const mapping = SEMANTIC_TO_PRIMITIVE[tokenName];
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
export function isEditableToken(tokenName: string, isDarkMode: boolean): boolean {
  return getTokenEditInfo(tokenName, isDarkMode) !== null;
}

/** Human-readable label for a token edit, e.g. "primary · 500" */
export function getEditLabel(tokenName: string, isDarkMode: boolean): string | null {
  const info = getTokenEditInfo(tokenName, isDarkMode);
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
