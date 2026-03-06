// src/components/MarkdownRenderer.tsx
// Lightweight markdown renderer — no external dependencies

import { useMemo } from 'react';

interface Props {
  content: string;
  className?: string;
}

// ─── Inline parser ────────────────────────────────────────────────────────────
function parseInline(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  // Patterns: **bold**, *italic*, `code`, ~~strike~~, [text](url)
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|~~(.+?)~~|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) result.push(text.slice(last, match.index));

    if (match[2] !== undefined)
      result.push(<strong key={match.index} className="font-bold text-[#1F2A44]">{match[2]}</strong>);
    else if (match[3] !== undefined)
      result.push(<em key={match.index} className="italic">{match[3]}</em>);
    else if (match[4] !== undefined)
      result.push(<code key={match.index} className="bg-gray-100 text-[#E74C3C] text-[0.875em] px-1.5 py-0.5 rounded font-mono">{match[4]}</code>);
    else if (match[5] !== undefined)
      result.push(<del key={match.index} className="line-through text-gray-400">{match[5]}</del>);
    else if (match[6] !== undefined && match[7] !== undefined)
      result.push(<a key={match.index} href={match[7]} target="_blank" rel="noopener noreferrer" className="text-[#2F5BEA] hover:underline">{match[6]}</a>);

    last = match.index + match[0].length;
  }

  if (last < text.length) result.push(text.slice(last));
  return result;
}

// ─── Block parser ─────────────────────────────────────────────────────────────
function parseBlocks(markdown: string): React.ReactNode[] {
  const lines = markdown.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === '') { i++; continue; }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      const level = h[1].length;
      const text = parseInline(h[2]);
      const cls: Record<number, string> = {
        1: 'text-3xl font-extrabold text-[#1F2A44] mt-8 mb-3',
        2: 'text-2xl font-bold text-[#1F2A44] mt-7 mb-3',
        3: 'text-xl font-bold text-[#1F2A44] mt-6 mb-2',
        4: 'text-lg font-semibold text-[#1F2A44] mt-5 mb-2',
        5: 'text-base font-semibold text-[#1F2A44] mt-4 mb-1',
        6: 'text-sm font-semibold text-gray-600 mt-4 mb-1',
      };
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      nodes.push(<Tag key={i} className={cls[level]}>{text}</Tag>);
      i++; continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      nodes.push(<hr key={i} className="border-gray-200 my-6" />);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      nodes.push(
        <blockquote key={i} className="border-l-4 border-[#2F5BEA] pl-4 my-4 text-gray-600 italic bg-[#2F5BEA]/5 py-2 rounded-r-lg">
          {quoteLines.map((l, j) => <p key={j}>{parseInline(l)}</p>)}
        </blockquote>
      );
      continue;
    }

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      nodes.push(
        <div key={i} className="my-4 rounded-xl overflow-hidden border border-gray-200">
          {lang && <div className="bg-gray-800 text-gray-400 text-xs px-4 py-1.5 font-mono">{lang}</div>}
          <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm font-mono leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(
          <li key={i} className="flex items-start gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#2F5BEA] flex-shrink-0" />
            <span>{parseInline(lines[i].replace(/^[-*+]\s/, ''))}</span>
          </li>
        );
        i++;
      }
      nodes.push(<ul key={i} className="my-4 space-y-1.5 text-gray-700">{items}</ul>);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i} className="flex items-start gap-2">
            <span className="mt-0.5 w-5 h-5 rounded-full bg-[#2F5BEA]/10 text-[#2F5BEA] text-xs font-bold flex items-center justify-center flex-shrink-0">{num}</span>
            <span>{parseInline(lines[i].replace(/^\d+\.\s/, ''))}</span>
          </li>
        );
        i++; num++;
      }
      nodes.push(<ol key={i} className="my-4 space-y-1.5 text-gray-700">{items}</ol>);
      continue;
    }

    // Table (| col | col |)
    if (line.startsWith('|') && i + 1 < lines.length && lines[i + 1].match(/^\|[-| :]+\|/)) {
      const headers = line.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(h => h.trim());
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim()));
        i++;
      }
      nodes.push(
        <div key={i} className="my-5 overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-[#F5F7FA]">
              <tr>{headers.map((h, j) => <th key={j} className="px-4 py-2.5 text-left font-semibold text-[#1F2A44] text-xs uppercase tracking-wider border-b border-gray-200">{parseInline(h)}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-gray-50">
                  {row.map((cell, ci) => <td key={ci} className="px-4 py-2.5 text-gray-700">{parseInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Paragraph — collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].startsWith('> ') &&
      !lines[i].startsWith('```') &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !lines[i].startsWith('|') &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      // Join with <br> for hard line breaks within a paragraph
      const content = paraLines.reduce<React.ReactNode[]>((acc, l, idx) => {
        const parsed = parseInline(l);
        if (idx > 0) acc.push(<br key={`br-${idx}`} />);
        return acc.concat(parsed);
      }, []);
      nodes.push(<p key={i} className="my-3 text-gray-700 leading-relaxed">{content}</p>);
    }
  }

  return nodes;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MarkdownRenderer({ content, className = '' }: Props) {
  const nodes = useMemo(() => parseBlocks(content || ''), [content]);

  return (
    <div className={`markdown-body text-base ${className}`}>
      {nodes}
    </div>
  );
}