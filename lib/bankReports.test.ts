import { describe, it, expect } from 'vitest';
import { toReportRow, filterRows, buildReport, applyCountFilter, filtersText, reportToSheets, reportToPrintHtml, MIN_PER_UNIT, type ReportSource, type ReportRow } from './bankReports';

let n = 0;
const src = (o: Partial<ReportSource> = {}): ReportSource => ({
  id: `q${++n}`, subject: 'علوم', grade: '5', unit: 'U1', lesson: 'L1', type: 'اختيار من متعدد', difficulty: 'سهل', bloomLevel: 'تذكر',
  scope: 'central', status: 'approved', createdAt: '2026-03-10T10:00:00', createdBy: 't1', createdByRole: 'teacher', creatorName: 'أ. منى', question: {}, ...o,
});
const rows = (list: ReportSource[]) => list.map(toReportRow);

describe('toReportRow', () => {
  it('بيستخرج الوسائط والتلميح وDOK', () => {
    const r = toReportRow(src({ question: { questionImageUrl: 'x', audioUrl: 'a', videoUrl: 'v', hint: { text: 'تلميح' }, dok: '3' } }));
    expect(r).toMatchObject({ hasImage: true, hasAudio: true, hasVideo: true, hasHint: true, dok: 3 });
    expect(toReportRow(src({ question: { hint: { text: '  ' }, dok: 9 } }))).toMatchObject({ hasHint: false, dok: undefined });
  });
  it('اسم المؤلف الافتراضي', () => {
    expect(toReportRow(src({ creatorName: undefined, createdByRole: 'supervisor', createdBy: null })).authorName).toBe('مشرف البنك');
    expect(toReportRow(src({ creatorName: undefined })).authorName).toBe('غير معروف');
  });
});

describe('filterRows', () => {
  const data = rows([
    src({ subject: 'علوم', grade: '5', scope: 'central', createdAt: '2026-01-05T00:00:00' }),
    src({ subject: 'رياضيات', grade: '6', scope: 'shared', status: 'pending', createdBy: 't2', creatorName: 'أ. سلمى', createdAt: '2026-02-05T00:00:00' }),
  ]);
  it('كل الفلاتر', () => {
    expect(filterRows(data, { subject: 'رياضيات' })).toHaveLength(1);
    expect(filterRows(data, { grade: '5' })).toHaveLength(1);
    expect(filterRows(data, { scope: 'shared' })).toHaveLength(1);
    expect(filterRows(data, { status: 'pending' })).toHaveLength(1);
    expect(filterRows(data, { author: 't2' })).toHaveLength(1);
    expect(filterRows(data, { from: '2026-02-01' })).toHaveLength(1);
    expect(filterRows(data, { to: '2026-01-05' })).toHaveLength(1); // اليوم الأخير شامل
    expect(filterRows(data, {})).toHaveLength(2);
  });
});

