import React, { useState, useRef, useCallback } from 'react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { Sun, Moon, Upload } from 'lucide-react';

import { $brandConfig, updateConfig, resetConfig, type TabId } from '../BrandIntake/store';
import TabBar from '../BrandIntake/TabBar';
import TabColor from '../BrandIntake/TabColor';
import TabTypography from '../BrandIntake/TabTypography';
import TabStyle from '../BrandIntake/TabStyle';
import PlaygroundDashboard from '../LivePlayground/PlaygroundDashboard';
import type { PlaygroundConfig } from '../LivePlayground/types';
import { AnimatedCTA } from '../AnimatedCTA';

// ---------------------------------------------------------------------------
// Preview tab bar (Dashboard / Components)
// ---------------------------------------------------------------------------

type PreviewTab = 'dashboard' | 'components';

const PreviewTabBar: React.FC<{ active: PreviewTab; onChange: (t: PreviewTab) => void }> = ({ active, onChange }) => (
  <div className="flex gap-1 bg-charcoal/5 rounded-lg p-0.5">
    {(['dashboard', 'components'] as const).map((tab) => (
      <button
        key={tab}
        onClick={() => onChange(tab)}
        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer capitalize ${
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
  <div className="md:hidden sticky top-0 z-10 bg-white border-b border-charcoal/5 px-4 py-2">
    <div className="flex gap-1 bg-charcoal/5 rounded-lg p-0.5">
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

const isDev = import.meta.env.DEV;

const Configurator: React.FC = () => {
  const config = useStore($brandConfig);

  // Local UI state
  const [activeTab, setActiveTab] = useState<TabId>(config.activeTab || 'color');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [previewTab, setPreviewTab] = useState<PreviewTab>('dashboard');
  const [mobileSegment, setMobileSegment] = useState<MobileSegment>('configure');

  // Scroll preservation per tab
  const scrollRefs = useRef<Record<TabId, number>>({ color: 0, typography: 0, style: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTabChange = useCallback((tab: TabId) => {
    // Save current scroll position
    if (scrollContainerRef.current) {
      scrollRefs.current[activeTab] = scrollContainerRef.current.scrollTop;
    }
    setActiveTab(tab);
    updateConfig({ activeTab: tab });
    // Restore scroll position for new tab
    requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollRefs.current[tab] || 0;
      }
    });
  }, [activeTab]);

  // Bridge: BrandConfig → PlaygroundConfig
  const playgroundConfig: PlaygroundConfig = {
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor || '#8B5CF6',
    saturation: config.saturation,
    lightness: config.uniformity,
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
    if (updates.saturation !== undefined) brandUpdates.saturation = updates.saturation;
    if (updates.lightness !== undefined) brandUpdates.uniformity = updates.lightness;
    if (updates.fontFamily !== undefined) {
      brandUpdates.primaryFont = updates.fontFamily;
      if (config.useSingleTypeface) brandUpdates.headingFont = updates.fontFamily;
    }
    if (updates.roundness !== undefined) brandUpdates.roundness = updates.roundness;
    if (updates.density !== undefined) brandUpdates.density = updates.density;
    if (updates.expressiveness !== undefined) brandUpdates.expressiveness = updates.expressiveness;
    if (updates.shadows !== undefined) brandUpdates.shadows = updates.shadows;
    if (updates.isDarkMode !== undefined) setIsDarkMode(updates.isDarkMode);

    if (Object.keys(brandUpdates).length > 0) updateConfig(brandUpdates);
  }, [config.useSingleTypeface]);

  return (
    <div className="flex flex-col h-full" data-lenis-prevent="true">
      {/* Mobile segmented controller */}
      <MobileSegmentedController active={mobileSegment} onChange={setMobileSegment} />

      {/* Two-panel layout */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0 bg-gray">
        {/* Left Panel — Configuration */}
        <aside className={`w-full md:w-[400px] shrink-0 flex flex-col min-h-0 md:p-4 md:pr-0 ${
          mobileSegment === 'preview' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="flex flex-col flex-1 min-h-0 bg-white md:rounded-3xl overflow-hidden pt-2">
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

          </div>
        </aside>

        {/* Right Panel — Live Preview */}
        <main className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
          mobileSegment === 'configure' ? 'hidden md:flex' : 'flex'
        }`}>
          <div className="flex items-center justify-between px-4 md:px-8 py-4 shrink-0">
            <PreviewTabBar active={previewTab} onChange={setPreviewTab} />
            <div className="flex items-center gap-2">
              <DarkModeToggle
                isDark={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />
              {isDev && (
                <button
                  onClick={() => { if (confirm('Reset all config?')) resetConfig(); }}
                  className="text-[10px] font-mono text-red-500/60 hover:text-red-500 transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-red-500/5"
                >
                  Reset
                </button>
              )}
              <button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={() => {}}>
                <Upload size={13} />
                Export
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-8 pb-4">
            <div className="rounded-2xl overflow-hidden shadow-sm h-full min-h-[500px]">
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
    </div>
  );
};

export default Configurator;
