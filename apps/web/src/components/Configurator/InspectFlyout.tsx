import React, { useState, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { Pencil, Palette, Sparkles } from 'lucide-react';
import {
  type TokenInfo,
  type TokenCategory,
  CATEGORY_LABELS,
  isEditableToken,
  getEditLabel,
} from './inspectUtils';
import { InspectTokenEditor } from './InspectTokenEditor';
import type { PrimitiveMapping } from '../../utils/generateTokens';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FLYOUT_W = 300;
const FLYOUT_MAX_H = 320;
const MARGIN = 12;
const GAP = 8;
/** Invisible hit-area padding so the cursor can easily reach the flyout */
const SAFE_ZONE = 12;

const CATEGORY_ICONS: Partial<Record<TokenCategory, React.FC<{ size: number }>>> = {
  color: Palette,
  gradient: Sparkles,
};

const CATEGORY_ORDER: TokenCategory[] = [
  'color',
  'gradient',
];

/** CSS easing for the flyout slide */
const SLIDE_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'; // ease-out-expo
const SLIDE_DURATION = '0.8s';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface InspectFlyoutProps {
  /** Whether the flyout content should be visible (opaque + interactive) */
  visible: boolean;
  tokens: TokenInfo[];
  /** null when no element is highlighted — flyout holds its last position */
  targetRect: DOMRect | null;
  /** Container element — used to seed the initial position at its centre */
  containerRef: React.RefObject<HTMLElement | null>;
  isDarkMode: boolean;
  semanticMap: Record<string, PrimitiveMapping>;
  editingToken: string | null;
  onEditToken: (tokenName: string) => void;
  onCloseEditor: () => void;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}

export const InspectFlyout: React.FC<InspectFlyoutProps> = ({
  visible,
  tokens,
  targetRect,
  containerRef,
  isDarkMode,
  semanticMap,
  editingToken,
  onEditToken,
  onCloseEditor,
  onMouseEnter,
  onMouseLeave,
}) => {
  const flyoutRef = useRef<HTMLDivElement>(null);
  // Seed at the centre of the dashboard container
  const [position, setPosition] = useState(() => {
    const el = containerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      return {
        top: r.top + r.height / 2,
        left: r.left + r.width / 2 - FLYOUT_W / 2,
      };
    }
    return { top: window.innerHeight / 2, left: window.innerWidth / 2 - FLYOUT_W / 2 };
  });
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

  // Reposition when target changes — skip when null so we hold last position
  useLayoutEffect(() => {
    if (!targetRect) return;

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

  return createPortal(
    <>
      {/* Invisible safe-zone wrapper — extends the flyout hit area so the
          cursor can travel from the highlighted element to the flyout without
          accidentally dismissing it.
          Uses plain CSS transitions for position so the element never resets
          to 0,0 — it simply holds its last position when invisible. */}
      <div
        data-inspect-overlay
        className="fixed z-[9999] box-border"
        style={{
          top: position.top - SAFE_ZONE,
          left: position.left - SAFE_ZONE,
          width: FLYOUT_W + SAFE_ZONE * 2,
          padding: SAFE_ZONE,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: `top ${SLIDE_DURATION} ${SLIDE_EASE}, left ${SLIDE_DURATION} ${SLIDE_EASE}, opacity 0.18s ease`,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div
          ref={flyoutRef}
          data-inspect-overlay
          className="bg-white rounded-xl shadow-xl border border-charcoal/10 overflow-hidden"
          style={{
            width: FLYOUT_W,
            maxHeight: FLYOUT_MAX_H,
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="overflow-y-auto p-3" style={{ maxHeight: FLYOUT_MAX_H }}>
            {grouped.map(({ category, tokens: catTokens }) => {
              const Icon = CATEGORY_ICONS[category];
              return (
                <div key={category} className="mb-3 last:mb-0">
                  {/* Category header */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {Icon && <Icon size={10} />}
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
                      semanticMap={semanticMap}
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
        </div>
      </div>

      {/* Token editor popover */}
      <AnimatePresence>
        {editingToken && editAnchorRect && (
          <InspectTokenEditor
            key={editingToken}
            tokenName={editingToken}
            isDarkMode={isDarkMode}
            semanticMap={semanticMap}
            anchorRect={editAnchorRect}
            onClose={onCloseEditor}
            onMouseEnter={onMouseEnter}
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
  semanticMap: Record<string, PrimitiveMapping>;
  isEditing: boolean;
  onEdit: (anchorRect: DOMRect) => void;
}> = ({ token, isDarkMode, semanticMap, isEditing, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  const editBtnRef = useRef<HTMLButtonElement>(null);
  const editable = isEditableToken(token.tokenName, isDarkMode, semanticMap);
  const editLabel = getEditLabel(token.tokenName, isDarkMode, semanticMap);

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
