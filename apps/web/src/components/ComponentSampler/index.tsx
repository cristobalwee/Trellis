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
  Link as LinkIcon,
  Users,
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
  <div style={{ display: 'flex', flexDirection: 'column', gap: space.gap }}>
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
  <Card style={{ padding: `${space.ctrlY} ${space.ctrlX}`, display: 'flex', alignItems: 'center', gap: '2px', flexWrap: 'wrap' }}>
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
  <Card style={{ display: 'flex', alignItems: 'center', gap: space.gap }}>
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
        fontWeight: 700,
        color: fg.onBase,
        margin: 0,
        marginBottom: space.card,
        textAlign: 'center',
      }}
    >
      Sign up
    </h3>
    <div style={{ display: 'flex', flexDirection: 'column', gap: space.gap }}>
      <Input label="Full name" placeholder="Enter your name" />
      <Input label="Email" type="email" placeholder="Enter your email address" />
      <Input label="Password" type="password" placeholder="Enter your password" />
      <Button variant="primary" style={{ width: '100%', padding: `10px ${space.ctrlX}`, marginTop: '4px' }}>
        Create account
      </Button>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: space.gap,
        }}
      >
        <div style={{ flex: 1, height: '1px', backgroundColor: border.neutral }} />
        <span style={{ fontSize: '10px', color: fg.onBaseFaint, textTransform: 'uppercase', fontWeight: 500 }}>
          Or
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: border.neutral }} />
      </div>
      <Button variant="outline" style={{ width: '100%', padding: `10px ${space.ctrlX}` }}>
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
    <div style={{ display: 'flex', gap: space.gap, flexWrap: 'wrap' }}>
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
            gridTemplateColumns: '1fr 1.2fr 1fr',
            gap: space.gap,
            padding: space.card,
            minHeight: '100%',
            alignContent: 'start',
          }}
        >
          {/* ── Column 1: Inputs, tree, badges, toggles, user cards ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.gap }}>
            {/* Search + Button */}
            <Section>
              <div style={{ display: 'flex', gap: space.gap, alignItems: 'flex-end' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      border: `1px solid ${border.neutral}`,
                      borderRadius: radius.field,
                      padding: `${space.ctrlY} ${space.ctrlX}`,
                      backgroundColor: bg.base,
                      transition: transition.theme,
                    }}
                  >
                    <Search size={13} style={{ color: fg.onBaseFaint, flexShrink: 0 }} />
                    <input
                      aria-label="Search"
                      placeholder="Search"
                      style={{
                        border: 'none',
                        background: 'none',
                        outline: 'none',
                        fontSize: '12px',
                        color: fg.onBase,
                        fontFamily: 'inherit',
                        width: '100%',
                      }}
                    />
                  </div>
                </div>
                <Button variant="primary" size="md">Submit</Button>
              </div>
            </Section>

            {/* Alert */}
            <Alert variant="info">Please upgrade to the new version.</Alert>

            {/* Tree View */}
            <Card style={{ padding: `${space.ctrlY} 0` }}>
              {TREE_DATA.map((node, i) => (
                <TreeRow key={i} node={node} />
              ))}
            </Card>

            {/* Badges */}
            <div style={{ display: 'flex', gap: space.gap, flexWrap: 'wrap' }}>
              <Badge variant="primary">Fully-featured</Badge>
              <Badge variant="default">Built with Radix</Badge>
              <Badge variant="success">Open source</Badge>
            </div>

            {/* Icon Buttons + Toggles */}
            <Card style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', padding: `${space.ctrlY} ${space.ctrlX}` }}>
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

            {/* User Cards */}
            <UserCard name="Emily Adams" email="emily.adams@example.com" colorIndex={0} />
            <UserCard name="Emily Adams" email="emily.adams@example.com" colorIndex={1} />
          </div>

          {/* ── Column 2: Toolbar + Sign-up Form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.gap }}>
            <Toolbar />
            <SignUpForm />
          </div>

          {/* ── Column 3: Avatars, rich text, checklist ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: space.gap }}>
            {/* Avatar Group */}
            <Card>
              <AvatarGroup />
              <div style={{ marginTop: space.gap }}>
                <AvatarGroup />
              </div>
            </Card>

            {/* Rich Text */}
            <RichTextBlock />
            <RichTextBlock />

            {/* Checklist */}
            <ChecklistBlock items={checks} onToggle={handleToggleCheck} />
          </div>
        </div>
      </div>
    </>
  );
};

export default PreviewComponents;
