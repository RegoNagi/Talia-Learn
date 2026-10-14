import { describe, it, expect } from 'vitest';
import { normalizeBankTitle, planBankInsert } from './bankTransfer';

const q = (title: string) => ({ question: { title } });

describe('planBankInsert', () => {
  it('بيطبّع التشكيل والمسافات والحروف الكبيرة', () => {
    expect(normalizeBankTitle('  عَاصِمَةُ   قطر ')).toBe('عاصمة قطر');
    expect(normalizeBankTitle('Capital  OF Qatar')).toBe('capital of qatar');
  });

  it('بيفصل المكرر الموجود في البنك الهدف', () => {
    const res = planBankInsert([q('عاصمة قطر'), q('سؤال جديد')], ['عَاصِمَة قطر'], true);
    expect(res.duplicates.map((d) => d.question.title)).toEqual(['عاصمة قطر']);
    expect(res.toInsert.map((d) => d.question.title)).toEqual(['سؤال جديد']);
  });

  it('بيمنع التكرار جوه الدفعة نفسها', () => {
    const res = planBankInsert([q('أ'), q('أ'), q('ب')], [], true);
    expect(res.toInsert).toHaveLength(2);
    expect(res.duplicates).toHaveLength(1);
  });

  it('لو التجاهل مقفول بيدخل الكل', () => {
    const res = planBankInsert([q('أ'), q('أ')], ['أ'], false);
    expect(res.toInsert).toHaveLength(2);
    expect(res.duplicates).toHaveLength(0);
  });

  it('عنوان فاضي مش بيتعامل كمكرر', () => {
    const res = planBankInsert([q(''), q('')], [''], true);
    expect(res.toInsert).toHaveLength(2);
  });
});
