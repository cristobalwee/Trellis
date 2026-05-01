# Trellis

**Trellis** is a web app for generating design-system foundations from brand choices: color ramps in OKLCH, typography, density and surface style, plus semantic tokens tuned for contrast. It ships with a marketing site, an interactive **Configurator** (`/generate`), live component previews, and one-click exports so you can drop tokens into real codebases.

This repository is a [pnpm](https://pnpm.io/) workspace orchestrated with [Turborepo](https://turbo.build/).

## What it does

- **Brand intake** — Pick primary (and optional secondary, tertiary, accent) colors, neutrals, status hues, Google Fonts for headings and body, and UI style knobs (roundness, shadows, density, expressiveness).
- **Token generation** — Builds primitive ramps and maps them to semantic CSS custom properties with WCAG-minded targets (see `apps/web/src/utils/generateTokens.ts`).
- **Configurator** — Inspect and edit tokens, with export options for **CSS variables**, **DTCG JSON**, **Tailwind**, **shadcn**-oriented output, and a **markdown implementation guide** (`apps/web/src/components/Configurator/ExportDialog.tsx`, `apps/web/src/utils/exportTokens.ts`).
- **Live playground** — Preview typography and sampled UI components against generated tokens.
- **Marketing pages** — Landing content, pricing, FAQ, and CTAs that open intake / generator flows (`apps/web/src/pages/`).

## Requirements

- **Node.js** 18.20+ or 22+ (22+ recommended).
- **pnpm** 9 (`package.json` pins `pnpm@9.15.4` via `packageManager`).

## Getting started

From the repository root:

```bash
pnpm install
pnpm dev
```

By default this runs Turborepo `dev`, which starts the web app. Open [http://localhost:4321](http://localhost:4321) (Astro’s default dev port unless overridden).

Other root scripts:

```bash
pnpm build    # production build (all packages that define `build`)
pnpm preview  # preview production output where configured
```

## Repository layout

| Path | Purpose |
|------|--------|
| `apps/web` | Astro + React frontend: marketing site, generator UI, token pipeline |
| `packages/*`, `worker` | Workspace placeholders for future shared packages or workers (see `pnpm-workspace.yaml`) |

Detailed structure, feature checklist, and customization notes for the web app live in [**apps/web/README.md**](apps/web/README.md).

## Tech stack (web app)

- [Astro](https://astro.build/) 5 with React islands
- [Tailwind CSS](https://tailwindcss.com/) 4 (Vite plugin)
- [Framer Motion](https://www.framer.com/motion/), [Base UI](https://base-ui.com/), [nanostores](https://github.com/nanostores/nanostores) for UI and client state
- [culori](https://culorijs.org/) for color math and export formatting

## License / author

Project specifics (license, contributing) can be added here as you formalize the product. The web app README includes author attribution for the marketing site.
