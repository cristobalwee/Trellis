import React from 'react';
import { Check } from 'lucide-react';
import { bg, fg, border, radius, transition } from './tokens';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  id?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, id }) => {
  const checkId = id || `checkbox-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
      <button
        id={checkId}
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: '16px',
          height: '16px',
          borderRadius: radius.badge,
          border: checked ? 'none' : `1.5px solid ${border.strong}`,
          backgroundColor: checked ? bg.primary : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          flexShrink: 0,
          marginTop: '1px',
          transition: transition.interactive,
        }}
      >
        {checked && <Check size={10} style={{ color: fg.onPrimary }} />}
      </button>
      {label && (
        <label
          htmlFor={checkId}
          style={{
            fontSize: '12px',
            color: checked ? fg.onBaseMuted : fg.onBase,
            fontFamily: 'inherit',
            cursor: 'pointer',
            textDecoration: checked ? 'line-through' : 'none',
            lineHeight: 1.4,
          }}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
