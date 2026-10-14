// الفحص الآلي لجودة أسئلة البنك (تنقيح آلي): بيكشف أخطاء البناء والتكرار وهفوات الصياغة.
// منطق صرف بدون React ولا Supabase.

import { normalizeBankTitle } from '@/lib/bankTransfer';

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface AuditIssue {
  code: string;
  severity: IssueSeverity;
  ar: string;
  en: string;
  refId?: string; // السؤال المكرر المقابل (لو الملاحظة عن تكرار)
}

export interface AuditContent {
  title?: string;
  options?: { text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  modelAnswer?: string;
  numericAnswer?: number | null;
  pairs?: { left: string; right: string }[];
  orderItems?: string[];
  [key: string]: unknown;
}

export interface AuditInput {
  id: string;
  type: string;
  title: string;
  subject: string;
  grade: string;
  question: AuditContent;
}

export interface AuditPoolItem {
  id: string;
  title: string;
  subject: string;
  grade: string;
  status: string;
}

const QUESTION_WORDS = ['ما', 'ماذا', 'من', 'متى', 'أين', 'كيف', 'لماذا', 'هل', 'أي', 'أيّ', 'كم', 'what', 'why', 'how', 'which', 'who', 'when', 'where'];
const NO_QMARK_TYPES = ['أكمل الفراغ', 'ترتيب', 'توصيل', 'تصنيف', 'سحب وإفلات', 'قطعة'];
const MIN_NEAR_DUP_LEN = 15;

const issue = (code: string, severity: IssueSeverity, ar: string, en: string, refId?: string): AuditIssue => ({ code, severity, ar, en, ...(refId ? { refId } : {}) });

const stripPunct = (s: string) => s.replace(/[.,;:!?؟،؛"'()\[\]{}«»]/g, '');

export function auditQuestion(q: AuditInput, pool: AuditPoolItem[] = []): AuditIssue[] {
  const out: AuditIssue[] = [];
  const title = q.title || '';
  const c = q.question || {};

  // ---- النص
  if (!title.trim()) {
    out.push(issue('EMPTY_TITLE', 'error', 'نص السؤال فاضي', 'Question text is empty'));
  } else {
    if (title.trim().length < 8) out.push(issue('SHORT_TITLE', 'warning', 'نص السؤال قصير جدًا', 'Question text is very short'));
    if (/ {2,}/.test(title.trim()) || /^\s|\s$/.test(title)) out.push(issue('SPACING', 'info', 'مسافات زائدة في النص', 'Extra spaces in the text'));
    if (/[؟?]{2,}|[!]{2,}/.test(title)) out.push(issue('REPEATED_PUNCT', 'info', 'علامات ترقيم مكررة', 'Repeated punctuation'));
    const tokens = title.trim().split(/\s+/).map((t) => stripPunct(t).toLowerCase()).filter(Boolean);
    for (let i = 1; i < tokens.length; i++) {
      if (tokens[i].length > 1 && tokens[i] === tokens[i - 1]) {
        out.push(issue('REPEATED_WORD', 'warning', `كلمة مكررة ورا بعض: "${tokens[i]}"`, `Repeated word: "${tokens[i]}"`));
        break;
      }
    }
    const first = tokens[0] || '';
    if (!NO_QMARK_TYPES.includes(q.type) && QUESTION_WORDS.includes(first) && !/[؟?]/.test(title)) {
      out.push(issue('MISSING_QMARK', 'info', 'السؤال بصيغة استفهام ومفيهوش علامة استفهام', 'Looks like a question but has no question mark'));
    }
  }

  // ---- الخيارات (اختيار من متعدد / صح وخطأ / مقطع صوتي)
  const hasOptions = ['اختيار من متعدد', 'صح أم خطأ', 'مقطع صوتي'].includes(q.type);
  if (hasOptions) {
    const opts = c.options || [];
    const filled = opts.filter((o) => (o.text || '').trim());
    if (q.type !== 'صح أم خطأ' && filled.length < 2) out.push(issue('TOO_FEW_OPTIONS', 'error', 'أقل من خيارين مكتوبين', 'Fewer than two filled options'));
    if (opts.length > filled.length && filled.length >= 2) out.push(issue('EMPTY_OPTION', 'warning', 'فيه خيار فاضي', 'There is an empty option'));
    if (!opts.some((o) => o.isCorrect && (o.text || '').trim())) out.push(issue('NO_CORRECT', 'error', 'مفيش إجابة صحيحة محددة', 'No correct answer is set'));
    const norm = filled.map((o) => normalizeBankTitle(o.text));
    if (new Set(norm).size < norm.length) out.push(issue('DUP_OPTIONS', 'warning', 'فيه خيارات متطابقة', 'Two options are identical'));
    if (norm.length > 0 && title && norm.includes(normalizeBankTitle(title))) out.push(issue('OPTION_EQUALS_TITLE', 'warning', 'خيار مطابق لنص السؤال', 'An option repeats the question text'));
  }

  // ---- باقي الأنواع
  if (q.type === 'أكمل الفراغ' && !(c.correctAnswer || '').trim()) out.push(issue('NO_BLANK_ANSWER', 'error', 'مفيش إجابة صحيحة للفراغ', 'No correct answer for the blank'));
  if (q.type === 'إجابة رقمية' && (c.numericAnswer === null || c.numericAnswer === undefined || Number.isNaN(c.numericAnswer))) out.push(issue('NO_NUMERIC_ANSWER', 'error', 'مفيش إجابة رقمية', 'No numeric answer'));
  if (q.type === 'سؤال مقالي' && !(c.modelAnswer || '').trim()) out.push(issue('NO_MODEL_ANSWER', 'info', 'مفيش إجابة نموذجية للمصحح', 'No model answer for the grader'));
  if (q.type === 'توصيل') {
    const pairs = c.pairs || [];
    if (pairs.length < 2) out.push(issue('FEW_PAIRS', 'error', 'أقل من زوجين للتوصيل', 'Fewer than two pairs'));
    if (pairs.some((p) => !(p.left || '').trim() || !(p.right || '').trim())) out.push(issue('EMPTY_PAIR', 'warning', 'زوج فيه طرف فاضي', 'A pair has an empty side'));
  }
  if (q.type === 'ترتيب') {
    const items = (c.orderItems || []).filter((t) => (t || '').trim());
    if (items.length < 2) out.push(issue('FEW_ORDER', 'error', 'أقل من عنصرين للترتيب', 'Fewer than two items to order'));
    const norm = items.map(normalizeBankTitle);
    if (new Set(norm).size < norm.length) out.push(issue('DUP_ORDER', 'warning', 'عناصر ترتيب متطابقة', 'Identical items in the order list'));
  }

  // ---- التكرار
  const key = normalizeBankTitle(title);
  if (key) {
    let exact: AuditPoolItem | undefined;
    let near: AuditPoolItem | undefined;
    for (const p of pool) {
      if (p.id === q.id || p.subject !== q.subject || p.grade !== q.grade || p.status === 'rejected') continue;
      const pk = normalizeBankTitle(p.title);
      if (!pk) continue;
      if (pk === key) { exact = p; break; }
      const [shorter, longer] = pk.length <= key.length ? [pk, key] : [key, pk];
      if (!near && shorter.length >= MIN_NEAR_DUP_LEN && longer.includes(shorter)) near = p;
    }
    if (exact) out.push(issue('DUPLICATE', 'warning', `مكرر: نفس نص سؤال موجود "${exact.title.slice(0, 40)}"`, `Duplicate of an existing question "${exact.title.slice(0, 40)}"`, exact.id));
    else if (near) out.push(issue('NEAR_DUPLICATE', 'warning', `يشبه سؤال موجود "${near.title.slice(0, 40)}"`, `Very similar to "${near.title.slice(0, 40)}"`, near.id));
  }

  return out;
}

export function worstSeverity(issues: AuditIssue[]): IssueSeverity | null {
  if (issues.some((i) => i.severity === 'error')) return 'error';
  if (issues.some((i) => i.severity === 'warning')) return 'warning';
  if (issues.length > 0) return 'info';
  return null;
}
