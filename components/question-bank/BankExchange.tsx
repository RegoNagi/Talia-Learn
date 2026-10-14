'use client';

import { useMemo, useRef, useState } from 'react';
import { UploadCloud, DownloadCloud, Copy, X, Loader2, Check, AlertTriangle, ShieldCheck, Pencil } from 'lucide-react';
import { logBankEvent } from '@/services/bankAudit';
import { addQuestionsToBank, type BankQuestion, type BankScope, type NewBankQuestion, type AddBatchResult } from '@/services/questionBankData';
import { buildQtiPackage, exportSummary, parseQtiFile, type ParsedQtiQuestion, type QtiExportItem, type QtiQuestionContent } from '@/lib/qti';
import type { BankQuestionContent } from '@/services/questionBankData';
import { auditQuestion, worstSeverity, type AuditContent, type IssueSeverity } from '@/lib/questionAudit';

type Lang = 'ar' | 'en';
type Dialog = null | 'import' | 'export' | 'copy' | 'audit';

interface Props {
  language: Lang;
  subject: string;
  grade: string;
  questions: BankQuestion[]; // أسئلة المادة والصف الحاليين (المسموح للمستخدم يشوفها)
  teacherId: string | null;
  isSupervisor: boolean;
  onChanged: () => void;
  onEditQuestion?: (q: BankQuestion) => void;
}

const SCOPES: { value: BankScope; ar: string; en: string }[] = [
  { value: 'central', ar: 'بنك مركزي (الوزارة)', en: 'Central Bank (Ministry)' },
  { value: 'shared', ar: 'بنك مشترك (المدرسة)', en: 'Shared Bank (School)' },
  { value: 'private', ar: 'بنكي الخاص (المعلم)', en: 'My Private Bank (Teacher)' },
];

const DIFFICULTIES = ['سهل', 'متوسط', 'صعب'];
const BLOOMS = ['تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'ابتكار'];

const btn = 'px-6 py-2.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-bold rounded-xl flex items-center gap-2 transition-colors shadow-none text-sm';
const primary = 'px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed';
const field = 'h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-violet-500';

export function BankExchange({ language, subject, grade, questions, teacherId, isSupervisor, onChanged, onEditQuestion }: Props) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = () => setDialog(null);
  const scopeLabel = (s: BankScope) => { const x = SCOPES.find((v) => v.value === s); return x ? (language === 'ar' ? x.ar : x.en) : s; };
  const role: 'teacher' | 'supervisor' = isSupervisor ? 'supervisor' : 'teacher';

  return (
    <>
      <button onClick={() => setDialog('import')} className={btn}>
        <UploadCloud size={18} /> {t('استيراد بنك أسئلة (QTI)', 'Import Question Bank (QTI)')}
      </button>
      <button onClick={() => setDialog('export')} className={btn}>
        <DownloadCloud size={18} /> {t('تصدير البنك الحالي (QTI)', 'Export Current Bank (QTI)')}
      </button>
      <button onClick={() => setDialog('copy')} className={btn}>
        <Copy size={18} /> {t('نسخ بين البنوك', 'Copy Between Banks')}
      </button>
      <button onClick={() => setDialog('audit')} className={btn}>
        <ShieldCheck size={18} /> {t('تنقيح البنك', 'Bank Audit')}
      </button>

      {dialog === 'import' && (
        <ImportDialog t={t} subject={subject} grade={grade} teacherId={teacherId} role={role} scopeLabel={scopeLabel} onClose={close} onChanged={onChanged} />
      )}
      {dialog === 'export' && <ExportDialog t={t} subject={subject} grade={grade} questions={questions} onClose={close} />}
      {dialog === 'audit' && (
        <AuditDialog t={t} language={language} subject={subject} grade={grade} questions={questions} onClose={close} onEdit={onEditQuestion ? (q) => { close(); onEditQuestion(q); } : undefined} />
      )}
      {dialog === 'copy' && (
        <CopyDialog t={t} subject={subject} grade={grade} questions={questions} teacherId={teacherId} role={role} scopeLabel={scopeLabel} onClose={close} onChanged={onChanged} />
      )}
    </>
  );
}

