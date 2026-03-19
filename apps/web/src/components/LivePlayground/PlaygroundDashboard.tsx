import React, { useMemo, useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import { generateRamp } from '../Showcase/colorUtils';
import type { PlaygroundConfig } from './types';

interface PlaygroundDashboardProps {
  config: PlaygroundConfig;
  onChange: (updates: Partial<PlaygroundConfig>) => void;
}

const PlaygroundDashboard: React.FC<PlaygroundDashboardProps> = ({ config, onChange }) => {
  const [activeNav, setActiveNav] = useState('dashboard');
  void onChange;

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
    sidebar: isDark ? '#111827' : '#f8fafc',
    surface: isDark ? '#172235' : '#f8fafc',
    surfaceElevated: isDark ? '#1e293b' : '#ffffff',
    surfaceHover: isDark ? '#23344f' : '#f1f5f9',
    border: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.08)',
    text: isDark ? '#f1f5f9' : '#0f172a',
    textMuted: isDark ? 'rgba(241,245,249,0.5)' : 'rgba(15,23,42,0.5)',
    textFaint: isDark ? 'rgba(241,245,249,0.34)' : 'rgba(15,23,42,0.32)',
    primary: isDark ? primaryRamp[400] : primaryRamp[500],
    primarySoft: isDark ? `${primaryRamp[400]}18` : `${primaryRamp[500]}12`,
    primaryStrong: isDark ? primaryRamp[300] : primaryRamp[600],
    secondary: isDark ? secondaryRamp[400] : secondaryRamp[500],
    secondarySoft: isDark ? `${secondaryRamp[400]}18` : `${secondaryRamp[500]}12`,
    positive: isDark ? primaryRamp[300] : primaryRamp[600],
    caution: isDark ? secondaryRamp[300] : secondaryRamp[600],
    negative: isDark ? secondaryRamp[200] : secondaryRamp[700],
    chartGrid: isDark ? 'rgba(241,245,249,0.07)' : 'rgba(15,23,42,0.08)',
    onPrimary: isDark ? '#0f172a' : '#ffffff',
    ctaText: '#ffffff',
    ctaMuted: 'rgba(255,255,255,0.8)',
    ctaSoftBg: 'rgba(255,255,255,0.15)',
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
      case 'compact': return { card: '12px', cell: '6px 10px', gap: '8px', shell: '10px', control: '6px 8px' };
      case 'comfortable': return { card: '24px', cell: '14px 18px', gap: '16px', shell: '20px', control: '10px 12px' };
      default: return { card: '16px', cell: '10px 14px', gap: '12px', shell: '14px', control: '8px 10px' };
    }
  }, [config.density]);

  const font = `'${config.fontFamily}', system-ui, sans-serif`;
  const themeTransition = 'background-color 0.4s ease, border-color 0.4s ease, color 0.4s ease, border-radius 0.4s ease, padding 0.4s ease, gap 0.4s ease, margin 0.4s ease';
  const chartTransition = 'stroke 0.4s ease, fill 0.4s ease, opacity 0.4s ease';
  const interactiveTransition = 'all 0.25s ease';
  const shadowByExpression = useMemo(() => {
    // Use dedicated shadows field if available, fall back to expressiveness mapping
    const shadowLevel = config.shadows ?? (
      config.expressiveness === 'minimal' ? 'flat' :
      config.expressiveness === 'expressive' ? 'elevated' : 'subtle'
    );
    switch (shadowLevel) {
      case 'flat':
        return '0 1px 2px rgba(15,23,42,0.08)';
      case 'elevated':
        return isDark
          ? '0 10px 30px rgba(2,6,23,0.38)'
          : '0 12px 30px rgba(15,23,42,0.14)';
      case 'dramatic':
        return isDark
          ? '0 16px 48px rgba(2,6,23,0.5)'
          : '0 20px 48px rgba(15,23,42,0.18)';
      default: // subtle
        return isDark
          ? '0 6px 16px rgba(2,6,23,0.28)'
          : '0 8px 20px rgba(15,23,42,0.1)';
    }
  }, [config.shadows, config.expressiveness, isDark]);

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
    { label: 'Monthly Revenue', value: '$124,563', change: '+14.5%', up: true, icon: DollarSign },
    { label: 'Active Users', value: '8,234', change: '+4.2%', up: true, icon: Users },
    { label: 'New Orders', value: '1,482', change: '-1.4%', up: false, icon: ShoppingCart },
    { label: 'Live Sessions', value: '1,492', change: '+2.1%', up: true, icon: Activity },
  ];

  const tableRows = [
    { customer: 'Acme Corporation', email: 'contact@acme.co', status: 'Paid', date: 'Oct 24, 2023', amount: '$3,200.00' },
    { customer: 'Global Media Ltd', email: 'billing@global.net', status: 'Pending', date: 'Oct 23, 2023', amount: '$850.00' },
    { customer: 'Stark Industries', email: 'tony@stark.com', status: 'Failed', date: 'Oct 21, 2023', amount: '$12,450.00' },
    { customer: 'Vanguard Inc', email: 'hello@vanguard.io', status: 'Draft', date: 'Oct 20, 2023', amount: '$150.00' },
  ];

  const chartPoints = '0,42 32,38 64,44 96,30 128,34 160,22 192,26 224,16 256,20 288,12';
  const revenueBars = [36, 54, 41, 67, 48, 59, 72];
  const trafficSources = [
    { label: 'Direct', share: 45, color: colors.primary },
    { label: 'Organic Search', share: 32, color: colors.positive },
    { label: 'Referral', share: 18, color: colors.caution },
    { label: 'Social', share: 5, color: colors.secondary },
  ];
  const initials = ['A', 'GM', 'S', 'V'];
  const initialsSoft = [
    `${colors.primary}22`,
    `${colors.secondary}22`,
    `${colors.positive}22`,
    `${colors.caution}22`,
  ];

  return (
    <div
      className="flex overflow-hidden h-full select-none"
      style={{
        backgroundColor: colors.bg,
        fontFamily: font,
        borderRadius: radii.lg,
        transition: themeTransition,
      }}
    >
      {/* Sidebar */}
      <div
        className="hidden md:flex flex-col shrink-0"
        style={{
          width: '196px',
          backgroundColor: colors.sidebar,
          borderRight: `1px solid ${colors.border}`,
          padding: `${spacing.card} 0`,
          transition: themeTransition,
        }}
      >
        <div className="px-4 mb-6 flex items-center gap-2">
          <div
            className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-bold"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              borderRadius: radii.sm,
              transition: themeTransition,
            }}
          >
            {'A'}
          </div>
          <span className="text-sm font-semibold" style={{ color: colors.text }}>{'Acme'}</span>
        </div>

        <div className="text-[9px] font-semibold uppercase tracking-wider px-4 mb-2" style={{ color: colors.textFaint, fontFamily: font }}>
          General
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
                  transition: interactiveTransition,
                }}
              >
                <Icon size={14} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto px-3" style={{ transition: themeTransition }}>
          <div
            className="border"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.surfaceElevated,
              borderRadius: radii.md,
              padding: spacing.card,
              transition: themeTransition,
            }}
          >
            <div className="text-[10px] font-semibold" style={{ color: colors.text }}>Pro Workspace</div>
            <div className="mt-1 text-[10px]" style={{ color: colors.textMuted }}>80% quota used</div>
            <div
              className="mt-3 h-1.5 w-full overflow-hidden"
              style={{ backgroundColor: colors.surfaceHover, borderRadius: radii.full, transition: themeTransition }}
            >
              <div
                className="h-full"
                style={{
                  width: '80%',
                  backgroundColor: colors.primary,
                  borderRadius: radii.full,
                  transition: themeTransition,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <div
          className="flex flex-wrap items-center shrink-0"
          style={{
            gap: spacing.gap,
            padding: `${spacing.shell} ${spacing.card}`,
            borderBottom: `1px solid ${colors.border}`,
            transition: themeTransition,
          }}
        >
          <div className="flex items-center gap-2 min-w-[170px]">
            <span className="text-sm font-semibold" style={{ color: colors.text }}>Dashboard Preview</span>
          </div>
          <div className="flex-1 min-w-[180px] sm:min-w-[240px]">
            <div
              className="flex items-center gap-2"
              style={{
                borderRadius: radii.full,
                backgroundColor: colors.surfaceHover,
                border: `1px solid ${colors.border}`,
                padding: spacing.control,
                transition: themeTransition,
              }}
            >
              <Search size={14} style={{ color: colors.textMuted }} />
              <input
                aria-label="Search dashboard data"
                placeholder="Search components, users, or settings..."
                className="w-full bg-transparent text-xs outline-none"
                style={{ color: colors.text, fontFamily: 'inherit' }}
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              className="h-8 w-8 flex items-center justify-center cursor-pointer"
              style={{
                color: colors.textMuted,
                backgroundColor: colors.surfaceHover,
                borderRadius: radii.full,
                border: `1px solid ${colors.border}`,
                transition: interactiveTransition,
              }}
              aria-label="Notifications"
            >
              <Bell size={13} />
            </button>
            <button
              className="flex items-center gap-1.5 text-[11px] font-semibold px-3 h-8 text-white cursor-pointer"
              style={{
                color: colors.onPrimary,
                backgroundColor: colors.primary,
                borderRadius: radii.full,
                transition: interactiveTransition,
              }}
            >
              <Plus size={12} />
              New Project
            </button>
          </div>
        </div>

        {/* Content area */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ padding: spacing.card, transition: themeTransition }}
        >
          {/* Metric Cards */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-4"
            style={{ gap: spacing.gap, transition: themeTransition }}
          >
            {metrics.map((m) => (
              <div
                key={m.label}
                className="flex flex-col"
                style={{
                  padding: spacing.card,
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  boxShadow: shadowByExpression,
                  transition: themeTransition,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[9px] font-medium uppercase tracking-wider mb-1" style={{ color: colors.textMuted }}>
                    {m.label}
                  </span>
                  <div
                    className="w-6 h-6 flex items-center justify-center"
                    style={{
                      borderRadius: radii.sm,
                      backgroundColor: `${colors.primary}1f`,
                      color: colors.primary,
                      transition: themeTransition,
                    }}
                  >
                    <m.icon size={12} />
                  </div>
                </div>
                <span className="text-2xl font-bold leading-tight" style={{ color: colors.text }}>
                  {m.value}
                </span>
                <span
                  className="text-[10px] font-medium mt-1 flex items-center gap-0.5"
                  style={{ color: m.up ? colors.positive : colors.negative, transition: themeTransition }}
                >
                  {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {m.change} vs last month
                </span>
              </div>
            ))}
          </div>

          <div
            className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
            style={{ gap: spacing.gap, transition: themeTransition }}
          >
            <div
              className="flex flex-col"
              style={{
                gap: spacing.gap,
                transition: themeTransition,
              }}
            >
              {/* Chart Area */}
              <div
                style={{
                  padding: spacing.card,
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  boxShadow: shadowByExpression,
                  transition: themeTransition,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-semibold block" style={{ color: colors.text }}>Revenue Analytics</span>
                    <span className="text-[10px]" style={{ color: colors.textMuted }}>Daily income over the last 7 days</span>
                  </div>
                  <button
                    className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 cursor-pointer"
                    style={{
                      color: colors.textMuted,
                      backgroundColor: colors.surfaceHover,
                      borderRadius: radii.sm,
                      transition: interactiveTransition,
                    }}
                  >
                    Last 7 days <ChevronDown size={10} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <svg viewBox="0 0 288 64" className="w-full" style={{ height: '104px' }}>
                    <defs>
                      <linearGradient id="pgChartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.primary} stopOpacity="0.38" />
                        <stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[12, 24, 36, 48].map((line) => (
                      <line
                        key={line}
                        x1="0"
                        y1={line}
                        x2="288"
                        y2={line}
                        style={{ stroke: colors.chartGrid, strokeWidth: 1, transition: chartTransition }}
                      />
                    ))}
                    <polygon
                      points={`0,64 ${chartPoints} 288,64`}
                      fill="url(#pgChartGrad)"
                      style={{ transition: chartTransition }}
                    />
                    <polyline
                      points={chartPoints}
                      fill="none"
                      stroke={colors.primary}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ transition: chartTransition }}
                    />
                  </svg>
                  <div className="flex items-end justify-between gap-1">
                    {revenueBars.map((height, index) => (
                      <div key={height + index} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full"
                          style={{
                            height: `${height}px`,
                            backgroundColor: index === 3 ? colors.primary : colors.primarySoft,
                            borderRadius: radii.sm,
                            transition: themeTransition,
                          }}
                        />
                        <span className="text-[9px]" style={{ color: colors.textFaint }}>
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div
                style={{
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  overflow: 'hidden',
                  boxShadow: shadowByExpression,
                  transition: themeTransition,
                }}
              >
                <div
                  className="flex items-center justify-between"
                  style={{ padding: `${spacing.card} ${spacing.card} 10px`, transition: themeTransition }}
                >
                  <div>
                    <span className="text-xs font-semibold block" style={{ color: colors.text }}>Recent Transactions</span>
                    <span className="text-[10px]" style={{ color: colors.textMuted }}>Latest payments processed across all projects</span>
                  </div>
                  <button
                    className="text-[10px] font-medium px-2 py-1 cursor-pointer"
                    style={{
                      color: colors.textMuted,
                      borderRadius: radii.sm,
                      transition: interactiveTransition,
                    }}
                  >
                    View all
                  </button>
                </div>

                <div className="overflow-x-auto" style={{ transition: themeTransition }}>
                  <table className="w-full min-w-[560px] text-[11px]">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${colors.border}`, transition: themeTransition }}>
                        {['Customer', 'Status', 'Date', 'Amount'].map((h) => (
                          <th
                            key={h}
                            className="text-left font-medium"
                            style={{
                              color: colors.textMuted,
                              padding: spacing.cell,
                              transition: themeTransition,
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, index) => {
                        const statusTone = row.status === 'Paid'
                          ? { fg: colors.positive, bg: `${colors.positive}20` }
                          : row.status === 'Pending'
                            ? { fg: colors.caution, bg: `${colors.caution}20` }
                            : row.status === 'Failed'
                              ? { fg: colors.negative, bg: `${colors.negative}20` }
                              : { fg: colors.textMuted, bg: colors.surfaceHover };
                        return (
                          <tr
                            key={row.customer}
                            style={{ borderBottom: `1px solid ${colors.border}`, transition: themeTransition }}
                          >
                            <td style={{ padding: spacing.cell }}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 flex items-center justify-center text-[9px] font-semibold"
                                  style={{
                                    color: colors.text,
                                    backgroundColor: initialsSoft[index],
                                    borderRadius: radii.full,
                                    transition: themeTransition,
                                  }}
                                >
                                  {initials[index]}
                                </div>
                                <div>
                                  <div className="font-medium" style={{ color: colors.text }}>{row.customer}</div>
                                  <div className="text-[10px]" style={{ color: colors.textMuted }}>{row.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: spacing.cell }}>
                              <span
                                className="inline-block px-2 py-0.5 text-[9px] font-semibold"
                                style={{
                                  borderRadius: radii.sm,
                                  color: statusTone.fg,
                                  backgroundColor: statusTone.bg,
                                  transition: themeTransition,
                                }}
                              >
                                {row.status}
                              </span>
                            </td>
                            <td style={{ color: colors.textMuted, padding: spacing.cell, transition: themeTransition }}>{row.date}</td>
                            <td style={{ color: colors.text, fontWeight: 600, padding: spacing.cell, transition: themeTransition }}>{row.amount}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex flex-col" style={{ gap: spacing.gap, transition: themeTransition }}>
              <div
                style={{
                  padding: spacing.card,
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  boxShadow: shadowByExpression,
                  transition: themeTransition,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold" style={{ color: colors.text }}>Traffic Sources</span>
                  <span className="text-[10px]" style={{ color: colors.textMuted }}>Where visitors come from</span>
                </div>
                <div className="flex flex-col" style={{ gap: spacing.gap, transition: themeTransition }}>
                  {trafficSources.map((source) => (
                    <div key={source.label}>
                      <div className="mb-1 flex items-center justify-between text-[10px]">
                        <span style={{ color: colors.text }}>{source.label}</span>
                        <span style={{ color: colors.textMuted }}>{source.share}%</span>
                      </div>
                      <div
                        className="h-1.5 w-full overflow-hidden"
                        style={{
                          backgroundColor: colors.surfaceHover,
                          borderRadius: radii.full,
                          transition: themeTransition,
                        }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${source.share}%`,
                            backgroundColor: source.color,
                            borderRadius: radii.full,
                            transition: themeTransition,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  padding: spacing.card,
                  backgroundColor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: radii.md,
                  boxShadow: shadowByExpression,
                  transition: themeTransition,
                }}
              >
                <span className="text-xs font-semibold block mb-1" style={{ color: colors.text }}>Preferences</span>
                <span className="text-[10px] block mb-3" style={{ color: colors.textMuted }}>Configure visual and functional elements.</span>
                <div className="flex flex-col" style={{ gap: spacing.gap, transition: themeTransition }}>
                  {[
                    ['Display Name', 'Acme Design Team'],
                    ['Default Role', 'Viewer (Read-only)'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[10px] mb-1" style={{ color: colors.textMuted }}>{label}</div>
                      <div
                        className="text-[10px] flex items-center justify-between"
                        style={{
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          backgroundColor: colors.surface,
                          borderRadius: radii.sm,
                          padding: spacing.control,
                          transition: themeTransition,
                        }}
                      >
                        <span>{value}</span>
                        <ChevronDown size={11} style={{ color: colors.textFaint }} />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="mt-4 w-full text-[10px] font-semibold py-2 text-white cursor-pointer"
                  style={{
                    borderRadius: radii.sm,
                    color: colors.onPrimary,
                    backgroundColor: colors.primary,
                    transition: interactiveTransition,
                  }}
                >
                  Save Preferences
                </button>
              </div>

              <div
                style={{
                  padding: spacing.card,
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  borderRadius: radii.md,
                  boxShadow: shadowByExpression,
                  transition: themeTransition,
                }}
              >
                <div className="text-xs font-semibold" style={{ color: colors.ctaText, transition: themeTransition }}>Unleash the new API v2.0</div>
                <div className="text-[10px] mt-1" style={{ color: colors.ctaMuted, transition: themeTransition }}>Faster response times and realtime event streams.</div>
                <button
                  className="mt-3 text-[10px] px-2.5 py-1 cursor-pointer"
                  style={{
                    color: colors.ctaText,
                    backgroundColor: colors.ctaSoftBg,
                    borderRadius: radii.sm,
                    transition: interactiveTransition,
                  }}
                >
                  Read Docs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaygroundDashboard;
