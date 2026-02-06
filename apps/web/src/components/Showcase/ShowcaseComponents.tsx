import React, { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  Sun, Moon, User, Calendar,
  FileJson, FileImage, Folder, Layers
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
  <button
    onClick={onToggle}
    className="relative w-14 h-8 rounded-full p-1 hover:scale-105 active:scale-95"
    style={{
      backgroundColor: isDark ? '#374151' : '#e5e7eb',
      transition: 'background-color 0.3s ease, transform 0.15s ease'
    }}
  >
    <div
      className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center"
      style={{
        transform: `translateX(${isDark ? 24 : 0}px)`,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {isDark ? <Moon size={12} className="text-gray-600" /> : <Sun size={12} className="text-amber-500" />}
    </div>
  </button>
);

const Artifact: React.FC<{ icon: React.ReactNode; label: string; sublabel: string; colors: any }> = ({
  icon, label, sublabel, colors
}) => (
  <div
    className="flex flex-col items-center justify-center gap-3 p-3 rounded-xl border border-dashed hover:scale-[1.02]"
    style={{
      borderColor: colors.border,
      backgroundColor: colors.surface,
      transition: 'background-color 0.4s ease, border-color 0.4s ease, transform 0.2s ease'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = colors.surfaceHover;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = colors.surface;
    }}
  >
    <div
      className="p-2 rounded-lg"
      style={{
        backgroundColor: colors.bg,
        color: colors.primary,
        transition: 'background-color 0.4s ease, color 0.4s ease'
      }}
    >
      {icon}
    </div>
    <div className="flex flex-col items-center justify-center">
      <span className="text-xs font-semibold" style={{ color: colors.text }}>{label}</span>
      <span className="text-[10px]" style={{ color: colors.textMuted }}>{sublabel}</span>
    </div>
  </div>
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

  return (
    <>
      <div className="rounded-2xl bg-gray pt-3 pb-8 px-4 -mb-6 max-w-xs mx-auto flex flex-row justify-between items-center self-center">
        <p className='text-xs'>Dark mode included</p>
        <DarkModeToggle
          isDark={config.isDarkMode}
          onToggle={() => updateShowcase({ isDarkMode: !config.isDarkMode })}
        />
      </div>
      <div
        className="bg-white rounded-3xl p-6 md:p-8 shadow-lg relative border border-charcoal/5 h-full flex flex-col"
        style={{
          backgroundColor: colors.bg,
          fontFamily: SHOWCASE_FONT,
          transition: 'background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
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
              colors={colors}
            />
            <Artifact
              icon={<FileImage size={18} />}
              label="base.fig"
              sublabel="Figma Library"
              colors={colors}
            />
            <Artifact
              icon={<Folder size={18} />}
              label="docs/"
              sublabel="Documentation"
              colors={colors}
            />
            <Artifact
              icon={<Layers size={18} />}
              label="components/"
              sublabel="React Source"
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
          <div
            className="p-5 flex flex-col justify-between border"
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              borderRadius: radiuses.card,
              transition: 'background-color 0.4s ease, border-color 0.4s ease, border-radius 0.4s ease'
            }}
          >
            <div className="space-y-3">
              <button
                className="w-full py-2.5 px-4 text-white text-sm font-medium shadow-sm hover:brightness-110 active:brightness-95"
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: radiuses.button,
                  transition: 'background-color 0.4s ease, border-radius 0.4s ease, filter 0.15s ease'
                }}
              >
                Primary Action
              </button>
              <button
                className="w-full py-2.5 px-4 text-sm font-medium border hover:bg-black/5"
                style={{
                  color: colors.primary,
                  borderColor: colors.primary,
                  borderRadius: radiuses.button,
                  backgroundColor: 'transparent',
                  transition: 'color 0.4s ease, border-color 0.4s ease, border-radius 0.4s ease, background-color 0.15s ease'
                }}
              >
                Secondary Action
              </button>
              <button
                className="w-full py-2.5 px-4 text-sm font-medium"
                style={{
                  color: colors.textMuted,
                  borderRadius: radiuses.button,
                  backgroundColor: 'transparent',
                  transition: 'color 0.4s ease, border-radius 0.4s ease, background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.surfaceHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Ghost Action
              </button>
            </div>
            <div
              className="p-2 border flex items-center gap-3 cursor-pointer"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
                borderRadius: radiuses.input,
                transition: 'background-color 0.4s ease, border-color 0.2s ease, border-radius 0.4s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              <Calendar size={14} style={{ color: colors.textMuted }} />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold" style={{ color: colors.textMuted }}>Date</span>
                <span className="text-xs font-medium" style={{ color: colors.text }}>Feb 2, 2026</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Toggles */}
              <div className="flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-medium" style={{ color: colors.text }}>Notifications</span>
                  <span className="text-[10px]" style={{ color: colors.textMuted }}>Push alerts</span>
                </div>
                <button
                  onClick={() => setState((s) => ({ ...s, toggleValue: !s.toggleValue }))}
                  className="relative w-10 h-6 rounded-full p-0.5"
                  style={{
                    backgroundColor: state.toggleValue ? colors.primary : colors.border,
                    transition: 'background-color 0.3s ease'
                  }}
                >
                  <div
                    className="w-5 h-5 rounded-full bg-white shadow-sm"
                    style={{
                      transform: `translateX(${state.toggleValue ? 16 : 0}px)`,
                      transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                </button>
              </div>
            </div>
          </div>

          <div
            className="p-4 border h-full flex flex-col gap-3 hover:scale-[1.02]"
            style={{
              backgroundColor: colors.bg,
              borderColor: colors.border,
              borderRadius: radiuses.card,
              transition: 'background-color 0.4s ease, border-color 0.4s ease, border-radius 0.4s ease, transform 0.2s ease'
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: `${colors.primary}20`,
                  transition: 'background-color 0.4s ease'
                }}
              >
                <Layers size={20} style={{ color: colors.primary }} />
              </div>
              <span
                className="px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: colors.surfaceHover,
                  color: colors.textMuted,
                  borderRadius: radiuses.tag,
                  transition: 'background-color 0.4s ease, color 0.4s ease, border-radius 0.4s ease'
                }}
              >
                Featured
              </span>
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
                className="w-full py-2 px-3 text-sm outline-none"
                style={{
                  backgroundColor: colors.bg,
                  color: colors.text,
                  borderRadius: radiuses.input,
                  border: `1px solid ${colors.border}`,
                  transition: 'background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease, border-radius 0.4s ease'
                }}
              />
            </div>
            <div className="flex items-center gap-[-8px]">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center -ml-2 first:ml-0"
                  style={{
                    backgroundColor: i === 1 ? colors.primary : i === 2 ? colors.secondary : colors.textMuted,
                    transition: 'background-color 0.4s ease'
                  }}
                >
                  <User size={12} className="text-white" />
                </div>
              ))}
              <span className="text-[10px] ml-2 font-medium" style={{ color: colors.textMuted }}>+4</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShowcaseComponents;
