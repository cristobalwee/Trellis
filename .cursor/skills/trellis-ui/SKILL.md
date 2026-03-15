---
name: trellis-ui
description: Guidelines for building consistent UI in the Trellis web app. Covers typography, color, spacing, motion, accessibility, performance, and component patterns. Use when adding new pages, sections, components, or interactive features to the Astro/React frontend.
---

# Trellis UI Guidelines

## Architecture

- **Astro** static pages with **React islands** for interactivity.
- Use `client:load` for above-fold interactive content; `client:only="react"` for heavy components (modals, wizards).
- **Tailwind CSS v4** via `@theme` in `global.css` — there is no `tailwind.config.js`.
- Headless primitives from `@base-ui/react` (Input, Select, etc.), wrapped in `apps/web/src/components/ui/`.
- State management: `nanostores` + `@nanostores/react` (`useStore`).
- Icons: `lucide-react`, always `h-5 w-5`, `strokeWidth={1.5}`.

## Color

All custom colors are defined in OKLCH in the `@theme` block of `global.css`.

| Token | Usage |
|-------|-------|
| `forest-green` (+ 50–950 scale) | Primary brand, CTAs, active/selected states |
| `charcoal` | Body text, labels |
| `cream` | Warm background tint |
| `gray` | Neutral surface / subtle bg |
| `black` | Headings |
| `white` | Card/modal backgrounds |

### Rules

- **Use Tailwind opacity modifiers** for muted variants: `text-charcoal/80`, `border-charcoal/10`, `bg-forest-green/5`.
- Never hard-code hex colors in component files. Reference the theme tokens.
- Active/selected interactive states: `border-forest-green bg-forest-green/5 ring-4 ring-forest-green/10`.
- Hover borders: `hover:border-charcoal/20` or `hover:border-forest-green-400`.
- Decorative icon color: `text-forest-green`.

## Typography

| Role | Font family | Set via |
|------|------------|---------|
| Headings (h1–h6) | `GT Sectra` (serif) | `var(--font-serif)` — set globally in `global.css` |
| Body / UI | `Nunito Sans` (sans) | `var(--font-sans)` — set globally in `global.css` |

### Heading scale (responsive, set globally)

| Tag | Classes |
|-----|---------|
| h1 | `text-4xl md:text-6xl lg:text-7xl xl:text-7xl 2xl:text-8xl` |
| h2 | `text-4xl md:text-5xl lg:text-6xl` |
| h3 | `text-3xl md:text-4xl lg:text-5xl` |
| h4 | `text-2xl md:text-3xl` |
| h5 | `text-base md:text-lg` |

Do NOT add font-family or font-size classes to headings — they inherit from `global.css`. Heading line-height is `1.2`; body line-height is `1.7`.

### Body text rules

- Default body: `text-base` (16px).
- Sub-text / descriptions: `text-base md:text-lg text-charcoal/80` or `text-sm md:text-base text-charcoal/80`.
- Step/section labels: `<span class="text-charcoal/80 mb-4 text-base">`.
- Form labels: `text-base text-charcoal mb-4 font-medium`.
- Fine print / helper text: `text-sm text-charcoal/80` or `text-xs text-charcoal/80`.
- Headings use `text-black`; body uses `text-charcoal`.
- Anti-aliasing is set globally (`-webkit-font-smoothing: antialiased`). Don't re-apply.

## Spacing & Layout

### Container

Always wrap sections in `.container-custom` (`max-w-7xl mx-auto px-8 md:px-12 2xl:px-0`).

### Section spacing

Use `.section-spacing` (`py-24 lg:py-48`) for top-level page sections.

### Grid patterns

- Two-column forms/content: `grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12`.
- Three-column cards/pickers: `grid grid-cols-1 md:grid-cols-3 gap-6`.
- Prefer `gap` over margin between siblings. Common gaps: `gap-4`, `gap-6`, `gap-8`, `gap-12`, `gap-16`, `gap-24`.

### Inner content widths

- Hero text: `max-w-4xl lg:max-w-5xl xl:max-w-5xl 2xl:max-w-6xl mx-auto`.
- Comparison grids: `max-w-4xl mx-auto`.
- Modal content: `max-w-5xl mx-auto px-6 md:px-12`.
- Narrow prose: `max-w-3xl mx-auto`.

## Component Patterns

### Buttons

Use the global `.btn` classes. Don't rebuild button styles.

| Class | Usage |
|-------|-------|
| `.btn .btn-primary` | Main CTAs — green bg, white text, shadow, scale on hover |
| `.btn .btn-secondary` | Secondary actions — white bg, charcoal border |
| `.btn .btn-ghost` | Tertiary / text links |
| `.btn-sm` | Compact variant |

All buttons are `rounded-full` (pill shape), with `active:scale-95` and `hover:scale-105`.

### Cards

`.card` = `bg-white rounded-3xl p-4 md:p-8 shadow-md border border-gray-100 transition-all duration-300`.

### Inputs & Selects

Use the wrapped components from `components/ui/`:

```tsx
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
```

