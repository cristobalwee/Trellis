import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabBar from '../components/BrandIntake/TabBar';
import { ColorPickerPopover } from '../components/ui/ColorPickerPopover';

expect.extend({
  toHaveNoViolations(received) {
    const violations = received?.violations ?? [];
    return {
      pass: violations.length === 0,
      message: () => violations.map((violation: { id: string; help: string }) => `${violation.id}: ${violation.help}`).join('\n'),
    };
  },
});

declare module 'vitest' {
  interface Assertion<T = unknown> {
    toHaveNoViolations(): T;
  }
}

describe('core accessibility controls', () => {
  it('renders the configuration tabs with tab semantics and keyboard navigation', async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    const { container } = render(
      <>
        <TabBar activeTab="color" onTabChange={onTabChange} />
        <div id="theme-tab-panel-color" role="tabpanel" aria-labelledby="theme-tab-color" />
        <div id="theme-tab-panel-typography" role="tabpanel" aria-labelledby="theme-tab-typography" hidden />
        <div id="theme-tab-panel-style" role="tabpanel" aria-labelledby="theme-tab-style" hidden />
      </>,
    );

    const tabs = screen.getAllByRole('tab');
    expect(screen.getByRole('tablist', { name: /theme configuration/i })).toBeInTheDocument();
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');

    tabs[0].focus();
    await user.keyboard('{ArrowRight}');
    expect(onTabChange).toHaveBeenCalledWith('typography');
    await expect(axe(container)).resolves.toHaveNoViolations();
  });

  it('exposes the color picker trigger as a dialog control', async () => {
    const { container } = render(
      <ColorPickerPopover
        color="#2e7bab"
        onChange={vi.fn()}
        label="Primary color"
        showHexInput
      />,
    );

    const trigger = screen.getByRole('button', { name: /primary color/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(axe(container)).resolves.toHaveNoViolations();
  });
});