describe('buildReport', () => {
  const many = (k: number, o: Partial<ReportSource>) => Array.from({ length: k }, () => src(o));
  const data = rows([
    ...many(4, { unit: 'U1', difficulty: 'سهل' }),
    ...many(4, { unit: 'U1', difficulty: 'متوسط', bloomLevel: 'تطبيق' }),
    ...many(3, { unit: 'U1', difficulty: 'صعب', bloomLevel: 'تحليل', lesson: 'L2', question: { dok: 3 } }),
    ...many(2, { unit: 'U2', difficulty: 'سهل', status: 'pending', createdBy: 't2', creatorName: 'أ. سلمى' }),
    src({ unit: 'U2', status: 'rejected', createdBy: 't2', creatorName: 'أ. سلمى', question: { dok: 1 } }),
  ]);
  const r = buildReport(data);

  it('الإجماليات', () => {
    expect(r).toMatchObject({ total: 14, approved: 11, pending: 2, rejected: 1, subjects: 1, units: 2 });
    expect(r.byDifficulty).toEqual([{ name: 'سهل', value: 7 }, { name: 'متوسط', value: 4 }, { name: 'صعب', value: 3 }]);
    expect(r.byBloom.map((b) => b.value)).toEqual([7, 0, 4, 3, 0, 0]);
    expect(r.byScope).toEqual([{ name: 'مركزي', value: 14 }]);
    expect(r.byMonth).toEqual([{ name: '2026-03', value: 14 }]);
  });
  it('DOK: التوزيع ونسبة التفكير العليا', () => {
    expect(r.byDok.map((d) => d.value)).toEqual([1, 0, 3, 0, 10]);
    expect(r.higherOrderPct).toBe(75); // 3 من 4 محدد لها DOK
    expect(buildReport(rows([src()])).higherOrderPct).toBeNull();
  });
  it('تغطية الوحدات والفجوات (على المعتمد فقط)', () => {
    const u1 = r.coverage.find((c) => c.unit === 'U1')!;
    expect(u1).toMatchObject({ total: 11, approved: 11, easy: 4, medium: 4, hard: 3, lessons: 2, higherBloom: 3 });
    expect(u1.gaps).toEqual([]); // 11 ≥ 10 وكل المستويات موجودة
    const u2 = r.coverage.find((c) => c.unit === 'U2')!;
    expect(u2).toMatchObject({ total: 3, approved: 0 }); // معلّق ومرفوض مش بيتحسبوا تغطية
    expect(u2.gaps).toEqual([`أقل من ${MIN_PER_UNIT} أسئلة معتمدة`]);
    expect(r.gapUnits).toBe(1);
    // وحدة فيها معتمد بس ناقصها مستويات
    const u3 = buildReport(rows([src({ unit: 'U3', difficulty: 'سهل' }), src({ unit: 'U3', difficulty: 'سهل' })])).coverage[0];
    expect(u3.gaps).toEqual([`أقل من ${MIN_PER_UNIT} أسئلة معتمدة`, 'لا يوجد متوسط', 'لا يوجد صعب']);
  });
  it('المساهمات ونسبة الاعتماد من المراجَع فقط', () => {
    const sal = r.authors.find((a) => a.name === 'أ. سلمى')!;
    expect(sal).toMatchObject({ total: 3, approved: 0, pending: 2, rejected: 1, approvalRate: 0 });
    const mona = r.authors.find((a) => a.name === 'أ. منى')!;
    expect(mona).toMatchObject({ total: 11, approvalRate: 100 });
    expect(r.authors[0].name).toBe('أ. منى'); // الأكتر أولًا
    expect(buildReport(rows([src({ status: 'pending' })])).authors[0].approvalRate).toBeNull();
  });
  it('تقرير فاضي مش بيكسر حاجة', () => {
    const e = buildReport([]);
    expect(e).toMatchObject({ total: 0, coverage: [], authors: [], higherOrderPct: null });
    expect(reportToSheets(e, { filters: 'x', generatedAt: 'y' }).length).toBe(4);
  });
});

describe('فلتر العدد (أكبر/أصغر/يساوي)', () => {
  const cov = [{ total: 3 }, { total: 10 }, { total: 20 }];
  it('كل العمليات', () => {
    expect(applyCountFilter(cov, { op: 'gt', value: 10 })).toEqual([{ total: 20 }]);
    expect(applyCountFilter(cov, { op: 'gte', value: 10 })).toHaveLength(2);
    expect(applyCountFilter(cov, { op: 'lt', value: 10 })).toEqual([{ total: 3 }]);
    expect(applyCountFilter(cov, { op: 'lte', value: 10 })).toHaveLength(2);
    expect(applyCountFilter(cov, { op: 'eq', value: 10 })).toEqual([{ total: 10 }]);
    expect(applyCountFilter(cov, null)).toBe(cov);
    expect(applyCountFilter(cov, { op: 'eq', value: NaN })).toBe(cov);
  });
  it('وصف الفلاتر', () => {
    expect(filtersText({})).toContain('بدون فلاتر');
    expect(filtersText({ subject: 'علوم', scope: 'shared' }, { op: 'lt', value: 5 })).toBe('المادة: علوم · البنك: مشترك · عدد الأسئلة في الوحدة أصغر من 5');
  });
});

describe('التصدير', () => {
  const data: ReportRow[] = rows([src({ subject: 'علوم <خطر>', unit: 'وحدة & "1"' }), src()]);
  const r = buildReport(data);
  it('أوراق Excel: 4 أوراق بالأرقام الصح', () => {
    const s = reportToSheets(r, { filters: 'ف', generatedAt: '2026-03-10' });
    expect(s.map((x) => x.name)).toEqual(['ملخص', 'تغطية المنهج', 'التوزيعات', 'المساهمات']);
    expect(s[0].rows.find((x) => x[0] === 'إجمالي الأسئلة')![1]).toBe(2);
    expect(s[1].rows).toHaveLength(1 + r.coverage.length);
    expect(s[2].rows.find((x) => x[0] === 'سهل')).toEqual(['سهل', 2, 100]);
  });
  it('صفحة الطباعة بتهرّب النصوص (مفيش حقن HTML)', () => {
    const html = reportToPrintHtml(r, { title: 'تقرير <script>alert(1)</script>', filters: 'ف', generatedAt: 'اليوم' });
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('علوم &lt;خطر&gt;');
    expect(html).toContain('وحدة &amp; &quot;1&quot;');
    expect(html).toContain('dir="rtl"');
  });
});
