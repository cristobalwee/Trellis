import React from 'react';
import {
  bg, fg, border, radius, space, transition,
  font, weight, field,
  type ControlSize,
} from './tokens';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  size?: ControlSize;
  icon?: React.FC<{ size?: number; style?: React.CSSProperties }>;
}

const SIZE_STYLES: Record<ControlSize, React.CSSProperties> = {
  xs: { fontSize: field.xs.size, lineHeight: field.xs.lineHeight, padding: `${space.sm}` },
  sm: { fontSize: field.sm.size, lineHeight: field.sm.lineHeight, padding: `${space.sm}` },
  md: { fontSize: field.md.size, lineHeight: field.md.lineHeight, padding: `${space.md}` },
  lg: { fontSize: field.lg.size, lineHeight: field.lg.lineHeight, padding: `${space.lg}` },
};

const ICON_SIZE: Record<ControlSize, number> = {
  xs: 11,
  sm: 12,
  md: 13,
  lg: 15,
};

const Input: React.FC<InputProps> = ({ label, id, size = 'md', style, icon: Icon, ...rest }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const sharedTextStyle: React.CSSProperties = {
    fontFamily: font.field,
    fontWeight: weight.field,
    color: fg.onBase,
    ...SIZE_STYLES[size],
  };

  const containerBaseStyle: React.CSSProperties = {
    backgroundColor: bg.base,
    border: `1px solid ${border.neutral}`,
    borderRadius: radius.field,
    transition: transition.interactive,
    width: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '11px',
            fontWeight: 500,
            color: fg.onBase,
            fontFamily: 'inherit',
          }}
        >
          {label}
        </label>
      )}
      {Icon ? (
        <div
          style={{
            ...containerBaseStyle,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            ...sharedTextStyle,
            ...style,
          }}
        >
          <Icon size={ICON_SIZE[size]} style={{ color: fg.onBaseFaint, flexShrink: 0 }} />
          <input
            id={inputId}
            {...rest}
            style={{
              border: 'none',
              background: 'none',
              outline: 'none',
              padding: 0,
              fontFamily: 'inherit',
              fontWeight: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              color: 'inherit',
              width: '100%',
            }}
          />
        </div>
      ) : (
        <input
          id={inputId}
          {...rest}
          style={{
            ...sharedTextStyle,
            ...containerBaseStyle,
            outline: 'none',
            ...style,
          }}
        />
      )}
    </div>
  );
};

export default Input;
