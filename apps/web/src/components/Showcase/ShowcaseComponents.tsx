import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '@nanostores/react';
import { 
  Sun, Moon, User, Calendar, Check, 
  FileJson, FileImage, Folder, Layers, Download
} from 'lucide-react';
import { generateRamp } from './colorUtils';
import { $showcaseConfig, updateShowcase } from './store';

const SHOWCASE_FONT = 'Inter, system-ui, sans-serif';

interface ShowcaseState {
  sliderValue: number;
  toggleValue: boolean;
  inputValue: string;
}

const DarkModeToggle: React.FC<{ isDark: boolean; onToggle: () => void }> = ({
  isDark,
  onToggle,
}) => (
  <motion.button
    onClick={onToggle}
    className="relative w-14 h-8 rounded-full p-1 transition-colors duration-300"
    style={{ backgroundColor: isDark ? '#374151' : '#e5e7eb' }}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    <motion.div
      className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center"
      animate={{ x: isDark ? 24 : 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {isDark ? <Moon size={12} className="text-gray-600" /> : <Sun size={12} className="text-amber-500" />}
    </motion.div>
  </motion.button>
);

const Artifact: React.FC<{ icon: React.ReactNode; label: string; sublabel: string; delay: number; colors: any }> = ({ 
  icon, label, sublabel, delay, colors 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex flex-col items-center justify-center gap-3 p-3 rounded-xl border border-dashed transition-colors"
    style={{ 
      borderColor: colors.border,
      backgroundColor: colors.surface 
    }}
    whileHover={{ scale: 1.02, backgroundColor: colors.surfaceHover }}
  >
    <div 
      className="p-2 rounded-lg"
      style={{ backgroundColor: colors.bg, color: colors.primary }}
    >
      {icon}
    </div>
    <div className="flex flex-col items-center justify-center">
      <span className="text-xs font-semibold" style={{ color: colors.text }}>{label}</span>
      <span className="text-[10px]" style={{ color: colors.textMuted }}>{sublabel}</span>
    </div>
  </motion.div>
);

const ShowcaseComponents: React.FC = () => {
  const config = useStore($showcaseConfig);
  const [state, setState] = useState<ShowcaseState>({
    sliderValue: 65,
    toggleValue: true,
    inputValue: '',
  });

  const primaryRamp = useMemo(() => generateRamp(config.primaryColor), [config.primaryColor]);
  const secondaryRamp = useMemo(() => generateRamp(config.secondaryColor), [config.secondaryColor]);

  // Dynamic colors based on mode
  const colors = useMemo(() => {
    const isDark = config.isDarkMode;
    return {
      bg: isDark ? '#0f172a' : '#ffffff',
      surface: isDark ? '#1e293b' : '#f8fafc',
      surfaceHover: isDark ? '#334155' : '#f1f5f9',
      border: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
      text: isDark ? '#f8fafc' : '#0f172a',
      textMuted: isDark ? 'rgba(248,250,252,0.6)' : 'rgba(15,23,42,0.6)',
      primary: isDark ? primaryRamp[400] : primaryRamp[500],
      primaryHover: isDark ? primaryRamp[300] : primaryRamp[600],
      secondary: isDark ? secondaryRamp[400] : secondaryRamp[500],
    };
  }, [config.isDarkMode, primaryRamp, secondaryRamp]);

  // Dynamic border radius based on config
  const radiuses = useMemo(() => {
    switch (config.roundness) {
      case 'sharp':
        return {
          container: '4px',
          button: '2px',
          input: '2px',
          tag: '2px',
          card: '2px',
        };
      case 'pill':
        return {
          container: '24px',
          button: '9999px',
          input: '16px',
          tag: '9999px',
          card: '24px',
        };
      case 'rounded':
      default:
        return {
          container: '16px',
          button: '8px',
          input: '8px',
          tag: '9999px',
          card: '12px',
        };
    }
  }, [config.roundness]);

  // Dynamic styles based on expressiveness
  const styles = useMemo(() => {
    const isMinimal = config.expressiveness === 'minimal';
    const isExpressive = config.expressiveness === 'expressive';
    
    return {
      shadow: isMinimal ? 'none' : isExpressive ? '0 10px 30px -10px rgba(0,0,0,0.15)' : '0 4px 6px -1px rgba(0,0,0,0.1)',
      borderWidth: isMinimal ? '1px' : '1px',
      scaleHover: isExpressive ? 1.05 : 1.02,
      scaleTap: isExpressive ? 0.95 : 0.98,
    };
  }, [config.expressiveness]);

  return (
    <>
      <div className="rounded-2xl bg-gray pt-3 pb-8 px-4 -mb-6 max-w-xs mx-auto flex flex-row justify-between items-center self-center">
        <p className='text-xs'>Dark mode included</p>
        <DarkModeToggle
          isDark={config.isDarkMode}
          onToggle={() => updateShowcase({ isDarkMode: !config.isDarkMode })}
        />
      </div>
      <motion.div
        className="bg-white rounded-3xl p-4 md:p-8 shadow-lg relative border border-charcoal/5 h-full flex flex-col"
        style={{ backgroundColor: colors.bg, fontFamily: SHOWCASE_FONT }}
        animate={{ backgroundColor: colors.bg }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Deliverables Section */}
        <div className="mb-8">
          <div 
            className="text-[12px] text-charcoal/70 mb-4 flex items-center gap-2"
            style={{ color: colors.textMuted }}
          >
            Deliverables
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Artifact 
              icon={<FileJson size={18} />} 
              label="tokens.json" 
              sublabel="Design Tokens"
              delay={0.1}
              colors={colors}
            />
            <Artifact 
              icon={<FileImage size={18} />} 
              label="base.fig" 
              sublabel="Figma Library"
              delay={0.2}
              colors={colors}
            />
            <Artifact 
              icon={<Folder size={18} />} 
              label="docs/" 
              sublabel="Documentation"
              delay={0.3}
              colors={colors}
            />
            <Artifact 
              icon={<Layers size={18} />} 
              label="components/" 
              sublabel="React Source"
              delay={0.4}
              colors={colors}
            />
          </div>
        </div>

        {/* Component Grid */}
        <div 
          className="text-[12px] text-charcoal/70 mb-4 flex items-center gap-2"
          style={{ color: colors.textMuted }}
        >
          Components
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 flex-1">
          {/* Card 1: Buttons & Actions */}
          <motion.div
            className="p-5 flex flex-col justify-between border"
            style={{ 
              backgroundColor: colors.bg, 
              borderColor: colors.border,
              borderRadius: radiuses.card
            }}
          >
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: styles.scaleHover }}
                whileTap={{ scale: styles.scaleTap }}
                className="w-full py-2.5 px-4 text-white text-sm font-medium transition-colors shadow-sm"
                style={{ 
                  backgroundColor: colors.primary, 
                  borderRadius: radiuses.button 
                }}
              >
                Primary Action
              </motion.button>
              <motion.button
                whileHover={{ scale: styles.scaleHover }}
                whileTap={{ scale: styles.scaleTap }}
                className="w-full py-2.5 px-4 text-sm font-medium transition-colors border"
                style={{
                  color: colors.primary,
                  borderColor: colors.primary,
                  borderRadius: radiuses.button,
                  backgroundColor: 'transparent',
                }}
              >
                Secondary Action
              </motion.button>
              <motion.button
                whileHover={{ scale: styles.scaleHover, backgroundColor: colors.surfaceHover }}
                whileTap={{ scale: styles.scaleTap }}
                className="w-full py-2.5 px-4 text-sm font-medium transition-colors"
                style={{ 
                  color: colors.textMuted, 
                  borderRadius: radiuses.button, 
                  backgroundColor: 'transparent' 
                }}
              >
                Ghost Action
              </motion.button>
            </div>
              <motion.div
                className="p-2 border flex items-center gap-3 cursor-pointer transition-colors"
                style={{ 
                  backgroundColor: colors.bg, 
                  borderColor: colors.border,
                  borderRadius: radiuses.input
                }}
                whileHover={{ borderColor: colors.primary }}
              >
                <Calendar size={14} style={{ color: colors.textMuted }} />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold" style={{ color: colors.textMuted }}>Date</span>
                  <span className="text-xs font-medium" style={{ color: colors.text }}>Feb 2, 2026</span>
                </div>
              </motion.div>

              {/* Avatars */}
              {/* <div className="flex items-center gap-[-8px]">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center -ml-2 first:ml-0"
                    style={{ backgroundColor: i === 1 ? colors.primary : i === 2 ? colors.secondary : colors.textMuted }}
                  >
                    <User size={12} className="text-white" />
                  </div>
                ))}
                <span className="text-[10px] ml-2 font-medium" style={{ color: colors.textMuted }}>+4</span>
              </div> */}
              <div className="flex flex-col gap-4">
                {/* Toggles */}
                <div className="flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium" style={{ color: colors.text }}>Notifications</span>
                    <span className="text-[10px]" style={{ color: colors.textMuted }}>Push alerts</span>
                  </div>
                  <motion.button
                    onClick={() => setState((s) => ({ ...s, toggleValue: !s.toggleValue }))}
                    className="relative w-10 h-6 rounded-full p-0.5 transition-colors"
                    style={{ backgroundColor: state.toggleValue ? colors.primary : colors.border }}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full bg-white shadow-sm"
                      animate={{ x: state.toggleValue ? 16 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="p-4 border h-full flex flex-col gap-3"
              style={{ 
                backgroundColor: colors.bg, 
                borderColor: colors.border,
                borderRadius: radiuses.card
              }}
              whileHover={{ scale: styles.scaleHover }}
            >
              <div className="flex items-start justify-between">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${colors.primary}20` }}
                >
                  <Layers size={20} style={{ color: colors.primary }} />
                </div>
                <motion.span
                  className="px-2 py-0.5 text-[10px] font-medium"
                  style={{ 
                    backgroundColor: colors.surfaceHover, 
                    color: colors.textMuted,
                    borderRadius: radiuses.tag 
                  }}
                >
                  Featured
                </motion.span>
              </div>
              
              <div>
                <div className="text-sm font-bold mb-1" style={{ color: colors.text }}>
                  System Component
                </div>
                <div className="text-xs leading-relaxed" style={{ color: colors.textMuted }}>
                  Flexible content containers that adapt to your brand's unique style and constraints.
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium" style={{ color: colors.text }}>Email Address</label>
                <input
                  type="text"
                  placeholder="name@example.com"
                  value={state.inputValue}
                  onChange={(e) => setState((s) => ({ ...s, inputValue: e.target.value }))}
                  className="w-full py-2 px-3 text-sm transition-all outline-none"
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderRadius: radiuses.input,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              </div>
              <div className="flex items-center gap-[-8px]">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center -ml-2 first:ml-0"
                    style={{ backgroundColor: i === 1 ? colors.primary : i === 2 ? colors.secondary : colors.textMuted }}
                  >
                    <User size={12} className="text-white" />
                  </div>
                ))}
                <span className="text-[10px] ml-2 font-medium" style={{ color: colors.textMuted }}>+4</span>
              </div>
            </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default ShowcaseComponents;