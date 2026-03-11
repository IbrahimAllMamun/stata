// src/components/MarkdownEditor.tsx
import { useRef, useState, useEffect, useCallback, Component } from 'react';
import type { ReactNode } from 'react';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Link2, Quote, Code2, Minus } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
}

// Debounce preview updates so large pastes don't freeze
function useDebounced<T>(value: T, delay = 150): T {
  const [dv, setDv] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return dv;
}

// Error boundary - catches renderer crashes without killing the whole editor
class PreviewBoundary extends Component<{ children: ReactNode }, { err: boolean }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { err: false }; }
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch() { /* silently recover */ }
  render() {
    if (this.state.err) return (
      <p className="text-sm text-gray-400 italic px-1">Preview unavailable for this content.</p>
    );
    return this.props.children;
  }
}

export default function MarkdownEditor({ value, onChange, placeholder = 'Write in Markdown...', minRows = 14 }: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const previewValue = useDebounced(value, 120);

  const wrap = useCallback((before: string, after: string, sample = 'text') => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const selected = value.slice(s, e) || sample;
    const next = value.slice(0, s) + before + selected + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = s + before.length;
      ta.selectionEnd = s + before.length + selected.length;
    });
  }, [value, onChange]);

  const prefix = useCallback((pfx: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const lineStart = value.lastIndexOf('\n', s - 1) + 1;
    let next: string;
    let newCursor: number;
    if (value.slice(lineStart, lineStart + pfx.length) === pfx) {
      next = value.slice(0, lineStart) + value.slice(lineStart + pfx.length);
      newCursor = Math.max(lineStart, s - pfx.length);
    } else {
      next = value.slice(0, lineStart) + pfx + value.slice(lineStart);
      newCursor = s + pfx.length;
    }
    onChange(next);
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = newCursor; });
  }, [value, onChange]);

  const insertHr = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const insert = '\n\n---\n\n';
    onChange(value.slice(0, s) + insert + value.slice(s));
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = s + insert.length; });
  }, [value, onChange]);

  const btnCls = 'p-1.5 rounded-lg text-gray-400 hover:text-[#2F5BEA] hover:bg-blue-50 transition-colors flex items-center justify-center';
  const sep = <div className="w-px h-5 bg-gray-200 mx-0.5" />;
  const minH = `${minRows * 1.625}rem`;

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-3 py-2 bg-gray-50 border-b border-gray-100">
        <button type="button" title="Bold" onClick={() => wrap('**', '**', 'bold')} className={btnCls}><Bold className="w-4 h-4" /></button>
        <button type="button" title="Italic" onClick={() => wrap('*', '*', 'italic')} className={btnCls}><Italic className="w-4 h-4" /></button>
        {sep}
        <button type="button" title="Heading 2" onClick={() => prefix('## ')} className={btnCls}><Heading2 className="w-4 h-4" /></button>
        <button type="button" title="Heading 3" onClick={() => prefix('### ')} className={btnCls}><Heading3 className="w-4 h-4" /></button>
        {sep}
        <button type="button" title="Bullet list" onClick={() => prefix('- ')} className={btnCls}><List className="w-4 h-4" /></button>
        <button type="button" title="Numbered list" onClick={() => prefix('1. ')} className={btnCls}><ListOrdered className="w-4 h-4" /></button>
        {sep}
        <button type="button" title="Blockquote" onClick={() => prefix('> ')} className={btnCls}><Quote className="w-4 h-4" /></button>
        <button type="button" title="Inline code" onClick={() => wrap('`', '`', 'code')} className={btnCls}><Code2 className="w-4 h-4" /></button>
        <button type="button" title="Divider" onClick={insertHr} className={btnCls}><Minus className="w-4 h-4" /></button>
        <button type="button" title="Link" onClick={() => wrap('[', '](https://)', 'link text')} className={btnCls}><Link2 className="w-4 h-4" /></button>
        <span className="ml-auto text-[11px] text-gray-300 font-mono hidden sm:block select-none">Markdown</span>
      </div>

      {/* Split: write | preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Write pane */}
        <div className="flex flex-col">
          <div className="px-3 py-1 bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">Write</div>
          <textarea
            ref={taRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 font-mono text-sm text-gray-800 leading-relaxed resize-none outline-none bg-white placeholder-gray-300"
            style={{ minHeight: minH }}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        {/* Preview pane */}
        <div className="flex flex-col">
          <div className="px-3 py-1 bg-gray-50/80 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">Preview</div>
          <div className="flex-1 px-4 py-3 overflow-y-auto" style={{ minHeight: minH }}>
            <PreviewBoundary key={previewValue.slice(0, 50)}>
              {previewValue.trim()
                ? <MarkdownRenderer content={previewValue} />
                : <p className="text-gray-300 text-sm italic select-none mt-1">Preview will appear here…</p>
              }
            </PreviewBoundary>
          </div>
        </div>
      </div>

      {/* Cheatsheet footer */}
      <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 flex flex-wrap gap-x-3 gap-y-0.5 select-none">
        {['**bold**', '*italic*', '## Heading', '- list', '`code`', '> quote', '[text](url)', '---'].map(s => (
          <span key={s} className="font-mono">{s}</span>
        ))}
      </div>
    </div>
  );
}