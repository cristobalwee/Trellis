import React, { useState, useMemo, useCallback } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Copy, Check } from 'lucide-react';
import { Select } from '../ui/Select';
import { exportTokens, type ExportFormat, type ColorSpace } from '../../utils/exportTokens';

// ---------------------------------------------------------------------------
// Format tabs
// ---------------------------------------------------------------------------

const FORMAT_TABS: { id: ExportFormat; label: string }[] = [
  { id: 'css', label: 'CSS' },
  { id: 'dtcg', label: 'DTCG JSON' },
  { id: 'tailwind', label: 'Tailwind' },
  { id: 'shadcn', label: 'shadcn' },
];

const COLOR_SPACE_OPTIONS = [
  { value: 'hex', label: 'hex' },
  { value: 'rgb', label: 'rgb' },
  { value: 'hsl', label: 'hsl' },
  { value: 'oklch', label: 'oklch' },
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
// Component
// ---------------------------------------------------------------------------

interface ExportDialogProps {
  tokens: Record<string, string>;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ tokens }) => {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('css');
  const [colorSpace, setColorSpace] = useState<ColorSpace>('hex');
  const [copied, setCopied] = useState(false);

  const output = useMemo(
    () => exportTokens(tokens, format, colorSpace),
    [tokens, format, colorSpace],
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
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-6 mb-1">
                  <Dialog.Title className="text-2xl text-charcoal">
                    Export system
                  </Dialog.Title>
                  <Dialog.Close className="text-charcoal/40 hover:text-charcoal/70 transition-colors cursor-pointer p-1 rounded-lg hover:bg-charcoal/5">
                    <X size={18} />
                  </Dialog.Close>
                </div>

                {/* Toolbar: tabs + color space + copy */}
                <div className="flex flex-wrap items-center gap-3 px-6 justify-between">
                  {/* Format tabs */}
                  <div className="flex gap-1 bg-charcoal/5 rounded-lg p-0.5 flex-1 min-w-0 max-w-fit">
                    {FORMAT_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setFormat(tab.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                          format === tab.id
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
                    <Select
                      value={colorSpace}
                      onValueChange={(v) => setColorSpace(v as ColorSpace)}
                      options={COLOR_SPACE_OPTIONS}
                      size="compact"
                      triggerClassName="!w-28 !py-1.5 !px-2.5 !text-xs !rounded-lg"
                    />
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
                  <pre className="text-xs leading-relaxed text-charcoal/80 font-mono whitespace-pre overflow-x-auto bg-charcoal/[0.03] rounded-xl p-4 max-h-[50vh] overflow-y-auto">
                    {output}
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
