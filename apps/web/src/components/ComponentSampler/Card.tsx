import React from 'react';
import { bg, border, radius, space, shadow, transition } from './tokens';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, style }) => (
  <div
    style={{
      backgroundColor: bg.raised,
      border: `1px solid ${border.neutral}`,
      borderRadius: radius.container,
      padding: space.lg,
      boxShadow: shadow.card,
      transition: transition.theme,
      ...style,
    }}
  >
    {children}
  </div>
);

export default Card;
