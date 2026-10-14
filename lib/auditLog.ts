/**
 * سجل التدقيق (Audit Trail) لبنك الأسئلة: منطق نقي (من غير قاعدة بيانات) عشان نختبره.
 * الأحداث بتيجي من مصدرين:
 *  - stored: جدول question_bank_audit (إنشاء، تعديل، حذف، استيراد، نسخ، تصدير)
 *  - derived: بتتستنتج من الأسئلة نفسها (تاريخ الإنشاء + question.reviewLog للاعتماد والإرجاع وتعديل المراجع)
 */

export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'review_edit' | 'import' | 'copy' | 'export';

export const ACTION_LABELS: Record<AuditAction, { ar: string; en: string; tone: string }> = {
  create: { ar: 'إضافة سؤال', en: 'Question created', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  update: { ar: 'تعديل سؤال', en: 'Question edited', tone: 'bg-sky-50 text-sky-700 border-sky-200' },
  delete: { ar: 'حذف سؤال', en: 'Question deleted', tone: 'bg-rose-50 text-rose-700 border-rose-200' },
  approve: { ar: 'اعتماد', en: 'Approved', tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  reject: { ar: 'إرجاع / رفض', en: 'Rejected', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  review_edit: { ar: 'تعديل المراجع', en: 'Reviewer edit', tone: 'bg-violet-50 text-violet-700 border-violet-200' },
  import: { ar: 'استيراد', en: 'Import', tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  copy: { ar: 'نسخ بين بنوك', en: 'Copy between banks', tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  export: { ar: 'تصدير', en: 'Export', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export interface FieldChange {
  field: string;
  label: string;
  before: string | null;
  after: string | null;
}

export interface AuditEvent {
  id: string;
  at: string;
  byId: string | null;
  byName: string;
  byRole?: string;
  action: AuditAction;
  questionId: string | null;
  title: string;
  subject: string;
  grade: string;
  scope: string;
  changes: FieldChange[];
  note?: string;
  /** لقطة السؤال وقت الحذف */
  snapshot?: unknown;
  source: 'stored' | 'derived';
}

const FIELD_LABELS: Record<string, string> = {
  title: 'نص السؤال', titleHtml: 'تنسيق نص السؤال', options: 'الخيارات', correctOption: 'رقم الإجابة الصحيحة',
  correctAnswer: 'الإجابة الصحيحة', modelAnswer: 'الإجابة النموذجية', numericAnswer: 'الإجابة الرقمية',
  numericTolerance: 'هامش الخطأ', numericUnit: 'وحدة الإجابة', pairs: 'أزواج التوصيل', orderItems: 'عناصر الترتيب',
  categories: 'التصنيفات', classifyItems: 'عناصر التصنيف', zones: 'مناطق السحب', dragItems: 'عناصر السحب',
  hotspots: 'نقاط الصورة', imageUrl: 'الصورة', questionImageUrl: 'صورة السؤال', audioUrl: 'المقطع الصوتي',
  videoUrl: 'الفيديو', videoStart: 'بداية الفيديو', videoEnd: 'نهاية الفيديو', hint: 'التلميح', dok: 'العمق المعرفي',
  standard: 'المعيار', passageText: 'نص القطعة', subQuestions: 'الأسئلة الفرعية',
  unit: 'الوحدة', lesson: 'الدرس', bloomLevel: 'مستوى بلوم', difficulty: 'الصعوبة', type: 'نوع السؤال',
  subject: 'المادة', grade: 'الصف', scope: 'البنك', status: 'الحالة',
};

export function fieldLabel(field: string): string {
  return FIELD_LABELS[field] || field;
}

const SCOPE_LABELS: Record<string, string> = { central: 'مركزي', shared: 'مشترك', private: 'خاص' };
const STATUS_LABELS: Record<string, string> = { approved: 'معتمد', pending: 'معلّق', rejected: 'مرفوض' };

/** قيمة حقل كنص مقروء (للعرض والمقارنة) */
export function stringifyValue(field: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (field === 'scope' && typeof v === 'string') return SCOPE_LABELS[v] || v;
  if (field === 'status' && typeof v === 'string') return STATUS_LABELS[v] || v;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    return v.map((it, i) => {
      if (typeof it === 'string') return it;
      if (it && typeof it === 'object') {
        const o = it as Record<string, unknown>;
        if ('left' in o && 'right' in o) return `${o.left} ↔ ${o.right}`;
        if ('text' in o && 'isCorrect' in o) return `${o.isCorrect ? '✓' : '•'} ${o.text}`;
        if ('text' in o && ('category' in o || 'zone' in o)) return `${o.text} → ${o.category ?? o.zone}`;
        if ('label' in o && 'xPercent' in o) return `${o.isCorrect ? '✓' : '•'} ${o.label} (${o.xPercent}%, ${o.yPercent}%)`;
        if ('title' in o) return `${i + 1}. ${o.title}`;
      }
      return JSON.stringify(it);
    }).join('\n');
  }
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if ('text' in o || 'fileUrl' in o) return [o.text, o.fileName || o.fileUrl].filter(Boolean).join(' — ');
    return JSON.stringify(v);
  }
  return String(v);
}

export type FlatSnapshot = Record<string, unknown>;

/** صف question_bank كامل → كائن مسطح للمقارنة (الخصائص + محتوى السؤال) */
export function snapshotOf(row: {
  subject?: string; grade?: string; unit?: string; lesson?: string | null; bloom_level?: string; difficulty?: string; type?: string; scope?: string; status?: string; question?: Record<string, unknown> | null;
}): FlatSnapshot {
  const { reviewLog: _ignored, ...content } = (row.question || {}) as Record<string, unknown>;
  void _ignored;
  return {
    subject: row.subject, grade: row.grade, unit: row.unit, lesson: row.lesson ?? null, bloomLevel: row.bloom_level,
    difficulty: row.difficulty, type: row.type, scope: row.scope, status: row.status, ...content,
  };
}

/** الفروق بين لقطتين: حقل بحقل، بالقيم قبل وبعد */
export function diffSnapshots(before: FlatSnapshot, after: FlatSnapshot): FieldChange[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  keys.delete('reviewLog');
  const out: FieldChange[] = [];
  for (const k of keys) {
    const a = before[k], b = after[k];
    if (JSON.stringify(a ?? null) === JSON.stringify(b ?? null)) continue;
    const bs = stringifyValue(k, a), as = stringifyValue(k, b);
    if (bs === as) continue; // فرق شكلي (undefined مقابل فاضي)
    out.push({ field: k, label: fieldLabel(k), before: bs || null, after: as || null });
  }
  // الأهم الأول
  const order = ['title', 'options', 'correctOption', 'correctAnswer', 'status', 'scope', 'difficulty', 'bloomLevel', 'dok', 'unit', 'lesson'];
  return out.sort((x, y) => {
    const ix = order.indexOf(x.field), iy = order.indexOf(y.field);
    return (ix === -1 ? 99 : ix) - (iy === -1 ? 99 : iy);
  });
}

// ---------- الأحداث المستنتجة من الأسئلة نفسها ----------

export interface DerivableQuestion {
  id: string;
  title: string;
  subject: string;
  grade: string;
  scope: string;
  createdBy: string | null;
  createdByRole: string;
  creatorName?: string;
  createdAt: string;
  question?: { reviewLog?: { at: string; by: string; byId: string | null; action: 'approved' | 'rejected' | 'edited'; note?: string; changes?: string[] }[] } | null;
}

export function deriveEventsFromQuestions(qs: DerivableQuestion[]): AuditEvent[] {
  const out: AuditEvent[] = [];
  for (const q of qs) {
    const base = { questionId: q.id, title: q.title, subject: q.subject, grade: q.grade, scope: q.scope, source: 'derived' as const };
    out.push({
      ...base, id: `d-create-${q.id}`, at: q.createdAt, byId: q.createdBy,
      byName: q.creatorName || (q.createdByRole === 'supervisor' ? 'مشرف البنك' : 'معلم'), byRole: q.createdByRole,
      action: 'create', changes: [],
    });
    (q.question?.reviewLog || []).forEach((e, i) => {
      const action: AuditAction = e.action === 'approved' ? 'approve' : e.action === 'rejected' ? 'reject' : 'review_edit';
      out.push({
        ...base, id: `d-${q.id}-${i}`, at: e.at, byId: e.byId, byName: e.by, byRole: 'supervisor', action,
        changes: (e.changes || []).map((f) => ({ field: f, label: fieldLabel(f), before: null, after: null })),
        note: e.note,
      });
    });
  }
  return out;
}

/** دمج المخزّن والمستنتج: لو في حدث "إضافة" مخزّن لنفس السؤال، نشيل المستنتج بتاعه */
export function mergeEvents(stored: AuditEvent[], derived: AuditEvent[]): AuditEvent[] {
  const created = new Set(stored.filter((e) => e.action === 'create' && e.questionId).map((e) => e.questionId));
  const keep = derived.filter((e) => !(e.action === 'create' && e.questionId && created.has(e.questionId)));
  return [...stored, ...keep].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

// ---------- الفلاتر ----------

export interface AuditFilters {
  user?: string;
  action?: AuditAction | '';
  from?: string; // YYYY-MM-DD
  to?: string;
  subject?: string;
  q?: string;
}

export function filterEvents(events: AuditEvent[], f: AuditFilters): AuditEvent[] {
  const from = f.from ? new Date(`${f.from}T00:00:00`).getTime() : null;
  const to = f.to ? new Date(`${f.to}T23:59:59.999`).getTime() : null;
  const q = f.q?.trim().toLowerCase();
  return events.filter((e) => {
    const t = new Date(e.at).getTime();
    if (from !== null && t < from) return false;
    if (to !== null && t > to) return false;
    if (f.action && e.action !== f.action) return false;
    if (f.user && e.byId !== f.user && e.byName !== f.user) return false;
    if (f.subject && e.subject !== f.subject) return false;
    if (q && !(`${e.title} ${e.questionId || ''} ${e.note || ''}`.toLowerCase().includes(q))) return false;
    return true;
  });
}

export function uniqueUsers(events: AuditEvent[]): { key: string; name: string }[] {
  const m = new Map<string, string>();
  for (const e of events) m.set(e.byId || e.byName, e.byName);
  return [...m].map(([key, name]) => ({ key, name })).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
}

// ---------- التصدير ----------

export const AUDIT_EXPORT_HEADER = ['التاريخ', 'الوقت', 'المستخدم', 'نوع العملية', 'السؤال', 'المادة', 'الصف', 'البنك', 'الحقل', 'القيمة قبل', 'القيمة بعد', 'ملاحظة', 'المصدر'];

function pad(n: number) { return String(n).padStart(2, '0'); }
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function formatTimeOfDay(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** صفوف للتصدير: صف لكل حقل اتغير (أو صف واحد لو العملية من غير تفاصيل) */
export function eventsToRows(events: AuditEvent[]): (string | number)[][] {
  const rows: (string | number)[][] = [];
  for (const e of events) {
    const head = [formatDate(e.at), formatTimeOfDay(e.at), e.byName, ACTION_LABELS[e.action].ar, e.title, e.subject, e.grade, SCOPE_LABELS[e.scope] || e.scope];
    const tail = [e.note || '', e.source === 'stored' ? 'مسجّل' : 'مستنتج'];
    if (e.changes.length === 0) rows.push([...head, '', '', '', ...tail]);
    else for (const c of e.changes) rows.push([...head, c.label, c.before ?? '', c.after ?? '', ...tail]);
  }
  return rows;
}

// ---------- مقارنة نصية (كلمة بكلمة) ----------

export interface DiffPart { text: string; kind: 'same' | 'add' | 'del' }

export function wordDiff(a: string, b: string): DiffPart[] {
  const x = a.split(/(\s+)/).filter(Boolean);
  const y = b.split(/(\s+)/).filter(Boolean);
  if (x.length * y.length > 160_000) return [{ text: a, kind: 'del' }, { text: b, kind: 'add' }];
  const dp: number[][] = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) dp[i][j] = x[i] === y[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: DiffPart[] = [];
  const push = (text: string, kind: DiffPart['kind']) => {
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text; else out.push({ text, kind });
  };
  let i = 0, j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) { push(x[i], 'same'); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push(x[i], 'del'); i++; }
    else { push(y[j], 'add'); j++; }
  }
  while (i < x.length) push(x[i++], 'del');
  while (j < y.length) push(y[j++], 'add');
  return out;
}
