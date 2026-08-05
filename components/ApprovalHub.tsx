'use client';

import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, Search, ShieldCheck, HelpCircle, FileText, Flag, ChevronDown, ListChecks, Calendar, PieChart, Activity, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPendingQuestions, approveQuestion, rejectQuestion } from '@/services/questionBankData';

function SmartDropdown({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) {
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

  const isActive = value !== 'الكل';

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
            className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg border border-slate-200 shadow-none py-1 z-50 overflow-hidden"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full text-right px-4 py-2 text-sm transition-colors ${
                  value === opt ? 'bg-slate-50 text-violet-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ApprovalHub() {
  const [subTab, setSubTab] = useState<'QUESTIONS' | 'ASSESSMENTS'>('QUESTIONS');
  
  // Smart Filters State
  const [gradeFilter, setGradeFilter] = useState('الكل');
  const [subjectFilter, setSubjectFilter] = useState('الكل');
  const [statusFilter, setStatusFilter] = useState('الكل'); // Reset to 'الكل'
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  // Assessment Detail State
  const [assessmentView, setAssessmentView] = useState<'overview' | 'preview'>('overview');
  
  // Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  
  // الأسئلة المعلّقة الحقيقية (بانتظار اعتماد المشرف)
  const [questions, setQuestions] = useState<{ id: string; type: string; subject: string; title: string; author: string; date: string }[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const refreshPending = () => {
    setIsLoadingQuestions(true);
    getPendingQuestions().then((qs) => {
      setQuestions(qs.map((q) => ({
        id: q.id,
        type: q.type,
        subject: q.subject,
        title: q.title,
        author: q.creatorName,
        date: new Date(q.createdAt).toLocaleDateString(),
      })));
      setIsLoadingQuestions(false);
    });
  };

  useEffect(() => {
    refreshPending();
  }, []);

  // مركز اعتماد التقييمات الكاملة (المولّدة من مخطط تلقائي) لسه مش مبني — يحتاج نظام المخطط نفسه الأول
  const assessments: { id: string; subject: string; title: string; author: string; date: string }[] = [];

  const [selectedItemId, setSelectedItemId] = useState<string | null>('q1');
  const [statusMap, setStatusMap] = useState<Record<string, 'APPROVED' | 'REJECTED'>>({});

  const activeList = subTab === 'QUESTIONS' ? questions : assessments;
  const activeItem = activeList.find(i => i.id === selectedItemId) || activeList[0];

  const handleAction = async (id: string, action: 'APPROVED' | 'REJECTED', note?: string) => {
    if (action === 'APPROVED') {
      await approveQuestion(id);
    } else {
      await rejectQuestion(id, note || '');
    }
    setStatusMap(prev => ({ ...prev, [id]: action }));
    refreshPending();
  };

  const submitRejection = () => {
    if (activeItem) {
      handleAction(activeItem.id, 'REJECTED', rejectNote);
    }
    setRejectNote('');
    setRejectModalOpen(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-3xl border border-slate-200 overflow-hidden" dir="rtl">
      
      {/* Horizontal Top Filter Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <SmartDropdown label="الصف الدراسي" options={['الكل', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر']} value={gradeFilter} onChange={setGradeFilter} />
          <SmartDropdown label="المادة" options={['الكل', 'رياضيات', 'فيزياء', 'كيمياء', 'تاريخ', 'لغة عربية']} value={subjectFilter} onChange={setSubjectFilter} />
          <SmartDropdown label="حالة الاعتماد" options={['الكل', 'قيد المراجعة', 'معتمد', 'مرفوض']} value={statusFilter} onChange={setStatusFilter} />
          {subTab === 'QUESTIONS' && (
            <SmartDropdown label="نوع السؤال" options={['الكل', 'اختيار من متعدد', 'سؤال مقالي', 'صح أم خطأ']} value={typeFilter} onChange={setTypeFilter} />
          )}
        </div>
        
        <div className="relative w-80">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في الطلبات..." 
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
                onClick={() => { setSubTab('QUESTIONS'); setSelectedItemId(questions[0]?.id || null); setTypeFilter('الكل'); }}
                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors shadow-none ${subTab === 'QUESTIONS' ? 'bg-white text-violet-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                اعتماد الأسئلة
              </button>
              <button
                onClick={() => { setSubTab('ASSESSMENTS'); setSelectedItemId(assessments[0]?.id || null); setAssessmentView('overview'); }}
                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors shadow-none ${subTab === 'ASSESSMENTS' ? 'bg-white text-violet-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                اعتماد التقييمات
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {subTab === 'QUESTIONS' && isLoadingQuestions ? (
              <p className="text-center text-sm text-slate-400 py-10">جاري التحميل...</p>
            ) : activeList.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-10">{subTab === 'QUESTIONS' ? 'لا توجد أسئلة بانتظار الاعتماد' : 'مركز اعتماد التقييمات لسه مش شغّال — محتاج نظام مخطط التقييمات الأول'}</p>
            ) : activeList.map(item => {
              const isApproved = statusMap[item.id] === 'APPROVED';
              const isRejected = statusMap[item.id] === 'REJECTED';
              const isActive = selectedItemId === item.id;
              
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${isActive ? 'bg-violet-50 border-violet-200 ring-2 ring-violet-500/10' : 'bg-white border-slate-200 hover:border-slate-300 shadow-none'} relative`}
                >
                  {isApproved && <div className="absolute left-3 top-3 text-emerald-500"><CheckCircle2 size={18} /></div>}
                  {isRejected && <div className="absolute left-3 top-3 text-amber-500"><AlertCircle size={18} /></div>}
                  
                  <div className="flex items-center gap-2 mb-1.5">
                    {subTab === 'QUESTIONS' ? <HelpCircle size={14} className="text-violet-500" /> : <FileText size={14} className="text-violet-500" />}
                    <span className="text-xs font-bold text-slate-500">{item.subject}</span>
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
                            قيد المراجعة
                          </span>
                        )}
                        {statusMap[activeItem.id] === 'APPROVED' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            تم الاعتماد
                          </span>
                        )}
                        {statusMap[activeItem.id] === 'REJECTED' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                            مرفوض بانتظار التعديل
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-violet-600"></div>المادة: <b className="text-slate-700">{activeItem.subject}</b></span>
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-600 border border-white shadow-none">{activeItem.author.charAt(0)}</div>المرسل: <b className="text-slate-700">{activeItem.author}</b></span>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button 
                        onClick={() => setRejectModalOpen(true)}
                        disabled={statusMap[activeItem.id] === 'REJECTED'}
                        className="px-5 py-2 rounded-lg border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent shadow-none"
                      >
                        إرسال للتعديل
                      </button>
                      <button 
                        onClick={() => handleAction(activeItem.id, 'APPROVED')}
                        disabled={statusMap[activeItem.id] === 'APPROVED'}
                        className="px-5 py-2 rounded-lg bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors shadow-none disabled:opacity-50"
                      >
                        اعتماد ونشر
                      </button>
                    </div>
                  </div>

                  {subTab === 'ASSESSMENTS' && (
                    <div className="mt-6 flex bg-slate-100 p-1 rounded-xl w-max">
                      <button
                        onClick={() => setAssessmentView('overview')}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors shadow-none ${assessmentView === 'overview' ? 'bg-white text-violet-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        نظرة عامة وتحليل
                      </button>
                      <button
                        onClick={() => setAssessmentView('preview')}
                        className={`px-6 py-2 text-sm font-bold rounded-lg transition-colors shadow-none ${assessmentView === 'preview' ? 'bg-white text-violet-700 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        استعراض الأسئلة
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                  <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-none border-r-4 border-r-violet-400">
                      <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2">
                        <Flag size={16} className="text-violet-500" />
                        ملاحظة من النظام
                      </h3>
                      <p className="text-sm text-slate-600 font-medium">
                        هذا المحتوى مقترح من قبل المعلم ({activeItem.author}) ويحتاج إلى مراجعة من قبل مشرف المادة قبل نشره في المكتبة العامة. تأكد من صحة الصياغة العلمية والمقاييس.
                      </p>
                    </div>
                    
                    {subTab === 'QUESTIONS' ? (
                      // QUESTION VIEW
                      <div className="bg-white border border-slate-200 shadow-none rounded-2xl p-8 relative">
                        <div className="absolute top-8 left-8">
                          <span className="px-3 py-1 bg-violet-50 text-violet-700 font-bold text-xs rounded-lg border border-violet-200">
                            نقطتان (2)
                          </span>
                        </div>
                        <div className="inline-flex flex-col gap-2 mb-6">
                          <h4 className="font-bold text-slate-800 text-lg leading-relaxed">{activeItem.title}</h4>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center p-4 rounded-xl border border-emerald-200 bg-emerald-50 relative overflow-hidden group">
                            <div className="flex items-center gap-4 z-10 w-full">
                              <div className="w-8 h-8 rounded-full bg-white text-emerald-600 border border-emerald-200 flex items-center justify-center text-sm font-bold shrink-0 shadow-none">أ</div>
                              <span className="font-bold text-emerald-800 text-sm">إجابة صحيحة نموذجية (تطبيق القانون الثالث)</span>
                              <div className="mr-auto"><CheckCircle2 size={20} className="text-emerald-500" /></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-center text-sm font-bold shrink-0">ب</div>
                            <span className="font-medium text-slate-700 text-sm">مشتت أول (نتيجة خطأ في الحساب)</span>
                          </div>
                          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-center text-sm font-bold shrink-0">ج</div>
                            <span className="font-medium text-slate-700 text-sm">مشتت ثاني (استخدام قانون مختلف)</span>
                          </div>
                          <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white">
                            <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-center text-sm font-bold shrink-0">د</div>
                            <span className="font-medium text-slate-700 text-sm">مشتت ثالث (إجابة عشوائية)</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // ASSESSMENT VIEW
                      <>
                        {assessmentView === 'overview' ? (
                          <div className="grid grid-cols-2 gap-6">
                            {/* Dates Card */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-none">
                              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <Calendar size={18} className="text-violet-500" />
                                مواعيد الإتاحة
                              </h3>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                                  <span className="text-sm font-bold text-slate-500">تاريخ البدء</span>
                                  <span className="text-sm font-bold text-slate-800">12 أكتوبر 2023 - 08:00 ص</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                                  <span className="text-sm font-bold text-amber-700">تاريخ الاستحقاق</span>
                                  <span className="text-sm font-bold text-amber-900">15 أكتوبر 2023 - 11:59 م</span>
                                </div>
                              </div>
                            </div>

                            {/* Analytics Card */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-none">
                              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <PieChart size={18} className="text-violet-500" />
                                تحليل محتوى التقييم
                              </h3>
                              
                              <div className="mb-6">
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                  <span>توزيع أنواع الأسئلة (15 سؤال)</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                  <div className="h-full bg-violet-600" style={{ width: '60%' }} title="اختياري (60%)"></div>
                                  <div className="h-full bg-emerald-500" style={{ width: '25%' }} title="صح أم خطأ (25%)"></div>
                                  <div className="h-full bg-amber-400" style={{ width: '15%' }} title="مقالي (15%)"></div>
                                </div>
                                <div className="flex gap-4 mt-2 text-[10px] font-medium text-slate-500">
                                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-violet-600" /> اختياري (10)</span>
                                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> صح أم خطأ (3)</span>
                                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> مقالي (2)</span>
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                                  <span>مستويات بلوم</span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                                  <div className="h-full bg-indigo-500" style={{ width: '40%' }}></div>
                                  <div className="h-full bg-sky-500" style={{ width: '40%' }}></div>
                                  <div className="h-full bg-rose-400" style={{ width: '20%' }}></div>
                                </div>
                                <div className="flex gap-4 mt-2 text-[10px] font-medium text-slate-500">
                                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> تذكر (40%)</span>
                                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sky-500" /> فهم (40%)</span>
                                  <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400" /> تطبيق (20%)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {[1, 2, 3].map((num) => (
                              <div key={num} className="bg-white border border-slate-200 rounded-xl p-6 relative shadow-none">
                                <div className="absolute top-6 left-6">
                                  <span className="px-3 py-1 bg-violet-50 text-violet-700 font-bold text-xs rounded-lg border border-violet-200">
                                    نقطتان (2)
                                  </span>
                                </div>
                                <h5 className="font-bold text-slate-800 text-sm mb-4 max-w-2xl leading-relaxed">السؤال رقم {num}: ما هو الأثر الرئيسي للثورة الصناعية على البنية الاجتماعية في أوروبا خلال القرن التاسع عشر؟</h5>
                                <div className="space-y-2">
                                  <div className="flex items-center p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-bold relative">
                                    <CheckCircle2 size={16} className="text-emerald-500 ml-2" />
                                    ظهور طبقة عاملة حضرية جديدة (البروليتاريا)
                                  </div>
                                  <div className="flex items-center p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium">
                                    <div className="w-4 h-4 ml-2" />
                                    عودة النظام الإقطاعي بقوة
                                  </div>
                                  <div className="flex items-center p-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-sm font-medium">
                                    <div className="w-4 h-4 ml-2" />
                                    انخفاض عدد سكان المدن الكبرى
                                  </div>
                                </div>
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
              <h3 className="text-xl font-bold text-slate-600 mb-2">مساحة الاعتمادات</h3>
              <p className="text-sm font-medium">اختر عنصراً من القائمة الجانبية لمعاينته ومراجعته</p>
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
                سبب طلب التعديل
              </h3>
              <p className="text-sm text-slate-500 font-medium mb-6">يرجى كتابة ملاحظاتك الإرشادية بوضوح ليتمكن المعلم من تصحيح المحتوى وإعادة إرساله.</p>
              
              <textarea 
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="مثال: يرجى مراجعة المشتت ب في السؤال الثالث ليكون أكثر ارتباطاً بالسياق..."
                className="w-full h-32 p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-violet-300 transition-all text-sm font-medium resize-none mb-6 shadow-none"
              />
              
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setRejectModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors shadow-none"
                >
                  إلغاء
                </button>
                <button 
                  onClick={submitRejection}
                  disabled={!rejectNote.trim()}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors disabled:opacity-50 shadow-none border border-amber-600"
                >
                  إرسال الملاحظات
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

