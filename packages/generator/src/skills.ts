import { parse, converter } from 'culori';
import { NAMED_HUES } from './colorGeneration.js';
import type { BrandConfig, HeadlessLib } from './types.js';
import type { TokenSet } from './exportTokens.js';

// ---------------------------------------------------------------------------
// Skill artifact types
// ---------------------------------------------------------------------------

export type SkillId = 'tokens' | 'components' | 'accessibility';

export interface SkillArtifact {
  id: SkillId;
  filename: string;
  title: string;
  description: string;
  content: string;
}

// ---------------------------------------------------------------------------
// Token introspection helpers (shared with — and originally lived in —
// exportTokens.ts; centralized here so skill content stays in sync with the
// emitted token set).
// ---------------------------------------------------------------------------

const toOklch = converter('oklch');
const VAR_REF_RE = /^var\(\s*(--[A-Za-z0-9-]+)\s*\)$/;

function findNearestNamedHue(hue: number): { name: string; hue: number } {
  const normalized = ((hue % 360) + 360) % 360;
  let best = NAMED_HUES[0];
  let bestDist = 360;
  for (const nh of NAMED_HUES) {
    const diff = Math.abs(normalized - nh.hue);
    const dist = Math.min(diff, 360 - diff);
    if (dist < bestDist) {
      bestDist = dist;
      best = nh;
    }
  }
  return best;
}

