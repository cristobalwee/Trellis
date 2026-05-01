import React, { useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Square,
  Grid3X3,
  Image,
  Type,
  Bold,
  Italic,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  CreditCard,
  Wallet,
  Bell,
  Settings,
  Coffee,
  Music,
  ShoppingBag,
  Upload,
  UserPlus,
  AtSign,
  Globe,
  Cloud,
  Music2,
  ChevronUp,
} from 'lucide-react';
import { bg, fg, border, radius, space, shadow, transition, font, gradient } from './tokens';
import Button from './Button';
import Input from './Input';
import Badge from './Badge';
import Toggle from './Toggle';
import Checkbox from './Checkbox';
import Avatar from './Avatar';
import Alert from './Alert';
import Card from './Card';
import qrcodePng from '../../assets/qrcode.png';

// ---------------------------------------------------------------------------
// Scoped hover styles
// ---------------------------------------------------------------------------

const SAMPLER_STYLES = `
  .cs-icon-btn:hover { background-color: var(--color-background-raisedHover) !important; }
  .cs-tree-row:hover { background-color: var(--color-background-raisedHover) !important; }
  .cs-link:hover { text-decoration: underline; }
`;

// ---------------------------------------------------------------------------
// Section wrapper — provides consistent spacing and optional title
// ---------------------------------------------------------------------------

const Section: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
    {children}
  </div>
);

// ---------------------------------------------------------------------------
// Tree View
// ---------------------------------------------------------------------------

interface TreeNode {
  label: string;
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>;
  children?: TreeNode[];
}

const TREE_DATA: TreeNode[] = [
  {
    label: 'Box',
    icon: Square,
    children: [
      {
        label: 'Grid',
        icon: Grid3X3,
        children: [
          { label: 'Image', icon: Image },
          { label: 'Image', icon: Image },
        ],
      },
      { label: 'Text', icon: Type },
    ],
  },
];

