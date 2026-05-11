import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Copy, Download } from 'lucide-react';

import {
  exportTokens,
  generateDesignTokens,
  generateSkills,
  initialConfig,
  type BrandConfig,
  type ColorSpace,
  type ExportFormat,
  type SkillArtifact,
  type TokenSet,
} from '@trellis/generator';

import { Select } from '../../ui/Select';
import { siteImages } from '../../../lib/siteImages';
import { decodeBrandConfig, encodeBrandConfig } from '../../../lib/configUrl';
import { FileIcon, type FileIconKind } from './FileIcon';
import { highlight, type Lang } from './highlight';

// ---------------------------------------------------------------------------
// Asset descriptors
// ---------------------------------------------------------------------------

type TokenAssetId = ExportFormat;
type SkillAssetId = `skill-${SkillArtifact['id']}`;
type AssetId = TokenAssetId | SkillAssetId;

interface AssetDescriptor {
  id: AssetId;
  filename: string;
  iconKind: FileIconKind;
  lang: Lang;
  title: string;
  description: string;
  group: 'tokens' | 'skills';
  takesColorSpace: boolean;
}

const TOKEN_ASSETS: AssetDescriptor[] = [
  {
    id: 'css',
    filename: 'tokens.css',
    iconKind: 'css',
    lang: 'css',
    title: 'CSS variables',
    description: 'Custom properties for light & dark themes',
    group: 'tokens',
    takesColorSpace: true,
  },
  {
    id: 'dtcg',
    filename: 'tokens.json',
    iconKind: 'json',
    lang: 'json',
    title: 'DTCG tokens',
    description: 'Design Token Community Group format',
    group: 'tokens',
    takesColorSpace: true,
  },
  {
    id: 'tailwind',
    filename: 'tailwind.config.js',
    iconKind: 'js',
    lang: 'js',
    title: 'Tailwind config',
    description: 'Tailwind v4 colors & semantic tokens',
    group: 'tokens',
    takesColorSpace: true,
  },
  {
    id: 'shadcn',
    filename: 'shadcn.css',
    iconKind: 'css',
    lang: 'css',
    title: 'shadcn/ui',
    description: 'shadcn v2-compatible CSS variables',
    group: 'tokens',
    takesColorSpace: true,
  },
];

