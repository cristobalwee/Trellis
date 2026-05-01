import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { Sun, Moon, PanelLeftClose, PanelLeftOpen, MousePointerClick } from 'lucide-react';

import { $brandConfig, updateConfig, FONT_WEIGHT_OPTIONS, type TabId } from '../BrandIntake/store';
import TabBar from '../BrandIntake/TabBar';
import TabColor from '../BrandIntake/TabColor';
import TabTypography from '../BrandIntake/TabTypography';
import TabStyle from '../BrandIntake/TabStyle';
import PlaygroundDashboard from '../LivePlayground/PlaygroundDashboard';
import PreviewTypography from '../LivePlayground/PreviewTypography';
import PreviewComponents from '../ComponentSampler';
import type { PlaygroundConfig } from '../LivePlayground/types';
import { generateDesignTokens } from '../../utils/generateTokens';
import { Tooltip } from '../ui/Tooltip';
import InspectOverlay from './InspectOverlay';
import ExportDialog from './ExportDialog';
import logoIcon from '../../assets/logo_icon.svg';

// ---------------------------------------------------------------------------
// Preview tab bar (Dashboard / Components)
// ---------------------------------------------------------------------------

type PreviewTab = 'dashboard' | 'components' | 'blog';

const PreviewTabBar: React.FC<{ active: PreviewTab; onChange: (t: PreviewTab) => void }> = ({ active, onChange }) => (
  <div className="flex gap-1 bg-charcoal/5 rounded-lg p-0.5 w-full md:w-auto justify-between md:justify-start">
    {(['dashboard', 'components', 'blog'] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`px-3 py-1.5 text-xs font-medium w-full md:w-auto rounded-md transition-all cursor-pointer capitalize ${
          active === tab
            ? 'bg-white text-charcoal shadow-sm'
            : 'text-charcoal/80 hover:text-charcoal'
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
    onClick={onToggle}
    className="relative w-12 h-7 rounded-full p-0.5 hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200"
    style={{ backgroundColor: isDark ? '#374151' : '#d7d9dc' }}
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
// Mobile segmented controller
// ---------------------------------------------------------------------------

type MobileSegment = 'configure' | 'preview';

const MobileSegmentedController: React.FC<{
  active: MobileSegment;
  onChange: (v: MobileSegment) => void;
}> = ({ active, onChange }) => (
  <div className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-charcoal/5 bg-white/95 px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.08)] backdrop-blur">
    <div className="mx-auto flex max-w-md gap-1 rounded-lg bg-charcoal/5 p-0.5">
      {(['configure', 'preview'] as const).map((segment) => (
        <button
          key={segment}
          onClick={() => onChange(segment)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all cursor-pointer capitalize ${
            active === segment
              ? 'bg-white text-charcoal shadow-sm'
              : 'text-charcoal/50 hover:text-charcoal/80'
          }`}
        >
          {segment}
        </button>
      ))}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main Configurator component
// ---------------------------------------------------------------------------

const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  );
  React.useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isDesktop;
};

