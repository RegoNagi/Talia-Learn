'use client';

import { useState, useRef, useEffect, useMemo, startTransition } from 'react';
import { CheckCircle2, XCircle, Clock, Search, ShieldCheck, HelpCircle, FileText, Flag, ChevronDown, Calendar, PieChart, AlertCircle, ArrowLeftRight, AlertTriangle, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPendingQuestions, reviewQuestions, updateReviewedQuestion, getAuditPool, getPendingAssessments, getPendingAssessmentDetail, approveAssessment, rejectAssessment, BankQuestion, type Reviewer } from '@/services/questionBankData';
import { getQuizById } from '@/services/assignmentData';
import { useAuth } from '@/contexts/AuthContext';
import { auditQuestion, worstSeverity, type AuditContent, type AuditIssue, type AuditPoolItem } from '@/lib/questionAudit';
import { ReviewEditor, type ReviewPatch } from '@/components/question-bank/ReviewEditor';

// القيمة الفاضية '' = "الكل"
function SmartDropdown({ label, allLabel, options, value, onChange }: { label: string, allLabel: string, options: string[], value: string, onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isActive = value !== '';

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors shadow-none ${
          isActive 
            ? 'bg-violet-50 border-violet-200 text-violet-900' 
            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
        }`}
      >
        <span>{isActive ? value : label}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${isActive ? 'text-violet-700' : 'text-slate-400'}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 4 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-1 w-48 max-h-72 overflow-y-auto bg-white rounded-lg border border-slate-200 shadow-none py-1 z-50"
          >
            {[allLabel, ...options].map((opt, idx) => {
              const optValue = idx === 0 ? '' : opt;
              return (
                <button
                  key={opt + idx}
                  onClick={() => { onChange(optValue); setIsOpen(false); }}
                  className={`w-full text-right px-4 py-2 text-sm transition-colors ${
                    value === optValue ? 'bg-slate-50 text-violet-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SEVERITY_STYLE: Record<'error' | 'warning' | 'info', string> = {
  error: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
};

export function ApprovalHub({ language = 'ar' }: { language?: 'ar' | 'en' }) {
  const t = (ar: string, en: string) => (language === 'ar' ? ar : en);
  const { authUser } = useAuth();
  const reviewer: Reviewer = { id: authUser?.teacherId || authUser?.userId || null, name: authUser?.name || '—' };
  const [subTab, setSubTab] = useState<'QUESTIONS' | 'ASSESSMENTS'>('QUESTIONS');

  // الفلاتر الفعلية ('' = الكل)
  const [gradeFilter, setGradeFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Assessment Detail State
  const [assessmentView, setAssessmentView] = useState<'overview' | 'preview'>('overview');

  // Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectTarget, setRejectTarget] = useState<'single' | 'bulk'>('single');

  // التحديد المتعدد + رسائل النتيجة + التعديل قبل الاعتماد
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // الأسئلة المعلّقة الحقيقية (بانتظار اعتماد المشرف) — بالبيانات الكاملة عشان نعرض الخيارات الحقيقية في شاشة المراجعة
  const [questions, setQuestions] = useState<(BankQuestion & { creatorName: string; author: string; date: string })[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [auditPool, setAuditPool] = useState<AuditPoolItem[]>([]);

  const fetchPending = () => {
    getPendingQuestions().then((qs) => {
      setQuestions(qs.map((q) => ({ ...q, author: q.creatorName, date: new Date(q.createdAt).toLocaleDateString() })));
      setIsLoadingQuestions(false);
    });
    getAuditPool().then(setAuditPool);
  };

  const refreshPending = () => {
    setIsLoadingQuestions(true);
    fetchPending();
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // التقييمات الحقيقية المولّدة من مخطط بنك الأسئلة واللي بانتظار اعتماد المشرف
  const [assessments, setAssessments] = useState<{ id: string; subject: string; title: string; author: string; date: string; questionCount: number }[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);

  const fetchPendingAssessments = () => {
    getPendingAssessments().then((list) => {
      setAssessments(list.map((a) => ({
        id: a.id,
        subject: a.subject,
        title: a.title,
        author: a.teacherName,
        date: new Date(a.createdAt).toLocaleDateString(),
        questionCount: a.questionCount,
      })));
      setIsLoadingAssessments(false);
    });
  };

  const refreshPendingAssessments = () => {
    setIsLoadingAssessments(true);
    fetchPendingAssessments();
  };

  useEffect(() => {
    fetchPendingAssessments();
  }, []);

  // تفاصيل التقييم المحدد حاليًا (الأسئلة الحقيقية المرتبطة + توزيع بلوم/الصعوبة + التواريخ)
  const [assessmentDetail, setAssessmentDetail] = useState<{
    bloomData: { name: string; value: number }[];
    difficultyData: { name: string; value: number; color: string }[];
    questions: BankQuestion[];
    dueDate: string | null;
    releaseAt: string | null;
  } | null>(null);
  const [isLoadingAssessmentDetail, setIsLoadingAssessmentDetail] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, 'APPROVED' | 'REJECTED'>>({});


  // الفحص الآلي لكل سؤال معلّق (أخطاء بناء، صياغة، تكرار مع البنك)
  const issuesById = useMemo(() => {
    const map: Record<string, AuditIssue[]> = {};
    for (const q of questions) {
      map[q.id] = auditQuestion({ id: q.id, type: q.type, title: q.title, subject: q.subject, grade: q.grade, question: q.question as unknown as AuditContent }, auditPool);
    }
    return map;
  }, [questions, auditPool]);

  const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ar'));
  const gradeOptions = uniq(questions.map((q) => q.grade));
  const subjectOptions = uniq(subTab === 'QUESTIONS' ? questions.map((q) => q.subject) : assessments.map((a) => a.subject));
  const typeOptions = uniq(questions.map((q) => q.type));
  const authorOptions = uniq(questions.map((q) => q.author));

  const needle = searchQuery.trim().toLowerCase();
  const filteredQuestions = questions.filter((q) =>
    (!gradeFilter || q.grade === gradeFilter) &&
    (!subjectFilter || q.subject === subjectFilter) &&
    (!typeFilter || q.type === typeFilter) &&
    (!difficultyFilter || q.difficulty === difficultyFilter) &&
    (!authorFilter || q.author === authorFilter) &&
    (!onlyIssues || (issuesById[q.id] || []).some((i) => i.severity !== 'info')) &&
    (!needle || q.title.toLowerCase().includes(needle) || q.author.toLowerCase().includes(needle))
  );
  const filteredAssessments = assessments.filter((a) =>
    (!subjectFilter || a.subject === subjectFilter) &&
    (!needle || a.title.toLowerCase().includes(needle) || a.author.toLowerCase().includes(needle))
  );

  const activeList = subTab === 'QUESTIONS' ? filteredQuestions : filteredAssessments;
  const activeItem = activeList.find(i => i.id === selectedItemId) || activeList[0];
  const activeIssues = subTab === 'QUESTIONS' && activeItem ? (issuesById[activeItem.id] || []) : [];
  const isEditingActive = subTab === 'QUESTIONS' && !!activeItem && editingId === activeItem.id;
  const checkedVisible = filteredQuestions.filter((q) => checked.has(q.id));

  useEffect(() => {
    if (subTab !== 'ASSESSMENTS' || !activeItem) { startTransition(() => setAssessmentDetail(null)); return; }
    let cancelled = false;
    startTransition(() => setIsLoadingAssessmentDetail(true));
    Promise.all([getPendingAssessmentDetail(activeItem.id), getQuizById(activeItem.id)]).then(([detail, quiz]) => {
      if (cancelled) return;
      if (detail) {
        setAssessmentDetail({
          bloomData: detail.bloomData,
          difficultyData: detail.difficultyData,
          questions: detail.questions,
          dueDate: quiz?.dueDate || null,
          releaseAt: quiz?.releaseAt || null,
        });
      } else {
        setAssessmentDetail(null);
      }
      setIsLoadingAssessmentDetail(false);
    });
    return () => { cancelled = true; };
  }, [subTab, activeItem?.id]);

  const toggleChecked = (id: string) => setChecked((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allVisibleChecked = filteredQuestions.length > 0 && checkedVisible.length === filteredQuestions.length;

  const runBulk = async (action: 'approved' | 'rejected', note?: string) => {
    const ids = checkedVisible.map((q) => q.id);
    if (ids.length === 0) return;
    if (action === 'approved') {
      const withErrors = ids.filter((id) => (issuesById[id] || []).some((i) => i.severity === 'error')).length;
      if (withErrors > 0 && !window.confirm(t(`${withErrors} سؤال من المحدد فيهم أخطاء بناء (مثلاً بدون إجابة صحيحة). تعتمدهم برضه؟`, `${withErrors} selected question(s) have build errors (e.g. no correct answer). Approve anyway?`))) return;
    }
    setBusy(true);
    const r = await reviewQuestions(ids, action, reviewer, note);
    setBusy(false);
    setChecked(new Set());
    const verb = action === 'approved' ? t('اتعتمد', 'approved') : t('اتبعت للتعديل', 'sent back');
    setFlash(t(`${r.done} سؤال ${verb}`, `${r.done} question(s) ${verb}`) + (r.skipped ? t(` • ${r.skipped} اتراجع قبل كده`, ` • ${r.skipped} already reviewed`) : '') + (r.failed ? t(` • ${r.failed} فشل`, ` • ${r.failed} failed`) : ''));
    refreshPending();
  };

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED', note?: string) => {
    if (subTab === 'QUESTIONS') {
      setBusy(true);
      await reviewQuestions([id], action === 'APPROVED' ? 'approved' : 'rejected', reviewer, note);
      setBusy(false);
      refreshPending();
      return;
    }
    if (action === 'APPROVED') {
      await approveAssessment(id);
    } else {
      await rejectAssessment(id, note || '');
    }
    refreshPendingAssessments();
    setStatusMap(prev => ({ ...prev, [id]: action }));
  };

  const saveEdit = async (id: string, patch: ReviewPatch, approveAfter: boolean) => {
    setBusy(true);
    const res = await updateReviewedQuestion(id, patch, reviewer);
    if (!res.ok) {
      setBusy(false);
      setFlash(t('فشل حفظ التعديل: ', 'Could not save the edit: ') + (res.error || ''));
      return;
    }
    if (approveAfter) await reviewQuestions([id], 'approved', reviewer);
    setBusy(false);
    setEditingId(null);
    setFlash(approveAfter ? t('اتحفظ التعديل واتعتمد السؤال', 'Edit saved and question approved') : t('اتحفظ التعديل', 'Edit saved'));
    refreshPending();
  };

  const submitRejection = () => {
    if (rejectTarget === 'bulk') {
      runBulk('rejected', rejectNote);
    } else if (activeItem) {
      handleAction(activeItem.id, 'REJECTED', rejectNote);
    }
    setRejectNote('');
    setRejectModalOpen(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-3xl border border-slate-200 overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* Horizontal Top Filter Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0 gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {subTab === 'QUESTIONS' && <SmartDropdown label={t('الصف الدراسي', 'Grade')} allLabel={t('الكل', 'All')} options={gradeOptions} value={gradeFilter} onChange={setGradeFilter} />}
          <SmartDropdown label={t('المادة', 'Subject')} allLabel={t('الكل', 'All')} options={subjectOptions} value={subjectFilter} onChange={setSubjectFilter} />
          {subTab === 'QUESTIONS' && (
            <>
              <SmartDropdown label={t('نوع السؤال', 'Question Type')} allLabel={t('الكل', 'All')} options={typeOptions} value={typeFilter} onChange={setTypeFilter} />
              <SmartDropdown label={t('الصعوبة', 'Difficulty')} allLabel={t('الكل', 'All')} options={['سهل', 'متوسط', 'صعب']} value={difficultyFilter} onChange={setDifficultyFilter} />
              <SmartDropdown label={t('المعلم المدخل', 'Author')} allLabel={t('الكل', 'All')} options={authorOptions} value={authorFilter} onChange={setAuthorFilter} />
              <button
                onClick={() => setOnlyIssues((v) => !v)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${onlyIssues ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                <AlertTriangle size={14} /> {t('بها ملاحظات فقط', 'With issues only')}
              </button>
            </>
          )}
        </div>
        
        <div className="relative w-72 shrink-0">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('البحث في الطلبات...', 'Search requests...')} 
            className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:bg-white focus:border-violet-300 transition-colors shadow-none"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Right Panel (List Pane) */}
        <div className="w-[380px] border-l border-slate-200 flex flex-col bg-slate-50/50 shrink-0">
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => { setSubTab('QUESTIONS'); setSelectedItemId(null); setSubjectFilter(''); setChecked(new Set()); }}
                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors shadow-none ${subTab === 'QUESTIONS' ? 'bg-white text-violet-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {language === 'ar' ? 'اعتماد الأسئلة' : 'Approve Questions'}
              </button>
              <button
                onClick={() => { setSubTab('ASSESSMENTS'); setSelectedItemId(null); setSubjectFilter(''); setAssessmentView('overview'); }}
                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors shadow-none ${subTab === 'ASSESSMENTS' ? 'bg-white text-violet-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {language === 'ar' ? 'اعتماد التقييمات' : 'Approve Assessments'}
              </button>
            </div>
          </div>
          
          {subTab === 'QUESTIONS' && filteredQuestions.length > 0 && (
            <div className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between gap-2 text-xs">
              <label className="flex items-center gap-2 font-bold text-slate-600 cursor-pointer">
                <input type="checkbox" checked={allVisibleChecked} onChange={() => setChecked(allVisibleChecked ? new Set() : new Set(filteredQuestions.map((q) => q.id)))} />
                {checkedVisible.length > 0 ? t(`${checkedVisible.length} محدد`, `${checkedVisible.length} selected`) : t(`تحديد الكل (${filteredQuestions.length})`, `Select all (${filteredQuestions.length})`)}
              </label>
              {checkedVisible.length > 0 && (
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => { setRejectTarget('bulk'); setRejectModalOpen(true); }} className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-700 hover:text-red-600 hover:border-red-200 disabled:opacity-50">{t('إرسال للتعديل', 'Send back')}</button>
                  <button disabled={busy} onClick={() => runBulk('approved')} className="px-3 py-1.5 rounded-lg bg-violet-600 text-white font-bold hover:bg-violet-700 disabled:opacity-50">{t('اعتماد المحدد', 'Approve selected')}</button>
                </div>
              )}
            </div>
          )}
          {flash && (
            <div className="px-4 py-2 text-xs font-bold bg-emerald-50 text-emerald-700 border-b border-emerald-100 flex items-center justify-between">
              <span>{flash}</span>
              <button onClick={() => setFlash('')} aria-label="dismiss"><XCircle size={14} /></button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {(subTab === 'QUESTIONS' && isLoadingQuestions) || (subTab === 'ASSESSMENTS' && isLoadingAssessments) ? (
              <p className="text-center text-sm text-slate-400 py-10">{t('جاري التحميل...', 'Loading...')}</p>
            ) : activeList.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-10">
                {(subTab === 'QUESTIONS' ? questions.length : assessments.length) > 0
                  ? t('لا توجد نتائج تطابق الفلاتر الحالية', 'No results match the current filters')
                  : subTab === 'QUESTIONS' ? t('لا توجد أسئلة بانتظار الاعتماد', 'No questions pending approval') : t('لا توجد تقييمات بانتظار الاعتماد', 'No assessments pending approval')}
              </p>
            ) : activeList.map(item => {
              const isApproved = statusMap[item.id] === 'APPROVED';
              const isRejected = statusMap[item.id] === 'REJECTED';
              const isActive = activeItem?.id === item.id;
              const itemIssues = subTab === 'QUESTIONS' ? (issuesById[item.id] || []) : [];
              const worst = worstSeverity(itemIssues);
              
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${isActive ? 'bg-violet-50 border-violet-200 ring-2 ring-violet-500/10' : 'bg-white border-slate-200 hover:border-slate-300 shadow-none'} relative`}
                >
                  {isApproved && <div className="absolute left-3 top-3 text-emerald-500"><CheckCircle2 size={18} /></div>}
                  {isRejected && <div className="absolute left-3 top-3 text-amber-500"><AlertCircle size={18} /></div>}
                  
                  <div className="flex items-center gap-2 mb-1.5">
                    {subTab === 'QUESTIONS' && (
                      <input type="checkbox" checked={checked.has(item.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleChecked(item.id)} aria-label="select" />
                    )}
                    {subTab === 'QUESTIONS' ? <HelpCircle size={14} className="text-violet-500" /> : <FileText size={14} className="text-violet-500" />}
                    <span className="text-xs font-bold text-slate-500">{item.subject}</span>
                    {worst && (
                      <span className={`mr-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${SEVERITY_STYLE[worst]}`}>
                        <AlertTriangle size={10} /> {itemIssues.length}
                      </span>
                    )}
                  </div>
                  <h4 className={`font-bold text-sm mb-3 ml-6 leading-tight ${isActive ? 'text-violet-900' : 'text-slate-800'}`}>{item.title}</h4>
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 mt-auto pt-2 border-t border-slate-100/50">
                    <span className="text-slate-600">{item.author}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {item.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Left Panel (Detail Pane) */}
        <div className="flex-1 flex flex-col bg-white">
          {activeItem ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={activeItem.id} 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0 }} 
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                <div className="px-8 py-6 border-b border-slate-200 bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <div className="pr-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold text-slate-800">{activeItem.title}</h2>
                        {!statusMap[activeItem.id] && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {language === 'ar' ? 'قيد المراجعة' : 'Pending Review'}
                          </span>
                        )}
                        {statusMap[activeItem.id] === 'APPROVED' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {language === 'ar' ? 'تم الاعتماد' : 'Approved'}
                          </span>
                        )}
                        {statusMap[activeItem.id] === 'REJECTED' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            {language === 'ar' ? 'مرفوض بانتظار التعديل' : 'Rejected, Awaiting Edit'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-violet-600"></div>{language === 'ar' ? 'المادة:' : 'Subject:'} <b className="text-slate-700">{activeItem.subject}</b></span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-none">{activeItem.author.charAt(0)}</div>{language === 'ar' ? 'المرسل:' : 'Submitted by:'} <b className="text-slate-700">{activeItem.author}</b></span>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      {subTab === 'QUESTIONS' && (
                        <button
                          onClick={() => setEditingId(isEditingActive ? null : activeItem.id)}
                          className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Pencil size={14} /> {t('تعديل قبل الاعتماد', 'Edit before approval')}
                        </button>
                      )}
                      <button 
                        onClick={() => { setRejectTarget('single'); setRejectModalOpen(true); }}
                        disabled={busy || isEditingActive || statusMap[activeItem.id] === 'REJECTED'}
                        className="px-5 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent shadow-none"
                      >
                        {language === 'ar' ? 'إرسال للتعديل' : 'Send for Revision'}
                      </button>
                      <button 
                        onClick={() => handleAction(activeItem.id, 'APPROVED')}
                        disabled={busy || isEditingActive || statusMap[activeItem.id] === 'APPROVED'}
                        className="px-5 py-2 rounded-lg bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors shadow-none disabled:opacity-50"
                      >
                        {language === 'ar' ? 'اعتماد ونشر' : 'Approve & Publish'}
                      </button>
                    </div>
                  </div>

                  {subTab === 'ASSESSMENTS' && (
                    <div className="mt-6 flex bg-slate-100 p-1 rounded-xl w-max">
                      <button
                        onClick={() => setAssessmentView('overview')}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors shadow-none ${assessmentView === 'overview' ? 'bg-white text-violet-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {language === 'ar' ? 'نظرة عامة وتحليل' : 'Overview & Analysis'}
                      </button>
                      <button
                        onClick={() => setAssessmentView('preview')}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors shadow-none ${assessmentView === 'preview' ? 'bg-white text-violet-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {language === 'ar' ? 'استعراض الأسئلة' : 'Review Questions'}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-none border-r-4 border-r-violet-400">
                      <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <Flag size={16} className="text-violet-500" />
                        {language === 'ar' ? 'ملاحظة من النظام' : 'System Note'}
                      </h3>
                      <p className="text-sm text-slate-600 font-medium">
                        {language === 'ar' ? `هذا المحتوى مقترح من قبل المعلم (${activeItem.author}) ويحتاج إلى مراجعة من قبل مشرف المادة قبل نشره في المكتبة العامة. تأكد من صحة الصياغة العلمية والمقاييس.` : `This content was submitted by the teacher (${activeItem.author}) and needs review by the subject supervisor before publishing to the public library. Verify the scientific accuracy and standards.`}
                      </p>
                    </div>
                    
                    {subTab === 'QUESTIONS' && activeIssues.length > 0 && (
                      <div className="bg-white rounded-xl p-5 border border-slate-200">
                        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" />{t('الفحص الآلي', 'Automatic check')} ({activeIssues.length})</h3>
                        <ul className="space-y-2">
                          {activeIssues.map((iss, k) => (
                            <li key={k} className={`text-sm font-medium px-3 py-2 rounded-lg border ${SEVERITY_STYLE[iss.severity]}`}>{language === 'ar' ? iss.ar : iss.en}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {subTab === 'QUESTIONS' && isEditingActive ? (
                      <ReviewEditor key={activeItem.id} q={questions.find((x) => x.id === activeItem.id) as BankQuestion} language={language} saving={busy} onCancel={() => setEditingId(null)} onSave={(patch, approveAfter) => saveEdit(activeItem.id, patch, approveAfter)} />
                    ) : subTab === 'QUESTIONS' ? (
                      // QUESTION VIEW — بيانات حقيقية من السؤال المحدد فعليًا
                      <div className="bg-white border border-slate-200 shadow-none rounded-2xl p-8 relative">
                        <div className="absolute top-8 left-8 flex gap-2">
                          <span className="px-3 py-1 bg-violet-50 text-violet-700 font-bold text-xs rounded-lg border border-violet-200">
                            {(activeItem as any).bloomLevel}
                          </span>
                          <span className="px-3 py-1 bg-slate-50 text-slate-600 font-bold text-xs rounded-lg border border-slate-200">
                            {(activeItem as any).difficulty}
                          </span>
                        </div>
                        <div className="inline-flex flex-col gap-2 mb-6">
                          <h4 className="font-bold text-slate-800 text-lg leading-relaxed">{activeItem.title}</h4>
                        </div>

                        {(activeItem as any).type === 'اختيار من متعدد' && Array.isArray((activeItem as any).options) ? (
                          <div className="space-y-3">
                            {(activeItem as any).options.map((opt: any, idx: number) => (
                              <div key={opt.id || idx} className={`flex items-center gap-4 p-4 rounded-xl border relative overflow-hidden ${opt.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold shrink-0 shadow-none ${opt.isCorrect ? 'bg-white text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{['أ', 'ب', 'ج', 'د', 'هـ', 'و'][idx] || idx + 1}</div>
                                <span className={`text-sm ${opt.isCorrect ? 'font-bold text-emerald-800' : 'font-medium text-slate-700'}`}>{opt.text}</span>
                                {opt.isCorrect && <div className="mr-auto"><CheckCircle2 size={20} className="text-emerald-500" /></div>}
                              </div>
                            ))}
                          </div>
                        ) : (activeItem as any).type === 'صح أم خطأ' && Array.isArray((activeItem as any).options) ? (
                          <div className="space-y-3">
                            {(activeItem as any).options.map((opt: any, idx: number) => (
                              <div key={opt.id || idx} className={`flex items-center gap-4 p-4 rounded-xl border ${opt.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                                <span className={`text-sm ${opt.isCorrect ? 'font-bold text-emerald-800' : 'font-medium text-slate-700'}`}>{opt.text}</span>
                                {opt.isCorrect && <div className="mr-auto"><CheckCircle2 size={20} className="text-emerald-500" /></div>}
                              </div>
                            ))}
                          </div>
                        ) : (activeItem as any).type === 'إجابة رقمية' ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
                            <p className="font-bold text-emerald-700">{language === 'ar' ? 'الإجابة الصحيحة:' : 'Correct answer:'} {(activeItem as any).question?.numericAnswer} {(activeItem as any).question?.numericUnit || ''}</p>
                            <p className="text-xs text-slate-500 mt-1">{language === 'ar' ? `هامش الخطأ المسموح: ±${(activeItem as any).question?.numericTolerance || 0}` : `Allowed tolerance: ±${(activeItem as any).question?.numericTolerance || 0}`}</p>
                          </div>
                        ) : (activeItem as any).type === 'توصيل' && Array.isArray((activeItem as any).question?.pairs) ? (
                          <div className="space-y-2">
                            {(activeItem as any).question.pairs.map((pair: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700">
                                <span className="flex-1">{pair.left}</span>
                                <ArrowLeftRight size={14} className="text-slate-400 shrink-0" />
                                <span className="flex-1 text-emerald-700">{pair.right}</span>
                              </div>
                            ))}
                          </div>
                        ) : (activeItem as any).type === 'ترتيب' && Array.isArray((activeItem as any).question?.orderItems) ? (
                          <div className="space-y-2">
                            {(activeItem as any).question.orderItems.map((item: string, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700">
                                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs shrink-0">{idx + 1}</span>
                                {item}
                              </div>
                            ))}
                          </div>
                        ) : (activeItem as any).type === 'تصنيف' && Array.isArray((activeItem as any).question?.classifyItems) ? (
                          <div className="space-y-2">
                            {(activeItem as any).question.classifyItems.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700">
                                <span>{item.text}</span>
                                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs">{item.category}</span>
                              </div>
                            ))}
                          </div>
                        ) : (activeItem as any).type === 'سحب وإفلات' && Array.isArray((activeItem as any).question?.dragItems) ? (
                          <div className="space-y-2">
                            {(activeItem as any).question.dragItems.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700">
                                <span>{item.text}</span>
                                <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg text-xs">{item.zone}</span>
                              </div>
                            ))}
                          </div>
                        ) : (activeItem as any).type === 'منطقة تفاعلية' && (activeItem as any).question?.imageUrl ? (
                          <div className="relative inline-block border border-slate-200 rounded-xl overflow-hidden">
                            <img src={(activeItem as any).question.imageUrl} alt="" className="max-w-full max-h-80 block" />
                            {((activeItem as any).question.hotspots || []).map((hs: any, idx: number) => (
                              <div key={idx} style={{ left: `${hs.xPercent}%`, top: `${hs.yPercent}%` }} className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold ${hs.isCorrect ? 'bg-emerald-500 border-white text-white' : 'bg-white/90 border-slate-300 text-slate-500'}`}>
                                {hs.label}
                              </div>
                            ))}
                          </div>
                        ) : (activeItem as any).type === 'مقطع صوتي' ? (
                          <div className="space-y-3">
                            {(activeItem as any).question?.audioUrl && <audio src={(activeItem as any).question.audioUrl} controls className="w-full" />}
                            <div className="space-y-3">
                              {((activeItem as any).options || []).map((opt: any, idx: number) => (
                                <div key={opt.id || idx} className={`flex items-center gap-4 p-4 rounded-xl border ${opt.isCorrect ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                                  <span className={`text-sm ${opt.isCorrect ? 'font-bold text-emerald-800' : 'font-medium text-slate-700'}`}>{opt.text}</span>
                                  {opt.isCorrect && <div className="mr-auto"><CheckCircle2 size={20} className="text-emerald-500" /></div>}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (activeItem as any).type === 'قطعة' ? (
                          <div className="space-y-4">
                            {(activeItem as any).question?.passageText && (
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                                {(activeItem as any).question.passageText}
                              </div>
                            )}
                            {((activeItem as any).question?.subQuestions || []).map((sq: any, sqIdx: number) => (
                              <div key={sq.id} className="border-t border-slate-100 pt-3">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="font-bold text-slate-800 text-sm">{sqIdx + 1}. {sq.title}</p>
                                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full shrink-0">{sq.points} pts</span>
                                </div>
                                {Array.isArray(sq.options) && sq.options.map((opt: any, oIdx: number) => (
                                  <div key={oIdx} className={`flex items-center gap-3 p-2.5 rounded-lg border text-sm mb-1.5 ${opt.isCorrect ? 'border-emerald-200 bg-emerald-50 font-bold text-emerald-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                                    {opt.isCorrect && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                                    {opt.text}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
                            {language === 'ar' ? `نوع السؤال: ${(activeItem as any).type}` : `Question type: ${(activeItem as any).type}`}
                          </p>
                        )}
                      </div>
                    ) : (
                      // ASSESSMENT VIEW
                      <>
                        {isLoadingAssessmentDetail ? (
                          <p className="text-center text-sm text-slate-400 py-10">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                        ) : !assessmentDetail ? (
                          <p className="text-center text-sm text-slate-400 py-10">{language === 'ar' ? 'تعذر تحميل تفاصيل التقييم' : 'Could not load assessment details'}</p>
                        ) : assessmentView === 'overview' ? (
                          <div className="grid grid-cols-2 gap-6">
                            {/* Dates Card */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-none">
                              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <Calendar size={18} className="text-violet-500" />
                                {language === 'ar' ? 'مواعيد الإتاحة' : 'Availability Dates'}
                              </h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                  <span className="text-sm font-bold text-slate-500">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</span>
                                  <span className="text-sm font-bold text-slate-800">{assessmentDetail.releaseAt ? new Date(assessmentDetail.releaseAt).toLocaleString() : (language === 'ar' ? 'متاح دائماً' : 'Always available')}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                                  <span className="text-sm font-bold text-amber-700">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</span>
                                  <span className="text-sm font-bold text-amber-900">{assessmentDetail.dueDate ? new Date(assessmentDetail.dueDate).toLocaleString() : (language === 'ar' ? 'بدون تاريخ استحقاق' : 'No due date')}</span>
                                </div>
                              </div>
                            </div>

                            {/* Analytics Card */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-none">
                              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <PieChart size={18} className="text-violet-500" />
                                {language === 'ar' ? 'تحليل محتوى التقييم' : 'Assessment Content Analysis'}
                              </h3>
                              
                              {(() => {
                                const qs = assessmentDetail.questions;
                                const typeCounts: Record<string, number> = {};
                                qs.forEach((q) => { typeCounts[q.type] = (typeCounts[q.type] || 0) + 1; });
                                const typeColors = ['bg-violet-600', 'bg-emerald-500', 'bg-amber-400', 'bg-sky-500', 'bg-rose-400'];
                                const typeEntries = Object.entries(typeCounts);
                                return (
                                  <div className="mb-6">
                                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                      <span>{language === 'ar' ? `توزيع أنواع الأسئلة (${qs.length} سؤال)` : `Question Type Distribution (${qs.length} questions)`}</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                      {typeEntries.map(([type, count], i) => (
                                        <div key={type} className={`h-full ${typeColors[i % typeColors.length]}`} style={{ width: `${(count / qs.length) * 100}%` }} title={`${type} (${count})`}></div>
                                      ))}
                                    </div>
                                    <div className="flex gap-4 mt-2 text-[10px] font-medium text-slate-500 flex-wrap">
                                      {typeEntries.map(([type, count], i) => (
                                        <span key={type} className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${typeColors[i % typeColors.length]}`} /> {type} ({count})</span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}

                              <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                  <span>{language === 'ar' ? 'مستويات بلوم' : "Bloom's Levels"}</span>
                                </div>
                                {assessmentDetail.bloomData.length === 0 ? (
                                  <p className="text-xs text-slate-400">{language === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
                                ) : (() => {
                                  const bloomColors = ['bg-indigo-500', 'bg-sky-500', 'bg-rose-400', 'bg-emerald-500', 'bg-amber-400', 'bg-violet-500'];
                                  const totalBloom = assessmentDetail.bloomData.reduce((s, b) => s + b.value, 0);
                                  return (
                                    <>
                                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                        {assessmentDetail.bloomData.map((b, i) => (
                                          <div key={b.name} className={`h-full ${bloomColors[i % bloomColors.length]}`} style={{ width: `${(b.value / totalBloom) * 100}%` }}></div>
                                        ))}
                                      </div>
                                      <div className="flex gap-4 mt-2 text-[10px] font-medium text-slate-500 flex-wrap">
                                        {assessmentDetail.bloomData.map((b, i) => (
                                          <span key={b.name} className="flex items-center gap-1"><div className={`w-2 h-2 rounded-full ${bloomColors[i % bloomColors.length]}`} /> {b.name} ({Math.round((b.value / totalBloom) * 100)}%)</span>
                                        ))}
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {assessmentDetail.questions.length === 0 ? (
                              <p className="text-center text-sm text-slate-400 py-10">{language === 'ar' ? 'مفيش أسئلة مرتبطة بالتقييم ده' : 'No questions linked to this assessment'}</p>
                            ) : assessmentDetail.questions.map((q, idx) => (
                              <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-6 relative shadow-none">
                                <div className="absolute top-6 left-6 flex gap-2">
                                  <span className="px-3 py-1 bg-violet-50 text-violet-700 font-bold text-xs rounded-lg border border-violet-200">{q.bloomLevel}</span>
                                  <span className="px-3 py-1 bg-slate-50 text-slate-600 font-bold text-xs rounded-lg border border-slate-200">{q.difficulty}</span>
                                </div>
                                <h5 className="font-bold text-slate-800 text-sm mb-4 max-w-2xl leading-relaxed">{language === 'ar' ? `السؤال رقم ${idx + 1}: ${q.title}` : `Question ${idx + 1}: ${q.title}`}</h5>
                                {Array.isArray(q.options) && q.options.length > 0 ? (
                                  <div className="space-y-2">
                                    {q.options.map((opt: any, oIdx: number) => (
                                      <div key={opt.id || oIdx} className={`flex items-center p-3 rounded-lg border text-sm ${opt.isCorrect ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 bg-slate-50 text-slate-600 font-medium'}`}>
                                        {opt.isCorrect ? <CheckCircle2 size={16} className="text-emerald-500 ml-2" /> : <div className="w-4 h-4 ml-2" />}
                                        {opt.text}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400">{language === 'ar' ? `نوع السؤال: ${q.type}` : `Question type: ${q.type}`}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
              <ShieldCheck size={64} className="mb-6 opacity-20 text-slate-400" />
              <h3 className="text-xl font-bold text-slate-600 mb-2">{language === 'ar' ? 'مساحة الاعتمادات' : 'Approvals Space'}</h3>
              <p className="text-sm font-medium">{language === 'ar' ? 'اختر عنصراً من القائمة الجانبية لمعاينته ومراجعته' : 'Select an item from the sidebar to preview and review it'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-[500px] shadow-none border border-slate-200 relative"
            >
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <AlertCircle size={22} className="text-amber-500" />
                {language === 'ar' ? 'سبب طلب التعديل' : 'Reason for Revision Request'}
              </h3>
              <p className="text-sm text-slate-500 font-medium mb-6">{language === 'ar' ? 'يرجى كتابة ملاحظاتك الإرشادية بوضوح ليتمكن المعلم من تصحيح المحتوى وإعادة إرساله.' : 'Please write clear guidance notes so the teacher can correct the content and resubmit it.'}</p>
              
              <textarea 
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder={language === 'ar' ? 'مثال: يرجى مراجعة المشتت ب في السؤال الثالث ليكون أكثر ارتباطاً بالسياق...' : 'e.g. Please review distractor B in question 3 to be more contextually relevant...'}
                className="w-full h-32 p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-violet-300 transition-all text-sm font-medium resize-none mb-6 shadow-none"
              />
              
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setRejectModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors shadow-none"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  onClick={submitRejection}
                  disabled={!rejectNote.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 shadow-none border border-amber-600"
                >
                  {language === 'ar' ? 'إرسال الملاحظات' : 'Send Feedback'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

