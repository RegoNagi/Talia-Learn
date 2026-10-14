import katex from 'katex';
import 'katex/contrib/mhchem';
import { convertDigits, type DigitStyle } from './mathTemplates';

const KATEX_OPTS = { throwOnError: false, strict: false, trust: false, maxSize: 20, maxExpand: 500, output: 'htmlAndMathml' as const };

/** HTML جاهز لمعاينة معادلة. بيرجع { error } لو الصيغة غلط */
export function latexToHtml(latex: string, display = false): { html: string; error: string | null } {
  try {
    const html = katex.renderToString(latex || '\\ ', { ...KATEX_OPTS, throwOnError: true, displayMode: display });
    return { html, error: null };
  } catch (e) {
    return { html: '', error: e instanceof Error ? e.message.replace(/^KaTeX parse error:\s*/, '') : 'error' };
  }
}

export function applyDigits(el: HTMLElement, style: DigitStyle) {
  if (style === 'en') return;
  const root = el.querySelector('.katex-html');
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const v = n.nodeValue || '';
    if (/[0-9]/.test(v)) n.nodeValue = convertDigits(v, style);
  }
}

/** بيرسم كل span.tl-math جوه عنصر (بعد ما HTML اتحط) */
export function renderMathIn(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('span.tl-math').forEach((el) => {
    const latex = el.getAttribute('data-latex') || '';
    try {
      katex.render(latex, el, { ...KATEX_OPTS, displayMode: el.getAttribute('data-display') === '1' });
      const d = el.getAttribute('data-digits');
      if (d === 'ar' || d === 'ar-ex') applyDigits(el, d);
    } catch {
      el.textContent = `$${latex}$`;
    }
  });
}

/** الرجوع بالمعادلات لشكلها المخزّن (قبل الحفظ) */
export function unrenderMath(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('span.tl-math').forEach((el) => {
    el.textContent = `$${el.getAttribute('data-latex') || ''}$`;
    el.removeAttribute('contenteditable');
  });
}