function extractEmittedHues(tokens: Record<string, string>): string[] {
  const hues = new Set<string>();
  for (const prop of Object.keys(tokens)) {
    const m = prop.match(/^--color-([a-z]+)-\d+$/);
    if (m) hues.add(m[1]);
  }
  return Array.from(hues);
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function pickToken(tokens: Record<string, string>, candidates: string[], fallback: string): string {
  for (const name of candidates) {
    if (name in tokens) return name;
  }
  return fallback;
}

function resolvePx(tokens: Record<string, string>, name: string): string {
  const raw = tokens[name];
  if (!raw) return '?';
  const m = raw.match(VAR_REF_RE);
  const value = m ? tokens[m[1]] ?? raw : raw;
  return value.trim();
}

function padRight(s: string, width: number): string {
  return s.length >= width ? s : s + ' '.repeat(width - s.length);
}

interface SystemFacts {
  primaryHueName: string;
  primaryHueAngle: number;
  supportingHues: string[];
  bgBase: string;
  bgRaised: string;
  bgOverlay: string;
  bgSunken: string;
  bgPrimary: string;
  fgOnPri: string;
  fgOnBase: string;
  fgMuted: string;
  fgPrimary: string;
  borderTok: string;
  densityBase: string;
  bodyMd: string;
  heading2xl: string;
  radiusContainer: string;
  radiusAction: string;
}

function deriveFacts(config: BrandConfig, set: TokenSet): SystemFacts {
  const oklch = toOklch(parse(config.primaryColor) ?? config.primaryColor);
  const angle = oklch ? (((oklch.h ?? 0) % 360) + 360) % 360 : 0;
  const named = findNearestNamedHue(angle);
  const primaryHueKey = named.name.toLowerCase();
  const emitted = extractEmittedHues(set.light);
  const supporting = emitted.filter((h) => h !== 'neutral' && h !== primaryHueKey).map(capitalize);

  return {
    primaryHueName:  named.name,
    primaryHueAngle: angle,
    supportingHues:  supporting,
    bgBase:    pickToken(set.light, ['--color-background-base'],          '--color-background-base'),
    bgRaised:  pickToken(set.light, ['--color-background-raised'],        '--color-background-raised'),
    bgOverlay: pickToken(set.light, ['--color-background-overlay'],       '--color-background-overlay'),
    bgSunken:  pickToken(set.light, ['--color-background-sunken'],        '--color-background-sunken'),
    bgPrimary: pickToken(set.light, ['--color-background-primary'],       '--color-background-primary'),
    fgOnPri:   pickToken(set.light, ['--color-foreground-onPrimary'],     '--color-foreground-onPrimary'),
    fgOnBase:  pickToken(set.light, ['--color-foreground-onBase'],        '--color-foreground-onBase'),
    fgMuted:   pickToken(set.light, ['--color-foreground-onBaseMuted'],   '--color-foreground-onBaseMuted'),
    fgPrimary: pickToken(set.light, ['--color-foreground-primary'],       '--color-foreground-primary'),
    borderTok: pickToken(set.light, ['--color-border-neutral', '--color-border-strong'], '--color-border-neutral'),
    densityBase:     resolvePx(set.light, '--dimension-100'),
    bodyMd:          resolvePx(set.light, '--typography-size-200'),
    heading2xl:      resolvePx(set.light, '--typography-size-500'),
    radiusContainer: pickToken(set.light, ['--shape-radius-container'], '--shape-radius-container'),
    radiusAction:    pickToken(set.light, ['--shape-radius-action'],    '--shape-radius-action'),
  };
}

function frontmatter(name: string, description: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n`;
}

// ---------------------------------------------------------------------------
// Skill 1 — Tokens & theming
// ---------------------------------------------------------------------------

function generateTokensSkill(config: BrandConfig, set: TokenSet): string {
  const f = deriveFacts(config, set);
  const tokenCount = Object.keys(set.light).length;
  const supportingLine = f.supportingHues.length > 0
    ? f.supportingHues.map((h) => `\`${h}\``).join(', ')
    : '_(none — primary hue covers all accent roles)_';

  const spaceRows = [
    ['--space-xs',  '--dimension-50',   '--space-xs'],
    ['--space-sm',  '--dimension-100',  '--space-sm'],
    ['--space-md',  '--dimension-150',  '--space-md'],
    ['--space-lg',  '--dimension-200',  '--space-lg'],
    ['--space-xl',  '--dimension-300',  '--space-xl'],
    ['--space-2xl', '--dimension-400',  '--space-2xl'],
    ['--space-3xl', '--dimension-500',  '--space-3xl'],
    ['--space-4xl', '--dimension-600',  '--space-4xl'],
    ['--space-5xl', '--dimension-800',  '--space-5xl'],
    ['--space-6xl', '--dimension-1000', '--space-6xl'],
  ] as const;
  const spaceTable = spaceRows
    .map(([sem, prim, ref]) =>
      `${padRight(sem, 11)} → ${padRight(prim, 18)} (${resolvePx(set.light, ref)})`,
    )
    .join('\n');

  return `${frontmatter(
    'tokens-and-theming',
    'Token contract for this design system: when to reach for each token, how primitive and semantic layers interact, and how theme swapping works.',
  )}
# Tokens & theming

This design system was generated by [Trellis](https://trellisdesign.io). It ships ${tokenCount} CSS custom properties organized into a primitive layer (raw values) and a semantic layer (role-based aliases). **Always reach for the semantic token first** — it's what survives a theme swap or a downstream config change.

## Color palette

- Primary hue: \`${f.primaryHueName}\` (OKLCH ≈ ${f.primaryHueAngle.toFixed(1)}°)
- Supporting hues: ${supportingLine}
- Neutral ramp (tint: \`${config.neutralTint}\`)

Every ramp is generated in OKLCH so contrast relationships hold across hues. Primitive tokens look like \`--color-<hue>-<step>\` (e.g. \`--color-${f.primaryHueName.toLowerCase()}-500\`); semantic tokens reference them by role.

## Token architecture

The system uses three mental models — **elevation**, **identity**, and **modifiers** — wired together by semantic aliases.

### Backgrounds

Elevation hierarchy is opaque: \`sunken\` → \`base\` → \`raised\` → \`overlay\`. Identity surfaces (\`primary\`, \`accent\`, \`success\`, \`warning\`, \`critical\`, \`info\`) carry semantic meaning, not elevation.

### Foregrounds

- \`foreground/onBase\`, \`foreground/onBaseMuted\` — body text on elevation surfaces.
- \`foreground/onPrimary\`, \`foreground/onAccent\`, \`foreground/onCritical\`, … — text on identity surfaces. Always pair with the matching background.
- \`foreground/primary\`, \`foreground/accent\` — saturated brand colors for accents and links, **not body copy**.

### Modifiers

\`*Subtle\` backgrounds (e.g. \`background/primarySubtle\`) are desaturated, lighter variants based on relative lightness — never alpha. Likewise \`foreground/onBaseMuted\` is a reduced-contrast text color via lightness, not opacity.

## Decision tree: which token do I use?

\`\`\`
Need a color?
├── Background of a region?
│   ├── Default page surface          → ${f.bgBase}
│   ├── Card / elevated surface       → ${f.bgRaised}
│   ├── Modal / popover               → ${f.bgOverlay}
│   ├── Recessed / muted area         → ${f.bgSunken}
│   ├── Brand emphasis (CTA)          → ${f.bgPrimary}
│   └── Status surface                → --color-background-{success|warning|critical|info}
│
├── Text?
│   ├── Body copy                     → ${f.fgOnBase}
│   ├── Secondary / muted             → ${f.fgMuted}
│   ├── Accented text or link         → ${f.fgPrimary}
│   ├── On a primary surface          → ${f.fgOnPri}
│   └── On a status surface           → --color-foreground-on{Success|Warning|Critical|Info}
│
└── Border / divider?                 → ${f.borderTok} (or --color-border-strong)

Need a size?
├── Padding / gap / margin            → --space-* (semantic, t-shirt scale)
├── Structural measurement            → --dimension-* (primitive, fixed px ladder)
├── Corner radius                     → --shape-radius-{container|action|field|badge|max}
└── Stroke width                      → --shape-border-{thin|regular|thick}

Need a type style?
├── Marketing/section title           → --font-heading-{xs..4xl}-size + --font-heading-weight
├── Body copy                         → --font-body-md-size + --font-body-weight-regular
├── Button / tab label                → --font-action-{xs..lg}-size + --font-action-weight
└── Input text                        → --font-field-{xs..lg}-size + --font-field-weight
\`\`\`

## Spacing

Density is configured to **${config.density}**, which sets \`--dimension-100\` = ${f.densityBase}. Every other dimension step is a multiple — changing density rescales every space, radius, and control size at once.

\`\`\`
${spaceTable}
\`\`\`

**Rule of thumb**: reach for \`--space-*\` for padding/gap/margin. Only use \`--dimension-*\` directly for structural measurements (grid tracks, fixed rails, stroke widths). Never use raw \`px\` / \`rem\` in component CSS — those don't track density.

## Shape & shadow

- Corner radii: \`--shape-radius-{container, subcontainer, supercontainer, action, field, badge, max}\`. Configured roundness preset: **${config.roundness}**.
- Stroke widths: \`--shape-border-{thin, regular, thick}\`.
- Shadow scale (preset: **${config.shadows}**): \`--shadow-{xs, sm, md, lg, xl}\`.

## Typography

- Size ladder: \`--typography-size-{100..800}\` (~minor-third stepped).
- Weights: \`--typography-weight-{300..900}\` — only the weights configured fonts use are emitted.
- Families: \`--typography-font-family-body\`, \`--typography-font-family-heading\`.
- Semantic styles: \`heading\`, \`body\`, \`action\`, \`field\`. Pick by role first, then size.

\`\`\`css
.page-title {
  font-family: var(--font-heading-family);
  font-size:   var(--font-heading-2xl-size);   /* ≈ ${f.heading2xl} */
  font-weight: var(--font-heading-weight);
  line-height: var(--font-heading-lineheight);
}

.body-copy {
  font-family: var(--font-body-family);
  font-size:   var(--font-body-md-size);       /* ≈ ${f.bodyMd} */
  font-weight: var(--font-body-weight-regular);
  line-height: var(--font-body-lineheight);
}
\`\`\`

## Theme swapping

Light is the default. Dark mode is activated by setting \`data-theme="dark"\` on the \`:root\` (or any ancestor element):

\`\`\`html
<html data-theme="dark">…</html>
\`\`\`

The CSS export emits \`:root[data-theme="dark"] { … }\` containing only the *diff* from light — primitive ramp values that differ per mode, and any semantic token whose ramp step changes. Everything else cascades through unchanged.

\`\`\`ts
// Example: respect prefers-color-scheme + remember user choice
const stored = localStorage.getItem('theme');
const initial = stored ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
document.documentElement.dataset.theme = initial;

function setTheme(t: 'light' | 'dark') {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('theme', t);
}
\`\`\`

### Multiple themes on one page

Because dark mode is selector-driven (not media-query-driven), you can scope a different theme to a subtree:

\`\`\`html
<main>
  <article data-theme="dark">Always dark, even in a light page</article>
</main>
\`\`\`

## CSS cascade layers

\`\`\`css
@layer trellis.base, trellis.theme, trellis.overrides;
\`\`\`

- \`base\` — element defaults.
- \`theme\` — generated token values (the file you just exported).
- \`overrides\` — your customizations (escape hatch, lowest precedence-fight risk).

Place app-level token edits in \`@layer trellis.overrides\` so they win against generated tokens without raising specificity.

## When to break the rules

- **Hard-coded colors**: only inside SVG illustrations or assets where the artwork's identity is the color itself.
- **Hard-coded sizes**: only for one-off structural measurements that wouldn't make sense at any other scale (e.g. a 1px hairline rule).
- **\`!important\`**: never on tokens. If specificity is biting you, move the rule into \`@layer trellis.overrides\`.
`;
}