const Configurator: React.FC = () => {
  const config = useStore($brandConfig);
  const isDesktop = useIsDesktop();

  // Local UI state
  const [activeTab, setActiveTab] = useState<TabId>('color');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('dashboard');
  const [mobileSegment, setMobileSegment] = useState<MobileSegment>('configure');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);

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

  // Load Google Fonts for both body and heading typefaces
  useEffect(() => {
    const weightsQuery = `wght@${FONT_WEIGHT_OPTIONS.join(';')}`;
    for (const [family, role] of [[config.headingFont, 'heading'], [config.primaryFont, 'body']] as const) {
      const id = `playground-font-${role}-${family.replace(/\s+/g, '+')}`;
      if (document.getElementById(id)) continue;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:${weightsQuery}&display=swap`;
      document.head.appendChild(link);
    }
  }, [config.primaryFont, config.headingFont]);

  // Generate design tokens as CSS custom properties
  const { tokens: designTokens, semanticMap } = useMemo(
    () => generateDesignTokens(config, isDarkMode),
    [config, isDarkMode]
  );

  // Generate paired light + dark token sets for export (always both, regardless of preview mode)
  const exportTokenSet = useMemo(() => ({
    light: generateDesignTokens(config, false).tokens,
    dark: generateDesignTokens(config, true).tokens,
  }), [config]);

  // Bridge: BrandConfig → PlaygroundConfig (kept for font-loading side effect)
  const playgroundConfig: PlaygroundConfig = {
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor || '#8B5CF6',
    saturation: 100,
    lightness: 100,
    fontFamily: config.primaryFont,
    roundness: config.roundness,
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

  return (
    <div className="flex min-h-dvh flex-col md:h-full md:min-h-0" data-lenis-prevent="true">
      {/* Two-panel layout */}
      <div className="flex flex-1 flex-col bg-gray pb-[calc(4rem+env(safe-area-inset-bottom))] md:min-h-0 md:flex-row md:pb-0">
        {/* Left Panel — Configuration */}
        <motion.aside
          animate={isDesktop ? { width: isCollapsed ? 72 : 360 } : undefined}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className={`shrink-0 flex flex-col min-h-0 md:p-4 md:pr-0 ${
            mobileSegment === 'preview' ? 'hidden md:flex' : 'flex'
          } ${isCollapsed && isDesktop ? '' : 'w-full md:w-[360px]'}`}
        >
          <div className="relative flex flex-col flex-1 min-h-0 bg-white md:rounded-3xl overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              {isCollapsed ? (
                /* ── Collapsed sidebar ── */
                <motion.div
                  key="collapsed"
                  className="flex flex-col items-center gap-4 pt-6 pb-4 px-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.25 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  <Tooltip label="Back to home page" side="right">
                    <a href="/" className="hover:opacity-70 transition-opacity">
                      <img src={logoIcon.src} alt="Trellis" className="w-5 h-5" />
                    </a>
                  </Tooltip>

                  <Tooltip label="Expand" side="right">
                    <button
                      onClick={() => setIsCollapsed(false)}
                      className="text-charcoal/40 hover:text-charcoal/70 transition-colors cursor-pointer"
                      aria-label="Expand sidebar"
                    >
                      <PanelLeftOpen size={18} />
                    </button>
                  </Tooltip>

                  <div className="w-6 h-px bg-charcoal/10" />

                  {/* Color swatches */}
                  {([
                    ['Primary', config.primaryColor],
                    ['Secondary', config.secondaryColor || config.primaryRamp?.[500] || '#8B5CF6'],
                    ['Neutral', config.neutralRamp?.[500] || '#94a3b8'],
                  ] as const).map(([name, value]) => (
                    <Tooltip key={name} label={`${name}: ${value}`} side="right">
                      <button
                        className="w-6 h-6 rounded-md border border-charcoal/10 shadow-sm cursor-default transition-transform hover:scale-110"
                        style={{ backgroundColor: value }}
                        aria-label={`${name}: ${value}`}
                      />
                    </Tooltip>
                  ))}
                </motion.div>
              ) : (
                /* ── Expanded sidebar ── */
                <motion.div
                  key="expanded"
                  className="flex flex-col flex-1 min-h-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.25 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                >
                  {/* Header: logo + collapse */}
                  <div className="flex items-center justify-between shrink-0 p-6">
                    <Tooltip label="Back to home page" side="bottom">
                      <a href="/" className="hover:opacity-70 transition-opacity">
                        <img src={logoIcon.src} alt="Trellis" className="w-7 h-7" />
                      </a>
                    </Tooltip>
                    <button
                      onClick={() => setIsCollapsed(true)}
                      className="hidden md:block text-charcoal/40 hover:text-charcoal/70 transition-colors cursor-pointer"
                      aria-label="Collapse sidebar"
                    >
                      <PanelLeftClose size={18} />
                    </button>
                  </div>

                  <LayoutGroup>
                    <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
                  </LayoutGroup>

                  <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto px-6 py-5 min-h-0"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                      >
                        {activeTab === 'color' && <TabColor />}
                        {activeTab === 'typography' && <TabTypography />}
                        {activeTab === 'style' && <TabStyle />}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>

        {/* Right Panel — Live Preview */}
        <main className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
          mobileSegment === 'configure' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-8 py-4 shrink-0">
            <PreviewTabBar active={previewTab} onChange={setPreviewTab} />
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
              <DarkModeToggle
                isDark={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInspecting(!isInspecting)}
                  className={`flex items-center gap-1.5 text-xs font-medium border px-4 py-3 rounded-full active:scale-95  hover:scale-105 transition-all duration-250 cursor-pointer ${
                    isInspecting
                      ? 'border-forest-green/50 bg-forest-green/10 text-forest-green'
                      : 'border-transparent text-charcoal/80 hover:text-charcoal hover:bg-forest-green/10'
                  }`}
                >
                  <MousePointerClick size={13} />
                  Inspect{isInspecting && ': On'}
                </button>
                <ExportDialog tokens={exportTokenSet} config={config} />
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 md:px-8">
            <div ref={previewContainerRef} className="relative rounded-3xl border-2 border-white overflow-hidden shadow-sm h-full min-h-[500px] max-w-[1600px] mx-auto max-h-[1200px]" style={designTokens as React.CSSProperties}>
              {previewTab === 'dashboard' && (
                <PlaygroundDashboard
                  config={playgroundConfig}
                  onChange={handlePlaygroundChange}
                />
              )}
              {previewTab === 'components' && <PreviewComponents />}
              {previewTab === 'blog' && (
                <PreviewTypography
                  fontScale={config.fontScale}
                  headingFont={config.headingFont}
                  bodyFont={config.primaryFont}
                />
              )}
              <InspectOverlay
                isActive={isInspecting && (previewTab === 'dashboard' || previewTab === 'components' || previewTab === 'blog')}
                containerRef={previewContainerRef}
                isDarkMode={isDarkMode}
                semanticMap={semanticMap}
              />
            </div>
          </div>
        </main>
      </div>
      {/* Mobile segmented controller */}
      <MobileSegmentedController active={mobileSegment} onChange={setMobileSegment} />
    </div>
  );
};

export default Configurator;
