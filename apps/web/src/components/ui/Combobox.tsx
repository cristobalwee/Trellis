import React from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Size variants (shared tokens with Input & Select)
// ---------------------------------------------------------------------------

const INPUT_SIZES = {
  default: 'text-xl px-6 py-4 rounded-2xl pr-10',
  compact: 'text-base px-3 py-2 rounded-xl pr-8',
} as const;

const POPUP_SIZES = {
  default: 'rounded-2xl p-2',
  compact: 'rounded-xl p-1.5',
} as const;

const ITEM_SIZES = {
  default: 'px-4 py-2.5 rounded-xl text-sm',
  compact: 'px-3 py-2 rounded-lg text-sm',
} as const;

const CHEVRON_SIZE = { default: 16, compact: 14 } as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
  size?: keyof typeof INPUT_SIZES;
  className?: string;
  /** Override the displayed input text (e.g. custom font name) */
  displayValue?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const Combobox: React.FC<ComboboxProps> = ({
  value,
  onValueChange,
  options,
  placeholder = 'Search…',
  label,
  size = 'default',
  className = '',
  displayValue,
}) => {
  return (
    <div className={`flex flex-col gap-3 w-full min-w-0 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-charcoal">{label}</label>
      )}

      <BaseCombobox.Root
        value={value}
        onValueChange={(val) => {
          if (val != null) onValueChange(val as string);
        }}
        items={options}
      >
        <div className="relative flex items-center">
          <BaseCombobox.Input
            placeholder={placeholder}
            className={`w-full bg-white ${INPUT_SIZES[size]} border border-charcoal/20 text-charcoal hover:border-charcoal/30 focus:outline-blue-500 transition-colors placeholder:text-charcoal/50`}
          />
          <BaseCombobox.Trigger
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-charcoal/30 cursor-pointer"
          >
            <ChevronDown size={CHEVRON_SIZE[size]} className="transition-transform data-popup-open:rotate-180" />
          </BaseCombobox.Trigger>
        </div>

        <BaseCombobox.Portal>
          <BaseCombobox.Positioner
            side="bottom"
            sideOffset={4}
            className="z-60"
          >
            <BaseCombobox.Popup
              data-lenis-prevent
              className={`bg-white border border-charcoal/10 shadow-lg ${POPUP_SIZES[size]} max-h-60 overflow-y-auto overscroll-contain touch-pan-y outline-none
                origin-top
                transition-[transform,opacity] duration-150 ease-out
                data-starting-style:opacity-0 data-starting-style:scale-[0.95]
                data-ending-style:opacity-0 data-ending-style:scale-[0.95]`}
            >
              {options.map((option) => (
                <BaseCombobox.Item
                  key={option}
                  value={option}
                  className={`w-full text-left ${ITEM_SIZES[size]} text-charcoal cursor-pointer
                    transition-colors hover:bg-charcoal/5
                    data-highlighted:bg-charcoal/5
                    data-selected:font-medium data-selected:text-forest-green`}
                >
                  {option}
                </BaseCombobox.Item>
              ))}

              <BaseCombobox.Empty className="px-4 py-3 text-sm text-charcoal/40">
                No results found.
              </BaseCombobox.Empty>
            </BaseCombobox.Popup>
          </BaseCombobox.Positioner>
        </BaseCombobox.Portal>
      </BaseCombobox.Root>
    </div>
  );
};