// ---------------------------------------------------------------- مشترك

type T = (ar: string, en: string) => string;

function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" role="dialog" aria-modal="true">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[88vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500" aria-label="close"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

function ResultBox({ t, result, pendingNote }: { t: T; result: AddBatchResult; pendingNote: boolean }) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-slate-700 space-y-1">
      <p className="font-bold text-emerald-700 flex items-center gap-2"><Check size={16} /> {t(`تم إضافة ${result.created} سؤال`, `${result.created} question(s) added`)}</p>
      {result.duplicates > 0 && <p>{t(`${result.duplicates} سؤال مكرر اتخطّى`, `${result.duplicates} duplicate(s) skipped`)}</p>}
      {pendingNote && result.created > 0 && <p>{t('الأسئلة دخلت "معلّقة" لحد ما مشرف بنك الأسئلة يعتمدها.', 'Questions were added as "pending" until the bank supervisor approves them.')}</p>}
      {result.failed.length > 0 && (
        <div className="text-rose-600">
          <p className="font-bold">{t(`${result.failed.length} سؤال فشل:`, `${result.failed.length} failed:`)}</p>
          <ul className="list-disc pr-5 ltr:pl-5 ltr:pr-0">{result.failed.slice(0, 5).map((f, i) => <li key={i}>{f.title.slice(0, 60)} — {f.error}</li>)}</ul>
        </div>
      )}
    </div>
  );
}

function ScopeSelect({ t, value, onChange, scopeLabel, disabledScope }: { t: T; value: BankScope; onChange: (s: BankScope) => void; scopeLabel: (s: BankScope) => string; disabledScope?: BankScope }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
      {t('البنك المستهدف', 'Target bank')}
      <select className={field} value={value} onChange={(e) => onChange(e.target.value as BankScope)}>
        {SCOPES.map((s) => <option key={s.value} value={s.value} disabled={s.value === disabledScope}>{scopeLabel(s.value)}</option>)}
      </select>
    </label>
  );
}

const needsApproval = (scope: BankScope, role: 'teacher' | 'supervisor') => role !== 'supervisor' && scope !== 'private';

// ---------------------------------------------------------------- استيراد

