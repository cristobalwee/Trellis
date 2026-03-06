import React from 'react';
import { Combobox as BaseCombobox } from '@base-ui/react/combobox';
import { ChevronDown } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  label?: string;
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
  className = '',
  displayValue,
}) => {
  return (
    <div className={`flex flex-col gap-3 w-full min-w-0 ${className}`}>
      {label && (
        <label className="text-base text-charcoal font-medium">{label}</label>
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
            className="text-xl w-full px-6 py-4 rounded-2xl border border-charcoal/20 text-charcoal focus:outline-blue-500 placeholder:text-charcoal/50 pr-10"
          />
          <BaseCombobox.Trigger
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-charcoal/30 cursor-pointer"
          >
            <ChevronDown size={16} className="transition-transform data-popup-open:rotate-180" />
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
              className="bg-white border border-charcoal/10 shadow-lg rounded-2xl p-2 max-h-60 overflow-y-auto overscroll-contain touch-pan-y outline-none
                origin-top
                transition-[transform,opacity] duration-150 ease-out
                data-[starting-style]:opacity-0 data-[starting-style]:scale-[0.95]
                data-[ending-style]:opacity-0 data-[ending-style]:scale-[0.95]"
            >
              {options.map((option) => (
                <BaseCombobox.Item
                  key={option}
                  value={option}
                  className="w-full text-left px-4 py-2.5 rounded-xl text-sm text-charcoal cursor-pointer
                    transition-colors hover:bg-charcoal/5
                    data-highlighted:bg-charcoal/5
                    data-selected:font-medium data-selected:text-forest-green"
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
