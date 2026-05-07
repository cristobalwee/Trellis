import React from 'react';

/**
 * Lightweight token-aware syntax highlighter for the export-page previews.
 *
 * Supports CSS, JSON, JavaScript/TypeScript, and Markdown. Returns a stream of
 * `<div>` lines preserving the original whitespace so users can copy the
 * output back out as valid source.
 *
 * Originally lived in ExportDialog.tsx; extracted here so both the (now
 * retired) dialog and the new dedicated export page can share the renderer.
 */

export type Lang = 'css' | 'json' | 'js' | 'md';

const MD_COLORS = {
  heading:  'text-slate-900 font-semibold',
  bullet:   'text-slate-400',
  code:     'text-indigo-700',
  fence:    'text-slate-400',
  link:     'text-forest-green underline decoration-forest-green/40',
  plain:    'text-slate-700',
};

const COLORS = {
  comment:   'text-emerald-700/70 italic',
  selector:  'text-rose-600',
  property:  'text-indigo-700 font-medium',
  value:     'text-slate-800',
  colorVal:  'text-amber-700 font-medium',
  number:    'text-amber-700',
  string:    'text-emerald-700',
  key:       'text-indigo-700 font-medium',
  keyword:   'text-rose-600',
  punct:     'text-slate-400',
  plain:     'text-slate-700',
};

function fenceLangFor(lang: string): Lang {
  const l = lang.toLowerCase();
  if (l === 'json') return 'json';
  if (l === 'js' || l === 'javascript' || l === 'ts' || l === 'typescript' || l === 'tsx') return 'js';
  return 'css';
}

function isColorLiteral(v: string): boolean {
  const t = v.trim().replace(/;$/, '');
  return /^#[0-9a-f]{3,8}$/i.test(t)
    || /^(rgb|rgba|hsl|hsla|oklch|lch|lab)\(/i.test(t)
    || /^linear-gradient\(/i.test(t);
}

function renderMdInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let i = 0;
  let idx = 0;
  const re = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > i) {
      parts.push(<span key={`p${idx++}`} className={MD_COLORS.plain}>{text.slice(i, m.index)}</span>);
    }
    if (m[1] !== undefined) {
      parts.push(<span key={`c${idx++}`} className={MD_COLORS.code}>{`\`${m[1]}\``}</span>);
    } else {
      parts.push(
        <span key={`l${idx++}`} className={MD_COLORS.link}>{`[${m[2]}](${m[3]})`}</span>,
      );
    }
    i = m.index + m[0].length;
  }
  if (i < text.length) {
    parts.push(<span key={`p${idx++}`} className={MD_COLORS.plain}>{text.slice(i)}</span>);
  }
  return <>{parts}</>;
}

function renderMdPlain(line: string, key: number): React.ReactNode {
  const trimmed = line.trimStart();
  if (trimmed === '') return <div key={key}>&nbsp;</div>;
  if (/^#{1,6}\s/.test(trimmed)) {
    return <div key={key}><span className={MD_COLORS.heading}>{line}</span></div>;
  }
  const bulletMatch = line.match(/^(\s*)([-*])\s+(.*)$/);
  if (bulletMatch) {
    const [, lead, marker, rest] = bulletMatch;
    return (
      <div key={key}>
        {lead}
        <span className={MD_COLORS.bullet}>{marker}</span>
        {' '}
        {renderMdInline(rest)}
      </div>
    );
  }
  return <div key={key}>{renderMdInline(line)}</div>;
}

