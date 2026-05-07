import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Check, Copy, Download, Eye, X } from 'lucide-react';

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
// Animation variants
// ---------------------------------------------------------------------------

const cardEnter = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] as [number, number, number, number], delay: 1.6 + i * 0.04 },
  }),
};

const heroEnter = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] as [number, number, number, number], delay: 1.5 } },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ExportPage: React.FC = () => {
  const reducedMotion = useReducedMotion();

  // Read & decode the BrandConfig from the URL on mount; fall back to defaults.
  const [config, setConfig] = useState<BrandConfig>(initialConfig);
  const [decodeFailed, setDecodeFailed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('c');
    if (!raw) return; // no param → use defaults silently
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

  // Per-card state
  const [colorSpace, setColorSpace] = useState<ColorSpace>('oklch');
  const [copiedId, setCopiedId] = useState<AssetId | null>(null);
  const [previewId, setPreviewId] = useState<AssetId | null>(null);

  const generateContent = useCallback((asset: AssetDescriptor): string => {
    if (asset.group === 'skills') {
      const skill = skills.find((s) => `skill-${s.id}` === asset.id);
      return skill?.content ?? '';
    }
    return exportTokens(tokenSet, asset.id as ExportFormat, colorSpace, { includeSemantic: true });
  }, [skills, tokenSet, colorSpace]);

  const handleCopy = useCallback(async (asset: AssetDescriptor) => {
    const content = generateContent(asset);
    await navigator.clipboard.writeText(content);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId((id) => (id === asset.id ? null : id)), 2000);
  }, [generateContent]);

  const handleDownload = useCallback((asset: AssetDescriptor) => {
    const content = generateContent(asset);
    const blob = new Blob([content], { type: asset.lang === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = asset.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [generateContent]);

  const previewAsset = previewId ? allAssets.find((a) => a.id === previewId) ?? null : null;
  const previewContent = previewAsset ? generateContent(previewAsset) : '';

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

  return (
    <div className="export-page min-h-dvh bg-gray text-charcoal">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
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
      <motion.section
        variants={heroEnter}
        initial={reducedMotion ? false : 'hidden'}
        animate="visible"
        className="px-6 md:px-10 max-w-5xl mx-auto pt-8 pb-12 md:pt-16 md:pb-20 text-center"
      >
        <p className="text-xs uppercase tracking-[0.18em] text-charcoal/40 mb-4">Your design system</p>
        <h1 className="text-4xl md:text-6xl font-semibold leading-[1.05] mb-6 text-charcoal">
          Ready to ship.
        </h1>
        <p className="text-base md:text-lg text-charcoal/60 max-w-2xl mx-auto leading-relaxed">
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
      </motion.section>

      {/* Tokens & exports section */}
      <Section title="Tokens & exports" subtitle="Drop these into a project — the CSS file is the canonical export; the others are conveniences for specific tooling.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TOKEN_ASSETS.map((asset, i) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              index={i}
              copied={copiedId === asset.id}
              reducedMotion={reducedMotion ?? false}
              onCopy={() => handleCopy(asset)}
              onDownload={() => handleDownload(asset)}
              onView={() => setPreviewId(asset.id)}
            />
          ))}
        </div>
      </Section>

      {/* LLM skills section */}
      <Section
        title="LLM skills"
        subtitle="Drop these into the .claude/skills/ folder of your project (or any LLM-skill location your tool supports). Each one is self-contained and parameterized to this token system."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {skillAssets.map((asset, i) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              index={TOKEN_ASSETS.length + i}
              copied={copiedId === asset.id}
              reducedMotion={reducedMotion ?? false}
              onCopy={() => handleCopy(asset)}
              onDownload={() => handleDownload(asset)}
              onView={() => setPreviewId(asset.id)}
            />
          ))}
        </div>
      </Section>

      {/* Share */}
      <section className="px-6 md:px-10 max-w-5xl mx-auto pb-20 md:pb-28">
        <div className="bg-white rounded-2xl border border-charcoal/5 px-6 py-5 md:px-8 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-medium text-charcoal mb-1">Share this system</p>
            <p className="text-sm text-charcoal/60">The URL encodes the entire configuration — anyone who opens it sees the exact same tokens.</p>
          </div>
          <button
            type="button"
            onClick={handleShareCopy}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-charcoal text-white rounded-lg hover:bg-charcoal/90 transition-colors cursor-pointer"
          >
            {shareCopied ? <><Check size={14} strokeWidth={2.5} /> Copied</> : <><Copy size={14} /> Copy URL</>}
          </button>
        </div>
      </section>

      {/* Preview dialog */}
      <PreviewDialog
        asset={previewAsset}
        content={previewContent}
        open={previewId !== null}
        onOpenChange={(open) => { if (!open) setPreviewId(null); }}
        colorSpace={colorSpace}
        onColorSpaceChange={setColorSpace}
        copied={previewAsset !== null && copiedId === previewAsset.id}
        onCopy={() => previewAsset && handleCopy(previewAsset)}
        onDownload={() => previewAsset && handleDownload(previewAsset)}
        reducedMotion={reducedMotion ?? false}
      />

      <style>{`
        .export-page { animation: exportPageIn 0.6s ease-out 1.55s backwards; }
        @keyframes exportPageIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .export-page { animation: none; }
        }
      `}</style>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

const Section: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="px-6 md:px-10 max-w-6xl mx-auto pb-12 md:pb-16">
    <div className="mb-6 md:mb-8">
      <h2 className="text-xl md:text-2xl font-semibold text-charcoal mb-1.5">{title}</h2>
      <p className="text-sm text-charcoal/55 max-w-2xl">{subtitle}</p>
    </div>
    {children}
  </section>
);