// ---------------------------------------------------------------------------
// Skill 2 — Component creation
// ---------------------------------------------------------------------------

const HEADLESS_LIB_INFO: Record<HeadlessLib, { label: string; importPath: string; primitivesNote: string }> = {
  'base-ui':    { label: 'Base UI',    importPath: '@base-ui/react',                primitivesNote: 'Base UI exposes one primitive per file (e.g. `@base-ui/react/dialog` → `Dialog.Root`, `Dialog.Trigger`, `Dialog.Popup`).' },
  'radix':      { label: 'Radix UI',   importPath: '@radix-ui/react-*',              primitivesNote: 'Radix exposes one primitive per package (e.g. `@radix-ui/react-dialog`).' },
  'react-aria': { label: 'React Aria', importPath: 'react-aria-components',          primitivesNote: 'React Aria Components ship as a single package; import primitives by name from `react-aria-components`.' },
  'headless-ui':{ label: 'Headless UI',importPath: '@headlessui/react',              primitivesNote: 'Headless UI exposes primitives from a single package; reach for `Dialog`, `Listbox`, `Menu`, etc.' },
};

function generateComponentsSkill(config: BrandConfig, set: TokenSet): string {
  const f = deriveFacts(config, set);
  const lib = HEADLESS_LIB_INFO[config.headlessLib];

  return `${frontmatter(
    'component-creation',
    `How to build components against this token system using ${lib.label}: token application rules, interactivity, and composition.`,
  )}
# Component creation

This document is the contract for writing new components against this design system. **Read [tokens-and-theming](./tokens-and-theming.skill.md) first** — it covers which token to reach for. This document covers how to apply them.

Headless library: **${lib.label}** (\`${lib.importPath}\`). ${lib.primitivesNote} The library handles state, keyboard, focus, and ARIA — your job is to apply tokens.

## The five rules

1. **Always reach for a semantic token** before a primitive. Reach for a primitive only when no semantic token fits.
2. **Never write a raw \`px\`, \`rem\`, or hex** value in component CSS. If you need one, you need a new token — escalate.
3. **Tokens compose; specificity doesn't**. Override at the component boundary by accepting a prop or a CSS variable, not by raising selector specificity.
4. **Interactivity is a scrim, not a color swap** (see "Interactive states" below).
5. **Components own structure; tokens own values**. Don't pass \`color\` props down through the tree — let CSS variables flow through inheritance.

## Component shape

Every component follows the same skeleton:

\`\`\`tsx
import { forwardRef } from 'react';
// import primitives from your headless lib of choice — see top of this skill

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', ...rest }, ref) => (
    <button
      ref={ref}
      className={\`btn btn-\${variant} btn-\${size} \${className}\`}
      {...rest}
    />
  ),
);
Button.displayName = 'Button';
\`\`\`

CSS lives next to the component. Token references only — no raw values.

\`\`\`css
.btn {
  position: relative;          /* hosts the ::after scrim */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  border-radius: var(${f.radiusAction});
  border: var(--shape-border-regular) solid transparent;
  font-family: var(--font-action-family);
  font-weight: var(--font-action-weight);
  line-height: var(--font-action-lineheight);
  cursor: pointer;
  transition: background-color var(--transition-fast) var(--transition-easing-standard),
              border-color    var(--transition-fast) var(--transition-easing-standard);
}

/* Sizes */
.btn-sm { padding: var(--space-xs) var(--space-sm);  font-size: var(--font-action-sm-size); }
.btn-md { padding: var(--space-sm) var(--space-md);  font-size: var(--font-action-md-size); }
.btn-lg { padding: var(--space-md) var(--space-lg);  font-size: var(--font-action-lg-size); }

/* Variants */
.btn-primary {
  background: var(${f.bgPrimary});
  color:      var(${f.fgOnPri});
}
.btn-secondary {
  background:   var(${f.bgRaised});
  color:        var(${f.fgOnBase});
  border-color: var(${f.borderTok});
}
.btn-ghost {
  background: transparent;
  color:      var(${f.fgPrimary});
}

/* Disabled */
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
\`\`\`

## Interactive states

Hover and pressed states are a **\`::after\` scrim** that overlays the component's own foreground at a configurable opacity. This reads correctly on any surface — you don't have to define a hover color per variant.

\`\`\`css
.btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transition: opacity 150ms ease;
  pointer-events: none;
}
.btn:hover:not(:disabled)::after  { opacity: var(--state-hover-opacity, 0.06); }
.btn:active:not(:disabled)::after { opacity: var(--state-pressed-opacity, 0.12); }
\`\`\`

The opacity tokens are tuned per surface — components on dark or saturated backgrounds get higher opacity to stay visible.

**Do not** layer your own hover color *and* the scrim — pick one. The scrim is the default.

## Composing primitives from ${lib.label}

The headless library owns *behavior*: open/close state, keyboard navigation, focus traps, ARIA wiring, click-outside dismissal. Your component owns *appearance*: tokens for color, size, radius, motion.

\`\`\`tsx
${dialogExample(config.headlessLib, f)}
\`\`\`

Notice what's *not* in this code:
- No keyboard handling (lib does it)
- No \`aria-*\` attributes (lib does it)
- No focus management (lib does it)
- No raw colors or sizes — only token references via CSS classes

## Variants & overrides

Components expose two override mechanisms in priority order:

1. **CSS variable props** — a component reads \`var(--card-bg, var(${f.bgRaised}))\`. Consumers set \`--card-bg\` on a parent to retheme the subtree.
2. **\`className\` prop** — for one-off layout/spacing tweaks. Components forward \`className\` and merge it last.

\`\`\`tsx
// Retheme via CSS variables — affects every <Card> inside .danger-zone
.danger-zone {
  --card-bg:     var(--color-background-criticalSubtle);
  --card-border: var(--color-border-critical);
}

// One-off via className
<Card className="my-grid-area" />
\`\`\`

Avoid passing \`color\` / \`size\` / \`spacing\` as props that map 1:1 to CSS values — that ties your API to today's token names.

## Density & roundness propagation

Density (configured: **${config.density}**) and roundness (**${config.roundness}**) flow through the dimension and radius scales automatically. You should *never* need to read \`config.density\` at runtime — using \`var(--space-*)\` and \`var(--shape-radius-*)\` is enough. If a component looks wrong at a different density, the bug is hard-coded sizing.

## Forms & inputs

Inputs use \`--font-field-*\` (separate from action so input text size and button label size can diverge if needed):

\`\`\`css
.input {
  height:       calc(var(--space-2xl) + var(--space-xs));   /* matches md button */
  padding:      0 var(--space-md);
  border:       var(--shape-border-regular) solid var(${f.borderTok});
  border-radius: var(--shape-radius-field);
  background:   var(${f.bgBase});
  color:        var(${f.fgOnBase});
  font-family:  var(--font-field-family);
  font-size:    var(--font-field-md-size);
  font-weight:  var(--font-field-weight);
  line-height:  var(--font-field-lineheight);
}
.input:focus-visible {
  outline:        var(--shape-border-thick) solid var(${f.bgPrimary});
  outline-offset: 2px;
  border-color:   var(${f.bgPrimary});
}
.input::placeholder { color: var(${f.fgMuted}); }
\`\`\`

## Switching headless libraries

The token API is library-agnostic. To swap (e.g. Base UI → Radix), you change the imports and the prop-spreading conventions; the CSS stays identical because it references tokens, not library internals. **Do not couple your CSS to library-specific class names** (\`.RadixDialogContent\`, etc.) — wrap with your own class.
`;
}

