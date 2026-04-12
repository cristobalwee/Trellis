import React from 'react';
import { bg, fg, radius, transition } from './tokens';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, id }) => {
  const toggleId = id || (label ? `toggle-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          width: '32px',
          height: '18px',
          borderRadius: '999px',
          border: 'none',
          cursor: 'pointer',
          backgroundColor: checked ? bg.primary : bg.sunken,
          transition: transition.interactive,
          padding: 0,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '16px' : '2px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: fg.onPrimary,
            transition: transition.interactive,
          }}
        />
      </button>
      {label && (
        <label
          htmlFor={toggleId}
          style={{
            fontSize: '11px',
            color: fg.onBase,
            fontFamily: 'inherit',
            cursor: 'pointer',
          }}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Toggle;