// ---------------------------------------------------------------------------
// Asset card
// ---------------------------------------------------------------------------

interface AssetCardProps {
  asset: AssetDescriptor;
  index: number;
  copied: boolean;
  reducedMotion: boolean;
  onCopy: () => void;
  onDownload: () => void;
  onView: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({ asset, index, copied, reducedMotion, onCopy, onDownload, onView }) => (
  <motion.article
    variants={cardEnter}
    custom={index}
    initial={reducedMotion ? false : 'hidden'}
    animate="visible"
    className="group flex flex-col gap-4 bg-white rounded-2xl border border-charcoal/5 p-5 md:p-6 hover:border-charcoal/15 transition-colors"
  >
    <div className="flex items-start gap-4">
      <FileIcon kind={asset.iconKind} size={48} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-charcoal text-sm leading-tight mb-0.5">{asset.title}</h3>
        <code className="text-xs text-charcoal/50 font-mono block truncate">{asset.filename}</code>
      </div>
    </div>

    <p className="text-xs text-charcoal/55 leading-relaxed flex-1">{asset.description}</p>

    <div className="flex items-center gap-1 -mx-1">
      <CardAction icon={copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}     label={copied ? 'Copied' : 'Copy'} onClick={onCopy} />
      <CardAction icon={<Download size={13} />}                                                  label="Download"                   onClick={onDownload} />
      <CardAction icon={<Eye size={13} />}                                                       label="View"                       onClick={onView} />
    </div>
  </motion.article>
);

const CardAction: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 rounded-lg transition-colors cursor-pointer"
  >
    {icon}
    {label}
  </button>
);

// ---------------------------------------------------------------------------
// Preview dialog
// ---------------------------------------------------------------------------

interface PreviewDialogProps {
  asset: AssetDescriptor | null;
  content: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  colorSpace: ColorSpace;
  onColorSpaceChange: (cs: ColorSpace) => void;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  reducedMotion: boolean;
}

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};

const cardVariants = {
  hidden:  (rm: boolean) => ({ opacity: 0, scale: rm ? 1 : 0.96, y: rm ? 0 : 18 }),
  visible: (rm: boolean) => ({
    opacity: 1, scale: 1, y: 0,
    transition: { duration: rm ? 0.12 : 0.28, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  }),
  exit: (rm: boolean) => ({
    opacity: 0, scale: rm ? 1 : 0.97, y: rm ? 0 : 10,
    transition: { duration: rm ? 0.1 : 0.22, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
};

const PreviewDialog: React.FC<PreviewDialogProps> = ({
  asset, content, open, onOpenChange, colorSpace, onColorSpaceChange, copied, onCopy, onDownload, reducedMotion,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  const handleExitComplete = () => {
    if (!open) setMounted(false);
  };

  const highlighted = useMemo(
    () => (asset ? highlight(content, asset.lang) : null),
    [asset, content],
  );

  return (
    <Dialog.Root open={mounted} onOpenChange={onOpenChange}>
      <AnimatePresence initial={false} onExitComplete={handleExitComplete}>
        {open && asset && (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop
              className="fixed inset-0 z-50 bg-black/40"
              render={
                <motion.div
                  variants={backdropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: reducedMotion ? 0.1 : 0.2 }}
                />
              }
            />
            <Dialog.Popup
              className="fixed left-0 top-0 z-50 flex h-screen w-screen items-center justify-center p-3 sm:p-4"
              onClick={(e) => { if (e.target === e.currentTarget) onOpenChange(false); }}
            >
              <motion.div
                variants={cardVariants}
                custom={reducedMotion}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex max-h-[90dvh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl will-change-[transform,opacity] sm:max-h-[80vh]"
              >
                <div className="flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
                  <Dialog.Title render={() => (
                    <div className="flex items-center gap-3 min-w-0">
                      <FileIcon kind={asset.iconKind} size={32} />
                      <div className="min-w-0">
                        <h4 className="text-base font-medium text-charcoal truncate">{asset.title}</h4>
                        <code className="text-xs text-charcoal/50 font-mono truncate block">{asset.filename}</code>
                      </div>
                    </div>
                  )} />
                  <Dialog.Close
                    aria-label="Close preview"
                    className="text-charcoal/40 hover:text-charcoal/70 transition-colors cursor-pointer p-1 rounded-lg hover:bg-charcoal/5 shrink-0"
                  >
                    <X size={18} />
                  </Dialog.Close>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 px-4 sm:px-6 pb-3">
                  {asset.takesColorSpace && (
                    <Select
                      value={colorSpace}
                      onValueChange={(v) => onColorSpaceChange(v as ColorSpace)}
                      options={COLOR_SPACE_OPTIONS}
                      size="compact"
                      triggerClassName="!w-28 !py-1.5 !px-2.5 !text-xs !rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={onCopy}
                    aria-live="polite"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-charcoal/5 hover:bg-charcoal/10 text-charcoal rounded-lg transition-colors cursor-pointer"
                  >
                    {copied ? <><Check size={13} strokeWidth={2.5} /> Copied</> : <><Copy size={13} /> Copy</>}
                  </button>
                  <button
                    type="button"
                    onClick={onDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-charcoal/5 hover:bg-charcoal/10 text-charcoal rounded-lg transition-colors cursor-pointer"
                  >
                    <Download size={13} /> Download
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-auto p-4 pt-0 sm:p-6 sm:pt-0">
                  <pre className="text-[12px] leading-[1.65] font-mono whitespace-pre overflow-x-auto bg-gray rounded-xl p-4 max-h-[60vh] overflow-y-auto">
                    {highlighted}
                  </pre>
                </div>
              </motion.div>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default ExportPage;
