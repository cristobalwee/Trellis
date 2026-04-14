import React from 'react';

// ---------------------------------------------------------------------------
// Helpers — mirrors PlaygroundDashboard token accessors
// ---------------------------------------------------------------------------

const t = (token: string) => `var(--${token})`;

const bg = {
  base: t('color-background-base'),
  sunken: t('color-background-sunken'),
  raised: t('color-background-raised'),
  primarySubtle: t('color-background-primarySubtle'),
  primary: t('color-background-primary'),
  accent: t('color-background-accent'),
  accentSubtle: t('color-background-accentSubtle'),
};
const fg = {
  onBase: t('color-foreground-onBase'),
  onBaseMuted: t('color-foreground-onBaseMuted'),
  onPrimary: t('color-foreground-onPrimary'),
  primary: t('color-foreground-primary'),
  onGradient: t('color-foreground-onGradient'),
  onAccent: t('color-foreground-onAccent'),
  onAccentSubtle: t('color-foreground-onAccentSubtle'),
};
const border = {
  neutral: t('color-border-neutral'),
  primary: t('color-border-primary'),
};
const radius = {
  container: t('radius-container'),
  action: t('radius-action'),
  badge: t('radius-badge'),
};
const space = {
  xs: t('spacing-xs'),
  sm: t('spacing-sm'),
  md: t('spacing-md'),
  lg: t('spacing-lg'),
  xl: t('spacing-xl'),
  '2xl': t('spacing-2xl'),
  '3xl': t('spacing-3xl'),
  '4xl': t('spacing-4xl'),
  '5xl': t('spacing-5xl'),
  '6xl': t('spacing-6xl'),
};
const transition = {
  theme: t('transition-theme'),
  interactive: t('transition-interactive'),
};
const font = {
  primary: t('font-family-primary'),
  secondary: t('font-family-secondary'),
};
const weight = {
  heading: t('font-weight-heading'),
  bodyLight: t('font-weight-body-light'),
  bodyRegular: t('font-weight-body-regular'),
  bodyBold: t('font-weight-body-bold'),
};
const gradient = t('gradient-primary');

// ---------------------------------------------------------------------------
// Article Preview — styled like an editorial blog post
// ---------------------------------------------------------------------------

interface PreviewTypographyProps {
  fontScale: number;
  headingFont: string;
  bodyFont: string;
}

