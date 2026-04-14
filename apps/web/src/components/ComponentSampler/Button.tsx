import React from 'react';
import { bg, fg, border, radius, space, transition } from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'critical';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    color: fg.onPrimary,
    backgroundColor: bg.primary,
    border: 'none',
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
    border: 'none',
  },
};

const SIZE_STYLES: Record<ButtonSize, React.CSSProperties> = {
  sm: { fontSize: '11px', padding: `${space.ctrlY} ${space.ctrlX}` },
  md: { fontSize: '12px', padding: `${space.ctrlY} ${space.ctrlX}` },
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
      fontFamily: 'inherit',
      fontWeight: 600,
      lineHeight: 1,
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
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