function dialogExample(lib: HeadlessLib, f: SystemFacts): string {
  switch (lib) {
    case 'radix':
      return `import * as Dialog from '@radix-ui/react-dialog';

export const ConfirmDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void }> = ({ open, onOpenChange, children }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="dialog-backdrop" />
      <Dialog.Content className="dialog-card">{children}</Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);

/* dialog.css */
.dialog-backdrop {
  position: fixed; inset: 0;
  background: var(--color-background-overlay);
  opacity: 0.6;
}
.dialog-card {
  position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
  background:    var(${f.bgOverlay});
  color:         var(${f.fgOnBase});
  border-radius: var(${f.radiusContainer});
  padding:       var(--space-lg);
  box-shadow:    var(--shadow-lg);
  max-width:     min(90vw, 480px);
}`;
    case 'react-aria':
      return `import { DialogTrigger, Dialog, Modal, ModalOverlay, Button } from 'react-aria-components';

export const ConfirmDialog = ({ children }) => (
  <DialogTrigger>
    <Button className="btn btn-primary">Open</Button>
    <ModalOverlay className="dialog-backdrop">
      <Modal className="dialog-card">
        <Dialog>{children}</Dialog>
      </Modal>
    </ModalOverlay>
  </DialogTrigger>
);

/* dialog.css */
.dialog-card {
  background:    var(${f.bgOverlay});
  color:         var(${f.fgOnBase});
  border-radius: var(${f.radiusContainer});
  padding:       var(--space-lg);
  box-shadow:    var(--shadow-lg);
}`;
    case 'headless-ui':
      return `import { Dialog } from '@headlessui/react';

export const ConfirmDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose, children }) => (
  <Dialog open={open} onClose={onClose} className="dialog-root">
    <div className="dialog-backdrop" aria-hidden="true" />
    <div className="dialog-positioner">
      <Dialog.Panel className="dialog-card">{children}</Dialog.Panel>
    </div>
  </Dialog>
);

/* dialog.css */
.dialog-card {
  background:    var(${f.bgOverlay});
  color:         var(${f.fgOnBase});
  border-radius: var(${f.radiusContainer});
  padding:       var(--space-lg);
  box-shadow:    var(--shadow-lg);
}`;
    case 'base-ui':
    default:
      return `import { Dialog } from '@base-ui/react/dialog';

export const ConfirmDialog: React.FC<{ open: boolean; onOpenChange: (v: boolean) => void; children: React.ReactNode }> = ({ open, onOpenChange, children }) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Backdrop className="dialog-backdrop" />
    <Dialog.Popup className="dialog-card">{children}</Dialog.Popup>
  </Dialog.Root>
);

/* dialog.css */
.dialog-backdrop {
  position: fixed; inset: 0;
  background: var(--color-background-overlay);
  opacity: 0.6;
}
.dialog-card {
  position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%);
  background:    var(${f.bgOverlay});
  color:         var(${f.fgOnBase});
  border-radius: var(${f.radiusContainer});
  padding:       var(--space-lg);
  box-shadow:    var(--shadow-lg);
  max-width:     min(90vw, 480px);
}`;
  }
}