const TreeRow: React.FC<{ node: TreeNode; depth?: number }> = ({ node, depth = 0 }) => {
  const [open, setOpen] = useState(true);
  const Icon = node.icon;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <button
        className="cs-tree-row"
        onClick={() => hasChildren && setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%',
          border: 'none',
          background: 'none',
          cursor: hasChildren ? 'pointer' : 'default',
          paddingLeft: `${12 + depth * 16}px`,
          paddingRight: '12px',
          paddingTop: '5px',
          paddingBottom: '5px',
          fontSize: '12px',
          color: fg.onBase,
          fontFamily: 'inherit',
          borderRadius: radius.badge,
          transition: transition.interactive,
        }}
      >
        {hasChildren && (
          <ChevronDown
            size={10}
            style={{
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: transition.interactive,
              color: fg.onBaseFaint,
              flexShrink: 0,
            }}
          />
        )}
        {!hasChildren && <span style={{ width: '10px' }} />}
        <Icon size={13} style={{ color: fg.onBaseMuted, flexShrink: 0 }} />
        <span>{node.label}</span>
      </button>
      {hasChildren && open && node.children!.map((child, i) => (
        <TreeRow key={`${child.label}-${i}`} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Icon Button
// ---------------------------------------------------------------------------

const IconButton: React.FC<{
  icon: React.FC<{ size?: number }>;
  label: string;
  active?: boolean;
}> = ({ icon: Icon, label, active }) => (
  <button
    className="cs-icon-btn"
    aria-label={label}
    style={{
      width: '30px',
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: radius.action,
      backgroundColor: active ? bg.primarySubtle : 'transparent',
      color: active ? fg.primary : fg.onBaseMuted,
      cursor: 'pointer',
      transition: transition.interactive,
      padding: 0,
    }}
  >
    <Icon size={14} />
  </button>
);

// ---------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------

const Toolbar: React.FC = () => (
  <Card style={{ padding: `${space.sm} ${space.lg}`, display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
    <IconButton icon={Plus} label="Add" />
    <IconButton icon={Grid3X3} label="Grid" />
    <IconButton icon={Square} label="Frame" />
    <Divider />
    <IconButton icon={Type} label="Text" active />
    <IconButton icon={Bold} label="Bold" />
    <IconButton icon={Italic} label="Italic" />
    <IconButton icon={Strikethrough} label="Strikethrough" />
    <Divider />
    <IconButton icon={AlignLeft} label="Align left" />
    <IconButton icon={AlignCenter} label="Align center" />
    <IconButton icon={AlignRight} label="Align right" />
    <div style={{ marginLeft: 'auto' }}>
      <Button variant="outline" size="sm">
        Actions <ChevronDown size={10} />
      </Button>
    </div>
  </Card>
);

const Divider: React.FC = () => (
  <div
    style={{
      width: '1px',
      height: '18px',
      backgroundColor: border.neutral,
      margin: '0 4px',
      flexShrink: 0,
    }}
  />
);

// ---------------------------------------------------------------------------
// User Card
// ---------------------------------------------------------------------------

const UserCard: React.FC<{
  name: string;
  email: string;
  colorIndex: number;
}> = ({ name, email, colorIndex }) => (
  <Card style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
    <Avatar initials={name.split(' ').map(w => w[0]).join('')} size="lg" colorIndex={colorIndex} />
    <div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: fg.onBase }}>{name}</div>
      <div style={{ fontSize: '11px', color: fg.onBaseMuted, marginTop: '2px' }}>{email}</div>
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Sign Up Form
// ---------------------------------------------------------------------------

const SignUpForm: React.FC = () => (
  <Card>
    <h3
      style={{
        fontFamily: font.secondary,
        fontSize: '20px',
        fontWeight: 'var(--font-heading-weight)' as unknown as number,
        color: fg.onBase,
        margin: 0,
        marginBottom: space.lg,
        textAlign: 'center',
      }}
    >
      Sign up
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
      <Input label="Full name" placeholder="Enter your name" size="sm" />
      <Input label="Email" type="email" placeholder="Enter your email address" size="sm" />
      <Input label="Password" type="password" placeholder="Enter your password" size="sm" />
      <Button variant="primary" size="sm" style={{ width: '100%', marginTop: '4px' }}>
        Create account
      </Button>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: space.md,
        }}
      >
        <div style={{ flex: 1, height: '1px', backgroundColor: border.neutral }} />
        <span style={{ fontSize: '10px', color: fg.onBaseFaint, textTransform: 'uppercase', fontWeight: 500 }}>
          Or
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: border.neutral }} />
      </div>
      <Button variant="outline" size="sm" style={{ width: '100%' }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
        </svg>
        Continue with GitHub
      </Button>
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Avatar Group
// ---------------------------------------------------------------------------

const AvatarGroup: React.FC = () => {
  const people = [
    { initials: 'SK', colorIndex: 0 },
    { initials: 'JD', colorIndex: 1 },
    { initials: 'V', colorIndex: 2 },
    { initials: 'BG', colorIndex: 3 },
  ];

  return (
    <div style={{ display: 'flex', gap: space.md, flexWrap: 'wrap' }}>
      {people.map((p, i) => (
        <Avatar key={i} initials={p.initials} size="lg" colorIndex={p.colorIndex} />
      ))}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: radius.action,
          backgroundColor: bg.raisedHover,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: fg.onBaseMuted,
          transition: transition.theme,
        }}
      >
        <Users size={15} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Rich Text
// ---------------------------------------------------------------------------

const RichTextBlock: React.FC = () => (
  <Card>
    <p
      style={{
        fontSize: '12px',
        lineHeight: 1.65,
        color: fg.onBase,
        fontFamily: font.primary,
        margin: 0,
      }}
    >
      Susan Kare is an American{' '}
      <span className="cs-link" style={{ color: fg.primary, fontWeight: 600, cursor: 'pointer' }}>
        graphic designer
      </span>{' '}
      and artist, who contributed{' '}
      <span className="cs-link" style={{ color: fg.primary, fontWeight: 600, cursor: 'pointer' }}>
        interface
      </span>{' '}
      elements and{' '}
      <span className="cs-link" style={{ color: fg.primary, fontWeight: 600, cursor: 'pointer' }}>
        typefaces
      </span>{' '}
      for the first Apple Macintosh personal computer from 1983 to 1986.
    </p>
  </Card>
);

// ---------------------------------------------------------------------------
// Checklist
// ---------------------------------------------------------------------------

const ChecklistBlock: React.FC<{
  items: { text: React.ReactNode; checked: boolean }[];
  onToggle: (idx: number) => void;
}> = ({ items, onToggle }) => (
  <Card>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item, i) => (
        <Checkbox key={i} checked={item.checked} onChange={() => onToggle(i)} label={item.text} />
      ))}
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Balance Card
// ---------------------------------------------------------------------------

