import React from 'react';
import { bg, fg, border, radius, space, transition } from './tokens';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, id, style, ...rest }) => {
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
          fontFamily: 'inherit',
          fontSize: '12px',
          color: fg.onBase,
          backgroundColor: bg.base,
          border: `1px solid ${border.neutral}`,
          borderRadius: radius.field,
          padding: `${space.ctrlY} ${space.ctrlX}`,
          outline: 'none',
          transition: transition.interactive,
          width: '100%',
          boxSizing: 'border-box',
          ...style,
        }}
      />
    </div>
  );
};

export default Input;
