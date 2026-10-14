import { describe, it, expect } from 'vitest';
import { diffSnapshots, snapshotOf, stringifyValue, deriveEventsFromQuestions, mergeEvents, filterEvents, uniqueUsers, eventsToRows, wordDiff, type AuditEvent } from './auditLog';

const row = (over: any = {}) => ({
  subject: 'علوم', grade: '5', unit: 'U1', lesson: null, bloom_level: 'تذكر', difficulty: 'سهل', type: 'اختيار من متعدد', scope: 'central', status: 'approved',
  question: { title: 'ما هو الماء؟', options: [{ id: '1', text: 'سائل', isCorrect: true }, { id: '2', text: 'غاز', isCorrect: false }], correctOption: 0, reviewLog: [{ at: 'x', by: 'م', byId: null, action: 'approved' }] },
  ...over,
});

describe('diffSnapshots', () => {
  it('بيطلّع الحقول اللي اتغيرت بالقيمة قبل وبعد مرتبة بالأهم', () => {
    const a = snapshotOf(row());
    const b = snapshotOf(row({ difficulty: 'صعب', question: { ...row().question, title: 'ما هو الماء النقي؟', options: [{ id: '1', text: 'سائل', isCorrect: false }, { id: '2', text: 'غاز', isCorrect: true }], correctOption: 1 } }));
    const d = diffSnapshots(a, b);
    expect(d.map((c) => c.field)).toEqual(['title', 'options', 'correctOption', 'difficulty']);
    expect(d[0]).toMatchObject({ label: 'نص السؤال', before: 'ما هو الماء؟', after: 'ما هو الماء النقي؟' });
    expect(d[1].before).toBe('✓ سائل\n• غاز');
    expect(d[1].after).toBe('• سائل\n✓ غاز');
    expect(d[3]).toMatchObject({ before: 'سهل', after: 'صعب' });
  });
  it('مفيش فروق = مصفوفة فاضية، وreviewLog بيتتجاهل', () => {
    const a = snapshotOf(row());
    const b = snapshotOf(row({ question: { ...row().question, reviewLog: [] } }));
    expect(diffSnapshots(a, b)).toEqual([]);
  });
  it('undefined مقابل فاضي مش فرق', () => {
    expect(diffSnapshots({ lesson: null }, { lesson: '' })).toEqual([]);
  });
  it('حقل اتضاف أو اتشال', () => {
    const d = diffSnapshots({ title: 'x' }, { title: 'x', dok: 3, hint: { text: 'فكّر' } });
    expect(d.map((c) => [c.field, c.before, c.after])).toEqual([['dok', null, '3'], ['hint', null, 'فكّر']]);
  });
  it('الحالة والبنك بيتعرضوا بالعربي', () => {
    const d = diffSnapshots({ scope: 'private', status: 'pending' }, { scope: 'shared', status: 'approved' });
    expect(d.find((c) => c.field === 'scope')).toMatchObject({ before: 'خاص', after: 'مشترك' });
    expect(d.find((c) => c.field === 'status')).toMatchObject({ before: 'معلّق', after: 'معتمد' });
  });
});

describe('stringifyValue', () => {
  it('أنواع القيم', () => {
    expect(stringifyValue('pairs', [{ id: '1', left: 'قطر', right: 'الدوحة' }])).toBe('قطر ↔ الدوحة');
    expect(stringifyValue('orderItems', ['أ', 'ب'])).toBe('أ\nب');
    expect(stringifyValue('classifyItems', [{ text: 'قط', category: 'حي' }])).toBe('قط → حي');
    expect(stringifyValue('dok', 2)).toBe('2');
    expect(stringifyValue('x', null)).toBe('');
  });
});

const dq = (over: any = {}) => ({ id: 'q1', title: 'سؤال', subject: 'علوم', grade: '5', scope: 'shared', createdBy: 't1', createdByRole: 'teacher', creatorName: 'أ. منى', createdAt: '2026-03-01T10:00:00Z', ...over });

