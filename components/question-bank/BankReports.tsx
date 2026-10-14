'use client';

import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, Loader2, Printer, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getAllQuestionsWithAuthors } from '@/services/questionBankData';
import {
  applyCountFilter, buildReport, COUNT_OP_LABEL, filterRows, filtersText, reportToPrintHtml, reportToSheets, SCOPE_AR, STATUS_AR, toReportRow,
  type Bucket, type CountOp, type ReportFilters, type ReportRow,
} from '@/lib/bankReports';
import { buildXlsx, downloadBytes, XLSX_MIME } from '@/lib/xlsxLite';

const field = 'h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-violet-400';
const lab = 'flex flex-col gap-1 text-xs font-bold text-slate-500';
const COLORS: Record<string, string[]> = {
  difficulty: ['#10b981', '#f59e0b', '#f43f5e'],
  default: ['#7c3aed'],
};

function Kpi({ label, value, tone = 'text-slate-800' }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <p className={`text-2xl font-extrabold ${tone}`}>{value}</p>
      <p className="text-xs font-bold text-slate-500 mt-1">{label}</p>
    </div>
  );
}

function BarCard({ title, data, colors = COLORS.default, horizontal = false, testId }: { title: string; data: Bucket[]; colors?: string[]; horizontal?: boolean; testId?: string }) {
  const height = horizontal ? Math.max(160, data.length * 34) : 220;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5" data-testid={testId}>
      <h4 className="text-sm font-extrabold text-slate-700 mb-3">{title}</h4>
      {data.every((d) => d.value === 0) ? <p className="text-xs text-slate-400 py-8 text-center">—</p> : (
        <div style={{ width: '100%', height }} dir="ltr">
          <ResponsiveContainer>
            <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ left: horizontal ? 24 : 0, right: 12, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={!horizontal} vertical={horizontal} />
              {horizontal ? <><XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} /></>
                : <><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /></>}
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="value" radius={4} isAnimationActive={false}>
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function BankReports({ language }: { language: 'ar' | 'en' }) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const [all, setAll] = useState<ReportRow[] | null>(null);
  const [f, setF] = useState<ReportFilters>({});
  const [op, setOp] = useState<CountOp>('lt');
  const [num, setNum] = useState('');

  useEffect(() => {
    let alive = true;
    getAllQuestionsWithAuthors().then((qs) => { if (alive) setAll(qs.map(toReportRow)); });
    return () => { alive = false; };
  }, []);

  const rows = useMemo(() => all || [], [all]);
  const filtered = useMemo(() => filterRows(rows, f), [rows, f]);
  const report = useMemo(() => buildReport(filtered), [filtered]);
  const countFilter = useMemo(() => (num.trim() === '' || Number.isNaN(Number(num)) ? null : { op, value: Number(num) }), [op, num]);
  const coverage = useMemo(() => applyCountFilter(report.coverage, countFilter), [report.coverage, countFilter]);

  const opts = useMemo(() => ({
    subjects: [...new Set(rows.map((r) => r.subject))].sort((a, b) => a.localeCompare(b, 'ar')),
    grades: [...new Set(rows.map((r) => r.grade))].sort((a, b) => a.localeCompare(b, 'ar', { numeric: true })),
    authors: [...new Map(rows.map((r) => [r.authorId || r.authorName, r.authorName])).entries()].sort((a, b) => a[1].localeCompare(b[1], 'ar')),
  }), [rows]);

  const set = (p: Partial<ReportFilters>) => setF((s) => ({ ...s, ...p }));
  const meta = () => ({ title: t('تقرير محتوى بنوك الأسئلة', 'Question banks content report'), filters: filtersText(f, countFilter), generatedAt: new Date().toLocaleString('ar-EG') });

  const exportXlsx = () => {
    const m = meta();
    const sheets = reportToSheets({ ...report, coverage }, { filters: m.filters, generatedAt: m.generatedAt });
    downloadBytes(buildXlsx(sheets), `bank-report-${new Date().toISOString().slice(0, 10)}.xlsx`, XLSX_MIME);
  };
  const print = () => {
    const m = meta();
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(reportToPrintHtml({ ...report, coverage }, m));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

  if (!all) return <div className="p-16 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6" data-testid="bank-reports">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 items-end">
          <label className={lab}>{t('المادة', 'Subject')}
            <select className={field} value={f.subject || ''} onChange={(e) => set({ subject: e.target.value })}><option value="">{t('الكل', 'All')}</option>{opts.subjects.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className={lab}>{t('الصف', 'Grade')}
            <select className={field} value={f.grade || ''} onChange={(e) => set({ grade: e.target.value })}><option value="">{t('الكل', 'All')}</option>{opts.grades.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className={lab}>{t('نوع البنك', 'Bank')}
            <select className={field} value={f.scope || ''} onChange={(e) => set({ scope: e.target.value })}><option value="">{t('الكل', 'All')}</option>{Object.entries(SCOPE_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className={lab}>{t('الحالة', 'Status')}
            <select className={field} value={f.status || ''} onChange={(e) => set({ status: e.target.value })}><option value="">{t('الكل', 'All')}</option>{Object.entries(STATUS_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className={lab}>{t('المؤلف', 'Author')}
            <select className={field} value={f.author || ''} onChange={(e) => set({ author: e.target.value })}><option value="">{t('الكل', 'All')}</option>{opts.authors.map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></label>
          <label className={lab}>{t('من تاريخ', 'From')}<input type="date" className={field} value={f.from || ''} onChange={(e) => set({ from: e.target.value })} /></label>
          <label className={lab}>{t('إلى تاريخ', 'To')}<input type="date" className={field} value={f.to || ''} onChange={(e) => set({ to: e.target.value })} /></label>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-2">
            <label className={lab}>{t('عدد الأسئلة في الوحدة', 'Questions per unit')}
              <select className={field} value={op} onChange={(e) => setOp(e.target.value as CountOp)} aria-label="operator">{(Object.keys(COUNT_OP_LABEL) as CountOp[]).map((k) => <option key={k} value={k}>{COUNT_OP_LABEL[k]}</option>)}</select></label>
            <input type="number" min={0} className={`${field} w-24`} value={num} onChange={(e) => setNum(e.target.value)} placeholder="—" aria-label="count" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setF({}); setNum(''); }} className="px-4 h-10 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"><RotateCcw size={14} />{t('مسح', 'Reset')}</button>
            <button onClick={print} className="px-4 h-10 rounded-lg border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"><Printer size={14} />{t('طباعة / PDF', 'Print / PDF')}</button>
            <button onClick={exportXlsx} className="px-4 h-10 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 flex items-center gap-2"><Download size={14} />{t('تصدير Excel', 'Export Excel')}</button>
          </div>
        </div>
        <p className="text-xs text-slate-400">{t('فلتر المدرسة غير متاح حاليًا (البنك لا يسجّل المدرسة)؛ استخدم فلتر المؤلف.', 'School filter is not available yet (the bank does not record the school); use the author filter.')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3" data-testid="kpis">
        <Kpi label={t('إجمالي الأسئلة', 'Total')} value={report.total} />
        <Kpi label={t('معتمدة', 'Approved')} value={report.approved} tone="text-emerald-600" />
        <Kpi label={t('معلّقة', 'Pending')} value={report.pending} tone="text-amber-600" />
        <Kpi label={t('مرفوضة', 'Rejected')} value={report.rejected} tone="text-rose-600" />
        <Kpi label={t('المواد', 'Subjects')} value={report.subjects} />
        <Kpi label={t('الوحدات', 'Units')} value={report.units} />
        <Kpi label={t('وحدات بها فجوات', 'Units with gaps')} value={report.gapUnits} tone={report.gapUnits ? 'text-amber-600' : 'text-emerald-600'} />
        <Kpi label={t('DOK 3 و4', 'DOK 3–4')} value={report.higherOrderPct === null ? '—' : `${report.higherOrderPct}%`} tone="text-violet-700" />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <BarCard testId="chart-difficulty" title={t('مستوى الصعوبة', 'Difficulty')} data={report.byDifficulty} colors={COLORS.difficulty} />
        <BarCard title={t('مستوى بلوم', 'Bloom level')} data={report.byBloom} />
        <BarCard title={t('العمق المعرفي (DOK)', 'Depth of Knowledge')} data={report.byDok} />
        <BarCard title={t('أنواع الأسئلة', 'Question types')} data={report.byType} horizontal />
        <BarCard title={t('المواد', 'Subjects')} data={report.bySubject} horizontal />
        <BarCard title={t('الإضافات حسب الشهر', 'Added per month')} data={report.byMonth} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-slate-700">{t('تغطية المنهج (المعتمد فقط)', 'Curriculum coverage (approved only)')}</h4>
          <span className="text-xs text-slate-400">{coverage.length} {t('وحدة', 'units')}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="coverage-table">
            <thead><tr className="bg-slate-50 text-xs text-slate-500">{[t('المادة', 'Subject'), t('الصف', 'Grade'), t('الوحدة', 'Unit'), t('الإجمالي', 'Total'), t('معتمد', 'Approved'), t('سهل', 'Easy'), t('متوسط', 'Medium'), t('صعب', 'Hard'), t('الدروس', 'Lessons'), t('الحالة', 'Status')].map((h) => <th key={h} className="px-4 py-2.5 text-start font-bold">{h}</th>)}</tr></thead>
            <tbody>
              {coverage.map((c) => (
                <tr key={`${c.subject}|${c.grade}|${c.unit}`} className="border-t border-slate-100">
                  <td className="px-4 py-2.5 font-bold text-slate-700">{c.subject}</td><td className="px-4 py-2.5">{c.grade}</td><td className="px-4 py-2.5">{c.unit}</td>
                  <td className="px-4 py-2.5 font-bold">{c.total}</td><td className="px-4 py-2.5">{c.approved}</td>
                  <td className="px-4 py-2.5">{c.easy}</td><td className="px-4 py-2.5">{c.medium}</td><td className="px-4 py-2.5">{c.hard}</td><td className="px-4 py-2.5">{c.lessons}</td>
                  <td className="px-4 py-2.5">{c.gaps.length
                    ? <span className="inline-flex items-start gap-1.5 text-xs font-bold text-amber-700"><AlertTriangle size={13} className="mt-0.5 shrink-0" />{c.gaps.join('، ')}</span>
                    : <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600"><CheckCircle2 size={13} />{t('مكتملة', 'Complete')}</span>}</td>
                </tr>
              ))}
              {coverage.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400">{t('مفيش وحدات مطابقة.', 'No matching units.')}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100"><h4 className="text-sm font-extrabold text-slate-700">{t('مساهمات المؤلفين', 'Author contributions')}</h4></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="authors-table">
            <thead><tr className="bg-slate-50 text-xs text-slate-500">{[t('المؤلف', 'Author'), t('الإجمالي', 'Total'), t('معتمد', 'Approved'), t('معلّق', 'Pending'), t('مرفوض', 'Rejected'), t('نسبة الاعتماد', 'Approval rate'), t('آخر إضافة', 'Last added')].map((h) => <th key={h} className="px-4 py-2.5 text-start font-bold">{h}</th>)}</tr></thead>
            <tbody>
              {report.authors.map((a) => (
                <tr key={a.key} className="border-t border-slate-100"><td className="px-4 py-2.5 font-bold text-slate-700">{a.name}</td><td className="px-4 py-2.5 font-bold">{a.total}</td><td className="px-4 py-2.5">{a.approved}</td><td className="px-4 py-2.5">{a.pending}</td><td className="px-4 py-2.5">{a.rejected}</td><td className="px-4 py-2.5">{a.approvalRate === null ? '—' : `${a.approvalRate}%`}</td><td className="px-4 py-2.5 text-slate-500">{a.lastAt.slice(0, 10)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
