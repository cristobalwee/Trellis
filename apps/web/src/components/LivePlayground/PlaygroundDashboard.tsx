import React, { useMemo, useState } from 'react';
import type { EChartsOption } from 'echarts';
import { graphic } from 'echarts';
import ReactEChartsImport from 'echarts-for-react/lib/index.js';
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
  ExternalLink,
} from 'lucide-react';
import type { PlaygroundConfig } from './types';

// ---------------------------------------------------------------------------
// Scoped hover styles — CSS variables make these reactive to token changes
// ---------------------------------------------------------------------------

const PLAYGROUND_STYLES = `
  .pg-btn-primary:hover { filter: brightness(1.1); }
  .pg-btn-secondary:hover { background-color: var(--color-background-raisedHover) !important; }
  .pg-btn-ghost:hover { background-color: var(--color-background-raisedHover) !important; }
  .pg-btn-link:hover { text-decoration: underline; }
  .pg-row:hover { background-color: var(--color-background-raisedHover); }
  .pg-nav:hover { background-color: var(--color-background-raisedHover) !important; color: var(--color-foreground-onBase) !important; }
  .pg-icon-btn:hover { background-color: var(--color-background-raisedHover) !important; color: var(--color-foreground-onBase) !important; }
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const V = (token: string) => `var(--${token})`;
const t = (token: string) => V(token);
const ReactECharts = (ReactEChartsImport as unknown as { default?: React.ComponentType<any> }).default
  ?? (ReactEChartsImport as unknown as React.ComponentType<any>);
const resolveVarColor = (value: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const tokenMatch = value.match(/^var\(--([^)]+)\)$/);
  if (!tokenMatch) return value;
  const token = tokenMatch[1];
  const resolved = getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim();
  return resolved || fallback;
};

// Shorthand accessors for commonly used token groups
const bg = {
  base: t('color-background-base'),
  sunken: t('color-background-sunken'),
  raised: t('color-background-raised'),
  raisedHover: t('color-background-raisedHover'),
  primary: t('color-background-primary'),
  primaryHover: t('color-background-primaryHover'),
  primarySubtle: t('color-background-primarySubtle'),
  accent: t('color-background-accent'),
  accentSubtle: t('color-background-accentSubtle'),
  success: t('color-background-success'),
  successSubtle: t('color-background-successSubtle'),
  warning: t('color-background-warning'),
  warningSubtle: t('color-background-warningSubtle'),
  critical: t('color-background-critical'),
  criticalSubtle: t('color-background-criticalSubtle'),
  info: t('color-background-info'),
  infoSubtle: t('color-background-infoSubtle'),
  gradientSoft: t('color-background-gradientSoft'),
};
const fg = {
  onBase: t('color-foreground-onBase'),
  onBaseMuted: t('color-foreground-onBaseMuted'),
  onBaseFaint: t('color-foreground-onBaseFaint'),
  primary: t('color-foreground-primary'),
  onPrimary: t('color-foreground-onPrimary'),
  accent: t('color-foreground-accent'),
  success: t('color-foreground-success'),
  warning: t('color-foreground-warning'),
  critical: t('color-foreground-critical'),
  info: t('color-foreground-info'),
  onSuccessSubtle: t('color-foreground-onSuccessSubtle'),
  onWarningSubtle: t('color-foreground-onWarningSubtle'),
  onCriticalSubtle: t('color-foreground-onCriticalSubtle'),
  onInfoSubtle: t('color-foreground-onInfoSubtle'),
  onGradient: t('color-foreground-onGradient'),
  onGradientMuted: t('color-foreground-onGradientMuted'),
};
const border = {
  neutral: t('color-border-neutral'),
  strong: t('color-border-strong'),
  primary: t('color-border-primary'),
};
const radius = {
  container: t('radius-container'),
  action: t('radius-action'),
  field: t('radius-field'),
  badge: t('radius-badge'),
  sub: t('radius-subcontainer'),
};
const space = {
  xs: t('spacing-xs'),
  sm: t('spacing-sm'),
  md: t('spacing-md'),
  lg: t('spacing-lg'),
  xl: t('spacing-xl'),
  '2xl': t('spacing-2xl'),
  '3xl': t('spacing-3xl'),
  '4xl': t('spacing-4xl'),
  '5xl': t('spacing-5xl'),
  '6xl': t('spacing-6xl'),
};
const shadow = {
  card: t('shadow-card'),
  elevated: t('shadow-elevated'),
};
const transition = {
  theme: t('transition-theme'),
  interactive: t('transition-interactive'),
  chart: t('transition-chart'),
};
const font = {
  primary: t('font-family-primary'),
  secondary: t('font-family-secondary'),
};
const weight = {
  heading: t('font-weight-heading'),
  bodyRegular: t('font-weight-body-regular'),
};

const gradient = t('gradient-primary');

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface PlaygroundDashboardProps {
  config: PlaygroundConfig;
  onChange: (updates: Partial<PlaygroundConfig>) => void;
}

const PlaygroundDashboard: React.FC<PlaygroundDashboardProps> = ({ config, onChange }) => {
  const [activeNav, setActiveNav] = useState('dashboard');
  void onChange;

  // --- Static data ---

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
    { customer: 'Acme Corporation', email: 'contact@acme.co', status: 'Paid' as const, date: 'Oct 24, 2023', amount: '$3,200.00' },
    { customer: 'Global Media Ltd', email: 'billing@global.net', status: 'Pending' as const, date: 'Oct 23, 2023', amount: '$850.00' },
    { customer: 'Stark Industries', email: 'tony@stark.com', status: 'Failed' as const, date: 'Oct 21, 2023', amount: '$12,450.00' },
    { customer: 'Vanguard Inc', email: 'hello@vanguard.io', status: 'Draft' as const, date: 'Oct 20, 2023', amount: '$150.00' },
  ];

  const statusStyles: Record<string, { fg: string; bg: string }> = {
    Paid: { fg: fg.onSuccessSubtle, bg: bg.successSubtle },
    Pending: { fg: fg.onWarningSubtle, bg: bg.warningSubtle },
    Failed: { fg: fg.onCriticalSubtle, bg: bg.criticalSubtle },
    Draft: { fg: fg.onBaseMuted, bg: bg.raisedHover },
  };

  const revenueDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const revenueSeries = [1820, 2240, 2090, 2985, 2650, 3120, 3390];
  const orderSeries = [38, 48, 44, 67, 59, 72, 78];

  const revenueChartOption = useMemo<EChartsOption>(() => {
    const primary = resolveVarColor(bg.primary, '#2f6d5c');
    const primarySubtle = resolveVarColor(bg.primarySubtle, '#d4e6de');
    const raised = resolveVarColor(bg.raised, '#ffffff');
    const grid = resolveVarColor(t('color-chart-grid'), '#e5e7eb');
    const textMuted = resolveVarColor(fg.onBaseMuted, '#6b7280');
    const textFaint = resolveVarColor(fg.onBaseFaint, '#9ca3af');
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    return {
      animation: !reduceMotion,
      animationDuration: reduceMotion ? 0 : 700,
      animationDurationUpdate: reduceMotion ? 0 : 420,
      animationEasing: 'cubicOut',
      animationEasingUpdate: 'cubicOut',
      grid: {
        top: 16,
        left: 10,
        right: 10,
        bottom: 22,
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: raised,
        borderColor: grid,
        borderWidth: 1,
        textStyle: {
          color: textMuted,
          fontFamily: font.primary,
          fontSize: 11,
        },
        extraCssText: `border-radius:${radius.sub}; box-shadow:${shadow.card};`,
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: primary,
            width: 1,
            type: 'dashed',
          },
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: true,
        data: revenueDays,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textFaint,
          fontSize: 10,
          margin: 10,
        },
      },
      yAxis: [
        {
          type: 'value',
          splitNumber: 4,
          axisLabel: {
            color: textFaint,
            fontSize: 10,
            formatter: '${value}',
          },
          splitLine: {
            lineStyle: { color: grid },
          },
          axisTick: { show: false },
          axisLine: { show: false },
        },
        {
          type: 'value',
          splitLine: { show: false },
          axisLabel: { show: false },
          axisTick: { show: false },
          axisLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Orders',
          type: 'bar',
          yAxisIndex: 1,
          data: orderSeries,
          barMaxWidth: 16,
          itemStyle: {
            color: primarySubtle,
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: {
              color: primary,
            },
          },
        },
        {
          name: 'Revenue',
          type: 'line',
          smooth: 0.42,
          showSymbol: false,
          data: revenueSeries,
          lineStyle: {
            width: 2.8,
            color: primary,
          },
          z: 3,
        },
      ],
    };
  }, [config]);

  const trafficSources = [
    { label: 'Direct', share: 45, color: bg.primary },
    { label: 'Organic Search', share: 32, color: bg.success },
    { label: 'Referral', share: 18, color: bg.warning },
    { label: 'Social', share: 5, color: bg.info },
  ];

  const avatarColors = [bg.primarySubtle, bg.accentSubtle, bg.successSubtle, bg.warningSubtle];
  const initials = ['A', 'GM', 'S', 'V'];
  const todayLabel = useMemo(
    () => new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()),
    [],
  );

  return (
    <>
      <style>{PLAYGROUND_STYLES}</style>
      <div
        className="flex overflow-hidden h-full select-none"
        style={{
          backgroundColor: bg.sunken,
          fontFamily: font.primary,
          borderRadius: radius.container,
          transition: transition.theme
        }}
      >
        {/* Sidebar */}
        <div
          className="hidden md:flex flex-col shrink-0"
          style={{
            width: '196px',
            paddingTop: space.lg,
            paddingBottom: space.lg,
            transition: transition.theme,
          }}
        >
          <div className="px-4 mb-6 flex items-center gap-2">
            <div
              className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-bold"
              style={{
                background: bg.accent,
                borderRadius: radius.badge,
                transition: transition.theme,
              }}
            >
              A
            </div>
            <span className="text-sm font-semibold" style={{ color: fg.onBase }}>Acme</span>
          </div>

          <div className="text-[11px] font-semibold px-4 mb-2" style={{ color: fg.onBaseFaint }}>
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
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium cursor-pointer ${!isActive ? 'pg-nav' : ''}`}
                  style={{
                    fontFamily: 'inherit',
                    borderRadius: radius.badge,
                    color: isActive ? fg.onBase : fg.onBaseMuted,
                    backgroundColor: isActive ? bg.raisedHover : 'transparent',
                    transition: transition.interactive,
                  }}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto px-3" style={{ transition: transition.theme }}>
            <div
              style={{
                backgroundColor: bg.raised,
                borderRadius: radius.container,
                padding: space.lg,
                transition: transition.theme,
              }}
            >
              <div className="text-[10px] font-semibold" style={{ color: fg.onBase }}>Pro Workspace</div>
              <div className="mt-1 text-[10px]" style={{ color: fg.onBaseMuted }}>80% quota used</div>
              <div
                className="mt-3 h-1.5 w-full overflow-hidden"
                style={{ backgroundColor: bg.raisedHover, borderRadius: radius.action, transition: transition.theme }}
              >
                <div
                  className="h-full"
                  style={{
                    width: '80%',
                    backgroundColor: bg.primary,
                    borderRadius: radius.action,
                    transition: transition.theme,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content — inset panel */}
        <div
          className="flex-1 flex flex-col min-w-0 overflow-hidden my-2 mr-2 md:ml-0 ml-2"
          style={{
            backgroundColor: bg.base,
            borderRadius: radius.container,
            boxShadow: shadow.elevated,
            transition: transition.theme,
          }}
        >
          {/* Top Bar */}
          <div
            className="flex flex-wrap items-center shrink-0"
            style={{
              gap: space.md,
              padding: `${space.md} ${space.lg}`,
              borderBottom: `1px solid ${border.neutral}`,
              transition: transition.theme,
            }}
          >
            <div className="flex-1 min-w-[180px]">
              <div
                className="flex items-center gap-2"
                style={{
                  borderRadius: radius.field,
                  padding: `${space.sm}`,
                  transition: transition.theme,
                }}
              >
                <Search size={14} style={{ color: fg.onBaseMuted }} />
                <input
                  aria-label="Search dashboard data"
                  placeholder="Search components, users, or settings..."
                  className="w-full bg-transparent text-xs outline-none"
                  style={{ color: fg.onBase, fontFamily: 'inherit' }}
                />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {/* Ghost icon button */}
              <button
                className="h-8 w-8 flex items-center justify-center cursor-pointer pg-icon-btn"
                style={{
                  color: fg.onBaseMuted,
                  backgroundColor: 'transparent',
                  borderRadius: radius.action,
                  border: `1px solid ${border.neutral}`,
                  transition: transition.interactive,
                }}
                aria-label="Notifications"
              >
                <Bell size={13} />
              </button>
              {/* Primary button */}
              <button
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 h-8 cursor-pointer pg-btn-primary"
                style={{
                  color: fg.onPrimary,
                  backgroundColor: bg.primary,
                  borderRadius: radius.action,
                  transition: transition.interactive,
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
            style={{ paddingTop: space.xl, paddingBottom: space.xl, paddingLeft: space['2xl'], paddingRight: space['2xl'], transition: transition.theme }}
          >
            <div className="mb-4" style={{ transition: transition.theme, marginBottom: space.xl }}>
              <span
                className="block text-[11px]"
                style={{
                  color: fg.onBaseMuted,
                  fontFamily: font.primary,
                  fontWeight: weight.bodyRegular as unknown as number,
                  letterSpacing: '0.01em',
                  marginBottom: space.xs,
                  transition: transition.theme,
                }}
              >
                {todayLabel}
              </span>
              <h2
                className="leading-tight"
                style={{
                  color: fg.onBase,
                  fontFamily: font.secondary,
                  fontSize: '1.5rem',
                  fontWeight: weight.heading as unknown as number,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  margin: 0,
                  transition: transition.theme,
                }}
              >
                Good morning, Dave
              </h2>
            </div>

            {/* Metric Cards */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 mb-4"
              style={{ gap: space.md, transition: transition.theme }}
            >
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="flex flex-col"
                  style={{
                    padding: space.lg,
                    backgroundColor: bg.raised,
                    border: `1px solid ${border.neutral}`,
                    borderRadius: radius.container,
                    boxShadow: shadow.card,
                    transition: transition.theme,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[9px] font-medium uppercase tracking-wider mb-1" style={{ color: fg.onBaseMuted }}>
                      {m.label}
                    </span>
                    <div
                      className="w-6 h-6 flex items-center justify-center"
                      style={{
                        borderRadius: radius.badge,
                        backgroundColor: bg.raisedHover,
                        color: fg.onBaseMuted,
                        transition: transition.theme,
                      }}
                    >
                      <m.icon size={12} />
                    </div>
                  </div>
                  <span
                    className="text-2xl leading-tight"
                    style={{
                      color: fg.onBase,
                      fontFamily: font.secondary,
                      fontWeight: 'var(--font-weight-heading)' as unknown as number,
                    }}
                  >
                    {m.value}
                  </span>
                  <span
                    className="text-[10px] font-medium mt-1 flex items-center gap-0.5"
                    style={{ color: m.up ? fg.success : fg.critical, transition: transition.theme }}
                  >
                    {m.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {m.change} vs last month
                  </span>
                </div>
              ))}
            </div>

            <div
              className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
              style={{ gap: space.md, transition: transition.theme }}
            >
              <div className="flex flex-col" style={{ gap: space.md, transition: transition.theme }}>
                {/* Chart Area */}
                <div
                  style={{
                    padding: space.lg,
                    backgroundColor: bg.raised,
                    border: `1px solid ${border.neutral}`,
                    borderRadius: radius.container,
                    boxShadow: shadow.card,
                    transition: transition.theme,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xs font-semibold block" style={{ color: fg.onBase }}>Revenue Analytics</span>
                      <span className="text-[10px]" style={{ color: fg.onBaseMuted }}>Daily income over the last 7 days</span>
                    </div>
                    {/* Ghost button */}
                    <button
                      className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 cursor-pointer pg-btn-ghost"
                      style={{
                        color: fg.onBaseMuted,
                        backgroundColor: bg.raisedHover,
                        borderRadius: radius.badge,
                        transition: transition.interactive,
                      }}
                    >
                      Last 7 days <ChevronDown size={10} />
                    </button>
                  </div>
                  <ReactECharts
                    option={revenueChartOption}
                    style={{ height: 210, width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                    notMerge
                    lazyUpdate
                  />
                </div>

                {/* Transactions */}
                <div
                  style={{
                    backgroundColor: bg.raised,
                    border: `1px solid ${border.neutral}`,
                    borderRadius: radius.container,
                    overflow: 'hidden',
                    boxShadow: shadow.card,
                    transition: transition.theme,
                  }}
                >
                  <div
                    className="flex items-center justify-between"
                    style={{ padding: `${space.lg} ${space.lg} 10px`, transition: transition.theme }}
                  >
                    <div>
                      <span className="text-xs font-semibold block" style={{ color: fg.onBase }}>Recent Transactions</span>
                      <span className="text-[10px]" style={{ color: fg.onBaseMuted }}>Latest payments processed across all projects</span>
                    </div>
                    {/* Link button */}
                    <button
                      className="text-[10px] font-medium px-2 py-1 cursor-pointer pg-btn-link flex items-center gap-1"
                      style={{
                        color: fg.primary,
                        borderRadius: radius.badge,
                        transition: transition.interactive,
                      }}
                    >
                      View all <ExternalLink size={9} />
                    </button>
                  </div>

                  <div className="overflow-x-auto" style={{ transition: transition.theme }}>
                    <table className="w-full min-w-[560px] text-[11px]">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${border.neutral}`, transition: transition.theme }}>
                          {['Customer', 'Status', 'Date', 'Amount'].map((h) => (
                            <th
                              key={h}
                              className="text-left font-medium"
                              style={{
                                color: fg.onBaseMuted,
                                padding: `${space.sm} ${space.md}`,
                                transition: transition.theme,
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((row, index) => {
                          const tone = statusStyles[row.status] ?? statusStyles.Draft;
                          return (
                            <tr
                              key={row.customer}
                              className="pg-row"
                              style={{ borderBottom: `1px solid ${border.neutral}`, transition: transition.theme }}
                            >
                              <td style={{ padding: `${space.sm} ${space.md}` }}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 flex items-center justify-center text-[9px] font-semibold"
                                    style={{
                                      color: fg.onBase,
                                      backgroundColor: avatarColors[index],
                                      borderRadius: radius.action,
                                      transition: transition.theme,
                                    }}
                                  >
                                    {initials[index]}
                                  </div>
                                  <div>
                                    <div className="font-medium" style={{ color: fg.onBase }}>{row.customer}</div>
                                    <div className="text-[10px]" style={{ color: fg.onBaseMuted }}>{row.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: `${space.sm} ${space.md}` }}>
                                <span
                                  className="inline-block px-2 py-0.5 text-[9px] font-semibold"
                                  style={{
                                    borderRadius: radius.badge,
                                    color: tone.fg,
                                    backgroundColor: tone.bg,
                                    transition: transition.theme,
                                  }}
                                >
                                  {row.status}
                                </span>
                              </td>
                              <td style={{ color: fg.onBaseMuted, padding: `${space.sm} ${space.md}`, transition: transition.theme }}>{row.date}</td>
                              <td style={{ color: fg.onBase, fontWeight: 600, padding: `${space.sm} ${space.md}`, transition: transition.theme }}>{row.amount}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex flex-col" style={{ gap: space.md, transition: transition.theme }}>
                {/* Traffic Sources */}
                <div
                  style={{
                    padding: space.lg,
                    backgroundColor: bg.raised,
                    border: `1px solid ${border.neutral}`,
                    borderRadius: radius.container,
                    boxShadow: shadow.card,
                    transition: transition.theme,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold" style={{ color: fg.onBase }}>Traffic Sources</span>
                    <span className="text-[10px]" style={{ color: fg.onBaseMuted }}>Where visitors come from</span>
                  </div>
                  <div className="flex flex-col" style={{ gap: space.md, transition: transition.theme }}>
                    {trafficSources.map((source) => (
                      <div key={source.label}>
                        <div className="mb-1 flex items-center justify-between text-[10px]">
                          <span style={{ color: fg.onBase }}>{source.label}</span>
                          <span style={{ color: fg.onBaseMuted }}>{source.share}%</span>
                        </div>
                        <div
                          className="h-1.5 w-full overflow-hidden"
                          style={{
                            backgroundColor: bg.raisedHover,
                            borderRadius: radius.action,
                            transition: transition.theme,
                          }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${source.share}%`,
                              backgroundColor: source.color,
                              borderRadius: radius.action,
                              transition: transition.theme,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferences */}
                <div
                  style={{
                    padding: space.lg,
                    backgroundColor: bg.raised,
                    border: `1px solid ${border.neutral}`,
                    borderRadius: radius.container,
                    boxShadow: shadow.card,
                    transition: transition.theme,
                  }}
                >
                  <span className="text-xs font-semibold block mb-1" style={{ color: fg.onBase }}>Preferences</span>
                  <span className="text-[10px] block mb-3" style={{ color: fg.onBaseMuted }}>Configure visual and functional elements.</span>
                  <div className="flex flex-col" style={{ gap: space.md, transition: transition.theme }}>
                    {[
                      ['Display Name', 'Acme Design Team'],
                      ['Default Role', 'Viewer (Read-only)'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="text-[10px] mb-1" style={{ color: fg.onBaseMuted }}>{label}</div>
                        <div
                          className="text-[10px] flex items-center justify-between"
                          style={{
                            color: fg.onBase,
                            border: `1px solid ${border.neutral}`,
                            backgroundColor: bg.raisedHover,
                            borderRadius: radius.field,
                            padding: `${space.sm} ${space.lg}`,
                            transition: transition.theme,
                          }}
                        >
                          <span>{value}</span>
                          <ChevronDown size={11} style={{ color: fg.onBaseFaint }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {/* Primary button */}
                    <button
                      className="flex-1 text-[10px] font-semibold py-2 cursor-pointer pg-btn-primary"
                      style={{
                        borderRadius: radius.action,
                        color: fg.onPrimary,
                        backgroundColor: bg.primary,
                        transition: transition.interactive,
                      }}
                    >
                      Save Preferences
                    </button>
                    {/* Secondary (outlined) button */}
                    <button
                      className="text-[10px] font-semibold py-2 px-3 cursor-pointer pg-btn-ghost"
                      style={{
                        borderRadius: radius.action,
                        color: fg.onBase,
                        backgroundColor: 'transparent',
                        border: `1px solid ${border.neutral}`,
                        transition: transition.interactive,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                {/* CTA Card */}
                <div
                  style={{
                    padding: space.lg,
                    background: gradient,
                    borderRadius: radius.container,
                    boxShadow: shadow.card,
                    transition: transition.theme,
                  }}
                >
                  <div className="text-xs font-semibold" style={{ color: fg.onGradient, transition: transition.theme }}>Unleash the new API v2.0</div>
                  <div className="text-[10px] mt-1" style={{ color: fg.onGradientMuted, transition: transition.theme }}>Faster response times and realtime event streams.</div>
                  {/* Ghost-on-gradient button */}
                  <button
                    className="mt-3 text-[10px] px-2.5 py-1 cursor-pointer pg-btn-link"
                    style={{
                      color: fg.onGradient,
                      backgroundColor: bg.gradientSoft,
                      borderRadius: radius.badge,
                      transition: transition.interactive,
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
    </>
  );
};

export default PlaygroundDashboard;
