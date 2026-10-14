import { describe, it, expect, vi, beforeEach } from 'vitest';

type Row = Record<string, any>;
const db: { question_bank: Row[]; question_bank_audit: Row[]; auditMissing: boolean } = { question_bank: [], question_bank_audit: [], auditMissing: false };
let seq = 0;

vi.mock('@/lib/supabaseClient', () => {
  const builder = (table: string, mode: 'select' | 'update' | 'delete', patch?: Row) => {
    const filters: ((r: Row) => boolean)[] = [];
    let lim = Infinity;
    const run = () => {
      if (table === 'question_bank_audit' && db.auditMissing) return { data: null, error: { message: 'relation does not exist' } };
      const rows = (db as any)[table] as Row[];
      let hit = rows.filter((r) => filters.every((f) => f(r)));
      if (mode === 'update') hit.forEach((r) => Object.assign(r, patch));
      if (mode === 'delete') (db as any)[table] = rows.filter((r) => !hit.includes(r));
      hit = hit.slice(0, lim);
      // Supabase الحقيقي بيرجّع نسخ مش مراجع للصفوف المخزّنة
      return { data: hit.map((r) => JSON.parse(JSON.stringify(r))), error: null };
    };
    const q: any = {
      eq: (k: string, v: any) => { filters.push((r) => r[k] === v); return q; },
      order: () => q,
      limit: (n: number) => { lim = n; return q; },
      select: () => q,
      single: () => { const r = run(); return Promise.resolve(r.error ? r : { data: r.data![0] ?? null, error: r.data![0] ? null : { message: 'not found' } }); },
      then: (res: any, rej: any) => Promise.resolve(run()).then(res, rej),
    };
    return q;
  };
  return {
    supabase: {
      from: (table: string) => ({
        select: () => builder(table, 'select'),
        update: (patch: Row) => builder(table, 'update', patch),
        delete: () => builder(table, 'delete'),
        insert: (row: Row) => {
          if (table === 'question_bank_audit' && db.auditMissing) return Promise.resolve({ error: { message: 'relation does not exist' } });
          const full = { id: `id${++seq}`, at: new Date().toISOString(), ...row };
          (db as any)[table].push(full);
          const res: any = Promise.resolve({ error: null });
          res.select = () => ({ single: () => Promise.resolve({ data: { id: full.id }, error: null }) });
          return res;
        },
      }),
    },
  };
});

import { createQuestion, updateQuestion, deleteQuestion, addQuestionsToBank } from './questionBankData';
import { setBankAuditActor, getStoredAuditEvents } from './bankAudit';

const flush = () => new Promise((r) => setTimeout(r, 10));
const base = { createdBy: 't1', createdByRole: 'supervisor' as const, scope: 'central' as const, subject: 'علوم', grade: '5', unit: 'U1', bloomLevel: 'تذكر', difficulty: 'سهل', type: 'اختيار من متعدد' };

beforeEach(() => {
  db.question_bank = [];
  db.question_bank_audit = [];
  db.auditMissing = false;
  setBankAuditActor({ id: 'u1', name: 'المشرفة منى', role: 'qb_supervisor' });
});

