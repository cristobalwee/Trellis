import React, { useState } from 'react';
import { Sun, Moon, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import PlaygroundDashboard from './PlaygroundDashboard';
import PlaygroundControls from './PlaygroundControls';
import type { LivePlaygroundProps } from './types';

const DarkModeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({
  isDark,
  onToggle,
}) => (
  <button
    onClick={onToggle}
    className="relative w-14 h-8 rounded-full p-1 hover:scale-105 active:scale-95 cursor-pointer transition-all duration-200"
    style={{
      backgroundColor: isDark ? '#374151' : '#e5e7eb',
    }}
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

const LivePlayground: React.FC<LivePlaygroundProps> = ({ 
  config, 
  onChange, 
  compact = false,
  showExternalDarkModeToggle = true,
  collapsibleControls = false,
  defaultControlsOpen = true
}) => {
  const [isControlsOpen, setIsControlsOpen] = useState(defaultControlsOpen);

  return (
    <div className="flex flex-col items-center">
      {/* Dark Mode Toggle - above container */}
      {showExternalDarkModeToggle && (
        <div className="rounded-2xl bg-gray/70 pt-3 pb-8 px-4 -mb-6 max-w-xs mx-auto flex flex-row justify-between items-center self-center w-full">
          <p className="text-xs">Dark mode included</p>
          <DarkModeToggle
            isDark={config.isDarkMode}
            onToggle={() => onChange({ isDarkMode: !config.isDarkMode })}
          />
        </div>
      )}

      {/* Main Container */}
      <div
        className={`w-full bg-gray rounded-4xl overflow-hidden flex flex-col lg:flex-row p-3 md:p-4 gap-3 md:gap-4 relative ${
          compact ? 'max-h-[650px]' : ''
        }`}
        style={{ minHeight: compact ? '420px' : '520px' }}
      >
        {/* Quick Edit Button */}
        {collapsibleControls && !isControlsOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsControlsOpen(true)}
              className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-charcoal shadow-lg border border-charcoal/10 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-bold z-10 hover:bg-white transition-colors cursor-pointer"
            >
              <Settings2 size={16} />
              <span>Quick Edit</span>
            </motion.button>
          )}
        {/* Dashboard Preview */}
        <div className="flex-1 min-w-0 rounded-3xl shadow-sm overflow-hidden relative">
          <PlaygroundDashboard config={config} onChange={onChange} />
        </div>

        {/* Configuration Panel */}
        {collapsibleControls ? (
          <motion.div
            className="absolute top-4 right-4 bottom-4 w-[320px] bg-white rounded-3xl shadow-2xl z-20 overflow-hidden"
            initial={false}
            animate={{
              x: isControlsOpen ? 0 : '120%',
              opacity: isControlsOpen ? 1 : 0,
              pointerEvents: isControlsOpen ? 'auto' : 'none'
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
             <PlaygroundControls 
               config={config} 
               onChange={onChange}
               onClose={() => setIsControlsOpen(false)}
               showDarkModeToggle={!showExternalDarkModeToggle}
             />
          </motion.div>
        ) : (
          <div
            className="shrink-0 bg-white rounded-3xl overflow-y-auto order-first md:order-last min-w-[300px]"
          >
            <PlaygroundControls 
              config={config} 
              onChange={onChange} 
              showDarkModeToggle={!showExternalDarkModeToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePlayground;
