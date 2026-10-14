import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

import { convertBankQuestionToQuizQuestion, type BankQuestion } from './questionBankData';

const bq = (question: any): BankQuestion => ({
  id: 'q1', title: question.title, createdBy: null, createdByRole: 'teacher', scope: 'central', subject: 'رياضيات', grade: '9',
  unit: 'u', lesson: null, bloomLevel: 'فهم', difficulty: 'سهل', type: 'اختيار من متعدد', question, status: 'approved',
  rejectionNote: null, createdAt: '2026-01-01',
} as unknown as BankQuestion);

describe('تحويل سؤال البنك لسؤال اختبار', () => {
  it('بيحمل النص الغني والفيديو والتلميح والعمق المعرفي والصوت', () => {
    const out = convertBankQuestionToQuizQuestion(bq({
      title: 'احسب $\\frac{1}{2}$',
      titleHtml: '<p>احسب <span class="tl-math" data-latex="\\frac{1}{2}">$x$</span></p>',
      audioUrl: 'https://x.test/a.webm',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ', videoStart: 5, videoEnd: 20,
      hint: { text: 'فكّر' }, dok: 2,
      options: [{ id: '1', text: 'a', isCorrect: true }],
    }));
    expect(out.text).toBe('احسب $\\frac{1}{2}$');
    expect(out.textHtml).toContain('tl-math');
    expect(out).toMatchObject({ audioUrl: 'https://x.test/a.webm', videoUrl: 'https://youtu.be/dQw4w9WgXcQ', videoStart: 5, videoEnd: 20, hint: { text: 'فكّر' }, dok: 2 });
  });
  it('سؤال قديم من غير حقول جديدة بيشتغل زي الأول', () => {
    const out = convertBankQuestionToQuizQuestion(bq({ title: 'قديم' }));
    expect(out.textHtml).toBeUndefined();
    expect(out.videoUrl).toBeUndefined();
    expect(out.hint).toBeUndefined();
  });
});
