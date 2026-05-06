# @trellis/web

The Trellis frontend: marketing site at `/` and the interactive token generator at `/generate`. Built with Astro 5 (React 19 islands), Tailwind CSS 4, Framer Motion, and Lenis smooth-scroll. All token generation is delegated to [`@trellis/generator`](../../packages/generator/README.md) — this app is the UI layer over that library.

## Pages

| Route | File | Contents |
|---|---|---|
| `/` | [src/pages/index.astro](src/pages/index.astro) | Marketing: Hero, ScrollAnimationSection, Pipeline, Comparison, FAQ, Footer |
| `/generate` | [src/pages/generate.astro](src/pages/generate.astro) | Full Configurator app (`<Configurator client:load />`) |

## Configurator (`/generate`)

The Configurator is a single React app (`src/components/Configurator/index.tsx`) split across three areas:

- **Brand intake tabs** — `Color`, `Typography`, `Style`. Each tab edits a slice of the `BrandConfig` from `@trellis/generator` via the `nanostores`-backed store in [src/components/BrandIntake/store.ts](src/components/BrandIntake/store.ts). Persisted with `@nanostores/persistent`.
- **Live preview** — `PlaygroundDashboard`, `PreviewTypography`, and `PreviewComponents` (the [`ComponentSampler`](src/components/ComponentSampler/) primitives) render against CSS custom properties produced by `generateDesignTokens()`.
- **Inspect overlay & Export dialog** — `InspectOverlay` lets you click any preview element to edit the underlying primitive ramp step; `ExportDialog` emits CSS / DTCG JSON / Tailwind / shadcn output plus a markdown integration guide.

## Source layout

```
src/
├── assets/              # Floral PNGs, partner logos, etc.
├── components/
│   ├── BrandIntake/     # Tabs, controls, store — drive the generator's BrandConfig
│   ├── ComponentSampler/# Token-driven preview primitives (Button, Input, Card, …)
│   ├── Configurator/    # /generate app shell, inspect overlay, export dialog
│   ├── LivePlayground/  # Dashboard + typography preview surfaces
│   ├── Showcase/        # Color ramp views, brand showcases
│   ├── ui/              # Shared inputs (Select, Combobox, Tooltip, ColorPickerPopover)
│   └── *.astro          # Marketing sections (Hero, Pipeline, FAQ, Pricing, …)
├── data/googleFonts.ts  # Curated Google Fonts list for the typography picker
├── layouts/             # BaseLayout, MarketingLayout, GeneratorLayout
├── lib/siteImages.ts    # Imported asset URLs for use from React islands
├── pages/               # index.astro, generate.astro
├── scripts/page-exit.ts # Page-transition fade hook
├── styles/global.css    # Tailwind 4 @theme block + global utilities
├── test/                # vitest + @testing-library setup, accessibility tests
└── env.d.ts
```

## Scripts

```bash
pnpm --filter @trellis/web dev       # astro dev (default http://localhost:4321)
pnpm --filter @trellis/web build     # astro build → dist/
pnpm --filter @trellis/web preview   # serve dist/
pnpm --filter @trellis/web test      # vitest run (jsdom + @testing-library/react)
```

From the repo root, `pnpm dev` / `pnpm build` / `pnpm test` run the equivalent Turborepo task across the workspace, and `^build` ensures `@trellis/generator` compiles first.

## Tech stack

- [Astro](https://astro.build/) 5 with React 19 islands
- [Tailwind CSS](https://tailwindcss.com/) 4 via `@tailwindcss/vite` (theme defined in [src/styles/global.css](src/styles/global.css), no `tailwind.config.js`)
- [Base UI](https://base-ui.com/) for accessible primitives (Dialog, Select, Combobox)
- [Framer Motion](https://www.framer.com/motion/) for entrance / inspect / export animations
- [nanostores](https://github.com/nanostores/nanostores) + `@nanostores/persistent` for cross-island state
- [Lenis](https://github.com/darkroomengineering/lenis) (via `locomotive-scroll`) for smooth scroll on the marketing site
- [react-colorful](https://github.com/omgovich/react-colorful) for the hex picker
- [echarts-for-react](https://github.com/hustcc/echarts-for-react) for the dashboard preview charts

## Customization

- **Theme tokens for the marketing site itself** live in [src/styles/global.css](src/styles/global.css) under the `@theme` block (Tailwind 4 syntax). The generator's output is *not* applied here — the Configurator scopes its CSS variables to its own preview tree.
- **Configurator defaults** come from `initialConfig` in `@trellis/generator` (see [packages/generator/src/types.ts](../../packages/generator/src/types.ts)). Overriding them at boot is just a `createBrandConfig({...})` call before mounting `<Configurator />`.
- **Google Fonts catalog** for the typography tab is [src/data/googleFonts.ts](src/data/googleFonts.ts).

## Author

**Cristobal Grana** — Lead UX Engineer at GoDaddy.
