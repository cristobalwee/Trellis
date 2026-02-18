import React, { useMemo, useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, BarChart3,
  Settings, TrendingUp, TrendingDown, ChevronDown,
} from 'lucide-react';
import { generateRamp } from '../Showcase/colorUtils';
import type { PlaygroundConfig } from './types';

interface PlaygroundDashboardProps {
  config: PlaygroundConfig;
  onChange: (updates: Partial<PlaygroundConfig>) => void;
}

const PlaygroundDashboard: React.FC<PlaygroundDashboardProps> = ({ config, onChange }) => {
  const [activeNav, setActiveNav] = useState('dashboard');

  const primaryRamp = useMemo(
    () => generateRamp(config.primaryColor, config.saturation, 100, false, config.lightness),
    [config.primaryColor, config.saturation, config.lightness]
  );
  const secondaryRamp = useMemo(
    () => generateRamp(config.secondaryColor, config.saturation, 100, false, config.lightness),
    [config.secondaryColor, config.saturation, config.lightness]
  );

  const isDark = config.isDarkMode;

  const colors = useMemo(() => ({
    bg: isDark ? '#0f172a' : '#ffffff',
    sidebar: isDark ? '#1a2332' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#f8fafc',
    surfaceHover: isDark ? '#334155' : '#f1f5f9',
    border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    text: isDark ? '#f1f5f9' : '#0f172a',
    textMuted: isDark ? 'rgba(241,245,249,0.5)' : 'rgba(15,23,42,0.5)',
    textFaint: isDark ? 'rgba(241,245,249,0.3)' : 'rgba(15,23,42,0.25)',
    primary: isDark ? primaryRamp[400] : primaryRamp[500],
    primarySoft: isDark ? `${primaryRamp[400]}18` : `${primaryRamp[500]}12`,
    primaryHover: isDark ? primaryRamp[300] : primaryRamp[600],
    secondary: isDark ? secondaryRamp[400] : secondaryRamp[500],
    secondarySoft: isDark ? `${secondaryRamp[400]}18` : `${secondaryRamp[500]}12`,
  }), [isDark, primaryRamp, secondaryRamp]);

  const radii = useMemo(() => {
    switch (config.roundness) {
      case 'sharp': return { sm: '2px', md: '4px', lg: '6px', full: '4px' };
      case 'pill': return { sm: '9999px', md: '16px', lg: '24px', full: '9999px' };
      default: return { sm: '6px', md: '10px', lg: '14px', full: '9999px' };
    }
  }, [config.roundness]);

  const spacing = useMemo(() => {
    switch (config.density) {
      case 'compact': return { card: '12px', cell: '6px 10px', gap: '8px' };
      case 'comfortable': return { card: '24px', cell: '14px 18px', gap: '16px' };
      default: return { card: '16px', cell: '10px 14px', gap: '12px' };
    }
  }, [config.density]);

  const font = `'${config.fontFamily}', system-ui, sans-serif`;

  useEffect(() => {
    const id = `playground-font-${config.fontFamily.replace(/\s+/g, '+')}`;
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${config.fontFamily.replace(/\s+/g, '+')}:wght@400;500;600;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [config.fontFamily]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const metrics = [
    { label: 'Revenue', value: '$12,450', change: '+12.5%', up: true },
    { label: 'Users', value: '1,234', change: '+8.2%', up: true },
    { label: 'Orders', value: '384', change: '-2.1%', up: false },
  ];

  const tableRows = [
    { name: 'Landing page redesign', status: 'Active', progress: 75 },
    { name: 'API integration', status: 'Review', progress: 90 },
    { name: 'Mobile app v2', status: 'Draft', progress: 30 },
    { name: 'Design system docs', status: 'Active', progress: 60 },
  ];

  const chartPoints = '0,40 30,35 60,45 90,25 120,30 150,15 180,20 210,10 240,18 270,8';

  return (
    <div
      className="flex overflow-hidden h-full select-none"
      style={{
        backgroundColor: colors.bg,
        fontFamily: font,
        borderRadius: radii.lg,
        transition: 'background-color 0.4s ease',
      }}
    >
      {/* Sidebar */}
      <div
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: '180px',
          backgroundColor: colors.sidebar,
          borderRight: `1px solid ${colors.border}`,
          padding: `${spacing.card} 0`,
          transition: 'background-color 0.4s ease, border-color 0.4s ease',
        }}
      >
        <div className="px-4 mb-6 flex items-center gap-2">
          <div
            className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-bold"
            style={{
              backgroundColor: colors.primary,
              borderRadius: radii.sm,
              transition: 'background-color 0.4s ease, border-radius 0.4s ease',
            }}
          >
            A
          </div>
          <span className="text-sm font-semibold" style={{ color: colors.text, fontFamily: font }}>Acme Inc.</span>
        </div>

        <div className="text-[9px] font-semibold uppercase tracking-wider px-4 mb-2" style={{ color: colors.textFaint, fontFamily: font }}>
          Menu
        </div>

        <nav className="flex flex-col gap-0.5 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-all duration-200 cursor-pointer"
                style={{
                  fontFamily: 'inherit',
                  borderRadius: radii.sm,
                  color: isActive ? colors.primary : colors.textMuted,
                  backgroundColor: isActive ? colors.primarySoft : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <div
          className="flex items-center justify-between shrink-0"
          style={{
            padding: `10px ${spacing.card}`,
            borderBottom: `1px solid ${colors.border}`,
            transition: 'border-color 0.4s ease',
          }}
        >
          <span className="text-xs font-semibold" style={{ color: colors.text, fontFamily: font }}>Dashboard</span>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                backgroundColor: colors.secondary,
                borderRadius: radii.full,
                transition: 'background-color 0.4s ease',
              }}
            >
              U
            </div>
          </div>
        </div>

        {/* Content area */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ padding: spacing.card }}
        >
          {/* Metric Cards */}
          <div
            className="grid grid-cols-3 mb-4"
            style={{ gap: spacing.gap }}
          >
            {metrics.map((m) => (
              <div
                key={m.label}
                className="flex flex-col"
                style={{
                  padding: spacing.card,
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  transition: 'all 0.4s ease',
                }}
              >
                <span className="text-[9px] font-medium uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
                  {m.label}
                </span>
                <span className="text-lg font-bold leading-tight" style={{ color: colors.text }}>
                  {m.value}
                </span>
                <span
                  className="text-[10px] font-medium mt-1 flex items-center gap-0.5"
                  style={{ color: m.up ? '#10b981' : '#ef4444' }}
                >
                  {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {m.change}
                </span>
              </div>
            ))}
          </div>

          {/* Chart Area */}
          <div
            className="mb-4"
            style={{
              padding: spacing.card,
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.md,
              transition: 'all 0.4s ease',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold" style={{ color: colors.text }}>Performance</span>
              <button
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 cursor-pointer"
                style={{
                  fontFamily: 'inherit',
                  color: colors.textMuted,
                  backgroundColor: colors.surfaceHover,
                  borderRadius: radii.sm,
                  transition: 'all 0.3s ease',
                }}
              >
                Last 7 days <ChevronDown size={10} />
              </button>
            </div>
            <svg viewBox="0 0 270 50" className="w-full" style={{ height: '80px' }}>
              <defs>
                <linearGradient id="pgChartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.primary} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,50 ${chartPoints} 270,50`}
                fill="url(#pgChartGrad)"
                style={{ transition: 'fill 0.4s ease' }}
              />
              <polyline
                points={chartPoints}
                fill="none"
                stroke={colors.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: 'stroke 0.4s ease' }}
              />
            </svg>
          </div>

          {/* Table */}
          <div
            style={{
              backgroundColor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.md,
              overflow: 'hidden',
              transition: 'all 0.4s ease',
            }}
          >
            <div
              className="flex items-center justify-between"
              style={{ padding: `${spacing.card} ${spacing.card} 10px` }}
            >
              <span className="text-xs font-semibold" style={{ color: colors.text }}>Projects</span>
              <button
                className="text-[10px] font-semibold px-2.5 py-1 text-white cursor-pointer"
                style={{
                  fontFamily: 'inherit',
                  backgroundColor: colors.primary,
                  borderRadius: radii.sm,
                  transition: 'all 0.3s ease',
                }}
              >
                + New
              </button>
            </div>

            <table className="w-full text-[11px]" style={{ fontFamily: 'inherit' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  {['Name', 'Status', 'Progress'].map((h) => (
                    <th
                      key={h}
                      className="text-left font-medium"
                      style={{
                        color: colors.textMuted,
                        padding: spacing.cell,
                        transition: 'color 0.4s ease',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr
                    key={row.name}
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                  >
                    <td
                      className="font-medium"
                      style={{ color: colors.text, padding: spacing.cell }}
                    >
                      {row.name}
                    </td>
                    <td style={{ padding: spacing.cell }}>
                      <span
                        className="inline-block px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{
                          borderRadius: radii.sm,
                          color: row.status === 'Active'
                            ? colors.primary
                            : row.status === 'Review'
                            ? colors.secondary
                            : colors.textMuted,
                          backgroundColor: row.status === 'Active'
                            ? colors.primarySoft
                            : row.status === 'Review'
                            ? colors.secondarySoft
                            : colors.surfaceHover,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: spacing.cell }}>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-1.5 overflow-hidden"
                          style={{
                            backgroundColor: colors.surfaceHover,
                            borderRadius: radii.full,
                          }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${row.progress}%`,
                              backgroundColor: colors.primary,
                              borderRadius: radii.full,
                              transition: 'background-color 0.4s ease, width 0.4s ease',
                            }}
                          />
                        </div>
                        <span
                          className="text-[9px] font-mono w-7 text-right"
                          style={{ color: colors.textMuted }}
                        >
                          {row.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundDashboard;
