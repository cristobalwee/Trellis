// ---------------------------------------------------------------------------
// Shared design-token accessors
//
// Every preview component references CSS custom properties set on an ancestor
// element via `generateDesignTokens()`.  These helpers give a single, typed
// source-of-truth so individual component files stay DRY.
// ---------------------------------------------------------------------------

const t = (token: string) => `var(--${token})`;

export const bg = {
  base: t('color-background-base'),
  sunken: t('color-background-sunken'),
  sunkenStrong: t('color-background-sunkenStrong'),
  raised: t('color-background-raised'),
  raisedHover: t('color-background-raisedHover'),
  overlay: t('color-background-overlay'),
  primary: t('color-background-primary'),
  primaryHover: t('color-background-primaryHover'),
  primarySubtle: t('color-background-primarySubtle'),
  accent: t('color-background-accent'),
  accentSubtle: t('color-background-accentSubtle'),
  success: t('color-background-success'),
  successSubtle: t('color-background-successSubtle'),
  warning: t('color-background-warning'),
  warningSubtle: t('color-background-warningSubtle'),
  critical: t('color-background-critical'),
  criticalSubtle: t('color-background-criticalSubtle'),
  info: t('color-background-info'),
  infoSubtle: t('color-background-infoSubtle'),
  gradientSoft: t('color-background-gradientSoft'),
} as const;

export const fg = {
  onBase: t('color-foreground-onBase'),
  onBaseMuted: t('color-foreground-onBaseMuted'),
  onBaseFaint: t('color-foreground-onBaseFaint'),
  onRaised: t('color-foreground-onRaised'),
  onSunken: t('color-foreground-onSunken'),
  primary: t('color-foreground-primary'),
  onPrimary: t('color-foreground-onPrimary'),
  onPrimarySubtle: t('color-foreground-onPrimarySubtle'),
  accent: t('color-foreground-accent'),
  onAccent: t('color-foreground-onAccent'),
  onAccentSubtle: t('color-foreground-onAccentSubtle'),
  success: t('color-foreground-success'),
  onSuccess: t('color-foreground-onSuccess'),
  onSuccessSubtle: t('color-foreground-onSuccessSubtle'),
  warning: t('color-foreground-warning'),
  critical: t('color-foreground-critical'),
  onCritical: t('color-foreground-onCritical'),
  info: t('color-foreground-info'),
  onInfo: t('color-foreground-onInfo'),
  onWarningSubtle: t('color-foreground-onWarningSubtle'),
  onCriticalSubtle: t('color-foreground-onCriticalSubtle'),
  onInfoSubtle: t('color-foreground-onInfoSubtle'),
  onGradient: t('color-foreground-onGradient'),
  onGradientMuted: t('color-foreground-onGradientMuted'),
} as const;

export const border = {
  neutral: t('color-border-neutral'),
  strong: t('color-border-strong'),
  primary: t('color-border-primary'),
  accent: t('color-border-accent'),
  success: t('color-border-success'),
  warning: t('color-border-warning'),
  critical: t('color-border-critical'),
  info: t('color-border-info'),
} as const;

export const radius = {
  container: t('radius-container'),
  action: t('radius-action'),
  field: t('radius-field'),
  sub: t('radius-subcontainer'),
  badge: t('radius-badge'),
} as const;

export const space = {
  card: t('spacing-card'),
  cellY: t('spacing-cell-y'),
  cellX: t('spacing-cell-x'),
  gap: t('spacing-gap'),
  shell: t('spacing-shell'),
  ctrlY: t('spacing-control-y'),
  ctrlX: t('spacing-control-x'),
} as const;

export const shadow = {
  card: t('shadow-card'),
  elevated: t('shadow-elevated'),
} as const;

export const transition = {
  theme: t('transition-theme'),
  interactive: t('transition-interactive'),
  chart: t('transition-chart'),
} as const;

export const font = {
  primary: t('font-family-primary'),
  secondary: t('font-family-secondary'),
} as const;

export const gradient = t('gradient-primary');
