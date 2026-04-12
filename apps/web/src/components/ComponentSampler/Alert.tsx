import React from 'react';
import { Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { bg, fg, radius, space, transition } from './tokens';

export type AlertVariant = 'info' | 'success' | 'warning' | 'critical';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
}

const ICON_MAP = { info: Info, success: CheckCircle, warning: AlertTriangle, critical: XCircle };

const Alert: React.FC<AlertProps> = ({ variant = 'info', children }) => {
  const Icon = ICON_MAP[variant];

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: space.gap,
        padding: space.card,
        borderRadius: radius.container,
        backgroundColor: bg.primarySubtle,
        color: fg.onBase,
        fontSize: '12px',
        fontFamily: 'inherit',
        lineHeight: 1.5,
        transition: transition.theme,
      }}
    >
      <Icon size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
      <div>{children}</div>
    </div>
  );
};

export default Alert;