const BalanceCard: React.FC = () => {
  const rows = [
    { label: 'Pending', value: '$1,240.50' },
    { label: 'Processing', value: '$320.00' },
    { label: 'Available', value: '$8,410.12' },
  ];
  return (
    <Card>
      <div style={{ fontSize: '11px', color: fg.onBaseMuted, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>
        Current Balance
      </div>
      <div
        style={{
          fontFamily: font.secondary,
          fontSize: '28px',
          fontWeight: 'var(--font-heading-weight)' as unknown as number,
          color: fg.onBase,
          marginTop: '4px',
          marginBottom: space.md,
          letterSpacing: '-0.02em',
        }}
      >
        $9,970.62
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: `1px solid ${border.neutral}`, paddingTop: space.md }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: fg.onBaseMuted }}>{r.label}</span>
            <span style={{ color: fg.onBase, fontWeight: 600 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Transaction List
// ---------------------------------------------------------------------------

interface Transaction {
  merchant: string;
  date: string;
  amount: number;
  icon: React.FC<{ size?: number }>;
  tint: string;
}

const TRANSACTIONS: Transaction[] = [
  { merchant: 'Blue Bottle Coffee', date: 'Today, 08:42', amount: -6.50, icon: Coffee, tint: bg.warningSubtle },
  { merchant: 'Acme Payroll', date: 'Yesterday', amount: 2450.00, icon: Wallet, tint: bg.successSubtle },
  { merchant: 'Vinyl Records Co.', date: 'Mar 12', amount: -42.80, icon: Music, tint: bg.accentSubtle },
  { merchant: 'Daily Provisions', date: 'Mar 10', amount: -28.15, icon: ShoppingBag, tint: bg.infoSubtle },
];

const TransactionList: React.FC = () => (
  <Card style={{ padding: 0 }}>
    <div style={{ padding: `${space.lg} ${space.lg} ${space.md}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: fg.onBase }}>Recent Transactions</div>
      <span className="cs-link" style={{ fontSize: '11px', color: fg.primary, fontWeight: 600, cursor: 'pointer' }}>
        View all
      </span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {TRANSACTIONS.map((tx, i) => {
        const Icon = tx.icon;
        const positive = tx.amount > 0;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: `10px ${space.lg}`,
              borderTop: `1px solid ${border.neutral}`,
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: radius.action,
                backgroundColor: tx.tint,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: fg.onBase,
                flexShrink: 0,
              }}
            >
              <Icon size={14} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: fg.onBase, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tx.merchant}
              </div>
              <div style={{ fontSize: '11px', color: fg.onBaseMuted, marginTop: '2px' }}>{tx.date}</div>
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: positive ? fg.success : fg.critical,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                flexShrink: 0,
              }}
            >
              {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {positive ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
            </div>
          </div>
        );
      })}
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Navigation List
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  icon: React.FC<{ size?: number }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Transactions', icon: CreditCard, badge: '12' },
  { label: 'Accounts', icon: Wallet },
  { label: 'Notifications', icon: Bell, badge: '3' },
  { label: 'Settings', icon: Settings },
];

const NavList: React.FC = () => {
  const [active, setActive] = useState('Dashboard');
  return (
    <Card style={{ padding: `${space.sm} 0` }}>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.label;
        return (
          <button
            key={item.label}
            className="cs-tree-row"
            onClick={() => setActive(item.label)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              border: 'none',
              background: isActive ? bg.primarySubtle : 'none',
              cursor: 'pointer',
              padding: `8px ${space.lg}`,
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? fg.primary : fg.onBase,
              fontFamily: 'inherit',
              transition: transition.interactive,
              textAlign: 'left',
            }}
          >
            <Icon size={14} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: radius.badge,
                  backgroundColor: isActive ? bg.primary : bg.raisedHover,
                  color: isActive ? fg.onPrimary : fg.onBaseMuted,
                }}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Donut Stat Card
// ---------------------------------------------------------------------------

const DonutStatCard: React.FC = () => {
  const progress = 0.68;
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.md }}>
        <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
          <svg width={size} height={size}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={border.neutral} strokeWidth={stroke} />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={fg.primary}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - progress)}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: transition.chart }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 'var(--font-heading-weight)' as unknown as number,
              color: fg.onBase,
              fontFamily: font.secondary,
            }}
          >
            {Math.round(progress * 100)}%
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '11px', color: fg.onBaseMuted, textTransform: 'uppercase', fontWeight: 500, letterSpacing: '0.04em' }}>
            Monthly Goal
          </div>
          <div
            style={{
              fontFamily: font.secondary,
              fontSize: '22px',
              fontWeight: 'var(--font-heading-weight)' as unknown as number,
              color: fg.onBase,
              margin: '4px 0',
              letterSpacing: '-0.02em',
            }}
          >
            $24,000
          </div>
          <div style={{ fontSize: '11px', color: fg.success, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
            <ArrowUpRight size={11} /> +12.4% vs last month
          </div>
        </div>
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Horizontal Bar Chart
// ---------------------------------------------------------------------------

const BarChartCard: React.FC = () => {
  const data = [
    { label: 'Initech', value: 3842 },
    { label: 'Hooli', value: 2540 },
    { label: 'Vandelay', value: 1910 },
    { label: 'Soylent', value: 860 },
  ];
  const max = Math.max(...data.map((d) => d.value));
  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: space.md }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: fg.onBase }}>Q2 Income</div>
        <div style={{ fontSize: '11px', color: fg.onBaseMuted }}>By client</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: fg.onBaseMuted }}>{d.label}</span>
              <span style={{ color: fg.onBase, fontWeight: 600 }}>${d.value.toLocaleString()}</span>
            </div>
            <div style={{ height: '6px', borderRadius: radius.badge, backgroundColor: bg.sunkenStrong, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(d.value / max) * 100}%`,
                  height: '100%',
                  background: bg.primary,
                  transition: transition.chart,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Empty-state CTA Card
// ---------------------------------------------------------------------------

const EmptyStateCard: React.FC<{
  icon: React.FC<{ size?: number }>;
  title: string;
  description: string;
  buttonLabel: string;
  variant?: 'primary' | 'critical';
}> = ({ icon: Icon, title, description, buttonLabel, variant = 'primary' }) => (
  <Card style={{ textAlign: 'center', padding: `${space.lg} ${space.lg}` }}>
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '999px',
        backgroundColor: variant === 'primary' ? bg.sunken : bg.criticalSubtle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center', 
        color: variant === 'primary' ? fg.onSunken : fg.onCriticalSubtle,
        margin: '0 auto',
      }}
    >
      <Icon size={18} />
    </div>
    <div
      style={{
        fontSize: '14px',
        fontWeight: 600,
        color: fg.onBase,
        marginTop: space.md,
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontSize: '12px',
        color: fg.onBaseMuted,
        marginTop: '6px',
        lineHeight: 1.5,
        maxWidth: '260px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      {description}
    </div>
    <Button variant={variant === 'primary' ? 'primary' : 'critical'} size="sm" style={{ marginTop: space.md }}>
      {buttonLabel}
    </Button>
  </Card>
);

// ---------------------------------------------------------------------------
// QR Connect Card
// ---------------------------------------------------------------------------

const QRCodeArt: React.FC<{ size?: number }> = ({ size = 140 }) => (
  <img
    src={qrcodePng.src}
    width={size}
    height={size}
    alt=""
    aria-hidden="true"
    style={{ display: 'block' }}
  />
);

const QRConnectCard: React.FC = () => (
  <Card style={{ textAlign: 'center' }}>
    <div
      style={{
        display: 'inline-block',
        padding: space.md,
        border: `1px solid ${border.neutral}`,
        borderRadius: radius.sub,
        backgroundColor: bg.base,
      }}
    >
      <QRCodeArt size={140} />
    </div>
    <div style={{ fontSize: '14px', fontWeight: 600, color: fg.onBase, marginTop: space.md }}>
      Scan to pair this device
    </div>
    <div
      style={{
        fontSize: '12px',
        color: fg.onBaseMuted,
        marginTop: '6px',
        lineHeight: 1.5,
        maxWidth: '260px',
        marginLeft: 'auto',
        marginRight: 'auto',
      }}
    >
      Open the mobile app and scan this code to link your account.
    </div>
    <Button variant="outline" size="sm" style={{ marginTop: space.md, width: '100%' }}>
      Got it
    </Button>
  </Card>
);

// ---------------------------------------------------------------------------
// Social Links Form
// ---------------------------------------------------------------------------

const SocialLinksForm: React.FC = () => (
  <Card>
    <div style={{ fontSize: '14px', fontWeight: 700, color: fg.onBase, marginBottom: space.md }}>
      Social Links
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
      <Input icon={Music2} size="sm" label="Spotify Artist URL" placeholder="spotify.com/artist/…" defaultValue="spotify.com/artist/3j…2k" />
      <Input icon={AtSign} size="sm" label="Instagram Handle" placeholder="@handle" defaultValue="@julianduryea_music" />
      <Input icon={Cloud} size="sm" label="SoundCloud URL" placeholder="soundcloud.com/username" />
      <Input icon={Globe} size="sm" label="Website" placeholder="https://yoursite.com" />
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: space.lg }}>
      <Button variant="outline" size="sm">Discard</Button>
      <Button variant="primary" size="sm">Save Changes</Button>
    </div>
  </Card>
);

// ---------------------------------------------------------------------------
// Notifications Preferences
// ---------------------------------------------------------------------------

interface NotifOption {
  key: string;
  label: string;
  description: string;
}

const NOTIF_OPTIONS: NotifOption[] = [
  { key: 'transactions', label: 'Transaction alerts', description: 'Deposits, withdrawals, and transfers.' },
  { key: 'security', label: 'Security alerts', description: 'Login attempts and account changes.' },
  { key: 'goals', label: 'Goal milestones', description: 'Updates at 25%, 50%, 75%, and 100%.' },
  { key: 'market', label: 'Market updates', description: 'Daily portfolio summary and price alerts.' },
];

const PrefCheckbox: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button
    role="checkbox"
    aria-checked={checked}
    onClick={onChange}
    style={{
      width: '16px',
      height: '16px',
      borderRadius: radius.badge,
      border: checked ? 'none' : `1.5px solid ${border.strong}`,
      backgroundColor: checked ? bg.primary : 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      flexShrink: 0,
      marginTop: '1px',
      transition: transition.interactive,
    }}
  >
    {checked && (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={fg.onPrimary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )}
  </button>
);

const NotificationsCard: React.FC = () => {
  const [selected, setSelected] = useState<Record<string, boolean>>({
    transactions: true,
    security: true,
    goals: true,
    market: false,
  });
  const allOn = NOTIF_OPTIONS.every((o) => selected[o.key]);

  const toggle = (key: string) =>
    setSelected((p) => ({ ...p, [key]: !p[key] }));
  const toggleAll = () => {
    const next = !allOn;
    setSelected(Object.fromEntries(NOTIF_OPTIONS.map((o) => [o.key, next])));
  };

  return (
    <Card>
      <div style={{ fontSize: '14px', fontWeight: 700, color: fg.onBase }}>Notifications</div>
      <div style={{ fontSize: '12px', color: fg.onBaseMuted, marginTop: '4px', marginBottom: space.lg }}>
        Choose what you want to be notified about.
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <PrefCheckbox checked={allOn} onChange={toggleAll} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: fg.onBase }}>Select all</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          marginTop: '12px',
          paddingLeft: space.md,
          borderLeft: `1px solid ${border.neutral}`,
          marginLeft: '7px',
          paddingTop: '4px',
          paddingBottom: '4px',
        }}
      >
        {NOTIF_OPTIONS.map((opt) => (
          <div key={opt.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <PrefCheckbox checked={!!selected[opt.key]} onChange={() => toggle(opt.key)} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: fg.onBase }}>{opt.label}</div>
              <div style={{ fontSize: '11px', color: fg.onBaseMuted, marginTop: '2px', lineHeight: 1.4 }}>
                {opt.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button variant="primary" size="sm" style={{ width: '100%', marginTop: space.lg }}>
        Save Preferences
      </Button>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Tabbed FAQ Card
// ---------------------------------------------------------------------------

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_TABS: Record<string, FAQItem[]> = {
  General: [
    {
      question: 'How secure is my financial data with Ledger?',
      answer:
        'We use bank-level AES-256 encryption, SOC 2 Type II certified infrastructure, and never store your credentials. All connections use read-only access tokens. We are a SEC registered investment advisor.',
    },
    { question: 'How do I connect my bank or investment accounts?', answer: 'Use the Connect button on the accounts page and follow the prompts.' },
    { question: 'Can I export my data for tax purposes?', answer: 'Yes — CSV and PDF exports are available from the Reports tab.' },
  ],
  Billing: [
    { question: 'How does billing work?', answer: 'You are billed monthly on the day you upgraded.' },
    { question: 'Can I change plans later?', answer: 'Yes, you can change or cancel at any time from Settings → Billing.' },
  ],
  Goals: [
    { question: 'How are goals tracked?', answer: 'Goals update in real time as transactions clear.' },
  ],
};

const FAQCard: React.FC = () => {
  const tabs = Object.keys(FAQ_TABS);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [openIndex, setOpenIndex] = useState(0);
  const items = FAQ_TABS[activeTab];

  return (
    <div
      style={{
        backgroundColor: bg.base,
        border: `1px solid ${border.neutral}`,
        borderRadius: radius.container,
        padding: space.md,
        transition: transition.theme,
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: bg.sunken,
          padding: '4px',
          borderRadius: radius.field,
          marginBottom: space.md,
        }}
      >
        {tabs.map((t) => {
          const active = t === activeTab;
          return (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t);
                setOpenIndex(0);
              }}
              style={{
                flex: 1,
                border: 'none',
                background: active ? bg.raised : 'transparent',
                boxShadow: active ? shadow.raised : 'none',
                color: active ? fg.onBase : fg.onBaseMuted,
                fontWeight: active ? 600 : 500,
                fontSize: '12px',
                padding: `${space.sm} ${space.lg}`,
                borderRadius: radius.field,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: transition.interactive,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div
              key={item.question}
              style={{
                backgroundColor: bg.raised,
                border: `1px solid ${border.neutral}`,
                borderRadius: radius.sub,
                overflow: 'hidden',
                transition: transition.theme,
              }}
            >
              <button
                onClick={() => setOpenIndex(open ? -1 : i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: space.md,
                  width: '100%',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: `10px ${space.lg}`,
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: fg.onBase,
                  textAlign: 'left',
                }}
              >
                <span>{item.question}</span>
                {open ? (
                  <ChevronUp size={14} style={{ color: fg.onBaseMuted, flexShrink: 0 }} />
                ) : (
                  <ChevronDown size={14} style={{ color: fg.onBaseMuted, flexShrink: 0 }} />
                )}
              </button>
              {open && (
                <div
                  style={{
                    padding: `0 ${space.lg} ${space.lg}`,
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: fg.onBaseMuted,
                  }}
                >
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button variant="outline" size="sm" style={{ width: '100%', marginTop: space.md, borderRadius: radius.field }}>
        Contact Support
      </Button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main Composed Preview
// ---------------------------------------------------------------------------

const PreviewComponents: React.FC = () => {
  const [toggleA, setToggleA] = useState(false);
  const [toggleB, setToggleB] = useState(true);
  const [checks, setChecks] = useState([
    { text: <span>Respond to comment <span className="cs-link" style={{ color: fg.primary, fontWeight: 600, cursor: 'pointer' }}>#384</span> from Travis</span>, checked: false },
    { text: <span>Invite <span className="cs-link" style={{ color: fg.primary, fontWeight: 600, cursor: 'pointer' }}>Acme Co.</span> team to Slack</span>, checked: false },
    { text: <span>Create a report <span className="cs-link" style={{ color: fg.primary, fontWeight: 600, cursor: 'pointer' }}>requested</span> by Danilo</span>, checked: false },
    { text: 'Close Q2 finances', checked: true },
    { text: 'Review invoice #3456', checked: true },
  ]);

  const handleToggleCheck = (idx: number) => {
    setChecks(prev => prev.map((c, i) => i === idx ? { ...c, checked: !c.checked } : c));
  };

  return (
    <>
      <style>{SAMPLER_STYLES}</style>
      <div
        style={{
          backgroundColor: bg.base,
          fontFamily: font.primary,
          color: fg.onBase,
          height: '100%',
          overflow: 'auto',
          transition: transition.theme,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
            gap: 32,
            padding: space.lg,
            minHeight: '100%',
            alignContent: 'start',
          }}
        >
          {/* ── Column 1: Inputs, tree, badges, toggles, user cards ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            {/* Search + Button */}
            <Section>
              <div style={{ display: 'flex', gap: space.md, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <Input icon={Search} size="sm" aria-label="Search" placeholder="Search" />
                </div>
                <Button variant="primary" size="sm">Submit</Button>
              </div>
            </Section>

            {/* Alert */}
            <Alert variant="info">Please upgrade to the new version.</Alert>

            {/* Tree View */}
            <Card style={{ padding: `${space.sm} 0` }}>
              {TREE_DATA.map((node, i) => (
                <TreeRow key={i} node={node} />
              ))}
            </Card>

            {/* Badges */}
            <div style={{ display: 'flex', gap: space.md, flexWrap: 'wrap' }}>
              <Badge variant="primary">Fully-featured</Badge>
              <Badge variant="default">Built with Trellis</Badge>
              <Badge variant="success">Open source</Badge>
              <Badge variant="warning">Beta</Badge>
              <Badge variant="critical">Critical</Badge>
            </div>

            {/* Icon Buttons + Toggles */}
            <Card style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', padding: `${space.sm} ${space.lg}` }}>
              <IconButton icon={() => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>} label="Star" active />
              <IconButton icon={() => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>} label="Bookmark" />
              <IconButton icon={() => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>} label="Settings" />
              <IconButton icon={() => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>} label="Favorite" />
              <IconButton icon={() => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>} label="Share" />
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <Toggle checked={toggleA} onChange={setToggleA} />
                <Toggle checked={toggleB} onChange={setToggleB} />
              </div>
            </Card>

            {/* Avatar Group */}
            <Card>
              <AvatarGroup />
            </Card>

            {/* User Cards */}
            <UserCard name="Emily Adams" email="emily.adams@example.com" colorIndex={0} />

            {/* Empty-state CTA */}
            <EmptyStateCard
              icon={Upload}
              title="Distribute Track"
              description="Upload your first master to start reaching listeners on Spotify, Apple Music, and more."
              buttonLabel="Create Release"
              variant="critical"
            />

            {/* Social Links form */}
            <SocialLinksForm />

            {/* Bar Chart */}
            <BarChartCard />
          </div>

          {/* ── Column 2: Balance, Toolbar, Transactions, FAQ, Sign-up ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            <BalanceCard />
            <Toolbar />
            <TransactionList />
            <FAQCard />
            <SignUpForm />
          </div>

          {/* ── Column 3: Stat, nav, avatars, rich text, checklist ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.md }}>
            {/* Donut Stat */}
            <DonutStatCard />

            {/* Checklist */}
            <ChecklistBlock items={checks} onToggle={handleToggleCheck} />

            {/* Navigation */}
            <NavList />

            {/* QR pairing */}
            <QRConnectCard />

            {/* Invite teammates CTA */}
            <EmptyStateCard
              icon={UserPlus}
              title="Invite your team"
              description="Collaborate on releases with up to five teammates on the Pro plan."
              buttonLabel="Send invites"
            />

            {/* Notifications preferences */}
            <NotificationsCard />
          </div>
        </div>
      </div>
    </>
  );
};

export default PreviewComponents;
