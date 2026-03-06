import React from 'react';
import { Select as BaseSelect } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Trigger size variants (match Input sizing)
// ---------------------------------------------------------------------------

const TRIGGER_SIZES = {
  default: 'text-xl px-6 py-4 rounded-2xl',
  compact: 'text-sm px-3 py-2 rounded-lg',
} as const;

const POPUP_SIZES = {
  default: 'rounded-2xl p-2',
  compact: 'rounded-lg p-2',
} as const;

const ITEM_SIZES = {
  default: 'px-4 py-2.5 rounded-xl text-sm',
  compact: 'px-3 py-2 rounded-lg text-sm',
} as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  size?: keyof typeof TRIGGER_SIZES;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  label,
  size = 'default',
  className = '',
  triggerClassName = '',
  disabled,
}) => {
  const items = options.map((o) => ({ value: o.value, label: o.label }));

  return (
    <div className={`flex flex-col gap-3 w-full min-w-0 ${className}`}>
      {label && (
        <span className="text-sm text-charcoal">{label}</span>
      )}

      <BaseSelect.Root
        value={value}
        onValueChange={(val) => {
          if (val != null) onValueChange(val as string);
        }}
        items={items}
        disabled={disabled}
        modal={false}
      >
        <BaseSelect.Trigger
          className={`flex items-center gap-2 w-full bg-white border border-charcoal/20 text-charcoal hover:border-charcoal/30 focus:outline-blue-500 transition-colors cursor-pointer ${TRIGGER_SIZES[size]} ${triggerClassName}`}
        >
          {/* Render selected option's icon if present */}
          <SelectedIcon options={options} value={value} />
          <BaseSelect.Value
            placeholder={placeholder}
            className="flex-1 text-left truncate"
          />
          <BaseSelect.Icon className="text-charcoal/50 transition-transform data-popup-open:rotate-180">
            <ChevronDown size={size === 'compact' ? 14 : 16} />
          </BaseSelect.Icon>
        </BaseSelect.Trigger>

        <BaseSelect.Portal>
          <BaseSelect.Positioner
            side="bottom"
            sideOffset={4}
            alignItemWithTrigger={false}
            className="z-60"
          >
            <BaseSelect.Popup
              data-lenis-prevent
              className={`bg-white border border-charcoal/10 shadow-lg ${POPUP_SIZES[size]} outline-none max-h-60 overflow-y-auto overscroll-contain touch-pan-y
                origin-top
                transition-[transform,opacity] duration-150 ease-out
                data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.95]
                data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.95]`}
            >
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  className={`flex items-center gap-2 w-full text-left hover:bg-charcoal/5 transition-colors cursor-pointer
                    data-highlighted:bg-charcoal/5
                    data-selected:text-forest-green data-selected:font-medium
                    ${ITEM_SIZES[size]}`}
                >
                  {option.icon}
                  <BaseSelect.ItemText className="flex-1">
                    {option.label}
                  </BaseSelect.ItemText>
                  <BaseSelect.ItemIndicator>
                    <Check size={14} strokeWidth={2.5} />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.Popup>
          </BaseSelect.Positioner>
        </BaseSelect.Portal>
      </BaseSelect.Root>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Helper: renders icon of the currently selected option in the trigger
// ---------------------------------------------------------------------------

const SelectedIcon: React.FC<{ options: SelectOption[]; value: string }> = ({
  options,
  value,
}) => {
  const selected = options.find((o) => o.value === value);
  if (!selected?.icon) return null;
  return <>{selected.icon}</>;
};