function renderCssLine(line: string, key: number): React.ReactNode {
  const trimmed = line.trim();
  if (trimmed === '') return <div key={key}>&nbsp;</div>;
  if (trimmed.startsWith('/*')) {
    return <div key={key}><span className={COLORS.comment}>{line}</span></div>;
  }
  if (trimmed === '}') {
    const leading = line.match(/^\s*/)?.[0] ?? '';
    return <div key={key}>{leading}<span className={COLORS.punct}>{'}'}</span></div>;
  }
  if (/\{\s*$/.test(trimmed)) {
    const leading = line.match(/^\s*/)?.[0] ?? '';
    const sel = trimmed.replace(/\s*\{\s*$/, '');
    return (
      <div key={key}>
        {leading}
        <span className={COLORS.selector}>{sel}</span>{' '}
        <span className={COLORS.punct}>{'{'}</span>
      </div>
    );
  }
  const m = line.match(/^(\s*)(--[A-Za-z0-9-]+)(\s*:\s*)(.+?)(;?)\s*$/);
  if (m) {
    const [, lead, prop, colon, value, semi] = m;
    const valClass = isColorLiteral(value) ? COLORS.colorVal : COLORS.value;
    return (
      <div key={key}>
        {lead}
        <span className={COLORS.property}>{prop}</span>
        <span className={COLORS.punct}>{colon}</span>
        <span className={valClass}>{value}</span>
        <span className={COLORS.punct}>{semi}</span>
      </div>
    );
  }
  return <div key={key}><span className={COLORS.plain}>{line}</span></div>;
}

function renderJsonValue(value: string): React.ReactNode {
  const v = value.trim();
  if (v === '{' || v === '[' || v === '{}' || v === '[]') {
    return <span className={COLORS.punct}>{value}</span>;
  }
  if (v.startsWith('"') && v.endsWith('"')) {
    const inner = v.slice(1, -1);
    if (isColorLiteral(inner)) {
      return <span className={COLORS.colorVal}>{value}</span>;
    }
    return <span className={COLORS.string}>{value}</span>;
  }
  if (/^-?\d/.test(v)) return <span className={COLORS.number}>{value}</span>;
  if (v === 'true' || v === 'false' || v === 'null') {
    return <span className={COLORS.keyword}>{value}</span>;
  }
  return <span className={COLORS.value}>{value}</span>;
}

function renderJsonLine(line: string, key: number): React.ReactNode {
  const kv = line.match(/^(\s*)("(?:[^"\\]|\\.)*")(\s*:\s*)(.+?)(,?)\s*$/);
  if (kv) {
    const [, lead, keyStr, colon, value, comma] = kv;
    return (
      <div key={key}>
        {lead}
        <span className={COLORS.key}>{keyStr}</span>
        <span className={COLORS.punct}>{colon}</span>
        {renderJsonValue(value)}
        <span className={COLORS.punct}>{comma}</span>
      </div>
    );
  }
  const leading = line.match(/^\s*/)?.[0] ?? '';
  const rest = line.slice(leading.length);
  return <div key={key}>{leading}<span className={COLORS.punct}>{rest}</span></div>;
}

function renderJsRest(rest: string): React.ReactNode {
  const commaMatch = rest.match(/,\s*$/);
  const hasComma = !!commaMatch;
  const body = hasComma ? rest.slice(0, commaMatch!.index) : rest;
  const trimmed = body.trim();

  let content: React.ReactNode;
  if (trimmed === '{' || trimmed === '[' || trimmed === '{}' || trimmed === '[]') {
    content = <span className={COLORS.punct}>{body}</span>;
  } else if (/^'(.*)'$/.test(trimmed) || /^"(.*)"$/.test(trimmed)) {
    const inner = trimmed.slice(1, -1);
    content = (
      <span className={isColorLiteral(inner) ? COLORS.colorVal : COLORS.string}>{body}</span>
    );
  } else if (/^-?\d/.test(trimmed)) {
    content = <span className={COLORS.number}>{body}</span>;
  } else {
    content = <span className={COLORS.value}>{body}</span>;
  }

  return (
    <>
      {content}
      {hasComma && <span className={COLORS.punct}>,</span>}
    </>
  );
}

function renderJsLine(line: string, key: number): React.ReactNode {
  const trimmed = line.trim();
  if (trimmed.startsWith('/*') || trimmed.startsWith('//') || trimmed.startsWith('*')) {
    return <div key={key}><span className={COLORS.comment}>{line}</span></div>;
  }
  const kv = line.match(/^(\s*)('[^']+'|"[^"]+"|[A-Za-z_][A-Za-z0-9_]*)(\s*:\s*)(.*)$/);
  if (kv) {
    const [, lead, k, colon, rest] = kv;
    return (
      <div key={key}>
        {lead}
        <span className={COLORS.key}>{k}</span>
        <span className={COLORS.punct}>{colon}</span>
        {renderJsRest(rest)}
      </div>
    );
  }
  if (/^(export|default|import|from|const|let|var)\b/.test(trimmed)) {
    const leading = line.match(/^\s*/)?.[0] ?? '';
    return (
      <div key={key}>
        {leading}
        <span className={COLORS.keyword}>{trimmed}</span>
      </div>
    );
  }
  return <div key={key}><span className={COLORS.plain}>{line}</span></div>;
}

function renderByLang(line: string, key: number, lang: Lang): React.ReactNode {
  switch (lang) {
    case 'json': return renderJsonLine(line, key);
    case 'js':   return renderJsLine(line, key);
    case 'md':   return renderMdPlain(line, key);
    default:     return renderCssLine(line, key);
  }
}

function highlightMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let inFence = false;
  let fenceLang: Lang = 'css';

  lines.forEach((line, i) => {
    const fence = line.match(/^(\s*)```(\S*)\s*$/);
    if (fence) {
      if (!inFence) {
        inFence = true;
        fenceLang = fenceLangFor(fence[2]);
      } else {
        inFence = false;
      }
      out.push(<div key={i}><span className={MD_COLORS.fence}>{line}</span></div>);
      return;
    }
    if (inFence) {
      out.push(
        <React.Fragment key={i}>{renderByLang(line, i, fenceLang)}</React.Fragment>,
      );
      return;
    }
    out.push(<React.Fragment key={i}>{renderMdPlain(line, i)}</React.Fragment>);
  });
  return out;
}

export function highlight(text: string, lang: Lang): React.ReactNode {
  if (lang === 'md') return highlightMarkdown(text);
  const lines = text.split('\n');
  return lines.map((line, i) => renderByLang(line, i, lang));
}
