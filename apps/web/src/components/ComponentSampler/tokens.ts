// Shared, typed accessors for the CSS custom properties emitted by
// `generateDesignTokens()` (see `@trellis/generator`).

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
  container: t('shape-radius-container'),
  action: t('shape-radius-action'),
  field: t('shape-radius-field'),
  sub: t('shape-radius-subcontainer'),
  badge: t('shape-radius-badge'),
} as const;

export const space = {
  xs: t('space-xs'),
  sm: t('space-sm'),
  md: t('space-md'),
  lg: t('space-lg'),
  xl: t('space-xl'),
  '2xl': t('space-2xl'),
  '3xl': t('space-3xl'),
  '4xl': t('space-4xl'),
  '5xl': t('space-5xl'),
  '6xl': t('space-6xl'),
} as const;

export const shadow = {
  raised: t('shadow-raised'),
  overlay: t('shadow-overlay'),
} as const;

export const transition = {
  theme: t('transition-theme'),
  interactive: t('transition-interactive'),
  chart: t('transition-chart'),
} as const;

export const font = {
  primary: t('font-body-family'),
  secondary: t('font-heading-family'),
  action: t('font-action-family'),
  field: t('font-field-family'),
} as const;

export const weight = {
  heading: t('font-heading-weight'),
  bodyRegular: t('font-body-weight-regular'),
  bodyBold: t('font-body-weight-bold'),
  action: t('font-action-weight'),
  field: t('font-field-weight'),
} as const;

// Control-typography ramps. Each t-shirt size gives you a font-size and a
// line-height that's pre-tuned to match an icon-only button/input at the
// same size, so text and icon variants share outer heights:
//   xs → 12px text + 14px icon
//   sm → 14px text + 16px icon
//   md → 16px text + 20px icon
//   lg → 18px text + 24px icon
export type ControlSize = 'xs' | 'sm' | 'md' | 'lg';

export const action: Record<ControlSize, { size: string; lineHeight: string }> = {
  xs: { size: t('font-action-xs-size'), lineHeight: t('font-action-xs-lineheight') },
  sm: { size: t('font-action-sm-size'), lineHeight: t('font-action-sm-lineheight') },
  md: { size: t('font-action-md-size'), lineHeight: t('font-action-md-lineheight') },
  lg: { size: t('font-action-lg-size'), lineHeight: t('font-action-lg-lineheight') },
};

export const field: Record<ControlSize, { size: string; lineHeight: string }> = {
  xs: { size: t('font-field-xs-size'), lineHeight: t('font-field-xs-lineheight') },
  sm: { size: t('font-field-sm-size'), lineHeight: t('font-field-sm-lineheight') },
  md: { size: t('font-field-md-size'), lineHeight: t('font-field-md-lineheight') },
  lg: { size: t('font-field-lg-size'), lineHeight: t('font-field-lg-lineheight') },
};

export const gradient = t('gradient-primary');
