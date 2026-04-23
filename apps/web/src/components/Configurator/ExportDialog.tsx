import React, { useState, useMemo, useCallback } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { Select } from '../ui/Select';
import {
  exportTokens,
  generateGuide,
  type ExportFormat,
  type ColorSpace,
  type TokenSet,
} from '../../utils/exportTokens';
import type { BrandConfig } from '../BrandIntake/store';

// ---------------------------------------------------------------------------
// Format tabs
// ---------------------------------------------------------------------------

/**
 * `guide` isn't an export format — it's a dedicated markdown tab rendered
 * inside the same code area. Kept in the tab list so the UI treats it
 * uniformly; switch logic branches on `activeTab === 'guide'`.
 */
type TabKey = ExportFormat | 'guide';

const FORMAT_TABS: { id: TabKey; label: string }[] = [
  { id: 'css', label: 'CSS' },
  { id: 'dtcg', label: 'DTCG JSON' },
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'shadcn', label: 'shadcn' },
  { id: 'guide', label: 'Guide' },
];

const COLOR_SPACE_OPTIONS = [
  { value: 'oklch', label: 'oklch' },
  { value: 'hex', label: 'hex' },
  { value: 'rgb', label: 'rgb' },
  { value: 'hsl', label: 'hsl' },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const popupVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 28, stiffness: 400, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.15, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
};

// ---------------------------------------------------------------------------
// Syntax highlighting
// ---------------------------------------------------------------------------

type Lang = 'css' | 'json' | 'js' | 'md';

const MD_COLORS = {
  heading:  'text-slate-900 font-semibold',
  bullet:   'text-slate-400',
  code:     'text-indigo-700',
  fence:    'text-slate-400',
  link:     'text-forest-green underline decoration-forest-green/40',
  plain:    'text-slate-700',
};

function fenceLangFor(lang: string): Lang {
  const l = lang.toLowerCase();
  if (l === 'json') return 'json';
  if (l === 'js' || l === 'javascript' || l === 'ts' || l === 'typescript') return 'js';
  return 'css';
}

/** Render a single markdown line. Inline `code` runs are backtick-wrapped. */
function renderMdPlain(line: string, key: number): React.ReactNode {
  const trimmed = line.trimStart();

  if (trimmed === '') return <div key={key}>&nbsp;</div>;

  // Headings (# … ######)
  if (/^#{1,6}\s/.test(trimmed)) {
    return <div key={key}><span className={MD_COLORS.heading}>{line}</span></div>;
  }

  // Unordered list item
  const bulletMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
  if (bulletMatch) {
    const [, lead, marker, rest] = bulletMatch;
    return (
      <div key={key}>
        {lead}
        <span className={MD_COLORS.bullet}>{marker}</span>
        {' '}
        {renderMdInline(rest)}
      </div>
    );
  }

  return <div key={key}>{renderMdInline(line)}</div>;
}

/** Colour `code`, [link](url) and plain text inside a markdown line. */
function renderMdInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let i = 0;
  let idx = 0;
  // Matches either a backtick-quoted inline code span or a [label](url) link.
  const re = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > i) {
      parts.push(<span key={`p${idx++}`} className={MD_COLORS.plain}>{text.slice(i, m.index)}</span>);
    }
    if (m[1] !== undefined) {
      parts.push(<span key={`c${idx++}`} className={MD_COLORS.code}>{`\`${m[1]}\``}</span>);
    } else {
      parts.push(
        <span key={`l${idx++}`} className={MD_COLORS.link}>{`[${m[2]}](${m[3]})`}</span>,
      );
    }
    i = m.index + m[0].length;
  }
  if (i < text.length) {
    parts.push(<span key={`p${idx++}`} className={MD_COLORS.plain}>{text.slice(i)}</span>);
  }
  return <>{parts}</>;
}

