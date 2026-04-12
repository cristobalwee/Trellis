import React from 'react';
import { bg, fg, radius, transition } from './tokens';

export type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  initials: string;
  size?: AvatarSize;
  colorIndex?: number;
}

const SIZE_MAP: Record<AvatarSize, number> = { sm: 24, md: 32, lg: 40 };
const FONT_MAP: Record<AvatarSize, string> = { sm: '9px', md: '11px', lg: '13px' };

const BG_CYCLE = [bg.primarySubtle, bg.accentSubtle, bg.successSubtle, bg.warningSubtle, bg.infoSubtle, bg.criticalSubtle];

const Avatar: React.FC<AvatarProps> = ({ initials, size = 'md', colorIndex = 0 }) => {
  const px = SIZE_MAP[size];
  return (
    <div
      aria-label={initials}
      style={{
        width: `${px}px`,
        height: `${px}px`,
        borderRadius: radius.action,
        backgroundColor: BG_CYCLE[colorIndex % BG_CYCLE.length],
        color: fg.onBase,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: FONT_MAP[size],
        fontWeight: 700,
        fontFamily: 'inherit',
        flexShrink: 0,
        transition: transition.theme,
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
