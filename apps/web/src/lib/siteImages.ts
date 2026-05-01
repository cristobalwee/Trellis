import checkSvg from '../assets/check.svg';
import flowerPinkPng from '../assets/flower-pink.png';
import flowerYellowPng from '../assets/flower-yellow.png';
import leaf1Png from '../assets/leaf-1.png';
import leaf2Png from '../assets/leaf-2.png';
import logoSvg from '../assets/logo.svg';
import logoIconSvg from '../assets/logo_icon.svg';

/** Resolved URLs for images in `src/assets` (works in dev and production). */
export const siteImages = {
  check: checkSvg.src,
  flowerPink: flowerPinkPng.src,
  flowerYellow: flowerYellowPng.src,
  leaf1: leaf1Png.src,
  leaf2: leaf2Png.src,
  logo: logoSvg.src,
  logoIcon: logoIconSvg.src,
} as const;
