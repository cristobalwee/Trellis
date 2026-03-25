import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Type, Sparkles } from 'lucide-react';
import type { TabId } from './store';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'color', label: 'Color', icon: <Palette size={15} /> },
  { id: 'typography', label: 'Typography', icon: <Type size={15} /> },
  { id: 'style', label: 'Style', icon: <Sparkles size={15} /> },
];

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => (
  <div className="flex border-b border-charcoal/10 mx-auto shrink-0 w-full px-6 md:w-auto md:px-0">
    {TABS.map((tab) => {
      const isActive = tab.id === activeTab;
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
            isActive ? 'text-charcoal' : 'text-charcoal/70 hover:text-charcoal'
          }`}
        >
          {tab.icon}
          {tab.label}
          {isActive && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-forest-green rounded-full"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      );
    })}
  </div>
);

export default TabBar;
