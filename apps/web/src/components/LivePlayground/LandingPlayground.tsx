import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';

import { $brandConfig, FONT_WEIGHT_OPTIONS, type TabId } from '../BrandIntake/store';
import TabBar from '../BrandIntake/TabBar';
import TabColor from '../BrandIntake/TabColor';
import TabTypography from '../BrandIntake/TabTypography';
import TabStyle from '../BrandIntake/TabStyle';
import PreviewComponents from '../ComponentSampler';
import { generateDesignTokens } from '../../utils/generateTokens';

const DarkModeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({ isDark, onToggle }) => (
  <button
    onClick={onToggle}
    className="relative w-14 h-8 rounded-full p-1 hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200"
    style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}
    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    <div
      className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center"
      style={{
        transform: `translateX(${isDark ? 24 : 0}px)`,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {isDark ? <Moon size={12} className="text-gray-600" /> : <Sun size={12} className="text-amber-500" />}
    </div>
  </button>
);

const LandingPlayground: React.FC = () => {
  const config = useStore($brandConfig);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('color');

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

  const { tokens: designTokens } = useMemo(
    () => generateDesignTokens(config, isDarkMode),
    [config, isDarkMode]
  );

  return (
    <div className="flex flex-col items-center" data-step-animate-children="ignore">
      {/* Dark Mode Toggle - above container */}
      <div className="relative rounded-2xl bg-gray/70 pt-3 pb-8 px-4 -mb-6 max-w-xs mx-auto flex-row justify-between items-center self-center w-full hidden md:flex z-0">
        <p className="text-xs">Dark mode included</p>
        <DarkModeToggle isDark={isDarkMode} onToggle={() => setIsDarkMode(!isDarkMode)} />
      </div>

      {/* Main Container */}
      <div
        className="w-full bg-gray rounded-4xl overflow-hidden flex flex-col lg:flex-row p-3 md:p-4 gap-3 md:gap-4 relative z-10"
        style={{ height: 'min(820px, 85vh)', minHeight: '560px' }}
      >
        {/* Component Sampler */}
        <div
          className="flex-1 min-w-0 rounded-3xl border-2 border-white shadow-sm overflow-hidden relative"
          style={designTokens as React.CSSProperties}
        >
          <PreviewComponents />
        </div>

        {/* Configuration Panel — compressed Configurator tabs */}
        <div className="shrink-0 bg-white rounded-3xl overflow-hidden order-first lg:order-last w-full lg:w-[340px] flex flex-col min-h-0">
          <LayoutGroup id="landing-playground-tabs">
            <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
          </LayoutGroup>
          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
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
      </div>
    </div>
  );
};

export default LandingPlayground;
