import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { Sun, Moon, Download } from 'lucide-react';

import { $brandConfig, updateConfig, resetConfig, type TabId } from './store';
import { siteImages } from '../../lib/siteImages';
import { generateDesignTokens } from '@trellis/generator';
import BrandHeader from './BrandHeader';
import TabBar from './TabBar';
import TabColor from './TabColor';
import TabTypography from './TabTypography';
import TabStyle from './TabStyle';
import PlaygroundDashboard from '../LivePlayground/PlaygroundDashboard';
import type { PlaygroundConfig } from '../LivePlayground/types';

// ---------------------------------------------------------------------------
// Preview tab bar (Dashboard / Components)
// ---------------------------------------------------------------------------

type PreviewTab = 'dashboard' | 'components';

const PreviewTabBar: React.FC<{ active: PreviewTab; onChange: (t: PreviewTab) => void }> = ({ active, onChange }) => (
  <div className="flex gap-1 bg-charcoal/5 rounded-lg p-0.5" role="tablist" aria-label="Preview type">
    {(['dashboard', 'components'] as const).map((tab) => (
      <button
        key={tab}
        type="button"
        role="tab"
        aria-selected={active === tab}
        onClick={() => onChange(tab)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer capitalize ${
          active === tab
            ? 'bg-white text-charcoal shadow-sm'
            : 'text-charcoal/50 hover:text-charcoal/80'
        }`}
      >
        {tab}
      </button>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Dark mode toggle
// ---------------------------------------------------------------------------

const DarkModeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({ isDark, onToggle }) => (
  <button
    type="button"
    role="switch"
    aria-checked={isDark}
    onClick={onToggle}
    className="relative w-12 h-7 rounded-full p-0.5 hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200"
    style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}
    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    <div
      className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center"
      style={{
        transform: `translateX(${isDark ? 20 : 0}px)`,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {isDark ? <Moon size={11} className="text-gray-600" /> : <Sun size={11} className="text-amber-500" />}
    </div>
  </button>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const isDev = import.meta.env.DEV;

const BrandIntake: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const config = useStore($brandConfig);

  // Local UI state
  const [activeTab, setActiveTab] = useState<TabId>('color');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('dashboard');

  // Scroll preservation per tab
  const scrollRefs = useRef<Record<TabId, number>>({ color: 0, typography: 0, style: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTabChange = useCallback((tab: TabId) => {
    // Save current scroll position
    if (scrollContainerRef.current) {
      scrollRefs.current[activeTab] = scrollContainerRef.current.scrollTop;
    }
    setActiveTab(tab);
    // Restore scroll position for new tab
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollRefs.current[tab] || 0;
      }
    });
  }, [activeTab]);

  // Generate design tokens as CSS custom properties
  const { tokens: designTokens } = useMemo(
    () => generateDesignTokens(config, isDarkMode),
    [config, isDarkMode]
  );

  // Bridge: BrandConfig → PlaygroundConfig
  const playgroundConfig: PlaygroundConfig = {
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor || '#8B5CF6',
    saturation: 100,
    lightness: 100,
    fontFamily: config.primaryFont,
    roundness: config.roundness === 'subtle' ? 'rounded' : config.roundness,
    density: config.density,
    expressiveness: config.expressiveness,
    shadows: config.shadows,
    isDarkMode,
  };

  const handlePlaygroundChange = useCallback((updates: Partial<PlaygroundConfig>) => {
    const brandUpdates: Record<string, unknown> = {};
    if (updates.primaryColor !== undefined) brandUpdates.primaryColor = updates.primaryColor;
    if (updates.secondaryColor !== undefined) {
      brandUpdates.secondaryColor = updates.secondaryColor;
      brandUpdates.useCustomSecondary = true;
    }
    // playground saturation is a different concept (scales base chroma); don't map to chromaFalloff

    if (updates.fontFamily !== undefined) {
      brandUpdates.primaryFont = updates.fontFamily;
    }
    if (updates.roundness !== undefined) brandUpdates.roundness = updates.roundness;
    if (updates.density !== undefined) brandUpdates.density = updates.density;
    if (updates.expressiveness !== undefined) brandUpdates.expressiveness = updates.expressiveness;
    if (updates.shadows !== undefined) brandUpdates.shadows = updates.shadows;
    if (updates.isDarkMode !== undefined) setIsDarkMode(updates.isDarkMode);

    if (Object.keys(brandUpdates).length > 0) updateConfig(brandUpdates);
  }, []);

  // Open/close handlers
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      document.body.classList.add('modal-open');
      (window as any).lenis?.stop();
    };
    window.addEventListener('openBrandIntake', handleOpen);
    return () => window.removeEventListener('openBrandIntake', handleOpen);
  }, []);

  useEffect(() => {
    return () => {
      if (isOpen) (window as any).lenis?.start();
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    document.body.classList.remove('modal-open');
    (window as any).lenis?.start();
  };

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed z-50 inset-0 flex flex-col bg-white overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 1, ease: [0.32, 0.72, 0, 1] }}
          data-lenis-prevent="true"
        >
          {/* Header */}
          <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-charcoal/5 shrink-0">
            <div className="flex items-center gap-3">
              <img src={siteImages.logoIcon} alt="Trellis" className="w-7 h-7" />
              {isDev && (
                <button
                  type="button"
                  onClick={() => { if (confirm('Reset all config?')) resetConfig(); }}
                  className="text-[10px] font-mono text-red-500/60 hover:text-red-500 transition-colors cursor-pointer"
                >
                  [DEV] Reset
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 cursor-pointer flex items-center justify-center rounded-lg bg-gray transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          {/* Two-panel layout */}
          <div className="flex flex-col md:flex-row flex-1 min-h-0">
            {/* Left Panel — Configuration */}
            <aside className="w-full md:w-[400px] shrink-0 flex flex-col border-r border-charcoal/5 min-h-0 md:max-h-full max-h-[50vh]">
              <BrandHeader />
              <LayoutGroup>
                <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
              </LayoutGroup>

              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-6 py-5 min-h-0"
                role="tabpanel"
                id={`theme-tab-panel-${activeTab}`}
                aria-labelledby={`theme-tab-${activeTab}`}
              >
                {activeTab === 'color' && <TabColor />}
                {activeTab === 'typography' && <TabTypography />}
                {activeTab === 'style' && <TabStyle />}
              </div>

              {/* Sticky download button */}
              <div className="shrink-0 px-4 py-3 border-t border-charcoal/5 bg-white">
                <button
                  type="button"
                  onClick={() => {
                    // No-op for now — export pipeline not yet built
                  }}
                  className="w-full btn btn-primary flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Download tokens
                </button>
              </div>
            </aside>

            {/* Right Panel — Live Preview */}
            <main className="flex-1 flex flex-col min-h-0 bg-gray overflow-hidden">
              <div className="flex items-center justify-between px-4 md:px-6 py-3 shrink-0">
                <PreviewTabBar active={previewTab} onChange={setPreviewTab} />
                <DarkModeToggle
                  isDark={isDarkMode}
                  onToggle={() => setIsDarkMode(!isDarkMode)}
                />
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto px-3 md:px-5 pb-4">
                <div className="rounded-2xl overflow-hidden shadow-sm h-full min-h-[500px]" style={designTokens as React.CSSProperties}>
                  {previewTab === 'dashboard' ? (
                    <PlaygroundDashboard
                      config={playgroundConfig}
                      onChange={handlePlaygroundChange}
                    />
                  ) : (
                    <div
                      className="h-full flex items-center justify-center"
                      style={{
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        color: isDarkMode ? '#94a3b8' : '#64748b',
                        fontFamily: `'${config.primaryFont}', system-ui, sans-serif`,
                      }}
                    >
                      <p className="text-sm">Component sampler coming soon</p>
                    </div>
                  )}
                </div>
              </div>
            </main>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BrandIntake;
