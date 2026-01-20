# Trellis - Design System Build Tool

Build a design system in 10 minutes, not 6 months. A premium marketing website built with Astro, React, Tailwind CSS, Framer Motion, and Lenis.

## 🎨 Design

- **Branding:** Organic, premium, architectural
- **Typography:**
  - Headlines: Cormorant Garamond (Italic Serif)
  - Body: Inter (Clean Sans - fallback for Satoshi)
- **Colors:**
  - Forest Green: `#2D5016` (Primary)
  - Cream: `#FDFBF7` (Background)
  - Charcoal: `#2A2A2A` (Text)

## 🚀 Tech Stack

- **Framework:** Astro 4.16
- **UI Library:** React 18 (Islands Architecture)
- **Styling:** Tailwind CSS 3.4
- **Animations:** Framer Motion 11
- **Smooth Scroll:** Lenis 1.3
- **Color Picker:** react-colorful 5.6

## 📁 Project Structure

```
trellis/
├── src/
│   ├── assets/            # Floral PNG images
│   ├── components/
│   │   ├── Header.astro           # Sticky header with nav
│   │   ├── Footer.astro           # Footer with links
│   │   ├── Hero.astro             # Hero with floral animations
│   │   ├── BrandIntake.tsx        # 5-step modal (React)
│   │   ├── ScrollAnimation.tsx    # 4-step scroll animation (React)
│   │   ├── ScrollAnimationSection.astro
│   │   ├── Deliverables.astro     # Feature grid
│   │   ├── Comparison.astro       # Comparison table
│   │   ├── Pricing.astro          # Pricing cards
│   │   ├── FAQ.astro              # FAQ + Backstory
│   │   └── FAQAccordion.tsx       # Accordion (React)
│   ├── layouts/
│   │   └── BaseLayout.astro       # Main layout + Lenis setup
│   ├── pages/
│   │   └── index.astro            # Homepage
│   └── styles/
│       └── global.css             # Global styles + utilities
├── public/
├── astro.config.mjs
├── tailwind.config.js
└── package.json
```

## 🎯 Features

### ✅ Completed Components

1. **Hero Section**
   - Animated headline and sub-headline (fade-in)
   - Floral illustrations with "blooming" CSS animations
   - Tech icon placeholders in white circles
   - Mobile-responsive floral arrangements
   - CTA button connected to Brand Intake modal

2. **Brand Intake Modal** (React)
   - 5-step form: Brand Name, Color Picker, Typography, Framework, Summary
   - Fullscreen takeover with backdrop blur
   - Framer Motion animations (slide-in, spring physics)
   - HexColorPicker integration
   - Keyboard navigation (Enter/Escape)
   - Form validation and state management

3. **Interactive Scroll Animation** (React)
   - 4-step scroll-linked animation
   - Left side: Sticky text descriptions
   - Right side: Animated visuals
     - Step 1: Form typing animation
     - Step 2: Progress bar + file generation
     - Step 3: Terminal window with install commands
     - Step 4: Component preview with tokens
   - Uses Framer Motion's `useScroll` and `useTransform` hooks

4. **Deliverables Section**
   - 6-card grid showcasing features
   - SVG icons
   - Intersection Observer scroll animations
   - Staggered fade-in effects

5. **Comparison Table**
   - shadcn/ui vs Trellis comparison
   - Green checkmarks vs red X marks
   - Highlighted "Setup Time" row (2-6 months vs 10 minutes)
   - Hover effects on rows

6. **Pricing Section**
   - 2 pricing cards (Available Now vs Coming Feb 2026)
   - Feature lists with checkmarks
   - "Available Now" card highlighted with border
   - 14-day money-back guarantee callout
   - CTA buttons connected to Brand Intake modal

7. **FAQ & Backstory**
   - Personal narrative from Cristobal Grana
   - 8 FAQ items with accordion (React)
   - Framer Motion expand/collapse animations
   - One FAQ open at a time

8. **Header & Footer**
   - Sticky header with backdrop blur on scroll
   - Mobile hamburger menu
   - Logo with animated leaf SVG
   - Footer with 3-column link grid

9. **Smooth Scrolling**
   - Lenis smooth scroll integration
   - Anchor link support
   - Custom easing

## 🎬 Animations

- **Floral "Blooming":** CSS keyframes with scale, rotate, opacity
- **Typography Fade-In:** Staggered delays on headline, sub-headline, CTA
- **Card Animations:** Intersection Observer triggers on scroll
- **Scroll-Linked:** Framer Motion useScroll for 4-step animation
- **Accordion:** Framer Motion AnimatePresence for smooth expand/collapse
- **Modal:** Spring physics for slide-in entrance

## 🚀 Getting Started

### Prerequisites

- Node.js 18.20.8+ or 22+ (recommended)
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit [http://localhost:4321](http://localhost:4321)

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎨 Customization

### Colors

Edit [tailwind.config.js](tailwind.config.js):

```js
colors: {
  'forest-green': {
    DEFAULT: '#2D5016',
    // ... other shades
  },
  cream: '#FDFBF7',
  charcoal: '#2A2A2A'
}
```

### Typography

Edit [tailwind.config.js](tailwind.config.js):

```js
fontFamily: {
  serif: ['Cormorant Garamond', 'Georgia', 'serif'],
  sans: ['Inter', 'system-ui', 'sans-serif'],
}
```

### Animations

Edit [src/styles/global.css](src/styles/global.css) for custom keyframes and easing functions.

## 📦 Assets

### Floral PNGs

Located in [src/assets/](src/assets/):
- `flower-pink.png`
- `flower-yellow.png`
- `leaf-1.png`
- `leaf-2.png`

### Tech Icons

Currently using placeholder white circles with text. To add real icons:

1. Add icon SVGs or PNGs to `src/assets/`
2. Update [Hero.astro](src/components/Hero.astro) to import and use icons
3. Replace `.icon-circle` placeholder content

## 🔗 Navigation

- **How it works** → `#how-it-works` (Scroll Animation)
- **Pricing** → `#pricing`
- **FAQ** → `#faq`
- **Backstory** → `#backstory`

All anchor links use Lenis smooth scrolling.

## 🎯 CTA Buttons

All "Start Building" buttons trigger the Brand Intake modal via custom event:

```js
window.dispatchEvent(new CustomEvent('openBrandIntake'));
```

Located in:
- Header
- Hero
- Pricing section

## 🐛 Known Issues / Next Steps

- **Satoshi Font:** Currently using Inter as fallback. To use Satoshi, add font files or use a CDN.
- **Tech Icons:** Replace placeholder circles with actual brand icons (Notion, pnpm, Figma, React, Sass, DTCG).
- **Payment Integration:** Brand Intake modal shows alert on final step. Integrate with Gumroad/Stripe for real payments.

## 👤 Author

**Cristobal Grana**
Lead UX Engineer at GoDaddy

---

Built with ♥ for designers and developers
