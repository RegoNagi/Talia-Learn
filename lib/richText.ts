/**
 * تنظيف HTML المحرر الغني (whitelist).
 * ده أمني: نص السؤال بيتكتب عند المعلم وبيتعرض عند الطالب وعند المراجع،
 * فأي وسم أو خاصية مش في القائمة البيضاء بتتشال. مفيش DOM هنا عشان الكود يشتغل في السيرفر والمتصفح والاختبارات.
 */

const VOID_TAGS = new Set(['br', 'hr', 'col']);
const ALLOWED_TAGS = new Set([
  'p', 'div', 'br', 'hr', 'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup', 'span',
  'ul', 'ol', 'li', 'a', 'h3', 'h4', 'blockquote',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
]);
// المحتوى بتاع الوسوم دي بيتشال بالكامل مش بس الوسم
const DROP_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'noscript', 'template', 'svg', 'math', 'title', 'head', 'textarea', 'select', 'form', 'button']);

export const MAX_RICH_HTML = 60_000;
export const MAX_LATEX_LENGTH = 600;

type Token =
  | { type: 'text'; value: string }
  | { type: 'open'; name: string; attrs: Record<string, string>; selfClose: boolean }
  | { type: 'close'; name: string };

function decodeAttr(v: string): string {
  return v
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeFromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeFromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&apos;/gi, "'").replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');
}

