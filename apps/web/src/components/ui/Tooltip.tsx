import React from 'react';
import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';

export interface TooltipProps {
  label: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactElement;
}

export const Tooltip: React.FC<TooltipProps> = ({ label, side = 'right', children }) => (
  <BaseTooltip.Provider delay={0} closeDelay={0}>
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={6}>
          <BaseTooltip.Popup
            className="
              rounded-lg bg-charcoal px-2.5 py-1.5 text-xs text-white shadow-lg
              transition-[opacity,transform] duration-150
              data-[starting-style]:opacity-0 data-[starting-style]:scale-95
              data-[ending-style]:opacity-0 data-[ending-style]:scale-95
              data-[open]:opacity-100 data-[open]:scale-100
              origin-[var(--transform-origin)]
            "
          >
            {label}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  </BaseTooltip.Provider>
);
