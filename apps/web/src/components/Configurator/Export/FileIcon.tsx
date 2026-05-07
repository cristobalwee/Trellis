import React from 'react';

/**
 * File-shape SVG icons for the export-page asset cards.
 *
 * One folded-corner page glyph with a colored extension badge baked into the
 * lower-left so the file type reads at a glance. Variants are intentionally
 * minimal — the celebratory layout earns its weight from typography &
 * spacing, not iconographic noise.
 */

export type FileIconKind = 'css' | 'json' | 'js' | 'md';

const PALETTE: Record<FileIconKind, { paper: string; fold: string; badge: string; ink: string; label: string }> = {
  css:  { paper: '#EFF6FF', fold: '#DBEAFE', badge: '#2563EB', ink: '#1E3A8A', label: 'CSS'  },
  json: { paper: '#FEF3C7', fold: '#FDE68A', badge: '#D97706', ink: '#78350F', label: 'JSON' },
  js:   { paper: '#FEF9C3', fold: '#FDE047', badge: '#CA8A04', ink: '#713F12', label: 'JS'   },
  md:   { paper: '#ECFDF5', fold: '#A7F3D0', badge: '#059669', ink: '#064E3B', label: 'MD'   },
};

interface FileIconProps {
  kind: FileIconKind;
  size?: number;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ kind, size = 56, className }) => {
  const c = PALETTE[kind];
  const labelLen = c.label.length;
  // Badge widens for longer extension labels so "JSON" doesn't crowd the corner.
  const badgeWidth = 12 + labelLen * 5;
  const badgeX = 8;
  const badgeY = 38;
  const fontSize = labelLen >= 4 ? 7 : 8;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      role="img"
      aria-label={`${c.label} file`}
      className={className}
    >
      {/* Page body */}
      <path
        d="M10 4 H36 L46 14 V50 A2 2 0 0 1 44 52 H10 A2 2 0 0 1 8 50 V6 A2 2 0 0 1 10 4 Z"
        fill={c.paper}
        stroke={c.fold}
        strokeWidth={1.25}
      />
      {/* Folded corner */}
      <path
        d="M36 4 V12 A2 2 0 0 0 38 14 H46"
        fill="none"
        stroke={c.fold}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M36 4 L46 14 H38 A2 2 0 0 1 36 12 Z"
        fill={c.fold}
      />
      {/* Filename body lines */}
      <rect x="14" y="20" width="20" height="2" rx="1" fill={c.fold} />
      <rect x="14" y="25" width="26" height="2" rx="1" fill={c.fold} />
      <rect x="14" y="30" width="22" height="2" rx="1" fill={c.fold} />
      {/* Extension badge */}
      <rect
        x={badgeX}
        y={badgeY}
        width={badgeWidth}
        height={11}
        rx={2.5}
        fill={c.badge}
      />
      <text
        x={badgeX + badgeWidth / 2}
        y={badgeY + 7.5}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#FFFFFF"
        letterSpacing="0.5"
      >
        {c.label}
      </text>
    </svg>
  );
};
