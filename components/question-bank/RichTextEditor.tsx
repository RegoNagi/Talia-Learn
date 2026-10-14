'use client';

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Table as TableIcon, Sigma, Type, Palette, Eraser, Plus, Trash2,
} from 'lucide-react';
import { sanitizeRichHtml, mathSpan, isSafeHref, escapeHtml } from '@/lib/richText';
import { renderMathIn, unrenderMath } from '@/lib/mathRender';
import { MathDialog, type MathResult } from './MathDialog';
import { RICH_CLASSES } from './RichContent';

export interface RichTextEditorHandle {
  insertLink: (url: string, title: string) => void;
  focus: () => void;
}

interface Props {
  /** القيمة الابتدائية (HTML). بتتحمّل تاني لما resetKey يتغير */
  initialHtml: string;
  resetKey: string | number;
  onChange: (html: string) => void;
  language: 'ar' | 'en';
  placeholder?: string;
  minHeight?: number;
  ref?: React.Ref<RichTextEditorHandle>;
}

const COLORS = ['#0f172a', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#0284c7', '#7c3aed', '#db2777'];
const SIZES: [string, string][] = [['صغير', '14px'], ['عادي', '18px'], ['كبير', '24px'], ['ضخم', '32px']];

function tbtn(active = false) {
  return `p-1.5 rounded-lg transition-colors ${active ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:text-violet-600 hover:bg-violet-50'}`;
}

export function RichTextEditor({ initialHtml, resetKey, onChange, language, placeholder, minHeight = 140, ref }: Props) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const root = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [empty, setEmpty] = useState(true);
  const [math, setMath] = useState<{ el: HTMLElement | null; initial?: Partial<MathResult> } | null>(null);
  const [panel, setPanel] = useState<null | 'color' | 'size' | 'table' | 'link'>(null);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [tbl, setTbl] = useState({ rows: 3, cols: 3 });
  const [inTable, setInTable] = useState(false);

  const serialize = useCallback((): string => {
    const el = root.current;
    if (!el) return '';
    const clone = el.cloneNode(true) as HTMLElement;
    unrenderMath(clone);
    return sanitizeRichHtml(clone.innerHTML);
  }, []);

  const emit = useCallback(() => {
    const el = root.current;
    if (!el) return;
    const html = serialize();
    setEmpty(!el.textContent?.trim() && !el.querySelector('.tl-math, table, hr'));
    onChange(html);
  }, [onChange, serialize]);

  // تحميل المحتوى الابتدائي
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    el.innerHTML = sanitizeRichHtml(initialHtml);
    renderMathIn(el);
    el.querySelectorAll<HTMLElement>('.tl-math').forEach((m) => m.setAttribute('contenteditable', 'false'));
    setEmpty(!el.textContent?.trim() && !el.querySelector('.tl-math, table, hr'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && root.current?.contains(sel.anchorNode)) savedRange.current = sel.getRangeAt(0).cloneRange();
  };
  const restoreSelection = () => {
    root.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRange.current) { sel.removeAllRanges(); sel.addRange(savedRange.current); }
  };

  const updateTableState = () => {
    const sel = window.getSelection();
    const n = sel?.anchorNode;
    const el = n && (n.nodeType === 1 ? (n as HTMLElement) : n.parentElement);
    setInTable(!!el && !!root.current?.contains(el) && !!el.closest('td,th'));
  };

  const exec = (cmd: string, value?: string) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(cmd, false, value);
    emit();
    saveSelection();
  };

  const applySize = (px: string) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand('fontSize', false, '7');
    root.current?.querySelectorAll<HTMLElement>('font[size="7"]').forEach((f) => {
      const s = document.createElement('span');
      s.style.fontSize = px;
      while (f.firstChild) s.appendChild(f.firstChild);
      f.replaceWith(s);
    });
    setPanel(null);
    emit();
  };

  const blockOfSelection = (): HTMLElement | null => {
    const sel = window.getSelection();
    let n: Node | null = sel?.anchorNode || null;
    while (n && n.parentNode !== root.current) n = n.parentNode;
    return n && n.nodeType === 1 ? (n as HTMLElement) : null;
  };

  const setDir = (dir: 'rtl' | 'ltr') => {
    restoreSelection();
    let b = blockOfSelection();
    if (!b) {
      document.execCommand('formatBlock', false, 'p');
      b = blockOfSelection();
    }
    if (b) {
      b.setAttribute('dir', dir);
      b.style.textAlign = dir === 'rtl' ? 'right' : 'left';
    }
    emit();
  };

  const insertHtmlAtCursor = (html: string) => {
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    const el = root.current;
    if (el) {
      renderMathIn(el);
      el.querySelectorAll<HTMLElement>('.tl-math').forEach((m) => m.setAttribute('contenteditable', 'false'));
    }
    emit();
  };

  const insertTable = () => {
    const r = Math.max(1, Math.min(12, tbl.rows));
    const c = Math.max(1, Math.min(8, tbl.cols));
    const head = `<tr>${'<th><br></th>'.repeat(c)}</tr>`;
    const body = `<tr>${'<td><br></td>'.repeat(c)}</tr>`.repeat(Math.max(0, r - 1));
    insertHtmlAtCursor(`<table><tbody>${head}${body}</tbody></table><p><br></p>`);
    setPanel(null);
  };

  const currentCell = (): HTMLTableCellElement | null => {
    const n = window.getSelection()?.anchorNode;
    const el = n && (n.nodeType === 1 ? (n as HTMLElement) : n.parentElement);
    return (el && root.current?.contains(el) ? (el.closest('td,th') as HTMLTableCellElement | null) : null);
  };
  const tableOp = (op: 'row' | 'col' | 'del') => {
    restoreSelection();
    const cell = currentCell();
    if (!cell) return;
    const tr = cell.parentElement as HTMLTableRowElement;
    const table = cell.closest('table') as HTMLTableElement;
    if (op === 'del') table.remove();
    else if (op === 'row') {
      const nr = document.createElement('tr');
      for (let i = 0; i < tr.cells.length; i++) { const td = document.createElement('td'); td.innerHTML = '<br>'; nr.appendChild(td); }
      tr.after(nr);
    } else {
      const idx = cell.cellIndex;
      Array.from(table.rows).forEach((row) => {
        const td = document.createElement(row.cells[idx]?.tagName === 'TH' ? 'th' : 'td');
        td.innerHTML = '<br>';
        row.cells[idx]?.after(td);
      });
    }
    emit();
    updateTableState();
  };

  const insertLinkHtml = (url: string, title: string) => {
    if (!isSafeHref(url)) return;
    insertHtmlAtCursor(`<a href="${escapeHtml(url)}">${escapeHtml(title || url)}</a>&nbsp;`);
  };

  useImperativeHandle(ref, () => ({
    insertLink: (url, title) => {
      if (!savedRange.current && root.current) {
        const r = document.createRange();
        r.selectNodeContents(root.current);
        r.collapse(false);
        savedRange.current = r;
      }
      insertLinkHtml(url, title);
    },
    focus: () => root.current?.focus(),
  }));

  const saveMath = (res: MathResult) => {
    const target = math?.el;
    if (target) {
      target.setAttribute('data-latex', res.latex);
      if (res.digits === 'en') target.removeAttribute('data-digits'); else target.setAttribute('data-digits', res.digits);
      if (res.display) target.setAttribute('data-display', '1'); else target.removeAttribute('data-display');
      renderMathIn(target.parentElement || root.current!);
      emit();
    } else {
      insertHtmlAtCursor(mathSpan(res.latex, res.digits, res.display) + '&nbsp;');
    }
    setMath(null);
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    if (html) {
      const clean = sanitizeRichHtml(html.replace(/<!--[\s\S]*?-->/g, ''));
      if (clean) { document.execCommand('insertHTML', false, clean); emit(); return; }
    }
    document.execCommand('insertText', false, text);
    emit();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && currentCell()) {
      e.preventDefault();
      const cell = currentCell()!;
      const cells = Array.from((cell.closest('table') as HTMLTableElement).querySelectorAll('td,th'));
      const i = cells.indexOf(cell);
      const nextCell = e.shiftKey ? cells[i - 1] : cells[i + 1];
      if (!nextCell && !e.shiftKey) { tableOp('row'); return; }
      if (nextCell) {
        const r = document.createRange();
        r.selectNodeContents(nextCell);
        r.collapse(false);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(r);
      }
    }
  };

  const onClick = (e: React.MouseEvent) => {
    const m = (e.target as HTMLElement).closest('.tl-math') as HTMLElement | null;
    if (m && root.current?.contains(m)) {
      setMath({
        el: m,
        initial: {
          latex: m.getAttribute('data-latex') || '',
          digits: (m.getAttribute('data-digits') as MathResult['digits']) || 'en',
          display: m.getAttribute('data-display') === '1',
        },
      });
    }
  };

  useEffect(() => {
    const h = () => updateTableState();
    document.addEventListener('selectionchange', h);
    return () => document.removeEventListener('selectionchange', h);
  }, []);

  const openPanel = (p: NonNullable<typeof panel>) => { saveSelection(); setPanel((cur) => (cur === p ? null : p)); };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl focus-within:border-violet-300 transition-colors" data-testid="rich-editor">
      <div className="flex flex-wrap items-center gap-0.5 p-2 px-3 border-b border-gray-100 bg-slate-50 rounded-t-2xl" onMouseDown={(e) => { if ((e.target as HTMLElement).closest('button')) { saveSelection(); if (!(e.target as HTMLElement).closest('input,select')) e.preventDefault(); } }}>
        <button type="button" className={tbtn()} title={t('غامق', 'Bold')} onClick={() => exec('bold')}><Bold size={16} /></button>
        <button type="button" className={tbtn()} title={t('مائل', 'Italic')} onClick={() => exec('italic')}><Italic size={16} /></button>
        <button type="button" className={tbtn()} title={t('تحته خط', 'Underline')} onClick={() => exec('underline')}><Underline size={16} /></button>
        <button type="button" className={tbtn()} title={t('يتوسطه خط', 'Strikethrough')} onClick={() => exec('strikeThrough')}><Strikethrough size={16} /></button>
        <button type="button" className={tbtn()} title={t('نص سفلي', 'Subscript')} onClick={() => exec('subscript')}><Subscript size={16} /></button>
        <button type="button" className={tbtn()} title={t('نص علوي', 'Superscript')} onClick={() => exec('superscript')}><Superscript size={16} /></button>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <div className="relative">
          <button type="button" className={tbtn(panel === 'color')} title={t('لون النص', 'Text colour')} onClick={() => openPanel('color')}><Palette size={16} /></button>
          {panel === 'color' && (
            <div className="absolute z-30 top-9 start-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-1.5">
              {COLORS.map((c) => <button key={c} type="button" aria-label={c} onClick={() => { exec('foreColor', c); setPanel(null); }} className="w-6 h-6 rounded-full border border-slate-200" style={{ background: c }} />)}
            </div>
          )}
        </div>
        <div className="relative">
          <button type="button" className={tbtn(panel === 'size')} title={t('حجم الخط', 'Font size')} onClick={() => openPanel('size')}><Type size={16} /></button>
          {panel === 'size' && (
            <div className="absolute z-30 top-9 start-0 bg-white border border-slate-200 rounded-xl shadow-lg p-1 flex flex-col min-w-24">
              {SIZES.map(([lbl, px]) => <button key={px} type="button" onClick={() => applySize(px)} className="px-3 py-1.5 text-start hover:bg-violet-50 rounded-lg" style={{ fontSize: px }}>{lbl}</button>)}
            </div>
          )}
        </div>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <button type="button" className={tbtn()} title={t('قائمة نقطية', 'Bulleted list')} onClick={() => exec('insertUnorderedList')}><List size={16} /></button>
        <button type="button" className={tbtn()} title={t('قائمة مرقمة', 'Numbered list')} onClick={() => exec('insertOrderedList')}><ListOrdered size={16} /></button>
        <button type="button" className={tbtn()} title={t('محاذاة لليسار', 'Align left')} onClick={() => exec('justifyLeft')}><AlignLeft size={16} /></button>
        <button type="button" className={tbtn()} title={t('توسيط', 'Center')} onClick={() => exec('justifyCenter')}><AlignCenter size={16} /></button>
        <button type="button" className={tbtn()} title={t('محاذاة لليمين', 'Align right')} onClick={() => exec('justifyRight')}><AlignRight size={16} /></button>
        <button type="button" className={`${tbtn()} text-[10px] font-extrabold`} title={t('اتجاه من اليمين لليسار', 'Right-to-left')} onClick={() => setDir('rtl')}>RTL</button>
        <button type="button" className={`${tbtn()} text-[10px] font-extrabold`} title={t('اتجاه من اليسار لليمين', 'Left-to-right')} onClick={() => setDir('ltr')}>LTR</button>
        <span className="w-px h-5 bg-slate-200 mx-1" />
        <div className="relative">
          <button type="button" className={tbtn(panel === 'link')} title={t('رابط', 'Link')} onClick={() => openPanel('link')}><LinkIcon size={16} /></button>
          {panel === 'link' && (
            <div className="absolute z-30 top-9 start-0 bg-white border border-slate-200 rounded-xl shadow-lg p-2 flex gap-2 items-center w-72" onMouseDown={(e) => e.stopPropagation()}>
              <input dir="ltr" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} className="flex-1 h-8 px-2 text-xs border border-slate-200 rounded-lg" aria-label="url" />
              <button type="button" disabled={!isSafeHref(linkUrl)} onClick={() => { const sel = window.getSelection()?.toString(); if (sel) { exec('createLink', linkUrl); } else insertLinkHtml(linkUrl, linkUrl); setPanel(null); }} className="px-2 h-8 text-xs font-bold bg-violet-600 text-white rounded-lg disabled:opacity-40">{t('إدراج', 'Add')}</button>
            </div>
          )}
        </div>
        <div className="relative">
          <button type="button" className={tbtn(panel === 'table')} title={t('جدول', 'Table')} onClick={() => openPanel('table')}><TableIcon size={16} /></button>
          {panel === 'table' && (
            <div className="absolute z-30 top-9 start-0 bg-white border border-slate-200 rounded-xl shadow-lg p-3 flex items-center gap-2 text-xs font-bold text-slate-600" onMouseDown={(e) => e.stopPropagation()}>
              <label className="flex items-center gap-1">{t('صفوف', 'Rows')}<input type="number" min={1} max={12} value={tbl.rows} onChange={(e) => setTbl((s) => ({ ...s, rows: Number(e.target.value) }))} className="w-14 h-8 px-2 border border-slate-200 rounded-lg" /></label>
              <label className="flex items-center gap-1">{t('أعمدة', 'Cols')}<input type="number" min={1} max={8} value={tbl.cols} onChange={(e) => setTbl((s) => ({ ...s, cols: Number(e.target.value) }))} className="w-14 h-8 px-2 border border-slate-200 rounded-lg" /></label>
              <button type="button" onClick={insertTable} className="px-3 h-8 bg-violet-600 text-white rounded-lg">{t('إدراج', 'Insert')}</button>
            </div>
          )}
        </div>
        <button type="button" className={tbtn()} title={t('معادلة', 'Equation')} onClick={() => { saveSelection(); setMath({ el: null }); }} data-testid="btn-math"><Sigma size={16} /></button>
        <button type="button" className={tbtn()} title={t('مسح التنسيق', 'Clear formatting')} onClick={() => exec('removeFormat')}><Eraser size={16} /></button>
        {inTable && (
          <>
            <span className="w-px h-5 bg-slate-200 mx-1" />
            <button type="button" className={`${tbtn()} flex items-center gap-0.5 text-[11px] font-bold`} onClick={() => tableOp('row')}><Plus size={12} />{t('صف', 'Row')}</button>
            <button type="button" className={`${tbtn()} flex items-center gap-0.5 text-[11px] font-bold`} onClick={() => tableOp('col')}><Plus size={12} />{t('عمود', 'Col')}</button>
            <button type="button" className={`${tbtn()} text-red-500`} title={t('حذف الجدول', 'Delete table')} onClick={() => tableOp('del')}><Trash2 size={14} /></button>
          </>
        )}
      </div>

      <div
        ref={root}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder || t('نص السؤال', 'Question text')}
        dir="auto"
        data-placeholder={placeholder}
        data-empty={empty ? 'true' : 'false'}
        onInput={emit}
        onBlur={() => { saveSelection(); emit(); }}
        onKeyUp={() => { saveSelection(); updateTableState(); }}
        onMouseUp={() => { saveSelection(); updateTableState(); }}
        onClick={onClick}
        onPaste={onPaste}
        onKeyDown={onKeyDown}
        style={{ minHeight }}
        className={`w-full p-4 text-xl font-bold text-slate-800 outline-none data-[empty=true]:before:content-[attr(data-placeholder)] data-[empty=true]:before:text-slate-300 data-[empty=true]:before:pointer-events-none data-[empty=true]:before:absolute relative ${RICH_CLASSES}`}
      />

      {math && <MathDialog language={language} initial={math.initial} onSave={saveMath} onClose={() => setMath(null)} />}
    </div>
  );
}
