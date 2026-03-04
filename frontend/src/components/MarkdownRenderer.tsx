// src/components/MarkdownRenderer.tsx
interface Props { content: string; className?: string; }

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Safe inline parser — uses possessive-style character classes to avoid ReDoS
function parseInline(raw: string): string {
  let s = esc(raw);
  // Bold + italic: ***text***
  s = s.replace(/\*\*\*([^*\n]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold: **text**
  s = s.replace(/\*\*([^*\n]+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  s = s.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>');
  // Inline code: `text`
  s = s.replace(/`([^`\n]+)`/g, '<code class="md-code">$1</code>');
  // Links: [text](url)
  s = s.replace(/\[([^\]\n]+)\]\(([^)\n]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');
  return s;
}

interface Token { type: string; content: string; level?: number; }

function tokenize(content: string): Token[] {
  const lines = content.split('\n');
  const tokens: Token[] = [];
  let i = 0;
  const maxIter = lines.length * 2 + 10; // safety limit
  let iter = 0;

  while (i < lines.length && iter++ < maxIter) {
    const line = lines[i];

    // Fenced code block ```
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      let closed = false;
      while (i < lines.length) {
        if (lines[i].startsWith('```')) { i++; closed = true; break; }
        codeLines.push(lines[i]);
        i++;
      }
      tokens.push({ type: 'code', content: codeLines.join('\n') });
      continue;
    }

    // Heading # / ## / ###
    const hm = line.match(/^(#{1,3})\s+(.+)$/);
    if (hm) {
      tokens.push({ type: 'heading', level: hm[1].length, content: hm[2] });
      i++; continue;
    }

    // Horizontal rule ---
    if (/^-{3,}$/.test(line.trim())) {
      tokens.push({ type: 'hr', content: '' });
      i++; continue;
    }

    // Blockquote >
    if (line.startsWith('> ') || line === '>') {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        quoteLines.push(lines[i].startsWith('> ') ? lines[i].slice(2) : '');
        i++;
      }
      tokens.push({ type: 'blockquote', content: quoteLines.join('\n') });
      continue;
    }

    // Unordered list - / *
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ''));
        i++;
      }
      tokens.push({ type: 'ul', content: items.join('\n') });
      continue;
    }

    // Ordered list 1.
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      tokens.push({ type: 'ol', content: items.join('\n') });
      continue;
    }

    // Blank line
    if (line.trim() === '') {
      i++; continue; // skip blanks, don't emit tokens
    }

    // Paragraph — consume until a block-level element or blank line
    const paraLines: string[] = [];
    while (i < lines.length) {
      const l = lines[i];
      if (l.trim() === '') break;
      if (/^#{1,3}\s/.test(l)) break;
      if (l.startsWith('> ') || l === '>') break;
      if (/^[-*]\s/.test(l)) break;
      if (/^\d+\.\s/.test(l)) break;
      if (l.startsWith('```')) break;
      if (/^-{3,}$/.test(l.trim())) break;
      paraLines.push(l);
      i++;
    }
    if (paraLines.length > 0) {
      tokens.push({ type: 'p', content: paraLines.join(' ') });
    } else {
      // Safety: if nothing matched and i didn't advance, force advance
      i++;
    }
  }

  return tokens;
}

const hCls: Record<number, string> = {
  1: 'text-3xl font-extrabold text-[#1F2A44] mt-8 mb-3',
  2: 'text-2xl font-bold text-[#1F2A44] mt-7 mb-2',
  3: 'text-xl font-bold text-[#1F2A44] mt-5 mb-2',
};

export default function MarkdownRenderer({ content, className = '' }: Props) {
  if (!content || typeof content !== 'string' || !content.trim()) return null;

  let tokens: Token[] = [];
  try {
    tokens = tokenize(content);
  } catch (e) {
    // If tokenizer throws for any reason, just render plain text
    return <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  return (
    <div className={`md-root ${className}`}>
      <style>{`
        .md-root { color: #374151; line-height: 1.75; font-size: 1rem; }
        .md-root strong { font-weight: 700; color: #1F2A44; }
        .md-root em { font-style: italic; }
        .md-root .md-code { background: #F3F4F6; color: #E74C3C; padding: 2px 6px; border-radius: 4px; font-size: 0.85em; font-family: ui-monospace, monospace; }
        .md-root .md-link { color: #2F5BEA; text-decoration: underline; text-underline-offset: 2px; transition: color 0.15s; }
        .md-root .md-link:hover { color: #F39C12; }
      `}</style>
      {tokens.map((tok, idx) => {
        try {
          switch (tok.type) {
            case 'heading':
              return (
                <div key={idx} className={hCls[tok.level ?? 3] ?? hCls[3]}
                  dangerouslySetInnerHTML={{ __html: parseInline(tok.content) }} />
              );
            case 'hr':
              return <hr key={idx} className="my-8 border-gray-200" />;
            case 'blockquote':
              // Render blockquote lines with inline parsing only (no recursion)
              return (
                <blockquote key={idx}
                  className="border-l-4 border-[#2F5BEA] pl-5 py-2 my-5 bg-blue-50/50 rounded-r-xl italic text-gray-600">
                  {tok.content.split('\n').map((line, j) => (
                    <p key={j} dangerouslySetInnerHTML={{ __html: parseInline(line) }} />
                  ))}
                </blockquote>
              );
            case 'ul':
              return (
                <ul key={idx} className="list-disc list-outside ml-6 my-4 space-y-1.5">
                  {tok.content.split('\n').filter(Boolean).map((item, j) => (
                    <li key={j} className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
                  ))}
                </ul>
              );
            case 'ol':
              return (
                <ol key={idx} className="list-decimal list-outside ml-6 my-4 space-y-1.5">
                  {tok.content.split('\n').filter(Boolean).map((item, j) => (
                    <li key={j} className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: parseInline(item) }} />
                  ))}
                </ol>
              );
            case 'code':
              return (
                <pre key={idx} className="bg-[#1F2A44] text-green-300 rounded-2xl p-5 my-5 overflow-x-auto text-sm font-mono leading-relaxed">
                  <code>{tok.content}</code>
                </pre>
              );
            case 'p':
              return (
                <p key={idx} className="text-gray-700 leading-relaxed my-3"
                  dangerouslySetInnerHTML={{ __html: parseInline(tok.content) }} />
              );
            default:
              return null;
          }
        } catch {
          return <p key={idx} className="text-gray-700 leading-relaxed my-3">{tok.content}</p>;
        }
      })}
    </div>
  );
}