// ---------------------------------------------------------------------------
// Skill 3 — Accessibility, motion, best practices
// ---------------------------------------------------------------------------

function generateAccessibilitySkill(config: BrandConfig, set: TokenSet): string {
  const f = deriveFacts(config, set);

  return `${frontmatter(
    'accessibility-and-motion',
    'Accessibility, focus, motion, and reduced-motion guarantees of this design system. Read before shipping anything interactive.',
  )}
# Accessibility & motion

This token system was generated with WCAG 2.2 AA contrast as a baseline. The rules below preserve that contract — and cover keyboard, focus, motion, and reduced-motion concerns.

## Color contrast

The token pipeline checks **every \`foreground/onX\` ↔ \`background/X\` pair** for ≥ 4.5:1 contrast (≥ 3:1 for ≥ 18 px or bold ≥ 14 px). If a pair fell below threshold during generation, the foreground was darkened/lightened until it passed.

**Stay safe** by always pairing semantic foregrounds with their matching backgrounds:

\`\`\`css
/* ✅ guaranteed AA */
.cta {
  background: var(${f.bgPrimary});
  color:      var(${f.fgOnPri});
}

/* ❌ may fail AA — onPrimary is tuned for the primary surface, not raised */
.bad {
  background: var(${f.bgRaised});
  color:      var(${f.fgOnPri});
}
\`\`\`

When you need text on a non-standard surface (e.g. a custom gradient), test the resulting pair manually.

## Focus

Use \`:focus-visible\` for ring styles so mouse clicks don't show a ring but keyboard navigation does. The token system exposes \`--shape-border-thick\` for focus widths and recommends \`--color-background-primary\` for the ring color (it's pre-vetted for AA contrast against light and dark surfaces).

\`\`\`css
.focusable:focus-visible {
  outline:        var(--shape-border-thick) solid var(${f.bgPrimary});
  outline-offset: 2px;
  border-radius:  inherit;
}
\`\`\`

**Never \`outline: none\` without a replacement.** If you remove the default outline, you must add a custom focus indicator.

## Keyboard

The headless library handles keyboard semantics for built-in primitives (Tab, Escape, arrow keys, Enter/Space). Custom interactive elements you build *yourself* must:

- Be focusable (\`tabindex="0"\` on non-button elements).
- Activate on **both** Enter and Space.
- Expose \`role\` if not native.
- Wire \`aria-pressed\`, \`aria-expanded\`, \`aria-selected\`, etc., to component state.

If you find yourself reimplementing menu / listbox / dialog / tooltip / popover keyboard handling, **stop** and use the headless primitive instead.

## Motion

Motion tokens live under \`--transition-*\`:

- Durations: \`--transition-instant\` (0ms), \`--transition-fast\` (~150ms), \`--transition-default\` (~250ms), \`--transition-slow\` (~400ms).
- Easings: \`--transition-easing-standard\` (the default — symmetric ease-out), \`--transition-easing-emphasized\` (sharper accel/decel for state changes), \`--transition-easing-decelerate\` (entry), \`--transition-easing-accelerate\` (exit).

\`\`\`css
.btn {
  transition:
    background-color var(--transition-fast)    var(--transition-easing-standard),
    transform        var(--transition-default) var(--transition-easing-emphasized);
}
\`\`\`

**Rules:**
- Animate \`opacity\` and \`transform\` — they composite on the GPU. Avoid animating \`width\`, \`height\`, \`top\`, \`left\` (they reflow).
- Layout/state changes use \`fast\`. Entries/dismissals use \`default\`. Reserve \`slow\` for hero / emphasized motion only.
- Decorative idle animation (e.g. a logo loop) is generally a smell — remove unless it earns its place.

## Reduced motion

Wrap any non-essential motion (decorative animations, parallax, large transforms) in \`prefers-reduced-motion\`:

\`\`\`css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
\`\`\`

For meaningful state-change motion (e.g. a checkbox check, a popover entry), keep a reduced version — usually a fade — under reduced-motion. Don't strip it entirely; users still need to perceive the state change.

\`\`\`tsx
import { useReducedMotion } from 'framer-motion';

const reduced = useReducedMotion();
<motion.div
  initial={{ opacity: 0, y: reduced ? 0 : 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: reduced ? 0.1 : 0.28 }}
/>
\`\`\`

## Touch targets

Minimum interactive size is 44 × 44 px (WCAG 2.5.5 AAA, AA in mobile contexts). The token system's medium-action button (\`--font-action-md\` + \`--space-sm/--space-md\` padding) lands at this size by default. **Don't** shrink interactive controls below \`--space-2xl\` height.

## Density caveat

Configured density is **${config.density}**. Compact density still meets 44 px on touch *only* with the default md size — \`btn-sm\` at compact may be < 44 px and is keyboard/mouse-only. Avoid \`btn-sm\` in primary mobile flows.

## Screen readers & hidden content

- **\`display: none\`**: invisible *and* unread. Use for genuinely hidden content.
- **\`visibility: hidden\`**: invisible *and* unread, but reserves layout space.
- **\`aria-hidden="true"\`**: visible *and* unread. Use for purely decorative icons.
- **\`.sr-only\`** (or equivalent): hidden visually but read by AT. Use for context that isn't visible (e.g. a Close button with only an X icon).

\`\`\`css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
\`\`\`

## Forms

- Every input has a visible label or an \`aria-label\`. Placeholder is **not** a label.
- Group related inputs in \`<fieldset>\`/\`<legend>\` (or ARIA \`role="group"\` + \`aria-labelledby\`).
- Validation messages are programmatically associated via \`aria-describedby\` and announced via \`aria-live\` for async errors.
- Required fields use \`required\` (not \`aria-required\`) on the input itself.

## Status colors

Status surfaces (\`success\`, \`warning\`, \`critical\`, \`info\`) use both color **and** a non-color signal — an icon, a label, or both. Color alone is not a sufficient signal. Configured status colors:

- \`--color-background-success\` ≈ \`${config.statusColors.success}\`
- \`--color-background-warning\` ≈ \`${config.statusColors.warning}\`
- \`--color-background-critical\` ≈ \`${config.statusColors.error}\`
- \`--color-background-info\` ≈ \`${config.statusColors.info}\`

## Best practices summary

1. Pair foregrounds with their matching backgrounds — don't cross-pair.
2. \`:focus-visible\`, never \`:focus\`. Never \`outline: none\` without a replacement.
3. Use the headless library's keyboard semantics. Don't reimplement.
4. Animate opacity & transform. Wrap non-essential motion in \`prefers-reduced-motion\`.
5. Pair color with a non-color signal for any state communication.
6. Visible label, every input. Placeholder is not a label.
7. Keep interactive targets ≥ 44 px on touch primary flows.
`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateSkills(config: BrandConfig, set: TokenSet): SkillArtifact[] {
  return [
    {
      id: 'tokens',
      filename: 'tokens-and-theming.skill.md',
      title: 'Tokens & theming',
      description: 'Token contract, decision tree, theme swapping',
      content: generateTokensSkill(config, set),
    },
    {
      id: 'components',
      filename: 'component-creation.skill.md',
      title: 'Component creation',
      description: `Token application, interactivity, ${HEADLESS_LIB_INFO[config.headlessLib].label} usage`,
      content: generateComponentsSkill(config, set),
    },
    {
      id: 'accessibility',
      filename: 'accessibility-and-motion.skill.md',
      title: 'Accessibility & motion',
      description: 'Contrast, focus, motion, reduced-motion, ARIA',
      content: generateAccessibilitySkill(config, set),
    },
  ];
}