const PreviewTypography: React.FC<PreviewTypographyProps> = ({
  headingFont: headingFontName,
  bodyFont: bodyFontName,
}) => {
  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        backgroundColor: bg.base,
        color: fg.onBase,
        fontFamily: font.primary,
        transition: transition.theme,
      }}
    >
      {/* ── Navigation ── */}
      <nav
        className="sticky top-0 z-10 flex items-center justify-between"
        style={{
          backgroundColor: bg.base,
          padding: `${space.md} ${space.lg}`,
          transition: transition.theme,
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 flex items-center justify-center text-xs font-bold"
            style={{
              background: bg.accent,
              color: fg.onAccent,
              borderRadius: radius.badge,
              transition: transition.theme,
            }}
          >
            A
          </div>
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ fontFamily: font.secondary, color: fg.onBase }}
          >
            Acme
          </span>
        </div>
        <div className="flex items-center" style={{ gap: space.md }}>
          {['Design', 'Technology', 'Culture'].map((item) => (
            <span
              key={item}
              className="text-xs font-medium cursor-pointer hover:opacity-70 hidden sm:inline"
              style={{ color: fg.onBaseMuted, transition: transition.interactive }}
            >
              {item}
            </span>
          ))}
          <button
            className="text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: bg.primary,
              color: fg.onPrimary,
              borderRadius: radius.action,
              padding: `${space.sm} ${space.lg}`,
              transition: transition.interactive,
            }}
          >
            Subscribe
          </button>
        </div>
      </nav>

      {/* ── Article ── */}
      <article
        className="max-w-3xl mx-auto"
        style={{ padding: space.lg, marginTop: `calc(${space.lg} + 24px)` }}
      >
        {/* Tags / Eyebrow */}
        <div className="flex items-center" style={{ gap: space.md, marginBottom: space.lg }}>
          <span
            className="text-[11px] font-semibold"
            style={{
              backgroundColor: bg.primarySubtle,
              color: fg.primary,
              borderRadius: radius.badge,
              padding: `${space.sm} ${space.lg}`,
              transition: transition.theme,
            }}
          >
            Design Systems
          </span>
          <span
            className="text-[11px]"
            style={{ color: fg.onBaseMuted }}
          >
            8 min read
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontFamily: font.secondary,
            fontSize: '2.25rem',
            fontWeight: weight.heading as unknown as number,
            lineHeight: 1.15,
            color: fg.onBase,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          The Quiet Power of Typography in Digital Interfaces
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: font.primary,
            fontSize: '1.125rem',
            lineHeight: 1.5,
            color: fg.onBaseMuted,
            fontWeight: weight.bodyLight as unknown as number,
            margin: 0,
            marginTop: space.md,
          }}
        >
          How thoughtful type choices shape perception, guide attention, and build trust — often without anyone noticing.
        </p>

        {/* Author row */}
        <div
          className="flex items-center"
          style={{
            borderTop: `1px solid ${border.neutral}`,
            gap: space.md,
            marginTop: space.lg,
            paddingTop: space.lg,
            transition: transition.theme,
          }}
        >
          <div
            className="w-9 h-9 flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: bg.accentSubtle,
              color: fg.onAccentSubtle,
              borderRadius: radius.container,
              transition: transition.theme,
            }}
          >
            EK
          </div>
          <div className="flex flex-col">
            <span
              className="text-sm font-semibold"
              style={{ fontFamily: font.primary, color: fg.onBase }}
            >
              Elena Kim
            </span>
            <span
              className="text-xs"
              style={{ color: fg.onBaseMuted }}
            >
              Mar 18, 2026
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ marginTop: space.lg }}>
          <div className="flex flex-col" style={{ gap: space.lg }}>
            <p
              style={{
                fontFamily: font.primary,
                fontSize: '1rem',
                lineHeight: 1.75,
                color: fg.onBase,
                margin: 0,
              }}
            >
              When we talk about visual design, color and layout tend to steal the spotlight. But typography is the real
              workhorse — it carries meaning, establishes hierarchy, and sets the emotional register of an entire product.
              The best type systems feel invisible precisely because they work so well.
            </p>

            <h2
              style={{
                fontFamily: font.secondary,
                fontSize: '1.375rem',
                fontWeight: weight.heading as unknown as number,
                lineHeight: 1.3,
                color: fg.onBase,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Hierarchy Is Orientation
            </h2>

            <p
              style={{
                fontFamily: font.primary,
                fontSize: '1rem',
                lineHeight: 1.75,
                color: fg.onBase,
                margin: 0,
              }}
            >
              A clear typographic hierarchy isn't decoration — it's wayfinding. Readers unconsciously use size, weight, and
              spacing to understand what's important, what's supporting context, and what they can skip. Without this
              structure, even brilliant content becomes a wall of undifferentiated text.
            </p>

            {/* Pull quote */}
            <blockquote
              style={{
                borderLeft: `3px solid ${border.neutral}`,
                fontFamily: font.secondary,
                fontSize: '1.125rem',
                fontWeight: weight.heading as unknown as number,
                fontStyle: 'italic',
                lineHeight: 1.5,
                color: fg.onBaseMuted,
                margin: 0,
                padding: `${space.sm} ${space.lg}`,
              }}
            >
              "Typography is the craft of endowing human language with a durable visual form."
            </blockquote>

            <p
              style={{
                fontFamily: font.primary,
                fontSize: '1rem',
                lineHeight: 1.75,
                color: fg.onBase,
                margin: 0,
              }}
            >
              Consider the difference between a page set in a single weight and size versus one that uses a careful scale.
              The scaled version feels intentional and professional — not because anything flashy happened, but because
              the type is doing what readers need it to do.
            </p>

            <h2
              style={{
                fontFamily: font.secondary,
                fontSize: '1.375rem',
                fontWeight: weight.heading as unknown as number,
                lineHeight: 1.3,
                color: fg.onBase,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              Choosing a Typeface Pairing
            </h2>

            <p
              style={{
                fontFamily: font.primary,
                fontSize: '1rem',
                lineHeight: 1.75,
                color: fg.onBase,
                margin: 0,
              }}
            >
              The classic approach pairs contrasting families: a geometric or high-contrast serif for headings alongside
              a neutral, highly legible sans-serif for body text. Contrast creates energy, while shared proportions
              maintain cohesion. The goal isn't novelty — it's clarity with character.
            </p>

            {/* Callout box */}
            <div
              className="flex"
              style={{
                backgroundColor: bg.primarySubtle,
                borderRadius: radius.container,
                padding: space.lg,
                gap: space.md,
                transition: transition.theme,
              }}
            >
              <span style={{ fontSize: '1.25rem', lineHeight: 1, flexShrink: 0, marginTop: '2px' }}>
                &#x2728;
              </span>
              <div>
                <span
                  className="text-sm font-semibold block"
                  style={{ fontFamily: font.secondary, color: fg.primary, marginBottom: space.md }}
                >
                  Quick Tip
                </span>
                <span
                  className="text-sm"
                  style={{ fontFamily: font.primary, color: fg.primary, lineHeight: 1.6 }}
                >
                  Test your type pairing at real content lengths, not just "Lorem ipsum." Reading comfort only reveals
                  itself after a few paragraphs.
                </span>
              </div>
            </div>

            <p
              style={{
                fontFamily: font.primary,
                fontSize: '1rem',
                lineHeight: 1.75,
                color: fg.onBase,
                margin: 0,
              }}
            >
              Ultimately, great typography recedes. It doesn't demand attention for itself — it lends attention to
              everything else. When the type is right, the content simply feels trustworthy, clear, and worth reading.
              That's the quiet power at the heart of every design system.
            </p>
          </div>
        </div>

        {/* ── Tags / Footer ── */}
        <div
          className="flex flex-wrap items-center"
          style={{
            borderTop: `1px solid ${border.neutral}`,
            gap: space.md,
            marginTop: space.lg,
            paddingTop: space.lg,
            transition: transition.theme,
          }}
        >
          {['Typography', 'Design Systems', 'UI Design', 'Accessibility'].map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium"
              style={{
                backgroundColor: bg.sunken,
                color: fg.onBaseMuted,
                borderRadius: radius.badge,
                padding: `${space.sm} ${space.lg}`,
                transition: transition.theme,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </article>
    </div>
  );
};

export default PreviewTypography;
