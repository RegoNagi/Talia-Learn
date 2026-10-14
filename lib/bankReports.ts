/** تقارير محتوى بنوك الأسئلة (قصة 11): منطق نقي، الأرقام كلها بتتحسب من الأسئلة الفعلية */
import { normalizeDok } from './dok';
import type { Cell, Sheet } from './xlsxLite';

export const DIFFICULTIES = ['سهل', 'متوسط', 'صعب'] as const;
export const BLOOMS = ['تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'ابتكار'] as const;
const HIGHER_BLOOM = new Set(['تحليل', 'تقييم', 'ابتكار']);
export const MIN_PER_UNIT = 10;
export const SCOPE_AR: Record<string, string> = { central: 'مركزي', shared: 'مشترك', private: 'خاص' };
export const STATUS_AR: Record<string, string> = { approved: 'معتمد', pending: 'معلّق', rejected: 'مرفوض' };

export interface ReportRow {
  id: string; subject: string; grade: string; unit: string; lesson: string | null; type: string; difficulty: string; bloomLevel: string;
  dok?: number; scope: string; status: string; createdAt: string; authorId: string | null; authorName: string;
  hasImage: boolean; hasAudio: boolean; hasVideo: boolean; hasHint: boolean;
}

export interface ReportSource {
  id: string; subject: string; grade: string; unit: string; lesson: string | null; type: string; difficulty: string; bloomLevel: string;
  scope: string; status: string; createdAt: string; createdBy: string | null; createdByRole: string; creatorName?: string;
  question?: { questionImageUrl?: string; imageUrl?: string; audioUrl?: string; videoUrl?: string; hint?: { text?: string; fileUrl?: string }; dok?: unknown } | null;
}

export function toReportRow(q: ReportSource): ReportRow {
  const c = q.question || {};
  return {
    id: q.id, subject: q.subject, grade: q.grade, unit: q.unit || 'بدون وحدة', lesson: q.lesson, type: q.type, difficulty: q.difficulty,
    bloomLevel: q.bloomLevel, dok: normalizeDok(c.dok), scope: q.scope, status: q.status, createdAt: q.createdAt,
    authorId: q.createdBy, authorName: q.creatorName || (q.createdByRole === 'supervisor' ? 'مشرف البنك' : 'غير معروف'),
    hasImage: !!(c.questionImageUrl || c.imageUrl), hasAudio: !!c.audioUrl, hasVideo: !!c.videoUrl, hasHint: !!(c.hint?.text?.trim() || c.hint?.fileUrl),
  };
}

export interface ReportFilters {
  subject?: string; grade?: string; scope?: string; status?: string; author?: string; from?: string; to?: string;
}

export function filterRows(rows: ReportRow[], f: ReportFilters): ReportRow[] {
  const from = f.from ? new Date(`${f.from}T00:00:00`).getTime() : null;
  const to = f.to ? new Date(`${f.to}T23:59:59.999`).getTime() : null;
  return rows.filter((r) => {
    if (f.subject && r.subject !== f.subject) return false;
    if (f.grade && r.grade !== f.grade) return false;
    if (f.scope && r.scope !== f.scope) return false;
    if (f.status && r.status !== f.status) return false;
    if (f.author && (r.authorId || r.authorName) !== f.author) return false;
    const t = new Date(r.createdAt).getTime();
    if (from !== null && t < from) return false;
    if (to !== null && t > to) return false;
    return true;
  });
}

export interface Bucket { name: string; value: number }

function count(rows: ReportRow[], key: (r: ReportRow) => string, order?: readonly string[]): Bucket[] {
  const m = new Map<string, number>();
  for (const r of rows) { const k = key(r) || '—'; m.set(k, (m.get(k) || 0) + 1); }
  if (order) return order.map((name) => ({ name, value: m.get(name) || 0 }));
  return [...m].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, 'ar'));
}

export interface CoverageRow {
  subject: string; grade: string; unit: string; total: number; approved: number;
  easy: number; medium: number; hard: number; lessons: number; higherBloom: number; gaps: string[];
}
export interface AuthorRow { key: string; name: string; total: number; approved: number; pending: number; rejected: number; approvalRate: number | null; lastAt: string }

