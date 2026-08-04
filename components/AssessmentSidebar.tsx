import React from 'react';
import { 
  Settings, Clock, Shuffle, Eye, Calendar,
  UploadCloud, Scale, Layout, 
  Info, ShieldCheck, Lock, Type, ChevronLeft, ChevronRight, Shield, Filter
} from 'lucide-react';

interface RubricCriterion {
  id: string;
  title: string;
  weight: number;
  levels: {
    id: string;
    score: number;
    title: string;
    description: string;
    color: 'red' | 'amber' | 'emerald' | 'blue';
  }[];
}

interface AssessmentSidebarProps {
  language?: 'ar' | 'en';
  activeTab: 'quiz' | 'assignment';
  title: string;
  setTitle: (val: string) => void;
  status: 'draft' | 'published';
  setStatus: (val: 'draft' | 'published') => void;
  category: string;
  setCategory: (val: string) => void;
  isAutoCalc: boolean;
  setIsAutoCalc: (val: boolean) => void;
  maxScore: number;
  setMaxScore: (val: number) => void;
  attemptLimit: string;
  setAttemptLimit: (val: string) => void;
  timeLimitHours: string;
  setTimeLimitHours: (val: string) => void;
  timeLimitMinutes: string;
  setTimeLimitMinutes: (val: string) => void;
  dueDate: string;
  setDueDate: (val: string) => void;
  dueTime: string;
  setDueTime: (val: string) => void;
  prohibitLateSubmissions: boolean;
  setProhibitLateSubmissions: (val: boolean) => void;
  allowLateSubmission?: boolean;
  setAllowLateSubmission?: (val: boolean) => void;
  shuffleQuestions: boolean;
  setShuffleQuestions: (val: boolean) => void;
  oneAtATime: boolean;
  setOneAtATime: (val: boolean) => void;
  prohibitBacktracking: boolean;
  setProhibitBacktracking: (val: boolean) => void;
  randomizePages?: boolean;
  setRandomizePages?: (val: boolean) => void;
  randomizeAnswers?: boolean;
  setRandomizeAnswers?: (val: boolean) => void;
  noDueDate?: boolean;
  setNoDueDate?: (val: boolean) => void;
  prohibitNewAttemptsAfterDueDate?: boolean;
  setProhibitNewAttemptsAfterDueDate?: (val: boolean) => void;
  gradeCalculationMethod?: string;
  setGradeCalculationMethod?: (val: string) => void;
  feedbackTiming: string;
  setFeedbackTiming: (val: string) => void;
  aiPlagiarism: boolean;
  setAiPlagiarism: (val: boolean) => void;
  publishToTimeline: boolean;
  setPublishToTimeline: (val: boolean) => void;
  allowFileUpload: boolean;
  setAllowFileUpload: (val: boolean) => void;
  allowTextEntry: boolean;
  setAllowTextEntry: (val: boolean) => void;
  gradingMethod: 'Points' | 'Percentage' | 'Scale';
  rubric: RubricCriterion[];
  passPercentage: number;
  setPassPercentage: (val: number) => void;
  latePenalty: string;
  setLatePenalty: (val: string) => void;
  lockModule: boolean;
  setLockModule: (val: boolean) => void;
}

