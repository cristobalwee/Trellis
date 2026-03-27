import type { BrandConfig } from '../components/BrandIntake/store';
import {
  toOklch,
  getGeneratedColor,
  generateOklchRamp,
  generateNeutralRamp,
} from '../components/BrandIntake/colorGeneration';

// ---------------------------------------------------------------------------
// Preset → token value mappings
// ---------------------------------------------------------------------------

const RADIUS_PRESETS: Record<BrandConfig['roundness'], Record<string, string>> = {
  sharp: {
    '--radius-container': '0px',
    '--radius-action': '2px',
    '--radius-field': '2px',
    '--radius-subcontainer': '0px',
    '--radius-badge': '2px',
  },
  subtle: {
    '--radius-container': '8px',
    '--radius-action': '6px',
    '--radius-field': '6px',
    '--radius-subcontainer': '4px',
    '--radius-badge': '4px',
  },
  rounded: {
    '--radius-container': '16px',
    '--radius-action': '10px',
    '--radius-field': '10px',
    '--radius-subcontainer': '8px',
    '--radius-badge': '8px',
  },
  pill: {
    '--radius-container': '24px',
    '--radius-action': '999px',
    '--radius-field': '999px',
    '--radius-subcontainer': '16px',
    '--radius-badge': '999px',
  },
};

const SPACING_PRESETS: Record<BrandConfig['density'], Record<string, string>> = {
  compact: {
    '--spacing-card': '12px',
    '--spacing-cell-y': '6px',
    '--spacing-cell-x': '10px',
    '--spacing-gap': '8px',
    '--spacing-shell': '10px',
    '--spacing-control-y': '6px',
    '--spacing-control-x': '8px',
  },
  default: {
    '--spacing-card': '16px',
    '--spacing-cell-y': '10px',
    '--spacing-cell-x': '14px',
    '--spacing-gap': '12px',
    '--spacing-shell': '14px',
    '--spacing-control-y': '8px',
    '--spacing-control-x': '10px',
  },
  comfortable: {
    '--spacing-card': '24px',
    '--spacing-cell-y': '14px',
    '--spacing-cell-x': '18px',
    '--spacing-gap': '16px',
    '--spacing-shell': '20px',
    '--spacing-control-y': '10px',
    '--spacing-control-x': '12px',
  },
};

function shadowTokens(
  level: BrandConfig['shadows'],
  isDark: boolean
): Record<string, string> {
  const base = isDark ? '2,6,23' : '15,23,42';
  switch (level) {
    case 'none':
      return {
        '--shadow-card': 'none',
        '--shadow-elevated': 'none',
      };
    case 'subtle':
      return {
        '--shadow-card': isDark
          ? `0 1px 4px rgba(${base},0.06)`
          : `0 1px 4px rgba(${base},0.06)`,
        '--shadow-elevated': isDark
          ? `0 1px 4px rgba(${base},0.06)`
          : `0 1px 4px rgba(${base},0.06)`,
      };
    default: // elevated
      return {
        '--shadow-card': isDark
          ? `0 2px 8px rgba(${base},0.1)`
          : `0 2px 8px rgba(${base},0.1)`,
        '--shadow-elevated': isDark
          ? `0 2px 8px rgba(${base},0.1)`
          : `0 2px 8px rgba(${base},0.1)`,
      };
  }
}

function transitionTokens(
  expressiveness: BrandConfig['expressiveness']
): Record<string, string> {
  const dur =
    expressiveness === 'minimal' ? '0.15s' :
    expressiveness === 'expressive' ? '0.4s' : '0.25s';
  const interDur =
    expressiveness === 'minimal' ? '0.1s' :
    expressiveness === 'expressive' ? '0.3s' : '0.2s';

  return {
    '--transition-theme': `background-color ${dur} ease, border-color ${dur} ease, color ${dur} ease, border-radius ${dur} ease, padding ${dur} ease, gap ${dur} ease, box-shadow ${dur} ease`,
    '--transition-interactive': `all ${interDur} ease`,
    '--transition-chart': `stroke ${dur} ease, fill ${dur} ease, opacity ${dur} ease`,
  };
}

// ---------------------------------------------------------------------------
// Main token generator
// ---------------------------------------------------------------------------