export interface Report {
  total: number; approved: number; pending: number; rejected: number;
  subjects: number; units: number;
  byScope: Bucket[]; byType: Bucket[]; byDifficulty: Bucket[]; byBloom: Bucket[]; byDok: Bucket[]; byMonth: Bucket[]; bySubject: Bucket[];
  coverage: CoverageRow[]; authors: AuthorRow[];
  media: { image: number; audio: number; video: number; hint: number; dok: number };
  /** نسبة الأسئلة DOK 3 و4 من الأسئلة المحدد لها DOK */
  higherOrderPct: number | null;
  gapUnits: number;
}

export function buildReport(rows: ReportRow[]): Report {
  const monthKey = (r: ReportRow) => {
    const d = new Date(r.createdAt);
    return Number.isNaN(d.getTime()) ? '—' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // تغطية المنهج: مادة × صف × وحدة (على المعتمد بس لأنه اللي يتستخدم فعليًا)
  const cov = new Map<string, CoverageRow & { _lessons: Set<string> }>();
  for (const r of rows) {
    const key = `${r.subject}\u0001${r.grade}\u0001${r.unit}`;
    let c = cov.get(key);
    if (!c) { c = { subject: r.subject, grade: r.grade, unit: r.unit, total: 0, approved: 0, easy: 0, medium: 0, hard: 0, lessons: 0, higherBloom: 0, gaps: [], _lessons: new Set() }; cov.set(key, c); }
    c.total++;
    if (r.status === 'approved') {
      c.approved++;
      if (r.difficulty === 'سهل') c.easy++; else if (r.difficulty === 'متوسط') c.medium++; else if (r.difficulty === 'صعب') c.hard++;
      if (HIGHER_BLOOM.has(r.bloomLevel)) c.higherBloom++;
      if (r.lesson) c._lessons.add(r.lesson);
    }
  }
  const coverage: CoverageRow[] = [...cov.values()].map(({ _lessons, ...c }) => {
    const gaps: string[] = [];
    if (c.approved < MIN_PER_UNIT) gaps.push(`أقل من ${MIN_PER_UNIT} أسئلة معتمدة`);
    if (c.approved > 0) {
      if (!c.easy) gaps.push('لا يوجد سهل'); if (!c.medium) gaps.push('لا يوجد متوسط'); if (!c.hard) gaps.push('لا يوجد صعب');
      if (!c.higherBloom && c.approved >= 5) gaps.push('لا يغطي التحليل فما فوق');
    }
    return { ...c, lessons: _lessons.size, gaps };
  }).sort((a, b) => a.subject.localeCompare(b.subject, 'ar') || a.grade.localeCompare(b.grade, 'ar', { numeric: true }) || a.unit.localeCompare(b.unit, 'ar', { numeric: true }));

  // المساهمات حسب المؤلف
  const au = new Map<string, AuthorRow>();
  for (const r of rows) {
    const key = r.authorId || r.authorName;
    let a = au.get(key);
    if (!a) { a = { key, name: r.authorName, total: 0, approved: 0, pending: 0, rejected: 0, approvalRate: null, lastAt: r.createdAt }; au.set(key, a); }
    a.total++;
    if (r.status === 'approved') a.approved++; else if (r.status === 'pending') a.pending++; else if (r.status === 'rejected') a.rejected++;
    if (new Date(r.createdAt) > new Date(a.lastAt)) a.lastAt = r.createdAt;
  }
  const authors = [...au.values()].map((a) => ({ ...a, approvalRate: a.approved + a.rejected ? Math.round((a.approved / (a.approved + a.rejected)) * 100) : null }))
    .sort((x, y) => y.total - x.total || x.name.localeCompare(y.name, 'ar'));

  const withDok = rows.filter((r) => r.dok);
  const higher = withDok.filter((r) => (r.dok || 0) >= 3).length;

  return {
    total: rows.length,
    approved: rows.filter((r) => r.status === 'approved').length,
    pending: rows.filter((r) => r.status === 'pending').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
    subjects: new Set(rows.map((r) => r.subject)).size,
    units: coverage.length,
    byScope: count(rows, (r) => SCOPE_AR[r.scope] || r.scope),
    byType: count(rows, (r) => r.type),
    byDifficulty: count(rows, (r) => r.difficulty, DIFFICULTIES),
    byBloom: count(rows, (r) => r.bloomLevel, BLOOMS),
    byDok: [...[1, 2, 3, 4].map((l) => ({ name: `DOK ${l}`, value: rows.filter((r) => r.dok === l).length })), { name: 'غير محدد', value: rows.length - withDok.length }],
    byMonth: count(rows, monthKey).sort((a, b) => a.name.localeCompare(b.name)),
    bySubject: count(rows, (r) => r.subject),
    coverage, authors,
    media: { image: rows.filter((r) => r.hasImage).length, audio: rows.filter((r) => r.hasAudio).length, video: rows.filter((r) => r.hasVideo).length, hint: rows.filter((r) => r.hasHint).length, dok: withDok.length },
    higherOrderPct: withDok.length ? Math.round((higher / withDok.length) * 100) : null,
    gapUnits: coverage.filter((c) => c.gaps.length > 0).length,
  };
}

export type CountOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';
export const COUNT_OP_LABEL: Record<CountOp, string> = { gt: 'أكبر من', gte: 'أكبر من أو يساوي', lt: 'أصغر من', lte: 'أصغر من أو يساوي', eq: 'يساوي' };

export function applyCountFilter<T extends { total: number }>(rows: T[], f: { op: CountOp; value: number } | null): T[] {
  if (!f || !Number.isFinite(f.value)) return rows;
  return rows.filter((r) => f.op === 'gt' ? r.total > f.value : f.op === 'gte' ? r.total >= f.value : f.op === 'lt' ? r.total < f.value : f.op === 'lte' ? r.total <= f.value : r.total === f.value);
}

export function filtersText(f: ReportFilters, count?: { op: CountOp; value: number } | null): string {
  const parts: string[] = [];
  if (f.subject) parts.push(`المادة: ${f.subject}`);
  if (f.grade) parts.push(`الصف: ${f.grade}`);
  if (f.scope) parts.push(`البنك: ${SCOPE_AR[f.scope] || f.scope}`);
  if (f.status) parts.push(`الحالة: ${STATUS_AR[f.status] || f.status}`);
  if (f.author) parts.push(`المؤلف: ${f.author}`);
  if (f.from) parts.push(`من: ${f.from}`);
  if (f.to) parts.push(`إلى: ${f.to}`);
  if (count && Number.isFinite(count.value)) parts.push(`عدد الأسئلة في الوحدة ${COUNT_OP_LABEL[count.op]} ${count.value}`);
  return parts.length ? parts.join(' · ') : 'بدون فلاتر (كل المحتوى)';
}

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

export function reportToSheets(r: Report, meta: { filters: string; generatedAt: string }): Sheet[] {
  const dist = (title: string, b: Bucket[]): Cell[][] => [[title, 'العدد', 'النسبة %'], ...b.map((x) => [x.name, x.value, pct(x.value, r.total)] as Cell[]), []];
  return [
    { name: 'ملخص', rows: [
      ['البند', 'القيمة'],
      ['تاريخ التقرير', meta.generatedAt], ['الفلاتر', meta.filters],
      ['إجمالي الأسئلة', r.total], ['معتمدة', r.approved], ['معلّقة', r.pending], ['مرفوضة', r.rejected],
      ['عدد المواد', r.subjects], ['عدد الوحدات', r.units], ['وحدات بها فجوات', r.gapUnits],
      ['أسئلة بصورة', r.media.image], ['أسئلة بصوت', r.media.audio], ['أسئلة بفيديو', r.media.video], ['أسئلة بتلميح', r.media.hint],
      ['أسئلة محدد لها DOK', r.media.dok], ['نسبة DOK 3 و4 (من المحدد لها)', r.higherOrderPct === null ? '' : r.higherOrderPct],
    ] },
    { name: 'تغطية المنهج', rows: [
      ['المادة', 'الصف', 'الوحدة', 'الإجمالي', 'معتمد', 'سهل', 'متوسط', 'صعب', 'عدد الدروس', 'تحليل فما فوق', 'الفجوات'],
      ...r.coverage.map((c) => [c.subject, c.grade, c.unit, c.total, c.approved, c.easy, c.medium, c.hard, c.lessons, c.higherBloom, c.gaps.join('، ')] as Cell[]),
    ] },
    { name: 'التوزيعات', header: false, rows: [
      ...dist('مستوى الصعوبة', r.byDifficulty), ...dist('مستوى بلوم', r.byBloom), ...dist('العمق المعرفي', r.byDok),
      ...dist('نوع السؤال', r.byType), ...dist('نوع البنك', r.byScope), ...dist('المادة', r.bySubject), ...dist('الشهر', r.byMonth),
    ] },
    { name: 'المساهمات', rows: [
      ['المؤلف', 'الإجمالي', 'معتمد', 'معلّق', 'مرفوض', 'نسبة الاعتماد %', 'آخر إضافة'],
      ...r.authors.map((a) => [a.name, a.total, a.approved, a.pending, a.rejected, a.approvalRate === null ? '' : a.approvalRate, a.lastAt.slice(0, 10)] as Cell[]),
    ] },
  ];
}

const h = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** صفحة HTML للطباعة / الحفظ PDF: بتفتح في نافذة منفصلة، من غير الشريط الجانبي */
export function reportToPrintHtml(r: Report, meta: { title: string; filters: string; generatedAt: string }): string {
  const max = (b: Bucket[]) => Math.max(1, ...b.map((x) => x.value));
  const bars = (title: string, b: Bucket[]) => `<section><h3>${h(title)}</h3><table>${b.map((x) => `<tr><td class="n">${h(x.name)}</td><td class="bar"><i style="width:${Math.round((x.value / max(b)) * 100)}%"></i></td><td class="v">${x.value} <small>(${pct(x.value, r.total)}%)</small></td></tr>`).join('')}</table></section>`;
  const kpi = (l: string, v: string | number) => `<div class="kpi"><b>${h(v)}</b><span>${h(l)}</span></div>`;
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${h(meta.title)}</title><style>
*{box-sizing:border-box}body{font-family:Tahoma,Arial,sans-serif;color:#0f172a;margin:24px;font-size:12px}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:22px 0 8px;border-bottom:2px solid #7c3aed;padding-bottom:4px}h3{font-size:13px;margin:0 0 6px}
.sub{color:#475569;margin-bottom:14px}.kpis{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}.kpi{border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px;min-width:110px}.kpi b{display:block;font-size:18px}.kpi span{color:#64748b}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}section{break-inside:avoid}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #e2e8f0;padding:4px 6px;text-align:right}th{background:#f5f3ff}
table.plain td{border:none;border-bottom:1px solid #f1f5f9}.n{width:34%}.v{width:24%;white-space:nowrap}.bar{width:42%}.bar i{display:block;height:10px;background:#7c3aed;border-radius:3px}
.gap{color:#b45309}.ok{color:#047857}@media print{body{margin:10mm}.noprint{display:none}}
</style></head><body>
<button class="noprint" onclick="window.print()" style="float:left;padding:6px 14px">طباعة / حفظ PDF</button>
<h1>${h(meta.title)}</h1><div class="sub">${h(meta.filters)} · ${h(meta.generatedAt)}</div>
<div class="kpis">${kpi('إجمالي الأسئلة', r.total)}${kpi('معتمدة', r.approved)}${kpi('معلّقة', r.pending)}${kpi('مرفوضة', r.rejected)}${kpi('المواد', r.subjects)}${kpi('الوحدات', r.units)}${kpi('وحدات بها فجوات', r.gapUnits)}${kpi('DOK 3 و4', r.higherOrderPct === null ? '—' : r.higherOrderPct + '%')}</div>
<h2>التوزيعات</h2><div class="grid">${bars('مستوى الصعوبة', r.byDifficulty)}${bars('مستوى بلوم', r.byBloom)}${bars('العمق المعرفي', r.byDok)}${bars('نوع البنك', r.byScope)}${bars('أنواع الأسئلة', r.byType)}${bars('المواد', r.bySubject)}</div>
<h2>تغطية المنهج</h2><table><tr><th>المادة</th><th>الصف</th><th>الوحدة</th><th>الإجمالي</th><th>معتمد</th><th>سهل</th><th>متوسط</th><th>صعب</th><th>الدروس</th><th>الفجوات</th></tr>
${r.coverage.map((c) => `<tr><td>${h(c.subject)}</td><td>${h(c.grade)}</td><td>${h(c.unit)}</td><td>${c.total}</td><td>${c.approved}</td><td>${c.easy}</td><td>${c.medium}</td><td>${c.hard}</td><td>${c.lessons}</td><td class="${c.gaps.length ? 'gap' : 'ok'}">${c.gaps.length ? h(c.gaps.join('، ')) : 'مكتملة'}</td></tr>`).join('')}</table>
<h2>المساهمات</h2><table><tr><th>المؤلف</th><th>الإجمالي</th><th>معتمد</th><th>معلّق</th><th>مرفوض</th><th>نسبة الاعتماد</th></tr>
${r.authors.map((a) => `<tr><td>${h(a.name)}</td><td>${a.total}</td><td>${a.approved}</td><td>${a.pending}</td><td>${a.rejected}</td><td>${a.approvalRate === null ? '—' : a.approvalRate + '%'}</td></tr>`).join('')}</table>
</body></html>`;
}