const COLOR_SPACE_OPTIONS = [
  { value: 'oklch', label: 'oklch' },
  { value: 'hex',   label: 'hex'   },
  { value: 'rgb',   label: 'rgb'   },
  { value: 'hsl',   label: 'hsl'   },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ExportPage: React.FC = () => {
  // Read & decode the BrandConfig from the URL on mount; fall back to defaults.
  const [config, setConfig] = useState<BrandConfig>(initialConfig);
  const [decodeFailed, setDecodeFailed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('c');
    if (!raw) return;
    const decoded = decodeBrandConfig(raw);
    if (decoded) {
      setConfig(decoded);
    } else {
      setDecodeFailed(true);
    }
  }, []);

  // Recompute tokens when config changes (and load fonts to match the system).
  const tokenSet = useMemo<TokenSet>(() => ({
    light: generateDesignTokens(config, false).tokens,
    dark:  generateDesignTokens(config, true ).tokens,
  }), [config]);

  useEffect(() => {
    for (const family of [config.headingFont, config.primaryFont]) {
      if (!family) continue;
      const id = `export-font-${family.replace(/\s+/g, '+')}`;
      if (document.getElementById(id)) continue;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:wght@400;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [config.headingFont, config.primaryFont]);

  const skills = useMemo(() => generateSkills(config, tokenSet), [config, tokenSet]);
  const skillAssets: AssetDescriptor[] = useMemo(() => skills.map((s) => ({
    id: `skill-${s.id}` as SkillAssetId,
    filename: s.filename,
    iconKind: 'md',
    lang: 'md',
    title: s.title,
    description: s.description,
    group: 'skills',
    takesColorSpace: false,
  })), [skills]);

  const allAssets = useMemo(() => [...TOKEN_ASSETS, ...skillAssets], [skillAssets]);

  // Default selection: the canonical CSS export.
  const [selectedId, setSelectedId] = useState<AssetId>(TOKEN_ASSETS[0].id);
  const selectedAsset = useMemo(
    () => allAssets.find((a) => a.id === selectedId) ?? TOKEN_ASSETS[0],
    [allAssets, selectedId],
  );

  const [colorSpace, setColorSpace] = useState<ColorSpace>('oklch');
  const [copiedId, setCopiedId] = useState<AssetId | null>(null);

  const generateContent = useCallback((asset: AssetDescriptor): string => {
    if (asset.group === 'skills') {
      const skill = skills.find((s) => `skill-${s.id}` === asset.id);
      return skill?.content ?? '';
    }
    return exportTokens(tokenSet, asset.id as ExportFormat, colorSpace, { includeSemantic: true });
  }, [skills, tokenSet, colorSpace]);

  const content = useMemo(() => generateContent(selectedAsset), [generateContent, selectedAsset]);
  const highlighted = useMemo(() => highlight(content, selectedAsset.lang), [content, selectedAsset.lang]);

  const handleCopy = useCallback(async (asset: AssetDescriptor) => {
    const text = generateContent(asset);
    await navigator.clipboard.writeText(text);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId((id) => (id === asset.id ? null : id)), 2000);
  }, [generateContent]);

  const handleDownload = useCallback((asset: AssetDescriptor) => {
    const text = generateContent(asset);
    const blob = new Blob([text], { type: asset.lang === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generateContent]);

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/generate/export?c=${encodeBrandConfig(config)}`;
  }, [config]);

  const [shareCopied, setShareCopied] = useState(false);
  const handleShareCopy = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [shareUrl]);

  const isCopied = copiedId === selectedAsset.id;

  return (
    <div className="export-page relative min-h-dvh bg-gray text-charcoal overflow-x-hidden">
      <div className="relative z-10">
        {/* Top bar */}
        <header
          className="export-anim flex items-center justify-between px-6 py-5 md:px-10"
          style={{ animationDelay: '1.35s' }}
        >
          <a
            href="/generate"
            className="inline-flex items-center gap-2 text-sm text-charcoal/70 hover:text-charcoal transition-colors"
          >
            <ArrowLeft size={16} />
            Back to configurator
          </a>
          <a href="/" aria-label="Trellis home">
            <img src={siteImages.logoIcon} alt="Trellis" className="w-7 h-7 hover:opacity-70 transition-opacity" />
          </a>
        </header>

        {/* Hero */}
        <section
          className="export-anim px-6 md:px-10 max-w-5xl mx-auto pt-8 pb-8 md:pt-16 md:pb-10 text-center"
          style={{ animationDelay: '1.5s' }}
        >
          <h2 className="mb-6 text-charcoal">
            Ready to ship
          </h2>
          <p className="text-base md:text-lg text-charcoal/80 max-w-2xl mx-auto leading-relaxed">
            A complete token set plus three LLM-ready skills, scoped to <em className="not-italic font-medium text-charcoal">{config.headingFont}</em> & <em className="not-italic font-medium text-charcoal">{config.primaryFont}</em>, anchored on
            <span
              className="inline-block w-3 h-3 rounded-full align-middle mx-1.5 ring-1 ring-charcoal/10"
              style={{ backgroundColor: config.primaryColor }}
              aria-hidden
            />
            <code className="text-charcoal/80 font-mono text-sm">{config.primaryColor.toLowerCase()}</code>.
          </p>

          {decodeFailed && (
            <p className="mt-6 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 inline-block">
              Couldn't read configuration from the URL — showing defaults.
            </p>
          )}
        </section>

        {/* Slim share bar */}
        <section
          className="export-anim px-6 md:px-10 max-w-2xl mx-auto pb-10 md:pb-14"
          style={{ animationDelay: '1.7s' }}
        >
          <div className="flex items-center gap-3">
            <label
              htmlFor="share-url"
              className="text-[12px] text-charcoal/80 font-medium shrink-0"
            >
              Share link
            </label>
            <div className="flex-1 min-w-0 flex items-center bg-white rounded-xl border border-charcoal/8 shadow-[0_2px_6px_-3px_rgba(20,30,50,0.06)] overflow-hidden">
              <input
                id="share-url"
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 px-3.5 py-2 bg-transparent text-xs md:text-sm font-mono text-charcoal/70 outline-none truncate"
              />
              <button
                type="button"
                onClick={handleShareCopy}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 transition-colors cursor-pointer border-l border-charcoal/8"
              >
                {shareCopied ? <><Check size={13} strokeWidth={2.5} /> Copied</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
          </div>
        </section>

        {/* Main: left nav + preview card */}
        <section
          className="export-anim px-6 md:px-10 max-w-7xl mx-auto pb-20 md:pb-28"
          style={{ animationDelay: '1.85s' }}
        >
          <article className="bg-white rounded-2xl border border-charcoal/5 shadow-[0_4px_14px_-6px_rgba(20,30,50,0.10)] overflow-hidden">
            <div className="grid md:grid-cols-[14rem_minmax(0,1fr)]">
              {/* Left nav — inside the card, divided from preview by a single border */}
              <nav
                aria-label="Export assets"
                className="px-2 py-5 md:py-6 border-b md:border-b-0 md:border-r border-charcoal/8"
              >
                <NavGroup
                  label="Theme artifacts"
                  assets={TOKEN_ASSETS}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
                <NavGroup
                  label="System skills"
                  assets={skillAssets}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  className="mt-7"
                />
              </nav>

              {/* Preview */}
              <div className="min-w-0">
                <header className="flex items-center justify-between gap-3 px-5 py-4 md:px-6 md:py-5">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileIcon kind={selectedAsset.iconKind} size={32} className="shrink-0" />
                    <div className="min-w-0">
                      <h4 className="text-base font-medium text-charcoal truncate">{selectedAsset.title}</h4>
                      <code className="text-xs text-charcoal/80 font-mono truncate block">{selectedAsset.filename}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedAsset.takesColorSpace && (
                      <Select
                        value={colorSpace}
                        onValueChange={(v) => setColorSpace(v as ColorSpace)}
                        options={COLOR_SPACE_OPTIONS}
                        size="compact"
                        triggerClassName="!w-24 !py-1.5 !px-2.5 !text-xs !rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedAsset)}
                      aria-live="polite"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-charcoal/5 hover:bg-charcoal/10 text-charcoal rounded-lg transition-colors cursor-pointer"
                    >
                      {isCopied ? <><Check size={13} strokeWidth={2.5} /> Copied</> : <><Copy size={13} /> Copy</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(selectedAsset)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-charcoal/5 hover:bg-charcoal/10 text-charcoal rounded-lg transition-colors cursor-pointer"
                    >
                      <Download size={13} /> Download
                    </button>
                  </div>
                </header>

                <div className="p-4 md:p-5 -mt-4">
                  <pre className="text-[12px] leading-[1.65] font-mono whitespace-pre bg-gray rounded-xl p-4 max-h-[72vh] overflow-auto">
                    {highlighted}
                  </pre>
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>

      <style>{`
        .export-anim {
          opacity: 0;
          animation: fadeInUp 1.6s cubic-bezier(0.17, 0.84, 0.44, 1) forwards;
          will-change: transform, opacity;
        }
        @media (prefers-reduced-motion: reduce) {
          .export-anim {
            animation: none;
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Left-nav group
// ---------------------------------------------------------------------------

interface NavGroupProps {
  label: string;
  assets: AssetDescriptor[];
  selectedId: AssetId;
  onSelect: (id: AssetId) => void;
  className?: string;
}

const NavGroup: React.FC<NavGroupProps> = ({ label, assets, selectedId, onSelect, className = '' }) => {
  if (assets.length === 0) return null;
  return (
    <div className={className}>
      <p className="text-[12px] text-charcoal/80 font-medium mb-2 px-3">
        {label}
      </p>
      <ul className="flex flex-col gap-0.5">
        {assets.map((asset) => {
          const isSelected = asset.id === selectedId;
          return (
            <li key={asset.id}>
              <button
                type="button"
                onClick={() => onSelect(asset.id)}
                aria-current={isSelected ? 'true' : undefined}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-charcoal/[0.06] text-charcoal'
                    : 'text-charcoal/80 hover:text-charcoal hover:bg-charcoal/[0.03]',
                ].join(' ')}
              >
                <FileIcon kind={asset.iconKind} size={22} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-tight truncate ${isSelected ? 'font-medium' : ''}`}>
                    {asset.title}
                  </p>
                  <code className="text-[10px] text-charcoal/80 font-mono truncate block leading-tight mt-0.5">
                    {asset.filename}
                  </code>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ExportPage;