Default size: `text-xl px-6 py-4 rounded-2xl`. Compact size: `text-base px-3 py-2 rounded-xl`. Pass `size="compact"` when needed.

### Icons

```tsx
import { Braces } from 'lucide-react';

<div class="text-forest-green" aria-hidden="true">
  <Braces className="h-5 w-5" strokeWidth={1.5} />
</div>
```

Always wrap decorative icons in a container with `aria-hidden="true"`.

### Selection cards (VisualPicker pattern)

For option grids where the user picks one of N, follow the `Step4Style.tsx` pattern:
- `rounded-3xl border-2` cards.
- Selected: `border-forest-green bg-forest-green/5 ring-4 ring-forest-green/10`.
- Unselected: `border-charcoal/5 bg-white hover:border-charcoal/20`.
- Preview area inside each card: `bg-charcoal/5 rounded-2xl`.

### Step/section header pattern

Every wizard step and marketing section follows this structure:

```tsx
<span className="text-charcoal/80 mb-4 text-base">Step N</span>
<h2 className="text-5xl md:text-7xl mb-6">Title here</h2>
<p className="text-base md:text-xl text-charcoal/80 mb-12">
  Description text.
</p>
```

For centered marketing sections:

```html
<div class="text-center mb-8 md:mb-12 flex flex-col gap-4">
  <p class="text-base md:text-lg text-charcoal/80 mx-auto">Subtitle</p>
  <h2 class="max-w-2xl mx-auto">Heading text</h2>
</div>
```

## Motion & Animation

### Easing

| Name | Value | When |
|------|-------|------|
| Smooth | `cubic-bezier(0.4, 0, 0.2, 1)` / `var(--ease-smooth)` | Default transitions |
| Organic | `cubic-bezier(0.17, 0.84, 0.44, 1)` | Hero text fade-in, stagger animations |
| Tween | `[0.32, 0.72, 0, 1]` | Modal slides, expand/collapse (Framer) |
| Spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` / `var(--ease-spring)` | Bouncy hover effects |

### Transition durations

- Hover color changes: `duration-200`.
- Button & card transitions: `duration-250` to `duration-300`.
- Step stagger enter: `0.9s` per item, `0.02s` stagger.
- Step stagger exit: `0.26s` per item, `0.012s` stagger.
- Modal open/close: `1s`.
- Expand/collapse drawers: `0.3s`.

### CSS vs Framer Motion

- **Prefer CSS** (`transition-*`, `@keyframes`) for page-level entrance animations, hover states, and anything in `.astro` files.
- **Use Framer Motion** only inside React islands for: `AnimatePresence` mount/unmount, spring physics, `useSpring`/`useMotionValue` for pointer tracking.
- Stagger animations in the wizard use CSS classes (`step-animate-item-enter`, `step-animate-item-exit`) with JS-set `--step-item-delay` custom properties — not Framer.

### Performance rules for animation

- Always add `will-change: transform, opacity` (or `will-change-auto`) on elements being animated.
- Throttle mouse-tracking handlers with `requestAnimationFrame`.
- Throttle `resize` handlers with `requestAnimationFrame`.
- Use `safeToRemove()` from Framer's `usePresence` to control exit cleanup.

### Reduced motion

Respect `prefers-reduced-motion: reduce`. Disable animations:

```css
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    opacity: 1;
  }
}
```

Every new animation that involves movement or opacity must include a `prefers-reduced-motion` override.

## Accessibility

- Decorative icons: `aria-hidden="true"`.
- Icon-only buttons: `aria-label="descriptive text"`.
- Toggle switches: `role="switch"` + `aria-checked`.
- Modals: trap focus, close on Escape, add `body.modal-open` to prevent scroll.
- Form validation: use native `reportValidity()` before advancing.
- Custom fonts: `font-display: swap` to prevent FOIT.
- Interactive elements must have visible focus styles (the project uses `focus:outline-blue-500`).

## Performance

- Ship minimal JS: keep `.astro` files static; only hydrate React when interaction is required.
- Choose the lightest hydration directive: `client:load` > `client:visible` > `client:only`.
- Use `useCallback` for handlers passed as props to prevent unnecessary re-renders.
- Remove `console.log` from production code.
- Smooth scroll managed by Lenis — stop/start it properly around modals: `(window as any).lenis?.stop()` / `.start()`.
- Loading screen completes in `2.1s`; hero master delay is offset from this. Coordinate new page-load animations from the same timeline.

## Adding a New Section Checklist

1. Wrap in `<section class="section-spacing">` inside `<div class="container-custom">`.
2. Add a centered section header (subtitle `<p>` + `<h2>`).
3. Use theme colors only — no raw hex/rgb.
4. Responsive: mobile-first, breakpoints at `md`, `lg`, `xl`, `2xl`.
5. Animate entrance with `fadeInUp` or step stagger, including `prefers-reduced-motion` fallback.
6. Run through the accessibility checklist above.
7. Use existing UI primitives (`Input`, `Select`, `.btn`, `.card`) rather than creating new ones.
