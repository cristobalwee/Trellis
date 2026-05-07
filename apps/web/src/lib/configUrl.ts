import LZString from 'lz-string';
import { createBrandConfig, type BrandConfig } from '@trellis/generator';

const VERSION = 'v1';
const SEPARATOR = '.';

export function encodeBrandConfig(config: BrandConfig): string {
  const json = JSON.stringify(config);
  const compressed = LZString.compressToEncodedURIComponent(json);
  return `${VERSION}${SEPARATOR}${compressed}`;
}

export function decodeBrandConfig(encoded: string | null | undefined): BrandConfig | null {
  if (!encoded) return null;
  const sep = encoded.indexOf(SEPARATOR);
  if (sep < 0) return null;
  const version = encoded.slice(0, sep);
  const payload = encoded.slice(sep + 1);
  if (version !== VERSION || !payload) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(payload);
    if (!json) return null;
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.primaryColor !== 'string') {
      return null;
    }
    return createBrandConfig(parsed);
  } catch {
    return null;
  }
}
