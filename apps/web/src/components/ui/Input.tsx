import React from 'react';
import { Input as BaseInput } from '@base-ui/react/input';

const SIZE_CLASSES = {
  default: 'text-xl px-6 py-4 rounded-2xl',
  compact: 'text-base px-3 py-2 rounded-xl',
} as const;

export interface InputProps
  extends Omit<React.ComponentPropsWithRef<typeof BaseInput>, 'size'> {
  size?: keyof typeof SIZE_CLASSES;
}

export const Input = React.forwardRef<HTMLElement, InputProps>(
  ({ size = 'default', className = '', ...rest }, ref) => (
    <BaseInput
      ref={ref}
      className={`w-full min-w-0 bg-white ${SIZE_CLASSES[size]} border border-charcoal/20 text-charcoal hover:border-charcoal/30 focus:outline-blue-500 transition-colors placeholder:text-charcoal/50 ${className}`}
      {...rest}
    />
  ),
);

Input.displayName = 'Input';
