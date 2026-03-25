import React, { useState, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Palette, Ruler, Type, Layers, Zap, Sparkles } from 'lucide-react';
import {
  type TokenInfo,
  type TokenCategory,
  CATEGORY_LABELS,
  isEditableToken,
  getEditLabel,
} from './inspectUtils';
import { InspectTokenEditor } from './InspectTokenEditor';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FLYOUT_W = 300;
const FLYOUT_MAX_H = 320;
const MARGIN = 12;
const GAP = 8;

const CATEGORY_ICONS: Record<TokenCategory, React.FC<{ size: number }>> = {
  color: Palette,
  spacing: Ruler,
  radius: Layers,
  typography: Type,
  shadow: Layers,
  transition: Zap,
  gradient: Sparkles,
};

const CATEGORY_ORDER: TokenCategory[] = [
  'color',
  'gradient',
  'spacing',
  'radius',
  'typography',
  'shadow',
  'transition',
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InspectFlyoutProps {
  tokens: TokenInfo[];
  targetRect: DOMRect;
  isDarkMode: boolean;
  editingToken: string | null;
  onEditToken: (tokenName: string) => void;
  onCloseEditor: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const InspectFlyout: React.FC<InspectFlyoutProps> = ({
  tokens,
  targetRect,
  isDarkMode,
  editingToken,
  onEditToken,
  onCloseEditor,
  onMouseEnter,
  onMouseLeave,
}) => {
  const flyoutRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [editAnchorRect, setEditAnchorRect] = useState<DOMRect | null>(null);

  // Group tokens by category
  const grouped = useMemo(() => {
    const map = new Map<TokenCategory, TokenInfo[]>();
    for (const t of tokens) {
      const list = map.get(t.category) || [];
      list.push(t);
      map.set(t.category, list);
    }
    return CATEGORY_ORDER
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, tokens: map.get(cat)! }));
  }, [tokens]);

  // Position the flyout relative to the target element
  useLayoutEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Default: below-right of target
    let top = targetRect.bottom + GAP;
    let left = targetRect.left;

    // Flip vertically if not enough space below
    if (top + FLYOUT_MAX_H > vh - MARGIN) {
      top = targetRect.top - FLYOUT_MAX_H - GAP;
      if (top < MARGIN) top = MARGIN;
    }

    // Flip horizontally if not enough space to the right
    if (left + FLYOUT_W > vw - MARGIN) {
      left = vw - FLYOUT_W - MARGIN;
    }
    if (left < MARGIN) left = MARGIN;

    setPosition({ top, left });
  }, [targetRect]);

  if (tokens.length === 0) return null;

  return createPortal(
    <>
      <AnimatePresence mode="wait">
        <motion.div
          ref={flyoutRef}
          key={`flyout-${targetRect.top}-${targetRect.left}`}
          data-inspect-overlay
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-charcoal/10 overflow-hidden"
          style={{
            top: position.top,
            left: position.left,
            width: FLYOUT_W,
            maxHeight: FLYOUT_MAX_H,
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="overflow-y-auto p-3" style={{ maxHeight: FLYOUT_MAX_H }}>
            {grouped.map(({ category, tokens: catTokens }) => {
              const Icon = CATEGORY_ICONS[category];
              return (
                <div key={category} className="mb-3 last:mb-0">
                  {/* Category header */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon size={10} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal/50">
                      {CATEGORY_LABELS[category]}
                    </span>
                  </div>

                  {/* Token rows */}
                  {catTokens.map((token) => (
                    <TokenRow
                      key={token.tokenName}
                      token={token}
                      isDarkMode={isDarkMode}
                      isEditing={editingToken === token.tokenName}
                      onEdit={(anchorRect) => {
                        setEditAnchorRect(anchorRect);
                        onEditToken(token.tokenName);
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Token editor popover */}
      <AnimatePresence>
        {editingToken && editAnchorRect && (
          <InspectTokenEditor
            key={editingToken}
            tokenName={editingToken}
            isDarkMode={isDarkMode}
            anchorRect={editAnchorRect}
            onClose={onCloseEditor}
          />
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
};

// ---------------------------------------------------------------------------
// TokenRow
// ---------------------------------------------------------------------------

const TokenRow: React.FC<{
  token: TokenInfo;
  isDarkMode: boolean;
  isEditing: boolean;
  onEdit: (anchorRect: DOMRect) => void;
}> = ({ token, isDarkMode, isEditing, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  const editBtnRef = useRef<HTMLButtonElement>(null);
  const editable = isEditableToken(token.tokenName, isDarkMode);
  const editLabel = getEditLabel(token.tokenName, isDarkMode);

  // Strip common prefix for shorter display
  const displayName = token.tokenName
    .replace(/^color-(background|foreground|border|chart)-/, '$1/')
    .replace(/^color-/, '')
    .replace(/^spacing-/, '')
    .replace(/^radius-/, '')
    .replace(/^font-family-/, '')
    .replace(/^shadow-/, '')
    .replace(/^transition-/, '')
    .replace(/^gradient-/, 'gradient/');

  const isColor = token.category === 'color' || token.category === 'gradient';

  return (
    <div
      className={`flex items-center gap-2 px-1.5 py-1 -mx-1.5 rounded-md transition-colors ${
        isHovered ? 'bg-charcoal/5' : ''
      } ${isEditing ? 'bg-charcoal/8' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Swatch or indicator */}
      {isColor ? (
        <div
          className="w-4 h-4 rounded border border-charcoal/10 shrink-0"
          style={{ backgroundColor: token.resolvedValue }}
        />
      ) : (
        <div className="w-4 h-4 rounded bg-charcoal/5 flex items-center justify-center shrink-0">
          <span className="text-[8px] text-charcoal/40">
            {token.category === 'spacing' ? 'S' : token.category === 'radius' ? 'R' : token.category === 'typography' ? 'T' : '·'}
          </span>
        </div>
      )}

      {/* Token name + value */}
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-mono text-charcoal truncate leading-tight">
          {displayName}
        </div>
        <div className="text-[9px] font-mono text-charcoal/40 truncate leading-tight">
          {token.resolvedValue}
          {editLabel && (
            <span className="ml-1 text-charcoal/30">({editLabel})</span>
          )}
        </div>
      </div>

      {/* Edit button — only for editable color tokens */}
      {editable && (isHovered || isEditing) && (
        <button
          ref={editBtnRef}
          onClick={() => {
            if (editBtnRef.current) {
              onEdit(editBtnRef.current.getBoundingClientRect());
            }
          }}
          className={`shrink-0 p-1 rounded transition-colors cursor-pointer ${
            isEditing
              ? 'bg-forest-green/10 text-forest-green'
              : 'hover:bg-charcoal/10 text-charcoal/50'
          }`}
        >
          <Pencil size={10} />
        </button>
      )}
    </div>
  );
};