export function generateDesignTokens(
  config: BrandConfig,
  isDarkMode: boolean
): Record<string, string> {
  const tokens: Record<string, string> = {};

  // --- Resolve colors using OKLCH pipeline ---
  const falloff = config.chromaFalloff / 100;

  const primaryOklch = toOklch(config.primaryColor);
  const primaryH = primaryOklch?.h || 0;
  const primaryL = primaryOklch?.l ?? 0.5;
  const primaryC = primaryOklch?.c ?? 0;

  // Resolve secondary color: use generation mode when not custom
  const secondaryColor =
    config.useCustomSecondary && config.secondaryColor
      ? config.secondaryColor
      : getGeneratedColor(config.primaryColor, config.secondaryGenerationMode || 'complementary');

  const secondaryOklch = toOklch(secondaryColor);
  const secondaryH = secondaryOklch?.h || 0;
  const secondaryL = secondaryOklch?.l ?? 0.5;
  const secondaryC = secondaryOklch?.c ?? 0;

  // --- Color ramps (OKLCH) ---
  // Base chroma is passed unscaled — the user's chosen color is always anchored.
  // Only surrounding shades lose chroma according to the falloff parameter.
  const primaryRamp = generateOklchRamp(
    primaryH, primaryC, primaryL, falloff,
  );
  const secondaryRamp = generateOklchRamp(
    secondaryH, secondaryC, secondaryL, falloff,
  );
  const neutralRamp = generateNeutralRamp(
    primaryH, config.neutralTint, primaryL, falloff,
  );

  // Primitive color tokens
  const ramps = { primary: primaryRamp, secondary: secondaryRamp, neutral: neutralRamp };
  for (const [name, ramp] of Object.entries(ramps)) {
    for (const [step, hex] of Object.entries(ramp)) {
      tokens[`--color-${name}-${step}`] = hex as string;
    }
  }

  // --- Status color ramps ---
  const statusMap = {
    success: config.statusColors.success,
    warning: config.statusColors.warning,
    critical: config.statusColors.error,
    info: config.statusColors.info,
  };
  for (const [name, hex] of Object.entries(statusMap)) {
    const statusOklch = toOklch(hex);
    const ramp = generateOklchRamp(
      statusOklch?.h || 0, statusOklch?.c ?? 0, statusOklch?.l ?? 0.5, 0.8, 100,
    );
    for (const [step, color] of Object.entries(ramp)) {
      tokens[`--color-${name}-${step}`] = color as string;
    }
  }

  const isDark = isDarkMode;

  // --- Semantic background tokens ---
  tokens['--color-background-base'] = isDark ? neutralRamp[900] : '#ffffff';
  tokens['--color-background-sunken'] = isDark ? neutralRamp[1000] : neutralRamp[50];
  tokens['--color-background-raised'] = isDark ? neutralRamp[800] : '#ffffff';
  tokens['--color-background-raisedHover'] = isDark ? neutralRamp[700] : neutralRamp[50];
  tokens['--color-background-overlay'] = isDark ? neutralRamp[800] : '#ffffff';

  tokens['--color-background-primary'] = isDark ? primaryRamp[400] : primaryRamp[500];
  tokens['--color-background-primaryHover'] = isDark ? primaryRamp[300] : primaryRamp[600];
  tokens['--color-background-primarySubtle'] = isDark ? primaryRamp[900] : primaryRamp[50];
  tokens['--color-background-accent'] = isDark ? secondaryRamp[400] : secondaryRamp[500];
  tokens['--color-background-accentSubtle'] = isDark ? secondaryRamp[900] : secondaryRamp[50];

  // Status backgrounds
  const statusRampCache: Record<string, ReturnType<typeof generateOklchRamp>> = {};
  for (const [name, hex] of Object.entries(statusMap)) {
    const sOklch = toOklch(hex);
    const ramp = generateOklchRamp(
      sOklch?.h || 0, sOklch?.c ?? 0, sOklch?.l ?? 0.5, 0.8, 100,
    );
    statusRampCache[name] = ramp;
    tokens[`--color-background-${name}`] = isDark ? ramp[400] : ramp[500];
    tokens[`--color-background-${name}Subtle`] = isDark ? ramp[900] : ramp[50];
  }

  // --- Semantic foreground tokens ---
  tokens['--color-foreground-onBase'] = isDark ? neutralRamp[50] : neutralRamp[1000];
  tokens['--color-foreground-onBaseMuted'] = isDark ? neutralRamp[400] : neutralRamp[500];
  tokens['--color-foreground-onBaseFaint'] = isDark ? neutralRamp[600] : neutralRamp[300];
  tokens['--color-foreground-onRaised'] = isDark ? neutralRamp[50] : neutralRamp[1000];
  tokens['--color-foreground-onSunken'] = isDark ? neutralRamp[100] : neutralRamp[900];

  tokens['--color-foreground-primary'] = isDark ? primaryRamp[400] : primaryRamp[600];
  tokens['--color-foreground-onPrimary'] = isDark ? primaryRamp[1000] : '#ffffff';
  tokens['--color-foreground-accent'] = isDark ? secondaryRamp[400] : secondaryRamp[600];
  tokens['--color-foreground-onAccent'] = isDark ? secondaryRamp[1000] : '#ffffff';

  // Status foregrounds
  for (const [name, ramp] of Object.entries(statusRampCache)) {
    tokens[`--color-foreground-${name}`] = isDark ? ramp[300] : ramp[600];
    tokens[`--color-foreground-on${name.charAt(0).toUpperCase() + name.slice(1)}`] = '#ffffff';
    tokens[`--color-foreground-on${name.charAt(0).toUpperCase() + name.slice(1)}Subtle`] = isDark ? ramp[200] : ramp[800];
  }

  // CTA / gradient surface
  tokens['--color-foreground-onGradient'] = '#ffffff';
  tokens['--color-foreground-onGradientMuted'] = 'rgba(255,255,255,0.8)';
  tokens['--color-background-gradientSoft'] = 'rgba(255,255,255,0.15)';

  // --- Semantic border tokens ---
  tokens['--color-border-neutral'] = isDark ? `rgba(255,255,255,0.09)` : `rgba(15,23,42,0.08)`;
  tokens['--color-border-strong'] = isDark ? `rgba(255,255,255,0.14)` : `rgba(15,23,42,0.14)`;
  tokens['--color-border-primary'] = isDark ? primaryRamp[400] : primaryRamp[500];
  tokens['--color-border-accent'] = isDark ? secondaryRamp[400] : secondaryRamp[500];
  tokens['--color-border-success'] = isDark ? statusRampCache.success[400] : statusRampCache.success[500];
  tokens['--color-border-warning'] = isDark ? statusRampCache.warning[400] : statusRampCache.warning[500];
  tokens['--color-border-critical'] = isDark ? statusRampCache.critical[400] : statusRampCache.critical[500];
  tokens['--color-border-info'] = isDark ? statusRampCache.info[400] : statusRampCache.info[500];

  // --- Chart-specific tokens ---
  tokens['--color-chart-grid'] = isDark ? 'rgba(241,245,249,0.07)' : 'rgba(15,23,42,0.08)';
  tokens['--color-chart-primary'] = tokens['--color-background-primary'];
  tokens['--color-chart-primaryGradientStart'] = tokens['--color-background-primary'];
  tokens['--color-chart-primaryGradientEnd'] = tokens['--color-background-primary'];

  // --- Gradient ---
  tokens['--gradient-primary'] = `linear-gradient(135deg, ${tokens['--color-background-primary']}, ${tokens['--color-background-accent']})`;

  // --- Typography tokens ---
  tokens['--font-family-primary'] = `'${config.primaryFont}', system-ui, sans-serif`;
  tokens['--font-family-secondary'] = `'${config.headingFont}', system-ui, sans-serif`;

  // --- Radius tokens ---
  Object.assign(tokens, RADIUS_PRESETS[config.roundness]);

  // --- Spacing tokens ---
  Object.assign(tokens, SPACING_PRESETS[config.density]);

  // --- Shadow tokens ---
  Object.assign(tokens, shadowTokens(config.shadows, isDark));

  // --- Transition tokens ---
  Object.assign(tokens, transitionTokens(config.expressiveness));

  return tokens;
}
