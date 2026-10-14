-- جدول سجل التدقيق لبنك الأسئلة (جدول جديد، مفيش تعديل على أي جدول موجود).
-- شغّله مرة واحدة من Supabase → SQL Editor. لحد ما يتشغل، السجل بيعرض الإضافة والاعتماد والإرجاع وتعديلات المراجع بس
-- (المستنتجة من الأسئلة نفسها). بعد ما يتشغل بيبدأ يسجل: التعديل (قبل/بعد) والحذف والاستيراد والنسخ والتصدير.

create table if not exists public.question_bank_audit (
  id           uuid primary key default gen_random_uuid(),
  at           timestamptz not null default now(),
  actor_id     text,
  actor_name   text not null default 'غير معروف',
  actor_role   text,
  action       text not null check (action in ('create','update','delete','import','copy','export')),
  question_id  text,
  title        text,
  subject      text,
  grade        text,
  scope        text,
  changes      jsonb not null default '[]'::jsonb,   -- [{field,label,before,after}]
  snapshot     jsonb,                                  -- لقطة السؤال وقت الحذف
  note         text
);

create index if not exists question_bank_audit_at_idx on public.question_bank_audit (at desc);
create index if not exists question_bank_audit_question_idx on public.question_bank_audit (question_id);

-- الصلاحيات: السجل بيتكتب من التطبيق ويتقرأ من المشرف. لو RLS مفعّل عندك، اضبط السياسات حسب نظامكم.
-- مثال (عدّله): السماح بالإضافة للمستخدمين المسجلين، والقراءة للمشرفين بس.
-- alter table public.question_bank_audit enable row level security;
-- create policy "audit insert" on public.question_bank_audit for insert to authenticated with check (true);
-- create policy "audit read supervisors" on public.question_bank_audit for select to authenticated using (<شرط المشرف عندكم>);
-- ويُفضَّل منع التعديل والحذف على السجل (من غير policy للـ update/delete).
