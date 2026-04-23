import React from 'react';
import {
  bg, fg, border, radius, space, transition,
  font, weight, action,
  type ControlSize,
} from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'critical';
export type ButtonSize = ControlSize;

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

// Every variant carries a 1px border (even transparent ones) so all buttons —
// and the sibling Input component, which is also 1px-bordered — resolve to the
// same outer height at a given size. Drop the border and primary/critical would
// render 2px shorter than outline/secondary/input at the same size.
const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    color: fg.onPrimary,
    backgroundColor: bg.primary,
    border: '1px solid transparent',
  },
  secondary: {
    color: fg.onBase,
    backgroundColor: bg.raised,
    border: `1px solid ${border.neutral}`,
  },
  ghost: {
    color: fg.onBaseMuted,
    backgroundColor: 'transparent',
    border: '1px solid transparent',
  },
  outline: {
    color: fg.onBase,
    backgroundColor: 'transparent',
    border: `1px solid ${border.neutral}`,
  },
  critical: {
    color: fg.onCritical,
    backgroundColor: bg.critical,
    border: '1px solid transparent',
  },
};

// Padding scales alongside the type ladder. Line-height already pins the
// control's inner height to the matching icon size (14/16/20/24px), so we
// only need padding to breathe proportionally at each tier.
const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  xs: {
    fontSize:   action.xs.size,
    lineHeight: action.xs.lineHeight,
    padding:    `${space.xs} ${space.sm}`,
    gap:        space.xs,
  },
  sm: {
    fontSize:   action.sm.size,
    lineHeight: action.sm.lineHeight,
    padding:    `${space.sm} ${space.lg}`,
    gap:        space.xs,
  },
  md: {
    fontSize:   action.md.size,
    lineHeight: action.md.lineHeight,
    padding:    `${space.md} ${space.xl}`,
    gap:        space.xs,
  },
  lg: {
    fontSize:   action.lg.size,
    lineHeight: action.lg.lineHeight,
    padding:    `${space.lg} ${space['2xl']}`,
    gap:        space.sm,
  },
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  style,
  ...rest
}) => (
  <button
    {...rest}
    style={{
      fontFamily: font.action,
      fontWeight: weight.action,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.action,
      transition: transition.interactive,
      ...VARIANT_STYLES[variant],
      ...SIZE_STYLES[size],
      ...style,
    }}
  >
    {children}
  </button>
);

export default Button;