function safeFromCodePoint(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return '';
  return String.fromCodePoint(n);
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** نص عادي: بيحافظ على الكيانات الصحيحة (&amp; …) وبيهرّب أي & تانية */
function escapeText(s: string): string {
  return s
    .replace(/&(?!(?:#\d{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,10});)/gi, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseAttrs(src: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const name = m[1].toLowerCase();
    if (!(name in attrs)) attrs[name] = decodeAttr(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let text = '';
  const flush = () => { if (text) { tokens.push({ type: 'text', value: text }); text = ''; } };
  while (i < html.length) {
    const ch = html[i];
    if (ch !== '<') { text += ch; i++; continue; }
    if (html.startsWith('<!--', i)) {
      const end = html.indexOf('-->', i + 4);
      i = end === -1 ? html.length : end + 3;
      continue;
    }
    const next = html[i + 1] || '';
    if (next === '!' || next === '?') { // doctype / processing instruction
      const end = html.indexOf('>', i);
      i = end === -1 ? html.length : end + 1;
      continue;
    }
    if (!/[a-zA-Z\/]/.test(next)) { text += '<'; i++; continue; }
    // اقرأ الوسم لحد ">" مع احترام علامات التنصيص
    let j = i + 1;
    let quote = '';
    while (j < html.length) {
      const c = html[j];
      if (quote) { if (c === quote) quote = ''; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') break;
      j++;
    }
    if (j >= html.length) { text += html.slice(i).replace(/</g, '&lt;'); i = html.length; break; }
    const inner = html.slice(i + 1, j);
    i = j + 1;
    if (inner.startsWith('/')) {
      const nm = inner.slice(1).trim().split(/\s/)[0].toLowerCase();
      if (/^[a-z][a-z0-9-]*$/.test(nm)) { flush(); tokens.push({ type: 'close', name: nm }); }
      continue;
    }
    const mm = /^([a-zA-Z][a-zA-Z0-9-]*)([\s\S]*)$/.exec(inner);
    if (!mm) continue;
    const name = mm[1].toLowerCase();
    const rest = mm[2];
    flush();
    tokens.push({ type: 'open', name, attrs: parseAttrs(rest.replace(/\/\s*$/, '')), selfClose: /\/\s*$/.test(rest) || VOID_TAGS.has(name) });
  }
  flush();
  return tokens;
}

// ---------- CSS ----------
const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)|[a-z]{3,20})$/i;

function cleanStyle(style: string): string {
  const out: string[] = [];
  for (const decl of style.split(';')) {
    const idx = decl.indexOf(':');
    if (idx < 0) continue;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const val = decl.slice(idx + 1).trim();
    if (!val || /[\\<>(]/.test(val.replace(/^rgba?\([^)]*\)$/i, ''))) continue; // مفيش url() ولا expression ولا escapes
    switch (prop) {
      case 'color':
      case 'background-color':
        if (COLOR_RE.test(val) && !/^(inherit|initial|unset|expression)$/i.test(val)) out.push(`${prop}:${val}`);
        break;
      case 'font-size': {
        const m = /^(\d{1,3}(?:\.\d+)?)(px|em|rem|%)$/.exec(val);
        if (m) {
          const n = parseFloat(m[1]);
          const ok = m[2] === 'px' ? n >= 8 && n <= 72 : m[2] === '%' ? n >= 50 && n <= 400 : n >= 0.5 && n <= 4;
          if (ok) out.push(`font-size:${val}`);
        }
        break;
      }
      case 'text-align':
        if (/^(left|right|center|justify|start|end)$/i.test(val)) out.push(`text-align:${val.toLowerCase()}`);
        break;
      case 'direction':
        if (/^(rtl|ltr)$/i.test(val)) out.push(`direction:${val.toLowerCase()}`);
        break;
      case 'font-weight':
        if (/^(normal|bold|[1-9]00)$/i.test(val)) out.push(`font-weight:${val.toLowerCase()}`);
        break;
      case 'font-style':
        if (/^(normal|italic)$/i.test(val)) out.push(`font-style:${val.toLowerCase()}`);
        break;
      case 'text-decoration':
      case 'text-decoration-line':
        if (/^(none|underline|line-through|underline line-through|line-through underline)$/i.test(val)) out.push(`text-decoration:${val.toLowerCase()}`);
        break;
      default:
        break;
    }
  }
  return out.join(';');
}

export function isSafeHref(href: string): boolean {
  const h = href.trim().replace(/[\u0000-\u001f\u007f\s]+/g, '');
  return /^(https?:\/\/|mailto:)/i.test(h) && h.length <= 2000;
}

const MATH_DIGITS = new Set(['en', 'ar', 'ar-ex']);

function cleanAttrs(tag: string, attrs: Record<string, string>): string {
  const parts: string[] = [];
  const add = (k: string, v: string) => parts.push(`${k}="${escapeHtml(v)}"`);

  if ('dir' in attrs && /^(rtl|ltr|auto)$/i.test(attrs.dir)) add('dir', attrs.dir.toLowerCase());
  if (attrs.style) {
    const s = cleanStyle(attrs.style);
    if (s) add('style', s);
  }
  if (tag === 'a') {
    if (attrs.href && isSafeHref(attrs.href)) {
      add('href', attrs.href.trim());
      add('target', '_blank');
      add('rel', 'noopener noreferrer nofollow');
    }
  }
  if (tag === 'td' || tag === 'th') {
    for (const k of ['colspan', 'rowspan']) {
      const v = attrs[k];
      if (v && /^\d{1,2}$/.test(v) && +v >= 1 && +v <= 30) add(k, v);
    }
  }
  if (tag === 'span' && /(^|\s)tl-math(\s|$)/.test(attrs.class || '') && typeof attrs['data-latex'] === 'string') {
    const latex = attrs['data-latex'].slice(0, MAX_LATEX_LENGTH);
    add('class', 'tl-math');
    add('data-latex', latex);
    if (attrs['data-digits'] && MATH_DIGITS.has(attrs['data-digits'])) add('data-digits', attrs['data-digits']);
    if (attrs['data-display'] === '1') add('data-display', '1');
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}

/** يرجّع HTML نضيف. أي مدخل غير نصي بيرجّع '' */
export function sanitizeRichHtml(input: unknown, maxLength: number = MAX_RICH_HTML): string {
  if (typeof input !== 'string' || !input) return '';
  const tokens = tokenize(input.length > maxLength * 2 ? input.slice(0, maxLength * 2) : input);
  const out: string[] = [];
  const stack: string[] = [];
  let dropDepth = 0;
  let dropTag = '';

  for (const t of tokens) {
    if (dropDepth > 0) {
      if (t.type === 'open' && t.name === dropTag && !t.selfClose) dropDepth++;
      else if (t.type === 'close' && t.name === dropTag) dropDepth--;
      continue;
    }
    if (t.type === 'text') { out.push(escapeText(t.value)); continue; }
    if (t.type === 'open') {
      if (DROP_WITH_CONTENT.has(t.name)) {
        if (!t.selfClose) { dropDepth = 1; dropTag = t.name; }
        continue;
      }
      if (!ALLOWED_TAGS.has(t.name)) continue; // بنشيل الوسم ونسيب النص
      if (t.name === 'br' || t.name === 'hr' || t.name === 'col') { out.push(`<${t.name}${t.name === 'col' ? '' : ''}>`); continue; }
      if (stack.length >= 40) continue;
      out.push(`<${t.name}${cleanAttrs(t.name, t.attrs)}>`);
      if (t.selfClose) out.push(`</${t.name}>`); else stack.push(t.name);
      continue;
    }
    // close
    if (!ALLOWED_TAGS.has(t.name) || VOID_TAGS.has(t.name)) continue;
    const at = stack.lastIndexOf(t.name);
    if (at === -1) continue;
    while (stack.length > at) out.push(`</${stack.pop()}>`);
  }
  while (stack.length) out.push(`</${stack.pop()}>`);
  const html = out.join('');
  return html.length > maxLength ? '' : html;
}

const BLOCK_CLOSE = new Set(['p', 'div', 'li', 'tr', 'h3', 'h4', 'blockquote', 'caption', 'ul', 'ol', 'table']);

function decodeText(v: string): string {
  return decodeAttr(v).replace(/ /g, ' ');
}

/** نسخة نصية للـ HTML (للبحث، التصدير، الفحص الآلي). المعادلات بترجع $latex$ */
export function htmlToText(html: unknown): string {
  if (typeof html !== 'string' || !html) return '';
  const tokens = tokenize(html);
  let out = '';
  let skip = 0; // جوه معادلة
  let dropDepth = 0;
  let dropTag = '';
  let cellInRow = 0;
  for (const t of tokens) {
    if (dropDepth > 0) {
      if (t.type === 'open' && t.name === dropTag && !t.selfClose) dropDepth++;
      else if (t.type === 'close' && t.name === dropTag) dropDepth--;
      continue;
    }
    if (skip > 0) {
      if (t.type === 'open' && t.name === 'span' && !t.selfClose) skip++;
      else if (t.type === 'close' && t.name === 'span') skip--;
      continue;
    }
    if (t.type === 'text') { out += decodeText(t.value); continue; }
    if (t.type === 'open') {
      if (DROP_WITH_CONTENT.has(t.name) && !t.selfClose) { dropDepth = 1; dropTag = t.name; continue; }
      if (t.name === 'span' && typeof t.attrs['data-latex'] === 'string' && /tl-math/.test(t.attrs.class || '')) {
        out += `$${t.attrs['data-latex']}$`;
        if (!t.selfClose) skip = 1;
        continue;
      }
      if (t.name === 'br' || t.name === 'hr') out += '\n';
      else if (t.name === 'li') out += '• ';
      else if (t.name === 'tr') cellInRow = 0;
      else if ((t.name === 'td' || t.name === 'th') && cellInRow++ > 0) out += ' | ';
      continue;
    }
    if (BLOCK_CLOSE.has(t.name) && !out.endsWith('\n')) out += '\n';
  }
  return out.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** نص عادي → HTML (سطور جديدة بتبقى <br>) */
export function textToHtml(text: string): string {
  return escapeHtml(text || '').replace(/\r?\n/g, '<br>');
}

/** هل الـ HTML فاضي فعليًا (مفيش نص ولا معادلة ولا جدول)؟ */
export function isRichEmpty(html: unknown): boolean {
  if (typeof html !== 'string' || !html.trim()) return true;
  return !htmlToText(html).trim() && !/<table|<hr/i.test(html);
}

export function mathSpan(latex: string, digits: 'en' | 'ar' | 'ar-ex' = 'en', display = false): string {
  const clean = latex.slice(0, MAX_LATEX_LENGTH);
  return `<span class="tl-math" data-latex="${escapeHtml(clean)}"${digits !== 'en' ? ` data-digits="${digits}"` : ''}${display ? ' data-display="1"' : ''}>$${escapeHtml(clean)}$</span>`;
}

export function hasRichContent(html: unknown): boolean {
  return typeof html === 'string' && /<(b|i|u|s|sub|sup|table|ul|ol|a|span)\b/i.test(html);
}
