import React from 'react';

/**
 * File-shape SVG icons for the export-page asset cards.
 *
 * Folded-corner page glyph with a colored extension badge. Paper and fold
 * tints are derived from the single `color` prop via OKLCH mixing, so the
 * icon inherits whatever role color the host page resolves from the
 * generated token system (primary / accent / warning / success).
 */

export type FileIconKind = 'css' | 'json' | 'js' | 'md';

const LABEL: Record<FileIconKind, string> = {
  css:  'CSS',
  json: 'JSON',
  js:   'JS',
  md:   'MD',
};

interface FileIconProps {
  kind: FileIconKind;
  color: string;
  size?: number;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ kind, color, size = 56, className }) => {
  const label = LABEL[kind];
  const labelLen = label.length;
  // Badge widens for longer extension labels so "JSON" doesn't crowd the corner.
  const badgeWidth = 12 + labelLen * 5;
  const badgeX = 4;
  const badgeY = 36;
  const fontSize = labelLen >= 4 ? 7 : 8;

  const paper = `color-mix(in oklch, ${color} 10%, white)`;
  const fold  = `color-mix(in oklch, ${color} 24%, white)`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      role="img"
      aria-label={`${label} file`}
      className={className}
    >
      {/* Page body */}
      <path
        d="M10 4 H36 L46 14 V50 A2 2 0 0 1 44 52 H10 A2 2 0 0 1 8 50 V6 A2 2 0 0 1 10 4 Z"
        fill={paper}
        stroke={fold}
        strokeWidth={1.25}
      />
      {/* Folded corner */}
      <path
        d="M36 4 V12 A2 2 0 0 0 38 14 H46"
        fill="none"
        stroke={fold}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <path
        d="M36 4 L46 14 H38 A2 2 0 0 1 36 12 Z"
        fill={fold}
      />
      {/* Filename body lines */}
      <rect x="14" y="20" width="20" height="2" rx="1" fill={fold} />
      <rect x="14" y="25" width="26" height="2" rx="1" fill={fold} />
      <rect x="14" y="30" width="22" height="2" rx="1" fill={fold} />
      {/* Extension badge */}
      <rect
        x={badgeX}
        y={badgeY}
        width={badgeWidth}
        height={11}
        rx={2.5}
        fill={color}
      />
      <text
        x={badgeX + badgeWidth / 2}
        y={badgeY + 8.5}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        fill="#FFFFFF"
        letterSpacing="0.5"
      >
        {label}
      </text>
    </svg>
  );
};
