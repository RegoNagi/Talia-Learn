import { describe, it, expect } from 'vitest';
import { auditQuestion, worstSeverity, type AuditInput, type AuditPoolItem } from './questionAudit';
import { appendReviewLog, changedFields } from './reviewLog';

const base = (over: Partial<AuditInput>): AuditInput => ({ id: 'q1', type: 'اختيار من متعدد', title: 'ما عاصمة دولة قطر؟', subject: 'جغرافيا', grade: '5', question: {}, ...over });
const mcq = (opts: [string, boolean][]) => ({ options: opts.map(([text, isCorrect]) => ({ text, isCorrect })) });
const codes = (q: AuditInput, pool?: AuditPoolItem[]) => auditQuestion(q, pool).map((i) => i.code);

describe('auditQuestion', () => {
  it('سؤال سليم بدون ملاحظات', () => {
    expect(codes(base({ question: mcq([['الدوحة', true], ['الرياض', false], ['مسقط', false]]) }))).toEqual([]);
  });

  it('اختيار من متعدد من غير إجابة صحيحة وبخيارات متطابقة', () => {
    const c = codes(base({ question: mcq([['أ', false], ['أ', false], ['ب', false]]) }));
    expect(c).toContain('NO_CORRECT');
    expect(c).toContain('DUP_OPTIONS');
  });

  it('خيارات أقل من اثنين', () => {
    expect(codes(base({ question: mcq([['الدوحة', true]]) }))).toContain('TOO_FEW_OPTIONS');
  });

  it('خيار فاضي', () => {
    expect(codes(base({ question: mcq([['الدوحة', true], ['الرياض', false], ['', false]]) }))).toContain('EMPTY_OPTION');
  });

  it('عنوان فاضي وقصير', () => {
    expect(codes(base({ title: '  ', question: mcq([['أ', true], ['ب', false]]) }))).toContain('EMPTY_TITLE');
    expect(codes(base({ title: 'ما؟', question: mcq([['أ', true], ['ب', false]]) }))).toContain('SHORT_TITLE');
  });

  it('كلمة مكررة ومسافات وترقيم', () => {
    const c = codes(base({ title: 'ما هي هي عاصمة  قطر؟؟', question: mcq([['أ', true], ['ب', false]]) }));
    expect(c).toContain('REPEATED_WORD');
    expect(c).toContain('SPACING');
    expect(c).toContain('REPEATED_PUNCT');
  });

  it('صيغة استفهام من غير علامة استفهام، إلا في أكمل الفراغ', () => {
    expect(codes(base({ title: 'ما عاصمة قطر', question: mcq([['أ', true], ['ب', false]]) }))).toContain('MISSING_QMARK');
    expect(codes(base({ type: 'أكمل الفراغ', title: 'ما عاصمة قطر ____', question: { correctAnswer: 'الدوحة' } }))).not.toContain('MISSING_QMARK');
  });

  it('أنواع تانية', () => {
    expect(codes(base({ type: 'أكمل الفراغ', title: 'عاصمة قطر هي ____', question: {} }))).toContain('NO_BLANK_ANSWER');
    expect(codes(base({ type: 'إجابة رقمية', title: 'احسب الناتج هنا', question: { numericAnswer: null } }))).toContain('NO_NUMERIC_ANSWER');
    expect(codes(base({ type: 'توصيل', title: 'صل كل دولة بعاصمتها', question: { pairs: [{ left: 'قطر', right: '' }] } }))).toEqual(expect.arrayContaining(['FEW_PAIRS', 'EMPTY_PAIR']));
    expect(codes(base({ type: 'ترتيب', title: 'رتب الخطوات التالية', question: { orderItems: ['أ', 'أ'] } }))).toEqual(expect.arrayContaining(['DUP_ORDER']));
    expect(codes(base({ type: 'سؤال مقالي', title: 'اشرح دورة الماء في الطبيعة', question: {} }))).toContain('NO_MODEL_ANSWER');
  });
});

describe('كشف التكرار', () => {
  const pool: AuditPoolItem[] = [
    { id: 'p1', title: 'ما عَاصِمَة دولة قطر؟', subject: 'جغرافيا', grade: '5', status: 'approved' },
    { id: 'p2', title: 'سؤال في مادة تانية بنفس النص', subject: 'علوم', grade: '5', status: 'approved' },
    { id: 'p3', title: 'ما عاصمة دولة قطر؟ وما أهم معالمها السياحية والتاريخية', subject: 'جغرافيا', grade: '5', status: 'pending' },
  ];
  const good = mcq([['الدوحة', true], ['الرياض', false]]);

  it('تطابق تام بعد تجاهل التشكيل', () => {
    const issues = auditQuestion(base({ question: good }), pool);
    const dup = issues.find((i) => i.code === 'DUPLICATE');
    expect(dup?.refId).toBe('p1');
  });

  it('التطابق مع نفس السؤال أو مادة تانية أو سؤال مرفوض مش بيتحسب', () => {
    expect(auditQuestion(base({ id: 'p1', title: 'ما عاصمة دولة قطر؟', question: good }), [pool[0]]).map((i) => i.code)).not.toContain('DUPLICATE');
    expect(auditQuestion(base({ title: 'سؤال في مادة تانية بنفس النص', question: good }), pool).map((i) => i.code)).not.toContain('DUPLICATE');
    expect(auditQuestion(base({ question: good }), [{ ...pool[0], status: 'rejected' }]).map((i) => i.code)).toEqual([]);
  });

  it('تشابه بالاحتواء لو النص طويل كفاية', () => {
    const only3 = [pool[2]];
    const issues = auditQuestion(base({ question: good }), only3);
    expect(issues.map((i) => i.code)).toContain('NEAR_DUPLICATE');
  });

  it('worstSeverity', () => {
    expect(worstSeverity([])).toBeNull();
    expect(worstSeverity([{ code: 'a', severity: 'info', ar: '', en: '' }, { code: 'b', severity: 'error', ar: '', en: '' }])).toBe('error');
  });
});

describe('reviewLog', () => {
  it('بيضيف ويحتفظ بآخر 30 بس', () => {
    let q: { x: number; reviewLog?: ReturnType<typeof appendReviewLog>['reviewLog'] } = { x: 1 };
    for (let i = 0; i < 35; i++) q = appendReviewLog(q, { at: String(i), by: 'م', byId: null, action: 'approved' });
    expect(q.reviewLog).toHaveLength(30);
    expect(q.reviewLog?.[0].at).toBe('5');
    expect(q.x).toBe(1);
  });

  it('changedFields بيرجع أسماء الحقول المتغيرة بس', () => {
    expect(changedFields({ title: 'أ', options: [1] }, { title: 'ب', options: [1], reviewLog: [] })).toEqual(['title']);
    expect(changedFields({}, {}, { before: { difficulty: 'سهل' }, after: { difficulty: 'صعب' } })).toEqual(['difficulty']);
  });
});
