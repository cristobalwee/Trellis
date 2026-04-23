import React from 'react';
import {
  bg, fg, border, radius, space, transition,
  font, weight, field,
  type ControlSize,
} from './tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  size?: ControlSize;
}

const SIZE_STYLES: Record<ControlSize, React.CSSProperties> = {
  xs: { fontSize: field.xs.size, lineHeight: field.xs.lineHeight, padding: `${space.xs} ${space.sm}` },
  sm: { fontSize: field.sm.size, lineHeight: field.sm.lineHeight, padding: `${space.xs} ${space.md}` },
  md: { fontSize: field.md.size, lineHeight: field.md.lineHeight, padding: `${space.sm} ${space.lg}` },
  lg: { fontSize: field.lg.size, lineHeight: field.lg.lineHeight, padding: `${space.sm} ${space.xl}` },
};

const Input: React.FC<InputProps> = ({ label, id, size = 'md', style, ...rest }) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

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
      <input
        id={inputId}
        {...rest}
        style={{
          fontFamily: font.field,
          fontWeight: weight.field,
          color: fg.onBase,
          backgroundColor: bg.base,
          border: `1px solid ${border.neutral}`,
          borderRadius: radius.field,
          outline: 'none',
          transition: transition.interactive,
          width: '100%',
          boxSizing: 'border-box',
          ...SIZE_STYLES[size],
          ...style,
        }}
      />
    </div>
  );
};

export default Input;
