'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Download, Loader2, Search, ShieldAlert, RotateCcw, GitCompare } from 'lucide-react';
import { getAllQuestionsWithAuthors } from '@/services/questionBankData';
import { getStoredAuditEvents } from '@/services/bankAudit';
import {
  ACTION_LABELS, AUDIT_EXPORT_HEADER, deriveEventsFromQuestions, eventsToRows, filterEvents, formatDate, formatTimeOfDay,
  mergeEvents, stringifyValue, uniqueUsers, wordDiff, type AuditAction, type AuditEvent, type AuditFilters, type FieldChange,
} from '@/lib/auditLog';
import { buildXlsx, downloadBytes, XLSX_MIME } from '@/lib/xlsxLite';

const PAGE = 50;
const field = 'h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-violet-400';
const lab = 'flex flex-col gap-1 text-xs font-bold text-slate-500';

function DiffText({ before, after }: { before: string; after: string }) {
  const parts = useMemo(() => wordDiff(before, after), [before, after]);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap" dir="auto">
      {parts.map((p, i) => p.kind === 'same' ? <span key={i}>{p.text}</span>
        : p.kind === 'add' ? <ins key={i} className="bg-emerald-100 text-emerald-800 no-underline rounded px-0.5">{p.text}</ins>
        : <del key={i} className="bg-rose-100 text-rose-700 rounded px-0.5">{p.text}</del>)}
    </p>
  );
}

function ChangeRow({ c, language, mode }: { c: FieldChange; language: 'ar' | 'en'; mode: 'sidebyside' | 'inline' }) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const hasValues = c.before !== null || c.after !== null;
  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 text-xs font-extrabold text-slate-600">{c.label}</div>
      {!hasValues ? (
        <p className="px-4 py-3 text-xs text-slate-400">{t('تم تعديل هذا الحقل (القيم السابقة غير مسجّلة لهذه العملية).', 'This field was changed (previous values were not recorded for this operation).')}</p>
      ) : mode === 'inline' ? (
        <div className="px-4 py-3"><DiffText before={c.before || ''} after={c.after || ''} /></div>
      ) : (
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 rtl:md:divide-x-reverse">
          <div className="px-4 py-3"><p className="text-[10px] font-bold text-rose-500 mb-1">{t('قبل', 'Before')}</p><p className="text-sm whitespace-pre-wrap" dir="auto">{c.before || <em className="text-slate-300">{t('فاضي', 'empty')}</em>}</p></div>
          <div className="px-4 py-3"><p className="text-[10px] font-bold text-emerald-600 mb-1">{t('بعد', 'After')}</p><p className="text-sm whitespace-pre-wrap" dir="auto">{c.after || <em className="text-slate-300">{t('فاضي', 'empty')}</em>}</p></div>
        </div>
      )}
    </div>
  );
}

function snapshotLines(snapshot: unknown): FieldChange[] {
  const row = snapshot as { subject?: string; grade?: string; unit?: string; difficulty?: string; bloom_level?: string; type?: string; question?: Record<string, unknown> } | undefined;
  if (!row) return [];
  const q = row.question || {};
  const out: FieldChange[] = [];
  const add = (label: string, v: unknown, key = '') => { const s = stringifyValue(key, v); if (s) out.push({ field: key || label, label, before: s, after: null }); };
  add('نوع السؤال', row.type); add('الوحدة', row.unit); add('الصعوبة', row.difficulty); add('مستوى بلوم', row.bloom_level);
  add('نص السؤال', q.title, 'title'); add('الخيارات', q.options, 'options'); add('الإجابة الصحيحة', q.correctAnswer, 'correctAnswer'); add('الإجابة النموذجية', q.modelAnswer, 'modelAnswer');
  return out;
}