describe('تسجيل العمليات في سجل التدقيق', () => {
  it('الإضافة بتتسجل باسم المستخدم الحالي', async () => {
    const { id } = await createQuestion({ ...base, question: { title: 'سؤال 1' } });
    await flush();
    expect(db.question_bank_audit).toHaveLength(1);
    expect(db.question_bank_audit[0]).toMatchObject({ action: 'create', question_id: id, title: 'سؤال 1', actor_name: 'المشرفة منى', actor_id: 'u1', scope: 'central' });
  });

  it('التعديل بيسجل القيمة قبل وبعد لكل حقل اتغير', async () => {
    const { id } = await createQuestion({ ...base, question: { title: 'قبل', options: [{ id: '1', text: 'أ', isCorrect: true }] } });
    await flush();
    db.question_bank_audit = [];
    // الـ fake مش بيحط status، فنضيفه زي الداتا الحقيقية
    db.question_bank[0].status = 'approved';
    await updateQuestion(id!, { difficulty: 'صعب', question: { title: 'بعد', options: [{ id: '1', text: 'أ', isCorrect: true }] } });
    await flush();
    expect(db.question_bank_audit).toHaveLength(1);
    const ev = db.question_bank_audit[0];
    expect(ev.action).toBe('update');
    const byField = Object.fromEntries(ev.changes.map((c: any) => [c.field, c]));
    expect(byField.title).toMatchObject({ before: 'قبل', after: 'بعد' });
    expect(byField.difficulty).toMatchObject({ before: 'سهل', after: 'صعب' });
    expect(byField.options).toBeUndefined();
  });

  it('تعديل من غير تغيير فعلي ما بيسجلش حاجة', async () => {
    const { id } = await createQuestion({ ...base, question: { title: 'ثابت' } });
    await flush();
    db.question_bank_audit = [];
    await updateQuestion(id!, { difficulty: 'سهل' });
    await flush();
    expect(db.question_bank_audit).toHaveLength(0);
  });

  it('الحذف بيحفظ لقطة كاملة من السؤال', async () => {
    const { id } = await createQuestion({ ...base, question: { title: 'هيتحذف', correctAnswer: 'س' } });
    await flush();
    const r = await deleteQuestion(id!);
    await flush();
    expect(r.ok).toBe(true);
    expect(db.question_bank).toHaveLength(0);
    const ev = db.question_bank_audit.find((e) => e.action === 'delete')!;
    expect(ev).toMatchObject({ question_id: id, title: 'هيتحذف' });
    expect(ev.snapshot.question.correctAnswer).toBe('س');
  });

  it('الاستيراد بيسجل حدث ملخّص بعدد المضاف والمكرر', async () => {
    const items = [
      { type: 'سؤال مقالي', difficulty: 'سهل', bloomLevel: 'فهم', unit: 'U1', lesson: null, question: { title: 'سؤال طويل بما يكفي أ' } },
      { type: 'سؤال مقالي', difficulty: 'سهل', bloomLevel: 'فهم', unit: 'U1', lesson: null, question: { title: 'سؤال طويل بما يكفي ب' } },
    ];
    await addQuestionsToBank(items as any, { scope: 'central', subject: 'علوم', grade: '5', createdBy: 't1', createdByRole: 'supervisor', skipDuplicates: true, origin: 'import', originNote: 'استيراد QTI من الملف a.zip' });
    await flush();
    const imp = db.question_bank_audit.find((e) => e.action === 'import')!;
    expect(imp.title).toBe('استيراد QTI من الملف a.zip');
    expect(imp.note).toBe('تمت إضافة 2 سؤال، مكرر 0، فشل 0');
    expect(db.question_bank_audit.filter((e) => e.action === 'create')).toHaveLength(2);
  });
});

describe('لو جدول السجل مش موجود', () => {
  it('العمليات الأصلية بتنجح عادي والقراءة بترجع available=false', async () => {
    db.auditMissing = true;
    const { id, error } = await createQuestion({ ...base, question: { title: 'بدون جدول' } });
    expect(error).toBeNull();
    db.question_bank[0].status = 'approved';
    expect((await updateQuestion(id!, { difficulty: 'صعب' })).ok).toBe(true);
    expect((await deleteQuestion(id!)).ok).toBe(true);
    await flush();
    const r = await getStoredAuditEvents();
    expect(r).toEqual({ events: [], available: false });
  });

  it('القراءة بترجع الأحداث المخزّنة بالشكل الصح', async () => {
    await createQuestion({ ...base, question: { title: 'س' } });
    await flush();
    const r = await getStoredAuditEvents();
    expect(r.available).toBe(true);
    expect(r.events[0]).toMatchObject({ action: 'create', byName: 'المشرفة منى', source: 'stored', title: 'س' });
  });
});