describe('الأحداث المستنتجة والدمج', () => {
  it('الإنشاء + سجل المراجعة', () => {
    const ev = deriveEventsFromQuestions([dq({ question: { reviewLog: [
      { at: '2026-03-02T09:00:00Z', by: 'المشرف', byId: 's1', action: 'edited', changes: ['title', 'difficulty'] },
      { at: '2026-03-02T09:05:00Z', by: 'المشرف', byId: 's1', action: 'rejected', note: 'غامض' },
    ] } })]);
    expect(ev.map((e) => e.action)).toEqual(['create', 'review_edit', 'reject']);
    expect(ev[0].byName).toBe('أ. منى');
    expect(ev[1].changes.map((c) => c.label)).toEqual(['نص السؤال', 'الصعوبة']);
    expect(ev[2].note).toBe('غامض');
  });
  it('المشرف من غير اسم', () => {
    expect(deriveEventsFromQuestions([dq({ creatorName: undefined, createdByRole: 'supervisor', createdBy: null })])[0].byName).toBe('مشرف البنك');
  });
  it('الحدث المخزّن بيشيل المستنتج المكرر ومرتب من الأحدث', () => {
    const stored: AuditEvent[] = [
      { id: 's1', at: '2026-03-01T10:00:01Z', byId: 't1', byName: 'أ. منى', action: 'create', questionId: 'q1', title: 'سؤال', subject: 'علوم', grade: '5', scope: 'shared', changes: [], source: 'stored' },
      { id: 's2', at: '2026-04-01T10:00:00Z', byId: 't1', byName: 'أ. منى', action: 'delete', questionId: 'q9', title: 'محذوف', subject: 'علوم', grade: '5', scope: 'shared', changes: [], source: 'stored' },
    ];
    const merged = mergeEvents(stored, deriveEventsFromQuestions([dq(), dq({ id: 'q2', createdAt: '2026-02-01T00:00:00Z' })]));
    expect(merged.map((e) => e.id)).toEqual(['s2', 's1', 'd-create-q2']);
  });
});

describe('الفلاتر والتصدير', () => {
  const evs = deriveEventsFromQuestions([
    dq({ id: 'a', title: 'سؤال الجبر', createdAt: '2026-03-05T12:00:00' }),
    dq({ id: 'b', title: 'سؤال الهندسة', subject: 'رياضيات', createdBy: 't2', creatorName: 'أ. سلمى', createdAt: '2026-03-10T12:00:00', question: { reviewLog: [{ at: '2026-03-11T12:00:00', by: 'المشرف', byId: 's1', action: 'approved' }] } }),
  ]);
  it('مستخدم، عملية، تاريخ، مادة، بحث', () => {
    expect(filterEvents(evs, { user: 't2' }).map((e) => e.questionId)).toEqual(['b']);
    expect(filterEvents(evs, { action: 'approve' })).toHaveLength(1);
    expect(filterEvents(evs, { from: '2026-03-10', to: '2026-03-10' })).toHaveLength(1); // اليوم الأخير شامل
    expect(filterEvents(evs, { subject: 'رياضيات' })).toHaveLength(2);
    expect(filterEvents(evs, { q: 'الجبر' })).toHaveLength(1);
    expect(filterEvents(evs, { from: '2026-04-01' })).toHaveLength(0);
  });
  it('قايمة المستخدمين من غير تكرار', () => {
    expect(uniqueUsers(evs).map((u) => u.name).sort()).toEqual(['أ. سلمى', 'أ. منى', 'المشرف'].sort());
  });
  it('صفوف التصدير: صف لكل تغيير', () => {
    const e: AuditEvent = { id: '1', at: '2026-03-05T12:00:00', byId: 't', byName: 'م', action: 'update', questionId: 'q', title: 'س', subject: 'علوم', grade: '5', scope: 'central', source: 'stored',
      changes: [{ field: 'title', label: 'نص السؤال', before: 'أ', after: 'ب' }, { field: 'difficulty', label: 'الصعوبة', before: 'سهل', after: 'صعب' }] };
    const rows = eventsToRows([e, { ...e, id: '2', changes: [], action: 'delete' }]);
    expect(rows).toHaveLength(3);
    expect(rows[0].slice(0, 4)).toEqual(['2026-03-05', '12:00:00', 'م', 'تعديل سؤال']);
    expect(rows[0].slice(7, 11)).toEqual(['مركزي', 'نص السؤال', 'أ', 'ب']);
    expect(rows[2][3]).toBe('حذف سؤال');
  });
});

describe('wordDiff', () => {
  it('بيبرز الكلمات المضافة والمحذوفة', () => {
    const d = wordDiff('ما هو الماء', 'ما هو الماء النقي');
    expect(d.filter((p) => p.kind === 'add').map((p) => p.text.trim()).join(' ')).toBe('النقي');
    expect(d.filter((p) => p.kind === 'del')).toHaveLength(0);
    const r = wordDiff('أ ب ج', 'أ د ج');
    expect(r.find((p) => p.kind === 'del')?.text).toBe('ب');
    expect(r.find((p) => p.kind === 'add')?.text).toBe('د');
  });
  it('نصوص ضخمة جدًا ما بتهنجش', () => {
    const big = Array.from({ length: 1000 }, (_, i) => `w${i}`).join(' ');
    expect(wordDiff(big, big + ' x').length).toBeGreaterThan(0);
  });
});