const COLORS = {
  comment:   'text-emerald-700/70 italic',
  selector:  'text-rose-600',
  property:  'text-indigo-700 font-medium',
  value:     'text-slate-800',
  colorVal:  'text-amber-700 font-medium',
  number:    'text-amber-700',
  string:    'text-emerald-700',
  key:       'text-indigo-700 font-medium',
  keyword:   'text-rose-600',
  punct:     'text-slate-400',
  plain:     'text-slate-700',
};

function isColorLiteral(v: string): boolean {
  const t = v.trim().replace(/;$/, '');
  return /^#[0-9a-f]{3,8}$/i.test(t)
    || /^(rgb|rgba|hsl|hsla|oklch|lch|lab)\(/i.test(t)
    || /^linear-gradient\(/i.test(t);
}

function renderCssLine(line: string, key: number): React.ReactNode {
  const trimmed = line.trim();

  // Blank line
  if (trimmed === '') return <div key={key}>&nbsp;</div>;

  // Comment
  if (trimmed.startsWith('/*')) {
    return <div key={key}><span className={COLORS.comment}>{line}</span></div>;
  }

  // Closing brace
  if (trimmed === '}') {
    const leading = line.match(/^\s*/)?.[0] ?? '';
    return <div key={key}>{leading}<span className={COLORS.punct}>{'}'}</span></div>;
  }

  // Selector line (ends with {)
  if (/\{\s*$/.test(trimmed)) {
    const leading = line.match(/^\s*/)?.[0] ?? '';
    const sel = trimmed.replace(/\s*\{\s*$/, '');
    return (
      <div key={key}>
        {leading}
        <span className={COLORS.selector}>{sel}</span>{' '}
        <span className={COLORS.punct}>{'{'}</span>
      </div>
    );
  }

  // Property: value; line
  const m = line.match(/^(\s*)(--[A-Za-z0-9-]+)(\s*:\s*)(.+?)(;?)\s*$/);
  if (m) {
    const [, lead, prop, colon, value, semi] = m;
    const valClass = isColorLiteral(value) ? COLORS.colorVal : COLORS.value;
    return (
      <div key={key}>
        {lead}
        <span className={COLORS.property}>{prop}</span>
        <span className={COLORS.punct}>{colon}</span>
        <span className={valClass}>{value}</span>
        <span className={COLORS.punct}>{semi}</span>
      </div>
    );
  }

  return <div key={key}><span className={COLORS.plain}>{line}</span></div>;
}

function renderJsonLine(line: string, key: number): React.ReactNode {
  // Match: leading ws, "key": then value, trailing comma
  const kv = line.match(/^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)(.+?)(,?)\s*$/);
  if (kv) {
    const [, lead, keyStr, colon, value, comma] = kv;
    return (
      <div key={key}>
        {lead}
        <span className={COLORS.key}>{keyStr}</span>
        <span className={COLORS.punct}>{colon}</span>
        {renderJsonValue(value)}
        <span className={COLORS.punct}>{comma}</span>
      </div>
    );
  }
  // Pure braces / brackets
  const leading = line.match(/^\s*/)?.[0] ?? '';
  const rest = line.slice(leading.length);
  return <div key={key}>{leading}<span className={COLORS.punct}>{rest}</span></div>;
}

function renderJsonValue(value: string): React.ReactNode {
  const v = value.trim();
  if (v === '{' || v === '[' || v === '{}' || v === '[]') {
    return <span className={COLORS.punct}>{value}</span>;
  }
  if (v.startsWith('"') && v.endsWith('"')) {
    const inner = v.slice(1, -1);
    if (isColorLiteral(inner)) {
      return <span className={COLORS.colorVal}>{value}</span>;
    }
    return <span className={COLORS.string}>{value}</span>;
  }
  if (/^-?\d/.test(v)) return <span className={COLORS.number}>{value}</span>;
  if (v === 'true' || v === 'false' || v === 'null') {
    return <span className={COLORS.keyword}>{value}</span>;
  }
  return <span className={COLORS.value}>{value}</span>;
}

function renderJsLine(line: string, key: number): React.ReactNode {
  const trimmed = line.trim();

  if (trimmed.startsWith('/*') || trimmed.startsWith('//') || trimmed.startsWith('*')) {
    return <div key={key}><span className={COLORS.comment}>{line}</span></div>;
  }

  // Key: 'value' or key: { pattern
  const kv = line.match(/^(\s*)('[^']+'|"[^"]+"|[A-Za-z_][A-Za-z0-9_]*)(\s*:\s*)(.*)$/);
  if (kv) {
    const [, lead, k, colon, rest] = kv;
    return (
      <div key={key}>
        {lead}
        <span className={COLORS.key}>{k}</span>
        <span className={COLORS.punct}>{colon}</span>
        {renderJsRest(rest)}
      </div>
    );
  }

  // export default { etc
  if (/^(export|default|import|from|const|let|var)\b/.test(trimmed)) {
    const leading = line.match(/^\s*/)?.[0] ?? '';
    return (
      <div key={key}>
        {leading}
        <span className={COLORS.keyword}>{trimmed}</span>
      </div>
    );
  }

  return <div key={key}><span className={COLORS.plain}>{line}</span></div>;
}

function renderJsRest(rest: string): React.ReactNode {
  // Handle trailing comma
  const commaMatch = rest.match(/,\s*$/);
  const hasComma = !!commaMatch;
  const body = hasComma ? rest.slice(0, commaMatch!.index) : rest;
  const trimmed = body.trim();

  let content: React.ReactNode;
  if (trimmed === '{' || trimmed === '[' || trimmed === '{}' || trimmed === '[]') {
    content = <span className={COLORS.punct}>{body}</span>;
  } else if (/^'(.*)'$/.test(trimmed) || /^"(.*)"$/.test(trimmed)) {
    const inner = trimmed.slice(1, -1);
    content = (
      <span className={isColorLiteral(inner) ? COLORS.colorVal : COLORS.string}>{body}</span>
    );
  } else if (/^-?\d/.test(trimmed)) {
    content = <span className={COLORS.number}>{body}</span>;
  } else {
    content = <span className={COLORS.value}>{body}</span>;
  }

  return (
    <>
      {content}
      {hasComma && <span className={COLORS.punct}>,</span>}
    </>
  );
}

function renderByLang(line: string, key: number, lang: Lang): React.ReactNode {
  switch (lang) {
    case 'json': return renderJsonLine(line, key);
    case 'js':   return renderJsLine(line, key);
    case 'md':   return renderMdPlain(line, key);
    default:     return renderCssLine(line, key);
  }
}

/**
 * Markdown highlighter — applies code-block highlighting inside ``` fences
 * (using whatever language is declared on the fence line) and lightweight
 * styling to headings / bullets / inline code outside of fences. The raw
 * text is preserved line-for-line so "copy" yields valid markdown.
 */
function highlightMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let inFence = false;
  let fenceLang: Lang = 'css';

  lines.forEach((line, i) => {
    const fence = line.match(/^(\s*)```(\S*)\s*$/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceLang = fenceLangFor(fence[2]);
      } else {
        inFence = false;
      }
      out.push(<div key={i}><span className={MD_COLORS.fence}>{line}</span></div>);
      return;
    }
    if (inFence) {
      out.push(
        <React.Fragment key={i}>{renderByLang(line, i, fenceLang)}</React.Fragment>,
      );
      return;
    }
    out.push(<React.Fragment key={i}>{renderMdPlain(line, i)}</React.Fragment>);
  });
  return out;
}

function highlight(text: string, lang: Lang): React.ReactNode {
  if (lang === 'md') return highlightMarkdown(text);
  const lines = text.split('\n');
  return lines.map((line, i) => renderByLang(line, i, lang));
}

function langFor(tab: TabKey): Lang {
  if (tab === 'guide')    return 'md';
  if (tab === 'dtcg')     return 'json';
  if (tab === 'tailwind') return 'js';
  return 'css';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ExportDialogProps {
  tokens: TokenSet;
  config: BrandConfig;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ tokens, config }) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('css');
  // Tracks which export format the user most recently viewed. Used by the
  // guide overview copy; starts `null` so the guide falls back to its
  // generic "available in CSS, DTCG JSON, …" phrasing until the user has
  // actually landed on a format tab.
  const [lastExportFormat, setLastExportFormat] = useState<ExportFormat | null>(null);
  const [colorSpace, setColorSpace] = useState<ColorSpace>('oklch');
  const [includeSemantic, setIncludeSemantic] = useState(true);
  const [copied, setCopied] = useState(false);

  const isGuide = activeTab === 'guide';

  const handleTabChange = useCallback((tab: TabKey) => {
    if (tab !== 'guide') setLastExportFormat(tab);
    setActiveTab(tab);
  }, []);

  const output = useMemo(() => {
    if (isGuide) return generateGuide(config, tokens, lastExportFormat);
    return exportTokens(tokens, activeTab, colorSpace, { includeSemantic });
  }, [isGuide, config, tokens, lastExportFormat, activeTab, colorSpace, includeSemantic]);

  const highlighted = useMemo(
    () => highlight(output, langFor(activeTab)),
    [output, activeTab],
  );

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="btn btn-primary shadow-none btn-sm flex items-center gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Export
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop
              className="fixed inset-0 z-50"
              render={
                <motion.div
                  variants={backdropVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.2 }}
                />
              }
              style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            />
            <Dialog.Popup
              className="fixed z-50 top-0 left-0 w-screen h-screen flex items-center justify-center p-4"
              render={
                <motion.div
                  variants={popupVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                />
              }
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-6 mb-1">
                  <Dialog.Title render={() => (
                    <h4 className="text-xl text-charcoal">
                      Export theme
                    </h4>
                  )}></Dialog.Title>
                  <Dialog.Close className="text-charcoal/40 hover:text-charcoal/70 transition-colors cursor-pointer p-1 rounded-lg hover:bg-charcoal/5">
                    <X size={18} />
                  </Dialog.Close>
                </div>

                {/* Toolbar: tabs + color space + copy */}
                <div className="flex flex-wrap items-center gap-3 px-6 justify-between">
                  {/* Format tabs */}
                  <div className="flex gap-1 bg-charcoal/5 rounded-lg p-0.5 flex-1 min-w-fit max-w-fit">
                    {FORMAT_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-white text-charcoal shadow-sm'
                            : 'text-charcoal/60 hover:text-charcoal'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Color space selector + copy */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* {format === 'css' && (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={includeSemantic}
                        onClick={() => setIncludeSemantic((v) => !v)}
                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-charcoal bg-charcoal/5 hover:bg-charcoal/10 rounded-lg transition-colors cursor-pointer"
                        title="Include semantic tokens in the CSS export"
                      >
                        <span
                          className={`relative inline-block w-7 h-4 rounded-full transition-colors ${
                            includeSemantic ? 'bg-charcoal' : 'bg-charcoal/20'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${
                              includeSemantic ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </span>
                        Semantic tokens
                      </button>
                    )} */}
                    {!isGuide && (
                      <Select
                        value={colorSpace}
                        onValueChange={(v) => setColorSpace(v as ColorSpace)}
                        options={COLOR_SPACE_OPTIONS}
                        size="compact"
                        triggerClassName="!w-28 !py-1.5 !px-2.5 !text-xs !rounded-lg"
                      />
                    )}
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-charcoal/5 hover:bg-charcoal/10 text-charcoal rounded-lg transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check size={13} strokeWidth={2.5} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code output */}
                <div className="flex-1 overflow-auto min-h-0 p-6 pt-4">
                  <pre className="text-[12px] leading-[1.65] font-mono whitespace-pre overflow-x-auto bg-gray rounded-xl p-4 max-h-[50vh] overflow-y-auto">
                    {highlighted}
                  </pre>
                </div>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
};

export default ExportDialog;
