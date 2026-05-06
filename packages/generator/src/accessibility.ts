import { wcagContrast } from 'culori';

export interface ContrastPair {
  name: string;
  foreground: string;
  background: string;
  minimum: number;
}

export interface ContrastValidationFailure extends ContrastPair {
  ratio: number;
  foregroundValue: string;
  backgroundValue: string;
}

const WCAG_AA_TEXT_RATIO = 4.5;

export const DEFAULT_CONTRAST_PAIRS: ContrastPair[] = [
  { name: 'body on base', foreground: '--color-foreground-onBase', background: '--color-background-base', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'muted text on base', foreground: '--color-foreground-onBaseMuted', background: '--color-background-base', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'raised text', foreground: '--color-foreground-onRaised', background: '--color-background-raised', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'sunken text', foreground: '--color-foreground-onSunken', background: '--color-background-sunken', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'primary surface', foreground: '--color-foreground-onPrimary', background: '--color-background-primary', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'accent surface', foreground: '--color-foreground-onAccent', background: '--color-background-accent', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'success surface', foreground: '--color-foreground-onSuccess', background: '--color-background-success', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'warning surface', foreground: '--color-foreground-onWarning', background: '--color-background-warning', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'critical surface', foreground: '--color-foreground-onCritical', background: '--color-background-critical', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'info surface', foreground: '--color-foreground-onInfo', background: '--color-background-info', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'primary subtle surface', foreground: '--color-foreground-onPrimarySubtle', background: '--color-background-primarySubtle', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'accent subtle surface', foreground: '--color-foreground-onAccentSubtle', background: '--color-background-accentSubtle', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'success subtle surface', foreground: '--color-foreground-onSuccessSubtle', background: '--color-background-successSubtle', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'warning subtle surface', foreground: '--color-foreground-onWarningSubtle', background: '--color-background-warningSubtle', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'critical subtle surface', foreground: '--color-foreground-onCriticalSubtle', background: '--color-background-criticalSubtle', minimum: WCAG_AA_TEXT_RATIO },
  { name: 'info subtle surface', foreground: '--color-foreground-onInfoSubtle', background: '--color-background-infoSubtle', minimum: WCAG_AA_TEXT_RATIO },
];

function resolveTokenValue(tokens: Record<string, string>, value: string, depth = 0): string {
  if (depth > 8) return value;
  const match = value.match(/^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/);
  if (!match) return value;
  const next = tokens[match[1]];
  return next ? resolveTokenValue(tokens, next, depth + 1) : value;
}

function resolveNamedToken(tokens: Record<string, string>, name: string): string {
  return resolveTokenValue(tokens, tokens[name] ?? name);
}

export function validateWcagAaContrast(
  tokens: Record<string, string>,
  pairs: ContrastPair[] = DEFAULT_CONTRAST_PAIRS,
): ContrastValidationFailure[] {
  const failures: ContrastValidationFailure[] = [];

  for (const pair of pairs) {
    const foregroundValue = resolveNamedToken(tokens, pair.foreground);
    const backgroundValue = resolveNamedToken(tokens, pair.background);
    const ratio = wcagContrast(backgroundValue, foregroundValue);
    if (!Number.isFinite(ratio) || ratio < pair.minimum) {
      failures.push({
        ...pair,
        ratio,
        foregroundValue,
        backgroundValue,
      });
    }
  }

  return failures;
}
