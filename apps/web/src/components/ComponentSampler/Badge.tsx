import React from 'react';
import { bg, fg, radius, space, transition } from './tokens';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'critical' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const VARIANT_STYLES: Record<BadgeVariant, { color: string; backgroundColor: string }> = {
  default: { color: fg.onBaseMuted, backgroundColor: bg.raisedHover },
  primary: { color: fg.primary, backgroundColor: bg.primarySubtle },
  success: { color: fg.onSuccessSubtle, backgroundColor: bg.successSubtle },
  warning: { color: fg.onWarningSubtle, backgroundColor: bg.warningSubtle },
  critical: { color: fg.onCriticalSubtle, backgroundColor: bg.criticalSubtle },
  info: { color: fg.onInfoSubtle, backgroundColor: bg.infoSubtle },
};

const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => (
  <span
    style={{
      display: 'inline-block',
      fontSize: '10px',
      fontWeight: 600,
      fontFamily: 'inherit',
      borderRadius: radius.badge,
      padding: `3px ${space.lg}`,
      transition: transition.theme,
      ...VARIANT_STYLES[variant],
    }}
  >
    {children}
  </span>
);

export default Badge;
