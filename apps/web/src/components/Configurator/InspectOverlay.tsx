import React, { useState, useEffect, useRef, useCallback } from 'react';
import { extractTokensFromElement, findStyledAncestor, type TokenInfo } from './inspectUtils';
import { InspectFlyout } from './InspectFlyout';

interface InspectOverlayProps {
  isActive: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDarkMode: boolean;
}

interface HighlightState {
  rect: DOMRect;
  borderRadius: string;
  tokens: TokenInfo[];
  element: HTMLElement;
}

const InspectOverlay: React.FC<InspectOverlayProps> = ({
  isActive,
  containerRef,
  isDarkMode,
}) => {
  const [highlight, setHighlight] = useState<HighlightState | null>(null);
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const lastElementRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number>(0);
  const isFlyoutHoveredRef = useRef(false);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHighlight = useCallback(() => {
    setHighlight(null);
    setEditingToken(null);
    lastElementRef.current = null;
  }, []);

  const handleFlyoutMouseEnter = useCallback(() => {
    isFlyoutHoveredRef.current = true;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);

  const handleFlyoutMouseLeave = useCallback(() => {
    isFlyoutHoveredRef.current = false;
    // Clear after a brief delay — gives the user time to re-enter the container
    leaveTimeoutRef.current = setTimeout(() => {
      if (!isFlyoutHoveredRef.current) {
        clearHighlight();
      }
    }, 100);
  }, [clearHighlight]);

  const updateHighlight = useCallback(
    (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      const computed = getComputedStyle(el);
      setHighlight({
        rect,
        borderRadius: computed.borderRadius,
        tokens: extractTokensFromElement(el),
        element: el,
      });
    },
    [],
  );

  useEffect(() => {
    if (!isActive || !containerRef.current) {
      setHighlight(null);
      setEditingToken(null);
      lastElementRef.current = null;
      return;
    }

    const container = containerRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      // Mouse is back in the container — cancel any pending leave clear
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = null;
      }
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        if (!target || !container.contains(target)) {
          setHighlight(null);
          lastElementRef.current = null;
          return;
        }

        // Skip our own overlay elements
        if (target.closest('[data-inspect-overlay]')) return;

        // Find nearest ancestor with inline token refs
        const styled = findStyledAncestor(target, container);
        if (!styled) {
          setHighlight(null);
          lastElementRef.current = null;
          return;
        }

        if (styled === lastElementRef.current) {
          // Same element — just update rect position (for scroll)
          const rect = styled.getBoundingClientRect();
          setHighlight((prev) =>
            prev ? { ...prev, rect } : null,
          );
          return;
        }

        lastElementRef.current = styled;
        updateHighlight(styled);
        setEditingToken(null);
      });
    };

    const handleMouseLeave = () => {
      // Don't clear if we're editing a token (user is in the flyout)
      if (editingToken) return;
      // Delay clearing so the user can move their cursor to the flyout
      leaveTimeoutRef.current = setTimeout(() => {
        if (!isFlyoutHoveredRef.current) {
          clearHighlight();
        }
      }, 100);
    };

    const handleScroll = () => {
      if (lastElementRef.current) {
        const rect = lastElementRef.current.getBoundingClientRect();
        setHighlight((prev) => (prev ? { ...prev, rect } : null));
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isActive, containerRef, updateHighlight, editingToken, clearHighlight]);

  if (!isActive || !highlight) return null;

  return (
    <>
      {/* Highlight ring — fixed position tracking the element */}
      <div
        data-inspect-overlay
        style={{
          position: 'fixed',
          top: highlight.rect.top - 2,
          left: highlight.rect.left - 2,
          width: highlight.rect.width + 4,
          height: highlight.rect.height + 4,
          border: '2px solid var(--color-background-primary, #3b82f6)',
          borderRadius: highlight.borderRadius,
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'top 0.1s ease-out, left 0.1s ease-out, width 0.1s ease-out, height 0.1s ease-out',
        }}
      />

      {/* Flyout */}
      <InspectFlyout
        tokens={highlight.tokens}
        targetRect={highlight.rect}
        isDarkMode={isDarkMode}
        editingToken={editingToken}
        onEditToken={setEditingToken}
        onCloseEditor={() => setEditingToken(null)}
        onMouseEnter={handleFlyoutMouseEnter}
        onMouseLeave={handleFlyoutMouseLeave}
      />
    </>
  );
};

export default InspectOverlay;
