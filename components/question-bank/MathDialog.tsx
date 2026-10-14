'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { MATH_GROUPS, insertTemplate, nextPlaceholder, previewLatex, finalizeLatex, convertDigits, type DigitStyle } from '@/lib/mathTemplates';
import { latexToHtml, applyDigits } from '@/lib/mathRender';

export interface MathResult { latex: string; digits: DigitStyle; display: boolean }

interface Props {
  language: 'ar' | 'en';
  initial?: Partial<MathResult>;
  onSave: (r: MathResult) => void;
  onClose: () => void;
}

export function MathDialog({ language, initial, onSave, onClose }: Props) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const [latex, setLatex] = useState(initial?.latex || '');
  const [digits, setDigits] = useState<DigitStyle>(initial?.digits || 'en');
  const [display, setDisplay] = useState(!!initial?.display);
  const [group, setGroup] = useState(MATH_GROUPS[0].id);
  const area = useRef<HTMLTextAreaElement>(null);

  const preview = useMemo(() => latexToHtml(previewLatex(latex), display), [latex, display]);
  const previewInner = useMemo(() => ({ __html: preview.html }), [preview.html]); // ثابت عشان React 19 ما يمسحش الأرقام المحوّلة
  const previewBox = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (previewBox.current) applyDigits(previewBox.current, digits);
  }, [preview.html, digits]);

  const put = (template: string) => {
    const el = area.current;
    const r = insertTemplate(latex, el?.selectionStart ?? latex.length, el?.selectionEnd ?? latex.length, template);
    setLatex(r.text);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(r.selStart, r.selEnd);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      const el = e.currentTarget;
      const next = nextPlaceholder(latex, e.shiftKey ? el.selectionStart : el.selectionEnd, e.shiftKey);
      if (next) { e.preventDefault(); el.setSelectionRange(next.start, next.end); }
    }
    if (e.key === 'Escape') onClose();
  };

  const items = MATH_GROUPS.find((g) => g.id === group)?.items || [];
  const final = finalizeLatex(latex);

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t('محرر المعادلات', 'Equation editor')}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-auto" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-800">{t('إضافة معادلة', 'Insert equation')}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100" aria-label="close"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {MATH_GROUPS.map((g) => (
              <button key={g.id} type="button" onClick={() => setGroup(g.id)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${group === g.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {language === 'ar' ? g.ar : g.en}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5" dir="ltr">
            {items.map((it, i) => (
              <button key={i} type="button" title={it.title || it.latex} onClick={() => put(it.latex)} className="min-w-10 h-10 px-2 rounded-lg border border-slate-200 bg-white text-base hover:border-violet-400 hover:bg-violet-50">
                {it.label}
              </button>
            ))}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 flex items-center justify-between mb-1">
              <span>{t('صيغة LaTeX', 'LaTeX')}</span>
              <span className="font-normal text-slate-400">{t('Tab للانتقال بين الخانات □', 'Tab jumps between □ slots')}</span>
            </label>
            <textarea
              ref={area}
              dir="ltr"
              autoFocus
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              onKeyDown={onKeyDown}
              spellCheck={false}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-200 font-mono text-sm focus:outline-none focus:border-violet-400"
              placeholder="\frac{a}{b} + \sqrt{x}"
            />
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">{t('المعاينة', 'Preview')}</p>
            <div className={`min-h-16 p-4 rounded-xl border flex items-center justify-center overflow-x-auto ${preview.error ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`} dir="ltr" data-testid="math-preview">
              {preview.error
                ? <span className="text-xs text-red-600" dir="auto">{preview.error}</span>
                : <span key={`${digits}|${preview.html}`} ref={previewBox} dangerouslySetInnerHTML={previewInner} />}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold text-slate-600">
            <div className="flex items-center gap-2">
              <span>{t('شكل الأرقام:', 'Digits:')}</span>
              {([['en', '0 1 2'], ['ar', convertDigits('012', 'ar').split('').join(' ')], ['ar-ex', convertDigits('012', 'ar-ex').split('').join(' ')]] as [DigitStyle, string][]).map(([k, lbl]) => (
                <label key={k} className="flex items-center gap-1 cursor-pointer"><input type="radio" name="digits" checked={digits === k} onChange={() => setDigits(k)} />{lbl}</label>
              ))}
            </div>
            <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={display} onChange={(e) => setDisplay(e.target.checked)} />{t('في سطر منفصل (كبيرة)', 'Display (own line)')}</label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-lg">{t('إلغاء', 'Cancel')}</button>
          <button
            onClick={() => onSave({ latex: final, digits, display })}
            disabled={!final || !!preview.error}
            className="px-5 py-2 text-sm font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {t('إدراج', 'Insert')}
          </button>
        </div>
      </div>
    </div>
  );
}