function ImportDialog({ t, subject, grade, teacherId, role, scopeLabel, onClose, onChanged }: {
  t: T; subject: string; grade: string; teacherId: string | null; role: 'teacher' | 'supervisor';
  scopeLabel: (s: BankScope) => string; onClose: () => void; onChanged: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedQtiQuestion[]>([]);
  const [skipped, setSkipped] = useState<{ source: string; reason: string }[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [scope, setScope] = useState<BankScope>(role === 'supervisor' ? 'central' : 'private');
  const [unit, setUnit] = useState('');
  const [difficulty, setDifficulty] = useState('متوسط');
  const [bloom, setBloom] = useState('تذكر');
  const [skipDup, setSkipDup] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AddBatchResult | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(''); setResult(null);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const res = parseQtiFile(file.name, bytes);
      setFileName(file.name);
      setParsed(res.questions);
      setSkipped(res.skipped);
      setPicked(new Set(res.questions.map((_, i) => i)));
    } catch {
      setError(t('مقدرتش أقرا الملف', 'Could not read the file'));
    }
  };

  const doImport = async () => {
    setBusy(true); setError('');
    const items: NewBankQuestion[] = parsed
      .filter((_, i) => picked.has(i))
      .map((p) => ({
        type: p.type,
        difficulty: DIFFICULTIES.includes(p.difficulty || '') ? (p.difficulty as string) : difficulty,
        bloomLevel: BLOOMS.includes(p.bloomLevel || '') ? (p.bloomLevel as string) : bloom,
        unit: p.unit || unit.trim() || t('بدون وحدة', 'No unit'),
        lesson: p.lesson,
        question: p.question as BankQuestionContent,
      }));
    const res = await addQuestionsToBank(items, { scope, subject, grade, createdBy: teacherId, createdByRole: role, skipDuplicates: skipDup, origin: 'import', originNote: `استيراد QTI من الملف ${fileName || ''}`.trim() });
    setBusy(false);
    setResult(res);
    if (res.created > 0) onChanged();
  };

  return (
    <Modal
      title={t('استيراد أسئلة من ملف QTI', 'Import questions from a QTI file')}
      onClose={onClose}
      footer={result ? (
        <button onClick={onClose} className={primary}>{t('تم', 'Done')}</button>
      ) : (
        <>
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">{t('إلغاء', 'Cancel')}</button>
          <button onClick={doImport} disabled={busy || picked.size === 0} className={primary}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            {t(`استيراد ${picked.size} سؤال`, `Import ${picked.size} question(s)`)}
          </button>
        </>
      )}
    >
      <p className="text-sm text-slate-500">
        {t(`الأسئلة هتتضاف لـ ${subject} • ${grade}. الملف ZIP (حزمة QTI) أو XML لسؤال واحد.`, `Questions will be added to ${subject} • ${grade}. Upload a QTI ZIP package or a single XML item.`)}
      </p>

      <div>
        <input ref={fileRef} type="file" accept=".zip,.xml,application/zip,text/xml,application/xml" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <button onClick={() => fileRef.current?.click()} className={btn}><UploadCloud size={18} /> {fileName || t('اختر ملف QTI', 'Choose QTI file')}</button>
      </div>

      {error && <p className="text-sm font-bold text-rose-600">{error}</p>}

      {fileName && !result && (
        <>
          <p className="text-sm font-bold text-slate-700">
            {t(`${parsed.length} سؤال جاهز للاستيراد`, `${parsed.length} question(s) ready to import`)}
            {skipped.length > 0 && <span className="text-amber-600"> • {t(`${skipped.length} ملف اتخطّى`, `${skipped.length} skipped`)}</span>}
          </p>

          {parsed.length > 0 && (
            <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 max-h-60 overflow-y-auto">
              {parsed.map((p, i) => (
                <label key={i} className="flex items-start gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-slate-50">
                  <input type="checkbox" className="mt-1" checked={picked.has(i)} onChange={() => setPicked((prev) => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; })} />
                  <span className="flex-1 min-w-0">
                    <span className="block font-bold text-slate-800 truncate">{p.question.title}</span>
                    <span className="block text-xs text-slate-500">{p.type}{p.warnings.length > 0 && <span className="text-amber-600 inline-flex items-center gap-1 mx-2"><AlertTriangle size={12} />{p.warnings[0]}</span>}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {skipped.length > 0 && (
            <details className="text-xs text-slate-500">
              <summary className="cursor-pointer font-bold">{t('الملفات اللي اتخطّت', 'Skipped files')}</summary>
              <ul className="mt-2 space-y-1">{skipped.map((s, i) => <li key={i}>{s.source} — {s.reason}</li>)}</ul>
            </details>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ScopeSelect t={t} value={scope} onChange={setScope} scopeLabel={scopeLabel} />
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
              {t('الوحدة (لو الملف مفيهوش وحدة)', 'Unit (when the file has none)')}
              <input className={field} value={unit} onChange={(e) => setUnit(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
              {t('الصعوبة الافتراضية', 'Default difficulty')}
              <select className={field} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>{DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}</select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-bold text-slate-500">
              {t('مستوى بلوم الافتراضي', 'Default Bloom level')}
              <select className={field} value={bloom} onChange={(e) => setBloom(e.target.value)}>{BLOOMS.map((b) => <option key={b}>{b}</option>)}</select>
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={skipDup} onChange={(e) => setSkipDup(e.target.checked)} /> {t('تخطّي الأسئلة المكررة في البنك المستهدف', 'Skip questions already in the target bank')}</label>
          {needsApproval(scope, role) && <p className="text-xs text-amber-600">{t('الأسئلة هتدخل "معلّقة" لحد ما مشرف البنك يعتمدها.', 'Questions will be added as "pending" until the bank supervisor approves them.')}</p>}
        </>
      )}

      {result && <ResultBox t={t} result={result} pendingNote={needsApproval(scope, role)} />}
    </Modal>
  );
}

// ---------------------------------------------------------------- تصدير

function toExportItem(q: BankQuestion): QtiExportItem {
  return { type: q.type, difficulty: q.difficulty, bloomLevel: q.bloomLevel, unit: q.unit, lesson: q.lesson, question: { ...(q.question as unknown as QtiQuestionContent), title: q.title } };
}

function ExportDialog({ t, subject, grade, questions, onClose }: { t: T; subject: string; grade: string; questions: BankQuestion[]; onClose: () => void }) {
  const exportable = useMemo(() => questions.filter((q) => q.status === 'approved'), [questions]);
  const [picked, setPicked] = useState<Set<string>>(new Set(exportable.map((q) => q.id)));
  const [search, setSearch] = useState('');
  const shown = exportable.filter((q) => !search.trim() || q.title.toLowerCase().includes(search.trim().toLowerCase()));
  const chosen = exportable.filter((q) => picked.has(q.id));
  const summary = exportSummary(chosen.map(toExportItem));

  const download = () => {
    const bytes = buildQtiPackage(chosen.map(toExportItem), `${subject}-${grade}`);
    const blob = new Blob([bytes as BlobPart], { type: 'application/zip' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qti-${subject}-${grade}.zip`.replace(/\s+/g, '_');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    void logBankEvent({ action: 'export', subject, grade, title: `تصدير QTI (${chosen.length} سؤال)`, note: `ملف qti-${subject}-${grade}.zip` });
  };

  return (
    <Modal
      title={t('تصدير أسئلة بصيغة QTI', 'Export questions as QTI')}
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">{t('إغلاق', 'Close')}</button>
          <button onClick={download} disabled={chosen.length === 0} className={primary}><DownloadCloud size={16} /> {t(`تنزيل ${chosen.length} سؤال (ZIP)`, `Download ${chosen.length} question(s) (ZIP)`)}</button>
        </>
      }
    >
      <p className="text-sm text-slate-500">{t(`${subject} • ${grade}. بيتصدّر المعتمد بس.`, `${subject} • ${grade}. Only approved questions are exported.`)}</p>
      <div className="flex items-center gap-3">
        <input className={`${field} flex-1`} placeholder={t('بحث...', 'Search...')} value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="text-xs font-bold text-purple-700" onClick={() => setPicked(new Set(exportable.map((q) => q.id)))}>{t('تحديد الكل', 'Select all')}</button>
        <button className="text-xs font-bold text-slate-500" onClick={() => setPicked(new Set())}>{t('إلغاء التحديد', 'Clear')}</button>
      </div>
      <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 max-h-64 overflow-y-auto">
        {shown.length === 0 && <p className="p-6 text-center text-sm text-slate-400">{t('مفيش أسئلة معتمدة', 'No approved questions')}</p>}
        {shown.map((q) => (
          <label key={q.id} className="flex items-start gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-slate-50">
            <input type="checkbox" className="mt-1" checked={picked.has(q.id)} onChange={() => setPicked((prev) => { const n = new Set(prev); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })} />
            <span className="flex-1 min-w-0"><span className="block font-bold text-slate-800 truncate">{q.title}</span><span className="block text-xs text-slate-500">{q.type}</span></span>
          </label>
        ))}
      </div>
      {summary.talia > 0 && (
        <p className="text-xs text-amber-600 flex items-start gap-1"><AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {t(`${summary.talia} سؤال من أنواع تاليا الخاصة (تصنيف، سحب وإفلات، منطقة تفاعلية، مقطع صوتي، قطعة). هيرجعوا كاملين لو اتستوردوا في تاليا، لكن الأنظمة التانية هتعرض نص السؤال بس.`,
            `${summary.talia} question(s) use Talia-only types. They re-import fully into Talia; other systems will show the question text only.`)}
        </p>
      )}
      <p className="text-xs text-slate-400">{t('ملفات الصوت والصور المرفوعة بتتصدّر كروابط مش كملفات جوه الحزمة.', 'Uploaded audio/images are exported as links, not embedded files.')}</p>
    </Modal>
  );
}

// ---------------------------------------------------------------- نسخ بين البنوك

function CopyDialog({ t, subject, grade, questions, teacherId, role, scopeLabel, onClose, onChanged }: {
  t: T; subject: string; grade: string; questions: BankQuestion[]; teacherId: string | null; role: 'teacher' | 'supervisor';
  scopeLabel: (s: BankScope) => string; onClose: () => void; onChanged: () => void;
}) {
  const [target, setTarget] = useState<BankScope>(role === 'supervisor' ? 'central' : 'private');
  const [skipDup, setSkipDup] = useState(true);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AddBatchResult | null>(null);

  const copyable = (q: BankQuestion) => q.status === 'approved' && q.scope !== target;
  const list = questions.filter((q) => q.status === 'approved');
  const chosen = list.filter((q) => picked.has(q.id) && copyable(q));

  const doCopy = async () => {
    setBusy(true);
    const items: NewBankQuestion[] = chosen.map((q) => ({
      type: q.type, difficulty: q.difficulty, bloomLevel: q.bloomLevel, unit: q.unit, lesson: q.lesson,
      question: { ...q.question, reviewLog: undefined }, // سجل المراجعة بتاع السؤال الأصلي مايتنسخش
    }));
    const res = await addQuestionsToBank(items, { scope: target, subject, grade, createdBy: teacherId, createdByRole: role, skipDuplicates: skipDup, origin: 'copy', originNote: `نسخ ${chosen.length} سؤال إلى البنك ${target === 'central' ? 'المركزي' : target === 'shared' ? 'المشترك' : 'الخاص'}` });
    setBusy(false);
    setResult(res);
    if (res.created > 0) onChanged();
  };

  return (
    <Modal
      title={t('نسخ أسئلة بين البنوك', 'Copy questions between banks')}
      onClose={onClose}
      footer={result ? (
        <button onClick={onClose} className={primary}>{t('تم', 'Done')}</button>
      ) : (
        <>
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">{t('إلغاء', 'Cancel')}</button>
          <button onClick={doCopy} disabled={busy || chosen.length === 0} className={primary}>
            {busy && <Loader2 size={16} className="animate-spin" />}
            {t(`نسخ ${chosen.length} سؤال`, `Copy ${chosen.length} question(s)`)}
          </button>
        </>
      )}
    >
      <p className="text-sm text-slate-500">{t(`${subject} • ${grade}. النسخ بيسيب السؤال الأصلي زي ما هو.`, `${subject} • ${grade}. The original question stays untouched.`)}</p>
      <ScopeSelect t={t} value={target} onChange={(s) => { setTarget(s); setPicked(new Set()); }} scopeLabel={scopeLabel} />
      <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 max-h-64 overflow-y-auto">
        {list.length === 0 && <p className="p-6 text-center text-sm text-slate-400">{t('مفيش أسئلة معتمدة', 'No approved questions')}</p>}
        {list.map((q) => {
          const ok = copyable(q);
          return (
            <label key={q.id} className={`flex items-start gap-3 px-4 py-3 text-sm ${ok ? 'cursor-pointer hover:bg-slate-50' : 'opacity-50'}`}>
              <input type="checkbox" className="mt-1" disabled={!ok} checked={picked.has(q.id) && ok} onChange={() => setPicked((prev) => { const n = new Set(prev); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); return n; })} />
              <span className="flex-1 min-w-0"><span className="block font-bold text-slate-800 truncate">{q.title}</span><span className="block text-xs text-slate-500">{q.type} • {scopeLabel(q.scope)}{!ok && ` • ${t('موجود في البنك ده', 'already in this bank')}`}</span></span>
            </label>
          );
        })}
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={skipDup} onChange={(e) => setSkipDup(e.target.checked)} /> {t('تخطّي الأسئلة المكررة في البنك المستهدف', 'Skip questions already in the target bank')}</label>
      {needsApproval(target, role) && <p className="text-xs text-amber-600">{t('الأسئلة هتدخل "معلّقة" لحد ما مشرف البنك يعتمدها.', 'Questions will be added as "pending" until the bank supervisor approves them.')}</p>}
      {result && <ResultBox t={t} result={result} pendingNote={needsApproval(target, role)} />}
    </Modal>
  );
}

// ---------------------------------------------------------------- تنقيح البنك (فحص آلي)

const SEV_STYLE: Record<IssueSeverity, string> = {
  error: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
};

function AuditDialog({ t, language, subject, grade, questions, onClose, onEdit }: {
  t: T; language: Lang; subject: string; grade: string; questions: BankQuestion[]; onClose: () => void; onEdit?: (q: BankQuestion) => void;
}) {
  const [level, setLevel] = useState<'serious' | 'all'>('serious');
  const results = useMemo(() => {
    const pool = questions.map((q) => ({ id: q.id, title: q.title, subject: q.subject, grade: q.grade, status: q.status }));
    return questions
      .map((q) => ({ q, issues: auditQuestion({ id: q.id, type: q.type, title: q.title, subject: q.subject, grade: q.grade, question: q.question as unknown as AuditContent }, pool) }))
      .filter((r) => r.issues.length > 0);
  }, [questions]);
  const shown = results.filter((r) => level === 'all' || r.issues.some((i) => i.severity !== 'info'));
  const errors = results.filter((r) => worstSeverity(r.issues) === 'error').length;
  const dups = results.filter((r) => r.issues.some((i) => i.code === 'DUPLICATE' || i.code === 'NEAR_DUPLICATE')).length;

  return (
    <Modal
      title={t('تنقيح البنك (فحص آلي)', 'Bank audit (automatic check)')}
      onClose={onClose}
      footer={<button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">{t('إغلاق', 'Close')}</button>}
    >
      <p className="text-sm text-slate-500">{t(`${subject} • ${grade}. الفحص بيكشف الأسئلة اللي فيها أخطاء بناء (بدون إجابة صحيحة مثلاً)، والمكرر، وهفوات الصياغة.`, `${subject} • ${grade}. The check finds build errors (e.g. no correct answer), duplicates and wording slips.`)}</p>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-slate-100 p-3"><p className="text-2xl font-black text-slate-800">{questions.length}</p><p className="text-xs text-slate-500">{t('سؤال اتفحص', 'checked')}</p></div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-3"><p className="text-2xl font-black text-red-700">{errors}</p><p className="text-xs text-red-600">{t('فيها أخطاء بناء', 'with build errors')}</p></div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-3"><p className="text-2xl font-black text-amber-700">{dups}</p><p className="text-xs text-amber-600">{t('مكرر أو مشابه', 'duplicates')}</p></div>
      </div>
      <div className="flex gap-2 text-xs font-bold">
        <button onClick={() => setLevel('serious')} className={`px-3 py-1.5 rounded-lg border ${level === 'serious' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-slate-200 text-slate-500'}`}>{t('أخطاء وتحذيرات', 'Errors & warnings')}</button>
        <button onClick={() => setLevel('all')} className={`px-3 py-1.5 rounded-lg border ${level === 'all' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'border-slate-200 text-slate-500'}`}>{t('كل الملاحظات', 'All notes')}</button>
      </div>
      <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 max-h-80 overflow-y-auto">
        {shown.length === 0 && <p className="p-8 text-center text-sm text-emerald-600 font-bold flex items-center justify-center gap-2"><Check size={16} />{t('مفيش ملاحظات', 'No issues found')}</p>}
        {shown.map(({ q, issues }) => (
          <div key={q.id} className="px-4 py-3 text-sm space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="font-bold text-slate-800 min-w-0 truncate">{q.title || t('(بدون نص)', '(no text)')}</span>
              {onEdit && <button onClick={() => onEdit(q)} className="shrink-0 text-xs font-bold text-purple-700 flex items-center gap-1 hover:underline"><Pencil size={12} />{t('تعديل', 'Edit')}</button>}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {issues.filter((i) => level === 'all' || i.severity !== 'info').map((i, k) => (
                <span key={k} className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${SEV_STYLE[i.severity]}`}>{language === 'ar' ? i.ar : i.en}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