export function AssessmentSidebar({
  language = 'en',
  activeTab,
  title,
  setTitle,
  status,
  setStatus,
  category,
  setCategory,
  isAutoCalc,
  setIsAutoCalc,
  maxScore,
  setMaxScore,
  attemptLimit,
  setAttemptLimit,
  timeLimitHours,
  setTimeLimitHours,
  timeLimitMinutes,
  setTimeLimitMinutes,
  dueDate,
  setDueDate,
  dueTime,
  setDueTime,
  noDueDate = false,
  setNoDueDate = () => {},
  prohibitLateSubmissions,
  setProhibitLateSubmissions,
  allowLateSubmission = false,
  setAllowLateSubmission = () => {},
  prohibitNewAttemptsAfterDueDate = false,
  setProhibitNewAttemptsAfterDueDate = () => {},
  shuffleQuestions,
  setShuffleQuestions,
  oneAtATime,
  setOneAtATime,
  prohibitBacktracking,
  setProhibitBacktracking,
  randomizePages = false,
  setRandomizePages = () => {},
  randomizeAnswers = false,
  setRandomizeAnswers = () => {},
  gradeCalculationMethod = 'highest_attempt',
  setGradeCalculationMethod = () => {},
  feedbackTiming,
  setFeedbackTiming,
  aiPlagiarism,
  setAiPlagiarism,
  publishToTimeline,
  setPublishToTimeline,
  allowFileUpload,
  setAllowFileUpload,
  allowTextEntry,
  setAllowTextEntry,
  gradingMethod,
  rubric,
  passPercentage,
  setPassPercentage,
  latePenalty,
  setLatePenalty,
  lockModule,
  setLockModule
}: AssessmentSidebarProps) {
  const isRtl = language === 'ar';
  
  const content = {
    ar: {
      assessmentName: "اسم التقييم",
      placeholder: "أدخل الاسم...",
      globalSettings: "الإعدادات العامة",
      status: "الحالة",
      statusDraft: "مسودة",
      statusPublished: "منشور",
      category: "الفئة",
      catQuiz: "اختبارات قصيرة",
      catAssignment: "واجبات",
      catExam: "امتحانات",
      catParticipation: "مشاركة",
      maxScore: "الدرجة القصوى",
      autoCalcOn: "حساب تلقائي",
      manual: "يدوي",
      attemptLimits: "عدد المحاولات",
      attemptLimitsDesc: "اختر عدد المحاولات المسموحة لهذا الاختبار.",
      att1: "محاولة واحدة",
      att2: "محاولتان",
      att3: "3 محاولات",
      attUnlimited: "غير محدود",
      gradeCalculationMethod: "طريقة احتساب الدرجة",
      gcmHighest: "أعلى محاولة",
      gcmFirst: "أول محاولة",
      gcmLast: "آخر محاولة",
      gcmAverage: "متوسط المحاولات",
      gcmLowest: "أقل محاولة",
      timeLimit: "الوقت المحدد",
      hr: "ساعة",
      min: "دقيقة",
      dueDateAndTime: "تاريخ ووقت التسليم",
      noDueDate: "بدون تاريخ استحقاق",
      prohibitLateSubmissions: "منع التسليمات المتأخرة",
      prohibitLateSubmissionsDesc: "سيتم تسليم المحاولات الجارية تلقائياً فور انتهاء تاريخ ووقت الاستحقاق.",
      prohibitNewAttempts: "منع المحاولات الجديدة بعد تاريخ الاستحقاق",
      prohibitNewAttemptsDesc: "لن يتمكن الطلاب من بدء محاولات جديدة بمجرد انتهاء التاريخ والوقت المحدد.",
      displayOptions: "خيارات العرض",
      shuffleQuestions: "عشوائية الأسئلة",
      oneAtATime: "سؤال واحد في كل مرة",
      prohibitBacktracking: "منع الرجوع للسؤال السابق",
      prohibitBacktrackingDesc: "لن يتمكن الطالب من العودة للأسئلة السابقة.",
      randomizePages: "ترتيب الصفحات عشوائياً",
      randomizePagesDesc: "يغير ترتيب صفحات الاختبار تلقائياً لكل طالب لمنع التلقين.",
      randomizeAnswers: "ترتيب الإجابات عشوائياً",
      randomizeAnswersDesc: "يغير ترتيب خيارات الإجابة لكل سؤال بشكل عشوائي.",
      feedbackTiming: "توقيت ظهور النتائج",
      ftInstantly: "فوراً",
      ftAfterDue: "بعد انتهاء وقت التسليم",
      ftSpecific: "في تاريخ محدد",
      plagiarismScan: "فحص الانتحال (الذكاء الاصطناعي)",
      publishToTimeline: "نشر في المخطط الزمني",
      studentSubMode: "طريقة تسليم الطالب",
      fileUpload: "رفع ملف",
      textEntry: "إدخال نص",
      gradingRules: "قواعد التقييم",
      totalPoints: "إجمالي النقاط",
      passPercentage: "نسبة النجاح",
      latePenalty: "خصم التأخير",
      penNone: "بدون خصم",
      pen5: "خصم 5% يومياً",
      pen10: "خصم 10% يومياً",
      penZero: "صفر",
      securityIntegrity: "الأمان والنزاهة",
      lockModule: "قفل الوحدة",
      accessConditions: "شروط الدخول والخروج",
      addReleaseCondition: "إضافة شرط تفعيل",
      font: "font-['Cairo']"
    },
    en: {
      assessmentName: "Assessment Name",
      placeholder: "Enter title...",
      globalSettings: "Global Settings",
      status: "Status",
      statusDraft: "Draft",
      statusPublished: "Published",
      category: "Gradebook Category",
      catQuiz: "Quizzes",
      catAssignment: "Assignments",
      catExam: "Exams",
      catParticipation: "Participation",
      maxScore: "Max Score",
      autoCalcOn: "Auto-Calc On",
      manual: "Manual",
      attemptLimits: "Attempt Limits",
      attemptLimitsDesc: "Choose the number of attempts allowed for this assessment.",
      att1: "1 Attempt",
      att2: "2 Attempts",
      att3: "3 Attempts",
      attUnlimited: "Unlimited",
      gradeCalculationMethod: "Grade Calculation Method",
      gcmHighest: "Highest Attempt",
      gcmFirst: "First Attempt",
      gcmLast: "Last Attempt",
      gcmAverage: "Average of Attempts",
      gcmLowest: "Lowest Attempt",
      timeLimit: "Time Limit",
      hr: "hr",
      min: "min",
      dueDateAndTime: "Due Date & Time",
      noDueDate: "No Due Date",
      prohibitLateSubmissions: "Prohibit late submissions",
      prohibitLateSubmissionsDesc: "In progress attempts will be submitted automatically at the due date and time.",
      prohibitNewAttempts: "Prohibit new attempts after due date",
      prohibitNewAttemptsDesc: "Students can't start new attempts once the due date and time has passed.",
      displayOptions: "Display Options",
      shuffleQuestions: "Shuffle Questions",
      oneAtATime: "One question at a time",
      prohibitBacktracking: "Prohibit backtracking",
      prohibitBacktrackingDesc: "Students cannot go back to previous questions.",
      randomizePages: "Randomize pages",
      randomizePagesDesc: "Shuffles the order of test pages randomly for each student.",
      randomizeAnswers: "Randomize answers",
      randomizeAnswersDesc: "Shuffles the order of choices for each question automatically.",
      feedbackTiming: "Feedback Timing",
      ftInstantly: "Instantly",
      ftAfterDue: "After Due Date",
      ftSpecific: "On Specific Date",
      plagiarismScan: "AI Plagiarism Scan",
      publishToTimeline: "Publish to Timeline",
      studentSubMode: "Student Submission Mode",
      fileUpload: "File Upload",
      textEntry: "Text Entry",
      gradingRules: "Grading Rules",
      totalPoints: "Total Points",
      passPercentage: "Pass Percentage",
      latePenalty: "Late Penalty",
      penNone: "No Penalty",
      pen5: "-5% per day",
      pen10: "-10% per day",
      penZero: "Zero Credit",
      securityIntegrity: "Security & Integrity",
      lockModule: "Lock Module",
      accessConditions: "Access & Conditions",
      addReleaseCondition: "Add Release Condition",
      font: "font-sans"
    }
  };

  const t = content[language];

  return (
    <aside className={`w-80 bg-white border-slate-200 flex flex-col shrink-0 ${isRtl ? 'border-r' : 'border-l'} ${t.font}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="p-6 border-b border-slate-100 bg-slate-50/30">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t.assessmentName}</label>
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-orange-100 focus:border-orange-300 transition-all outline-none"
          placeholder={t.placeholder}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {activeTab === 'quiz' ? (
          <>
            {/* Quiz Global Settings */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Settings size={12} /> {t.globalSettings}
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.status}</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setStatus('draft')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        status === 'draft' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {t.statusDraft}
                    </button>
                    <button 
                      onClick={() => setStatus('published')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        status === 'published' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {t.statusPublished}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.category}</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="quiz">{t.catQuiz}</option>
                    <option value="assignment">{t.catAssignment}</option>
                    <option value="exam">{t.catExam}</option>
                    <option value="participation">{t.catParticipation}</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-600">{t.maxScore}</label>
                    {activeTab === 'quiz' && (
                      <button 
                        onClick={() => setIsAutoCalc(!isAutoCalc)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${isAutoCalc ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {isAutoCalc ? t.autoCalcOn : t.manual}
                      </button>
                    )}
                  </div>
                  <input 
                    type="number" 
                    value={maxScore}
                    disabled={activeTab === 'quiz' && isAutoCalc}
                    onChange={(e) => setMaxScore(e.target.value === '' ? 0 : (parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-bold text-slate-700 disabled:opacity-50 focus:ring-2 focus:ring-orange-100 outline-none"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600">{t.attemptLimits}</label>
                    <span className="text-xs text-gray-400 mt-0.5 block mb-2">{t.attemptLimitsDesc}</span>
                    <select 
                      value={attemptLimit}
                      onChange={(e) => setAttemptLimit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-100"
                    >
                      <option value="1">{t.att1}</option>
                      <option value="2">{t.att2}</option>
                      <option value="3">{t.att3}</option>
                      <option value="unlimited">{t.attUnlimited}</option>
                    </select>
                  </div>
                  
                  {attemptLimit !== '1' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.gradeCalculationMethod}</label>
                      <select 
                        value={gradeCalculationMethod}
                        onChange={(e) => {
                          if (setGradeCalculationMethod) {
                            setGradeCalculationMethod(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-100"
                      >
                        <option value="highest_attempt">{t.gcmHighest}</option>
                        <option value="first_attempt">{t.gcmFirst}</option>
                        <option value="last_attempt">{t.gcmLast}</option>
                        <option value="average_attempts">{t.gcmAverage}</option>
                        <option value="lowest_attempt">{t.gcmLowest}</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.timeLimit}</label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                      <input 
                        type="number" 
                        value={timeLimitHours}
                        onChange={(e) => setTimeLimitHours(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 outline-none focus:ring-0 text-center"
                      />
                      <span className={`text-[10px] font-bold text-slate-400 uppercase ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.hr}</span>
                    </div>
                    <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                      <input 
                        type="number" 
                        value={timeLimitMinutes}
                        onChange={(e) => setTimeLimitMinutes(e.target.value)}
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 outline-none focus:ring-0 text-center"
                      />
                      <span className={`text-[10px] font-bold text-slate-400 uppercase ${isRtl ? 'mr-1' : 'ml-1'}`}>{t.min}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-600">{t.dueDateAndTime}</label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{t.noDueDate}</span>
                      <button 
                        onClick={() => {
                          const newVal = !noDueDate;
                          if (setNoDueDate) setNoDueDate(newVal);
                          if (newVal) {
                            setProhibitLateSubmissions(false);
                            if (setProhibitNewAttemptsAfterDueDate) {
                              setProhibitNewAttemptsAfterDueDate(false);
                            }
                          }
                        }}
                        className={`w-8 h-4 rounded-full relative transition-colors ${noDueDate ? 'bg-orange-500' : 'bg-slate-200'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${noDueDate ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                      </button>
                    </label>
                  </div>
                  
                  <div className={`space-y-4 transition-opacity duration-200 ${noDueDate ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="space-y-2">
                      <div className="relative">
                        <Calendar size={14} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                        <input 
                          type="date" 
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          disabled={noDueDate}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-100 ${isRtl ? 'pr-9' : 'pl-9'} disabled:bg-slate-100`}
                        />
                      </div>
                      <div className="relative">
                        <Clock size={14} className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                        <input 
                          type="time" 
                          value={dueTime}
                          onChange={(e) => setDueTime(e.target.value)}
                          disabled={noDueDate}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-100 ${isRtl ? 'pr-9' : 'pl-9'} disabled:bg-slate-100`}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100">
                      {/* PROHIBIT LATE SUBMISSIONS TOGGLE */}
                      <label className={`flex items-start justify-between group ${noDueDate ? 'cursor-default opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                        <div className="flex flex-col gap-0.5 max-w-[85%]">
                          <span className="text-xs font-bold text-slate-600">{t.prohibitLateSubmissions}</span>
                          <span className="text-xs text-gray-400 mt-1 block max-w-sm leading-tight">{t.prohibitLateSubmissionsDesc}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            if (noDueDate) return;
                            const newVal = !prohibitLateSubmissions;
                            setProhibitLateSubmissions(newVal);
                            if (newVal && setProhibitNewAttemptsAfterDueDate) {
                              setProhibitNewAttemptsAfterDueDate(true);
                            }
                          }}
                          disabled={noDueDate}
                          className={`w-8 h-4 rounded-full relative transition-colors shrink-0 mt-0.5 ${prohibitLateSubmissions && !noDueDate ? 'bg-orange-500' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${prohibitLateSubmissions && !noDueDate ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                        </button>
                      </label>

                      {/* PROHIBIT NEW ATTEMPTS TOGGLE */}
                      <label className={`flex items-start justify-between group mt-3 ${(noDueDate || prohibitLateSubmissions) ? 'cursor-default opacity-50 pointer-events-none' : 'cursor-pointer'}`}>
                        <div className="flex flex-col gap-0.5 max-w-[85%]">
                          <span className="text-xs font-bold text-slate-600">{t.prohibitNewAttempts}</span>
                          <span className="text-xs text-gray-400 mt-1 block max-w-sm leading-tight">{t.prohibitNewAttemptsDesc}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            if (noDueDate || prohibitLateSubmissions) return;
                            if (setProhibitNewAttemptsAfterDueDate) {
                              setProhibitNewAttemptsAfterDueDate(!prohibitNewAttemptsAfterDueDate);
                            }
                          }}
                          disabled={noDueDate || prohibitLateSubmissions}
                          className={`w-8 h-4 rounded-full relative transition-colors shrink-0 mt-0.5 ${(prohibitNewAttemptsAfterDueDate || prohibitLateSubmissions) && !noDueDate ? 'bg-orange-500' : 'bg-slate-200'}`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${(prohibitNewAttemptsAfterDueDate || prohibitLateSubmissions) && !noDueDate ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                        </button>
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* Quiz Display Options */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Eye size={12} /> {t.displayOptions}
              </h4>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                      <Shuffle size={14} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{t.shuffleQuestions}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShuffleQuestions(!shuffleQuestions)}
                    className={`w-8 h-4 rounded-full relative transition-colors ${shuffleQuestions ? 'bg-orange-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${shuffleQuestions ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                  </button>
                </label>

                <label className="flex items-start justify-between group cursor-pointer">
                  <div className="flex flex-col gap-0.5 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                        <Shuffle size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{t.randomizeAnswers}</span>
                    </div>
                    <span className="text-xs text-gray-400 mt-0.5 block">{t.randomizeAnswersDesc}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setRandomizeAnswers(!randomizeAnswers)}
                    className={`w-8 h-4 rounded-full relative transition-colors shrink-0 mt-0.5 ${randomizeAnswers ? 'bg-orange-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${randomizeAnswers ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                  </button>
                </label>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                        <Layout size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-600">{t.oneAtATime}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => {
                        const newVal = !oneAtATime;
                        setOneAtATime(newVal);
                        if (!newVal) {
                          setProhibitBacktracking(false);
                          setRandomizePages(false);
                        }
                      }}
                      className={`w-8 h-4 rounded-full relative transition-colors ${oneAtATime ? 'bg-orange-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${oneAtATime ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                    </button>
                  </label>

                  <div className={`space-y-4 ${isRtl ? 'pr-8' : 'pl-8'} transition-opacity duration-200 ${!oneAtATime ? 'opacity-50 pointer-events-none' : ''}`}>
                    <label className={`flex items-start justify-between group ${!oneAtATime ? 'cursor-default' : 'cursor-pointer'}`}>
                      <div className="flex flex-col gap-0.5 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                            <Layout size={14} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{t.randomizePages}</span>
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5 block">{t.randomizePagesDesc}</span>
                      </div>
                      <button 
                        type="button"
                        disabled={!oneAtATime}
                        onClick={() => {
                          if (oneAtATime) setRandomizePages(!randomizePages);
                        }}
                        className={`w-8 h-4 rounded-full relative transition-colors shrink-0 mt-0.5 ${randomizePages ? 'bg-orange-500' : 'bg-slate-200'} ${!oneAtATime ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${randomizePages ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                      </button>
                    </label>

                    <label className={`flex items-start justify-between group ${!oneAtATime ? 'cursor-default' : 'cursor-pointer'}`}>
                      <div className="flex flex-col gap-0.5 max-w-[85%]">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                            <Shield size={14} />
                          </div>
                          <span className="text-xs font-bold text-slate-600">{t.prohibitBacktracking}</span>
                        </div>
                        <span className="text-xs text-gray-400 mt-0.5 block">{t.prohibitBacktrackingDesc}</span>
                      </div>
                      <button 
                        type="button"
                        disabled={!oneAtATime}
                        onClick={() => {
                          if (oneAtATime) setProhibitBacktracking(!prohibitBacktracking);
                        }}
                        className={`w-8 h-4 rounded-full relative transition-colors shrink-0 mt-0.5 ${prohibitBacktracking ? 'bg-orange-500' : 'bg-slate-200'} ${!oneAtATime ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${prohibitBacktracking ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                      </button>
                    </label>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <label className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                        <ShieldCheck size={14} />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{t.plagiarismScan}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAiPlagiarism(!aiPlagiarism)}
                      className={`w-8 h-4 rounded-full relative transition-colors ${aiPlagiarism ? 'bg-orange-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${aiPlagiarism ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                        <Calendar size={14} />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{t.publishToTimeline}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setPublishToTimeline(!publishToTimeline)}
                      className={`w-8 h-4 rounded-full relative transition-colors ${publishToTimeline ? 'bg-orange-500' : 'bg-slate-200'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${publishToTimeline ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                    </button>
                  </label>
                </div>
              </div>
            </section>

            {/* Access & Conditions Section */}
            <hr className="my-6 border-slate-200" />
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Lock size={12} /> {t.accessConditions}
              </h4>
              <button className="w-full border-dashed border-2 border-slate-300 text-slate-600 hover:border-orange-500 hover:text-orange-500 bg-transparent rounded-lg py-3 flex items-center justify-center gap-2 transition-colors text-sm font-bold">
                <Filter size={16} />
                {t.addReleaseCondition}
              </button>
            </section>
          </>
        ) : (
          <>
            {/* Assignment Submission Settings */}
            <section className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <UploadCloud size={12} /> {t.studentSubMode}
              </h4>
              
              <div className="space-y-3">
                <label className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                      <UploadCloud size={14} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{t.fileUpload}</span>
                  </div>
                  <button 
                    onClick={() => setAllowFileUpload(!allowFileUpload)}
                    className={`w-8 h-4 rounded-full relative transition-colors ${allowFileUpload ? 'bg-orange-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${allowFileUpload ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                  </button>
                </label>

                <label className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-50 rounded-lg text-slate-400 group-hover:text-orange-600 group-hover:bg-orange-50 transition-all">
                      <Type size={14} />
                    </div>
                    <span className="text-xs font-medium text-slate-600">{t.textEntry}</span>
                  </div>
                  <button 
                    onClick={() => setAllowTextEntry(!allowTextEntry)}
                    className={`w-8 h-4 rounded-full relative transition-colors ${allowTextEntry ? 'bg-orange-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${allowTextEntry ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                  </button>
                </label>
              </div>
            </section>

            {/* Grading Rules */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Scale size={12} /> {t.gradingRules}
              </h4>
              
              <div className="space-y-4">
                {gradingMethod === 'Points' && (
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex justify-between items-center">
                    <span className="text-xs font-bold text-orange-800">{t.totalPoints}</span>
                    <span className="text-lg font-black text-orange-600">
                      {rubric?.reduce((sum, crit) => {
                        const maxLevelScore = Math.max(...crit.levels.map(l => l.score));
                        return sum + maxLevelScore;
                      }, 0) || 0}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-slate-600">{t.passPercentage}</label>
                    <span className="text-xs font-bold text-orange-600">{passPercentage}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={passPercentage}
                    onChange={(e) => setPassPercentage(e.target.value === '' ? 0 : (parseInt(e.target.value) || 0))}
                    className="w-full accent-orange-500"
                  />
                </div>

                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-xs font-bold text-slate-600">{isRtl ? 'السماح بالتسليم المتأخر' : 'Allow Late Submission'}</span>
                  <button 
                    onClick={() => setAllowLateSubmission(!allowLateSubmission)}
                    className={`w-8 h-4 rounded-full relative transition-colors ${allowLateSubmission ? 'bg-orange-500' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${allowLateSubmission ? (isRtl ? '-translate-x-4' : 'translate-x-4') : (isRtl ? 'translate-x-0' : 'translate-x-0.5')}`} />
                  </button>
                </label>

                {allowLateSubmission && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">{t.latePenalty}</label>
                  <select 
                    value={latePenalty}
                    onChange={(e) => setLatePenalty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-100"
                  >
                    <option value="none">{t.penNone}</option>
                    <option value="-5% per day">{t.pen5}</option>
                    <option value="-10% per day">{t.pen10}</option>
                    <option value="zero credit">{t.penZero}</option>
                  </select>
                </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
