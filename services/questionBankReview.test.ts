import { describe, it, expect, vi, beforeEach } from 'vitest';

type Row = Record<string, any>;
const db: { question_bank: Row[] } = { question_bank: [] };

// عميل Supabase وهمي بالحد الأدنى اللازم لدوال المراجعة (select/in/eq/single/update)
vi.mock('@/lib/supabaseClient', () => {
  const makeQuery = (rows: Row[], mode: 'select' | 'update', patch?: Row) => {
    let filters: ((r: Row) => boolean)[] = [];
    const run = () => {
      const hit = rows.filter((r) => filters.every((f) => f(r)));
      if (mode === 'update') hit.forEach((r) => Object.assign(r, patch));
      return hit;
    };
    const q: any = {
      select: () => q,
      eq: (k: string, v: any) => { filters.push((r) => r[k] === v); return q; },
      neq: (k: string, v: any) => { filters.push((r) => r[k] !== v); return q; },
      in: (k: string, vs: any[]) => { filters.push((r) => vs.includes(r[k])); return q; },
      single: () => { const hit = run(); return Promise.resolve(hit[0] ? { data: hit[0], error: null } : { data: null, error: { message: 'not found' } }); },
      then: (res: any, rej: any) => Promise.resolve(mode === 'update' ? { error: null, data: run() } : { data: run(), error: null }).then(res, rej),
    };
    return q;
  };
  return { supabase: { from: (table: 'question_bank') => ({ select: () => makeQuery(db[table], 'select'), update: (patch: Row) => makeQuery(db[table], 'update', patch) }) } };
});

import { reviewQuestions, updateReviewedQuestion, updateQuestion, getAuditPool } from './questionBankData';

const reviewer = { id: 't1', name: 'المشرفة' };
beforeEach(() => {
  db.question_bank = [
    { id: 'a', status: 'pending', unit: 'U1', lesson: null, bloom_level: 'تذكر', difficulty: 'سهل', subject: 'علوم', grade: '5', question: { title: 'سؤال أ', options: [{ id: '1', text: 'x', isCorrect: true }] } },
    { id: 'b', status: 'pending', unit: 'U1', lesson: null, bloom_level: 'فهم', difficulty: 'متوسط', subject: 'علوم', grade: '5', question: { title: 'سؤال ب' } },
    { id: 'c', status: 'approved', unit: 'U1', lesson: null, bloom_level: 'فهم', difficulty: 'متوسط', subject: 'علوم', grade: '5', question: { title: 'سؤال ج' }, rejection_note: null },
    { id: 'd', status: 'rejected', unit: 'U1', lesson: null, bloom_level: 'فهم', difficulty: 'متوسط', subject: 'علوم', grade: '5', question: { title: 'سؤال د' } },
  ];
});

describe('reviewQuestions', () => {
  it('بيعتمد مجموعة معلّقة ويسجل المراجع في السجل', async () => {
    const r = await reviewQuestions(['a', 'b'], 'approved', reviewer);
    expect(r).toEqual({ done: 2, skipped: 0, failed: 0 });
    const a = db.question_bank[0];
    expect(a.status).toBe('approved');
    expect(a.rejection_note).toBeNull();
    expect(a.question.reviewLog).toHaveLength(1);
    expect(a.question.reviewLog[0]).toMatchObject({ by: 'المشرفة', byId: 't1', action: 'approved' });
    expect(a.question.title).toBe('سؤال أ');
  });

  it('بيتخطى المعتمد والمرفوض من قبل ومبيلمسهوش', async () => {
    const r = await reviewQuestions(['a', 'c', 'd'], 'approved', reviewer);
    expect(r).toEqual({ done: 1, skipped: 2, failed: 0 });
    expect(db.question_bank[3].status).toBe('rejected');
    expect(db.question_bank[2].question.reviewLog).toBeUndefined();
  });

  it('الرفض بيحفظ السبب في rejection_note وفي السجل', async () => {
    await reviewQuestions(['b'], 'rejected', reviewer, 'الصياغة غامضة');
    const b = db.question_bank[1];
    expect(b.status).toBe('rejected');
    expect(b.rejection_note).toBe('الصياغة غامضة');
    expect(b.question.reviewLog[0]).toMatchObject({ action: 'rejected', note: 'الصياغة غامضة' });
  });

  it('قائمة فاضية', async () => {
    expect(await reviewQuestions([], 'approved', reviewer)).toEqual({ done: 0, skipped: 0, failed: 0 });
  });
});

describe('updateReviewedQuestion', () => {
  it('بيحدّث الحقول ويسجل أسماء اللي اتغير بس', async () => {
    const res = await updateReviewedQuestion('a', {
      difficulty: 'صعب', unit: 'U1',
      question: { title: 'سؤال أ بعد التعديل', options: [{ id: '1', text: 'x', isCorrect: true }] },
    }, reviewer);
    expect(res.ok).toBe(true);
    const a = db.question_bank[0];
    expect(a.difficulty).toBe('صعب');
    expect(a.question.title).toBe('سؤال أ بعد التعديل');
    expect(a.question.reviewLog[0].action).toBe('edited');
    expect(a.question.reviewLog[0].changes.sort()).toEqual(['difficulty', 'title']);
    expect(a.status).toBe('pending'); // التعديل لوحده ما يعتمدش السؤال
  });

  it('لو مفيش تغيير مبيكتبش سجل', async () => {
    const res = await updateReviewedQuestion('a', { question: { title: 'سؤال أ', options: [{ id: '1', text: 'x', isCorrect: true }] } }, reviewer);
    expect(res.ok).toBe(true);
    expect(db.question_bank[0].question.reviewLog).toBeUndefined();
  });

  it('سؤال مش موجود', async () => {
    const res = await updateReviewedQuestion('zzz', { question: { title: 'x' } }, reviewer);
    expect(res.ok).toBe(false);
  });

  it('سجل المراجعة القديم بيتحافظ عليه مع التعديل', async () => {
    await reviewQuestions(['b'], 'rejected', reviewer, 'n');
    db.question_bank[1].status = 'pending';
    await updateReviewedQuestion('b', { question: { title: 'سؤال ب معدل' } }, reviewer);
    expect(db.question_bank[1].question.reviewLog.map((e: any) => e.action)).toEqual(['rejected', 'edited']);
  });
});

describe('updateQuestion resubmit + getAuditPool', () => {
  it('resubmit بيرجّع السؤال معلّق ويمسح سبب الرفض', async () => {
    db.question_bank[3].rejection_note = 'قديم';
    await updateQuestion('d', { difficulty: 'سهل', resubmit: true });
    expect(db.question_bank[3]).toMatchObject({ status: 'pending', rejection_note: null, difficulty: 'سهل' });
  });

  it('من غير resubmit الحالة بتفضل زي ما هي', async () => {
    await updateQuestion('c', { difficulty: 'صعب' });
    expect(db.question_bank[2].status).toBe('approved');
  });

  it('getAuditPool بيستثني المرفوض', async () => {
    const pool = await getAuditPool();
    expect(pool.map((p) => p.id).sort()).toEqual(['a', 'b', 'c']);
    expect(pool[0]).toHaveProperty('title');
  });
});