export function AuditLogView({ language }: { language: 'ar' | 'en' }) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [storedAvailable, setStoredAvailable] = useState(true);
  const [f, setF] = useState<AuditFilters>({ action: '' });
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [mode, setMode] = useState<'sidebyside' | 'inline'>('sidebyside');

  useEffect(() => {
    let alive = true;
    Promise.all([getAllQuestionsWithAuthors(), getStoredAuditEvents()]).then(([qs, stored]) => {
      if (!alive) return;
      setEvents(mergeEvents(stored.events, deriveEventsFromQuestions(qs)));
      setStoredAvailable(stored.available);
    });
    return () => { alive = false; };
  }, []);

  const all = events || [];
  const shown = useMemo(() => filterEvents(all, f), [all, f]);
  const users = useMemo(() => uniqueUsers(all), [all]);
  const subjects = useMemo(() => [...new Set(all.map((e) => e.subject).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ar')), [all]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const slice = shown.slice(cur * PAGE, cur * PAGE + PAGE);
  const set = (patch: Partial<AuditFilters>) => { setF((p) => ({ ...p, ...patch })); setPage(0); };

  const exportXlsx = () => {
    const bytes = buildXlsx([{ name: 'سجل التدقيق', rows: [AUDIT_EXPORT_HEADER, ...eventsToRows(shown)] }]);
    downloadBytes(bytes, `audit-log-${formatDate(new Date().toISOString())}.xlsx`, XLSX_MIME);
  };

  if (!events) return <div className="p-16 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-5" data-testid="audit-log">
      {!storedAvailable && (
        <div className="flex gap-3 items-start bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-4 text-sm" role="note">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <p>{t('السجل الحالي بيعرض الإضافة والاعتماد والإرجاع وتعديلات المراجع (مستنتجة من الأسئلة نفسها). لتسجيل تعديلات المعلمين بالقيم قبل وبعد، والحذف، والاستيراد والنسخ والتصدير: شغّل ملف sql/question_bank_audit.sql مرة واحدة في Supabase.', 'The log currently shows creation, approvals, rejections and reviewer edits (derived from the questions). To also record teacher edits with before/after values, deletions, imports, copies and exports, run sql/question_bank_audit.sql once in Supabase.')}</p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
        <label className={lab}>{t('المستخدم', 'User')}
          <select className={field} value={f.user || ''} onChange={(e) => set({ user: e.target.value })}>
            <option value="">{t('الكل', 'All')}</option>
            {users.map((u) => <option key={u.key} value={u.key}>{u.name}</option>)}
          </select>
        </label>
        <label className={lab}>{t('نوع العملية', 'Operation')}
          <select className={field} value={f.action || ''} onChange={(e) => set({ action: e.target.value as AuditAction | '' })}>
            <option value="">{t('الكل', 'All')}</option>
            {(Object.keys(ACTION_LABELS) as AuditAction[]).map((a) => <option key={a} value={a}>{ACTION_LABELS[a][language]}</option>)}
          </select>
        </label>
        <label className={lab}>{t('المادة', 'Subject')}
          <select className={field} value={f.subject || ''} onChange={(e) => set({ subject: e.target.value })}>
            <option value="">{t('الكل', 'All')}</option>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
        <label className={lab}>{t('من تاريخ', 'From')}<input type="date" className={field} value={f.from || ''} onChange={(e) => set({ from: e.target.value })} /></label>
        <label className={lab}>{t('إلى تاريخ', 'To')}<input type="date" className={field} value={f.to || ''} onChange={(e) => set({ to: e.target.value })} /></label>
        <label className={lab}>{t('بحث', 'Search')}
          <span className="relative"><Search size={14} className="absolute top-3 start-3 text-slate-400" /><input className={`${field} w-full ps-9`} value={f.q || ''} onChange={(e) => set({ q: e.target.value })} placeholder={t('نص السؤال أو الملاحظة', 'Question or note')} /></span>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-600">{t(`${shown.length} عملية`, `${shown.length} operations`)}{shown.length !== all.length && <span className="text-slate-400 font-medium"> {t(`من ${all.length}`, `of ${all.length}`)}</span>}</p>
        <div className="flex items-center gap-2">
          <button onClick={() => { setF({ action: '' }); setPage(0); }} className="px-4 h-10 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><RotateCcw size={14} />{t('مسح الفلاتر', 'Reset')}</button>
          <button onClick={exportXlsx} disabled={!shown.length} className="px-4 h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center gap-2"><Download size={14} />{t('تصدير Excel', 'Export Excel')}</button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {slice.length === 0 ? (
          <p className="p-12 text-center text-sm text-slate-400">{t('مفيش عمليات مطابقة للفلاتر.', 'No operations match the filters.')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {slice.map((e) => {
              const isOpen = open === e.id;
              const details = e.action === 'delete' ? snapshotLines(e.snapshot) : e.changes;
              const expandable = details.length > 0 || !!e.note;
              return (
                <li key={e.id} data-testid="audit-row">
                  <button type="button" disabled={!expandable} onClick={() => setOpen(isOpen ? null : e.id)} className={`w-full text-start px-5 py-3.5 flex items-center gap-4 ${expandable ? 'hover:bg-slate-50' : 'cursor-default'}`}>
                    <div className="w-28 shrink-0 text-xs text-slate-500"><p className="font-bold text-slate-700">{formatDate(e.at)}</p><p>{formatTimeOfDay(e.at)}</p></div>
                    <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full border ${ACTION_LABELS[e.action].tone}`}>{ACTION_LABELS[e.action][language]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate" dir="auto">{e.title || '—'}</p>
                      <p className="text-xs text-slate-500">{e.byName}{e.subject ? ` · ${e.subject}` : ''}{e.grade ? ` · ${e.grade}` : ''}</p>
                    </div>
                    {e.changes.length > 0 && e.action !== 'create' && <span className="text-xs text-slate-400 shrink-0">{t(`${e.changes.length} حقل`, `${e.changes.length} fields`)}</span>}
                    {expandable && (isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />)}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 space-y-3 bg-slate-50/50">
                      {e.note && <p className="text-sm text-slate-600 bg-white border border-slate-100 rounded-xl px-4 py-2" dir="auto">{e.note}</p>}
                      {e.action === 'delete' && <p className="text-xs font-bold text-rose-600">{t('لقطة السؤال وقت الحذف:', 'Question snapshot at deletion:')}</p>}
                      {details.length > 0 && e.action !== 'delete' && e.changes.some((c) => c.before !== null && c.after !== null) && (
                        <button type="button" onClick={() => setMode((m) => (m === 'inline' ? 'sidebyside' : 'inline'))} className="text-xs font-bold text-violet-700 flex items-center gap-1.5"><GitCompare size={13} />{mode === 'inline' ? t('عرض قبل / بعد جنب بعض', 'Side by side') : t('مقارنة الفروق (تمييز الكلمات)', 'Compare differences (highlight)')}</button>
                      )}
                      {e.action === 'delete'
                        ? details.map((c) => <div key={c.field} className="border border-slate-100 rounded-xl bg-white px-4 py-2"><p className="text-[11px] font-extrabold text-slate-500">{c.label}</p><p className="text-sm whitespace-pre-wrap" dir="auto">{c.before}</p></div>)
                        : details.map((c) => <ChangeRow key={c.field} c={c} language={language} mode={mode} />)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm font-bold text-slate-600">
          <button disabled={cur === 0} onClick={() => setPage(cur - 1)} className="px-4 h-9 rounded-lg border border-slate-200 disabled:opacity-40">{t('السابق', 'Prev')}</button>
          <span>{cur + 1} / {pages}</span>
          <button disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)} className="px-4 h-9 rounded-lg border border-slate-200 disabled:opacity-40">{t('التالي', 'Next')}</button>
        </div>
      )}
    </div>
  );
}
