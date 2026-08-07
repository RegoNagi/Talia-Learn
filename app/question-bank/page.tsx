'use client';

import { useState, useRef, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { Database, Filter, Plus, UploadCloud, DownloadCloud, ArrowRight, BrainCircuit, LayoutTemplate, Edit2, Trash2, BookOpen, ListChecks, CheckCircle2, AlignRight, Type, Mic, Copy, Eye, Search, ChevronDown, ChevronUp, MessageSquare, Layers, BarChart, FileText, LayoutGrid, Signal, Award, Play, X, Globe, Monitor, Flag, Check, Loader2, MousePointerClick, Settings2, RefreshCw, ShieldCheck, Calendar, Clock, Sigma, Calculator, GitMerge, ListOrdered, Move, Map, ImagePlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApprovalHub } from '@/components/ApprovalHub';
import { useAuth } from '@/contexts/AuthContext';
import { getVisibleQuestions, createQuestion, updateQuestion, deleteQuestion, linkQuestionsToQuiz, unlinkAllQuestionsFromQuiz, generateBlueprintQuestions, getBlueprintAssessments, getQuestionsForQuiz, convertBankQuestionToQuizQuestion, uploadQuestionImage, uploadQuestionAudio, BankQuestion } from '@/services/questionBankData';
import { HotspotEditor } from '@/components/question-editor/HotspotEditor';
import { SubQuestionEditor } from '@/components/question-editor/SubQuestionEditor';
import { getQuizById, updateQuiz, createQuiz, getClassRoster } from '@/services/assignmentData';
import { getSubjectGradeCombos, getAllClassSections } from '@/services/academicData';
import { getMyClassSections } from '@/services/attendanceData';

// --- CUSTOM DROPDOWN COMPONENT FOR THE SWAP MENU ---
const DropdownMenu = ({ options, onSelect }: { options: {label: string, icon: any}[], onSelect: (opt: string) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="absolute top-10 left-0 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/50 w-48 py-2 z-50">
      {options.map((opt, i) => {
        const Icon = opt.icon;
        return (
          <button key={i} onClick={() => onSelect(opt.label)} className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-sm font-bold text-slate-700 hover:text-violet-600 transition-colors">
            <Icon size={16} />
            {opt.label}
          </button>
        )
      })}
    </div>
  );
};

// --- CUSTOM DROPDOWN COMPONENT FOR THE HUB ---
function HubFilterDropdown({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-56 flex flex-col" ref={containerRef}>
      <span className="text-sm font-bold text-slate-500 mb-1.5">{label}</span>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between bg-white border px-4 py-2.5 rounded-xl cursor-pointer transition-all shadow-none ${isOpen ? 'border-violet-500 ring-2 ring-violet-50' : 'border-slate-200 hover:bg-slate-50'}`}
      >
        <span className="text-sm font-bold text-slate-700 truncate">{value}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <ul className="max-h-56 overflow-y-auto custom-scrollbar p-1">
              {options.map((opt) => (
                <li 
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                  className={`px-3 py-2 text-sm rounded-lg flex items-center justify-between cursor-pointer font-medium ${value === opt ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {opt}
                  {value === opt && <Check size={14} className="text-violet-600" />}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Question {
  id: string;
  title: string;
  unit: string;
  lesson?: string;
  bloomLevel: string;
  difficulty: string;
  type: string;
  options?: any[];
}

function CustomSelect({ 
  value, 
  onChange, 
  options, 
  icon: Icon, 
  label 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  options: string[]; 
  icon: any; 
  label: string; 
}) {
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

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 h-11 px-4 rounded-xl border text-sm font-bold transition-all whitespace-nowrap ${
          isOpen ? 'bg-white border-violet-500 shadow-sm ring-2 ring-violet-500/10 text-violet-700' : 
          value !== 'الكل' ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} className={value !== 'الكل' ? 'text-violet-500' : 'text-slate-400'} />
          <span className="truncate max-w-[120px]">{value === 'الكل' ? label : value}</span>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full min-w-[200px] bg-white rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-1 z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-right px-4 py-3 text-sm transition-colors ${
                  value === opt 
                    ? 'bg-violet-50 text-violet-700 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
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

function FormSelect({ 
  value, 
  onChange, 
  options, 
  icon: Icon, 
  label 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  options: string[]; 
  icon: any; 
  label: string; 
}) {
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

  return (
    <div className="relative" ref={containerRef}>
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2 px-1">
         <Icon size={12} />
         {label}
      </label>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={`w-full flex items-center justify-between gap-3 h-[42px] px-3.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80 ${
          isOpen ? 'border-violet-400 shadow-sm ring-2 ring-violet-500/10' : ''
        }`}
      >
        <span className="truncate">{value || 'اختر...'}</span>
        <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full min-w-[160px] bg-white rounded-xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-1 z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className={`w-full text-right px-4 py-2.5 text-xs transition-colors ${
                  value === opt 
                    ? 'bg-violet-50 text-violet-700 font-bold' 
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
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

export default function QuestionBank() {
  const { authUser, isLoggedIn, isAuthLoading, logout } = useAuth();
  const router = useRouter();
  const handleLogout = () => {
    logout();
    router.push('/');
  };
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MANAGEMENT' | 'ASSESSMENTS' | 'APPROVAL_HUB'>(authUser?.role === 'teacher' ? 'MANAGEMENT' : 'DASHBOARD');
  
  // Bank Scope State
  const [bankScope, setBankScope] = useState<'central' | 'shared' | 'private'>('central');
  
  // Assessments States
  const [assessmentView, setAssessmentView] = useState<'LIBRARY' | 'BLUEPRINT_FORM' | 'BLUEPRINT_REVIEW' | 'MANUAL_SELECTION' | 'SETTINGS'>('LIBRARY');
  const [settingsTab, setSettingsTab] = useState<'AVAILABILITY' | 'DELIVERY' | 'GRADEBOOK' | 'RESULTS' | 'SECURITY'>('AVAILABILITY');
  const [activeSwapMenuId, setActiveSwapMenuId] = useState<string | null>(null);
  const [manualSwapModalQId, setManualSwapModalQId] = useState<string | null>(null);
  const [manualSelectedQuestions, setManualSelectedQuestions] = useState<string[]>([]);
  
  const [diffEasy, setDiffEasy] = useState(30);
  const [diffMed, setDiffMed] = useState(50);
  const [diffHard, setDiffHard] = useState(20);
  const diffTotal = Number(diffEasy) + Number(diffMed) + Number(diffHard);

  const [bloomRemember, setBloomRemember] = useState(20);
  const [bloomUnderstand, setBloomUnderstand] = useState(20);
  const [bloomApply, setBloomApply] = useState(20);
  const [bloomAnalyze, setBloomAnalyze] = useState(15);
  const [bloomEvaluate, setBloomEvaluate] = useState(15);
  const [bloomCreate, setBloomCreate] = useState(10);
  const bloomTotal = Number(bloomRemember) + Number(bloomUnderstand) + Number(bloomApply) + Number(bloomAnalyze) + Number(bloomEvaluate) + Number(bloomCreate);

  const [TotalQuestions, setTotalQuestions] = useState(20);
  const [blueprintTitle, setBlueprintTitle] = useState('');
  const [blueprintSubject, setBlueprintSubject] = useState('');
  const [blueprintGrade, setBlueprintGrade] = useState('');
  const [blueprintClassId, setBlueprintClassId] = useState('');
  const [blueprintUnit, setBlueprintUnit] = useState('كل الوحدات');
  const [teacherClasses, setTeacherClasses] = useState<{ id: string; name: string; gradeLevel: string }[]>([]);

  // Question Types States
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['اختيار من متعدد', 'صح أم خطأ']);
  
  // Settings Tabs States
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState(false);
  const [showOneQuestion, setShowOneQuestion] = useState(false);
  const [preventBacktracking, setPreventBacktracking] = useState(false);
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [addToGradebook, setAddToGradebook] = useState(true);
  const [gradebookCalculationMode, setGradebookCalculationMode] = useState<'POINTS' | 'PERCENTAGE'>('PERCENTAGE');
  const [availabilityMode, setAvailabilityMode] = useState<'ALWAYS' | 'TIMEFRAME'>('TIMEFRAME');
  const [releaseDate, setReleaseDate] = useState('');
  const [releaseTime, setReleaseTime] = useState('08:00');
  const [dueDateValue, setDueDateValue] = useState('');
  const [dueTimeValue, setDueTimeValue] = useState('23:59');
  const [expiryBehavior, setExpiryBehavior] = useState<'auto_submit' | 'grace_5min'>('auto_submit');
  const [multiAttemptGradeMethod, setMultiAttemptGradeMethod] = useState('highest');
  const [duplicateCheckResult, setDuplicateCheckResult] = useState<{ checked: boolean; matches: BankQuestion[] }>({ checked: false, matches: [] });

  const normalizeForCompare = (s: string) => s.trim().toLowerCase().replace(/[\u064B-\u0652\s]+/g, ' ').trim();

  const handleCheckDuplicates = () => {
    if (!newQTitle.trim()) return;
    const normalizedNew = normalizeForCompare(newQTitle);
    const matches = questions.filter((q) => {
      const normalizedExisting = normalizeForCompare(q.title || '');
      if (!normalizedExisting) return false;
      // مطابقة تامة أو تشابه قوي (احتواء أحد النصين للتاني بعد التطبيع)
      return normalizedExisting === normalizedNew || normalizedExisting.includes(normalizedNew) || normalizedNew.includes(normalizedExisting);
    });
    setDuplicateCheckResult({ checked: true, matches });
  };
  const [targetingType, setTargetingType] = useState<'ALL' | 'CLASSES' | 'STUDENTS'>('ALL');
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [generateUniquePasswords, setGenerateUniquePasswords] = useState(false);
  const [restrictBrowser, setRestrictBrowser] = useState(false);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({'اختيار من متعدد': 10, 'صح أم خطأ': 10});
  const [typePercentages, setTypePercentages] = useState<Record<string, number>>({'اختيار من متعدد': 50, 'صح أم خطأ': 50});

  const questionTypesList = ['اختيار من متعدد', 'صح أم خطأ', 'سؤال مقالي', 'أكمل الفراغ', 'توصيل'];
  const typeDisplayNames: Record<string, string> = {
    'اختيار من متعدد': 'Multiple Choice',
    'صح أم خطأ': 'True/False',
    'سؤال مقالي': 'Essay',
    'أكمل الفراغ': 'Fill in the Blank',
    'توصيل': 'Matching',
    'ترتيب': 'Ordering',
    'إجابة قصيرة': 'Short Answer',
    'الكل': 'All',
    'منطقة تفاعلية': 'Hotspot',
    'تصنيف': 'Classification',
    'رسم بياني': 'Graphing',
    'سحب وإفلات': 'Drag and Drop',
    'مقطع صوتي': 'Audio Clip',
    'إجابة رقمية': 'Numeric Answer',
    'استبيان': 'Survey',
    'قطعة': 'Passage',
  };
  const typeLabel = (type: string) => language === 'ar' ? type : (typeDisplayNames[type] || type);
  
  const [realClassStudents, setRealClassStudents] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (targetingType === 'STUDENTS' && blueprintClassId) {
      getClassRoster(blueprintClassId).then((roster) => setRealClassStudents(roster));
    }
  }, [targetingType, blueprintClassId]);


  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [swappingIds, setSwappingIds] = useState<string[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  const toggleQuestionExpanded = (id: string) => {
    setExpandedQuestions(prev => prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]);
  };

  const handleSwapBlueprintQuestion = async (id: string) => {
    setSwappingIds(prev => [...prev, id]);
    const current = blueprintQuestions.find((q) => q.id === id);
    if (current) {
      const pool = await getVisibleQuestions({ subject: current.subject, grade: current.grade, isSupervisor: true });
      const usedIds = new Set(blueprintQuestions.map((q) => q.id));
      const alternative = pool.find((q) => q.status === 'approved' && q.difficulty === current.difficulty && q.bloomLevel === current.bloomLevel && !usedIds.has(q.id))
        || pool.find((q) => q.status === 'approved' && q.difficulty === current.difficulty && !usedIds.has(q.id));
      if (alternative) {
        setBlueprintQuestions(prev => prev.map((q) => q.id === id ? alternative : q));
        setHighlightedIds(prev => [...prev, alternative.id]);
        setTimeout(() => {
          setHighlightedIds(prev => prev.filter(qId => qId !== alternative.id));
        }, 1500);
      }
    }
    setSwappingIds(prev => prev.filter(qId => qId !== id));
  };


  const handleToggleType = (type: string) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        const next = prev.filter(t => t !== type);
        const newCounts = {...typeCounts};
        delete newCounts[type];
        setTypeCounts(newCounts);
        
        const newPercents = {...typePercentages};
        delete newPercents[type];
        setTypePercentages(newPercents);
        
        return next;
      }
      return [...prev, type];
    });
  };

  const handleTypeCountChange = (type: string, count: number) => {
    setTypeCounts(prev => ({...prev, [type]: count}));
    const percentage = TotalQuestions > 0 ? Math.round((count / TotalQuestions) * 100) : 0;
    setTypePercentages(prev => ({...prev, [type]: percentage}));
  };

  const handleTypePercentageChange = (type: string, percentage: number) => {
    setTypePercentages(prev => ({...prev, [type]: percentage}));
    const count = TotalQuestions > 0 ? Math.round((percentage / 100) * TotalQuestions) : 0;
    setTypeCounts(prev => ({...prev, [type]: count}));
  };


  // Management States
  const [mgtStep, setMgtStep] = useState<'HUB' | 'WORKSPACE' | 'FACTORY'>('HUB');
  const [activeSubject, setActiveSubject] = useState<{ subject: string; grade: string } | null>(null);
  const [hubCombos, setHubCombos] = useState<{ subject: string; grade: string; count: number }[]>([]);
  const [isLoadingHub, setIsLoadingHub] = useState(true);
  const [hubSubjectFilter, setHubSubjectFilter] = useState('كل المواد');
  const [hubGradeFilter, setHubGradeFilter] = useState(language === 'ar' ? 'كل الصفوف' : 'All Grades');
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Filters State
  const [mainSearchQuery, setMainSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('الكل');
  const [filterUnit, setFilterUnit] = useState('الكل');
  const [filterLesson, setFilterLesson] = useState('الكل');
  const [filterBloom, setFilterBloom] = useState('الكل');
  const [filterDifficulty, setFilterDifficulty] = useState('الكل');

  // Derived filtered questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(mainSearchQuery.toLowerCase());
    const matchesType = filterType === 'الكل' || q.type === filterType;
    const matchesUnit = filterUnit === 'الكل' || q.unit === filterUnit;
    const matchesLesson = filterLesson === 'الكل' || q.lesson === filterLesson;
    const matchesBloom = filterBloom === 'الكل' || q.bloomLevel === filterBloom;
    const matchesDifficulty = filterDifficulty === 'الكل' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesType && matchesUnit && matchesLesson && matchesBloom && matchesDifficulty;
  });

  // Extract unique values for filters
  const uniqueTypes = ['الكل', ...Array.from(new Set(questions.map(q => q.type)))];
  const uniqueUnits = ['الكل', ...Array.from(new Set(questions.map(q => q.unit)))];
  const uniqueLessons = ['الكل', ...Array.from(new Set(questions.map(q => q.lesson || ''))).filter(Boolean)];
  const uniqueBlooms = ['الكل', 'تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'ابتكار'];
  const uniqueDifficulties = ['الكل', 'سهل', 'متوسط', 'صعب'];

  // Factory States
  const [newQTitle, setNewQTitle] = useState('');
  const [newQUnit, setNewQUnit] = useState('');
  const [newQLesson, setNewQLesson] = useState('');
  const [newQBloom, setNewQBloom] = useState('تذكر');
  const [newQDiff, setNewQDiff] = useState('سهل');
  const [newQType, setNewQType] = useState('اختيار من متعدد');
  const [newQNumericAnswer, setNewQNumericAnswer] = useState('');
  const [newQNumericTolerance, setNewQNumericTolerance] = useState('0');
  const [newQNumericUnit, setNewQNumericUnit] = useState('');
  const [newQPairs, setNewQPairs] = useState<{ id: string; left: string; right: string }[]>([
    { id: '1', left: '', right: '' },
    { id: '2', left: '', right: '' },
  ]);
  const [newQOrderItems, setNewQOrderItems] = useState<{ id: string; text: string }[]>([
    { id: '1', text: '' },
    { id: '2', text: '' },
    { id: '3', text: '' },
  ]);
  const [newQCategories, setNewQCategories] = useState<{ id: string; name: string }[]>([
    { id: 'c1', name: '' },
    { id: 'c2', name: '' },
  ]);
  const [newQClassifyItems, setNewQClassifyItems] = useState<{ id: string; text: string; categoryId: string }[]>([
    { id: '1', text: '', categoryId: 'c1' },
    { id: '2', text: '', categoryId: 'c1' },
  ]);
  const [newQZones, setNewQZones] = useState<{ id: string; name: string }[]>([
    { id: 'z1', name: '' },
    { id: 'z2', name: '' },
  ]);
  const [newQDragItems, setNewQDragItems] = useState<{ id: string; text: string; zoneId: string }[]>([
    { id: '1', text: '', zoneId: 'z1' },
    { id: '2', text: '', zoneId: 'z1' },
  ]);
  const [newQImageUrl, setNewQImageUrl] = useState('');
  const [isUploadingQImage, setIsUploadingQImage] = useState(false);
  const [newQQuestionImageUrl, setNewQQuestionImageUrl] = useState('');
  const [isUploadingQuestionImage, setIsUploadingQuestionImage] = useState(false);
  const [newQHotspots, setNewQHotspots] = useState<{ id: string; xPercent: number; yPercent: number; label: string; isCorrect: boolean }[]>([]);
  const [newQAudioUrl, setNewQAudioUrl] = useState('');
  const [isUploadingQAudio, setIsUploadingQAudio] = useState(false);
  const [newQPassageText, setNewQPassageText] = useState('');
  const [newQFillBlankAnswer, setNewQFillBlankAnswer] = useState('');
  const [newQEssayModelAnswer, setNewQEssayModelAnswer] = useState('');
  const [newQSubQuestions, setNewQSubQuestions] = useState<{
    id: string;
    title: string;
    type: string;
    points: number;
    options: { id: string; text: string; isCorrect: boolean }[];
  }[]>([]);
  const [targetBank, setTargetBank] = useState('بنك مركزي (الوزارة)');
  const [qStandard, setQStandard] = useState('');
  const [qTime, setQTime] = useState('5');
  const [newQOptions, setNewQOptions] = useState<any[]>([
    { id: '1', text: '', isCorrect: true, imageUrl: null },
    { id: '2', text: '', isCorrect: false, imageUrl: null },
    { id: '3', text: '', isCorrect: false, imageUrl: null },
    { id: '4', text: '', isCorrect: false, imageUrl: null }
  ]);
  const [newQCorrectOption, setNewQCorrectOption] = useState<number>(0);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [viewingQuestion, setViewingQuestion] = useState<BankQuestion | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultFilterType, setVaultFilterType] = useState('الكل');
  const [vaultFilterDiff, setVaultFilterDiff] = useState('الكل');

  const filteredVaultQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(vaultSearch.toLowerCase());
    const matchesType = vaultFilterType === 'الكل' || q.type === vaultFilterType;
    const matchesDiff = vaultFilterDiff === 'الكل' || q.difficulty === vaultFilterDiff;
    return matchesSearch && matchesType && matchesDiff;
  });



  const [assessmentsList, setAssessmentsList] = useState<{ id: string; title: string; subject: string; questionCount: number; totalPoints: number; className: string; classId: string; status: string; approvalStatus: string; createdAt: string }[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(true);

  const refreshAssessments = () => {
    startTransition(() => setIsLoadingAssessments(true));
    getBlueprintAssessments({ teacherId: authUser?.teacherId, isSupervisor }).then((list) => {
      setAssessmentsList(list);
      setIsLoadingAssessments(false);
    });
  };




  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [saveQuestionError, setSaveQuestionError] = useState('');

  const scopeFromLabel = (label: string): 'central' | 'shared' | 'private' => {
    if (label === 'بنك مركزي (الوزارة)') return 'central';
    if (label === 'بنك مشترك (المدرسة)') return 'shared';
    return 'private';
  };

  const handleSaveQuestion = async (stayInEditor: boolean = false) => {
    if (!newQTitle || !activeSubject) return;
    setIsSavingQuestion(true);
    setSaveQuestionError('');
    const payload = {
      createdBy: authUser?.teacherId || null,
      createdByRole: (isSupervisor ? 'supervisor' : 'teacher') as 'teacher' | 'supervisor',
      scope: scopeFromLabel(targetBank),
      subject: activeSubject.subject,
      grade: activeSubject.grade,
      unit: newQUnit || (language === 'ar' ? 'بدون وحدة' : 'No unit'),
      lesson: newQLesson || undefined,
      bloomLevel: newQBloom,
      difficulty: newQDiff,
      type: newQType,
      question: { 
        title: newQTitle, 
        questionImageUrl: newQQuestionImageUrl || undefined,
        options: newQOptions, 
        correctOption: newQCorrectOption, 
        standard: qStandard || undefined,
        ...(newQType === 'إجابة رقمية' ? {
          numericAnswer: newQNumericAnswer ? Number(newQNumericAnswer) : null,
          numericTolerance: newQNumericTolerance ? Number(newQNumericTolerance) : 0,
          numericUnit: newQNumericUnit || undefined,
        } : {}),
        ...(newQType === 'توصيل' ? {
          pairs: newQPairs.filter((p) => p.left.trim() && p.right.trim()),
        } : {}),
        ...(newQType === 'ترتيب' ? {
          orderItems: newQOrderItems.filter((it) => it.text.trim()).map((it) => it.text),
        } : {}),
        ...(newQType === 'تصنيف' ? {
          categories: newQCategories.filter((c) => c.name.trim()).map((c) => c.name),
          classifyItems: newQClassifyItems.filter((it) => it.text.trim()).map((it) => ({
            text: it.text,
            category: newQCategories.find((c) => c.id === it.categoryId)?.name || '',
          })),
        } : {}),
        ...(newQType === 'سحب وإفلات' ? {
          zones: newQZones.filter((z) => z.name.trim()).map((z) => z.name),
          dragItems: newQDragItems.filter((it) => it.text.trim()).map((it) => ({
            text: it.text,
            zone: newQZones.find((z) => z.id === it.zoneId)?.name || '',
          })),
        } : {}),
        ...(newQType === 'منطقة تفاعلية' ? {
          imageUrl: newQImageUrl || undefined,
          hotspots: newQHotspots.map((hs) => ({ xPercent: hs.xPercent, yPercent: hs.yPercent, label: hs.label, isCorrect: hs.isCorrect })),
        } : {}),
        ...(newQType === 'مقطع صوتي' ? {
          audioUrl: newQAudioUrl || undefined,
        } : {}),
        ...(newQType === 'أكمل الفراغ' ? {
          correctAnswer: newQFillBlankAnswer || undefined,
        } : {}),
        ...(newQType === 'سؤال مقالي' ? {
          modelAnswer: newQEssayModelAnswer || undefined,
        } : {}),
        ...(newQType === 'قطعة' ? {
          passageText: newQPassageText || undefined,
          subQuestions: newQSubQuestions.filter((sq) => sq.title.trim()).map((sq) => ({
            id: sq.id,
            title: sq.title,
            type: sq.type,
            points: sq.points || 1,
            options: (sq.type === 'اختيار من متعدد' || sq.type === 'صح أم خطأ') ? sq.options.filter((o) => o.text.trim()) : undefined,
          })),
        } : {}),
      },
    };
    const { id, error } = editingQuestionId
      ? await updateQuestion(editingQuestionId, payload).then((r) => ({ id: r.ok ? editingQuestionId : null, error: r.error }))
      : await createQuestion(payload);
    setIsSavingQuestion(false);
    if (!id) {
      setSaveQuestionError(error || (language === 'ar' ? 'حصل خطأ أثناء الحفظ' : 'An error occurred while saving'));
      return;
    }
    refreshQuestions();

    // Clear only text entry inputs to allow continuous fluid flow
    setNewQTitle('');
    setNewQQuestionImageUrl('');
    setNewQOptions([
      { id: '1', text: '', isCorrect: true, imageUrl: null },
      { id: '2', text: '', isCorrect: false, imageUrl: null },
      { id: '3', text: '', isCorrect: false, imageUrl: null },
      { id: '4', text: '', isCorrect: false, imageUrl: null }
    ]);
    setNewQCorrectOption(0);
    setNewQImageUrl('');
    setNewQHotspots([]);
    setNewQAudioUrl('');
    setNewQPassageText('');
    setNewQSubQuestions([]);
    setNewQFillBlankAnswer('');
    setNewQEssayModelAnswer('');
    const wasEditing = !!editingQuestionId;
    setEditingQuestionId(null);
    // CRITICAL: We explicitly do NOT clear newQType, newQUnit, newQBloom, or newQDiff.
    
    if (!stayInEditor || wasEditing) {
      setMgtStep('WORKSPACE');
    }
  };

  // بوابة الصلاحية الحقيقية — إما مشرف بنك الأسئلة (وصول كامل) أو معلم عنده صلاحية "إضافة أسئلة" بس
  const isSupervisor = authUser?.role === 'qb_supervisor';
  const canContribute = isSupervisor || (authUser?.role === 'teacher' && !!authUser?.canUseQuestionBank);

  // بيحمّل سؤال حقيقي موجود جوه نفس نموذج الإنشاء عشان نقدر نعدّله فعليًا (نفس الحقول بالظبط لكل الأنواع الـ١٣)
  const openEditQuestion = (q: BankQuestion) => {
    const scopeLabel = q.scope === 'central' ? 'بنك مركزي (الوزارة)' : q.scope === 'shared' ? 'بنك مشترك (المدرسة)' : 'بنك خاص (أنا بس)';
    setEditingQuestionId(q.id);
    setActiveSubject({ subject: q.subject, grade: q.grade });
    setTargetBank(scopeLabel);
    setNewQUnit(q.unit || '');
    setNewQLesson(q.lesson || '');
    setNewQBloom(q.bloomLevel);
    setNewQDiff(q.difficulty);
    setNewQType(q.type);
    setNewQTitle(q.question?.title || '');
    setNewQQuestionImageUrl((q.question as any)?.questionImageUrl || '');
    setQStandard(q.question?.standard || '');
    setNewQFillBlankAnswer((q.question as any)?.correctAnswer || '');
    setNewQEssayModelAnswer((q.question as any)?.modelAnswer || '');
    setNewQOptions(q.question?.options?.length ? q.question.options.map((o: any) => ({ ...o })) : [
      { id: crypto.randomUUID(), text: '', isCorrect: true, imageUrl: null },
      { id: crypto.randomUUID(), text: '', isCorrect: false, imageUrl: null },
    ]);
    setNewQCorrectOption(q.question?.correctOption ?? 0);
    setNewQNumericAnswer(q.question?.numericAnswer != null ? String(q.question.numericAnswer) : '');
    setNewQNumericTolerance(q.question?.numericTolerance != null ? String(q.question.numericTolerance) : '0');
    setNewQNumericUnit(q.question?.numericUnit || '');
    setNewQPairs(q.question?.pairs?.length ? q.question.pairs.map((p: any) => ({ ...p })) : [
      { id: crypto.randomUUID(), left: '', right: '' },
      { id: crypto.randomUUID(), left: '', right: '' },
    ]);
    setNewQOrderItems(q.question?.orderItems?.length ? q.question.orderItems.map((text: string) => ({ id: crypto.randomUUID(), text })) : [
      { id: crypto.randomUUID(), text: '' },
      { id: crypto.randomUUID(), text: '' },
    ]);
    const loadedCategories = (q.question?.categories || []).map((name: string) => ({ id: crypto.randomUUID(), name }));
    setNewQCategories(loadedCategories.length ? loadedCategories : [{ id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }]);
    setNewQClassifyItems((q.question?.classifyItems || []).map((it: any) => ({
      id: crypto.randomUUID(),
      text: it.text,
      categoryId: loadedCategories.find((c) => c.name === it.category)?.id || '',
    })));
    const loadedZones = (q.question?.zones || []).map((name: string) => ({ id: crypto.randomUUID(), name }));
    setNewQZones(loadedZones.length ? loadedZones : [{ id: crypto.randomUUID(), name: '' }, { id: crypto.randomUUID(), name: '' }]);
    setNewQDragItems((q.question?.dragItems || []).map((it: any) => ({
      id: crypto.randomUUID(),
      text: it.text,
      zoneId: loadedZones.find((z) => z.name === it.zone)?.id || '',
    })));
    setNewQImageUrl(q.question?.imageUrl || '');
    setNewQHotspots((q.question?.hotspots || []).map((hs: any) => ({ ...hs, id: crypto.randomUUID() })));
    setNewQAudioUrl(q.question?.audioUrl || '');
    setNewQPassageText(q.question?.passageText || '');
    setNewQSubQuestions((q.question?.subQuestions || []).map((sq: any) => ({
      ...sq,
      id: crypto.randomUUID(),
      options: (sq.options || []).map((o: any) => ({ ...o, id: crypto.randomUUID() })),
    })));
    setMgtStep('FACTORY');
  };

  useEffect(() => {
    if (assessmentView === 'LIBRARY' && canContribute) {
      startTransition(() => { refreshAssessments(); });
    }
  }, [assessmentView, canContribute]);

  useEffect(() => {
    if (!canContribute) return;
    startTransition(() => setIsLoadingHub(true));
    getSubjectGradeCombos({ isSupervisor, teacherGrades: authUser?.grades, teacherSubjects: authUser?.subjects }).then(async (combos) => {
      const withCounts = await Promise.all(combos.map(async (c) => {
        const qs = await getVisibleQuestions({ teacherId: authUser?.teacherId, isSupervisor, subject: c.subject, grade: c.grade });
        return { ...c, count: qs.length };
      }));
      setHubCombos(withCounts);
      setIsLoadingHub(false);
    });
  }, [canContribute, isSupervisor, authUser?.teacherId]);

  const refreshQuestions = () => {
    if (!activeSubject) return;
    setIsLoadingQuestions(true);
    getVisibleQuestions({ teacherId: authUser?.teacherId, isSupervisor, subject: activeSubject.subject, grade: activeSubject.grade }).then((qs) => {
      setQuestions(qs);
      setIsLoadingQuestions(false);
    });
  };

  const [blueprintQuestions, setBlueprintQuestions] = useState<BankQuestion[]>([]);
  const [isGeneratingBlueprint, setIsGeneratingBlueprint] = useState(false);

  const handleGenerateBlueprint = async () => {
    if (!blueprintSubject || !blueprintGrade) return;
    setIsGeneratingBlueprint(true);
    const results = await generateBlueprintQuestions({
      subject: blueprintSubject,
      grade: blueprintGrade,
      totalQuestions: TotalQuestions,
      difficultyPercents: { 'سهل': diffEasy, 'متوسط': diffMed, 'صعب': diffHard },
      bloomPercents: {
        'تذكر': bloomRemember, 'فهم': bloomUnderstand, 'تطبيق': bloomApply,
        'تحليل': bloomAnalyze, 'تقييم': bloomEvaluate, 'ابتكار': bloomCreate,
      },
      types: selectedTypes,
    });
    setBlueprintQuestions(results);
    setIsGeneratingBlueprint(false);
    setAssessmentView('BLUEPRINT_REVIEW');
  };

  const [isPublishing, setIsPublishing] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [isLoadingAssessmentEdit, setIsLoadingAssessmentEdit] = useState(false);

  const handleOpenAssessmentForEdit = async (assessmentId: string) => {
    setIsLoadingAssessmentEdit(true);
    const [quiz, linkedQuestions] = await Promise.all([
      getQuizById(assessmentId),
      getQuestionsForQuiz(assessmentId),
    ]);
    setIsLoadingAssessmentEdit(false);
    if (!quiz) return;
    const source = assessmentsList.find((a) => a.id === assessmentId);
    setEditingAssessmentId(assessmentId);
    setBlueprintTitle(quiz.title);
    setBlueprintSubject(source?.subject || '');
    setBlueprintClassId(source?.classId || '');
    setBlueprintQuestions(linkedQuestions);
    const s = quiz.settings || {};
    if (s.availabilityMode) setAvailabilityMode(s.availabilityMode);
    if (typeof s.shuffleQuestions === 'boolean') setShuffleQuestions(s.shuffleQuestions);
    if (typeof s.shuffleAnswers === 'boolean') setShuffleAnswers(s.shuffleAnswers);
    if (typeof s.allowMultipleAttempts === 'boolean') setAllowMultipleAttempts(s.allowMultipleAttempts);
    if (typeof s.showOneQuestion === 'boolean') setShowOneQuestion(s.showOneQuestion);
    if (typeof s.preventBacktracking === 'boolean') setPreventBacktracking(s.preventBacktracking);
    if (typeof s.allowLateSubmission === 'boolean') setAllowLateSubmission(s.allowLateSubmission);
    if (typeof s.addToGradebook === 'boolean') setAddToGradebook(s.addToGradebook);
    if (s.gradebookCalculationMode) setGradebookCalculationMode(s.gradebookCalculationMode);
    if (typeof s.generateUniquePasswords === 'boolean') setGenerateUniquePasswords(s.generateUniquePasswords);
    if (typeof s.restrictBrowser === 'boolean') setRestrictBrowser(s.restrictBrowser);
    if (typeof s.timeLimitMinutes === 'number') setTimeLimitMinutes(s.timeLimitMinutes);
    if (typeof s.retryWaitHours === 'number') setRetryWaitHours(s.retryWaitHours);
    if (typeof s.gradebookMaxValue === 'number') setGradebookMaxValue(s.gradebookMaxValue);
    if (s.expiryBehavior) setExpiryBehavior(s.expiryBehavior);
    if (s.multiAttemptGradeMethod) setMultiAttemptGradeMethod(s.multiAttemptGradeMethod);
    if (quiz.releaseAt) {
      const d = new Date(quiz.releaseAt);
      setReleaseDate(d.toISOString().slice(0, 10));
      setReleaseTime(d.toTimeString().slice(0, 5));
    } else {
      setReleaseDate('');
    }
    if (quiz.dueDate) {
      const d = new Date(quiz.dueDate);
      setDueDateValue(d.toISOString().slice(0, 10));
      setDueTimeValue(d.toTimeString().slice(0, 5));
    } else {
      setDueDateValue('');
    }
    setAssessmentView('SETTINGS');
  };

  const [timeLimitMinutes, setTimeLimitMinutes] = useState(45);
  const [retryWaitHours, setRetryWaitHours] = useState(24);
  const [gradebookMaxValue, setGradebookMaxValue] = useState(20);
  const [publishError, setPublishError] = useState('');

  const handlePublishBlueprint = async (status: 'Active' | 'Draft') => {
    if (!blueprintClassId) {
      setPublishError(language === 'ar' ? 'لازم تختار الفصل المستهدف الأول (من فورم المعايير)' : 'You need to pick a target class first (in the criteria form)');
      return;
    }
    if (blueprintQuestions.length === 0) {
      setPublishError(language === 'ar' ? 'مفيش أسئلة مختارة للتقييم ده' : 'No questions selected for this assessment');
      return;
    }
    if (!authUser?.teacherId) {
      setPublishError(language === 'ar' ? 'نشر التقييمات محتاج حساب معلم مرتبط بفصل — حساب المشرف مينفعش ينشر تقييم مباشرة، لازم معلم الفصل هو اللي ينشره' : 'Publishing assessments needs a teacher account linked to a class — a supervisor account cannot publish directly; the class teacher needs to publish it');
      return;
    }
    setIsPublishing(true);
    setPublishError('');
    const pointsPerQuestion = blueprintQuestions.length > 0 ? (gradebookMaxValue / blueprintQuestions.length) : 1;
    const quizQuestions = blueprintQuestions.map((q) => ({ ...convertBankQuestionToQuizQuestion(q, pointsPerQuestion), sectionId: 'default' }));
    const settingsBlob = {
      availabilityMode,
      shuffleQuestions,
      shuffleAnswers,
      allowMultipleAttempts,
      showOneQuestion,
      preventBacktracking,
      allowLateSubmission,
      addToGradebook,
      gradebookCalculationMode,
      generateUniquePasswords,
      restrictBrowser,
      timeLimitMinutes,
      retryWaitHours,
      gradebookMaxValue,
      expiryBehavior,
      multiAttemptGradeMethod,
    };
    const assignedClasses = targetingType === 'CLASSES' && selectedItems.length > 0 ? selectedItems : [blueprintClassId];
    const computedReleaseAt = availabilityMode === 'TIMEFRAME' && releaseDate ? new Date(`${releaseDate}T${releaseTime || '00:00'}`).toISOString() : null;
    const computedDueDate = availabilityMode === 'TIMEFRAME' && dueDateValue ? new Date(`${dueDateValue}T${dueTimeValue || '23:59'}`).toISOString() : null;
    // نشر فعلي (Active) من معلم عادي محتاج اعتماد مشرف بنك الأسئلة؛ المسودة والمشرف نفسه معتمدين على طول
    const computedApprovalStatus: 'pending' | 'approved' = (status === 'Active' && !isSupervisor) ? 'pending' : 'approved';

    if (editingAssessmentId) {
      const { ok, error } = await updateQuiz(editingAssessmentId, {
        title: blueprintTitle || 'تقييم من بنك الأسئلة',
        status,
        approvalStatus: computedApprovalStatus,
        dueDate: computedDueDate,
        releaseAt: computedReleaseAt,
        questions: quizQuestions,
        sections: [{ id: 'default', title: 'القسم الأول' }],
        settings: settingsBlob,
        assignedClasses,
      });
      setIsPublishing(false);
      if (!ok) {
        setPublishError(error || (language === 'ar' ? 'حصل خطأ أثناء تعديل التقييم' : 'An error occurred while updating the assessment'));
        return;
      }
      // نمسح الروابط القديمة ونعمل روابط جديدة تطابق الأسئلة الحالية بالظبط
      await unlinkAllQuestionsFromQuiz(editingAssessmentId);
      await linkQuestionsToQuiz(editingAssessmentId, blueprintQuestions.map((q) => q.id));
      setEditingAssessmentId(null);
      setAssessmentView('LIBRARY');
      return;
    }

    const { id: quizId, error } = await createQuiz(
      { teacherId: authUser?.teacherId || '', classId: blueprintClassId, subject: blueprintSubject },
      {
        title: blueprintTitle || 'تقييم من بنك الأسئلة',
        dueDate: computedDueDate,
        releaseAt: computedReleaseAt,
        status,
        approvalStatus: computedApprovalStatus,
        questions: quizQuestions,
        sections: [{ id: 'default', title: 'القسم الأول' }],
        settings: settingsBlob,
        assignedClasses,
      }
    );
    setIsPublishing(false);
    if (!quizId) {
      setPublishError(error || (language === 'ar' ? 'حصل خطأ أثناء إنشاء التقييم' : 'An error occurred while creating the assessment'));
      return;
    }
    await linkQuestionsToQuiz(quizId, blueprintQuestions.map((q) => q.id));
    setAssessmentView('LIBRARY');
  };

  const [manualSwapAlternatives, setManualSwapAlternatives] = useState<BankQuestion[]>([]);
  const [manualSwapSearch, setManualSwapSearch] = useState('');
  const [manualPoolQuestions, setManualPoolQuestions] = useState<BankQuestion[]>([]);
  const [isLoadingManualPool, setIsLoadingManualPool] = useState(false);

  useEffect(() => {
    if (assessmentView !== 'MANUAL_SELECTION' || !blueprintSubject || !blueprintGrade) return;
    startTransition(() => setIsLoadingManualPool(true));
    getVisibleQuestions({ subject: blueprintSubject, grade: blueprintGrade, isSupervisor: true }).then((qs) => {
      setManualPoolQuestions(qs.filter((q) => q.status === 'approved'));
      setIsLoadingManualPool(false);
    });
  }, [assessmentView, blueprintSubject, blueprintGrade]);

  useEffect(() => {
    if (!manualSwapModalQId) { startTransition(() => setManualSwapAlternatives([])); return; }
    const current = blueprintQuestions.find((q) => q.id === manualSwapModalQId);
    if (!current) return;
    getVisibleQuestions({ subject: current.subject, grade: current.grade, isSupervisor: true }).then((pool) => {
      const usedIds = new Set(blueprintQuestions.map((q) => q.id));
      setManualSwapAlternatives(pool.filter((q) => q.status === 'approved' && !usedIds.has(q.id)));
    });
  }, [manualSwapModalQId]);

  useEffect(() => {
    refreshQuestions();
  }, [activeSubject?.subject, activeSubject?.grade]);

  useEffect(() => {
    if (!canContribute) return;
    if (isSupervisor) {
      getAllClassSections().then(setTeacherClasses);
    } else if (authUser?.teacherId) {
      getMyClassSections(authUser.teacherId).then(setTeacherClasses);
    }
  }, [canContribute, isSupervisor, authUser?.teacherId]);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <span className="text-sm text-slate-400">Loading...</span>
      </div>
    );
  }
  if (!isLoggedIn || !canContribute) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="text-center max-w-sm px-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-lg font-bold text-slate-800 mb-2">{language === 'ar' ? 'الوصول مقصور على المصرّح لهم' : 'Access restricted'}</h1>
          <p className="text-sm text-slate-500">{language === 'ar' ? 'بنك الأسئلة متاح بس لمشرف بنك الأسئلة أو معلم معاه صلاحية إضافة أسئلة. تواصل مع إدارة المدرسة لو محتاج صلاحية.' : 'The Question Bank is only available to Question Bank Supervisors or teachers granted contribution access. Contact your school admin if you need access.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <GlobalSidebar 
        isPinned={isSidebarPinned}
        setIsPinned={setIsSidebarPinned}
        language={language}
        onLanguageChange={setLanguage}
        userRole={authUser?.role as any}
        canUseQuestionBank={authUser?.canUseQuestionBank}
        onLogout={handleLogout}
        authUser={authUser}
      />
      
      <main className="flex-1 overflow-y-auto bg-gray-50/30">
        <div className="max-w-7xl mx-auto w-full p-8">
          {/* Main Module Header */}
          <header className="mb-8 flex flex-col gap-6 relative">
            <button 
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
               className={`absolute top-0 ${language === 'ar' ? 'left-0' : 'right-0'} flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit`}
              type="button"
            >
              <Globe size={14} />
              <span dir="ltr">{language === 'ar' ? 'English' : 'عربي'}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 flex items-center justify-center rounded-2xl">
                 <Database size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{language === 'ar' ? 'بنك الأسئلة' : 'Question Bank'}</h1>
                <p className="text-slate-500 font-medium">{language === 'ar' ? 'المركز الشامل لإدارة الأسئلة وتقييمات الطلاب' : 'The complete hub for managing questions and student assessments'}</p>
              </div>
            </div>

            {/* Main 2 Tabs */}
            <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/50 w-max">
              {isSupervisor && (
              <button
                onClick={() => { setActiveTab('DASHBOARD'); setMgtStep('HUB'); setActiveSubject(null); }}
                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all shadow-none flex items-center gap-2 ${
                  activeTab === 'DASHBOARD'
                    ? 'bg-white text-violet-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <LayoutTemplate size={18} />
                {language === 'ar' ? 'لوحة البيانات' : 'Dashboard'}
              </button>
              )}
              <button
                onClick={() => setActiveTab('MANAGEMENT')}
                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all shadow-none flex items-center gap-2 ${
                  activeTab === 'MANAGEMENT'
                    ? 'bg-white text-violet-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <Database size={18} />
                {language === 'ar' ? 'إدارة البنك' : 'Manage Bank'}
              </button>
              {isSupervisor && (
              <button
                onClick={() => { setActiveTab('ASSESSMENTS'); setAssessmentView('LIBRARY'); }}
                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all shadow-none flex items-center gap-2 ${
                  activeTab === 'ASSESSMENTS'
                    ? 'bg-white text-violet-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <ListChecks size={18} />
                {language === 'ar' ? 'التقييمات' : 'Assessments'}
              </button>
              )}
              {isSupervisor && (
              <button
                onClick={() => setActiveTab('APPROVAL_HUB')}
                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all shadow-none flex items-center gap-2 ${
                  activeTab === 'APPROVAL_HUB'
                    ? 'bg-white text-violet-700 shadow-sm border border-slate-200/50'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <ShieldCheck size={18} />
                {language === 'ar' ? 'الاعتمادات' : 'Approvals'}
              </button>
              )}
            </div>
          </header>

          {/* DASHBOARD TAB */}
          {activeTab === 'DASHBOARD' && (
            <div className="w-full">
              <AnalyticsDashboard language={language} />
            </div>
          )}

          {/* MANAGEMENT TAB */}
          {activeTab === 'MANAGEMENT' && (
            <div className="h-full">
              {mgtStep === 'HUB' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                  {/* Global Repository Classification Tabs */}
                  <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-100 shadow-none w-max mx-auto mb-6">
                    <button
                      onClick={() => setBankScope('central')}
                      className={`px-8 py-2.5 text-sm font-bold rounded-lg transition-all shadow-none ${
                        bankScope === 'central'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      {language === 'ar' ? 'بنوك مركزية (الوزارة)' : 'Central Banks (Ministry)'}
                    </button>
                    <button
                      onClick={() => setBankScope('shared')}
                      className={`px-8 py-2.5 text-sm font-bold rounded-lg transition-all shadow-none ${
                        bankScope === 'shared'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      {language === 'ar' ? 'بنوك مشتركة (المدرسة)' : 'Shared Banks (School)'}
                    </button>
                    <button
                      onClick={() => setBankScope('private')}
                      className={`px-8 py-2.5 text-sm font-bold rounded-lg transition-all shadow-none ${
                        bankScope === 'private'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      {language === 'ar' ? 'بنكي الخاص (المعلم)' : 'My Private Bank (Teacher)'}
                    </button>
                  </div>

                  {/* Subject Filters */}
                  <div className="flex gap-4 items-end bg-white p-4 rounded-2xl border border-slate-100 shadow-none">
                     <div className="flex items-center gap-2 text-slate-400 mr-2 ml-4 mb-3">
                        <Filter size={18} />
                        <span className="font-bold text-sm">{language === 'ar' ? 'تصفية المواد:' : 'Filter Subjects:'}</span>
                     </div>
                     <HubFilterDropdown 
                       label={language === 'ar' ? 'الصف الدراسي' : 'Grade'} 
                       value={hubGradeFilter} 
                       options={[language === 'ar' ? 'كل الصفوف' : 'All Grades', ...Array.from(new Set(hubCombos.map(c => c.grade)))]} 
                       onChange={setHubGradeFilter} 
                     />
                     <HubFilterDropdown 
                       label={language === 'ar' ? 'المادة' : 'Subject'} 
                       value={hubSubjectFilter} 
                       options={['كل المواد', ...Array.from(new Set(hubCombos.map(c => c.subject)))]} 
                       onChange={setHubSubjectFilter} 
                     />
                  </div>

                  {isLoadingHub ? (
                    <p className="text-center text-sm text-slate-400 py-16">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                  ) : hubCombos.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-16">{language === 'ar' ? 'لا توجد مواد متاحة حاليًا في المنهج' : 'No subjects are currently available in the curriculum'}</p>
                  ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {hubCombos.filter(c => (hubSubjectFilter === 'كل المواد' || c.subject === hubSubjectFilter) && (hubGradeFilter === 'كل الصفوف' || hubGradeFilter === 'All Grades' || c.grade === hubGradeFilter)).map(sub => {
                      return (
                        <div 
                          key={`${sub.subject}-${sub.grade}`} 
                          onClick={() => { setActiveSubject({ subject: sub.subject, grade: sub.grade }); setMgtStep('WORKSPACE'); }}
                          className="bg-white border border-slate-100 p-4 rounded-2xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:shadow-xl hover:border-violet-300"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1"></div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-violet-50 text-violet-600">
                              <Database size={18} />
                            </div>
                          </div>
                          <h3 className="font-bold text-slate-800 text-base mb-0.5 group-hover:text-slate-900">{sub.subject}</h3>
                          <p className="text-[11px] font-bold text-slate-400 mb-4">{sub.grade}</p>
                          <div className="border-t border-slate-50 pt-3 mt-auto">
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-xs font-semibold text-slate-700">{sub.count.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {language === 'ar' ? 'سؤال' : 'questions'}</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.min(100, sub.count * 2)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  )}
                </motion.div>
              )}

              {mgtStep === 'WORKSPACE' && activeSubject && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  {/* WORKSPACE Header */}
                  <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 shadow-none">
                    <div className="flex items-center gap-4">
                      <button onClick={() => { setMgtStep('HUB'); setActiveSubject(null); }} className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-none">
                        <ArrowRight size={20} />
                      </button>
                      <h2 className="text-2xl font-bold text-slate-800">{activeSubject.subject} <span className="text-slate-400 font-medium text-lg">• {activeSubject.grade}</span></h2>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <button className="px-6 py-2.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-bold rounded-xl flex items-center gap-2 transition-colors shadow-none text-sm">
                        <UploadCloud size={18} />
                        {language === 'ar' ? 'استيراد بنك أسئلة (QTI XML / Excel)' : 'Import Question Bank (QTI XML / Excel)'}
                      </button>
                      <button className="px-6 py-2.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-bold rounded-xl flex items-center gap-2 transition-colors shadow-none text-sm">
                        <DownloadCloud size={18} />
                        {language === 'ar' ? 'تصدير البنك الحالي (QTI XML)' : 'Export Current Bank (QTI XML)'}
                      </button>
                      <button onClick={() => setMgtStep('FACTORY')} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-none text-sm">
                        <Plus size={18} />
                        {language === 'ar' ? 'إضافة سؤال جديد' : 'Add New Question'}
                      </button>
                    </div>
                  </div>

                  {/* Advanced Filter Bar & Questions Table */}
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-none overflow-hidden flex flex-col">
                    
                    {/* Advanced Filter Bar */}
                    <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col gap-5">
                       <div className="relative w-full">
                         <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                           <Search size={18} />
                         </div>
                         <input 
                           type="text" 
                           placeholder={language === 'ar' ? 'البحث في الأسئلة...' : 'Search questions...'} 
                           value={mainSearchQuery}
                           onChange={(e) => setMainSearchQuery(e.target.value)}
                           className="h-12 pl-4 pr-12 rounded-xl w-full border border-slate-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 font-medium shadow-sm transition-all bg-white" 
                         />
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
                         <CustomSelect value={filterType} onChange={setFilterType} options={uniqueTypes} icon={ListChecks} label={language === 'ar' ? 'نوع السؤال' : 'Question Type'} />
                         <CustomSelect value={filterUnit} onChange={setFilterUnit} options={uniqueUnits} icon={BookOpen} label={language === 'ar' ? 'الوحدة' : 'Unit'} />
                         <CustomSelect value={filterLesson} onChange={setFilterLesson} options={uniqueLessons} icon={LayoutTemplate} label={language === 'ar' ? 'الدرس' : 'Lesson'} />
                         <CustomSelect value={filterBloom} onChange={setFilterBloom} options={uniqueBlooms} icon={BrainCircuit} label={language === 'ar' ? 'مستوى بلوم' : 'Bloom Level'} />
                         <CustomSelect value={filterDifficulty} onChange={setFilterDifficulty} options={uniqueDifficulties} icon={Filter} label={language === 'ar' ? 'الصعوبة' : 'Difficulty'} />
                       </div>
                    </div>

                    {/* Modern Data Table */}
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-5 font-bold text-slate-500 w-1/3 text-xs uppercase tracking-wider">{language === 'ar' ? 'نص السؤال' : 'Question Text'}</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider">{language === 'ar' ? 'نوع السؤال' : 'Type'}</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider">{language === 'ar' ? 'الوحدة' : 'Unit'}</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider">{language === 'ar' ? 'الدرس' : 'Lesson'}</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-center text-xs uppercase tracking-wider">{language === 'ar' ? 'مستوى بلوم' : 'Bloom Level'}</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-center text-xs uppercase tracking-wider">{language === 'ar' ? 'الصعوبة' : 'Difficulty'}</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-center text-xs uppercase tracking-wider">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/80">
                          {isLoadingQuestions ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                              </td>
                            </tr>
                          ) : filteredQuestions.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                {language === 'ar' ? 'لا توجد أسئلة تطابق معايير البحث الحالية.' : 'No questions match the current search criteria.'}
                              </td>
                            </tr>
                          ) : (
                            filteredQuestions.map(q => (
                              <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4 font-bold text-slate-800">
                                   <div className="max-w-[280px] truncate">{q.title}</div>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-600">
                                  <div className="flex items-center gap-2">
                                    {q.type === 'اختيار من متعدد' && <ListChecks size={14} className="text-violet-500" />}
                                    {q.type === 'صح أم خطأ' && <CheckCircle2 size={14} className="text-violet-500" />}
                                    {q.type === 'سؤال مقالي' && <AlignRight size={14} className="text-violet-500" />}
                                    {q.type === 'أكمل الفراغ' && <Type size={14} className="text-violet-500" />}
                                    <span className="text-xs">{q.type}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 font-medium text-slate-600 truncate max-w-[120px]">{q.unit}</td>
                                <td className="px-6 py-4 font-medium text-slate-500 truncate max-w-[120px]">{q.lesson || '-'}</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center justify-center px-3 py-1 bg-sky-50 text-sky-700 text-[11px] font-bold rounded-full border border-sky-100/50">
                                    {q.bloomLevel}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className={`inline-flex items-center justify-center px-3 py-1 text-[11px] font-bold rounded-full border
                                    ${q.difficulty === 'سهل' ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50' :
                                      q.difficulty === 'متوسط' ? 'bg-amber-50 text-amber-700 border-amber-100/50' : 'bg-red-50 text-red-700 border-red-100/50'}`}
                                  >
                                    {q.difficulty}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => setViewingQuestion(q)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors flex items-center justify-center" aria-label="معاينة">
                                      <Eye size={14} />
                                    </button>
                                    <button onClick={() => openEditQuestion(q)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors flex items-center justify-center" aria-label="تعديل">
                                      <Edit2 size={14} />
                                    </button>
                                    <button onClick={async () => { if (confirm(language === 'ar' ? 'تأكيد حذف السؤال؟' : 'Confirm deleting this question?')) { await deleteQuestion(q.id); refreshQuestions(); } }} className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors flex items-center justify-center" aria-label={language === 'ar' ? 'حذف' : 'Delete'}>
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Side Drawer for Vault */}
              <AnimatePresence>
                {mgtStep === 'FACTORY' && isVaultOpen && (
                  <>
                    <motion.div 
                       initial={{ opacity: 0 }} 
                       animate={{ opacity: 1 }} 
                       exit={{ opacity: 0 }} 
                       onClick={() => setIsVaultOpen(false)}
                       className="fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm"
                    />
                    <motion.div 
                       initial={{ x: '-100%' }}
                       animate={{ x: 0 }} 
                       exit={{ x: '-100%' }} 
                       transition={{ type: "spring", damping: 30, stiffness: 300 }}
                       className="fixed top-0 left-0 bottom-0 w-[500px] max-w-[80vw] bg-white border-r border-slate-100 z-50 shadow-2xl flex flex-col"
                    >
                       <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-between">
                         <div>
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Database size={18} className="text-violet-600" />
                            {language === 'ar' ? 'أسئلة الجلسة الحالية' : 'Current Session Questions'}
                          </h3>
                          <p className="text-xs font-medium text-slate-400 mt-2">{language === 'ar' ? `الأسئلة التي تمت إضافتها مؤخراً (${questions.length})` : `Recently added questions (${questions.length})`}</p>
                         </div>
                         <button onClick={() => setIsVaultOpen(false)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm transition-colors"><ArrowRight size={16} /></button>
                       </div>
                       
                       <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-3">
                         <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="text" 
                              placeholder={language === 'ar' ? 'ابحث في نص السؤال...' : 'Search question text...'} 
                              value={vaultSearch}
                              onChange={(e) => setVaultSearch(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 text-sm font-bold rounded-lg pl-9 pr-9 py-2 focus:outline-none focus:border-violet-400 focus:bg-white transition-colors"
                            />
                         </div>
                         <div className="flex flex-col gap-3">
                           {/* TYPE SELECT */}
                           <div className="relative">
                              <select 
                                value={vaultFilterType}
                                onChange={(e) => setVaultFilterType(e.target.value)}
                                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2.5 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all cursor-pointer"
                              >
                                {['الكل', 'اختيار من متعدد', 'صح أم خطأ', 'أكمل الفراغ', 'إجابة قصيرة', 'سؤال مقالي', 'توصيل', 'ترتيب'].map(type => (
                                  <option key={type} value={type}>{type === 'الكل' ? (language === 'ar' ? 'تصفية حسب النوع: الكل' : 'Filter by type: All') : type}</option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                           </div>

                           {/* DIFFICULTY CHIPS */}
                           <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/60 h-9 shrink-0 gap-1 overflow-x-auto custom-scrollbar">
                             {['الكل', 'سهل', 'متوسط', 'صعب'].map(level => {
                               let activeClass = 'bg-slate-800 text-white shadow-sm';
                               if (level === 'سهل') activeClass = 'bg-emerald-100 text-emerald-800 shadow-sm';
                               if (level === 'متوسط') activeClass = 'bg-amber-100 text-amber-800 shadow-sm';
                               if (level === 'صعب') activeClass = 'bg-red-100 text-red-800 shadow-sm';
                               
                               return (
                                 <button
                                   key={level}
                                   onClick={() => setVaultFilterDiff(level)}
                                   className={`flex-1 px-3 py-1 text-xs font-bold rounded-md transition-all whitespace-nowrap ${vaultFilterDiff === level ? activeClass : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                 >
                                   {level}
                                 </button>
                               );
                             })}
                           </div>
                         </div>
                       </div>

                       <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                         <AnimatePresence>
                           {filteredVaultQuestions.map((q) => (
                             <motion.div 
                               key={q.id} 
                               initial={{ opacity: 0, scale: 0.95 }} 
                               animate={{ opacity: 1, scale: 1 }}
                               exit={{ opacity: 0, scale: 0.95 }}
                               className="bg-white p-4 rounded-2xl border border-slate-100 hover:border-violet-100 group transition-all relative overflow-hidden"
                             >
                               <div className="absolute left-3 top-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button onClick={(e) => { e.stopPropagation(); openEditQuestion(q); }} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-violet-600 hover:bg-violet-50 flex items-center justify-center transition-colors shadow-none"><Edit2 size={14} /></button>
                                 <button onClick={async (e) => { e.stopPropagation(); if (confirm(language === 'ar' ? 'تأكيد حذف السؤال؟' : 'Confirm deleting this question?')) { await deleteQuestion(q.id); refreshQuestions(); } }} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shadow-none"><Trash2 size={14} /></button>
                               </div>
                               <div className="flex items-center gap-2 mb-3">
                                 <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                                   {q.type}
                                 </span>
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                   q.difficulty === 'سهل' ? 'bg-emerald-50 text-emerald-600' :
                                   q.difficulty === 'متوسط' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                 }`}>
                                   {q.difficulty}
                                 </span>
                               </div>
                               <p className="text-sm font-bold text-slate-700 line-clamp-2 leading-relaxed pl-12">
                                 {q.title}
                               </p>
                             </motion.div>
                           ))}
                         </AnimatePresence>
                         {filteredVaultQuestions.length === 0 && (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 pb-10 mt-10">
                              <LayoutTemplate size={32} className="opacity-20" />
                              <p className="text-sm font-medium">{language === 'ar' ? 'لم يتم العثور على أي أسئلة' : 'No questions found'}</p>
                           </div>
                         )}
                       </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {mgtStep === 'FACTORY' && activeSubject && (
                <>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1280px] mx-auto min-h-[700px] mb-24 relative pt-6 space-y-6">
                    {/* Header & Back */}
                    <div className="flex items-center justify-between">
                       <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                          {language === 'ar' ? 'بنوك الأسئلة' : 'Question Banks'} <span className="text-slate-300">/</span> {activeSubject.subject} <span className="text-slate-300">/</span> <span className="text-slate-800">{language === 'ar' ? 'إنشاء سؤال جديد' : 'Create New Question'}</span>
                       </h2>
                       <div className="flex items-center gap-3">
                         <button 
                           onClick={() => setIsVaultOpen(true)}
                           className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-lg hover:bg-violet-700 transition-all shadow-sm group"
                         >
                           <Layers size={16} className="text-violet-200 group-hover:text-white transition-colors" />
                           {language === 'ar' ? 'سجل الأسئلة المضافة' : 'Added Questions Log'}
                           <span className="bg-white text-violet-700 text-[10px] font-black min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full ml-1 border border-transparent">
                             {questions.length}
                           </span>
                         </button>
                         <button onClick={() => setMgtStep('WORKSPACE')} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"><ArrowRight size={16} /></button>
                       </div>
                    </div>

                    {/* STUDIO WORKSPACE */}
                    <div className="flex relative w-full min-h-[75vh] gap-6 items-start" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                       
                       {/* 1. THE RIGHT-SIDE TYPE MENU (Question Types) */}
                       <div className="w-[280px] shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden sticky top-6">
                           <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                               <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                  <LayoutGrid size={16} className="text-violet-600" /> {language === 'ar' ? 'أنواع الأسئلة' : 'Question Types'}
                               </h3>
                           </div>
                           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 pb-20">
                               {[
                                  { label: 'اختيار من متعدد', icon: ListChecks },
                                  { label: 'صح أم خطأ', icon: CheckCircle2 },
                                  { label: 'إجابة قصيرة', icon: AlignRight },
                                  { label: 'أكمل الفراغ', icon: Type },
                                  { label: 'سؤال مقالي', icon: FileText },
                                  { label: 'إجابة رقمية', icon: Calculator },
                                  { label: 'توصيل', icon: GitMerge },
                                  { label: 'ترتيب', icon: ListOrdered },
                                  { label: 'تصنيف', icon: Layers },
                                  { label: 'سحب وإفلات', icon: Move },
                                  { label: 'منطقة تفاعلية', icon: Map },
                                  { label: 'مقطع صوتي', icon: Mic },
                                  { label: 'قطعة', icon: BookOpen }
                               ].map((type) => {
                                  const Icon = type.icon;
                                  const isActive = newQType === type.label;
                                  return (
                                     <button
                                        key={type.label}
                                        onClick={() => setNewQType(type.label)}
                                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-xl transition-all text-right shadow-sm ${
                                           isActive
                                              ? 'bg-slate-50 text-violet-700 border border-violet-500/20 ring-4 ring-violet-50/50'
                                              : 'bg-transparent text-slate-600 border border-transparent hover:bg-slate-50 hover:border-slate-200'
                                        }`}
                                     >
                                        <Icon size={18} className={isActive ? 'text-violet-600' : 'text-slate-400'} />
                                        {typeLabel(type.label)}
                                     </button>
                                  )
                               })}
                           </div>
                       </div>

                       {/* CENTRAL MAIN AREA (Context + Card) */}
                       <div className="flex-1 flex flex-col relative space-y-4">
                         
                         {/* 1. Target Bank Selector */}
                         <div className="flex flex-col gap-2 mb-2">
                           <label className="text-xs font-bold text-slate-500 px-1">{language === 'ar' ? 'مستودع حفظ السؤال:' : 'Question Storage:'}</label>
                           <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-none h-12 items-center gap-1 w-full md:w-max">
                             {['بنك مركزي (الوزارة)', 'بنك مشترك (المدرسة)', 'بنكي الخاص (المعلم)'].map(bank => (
                               <button
                                 key={bank}
                                 onClick={() => setTargetBank(bank)}
                                 className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-none h-full ${targetBank === bank ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                               >
                                 {language === 'ar' ? bank : (bank === 'بنك مركزي (الوزارة)' ? 'Central Bank (Ministry)' : bank === 'بنك مشترك (المدرسة)' ? 'Shared Bank (School)' : 'My Private Bank (Teacher)')}
                               </button>
                             ))}
                           </div>
                         </div>

                         {/* 2. THE GLOBAL CONTEXT ROW */}
                         <div className="grid grid-cols-1 md:grid-cols-5 gap-4 shrink-0 transition-all z-20">
                             <div>
                               <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2 px-1"><BookOpen size={12} />{language === 'ar' ? 'الوحدة' : 'Unit'}</label>
                               <input list="unit-suggestions" type="text" value={newQUnit} onChange={(e) => setNewQUnit(e.target.value)} placeholder={language === 'ar' ? 'اكتب اسم الوحدة' : 'Type the unit name'} className="w-full h-[42px] px-3.5 rounded-xl border text-xs font-bold transition-all bg-slate-50 border-slate-100 text-slate-700 focus:outline-none focus:border-violet-300 shadow-none" />
                               <datalist id="unit-suggestions">
                                 {Array.from(new Set(questions.map((q) => q.unit))).map((u) => <option key={u} value={u} />)}
                               </datalist>
                             </div>
                             <div>
                               <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2 px-1"><FileText size={12} />{language === 'ar' ? 'الدرس' : 'Lesson'}</label>
                               <input list="lesson-suggestions" type="text" value={newQLesson} onChange={(e) => setNewQLesson(e.target.value)} placeholder={language === 'ar' ? 'اكتب اسم الدرس (اختياري)' : 'Type the lesson name (optional)'} className="w-full h-[42px] px-3.5 rounded-xl border text-xs font-bold transition-all bg-slate-50 border-slate-100 text-slate-700 focus:outline-none focus:border-violet-300 shadow-none" />
                               <datalist id="lesson-suggestions">
                                 {Array.from(new Set(questions.map((q) => q.lesson).filter(Boolean))).map((l) => <option key={l as string} value={l as string} />)}
                               </datalist>
                             </div>
                             <FormSelect label={language === 'ar' ? 'مستوى بلوم' : 'Bloom Level'} value={newQBloom} onChange={setNewQBloom} options={['تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'ابتكار']} icon={BrainCircuit} />
                             <div>
                               <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2 px-1"><Flag size={12} />{language === 'ar' ? 'معيار المنهج / الهدف' : 'Curriculum Standard / Objective'}</label>
                               <input type="text" value={qStandard} onChange={(e) => setQStandard(e.target.value)} placeholder={language === 'ar' ? 'اكتب المعيار أو الهدف (اختياري)' : 'Type the standard or objective (optional)'} className="w-full h-[42px] px-3.5 rounded-xl border text-xs font-bold transition-all bg-slate-50 border-slate-100 text-slate-700 focus:outline-none focus:border-violet-300 shadow-none" />
                             </div>
                             <div>
                               <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2 px-1">
                                 <Clock size={12} />
                                 {language === 'ar' ? 'زمن الحل (دقائق)' : 'Time to Solve (minutes)'}
                               </label>
                               <input type="number" min="1" value={qTime} onChange={e => setQTime(e.target.value)} className="w-full h-[42px] px-3.5 rounded-xl border text-xs font-bold transition-all bg-slate-50 border-slate-100 text-slate-700 focus:outline-none focus:border-violet-300 shadow-none" placeholder={language === 'ar' ? 'مثال: 5' : 'e.g. 5'} />
                             </div>
                         </div>

                         {/* 3. THE MAIN QUESTION CARD */}
                         <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col relative overflow-hidden">
                             
                             {/* Card Header (Inline Metadata) */}
                             <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white shrink-0">
                                <div className="flex items-center gap-4">
                                   <div className="flex items-center gap-2">
                                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                        <Signal size={14} /> {language === 'ar' ? 'الصعوبة:' : 'Difficulty:'}
                                      </label>
                                      <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/60 h-8 items-center gap-1">
                                        {['سهل', 'متوسط', 'صعب'].map(level => (
                                           <button
                                             key={level}
                                             onClick={() => setNewQDiff(level)}
                                             className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all shadow-none h-full ${newQDiff === level ? 'bg-white text-violet-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                           >
                                             {language === 'ar' ? level : (level === 'سهل' ? 'Easy' : level === 'متوسط' ? 'Medium' : 'Hard')}
                                           </button>
                                        ))}
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                  <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:text-violet-600 transition-colors" aria-label={language === 'ar' ? 'نسخ' : 'Copy'}><Copy size={16} /></button>
                                  <button onClick={() => { setNewQTitle(''); setNewQOptions([
                                    { id: '1', text: '', isCorrect: true, imageUrl: null },
                                    { id: '2', text: '', isCorrect: false, imageUrl: null },
                                    { id: '3', text: '', isCorrect: false, imageUrl: null },
                                    { id: '4', text: '', isCorrect: false, imageUrl: null }
                                  ]); setNewQCorrectOption(0); }} className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:text-red-600 hover:border-red-200 transition-colors" aria-label={language === 'ar' ? 'مسح المسودة' : 'Clear draft'}><Trash2 size={16} /></button>
                                </div>
                             </div>

                         {/* 3. THE QUESTION CANVAS */}
                         <div className="p-8 flex-1 bg-slate-50/30">
                            <div className="flex justify-between items-center mb-6">
                               <div className="text-violet-600 font-extrabold text-[10px] tracking-widest uppercase bg-violet-50 px-3 py-1 rounded-full border border-violet-100/50">
                                  {language === 'ar' ? 'السؤال 1' : 'Question 1'} • {newQType}
                               </div>
                           </div>

                           {/* Question Title */}
                           <div className="mb-10 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-none focus-within:border-violet-300 transition-colors">
                              {/* WYSIWYG Toolbar */}
                              <div className="flex items-center gap-2 p-2 px-3 border-b border-gray-100 bg-slate-50">
                                <button className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title={language === 'ar' ? 'تسجيل صوتي' : 'Audio recording'}>
                                  <Mic size={16} />
                                </button>
                                <button className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title={language === 'ar' ? 'معادلات' : 'Equations'}>
                                  <Sigma size={16} />
                                </button>
                              </div>
                              <textarea 
                                value={newQTitle}
                                onChange={e => setNewQTitle(e.target.value)}
                                placeholder={language === 'ar' ? 'اكتب نص السؤال هنا...' : 'Write the question text here...'}
                                className="w-full p-4 text-xl font-bold text-slate-800 bg-transparent resize-y outline-none placeholder:text-slate-300 min-h-[140px]"
                                rows={5}
                              />
                           </div>

                           {/* Question Image — متاحة لكل أنواع الأسئلة */}
                           <div className="mb-6">
                             {!newQQuestionImageUrl ? (
                               <label className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-slate-400 hover:bg-slate-50 hover:border-violet-300 cursor-pointer transition-colors">
                                 <ImagePlus size={18} />
                                 <span className="text-xs font-bold">{isUploadingQuestionImage ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (language === 'ar' ? 'إضافة صورة للسؤال (اختياري)' : 'Add an image to the question (optional)')}</span>
                                 <input
                                   type="file"
                                   accept="image/*"
                                   className="hidden"
                                   onChange={async (e) => {
                                     const file = e.target.files?.[0];
                                     if (!file) return;
                                     setIsUploadingQuestionImage(true);
                                     const result = await uploadQuestionImage(file);
                                     setIsUploadingQuestionImage(false);
                                     if (result) setNewQQuestionImageUrl(result.url);
                                   }}
                                 />
                               </label>
                             ) : (
                               <div className="relative inline-block">
                                 <img src={newQQuestionImageUrl} alt="" className="max-h-56 rounded-2xl border border-slate-200" />
                                 <button
                                   onClick={() => setNewQQuestionImageUrl('')}
                                   className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-red-600 flex items-center justify-center"
                                 >
                                   <X size={14} />
                                 </button>
                               </div>
                             )}
                           </div>

                           {/* Audio Prompt (for Audio Clip questions) */}
                           {newQType === 'مقطع صوتي' && (
                             <div className="mb-6">
                               {!newQAudioUrl ? (
                                 <label className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center gap-2 text-slate-400 hover:bg-slate-50 cursor-pointer transition-colors">
                                   <Mic size={24} />
                                   <span className="text-sm font-bold">{isUploadingQAudio ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (language === 'ar' ? 'ارفع المقطع الصوتي' : 'Upload audio clip')}</span>
                                   <input 
                                     type="file" 
                                     accept="audio/*" 
                                     className="hidden" 
                                     onChange={async (e) => {
                                       const file = e.target.files?.[0];
                                       if (!file) return;
                                       setIsUploadingQAudio(true);
                                       const result = await uploadQuestionAudio(file);
                                       setIsUploadingQAudio(false);
                                       if (result) setNewQAudioUrl(result.url);
                                     }} 
                                   />
                                 </label>
                               ) : (
                                 <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                                   <audio src={newQAudioUrl} controls className="flex-1" />
                                   <button onClick={() => setNewQAudioUrl('')} className="text-xs font-bold text-red-500 hover:text-red-600 shrink-0">
                                     {language === 'ar' ? 'إزالة' : 'Remove'}
                                   </button>
                                 </div>
                               )}
                               <p className="text-xs font-semibold text-slate-400 px-1 mt-2">{language === 'ar' ? 'الطالب هيسمع المقطع ده ويختار الإجابة الصحيحة من الاختيارات تحت.' : 'The student will listen to this clip and pick the correct answer from the options below.'}</p>
                             </div>
                           )}

                           {/* Options / Inputs based on Type */}
                           <AnimatePresence mode="wait">
                              {(newQType === 'اختيار من متعدد' || newQType === 'مقطع صوتي') && (
                                 <motion.div key="mcq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 mb-4">
                                    {newQOptions.map((opt, idx) => {
                                      const isSelected = opt.isCorrect;
                                      const arabicLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
                                      const englishLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
                                      const letters = language === 'ar' ? arabicLetters : englishLetters;
                                      return (
                                        <div key={opt.id} className={`flex items-center gap-4 p-3.5 pr-4 rounded-2xl border transition-all ${
                                          isSelected ? 'border-emerald-500 bg-emerald-50/10 shadow-[0_4px_12px_rgba(16,185,129,0.05)]' : 'border-slate-200 bg-white'
                                        }`}>
                                          <button 
                                            onClick={() => {
                                              const newOpts = newQOptions.map(o => ({ ...o, isCorrect: o.id === opt.id }));
                                              setNewQOptions(newOpts);
                                            }}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                              isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                          >
                                             {letters[idx] || (idx + 1)}
                                          </button>
                                          <input 
                                             type="text" 
                                             value={opt.text}
                                             onChange={(e) => {
                                               const newOpts = [...newQOptions];
                                               newOpts[idx].text = e.target.value;
                                               setNewQOptions(newOpts);
                                             }}
                                             placeholder={language === 'ar' ? `الخيار ${idx + 1}` : `Option ${idx + 1}`}
                                             className="flex-1 w-full bg-transparent text-slate-800 text-sm font-bold focus:outline-none placeholder:font-normal placeholder:text-slate-400"
                                          />
                                          
                                          {opt.imageUrl && (
                                            <div className="relative shrink-0 flex items-center justify-center mr-2">
                                               <img src={opt.imageUrl} alt="preview" className="h-8 w-8 object-cover rounded-md border border-slate-200" />
                                               <button
                                                  onClick={(e) => {
                                                     e.stopPropagation();
                                                     const newOpts = [...newQOptions];
                                                     newOpts[idx].imageUrl = null;
                                                     setNewQOptions(newOpts);
                                                  }}
                                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                                               >
                                                  <X size={10} strokeWidth={3} />
                                               </button>
                                            </div>
                                          )}

                                          <label
                                            className={`cursor-pointer shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${opt.imageUrl ? 'text-violet-600 bg-violet-50' : 'text-slate-400 hover:text-violet-600 hover:bg-slate-50'}`}
                                            title={language === 'ar' ? 'إضافة صورة' : 'Add image'}
                                          >
                                            <input 
                                               type="file" 
                                               accept="image/*" 
                                               className="hidden" 
                                               onChange={async (e) => {
                                                  const file = e.target.files?.[0];
                                                  e.target.value = '';
                                                  if (!file) return;
                                                  const result = await uploadQuestionImage(file);
                                                  if (result) {
                                                     const newOpts = [...newQOptions];
                                                     newOpts[idx].imageUrl = result.url;
                                                     setNewQOptions(newOpts);
                                                  }
                                               }} 
                                            />
                                            <ImagePlus size={16} />
                                          </label>
                                          {isSelected ? (
                                            <div className="shrink-0 text-emerald-500 pl-2">
                                               <CheckCircle2 size={20} strokeWidth={2.5} />
                                            </div>
                                          ) : (
                                            newQOptions.length > 2 && (
                                               <button 
                                                 onClick={() => {
                                                   setNewQOptions(newQOptions.filter(o => o.id !== opt.id));
                                                 }}
                                                 className="shrink-0 text-slate-300 hover:text-red-500 transition-colors pl-2"
                                               >
                                                 <Trash2 size={16} />
                                               </button>
                                            )
                                          )}
                                        </div>
                                      );
                                    })}
                                 </motion.div>
                              )}

                              {newQType === 'صح أم خطأ' && (
                                <motion.div key="tf" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 mb-4">
                                   {[0, 1].map(idx => {
                                      const isSelected = newQCorrectOption === idx;
                                      const labels = language === 'ar' ? ['صح', 'خطأ'] : ['True', 'False'];
                                      return (
                                        <div key={idx} className={`flex items-center gap-4 p-3.5 pr-4 rounded-2xl border transition-all ${
                                          isSelected ? 'border-emerald-500 bg-emerald-50/10 shadow-[0_4px_12px_rgba(16,185,129,0.05)]' : 'border-slate-200 bg-white'
                                        }`}>
                                          <button 
                                            onClick={() => setNewQCorrectOption(idx)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                              isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                          >
                                             {idx === 0 ? 'T' : 'F'}
                                          </button>
                                          <div className="flex-1 text-slate-800 text-sm font-bold cursor-pointer" onClick={() => setNewQCorrectOption(idx)}>
                                            {labels[idx]}
                                          </div>
                                          {isSelected && (
                                            <div className="shrink-0 text-emerald-500 pl-2">
                                               <CheckCircle2 size={20} strokeWidth={2.5} />
                                            </div>
                                          )}
                                        </div>
                                      );
                                   })}
                                </motion.div>
                              )}

                              {newQType === 'سؤال مقالي' && (
                                 <motion.div key="essay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 mb-4">
                                    <textarea 
                                      value={newQEssayModelAnswer}
                                      onChange={(e) => setNewQEssayModelAnswer(e.target.value)}
                                      placeholder={language === 'ar' ? 'نموذج الإجابة أو دليل التصحيح...' : 'Model answer or grading guide...'}
                                      className="w-full h-32 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl p-4 font-bold text-sm focus:outline-none focus:border-violet-400 resize-none transition-colors placeholder:font-normal placeholder:text-slate-400"
                                    />
                                 </motion.div>
                              )}

                              {newQType === 'أكمل الفراغ' && (
                                 <motion.div key="fill" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 mb-4">
                                    <div className="p-1 border border-slate-200 rounded-2xl bg-white focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all flex items-center pr-2">
                                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                        <Type size={14} />
                                      </div>
                                      <input 
                                        type="text" 
                                        value={newQFillBlankAnswer}
                                        onChange={(e) => setNewQFillBlankAnswer(e.target.value)}
                                        placeholder={language === 'ar' ? 'الكلمة المفقودة (الإجابة الصحيحة)...' : 'The missing word (correct answer)...'}
                                        className="w-full bg-transparent text-slate-800 text-sm font-bold px-4 py-3 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
                                      />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-400 px-2 mt-2">{language === 'ar' ? <>ملاحظة: استخدم الرمز <span className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">___</span> في نص السؤال للإشارة إلى الفراغ.</> : <>Note: use the <span className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">___</span> symbol in the question text to mark the blank.</>}</p>
                                 </motion.div>
                              )}
                              {newQType === 'إجابة رقمية' && (
                                 <motion.div key="numeric" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 mb-4">
                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <label className="text-xs font-bold text-slate-500 px-1 block mb-1.5">{language === 'ar' ? 'الإجابة الصحيحة' : 'Correct Answer'}</label>
                                        <input 
                                          type="number" 
                                          value={newQNumericAnswer} 
                                          onChange={(e) => setNewQNumericAnswer(e.target.value)} 
                                          placeholder={language === 'ar' ? 'مثال: 42' : 'e.g. 42'}
                                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold text-slate-500 px-1 block mb-1.5">{language === 'ar' ? 'هامش الخطأ المسموح (±)' : 'Allowed Tolerance (±)'}</label>
                                        <input 
                                          type="number" 
                                          min="0"
                                          value={newQNumericTolerance} 
                                          onChange={(e) => setNewQNumericTolerance(e.target.value)} 
                                          placeholder="0"
                                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold text-slate-500 px-1 block mb-1.5">{language === 'ar' ? 'الوحدة (اختياري)' : 'Unit (optional)'}</label>
                                        <input 
                                          type="text" 
                                          value={newQNumericUnit} 
                                          onChange={(e) => setNewQNumericUnit(e.target.value)} 
                                          placeholder={language === 'ar' ? 'مثال: سم' : 'e.g. cm'}
                                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
                                        />
                                      </div>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-400 px-2">{language === 'ar' ? 'هيتصحّح تلقائيًا: أي إجابة جوه هامش الخطأ ده هتتحسب صح.' : 'Auto-graded: any answer within the tolerance range counts as correct.'}</p>
                                 </motion.div>
                              )}
                              {newQType === 'توصيل' && (
                                 <motion.div key="matching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 mb-4">
                                    <div className="grid grid-cols-2 gap-3 px-1">
                                      <label className="text-xs font-bold text-slate-500">{language === 'ar' ? 'العمود الأول' : 'Left Column'}</label>
                                      <label className="text-xs font-bold text-slate-500">{language === 'ar' ? 'العمود المطابق' : 'Matching Column'}</label>
                                    </div>
                                    {newQPairs.map((pair, idx) => (
                                      <div key={pair.id} className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center">
                                        <input 
                                          type="text" 
                                          value={pair.left} 
                                          onChange={(e) => setNewQPairs(prev => prev.map(p => p.id === pair.id ? { ...p, left: e.target.value } : p))} 
                                          placeholder={language === 'ar' ? `عنصر ${idx + 1}` : `Item ${idx + 1}`}
                                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
                                        />
                                        <input 
                                          type="text" 
                                          value={pair.right} 
                                          onChange={(e) => setNewQPairs(prev => prev.map(p => p.id === pair.id ? { ...p, right: e.target.value } : p))} 
                                          placeholder={language === 'ar' ? `المطابق لعنصر ${idx + 1}` : `Match for item ${idx + 1}`}
                                          className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
                                        />
                                        <button 
                                          onClick={() => setNewQPairs(prev => prev.filter(p => p.id !== pair.id))}
                                          disabled={newQPairs.length <= 2}
                                          className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors disabled:opacity-30"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    ))}
                                    <button 
                                      onClick={() => setNewQPairs(prev => [...prev, { id: Date.now().toString(), left: '', right: '' }])}
                                      disabled={newQPairs.length >= 8}
                                      className="flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 px-1"
                                    >
                                      <Plus size={16} /> {language === 'ar' ? 'إضافة زوج' : 'Add Pair'}
                                    </button>
                                 </motion.div>
                              )}
                              {newQType === 'ترتيب' && (
                                 <motion.div key="ordering" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 mb-4">
                                    <p className="text-xs font-semibold text-slate-400 px-1">{language === 'ar' ? 'اكتب العناصر بالترتيب الصحيح من الأول للآخر' : 'Write the items in the correct order, first to last'}</p>
                                    {newQOrderItems.map((item, idx) => (
                                      <div key={item.id} className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-violet-50 text-violet-700 border border-violet-200 flex items-center justify-center text-sm font-bold shrink-0">{idx + 1}</span>
                                        <input 
                                          type="text" 
                                          value={item.text} 
                                          onChange={(e) => setNewQOrderItems(prev => prev.map(it => it.id === item.id ? { ...it, text: e.target.value } : it))} 
                                          placeholder={language === 'ar' ? `الخطوة ${idx + 1}` : `Step ${idx + 1}`}
                                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
                                        />
                                        <button 
                                          onClick={() => { if (idx > 0) setNewQOrderItems(prev => { const next = [...prev]; [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]; return next; }); }}
                                          disabled={idx === 0}
                                          className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 flex items-center justify-center transition-colors disabled:opacity-30"
                                        >
                                          <ChevronUp size={14} />
                                        </button>
                                        <button 
                                          onClick={() => { if (idx < newQOrderItems.length - 1) setNewQOrderItems(prev => { const next = [...prev]; [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]; return next; }); }}
                                          disabled={idx === newQOrderItems.length - 1}
                                          className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 flex items-center justify-center transition-colors disabled:opacity-30"
                                        >
                                          <ChevronDown size={14} />
                                        </button>
                                        <button 
                                          onClick={() => setNewQOrderItems(prev => prev.filter(it => it.id !== item.id))}
                                          disabled={newQOrderItems.length <= 3}
                                          className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors disabled:opacity-30"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    ))}
                                    <button 
                                      onClick={() => setNewQOrderItems(prev => [...prev, { id: Date.now().toString(), text: '' }])}
                                      disabled={newQOrderItems.length >= 8}
                                      className="flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 px-1"
                                    >
                                      <Plus size={16} /> {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
                                    </button>
                                 </motion.div>
                              )}
                              {newQType === 'تصنيف' && (
                                 <motion.div key="classify" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 mb-4">
                                    <div>
                                      <label className="text-xs font-bold text-slate-500 px-1 block mb-2">{language === 'ar' ? 'الفئات' : 'Categories'}</label>
                                      <div className="space-y-2">
                                        {newQCategories.map((cat, idx) => (
                                          <div key={cat.id} className="flex items-center gap-3">
                                            <input 
                                              type="text" 
                                              value={cat.name} 
                                              onChange={(e) => setNewQCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c))} 
                                              placeholder={language === 'ar' ? `الفئة ${idx + 1}` : `Category ${idx + 1}`}
                                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
                                            />
                                            <button 
                                              onClick={() => {
                                                setNewQCategories(prev => prev.filter(c => c.id !== cat.id));
                                                setNewQClassifyItems(prev => prev.map(it => it.categoryId === cat.id ? { ...it, categoryId: newQCategories[0]?.id === cat.id ? (newQCategories[1]?.id || '') : newQCategories[0]?.id || '' } : it));
                                              }}
                                              disabled={newQCategories.length <= 2}
                                              className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors disabled:opacity-30"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        ))}
                                        <button 
                                          onClick={() => setNewQCategories(prev => [...prev, { id: `c${Date.now()}`, name: '' }])}
                                          disabled={newQCategories.length >= 5}
                                          className="flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 px-1"
                                        >
                                          <Plus size={16} /> {language === 'ar' ? 'إضافة فئة' : 'Add Category'}
                                        </button>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold text-slate-500 px-1 block mb-2">{language === 'ar' ? 'العناصر وتصنيفها' : 'Items & Their Category'}</label>
                                      <div className="space-y-2">
                                        {newQClassifyItems.map((item, idx) => (
                                          <div key={item.id} className="flex items-center gap-3">
                                            <input 
                                              type="text" 
                                              value={item.text} 
                                              onChange={(e) => setNewQClassifyItems(prev => prev.map(it => it.id === item.id ? { ...it, text: e.target.value } : it))} 
                                              placeholder={language === 'ar' ? `عنصر ${idx + 1}` : `Item ${idx + 1}`}
                                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
                                            />
                                            <select
                                              value={item.categoryId}
                                              onChange={(e) => setNewQClassifyItems(prev => prev.map(it => it.id === item.id ? { ...it, categoryId: e.target.value } : it))}
                                              className="w-40 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-400 transition-colors"
                                            >
                                              {newQCategories.map((cat, i) => (
                                                <option key={cat.id} value={cat.id}>{cat.name || (language === 'ar' ? `الفئة ${i + 1}` : `Category ${i + 1}`)}</option>
                                              ))}
                                            </select>
                                            <button 
                                              onClick={() => setNewQClassifyItems(prev => prev.filter(it => it.id !== item.id))}
                                              disabled={newQClassifyItems.length <= 2}
                                              className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors disabled:opacity-30"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        ))}
                                        <button 
                                          onClick={() => setNewQClassifyItems(prev => [...prev, { id: Date.now().toString(), text: '', categoryId: newQCategories[0]?.id || '' }])}
                                          disabled={newQClassifyItems.length >= 10}
                                          className="flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 px-1"
                                        >
                                          <Plus size={16} /> {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
                                        </button>
                                      </div>
                                    </div>
                                 </motion.div>
                              )}
                              {newQType === 'سحب وإفلات' && (
                                 <motion.div key="dragdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 mb-4">
                                    <div>
                                      <label className="text-xs font-bold text-slate-500 px-1 block mb-2">{language === 'ar' ? 'مناطق الإفلات' : 'Drop Zones'}</label>
                                      <div className="space-y-2">
                                        {newQZones.map((zone, idx) => (
                                          <div key={zone.id} className="flex items-center gap-3">
                                            <input 
                                              type="text" 
                                              value={zone.name} 
                                              onChange={(e) => setNewQZones(prev => prev.map(z => z.id === zone.id ? { ...z, name: e.target.value } : z))} 
                                              placeholder={language === 'ar' ? `منطقة ${idx + 1}` : `Zone ${idx + 1}`}
                                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
                                            />
                                            <button 
                                              onClick={() => {
                                                setNewQZones(prev => prev.filter(z => z.id !== zone.id));
                                                setNewQDragItems(prev => prev.map(it => it.zoneId === zone.id ? { ...it, zoneId: newQZones[0]?.id === zone.id ? (newQZones[1]?.id || '') : newQZones[0]?.id || '' } : it));
                                              }}
                                              disabled={newQZones.length <= 2}
                                              className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors disabled:opacity-30"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        ))}
                                        <button 
                                          onClick={() => setNewQZones(prev => [...prev, { id: `z${Date.now()}`, name: '' }])}
                                          disabled={newQZones.length >= 5}
                                          className="flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 px-1"
                                        >
                                          <Plus size={16} /> {language === 'ar' ? 'إضافة منطقة' : 'Add Zone'}
                                        </button>
                                      </div>
                                    </div>
                                    <div>
                                      <label className="text-xs font-bold text-slate-500 px-1 block mb-2">{language === 'ar' ? 'العناصر ومنطقتها الصحيحة' : 'Items & Their Correct Zone'}</label>
                                      <div className="space-y-2">
                                        {newQDragItems.map((item, idx) => (
                                          <div key={item.id} className="flex items-center gap-3">
                                            <input 
                                              type="text" 
                                              value={item.text} 
                                              onChange={(e) => setNewQDragItems(prev => prev.map(it => it.id === item.id ? { ...it, text: e.target.value } : it))} 
                                              placeholder={language === 'ar' ? `عنصر ${idx + 1}` : `Item ${idx + 1}`}
                                              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 transition-colors"
                                            />
                                            <select
                                              value={item.zoneId}
                                              onChange={(e) => setNewQDragItems(prev => prev.map(it => it.id === item.id ? { ...it, zoneId: e.target.value } : it))}
                                              className="w-40 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-400 transition-colors"
                                            >
                                              {newQZones.map((zone, i) => (
                                                <option key={zone.id} value={zone.id}>{zone.name || (language === 'ar' ? `منطقة ${i + 1}` : `Zone ${i + 1}`)}</option>
                                              ))}
                                            </select>
                                            <button 
                                              onClick={() => setNewQDragItems(prev => prev.filter(it => it.id !== item.id))}
                                              disabled={newQDragItems.length <= 2}
                                              className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 flex items-center justify-center transition-colors disabled:opacity-30"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        ))}
                                        <button 
                                          onClick={() => setNewQDragItems(prev => [...prev, { id: Date.now().toString(), text: '', zoneId: newQZones[0]?.id || '' }])}
                                          disabled={newQDragItems.length >= 10}
                                          className="flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 px-1"
                                        >
                                          <Plus size={16} /> {language === 'ar' ? 'إضافة عنصر' : 'Add Item'}
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-400 px-1">{language === 'ar' ? 'الطالب هيسحب العناصر فعليًا لمناطقها (مش قايمة اختيار).' : 'The student will physically drag items onto their zones (not a dropdown).'}</p>
                                 </motion.div>
                              )}
                              {newQType === 'منطقة تفاعلية' && (
                                 <motion.div key="hotspot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 mb-4">
                                    <HotspotEditor
                                      imageUrl={newQImageUrl}
                                      hotspots={newQHotspots}
                                      isUploading={isUploadingQImage}
                                      onUpload={async (file) => {
                                        setIsUploadingQImage(true);
                                        const result = await uploadQuestionImage(file);
                                        setIsUploadingQImage(false);
                                        if (result) setNewQImageUrl(result.url);
                                      }}
                                      onImageClick={(xPercent, yPercent) => {
                                        setNewQHotspots(prev => [...prev, { id: Date.now().toString(), xPercent, yPercent, label: `${prev.length + 1}`, isCorrect: prev.length === 0 }]);
                                      }}
                                      onMarkCorrect={(idx) => setNewQHotspots(prev => prev.map((h, i) => ({ ...h, isCorrect: i === idx })))}
                                      onRemoveHotspot={(idx) => setNewQHotspots(prev => prev.filter((_, i) => i !== idx))}
                                      onRemoveImage={() => { setNewQImageUrl(''); setNewQHotspots([]); }}
                                      language={language}
                                    />
                                 </motion.div>
                              )}
                              {newQType === 'قطعة' && (
                                 <motion.div key="passage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5 mb-4">
                                    <div>
                                      <label className="text-xs font-bold text-slate-500 px-1 block mb-2">{language === 'ar' ? 'نص القطعة' : 'Passage Text'}</label>
                                      <textarea
                                        value={newQPassageText}
                                        onChange={(e) => setNewQPassageText(e.target.value)}
                                        rows={6}
                                        placeholder={language === 'ar' ? 'اكتب نص القطعة هنا...' : 'Write the passage text here...'}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold text-sm text-slate-800 focus:outline-none focus:border-violet-400 resize-y transition-colors placeholder:font-normal placeholder:text-slate-400"
                                      />
                                    </div>
                                    <div className="space-y-4">
                                      <label className="text-xs font-bold text-slate-500 px-1 block">{language === 'ar' ? 'الأسئلة الفرعية' : 'Sub-Questions'}</label>
                                      {newQSubQuestions.map((sq, sqIdx) => (
                                        <SubQuestionEditor
                                          key={sq.id}
                                          subQuestion={sq}
                                          index={sqIdx}
                                          language={language}
                                          onUpdate={(patch) => setNewQSubQuestions(prev => prev.map(q => q.id === sq.id ? { ...q, ...patch } : q))}
                                          onDelete={() => setNewQSubQuestions(prev => prev.filter(q => q.id !== sq.id))}
                                        />
                                      ))}
                                      <button
                                        onClick={() => setNewQSubQuestions(prev => [...prev, {
                                          id: crypto.randomUUID(),
                                          title: '',
                                          type: 'اختيار من متعدد',
                                          points: 1,
                                          options: [
                                            { id: crypto.randomUUID(), text: '', isCorrect: true },
                                            { id: crypto.randomUUID(), text: '', isCorrect: false },
                                          ],
                                        }])}
                                        disabled={newQSubQuestions.length >= 10}
                                        className="flex items-center gap-2 text-sm font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 px-1"
                                      >
                                        <Plus size={16} /> {language === 'ar' ? 'إضافة سؤال فرعي' : 'Add Sub-Question'}
                                      </button>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-400 px-1">{language === 'ar' ? `إجمالي درجة القطعة: ${newQSubQuestions.reduce((s, q) => s + (q.points || 0), 0)} نقطة` : `Total passage points: ${newQSubQuestions.reduce((s, q) => s + (q.points || 0), 0)}`}</p>
                                 </motion.div>
                              )}
                           </AnimatePresence>

                           {/* Media Actions */}
                           <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-4 text-[13px] font-bold text-slate-400">
                               {(newQType === 'اختيار من متعدد' || newQType === 'مقطع صوتي') && (
                                  <>
                                    <button 
                                      onClick={() => {
                                        if (newQOptions.length < 6) {
                                          setNewQOptions([...newQOptions, { id: crypto.randomUUID(), text: '', isCorrect: false, imageUrl: null }]);
                                        }
                                      }}
                                      disabled={newQOptions.length >= 6}
                                      className="flex items-center gap-2 hover:text-violet-600 transition-colors disabled:opacity-50 disabled:hover:text-slate-400"
                                    >
                                      <Plus size={16} /> {language === 'ar' ? 'إضافة خيار' : 'Add Option'}
                                    </button>
                                    <div className="w-px h-4 bg-slate-200"></div>
                                  </>
                               )}
                               <button className="flex items-center gap-2 hover:text-violet-600 transition-colors">
                                 <MessageSquare size={16} strokeWidth={2.5} /> {language === 'ar' ? 'وسائط وملاحظات إضافية' : 'Extra Media & Notes'}
                               </button>
                           </div>
                       </div>

                       {/* 4. DEDICATED ACTION BAR */}
                       <div className="relative mt-auto p-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-3 z-10">
                          {saveQuestionError && <p className="text-sm font-bold text-rose-600">{saveQuestionError}</p>}
                          {duplicateCheckResult.checked && (
                            duplicateCheckResult.matches.length > 0 ? (
                              <p className="text-sm font-bold text-amber-600">
                                {language === 'ar' ? `لقينا ${duplicateCheckResult.matches.length} سؤال مشابه في البنك: "${duplicateCheckResult.matches[0].title}"` : `Found ${duplicateCheckResult.matches.length} similar question(s) in the bank: "${duplicateCheckResult.matches[0].title}"`}
                              </p>
                            ) : (
                              <p className="text-sm font-bold text-emerald-600">{language === 'ar' ? 'مفيش تطابق — السؤال ده جديد على البنك' : "No matches — this question is new to the bank"}</p>
                            )
                          )}
                          <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={handleCheckDuplicates} 
                              disabled={!newQTitle.trim()}
                              className="px-6 py-2.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50 font-bold rounded-xl transition-colors shadow-none flex items-center gap-2 text-sm"
                            >
                              <RefreshCw size={16} />
                              {language === 'ar' ? 'فحص التطابق / التكرار' : 'Check Duplicates'}
                            </button>
                            <button 
                              onClick={() => { handleSaveQuestion(true); setIsVaultOpen(true); }} 
                              disabled={!newQTitle || isSavingQuestion} 
                              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-none flex items-center gap-2 text-sm"
                            >
                              <Plus size={16} />
                              {isSavingQuestion ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ وإضافة جديد' : 'Save & Add New')}
                            </button>
                            <button 
                              onClick={() => handleSaveQuestion(false)} 
                              disabled={!newQTitle || isSavingQuestion} 
                              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 font-bold rounded-xl transition-colors shadow-none text-sm"
                            >
                              {isSavingQuestion ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ والعودة' : 'Save & Return')}
                            </button>
                          </div>
                          </div>
                      </div>
                    </div>
                  </div>
                </div>
                  </motion.div>
                </>
              )}
            </div>
          )}

          {/* ASSESSMENTS TAB */}
          {activeTab === 'ASSESSMENTS' && (
            <div className="h-full">
              {assessmentView === 'LIBRARY' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Top Action */}
                  <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-none">
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">{language === 'ar' ? 'مكتبة التقييمات' : 'Assessments Library'}</h2>
                      <p className="text-sm font-medium text-slate-500 mt-1">{language === 'ar' ? 'إدارة الاختبارات والتقييمات المحفوظة وتعيينها للطلاب' : 'Manage saved tests and assessments and assign them to students'}</p>
                    </div>
                    <button onClick={() => {
                      setEditingAssessmentId(null);
                      setBlueprintTitle('');
                      setBlueprintSubject('');
                      setBlueprintGrade('');
                      setBlueprintClassId('');
                      setBlueprintQuestions([]);
                      setReleaseDate('');
                      setReleaseTime('08:00');
                      setDueDateValue('');
                      setDueTimeValue('23:59');
                      setAssessmentView('BLUEPRINT_FORM');
                    }} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-none">
                      <Plus size={18} />
                      {language === 'ar' ? 'إنشاء تقييم بالمعايير' : 'Create by Criteria'}
                    </button>
                  </div>

                  {/* Assessment Grid */}
                  {isLoadingAssessments ? (
                    <p className="text-center text-sm text-slate-400 py-16">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                  ) : assessmentsList.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-16">{language === 'ar' ? 'لسه مفيش تقييمات اتعملت بالمخطط — دوس "إنشاء تقييم بالمعايير" فوق' : 'No blueprint assessments created yet — use "Create by Criteria" above'}</p>
                  ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {assessmentsList.map(assessment => {
                      return (
                      <div key={assessment.id} className="bg-white border border-slate-100 p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-violet-300 group flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
                            <ListChecks size={24} />
                          </div>
                          {assessment.approvalStatus === 'pending' ? (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">{language === 'ar' ? 'بانتظار الاعتماد' : 'Pending Approval'}</span>
                          ) : assessment.approvalStatus === 'rejected' ? (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">{language === 'ar' ? 'مرفوض' : 'Rejected'}</span>
                          ) : assessment.status === 'Active' ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{language === 'ar' ? 'منشور' : 'Published'}</span>
                          ) : (
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{language === 'ar' ? 'مسودة' : 'Draft'}</span>
                          )}
                        </div>
                        
                        <div className="mb-4 flex-1">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center border bg-violet-50 border-white text-violet-600">{assessment.subject}</span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{assessment.title}</h3>
                          <p className="text-xs font-bold text-slate-400">{assessment.className} • {new Date(assessment.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-5 pt-4 border-t border-slate-100 mt-auto">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-slate-400 mb-0.5">{language === 'ar' ? 'الأسئلة' : 'Questions'}</span>
                             <span className="text-sm font-black text-slate-700">{assessment.questionCount} {language === 'ar' ? 'سؤال' : 'questions'}</span>
                           </div>
                           <div className="w-px h-8 bg-slate-200"></div>
                           <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-slate-400 mb-0.5">{language === 'ar' ? 'إجمالي الدرجات' : 'Total Points'}</span>
                             <span className="text-sm font-black text-slate-700">{assessment.totalPoints} {language === 'ar' ? 'نقطة' : 'pts'}</span>
                           </div>
                        </div>

                        <button onClick={() => handleOpenAssessmentForEdit(assessment.id)} disabled={isLoadingAssessmentEdit} className="w-full py-3 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-violet-600 hover:text-white border border-slate-200 hover:border-violet-600 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                          <Settings2 size={18} />
                          {language === 'ar' ? 'ضبط الإعدادات والنشر' : 'Configure Settings & Publish'}
                        </button>
                      </div>
                    )})}
                  </div>
                  )}
                </motion.div>
              )}

              {assessmentView === 'BLUEPRINT_FORM' && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-5xl mx-auto space-y-6 pb-24">
                  {/* Header & Back */}
                  <div className="flex items-center justify-between mb-2">
                     <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        {language === 'ar' ? 'التقييمات' : 'Assessments'} <span className="text-slate-300">/</span> <span className="text-slate-800">{language === 'ar' ? 'محرك بناء المعايير' : 'Criteria Builder Engine'}</span>
                     </h2>
                     <button onClick={() => setAssessmentView('LIBRARY')} className="w-10 h-10 bg-white border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-none">
                       <ArrowRight size={20} />
                     </button>
                  </div>

                  {/* 1. SECTION 1: CORE ASSESSMENT DATA */}
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                       <div className="flex flex-col">
                         <label className="text-sm text-slate-500 mb-1 font-bold">{language === 'ar' ? 'اسم التقييم' : 'Assessment Name'}</label>
                         <input type="text" value={blueprintTitle} onChange={(e) => setBlueprintTitle(e.target.value)} placeholder={language === 'ar' ? 'مثال: التقييم الختامي...' : 'e.g. Final Assessment...'} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors" />
                       </div>
                       <div className="flex flex-col">
                         <label className="text-sm text-slate-500 mb-1 font-bold">{language === 'ar' ? 'إجمالي الأسئلة' : 'Total Questions'}</label>
                         <input type="number" value={TotalQuestions} onChange={(e) => setTotalQuestions(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors" />
                       </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div className="flex flex-col">
                         <label className="text-sm text-slate-500 mb-1 font-bold">{language === 'ar' ? 'المادة والصف' : 'Subject & Grade'}</label>
                         <select value={blueprintSubject && blueprintGrade ? `${blueprintSubject}|${blueprintGrade}` : ''} onChange={(e) => { const [s, g] = e.target.value.split('|'); setBlueprintSubject(s); setBlueprintGrade(g); setBlueprintClassId(''); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors">
                           <option value="">{language === 'ar' ? 'اختر المادة والصف...' : 'Choose subject & grade...'}</option>
                           {hubCombos.map((c) => (
                             <option key={`${c.subject}-${c.grade}`} value={`${c.subject}|${c.grade}`}>{c.subject} • {c.grade}</option>
                           ))}
                         </select>
                       </div>
                       <div className="flex flex-col">
                         <label className="text-sm text-slate-500 mb-1 font-bold">{language === 'ar' ? 'الفصل المستهدف' : 'Target Class'}</label>
                         <select value={blueprintClassId} onChange={(e) => setBlueprintClassId(e.target.value)} disabled={!blueprintGrade} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50">
                           <option value="">{language === 'ar' ? 'اختر الفصل...' : 'Choose class...'}</option>
                           {teacherClasses.filter((c) => !blueprintGrade || c.gradeLevel === blueprintGrade).map((c) => (
                             <option key={c.id} value={c.id}>{c.name}</option>
                           ))}
                         </select>
                       </div>
                       <div className="flex flex-col">
                         <label className="text-sm text-slate-500 mb-1 font-bold">{language === 'ar' ? 'الوحدات المستهدفة' : 'Target Units'}</label>
                         <select value={blueprintUnit} onChange={(e) => setBlueprintUnit(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer">
                           <option>{language === 'ar' ? 'كل الوحدات' : 'All Units'}</option>
                         </select>
                       </div>
                     </div>
                  </div>

                  {/* 2. SECTION 2: CRITERIA ENGINEERING CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CARD A */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                         <h3 className="font-bold text-slate-800 text-lg">{language === 'ar' ? 'توزيع مستويات الصعوبة' : 'Difficulty Distribution'}</h3>
                         <span className={`text-xs font-bold px-2 py-1 rounded-md ${diffTotal === 100 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>{language === 'ar' ? `إجمالي النسبة: ${diffTotal}%` : `Total: ${diffTotal}%`}</span>
                      </div>
                      <div className="space-y-6 flex-1">
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-sm font-bold text-slate-600">{language === 'ar' ? 'سهل' : 'Easy'}</span>
                             <div className="flex items-center gap-2">
                               <input type="number" min="0" max="100" value={diffEasy} onChange={(e) => setDiffEasy(Number(e.target.value))} className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:border-emerald-500 transition-colors" />
                               <span className="text-sm font-bold text-slate-400">%</span>
                             </div>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${Math.min(diffEasy, 100)}%` }}></div>
                           </div>
                         </div>
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-sm font-bold text-slate-600">{language === 'ar' ? 'متوسط' : 'Medium'}</span>
                             <div className="flex items-center gap-2">
                               <input type="number" min="0" max="100" value={diffMed} onChange={(e) => setDiffMed(Number(e.target.value))} className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:border-amber-500 transition-colors" />
                               <span className="text-sm font-bold text-slate-400">%</span>
                             </div>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${Math.min(diffMed, 100)}%` }}></div>
                           </div>
                         </div>
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-sm font-bold text-slate-600">{language === 'ar' ? 'صعب' : 'Hard'}</span>
                             <div className="flex items-center gap-2">
                               <input type="number" min="0" max="100" value={diffHard} onChange={(e) => setDiffHard(Number(e.target.value))} className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:border-rose-500 transition-colors" />
                               <span className="text-sm font-bold text-slate-400">%</span>
                             </div>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${Math.min(diffHard, 100)}%` }}></div>
                           </div>
                         </div>
                      </div>
                    </div>

                    {/* CARD B */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                         <h3 className="font-bold text-slate-800 text-lg">{language === 'ar' ? 'توزيع مستويات بلوم المعرفية' : "Bloom's Taxonomy Distribution"}</h3>
                         <span className={`text-xs font-bold px-2 py-1 rounded-md ${bloomTotal === 100 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>{language === 'ar' ? `إجمالي النسبة: ${bloomTotal}%` : `Total: ${bloomTotal}%`}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-slate-600">{language === 'ar' ? 'تذكر' : 'Remember'}</span>
                             <div className="flex items-center gap-1.5">
                               <input type="number" min="0" max="100" value={bloomRemember} onChange={(e) => setBloomRemember(Number(e.target.value))} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-violet-500 transition-colors" />
                               <span className="text-xs font-bold text-slate-400">%</span>
                             </div>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${Math.min(bloomRemember, 100)}%` }}></div>
                           </div>
                         </div>
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-slate-600">{language === 'ar' ? 'فهم' : 'Understand'}</span>
                             <div className="flex items-center gap-1.5">
                               <input type="number" min="0" max="100" value={bloomUnderstand} onChange={(e) => setBloomUnderstand(Number(e.target.value))} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-violet-500 transition-colors" />
                               <span className="text-xs font-bold text-slate-400">%</span>
                             </div>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${Math.min(bloomUnderstand, 100)}%` }}></div>
                           </div>
                         </div>
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-slate-600">{language === 'ar' ? 'تطبيق' : 'Apply'}</span>
                             <div className="flex items-center gap-1.5">
                               <input type="number" min="0" max="100" value={bloomApply} onChange={(e) => setBloomApply(Number(e.target.value))} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-violet-500 transition-colors" />
                               <span className="text-xs font-bold text-slate-400">%</span>
                             </div>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${Math.min(bloomApply, 100)}%` }}></div>
                           </div>
                         </div>
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-slate-600">{language === 'ar' ? 'تحليل' : 'Analyze'}</span>
                             <div className="flex items-center gap-1.5">
                               <input type="number" min="0" max="100" value={bloomAnalyze} onChange={(e) => setBloomAnalyze(Number(e.target.value))} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-violet-500 transition-colors" />
                               <span className="text-xs font-bold text-slate-400">%</span>
                             </div>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${Math.min(bloomAnalyze, 100)}%` }}></div>
                           </div>
                         </div>
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-slate-600">{language === 'ar' ? 'تقييم' : 'Evaluate'}</span>
                             <div className="flex items-center gap-1.5">
                               <input type="number" min="0" max="100" value={bloomEvaluate} onChange={(e) => setBloomEvaluate(Number(e.target.value))} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-violet-500 transition-colors" />
                               <span className="text-xs font-bold text-slate-400">%</span>
                             </div>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${Math.min(bloomEvaluate, 100)}%` }}></div>
                           </div>
                         </div>
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-slate-600">{language === 'ar' ? 'ابتكار' : 'Create'}</span>
                             <div className="flex items-center gap-1.5">
                               <input type="number" min="0" max="100" value={bloomCreate} onChange={(e) => setBloomCreate(Number(e.target.value))} className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-violet-500 transition-colors" />
                               <span className="text-xs font-bold text-slate-400">%</span>
                             </div>
                           </div>
                           <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${Math.min(bloomCreate, 100)}%` }}></div>
                           </div>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. SECTION 3: QUESTION TYPES */}
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none">
                     <h3 className="font-bold text-slate-800 text-lg mb-4">{language === 'ar' ? 'توزيع أنواع الأسئلة' : 'Question Type Distribution'}</h3>
                     
                     <div className="mb-6">
                       <h4 className="text-sm font-bold text-slate-500 mb-3">{language === 'ar' ? 'اختر الأنواع' : 'Choose Types'}</h4>
                       <div className="flex flex-wrap gap-2">
                         {questionTypesList.map((type) => {
                           const isActive = selectedTypes.includes(type);
                           return (
                             <button
                               key={type}
                               onClick={() => handleToggleType(type)}
                               className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                                 isActive 
                                   ? 'bg-violet-100 text-violet-700 border border-violet-200' 
                                   : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                               }`}
                             >
                               {typeLabel(type)}
                             </button>
                           );
                         })}
                       </div>
                     </div>

                     {selectedTypes.length > 0 && (
                       <div>
                         <h4 className="text-sm font-bold text-slate-500 mb-3">{language === 'ar' ? 'الأنواع المحددة' : 'Selected Types'}</h4>
                         <div className="flex flex-col gap-3">
                           {selectedTypes.map((type) => {
                             const count = typeCounts[type] || 0;
                             const percentage = typePercentages[type] || 0;
                             
                             return (
                               <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                 <span className="font-bold text-slate-700 text-sm">{typeLabel(type)}</span>
                                 <div className="flex items-center gap-4">
                                   <div className="flex items-center gap-2">
                                     <span className="text-xs font-bold text-slate-400">{language === 'ar' ? 'العدد' : 'Count'}</span>
                                     <input 
                                       type="number" 
                                       min="0" 
                                       value={count} 
                                       onChange={(e) => handleTypeCountChange(type, Number(e.target.value))} 
                                       className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:border-violet-500 transition-colors" 
                                     />
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <span className="text-xs font-bold text-slate-400">{language === 'ar' ? 'النسبة' : 'Percent'}</span>
                                     <div className="relative">
                                       <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-violet-500">%</span>
                                       <input 
                                         type="number" 
                                         min="0" 
                                         max="100"
                                         value={percentage} 
                                         onChange={(e) => handleTypePercentageChange(type, Number(e.target.value))} 
                                         className="w-24 bg-violet-50 border border-violet-200 text-violet-700 rounded-lg pl-6 pr-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:border-violet-500 transition-colors" 
                                       />
                                     </div>
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}
                  </div>

                  {/* 4. ACTION AREA (THE FORK) */}
                  <div className="flex flex-col md:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
                     <button onClick={() => setAssessmentView('MANUAL_SELECTION')} className="w-full md:w-auto px-8 py-3.5 bg-white hover:bg-violet-50 text-violet-700 border border-violet-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm">
                        <MousePointerClick size={18} />
                        {language === 'ar' ? 'اختيار الأسئلة يدوياً' : 'Select Questions Manually'}
                     </button>
                     <button onClick={handleGenerateBlueprint} disabled={!blueprintSubject || !blueprintGrade || isGeneratingBlueprint} className="w-full md:w-auto px-8 py-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm">
                        <ListChecks size={18} />
                        {isGeneratingBlueprint ? (language === 'ar' ? 'جاري الاختيار...' : 'Selecting...') : (language === 'ar' ? 'توليد حسب المعايير' : 'Generate by Criteria')}
                     </button>
                  </div>

                </motion.div>
              )}

              {assessmentView === 'MANUAL_SELECTION' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto pb-24">
                  {/* Header & Back */}
                  <div className="flex items-center justify-between mb-6">
                     <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        {language === 'ar' ? 'التقييمات' : 'Assessments'} <span className="text-slate-300">/</span> {language === 'ar' ? 'محرك بناء المعايير' : 'Criteria Builder Engine'} <span className="text-slate-300">/</span> <span className="text-slate-800">{language === 'ar' ? 'اختيار الأسئلة يدوياً' : 'Select Questions Manually'}</span>
                     </h2>
                     <button onClick={() => setAssessmentView('BLUEPRINT_FORM')} className="w-10 h-10 bg-white border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-none">
                       <ArrowRight size={20} />
                     </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                     {/* LEFT COLUMN: LIVE COMPLIANCE TRACKER (span 4) */}
                     <div className="lg:col-span-4 order-2 lg:order-1">
                       <div className="sticky top-6 flex flex-col gap-6">
                         
                         {/* Compliance Meter */}
                         <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col items-center">
                            <h3 className="font-bold text-slate-800 text-center w-full mb-6">{language === 'ar' ? 'المراقب الذكي للمعايير' : 'Criteria Compliance Monitor'}</h3>
                            
                            <div className="w-32 h-32 relative mb-4">
                               <svg className="w-full h-full -rotate-90">
                                 <circle cx="64" cy="64" r="56" fill="none" className="stroke-slate-100" strokeWidth="8" />
                                 <circle cx="64" cy="64" r="56" fill="none" className="stroke-violet-600 transition-all duration-500 ease-out" strokeWidth="8" strokeLinecap="round" strokeDasharray="351.85" strokeDashoffset={351.85 - (351.85 * (Math.min(TotalQuestions > 0 ? manualSelectedQuestions.length / TotalQuestions : 0, 1)))} />
                               </svg>
                               <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="font-black text-violet-700 text-3xl">{TotalQuestions > 0 ? Math.round((manualSelectedQuestions.length / TotalQuestions) * 100) : 0}%</span>
                               </div>
                            </div>
                            <p className="text-sm font-bold text-slate-500 text-center">{language === 'ar' ? <>تم اختيار <span className="text-violet-600">{manualSelectedQuestions.length}</span> من أصل <span className="text-slate-800">{TotalQuestions}</span> أسئلة</> : <><span className="text-violet-600">{manualSelectedQuestions.length}</span> of <span className="text-slate-800">{TotalQuestions}</span> questions selected</>}</p>
                         </div>

                         {/* Compliance Checklist */}
                         <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm">{language === 'ar' ? 'حالة المعايير' : 'Criteria Status'}</h3>
                            <ul className="space-y-3">
                              <li className="flex items-center gap-3 text-sm">
                                <span className={`w-2 h-2 rounded-full ${manualSelectedQuestions.length >= (TotalQuestions * diffHard / 100) ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <span className="font-bold text-slate-600 flex-1">{language === 'ar' ? `أسئلة صعبة (${Math.round(TotalQuestions * diffHard / 100)})` : `Hard questions (${Math.round(TotalQuestions * diffHard / 100)})`}</span>
                              </li>
                              <li className="flex items-center gap-3 text-sm">
                                <span className={`w-2 h-2 rounded-full ${manualSelectedQuestions.length >= (TotalQuestions * diffEasy / 100) ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <span className="font-bold text-slate-600 flex-1">{language === 'ar' ? `أسئلة سهلة (${Math.round(TotalQuestions * diffEasy / 100)})` : `Easy questions (${Math.round(TotalQuestions * diffEasy / 100)})`}</span>
                              </li>
                              <li className="flex items-center gap-3 text-sm">
                                <span className={`w-2 h-2 rounded-full ${manualSelectedQuestions.length >= (TotalQuestions * bloomRemember / 100) ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                                <span className="font-bold text-slate-600 flex-1">{language === 'ar' ? `معيار التذكر (${Math.round(TotalQuestions * bloomRemember / 100)})` : `Remember criterion (${Math.round(TotalQuestions * bloomRemember / 100)})`}</span>
                              </li>
                              <li className="flex items-center gap-3 text-sm">
                                <span className={`w-2 h-2 rounded-full ${manualSelectedQuestions.length >= (TotalQuestions * bloomApply / 100) ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                                <span className="font-bold text-slate-600 flex-1">{language === 'ar' ? `معيار التطبيق (${Math.round(TotalQuestions * bloomApply / 100)})` : `Apply criterion (${Math.round(TotalQuestions * bloomApply / 100)})`}</span>
                              </li>
                            </ul>
                         </div>

                         {/* Action Footer */}
                         <button 
                           onClick={() => {
                             setBlueprintQuestions(manualPoolQuestions.filter((q) => manualSelectedQuestions.includes(q.id)));
                             setAssessmentView('BLUEPRINT_REVIEW');
                           }}
                           disabled={manualSelectedQuestions.length === 0}
                           className={`w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm ${
                             manualSelectedQuestions.length === TotalQuestions ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                           }`}
                         >
                           {manualSelectedQuestions.length === TotalQuestions ? <CheckCircle2 size={18} /> : <Eye size={18} />}
                           {manualSelectedQuestions.length === TotalQuestions ? (language === 'ar' ? 'اعتماد التقييم النهائي' : 'Finalize Assessment') : (language === 'ar' ? 'مراجعة الأسئلة المختارة' : 'Review Selected Questions')}
                         </button>
                       </div>
                     </div>

                     {/* RIGHT COLUMN: QUESTION REPOSITORY (span 8) */}
                     <div className="lg:col-span-8 order-1 lg:order-2 flex flex-col h-[calc(100vh-180px)]">
                       <div className="bg-slate-50 pb-4 pt-2 -mt-2 shrink-0">
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                           <input type="text" placeholder={language === 'ar' ? 'ابحث في مخزن الأسئلة...' : 'Search the question pool...'} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors" />
                           <div className="flex gap-2 items-center overflow-x-auto custom-scrollbar pb-1">
                             <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg px-3 py-2 outline-none focus:border-violet-500 cursor-pointer">
                               <option>{language === 'ar' ? 'الوحدة (الكل)' : 'Unit (All)'}</option>
                             </select>
                             <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg px-3 py-2 outline-none focus:border-violet-500 cursor-pointer">
                               <option>{language === 'ar' ? 'النوع (الكل)' : 'Type (All)'}</option>
                             </select>
                             <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg px-3 py-2 outline-none focus:border-violet-500 cursor-pointer">
                               <option>{language === 'ar' ? 'الصعوبة (الكل)' : 'Difficulty (All)'}</option>
                             </select>
                             <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg px-3 py-2 outline-none focus:border-violet-500 cursor-pointer">
                               <option>{language === 'ar' ? 'مستوى بلوم (الكل)' : 'Bloom Level (All)'}</option>
                             </select>
                           </div>
                         </div>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto pl-2 space-y-4 custom-scrollbar">
                         {isLoadingManualPool ? (
                           <p className="text-center text-sm text-slate-400 py-10">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
                         ) : manualPoolQuestions.length === 0 ? (
                           <p className="text-center text-sm text-slate-400 py-10">{language === 'ar' ? 'لا توجد أسئلة معتمدة متاحة لهذه المادة والصف' : 'No approved questions available for this subject and grade'}</p>
                         ) : manualPoolQuestions.map((q) => {
                            const isSelected = manualSelectedQuestions.includes(q.id);
                            return (
                               <div key={q.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 ${isSelected ? 'border-violet-500 ring-1 ring-violet-500/20 shadow-violet-500/10' : 'border-slate-200 hover:border-slate-300'}`}>
                                 <div className="flex gap-4">
                                   <div className="flex-1">
                                     <p className="text-sm font-bold text-slate-800 mb-3 leading-relaxed">{q.title}</p>
                                     <div className="flex flex-wrap gap-2 mb-4">
                                       <span className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded">{typeLabel(q.type)}</span>
                                       <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-1 rounded">{q.bloomLevel}</span>
                                       <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{q.difficulty}</span>
                                     </div>
                                     {q.options && q.options.length > 0 && (
                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                                         {q.options.map((opt: any, oIdx: number) => (
                                           <div key={opt.id || oIdx} className={`text-xs font-bold p-2 rounded-lg border ${opt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                             {opt.text}
                                           </div>
                                         ))}
                                       </div>
                                     )}
                                   </div>
                                   <div className="shrink-0">
                                     <button 
                                       onClick={() => {
                                         if (isSelected) {
                                           setManualSelectedQuestions(prev => prev.filter(id => id !== q.id));
                                         } else {
                                           setManualSelectedQuestions(prev => [...prev, q.id]);
                                         }
                                       }}
                                       className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors border ${
                                         isSelected 
                                           ? 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50' 
                                           : 'bg-violet-50 border-violet-100 text-violet-700 hover:bg-violet-100'
                                       }`}
                                     >
                                       {isSelected ? <><Trash2 size={14} /> {language === 'ar' ? 'إزالة' : 'Remove'}</> : <><Plus size={14} /> {language === 'ar' ? 'إضافة للتقييم' : 'Add to Assessment'}</>}
                                     </button>
                                   </div>
                                 </div>
                               </div>
                            )
                         })}
                       </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {assessmentView === 'BLUEPRINT_REVIEW' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-6">
                  {/* Header & Back */}
                  <div className="flex items-center justify-between">
                     <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        {language === 'ar' ? 'التقييمات' : 'Assessments'} <span className="text-slate-300">/</span> <span className="text-slate-800">{language === 'ar' ? 'مراجعة التقييم المولد' : 'Review Generated Assessment'}</span>
                     </h2>
                     <div className="flex gap-3">
                     </div>
                  </div>

                  {/* Compliance Meter */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-none flex items-center gap-6">
                    <div className="w-16 h-16 relative shrink-0">
                       <svg className="w-full h-full -rotate-90">
                         <circle cx="32" cy="32" r="28" fill="none" className="stroke-slate-100" strokeWidth="4" />
                         <circle cx="32" cy="32" r="28" fill="none" className="stroke-violet-600 outline-none" strokeWidth="4" strokeLinecap="round" strokeDasharray="175.93" strokeDashoffset={175.93 - (175.93 * Math.min(1, TotalQuestions > 0 ? blueprintQuestions.length / TotalQuestions : 0))} />
                       </svg>
                       <div className="absolute inset-0 flex items-center justify-center">
                         <span className="font-black text-violet-700 text-lg">{TotalQuestions > 0 ? Math.round((blueprintQuestions.length / TotalQuestions) * 100) : 0}%</span>
                       </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{blueprintQuestions.length >= TotalQuestions ? (language === 'ar' ? 'تم الوصول للعدد المطلوب بالكامل' : 'Reached the full required count') : (language === 'ar' ? 'البنك مفيهوش أسئلة كفاية بالمعايير دي' : 'The bank doesn\'t have enough questions matching these criteria')}</h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">{language === 'ar' ? `تم اختيار ${blueprintQuestions.length} من ${TotalQuestions} سؤال مطلوب من البنك الحقيقي. تقدر تراجع الأسئلة وتستبدلها لو محتاج.` : `Selected ${blueprintQuestions.length} of ${TotalQuestions} requested questions from the real bank. You can review and swap them if needed.`}</p>
                    </div>
                  </div>

                  {/* Selected Questions List */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-none">
                     <div className="flex items-center justify-between mb-6">
                       <h3 className="text-lg font-bold text-slate-800">{language === 'ar' ? `الأسئلة المختارة (${blueprintQuestions.length} سؤال)` : `Selected Questions (${blueprintQuestions.length})`}</h3>
                     </div>
                     <div className="space-y-3">
                       {blueprintQuestions.map((q, idx) => {
                         const isExpanded = expandedQuestions.includes(q.id);
                         const isSwapping = swappingIds.includes(q.id);
                         const isHighlighted = highlightedIds.includes(q.id);
                         
                         return (
                         <div key={q.id} className={`flex gap-4 p-4 rounded-xl border transition-all duration-300 ${isHighlighted ? 'bg-violet-50/80 border-violet-200' : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50'}`}>
                           <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-black text-sm shrink-0">
                             {idx + 1}
                           </div>
                           <div className="flex-1 cursor-pointer" onClick={() => toggleQuestionExpanded(q.id)}>
                             <div className="flex justify-between items-start gap-4">
                                <p className="text-sm font-bold text-slate-800 mb-2 leading-relaxed flex-1">{q.title}</p>
                                <button className="text-slate-400 hover:text-slate-600 p-1">
                                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                             </div>
                             
                             <div className="flex gap-2">
                               <span className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded">{q.type}</span>
                               <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded">{q.bloomLevel}</span>
                               <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{q.difficulty}</span>
                             </div>

                             {isExpanded && q.options && (
                               <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {q.options.map((opt: any, oIdx: number) => (
                                     <div key={opt.id || oIdx} className={`flex items-center gap-3 p-3 rounded-lg border ${opt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'}`}>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${opt.isCorrect ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                           {opt.isCorrect && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="text-sm font-bold">{opt.text}</span>
                                     </div>
                                  ))}
                               </div>
                             )}
                           </div>
                           <div className="shrink-0 flex items-start relative">
                             <button 
                               onClick={() => setActiveSwapMenuId(activeSwapMenuId === q.id ? null : q.id)}
                               disabled={isSwapping}
                               className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition-colors w-[90px] justify-center"
                             >
                               {isSwapping ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />} 
                               {isSwapping ? (language === 'ar' ? 'جارٍ...' : 'Working...') : (language === 'ar' ? 'استبدال' : 'Swap')}
                             </button>
                             {activeSwapMenuId === q.id && (
                                <DropdownMenu 
                                  options={[
                                    {label: language === 'ar' ? 'استبدال تلقائي' : 'Automatic Swap', icon: Layers},
                                    {label: language === 'ar' ? 'استبدال يدوي' : 'Manual Swap', icon: MousePointerClick}
                                  ]} 
                                  onSelect={(opt) => {
                                     setActiveSwapMenuId(null);
                                     if (opt === (language === 'ar' ? 'استبدال تلقائي' : 'Automatic Swap')) {
                                        handleSwapBlueprintQuestion(q.id);
                                     } else {
                                        setManualSwapModalQId(q.id);
                                     }
                                  }} 
                                />
                             )}
                           </div>
                         </div>
                       )})}
                     </div>
                     
                     <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-4">
                       <button onClick={() => setAssessmentView('BLUEPRINT_FORM')} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-none text-sm">
                         {language === 'ar' ? 'تعديل المعايير' : 'Edit Criteria'}
                       </button>
                       <button onClick={() => setAssessmentView('LIBRARY')} className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-violet-700 transition-colors shadow-sm text-sm">
                         {language === 'ar' ? 'اعتماد وحفظ في المكتبة' : 'Approve & Save to Library'} <Check size={16} />
                       </button>
                     </div>
                  </div>

                  {/* Manual Swap Drawer */}
                  <AnimatePresence>
                    {manualSwapModalQId && (
                       <div className="fixed inset-0 z-50 flex justify-end rtl:justify-start">
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={() => setManualSwapModalQId(null)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm cursor-pointer"></motion.div>
                          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.3, ease: 'easeInOut' }} className="bg-slate-50 w-[600px] max-w-2xl h-full flex flex-col shadow-2xl relative z-10 transform">
                             {/* Sticky Header with Filters */}
                             <div className="sticky top-0 bg-white z-20 border-b border-slate-200 shadow-sm shrink-0">
                               <div className="px-6 py-4 flex items-center justify-between">
                                 <div>
                                   <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><RefreshCw size={18} className="text-violet-600" /> {language === 'ar' ? 'استبدال يدوي' : 'Manual Swap'}</h3>
                                   <p className="text-[11px] font-bold text-slate-500 mt-1">{language === 'ar' ? 'الأسئلة مفلترة لتتطابق مع المعايير المطلوبة' : 'Questions are filtered to match the required criteria'}</p>
                                 </div>
                                 <button onClick={() => setManualSwapModalQId(null)} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                   <X size={16} />
                                 </button>
                               </div>
                               <div className="px-6 pb-4 space-y-3">
                                 <input type="text" value={manualSwapSearch} onChange={(e) => setManualSwapSearch(e.target.value)} placeholder={language === 'ar' ? 'ابحث في الأسئلة البديلة...' : 'Search alternative questions...'} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors" />
                                 <div className="flex gap-2 items-center overflow-x-auto custom-scrollbar pb-1">
                                   <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-md px-2 py-1.5 outline-none focus:border-violet-500 cursor-pointer">
                                     <option>{language === 'ar' ? 'الوحدة (الكل)' : 'Unit (All)'}</option>
                                   </select>
                                   <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-md px-2 py-1.5 outline-none focus:border-violet-500 cursor-pointer">
                                     <option>{language === 'ar' ? 'النوع (الكل)' : 'Type (All)'}</option>
                                   </select>
                                   <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-md px-2 py-1.5 outline-none focus:border-violet-500 cursor-pointer">
                                     <option>{language === 'ar' ? 'الصعوبة (مفلتر مسبقاً)' : 'Difficulty (pre-filtered)'}</option>
                                   </select>
                                 </div>
                               </div>
                             </div>
                             
                             <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                               {manualSwapAlternatives.filter((alt) => alt.title.toLowerCase().includes(manualSwapSearch.toLowerCase())).length === 0 ? (
                                 <p className="text-center text-sm text-slate-400 py-10">{language === 'ar' ? 'مفيش أسئلة بديلة متاحة حاليًا' : 'No alternative questions available right now'}</p>
                               ) : manualSwapAlternatives.filter((alt) => alt.title.toLowerCase().includes(manualSwapSearch.toLowerCase())).map((alt) => (
                                 <div key={alt.id} className="p-4 border border-slate-200 rounded-xl hover:border-violet-300 transition-colors bg-white">
                                    <p className="text-sm font-bold text-slate-800 mb-3">{alt.title}</p>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                      {(alt.options || []).map((opt: any, oIdx: number) => (
                                        <div key={opt.id || oIdx} className={`text-xs font-bold p-2 rounded-lg border ${opt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                          {opt.text}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex justify-end">
                                      <button onClick={() => {
                                        setBlueprintQuestions(prev => prev.map(q => q.id === manualSwapModalQId ? alt : q));
                                        const swappedId = manualSwapModalQId;
                                        setManualSwapModalQId(null);
                                        // highlight the swapped question
                                        if (swappedId) {
                                          setHighlightedIds(prev => [...prev, alt.id]);
                                          setTimeout(() => {
                                            setHighlightedIds(prev => prev.filter(qId => qId !== alt.id));
                                          }, 1500);
                                        }
                                      }} className="px-5 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold rounded-lg transition-colors text-sm border border-violet-100 flex items-center gap-2">
                                        <Check size={14} /> {language === 'ar' ? 'اختيار' : 'Select'}
                                      </button>
                                    </div>
                                 </div>
                               ))}
                             </div>
                          </motion.div>
                       </div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {assessmentView === 'SETTINGS' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col -m-6 h-[calc(100vh-80px)] bg-slate-50">
                  {/* Header */}
                  <div className="bg-white border-b border-slate-200 p-6 flex flex-col gap-1 shrink-0 z-10 w-full">
                    <h2 className="text-xl font-bold text-slate-800">{language === 'ar' ? 'إعدادات التقييم المتقدمة' : 'Advanced Assessment Settings'}</h2>
                    <p className="text-sm font-medium text-slate-500">{language === 'ar' ? 'ضبط خصائص النشر، الوقت، والربط بسجل الدرجات للتقييم.' : 'Configure publishing, timing, and gradebook-linking properties for the assessment.'}</p>
                  </div>

                  <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 w-full">
                    {/* RIGHT SIDEBAR (Vertical Tabs) */}
                    <div className="lg:col-span-3 border-l border-slate-200 bg-white overflow-y-auto w-full">
                      <div className="p-4 space-y-1">
                        {[
                          { id: 'AVAILABILITY', label: language === 'ar' ? 'الإتاحة والاستهداف' : 'Availability & Targeting', icon: Globe },
                          { id: 'DELIVERY', label: language === 'ar' ? 'خيارات التقديم' : 'Delivery Options', icon: Play },
                          { id: 'GRADEBOOK', label: language === 'ar' ? 'الربط بسجل الدرجات' : 'Gradebook Link', icon: Award },
                          { id: 'RESULTS', label: language === 'ar' ? 'النتائج والتغذية الراجعة' : 'Results & Feedback', icon: BarChart },
                          { id: 'SECURITY', label: language === 'ar' ? 'الأمان والقيود' : 'Security & Restrictions', icon: Settings2 }
                        ].map((tab) => {
                          const Icon = tab.icon;
                          const isActive = settingsTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setSettingsTab(tab.id as any)}
                              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors text-right border border-transparent ${
                                isActive 
                                  ? 'bg-violet-50 text-violet-700 border-violet-100 shadow-sm' 
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-100'
                              }`}
                            >
                              <Icon size={18} className={isActive ? 'text-violet-600' : 'text-slate-400'} />
                              {tab.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* LEFT CONTENT */}
                    <div className="lg:col-span-9 overflow-y-auto p-6 md:p-8 bg-slate-50">
                      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 max-w-3xl mx-auto min-h-[400px]">
                        
                        {settingsTab === 'AVAILABILITY' && (
                          <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4 mb-6">{language === 'ar' ? 'الإتاحة والاستهداف' : 'Availability & Targeting'}</h3>
                            
                            <div className="border border-slate-200 rounded-2xl p-6 flex flex-col gap-8">
                              {/* Targeting Field */}
                              <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">{language === 'ar' ? 'تحديد المستهدفين' : 'Select Targets'}</label>
                                <div className="relative w-full">
                                  <button onClick={(e) => { e.preventDefault(); setIsTargetDropdownOpen(!isTargetDropdownOpen); }} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors shadow-none text-right hover:bg-slate-50">
                                    <span>{targetingType === 'ALL' ? (language === 'ar' ? 'كل طلاب الصف' : 'All class students') : targetingType === 'CLASSES' ? (language === 'ar' ? 'فصول محددة' : 'Specific classes') : (language === 'ar' ? 'طلاب محددين' : 'Specific students')}</span>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isTargetDropdownOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  {/* Dropdown Menu Concept */}
                                  <AnimatePresence>
                                    {isTargetDropdownOpen && (
                                      <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsTargetDropdownOpen(false)}></div>
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-12 right-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden">
                                          <div className="p-1">
                                            <button onClick={(e) => { e.preventDefault(); setTargetingType('ALL'); setSelectedItems([]); setIsTargetDropdownOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg">{language === 'ar' ? 'كل طلاب الصف' : 'All class students'}</button>
                                            <button onClick={(e) => { e.preventDefault(); setTargetingType('CLASSES'); setSelectedItems([]); setIsTargetDropdownOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">{language === 'ar' ? 'فصول محددة' : 'Specific classes'}</button>
                                            <button onClick={(e) => { e.preventDefault(); setTargetingType('STUDENTS'); setSelectedItems([]); setIsTargetDropdownOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">{language === 'ar' ? 'طلاب محددين' : 'Specific students'}</button>
                                          </div>
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium">{language === 'ar' ? 'اختر الفصول أو المجموعات المسموح لها بإجراء هذا التقييم.' : 'Choose the classes or groups allowed to take this assessment.'}</p>

                                <AnimatePresence>
                                  {(targetingType === 'CLASSES' || targetingType === 'STUDENTS') && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4">
                                      <div className="relative">
                                        <div 
                                          className={`border ${isComboboxOpen ? 'border-violet-500 ring-2 ring-violet-500/10' : 'border-slate-200'} rounded-lg p-2 bg-white flex flex-wrap gap-2 items-center transition-all cursor-text`}
                                          onClick={() => setIsComboboxOpen(true)}
                                        >
                                          {selectedItems.map((tag, idx) => (
                                            <div key={idx} className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium">
                                              <span>{tag}</span>
                                              <button onClick={(e) => { e.stopPropagation(); setSelectedItems(selectedItems.filter((t) => t !== tag)); }} className="text-slate-400 hover:text-red-500 transition-colors">
                                                <X size={14} />
                                              </button>
                                            </div>
                                          ))}
                                          <input 
                                            type="text" 
                                            placeholder={language === 'ar' ? 'ابحث واختر...' : 'Search and select...'} 
                                            className="flex-1 bg-transparent border-none focus:outline-none min-w-[100px] text-sm text-slate-700 p-1" 
                                            value={searchQuery}
                                            onChange={(e) => {
                                              setSearchQuery(e.target.value);
                                              setIsComboboxOpen(true);
                                            }}
                                            onFocus={() => setIsComboboxOpen(true)}
                                          />
                                        </div>
                                        {/* Dropdown Options */}
                                        <AnimatePresence>
                                          {isComboboxOpen && (
                                            <>
                                              <div className="fixed inset-0 z-40" onClick={() => setIsComboboxOpen(false)}></div>
                                              <motion.div 
                                                initial={{ opacity: 0, y: 5 }} 
                                                animate={{ opacity: 1, y: 0 }} 
                                                exit={{ opacity: 0, y: 5 }} 
                                                className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                                              >
                                                <div className="p-1">
                                                  {(() => {
                                                    const options = targetingType === 'CLASSES' ? teacherClasses.map(c => c.name) : realClassStudents.map(s => s.name);
                                                    const filtered = options.filter(opt => opt.includes(searchQuery) && !selectedItems.includes(opt));
                                                    
                                                    if (filtered.length === 0) {
                                                      return <div className="p-4 text-center text-sm text-slate-500 font-medium">{language === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching results'}</div>;
                                                    }
                                                    
                                                    return filtered.map((opt, i) => (
                                                      <button 
                                                        key={i}
                                                        onClick={() => {
                                                          setSelectedItems([...selectedItems, opt]);
                                                          setSearchQuery('');
                                                          // Dropdown stays open for multiple selections
                                                        }}
                                                        className="w-full text-right px-4 py-3 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-colors border-b border-slate-50 last:border-0"
                                                      >
                                                        {opt}
                                                      </button>
                                                    ));
                                                  })()}
                                                </div>
                                              </motion.div>
                                            </>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              <hr className="border-slate-100" />

                              {/* Availability Mode */}
                              <div className="space-y-4">
                                <label className="text-sm font-bold text-slate-700 block">{language === 'ar' ? 'إتاحة التقييم' : 'Assessment Availability'}</label>
                                <div className="flex flex-col sm:flex-row gap-6">
                                  <label className="cursor-pointer flex items-center gap-3 group" onClick={(e) => { e.preventDefault(); setAvailabilityMode('ALWAYS'); }}>
                                    {availabilityMode === 'ALWAYS' ? (
                                      <div className="w-5 h-5 rounded-full border-2 border-violet-600 flex justify-center items-center shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-violet-400 transition-colors shrink-0" />
                                    )}
                                    <span className={availabilityMode === 'ALWAYS' ? "text-sm font-bold text-violet-700" : "text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors"}>{language === 'ar' ? 'متاح دائماً' : 'Always available'}</span>
                                  </label>

                                  <label className="cursor-pointer flex items-center gap-3 group" onClick={(e) => { e.preventDefault(); setAvailabilityMode('TIMEFRAME'); }}>
                                    {availabilityMode === 'TIMEFRAME' ? (
                                      <div className="w-5 h-5 rounded-full border-2 border-violet-600 flex justify-center items-center shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-violet-400 transition-colors shrink-0" />
                                    )}
                                    <span className={availabilityMode === 'TIMEFRAME' ? "text-sm font-bold text-violet-700" : "text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors"}>{language === 'ar' ? 'تحديد فترة زمنية' : 'Set a time window'}</span>
                                  </label>
                                </div>
                              </div>

                              {/* Date & Time Selectors */}
                              <div className={`flex flex-col gap-6 transition-all duration-300 ${availabilityMode === 'TIMEFRAME' ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none select-none'}`}>
                                {/* Start Row */}
                                <div>
                                  <label className="text-sm font-bold text-slate-700 block mb-2">{language === 'ar' ? 'تاريخ ووقت البدء' : 'Start Date & Time'}</label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-right">
                                      <Calendar size={18} className="text-slate-400 shrink-0" />
                                      <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)} className="block text-sm font-bold text-slate-800 bg-transparent outline-none w-full" />
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-right">
                                      <Clock size={18} className="text-slate-400 shrink-0" />
                                      <input type="time" value={releaseTime} onChange={(e) => setReleaseTime(e.target.value)} className="block text-sm font-bold text-slate-800 bg-transparent outline-none w-full" />
                                    </div>
                                  </div>
                                </div>
                                
                                <hr className="border-slate-100 border-dashed" />
                                
                                {/* Due Row */}
                                <div>
                                  <label className="text-sm font-bold text-slate-700 block mb-2">{language === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-right">
                                      <Calendar size={18} className="text-slate-400 shrink-0" />
                                      <input type="date" value={dueDateValue} onChange={(e) => setDueDateValue(e.target.value)} className="block text-sm font-bold text-slate-800 bg-transparent outline-none w-full" />
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl text-right">
                                      <Clock size={18} className="text-slate-400 shrink-0" />
                                      <input type="time" value={dueTimeValue} onChange={(e) => setDueTimeValue(e.target.value)} className="block text-sm font-bold text-slate-800 bg-transparent outline-none w-full" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'DELIVERY' && (
                          <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4 mb-6">{language === 'ar' ? 'خيارات التقديم' : 'Delivery Options'}</h3>
                            
                            {/* Container 1 (Time Limit) */}
                            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden divide-y divide-slate-100 mb-6">
                              <div className="flex justify-between items-center p-5">
                                <label className="text-sm font-bold text-slate-700">{language === 'ar' ? 'المدة الزمنية (بالدقائق)' : 'Time Limit (minutes)'}</label>
                                <input type="number" value={timeLimitMinutes} onChange={(e) => setTimeLimitMinutes(Number(e.target.value))} className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors hover:bg-slate-100" />
                              </div>
                              <div className="flex justify-between items-center p-5 bg-slate-50">
                                <label className="text-sm font-bold text-slate-700">{language === 'ar' ? 'عند انتهاء الوقت' : 'When time runs out'}</label>
                                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200 gap-1">
                                  <button
                                    onClick={() => setExpiryBehavior('auto_submit')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${expiryBehavior === 'auto_submit' ? 'bg-white text-violet-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    {language === 'ar' ? 'تسليم تلقائي للإجابات' : 'Auto-submit answers'}
                                  </button>
                                  <button
                                    onClick={() => setExpiryBehavior('grace_5min')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${expiryBehavior === 'grace_5min' ? 'bg-white text-violet-700 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                                  >
                                    {language === 'ar' ? 'فترة سماح 5 دقائق' : '5-minute grace period'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Container 2 (Toggles Group) */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100 mb-6">
                              <div className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50" onClick={() => setShuffleQuestions(!shuffleQuestions)}>
                                <span className="font-bold text-slate-700 text-sm">{language === 'ar' ? 'خلط الأسئلة' : 'Shuffle Questions'}</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${shuffleQuestions ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${shuffleQuestions ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50" onClick={() => setShuffleAnswers(!shuffleAnswers)}>
                                <span className="font-bold text-slate-700 text-sm">{language === 'ar' ? 'خلط الإجابات' : 'Shuffle Answers'}</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${shuffleAnswers ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${shuffleAnswers ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50" onClick={() => setShowOneQuestion(!showOneQuestion)}>
                                <span className="font-bold text-slate-700 text-sm">{language === 'ar' ? 'عرض سؤال واحد في كل مرة' : 'Show One Question at a Time'}</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${showOneQuestion ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${showOneQuestion ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>
                              
                              <div className={`flex justify-between items-center p-5 bg-slate-50 transition-all duration-300 ${showOneQuestion ? 'opacity-100 pointer-events-auto cursor-pointer hover:bg-slate-100' : 'opacity-40 pointer-events-none select-none'}`} onClick={() => showOneQuestion && setPreventBacktracking(!preventBacktracking)}>
                                <span className="font-bold text-slate-600 text-sm">{language === 'ar' ? 'منع الرجوع للسؤال السابق' : 'Prevent Going Back'}</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${preventBacktracking ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${preventBacktracking ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Container 3 (Advanced Attempts) */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100 mb-6">
                              <div className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50" onClick={() => setAllowMultipleAttempts(!allowMultipleAttempts)}>
                                <span className="font-bold text-slate-700 text-sm">{language === 'ar' ? 'السماح بمحاولات متعددة' : 'Allow Multiple Attempts'}</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${allowMultipleAttempts ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${allowMultipleAttempts ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>

                              <div className={`bg-slate-50 p-5 flex justify-between items-center transition-all duration-300 ${allowMultipleAttempts ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none select-none'}`}>
                                <label className="text-sm font-bold text-slate-600">{language === 'ar' ? 'طريقة احتساب الدرجة' : 'Grade Calculation Method'}</label>
                                <select
                                  value={multiAttemptGradeMethod}
                                  onChange={(e) => setMultiAttemptGradeMethod(e.target.value)}
                                  className="w-48 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors shadow-none text-slate-700"
                                >
                                  <option value="highest">{language === 'ar' ? 'أعلى درجة' : 'Highest Score'}</option>
                                  <option value="average">{language === 'ar' ? 'متوسط الدرجات' : 'Average Score'}</option>
                                  <option value="last">{language === 'ar' ? 'المحاولة الأخيرة' : 'Last Attempt'}</option>
                                </select>
                              </div>
                              
                              <div className={`bg-slate-50 p-5 flex justify-between items-center transition-all duration-300 ${allowMultipleAttempts ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none select-none'}`}>
                                <label className="text-sm font-bold text-slate-600">{language === 'ar' ? 'الانتظار بين المحاولات (بالساعات)' : 'Wait Between Attempts (hours)'}</label>
                                <input type="number" value={retryWaitHours} onChange={(e) => setRetryWaitHours(Number(e.target.value))} className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors hover:bg-slate-50" />
                              </div>
                            </div>

                            {/* Container 4 (Late Submission) */}
                            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                              <div className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50" onClick={() => setAllowLateSubmission(!allowLateSubmission)}>
                                <span className="font-bold text-slate-700 text-sm">{language === 'ar' ? 'السماح بالتسليم بعد تاريخ الاستحقاق (يُسجل كمتأخر)' : 'Allow Submission After Due Date (marked as late)'}</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${allowLateSubmission ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${allowLateSubmission ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'GRADEBOOK' && (
                          <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4 mb-6">{language === 'ar' ? 'الربط بسجل الدرجات' : 'Gradebook Link'}</h3>

                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                              {/* Card Header (The Toggle) */}
                              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => setAddToGradebook(!addToGradebook)}>
                                <div className="space-y-1">
                                  <span className="font-bold text-slate-800 text-base block">{language === 'ar' ? 'إدراج في دفتر الدرجات' : 'Add to Gradebook'}</span>
                                  <span className="text-sm font-medium text-slate-500 block">{language === 'ar' ? 'سيتم احتساب التقييم ضمن المجموع النهائي' : 'This assessment will count toward the final total'}</span>
                                </div>
                                <div className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${addToGradebook ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${addToGradebook ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>

                              {/* Card Body (Grid) */}
                              <AnimatePresence>
                                {addToGradebook && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                      {/* Right Column */}
                                      <div className="space-y-3">
                                        <label className="text-sm font-bold text-slate-700">{language === 'ar' ? 'تصنيف التقييم' : 'Assessment Category'}</label>
                                        <div className="relative w-full group">
                                          <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors shadow-none text-slate-700">
                                            <span>{language === 'ar' ? 'أعمال سنة' : 'Coursework'}</span>
                                            <ChevronDown size={14} className="text-slate-400" />
                                          </button>
                                          {/* Headless Dropdown Menu */}
                                          <div className="absolute top-12 right-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 overflow-hidden">
                                            <div className="p-1">
                                              <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">{language === 'ar' ? 'أعمال سنة' : 'Coursework'}</button>
                                              <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">{language === 'ar' ? 'اختبار نصفي' : 'Midterm Exam'}</button>
                                              <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">{language === 'ar' ? 'مشاركة وتفاعل' : 'Participation'}</button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Left Column */}
                                      <div className="flex flex-col justify-between">
                                        {/* Custom Radio Button Group */}
                                        <div className="flex items-center gap-6 mb-1 h-6">
                                          <label className="cursor-pointer flex items-center gap-2 group" onClick={(e) => { e.preventDefault(); setGradebookCalculationMode('PERCENTAGE'); }}>
                                            {gradebookCalculationMode === 'PERCENTAGE' ? (
                                              <div className="w-4 h-4 rounded-full border-2 border-violet-600 flex justify-center items-center">
                                                <div className="w-2 h-2 rounded-full bg-violet-600" />
                                              </div>
                                            ) : (
                                              <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-violet-400 transition-colors" />
                                            )}
                                            <span className={gradebookCalculationMode === 'PERCENTAGE' ? "text-sm font-bold text-violet-700" : "text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors"}>{language === 'ar' ? 'نسبة مئوية' : 'Percentage'}</span>
                                          </label>
                                          
                                          <label className="cursor-pointer flex items-center gap-2 group" onClick={(e) => { e.preventDefault(); setGradebookCalculationMode('POINTS'); }}>
                                            {gradebookCalculationMode === 'POINTS' ? (
                                              <div className="w-4 h-4 rounded-full border-2 border-violet-600 flex justify-center items-center">
                                                <div className="w-2 h-2 rounded-full bg-violet-600" />
                                              </div>
                                            ) : (
                                              <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-violet-400 transition-colors" />
                                            )}
                                            <span className={gradebookCalculationMode === 'POINTS' ? "text-sm font-bold text-violet-700" : "text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors"}>{language === 'ar' ? 'نقاط' : 'Points'}</span>
                                          </label>
                                        </div>
                                        
                                        {/* Number Input */}
                                        <div className="relative">
                                          <input 
                                            type="number" 
                                            value={gradebookMaxValue}
                                            onChange={(e) => setGradebookMaxValue(Number(e.target.value))}
                                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 hover:bg-slate-50 transition-colors" 
                                            dir="ltr"
                                          />
                                          {gradebookCalculationMode === 'PERCENTAGE' && (
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'RESULTS' && (
                          <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4 mb-6">{language === 'ar' ? 'النتائج والتغذية الراجعة' : 'Results & Feedback'}</h3>
                            
                            <p className="text-sm font-bold text-slate-600 mb-2">{language === 'ar' ? 'ماذا يرى الطالب بعد التسليم؟' : 'What does the student see after submitting?'}</p>
                            <div className="space-y-3 max-w-lg">
                              {[
                                { id: 'SCORE_ONLY', title: language === 'ar' ? 'الدرجة النهائية فقط' : 'Final Score Only', desc: language === 'ar' ? 'يظهر للطالب الدرجة التي حصل عليها فقط.' : 'The student only sees the score they received.' },
                                { id: 'SCORE_ERRORS', title: language === 'ar' ? 'الدرجة + الأخطاء' : 'Score + Errors', desc: language === 'ar' ? 'يظهر للطالب أسئلته الخاطئة دون عرض الإجابة الصحيحة.' : 'The student sees which questions they got wrong, without the correct answers.' },
                                { id: 'FULL', title: language === 'ar' ? 'الدرجة + الإجابات النموذجية' : 'Score + Model Answers', desc: language === 'ar' ? 'مراجعة كاملة لكل الإجابات الصحيحة والخاطئة.' : 'A full review of all correct and incorrect answers.'}
                              ].map((option, idx) => (
                                <div key={option.id} className={`p-5 rounded-xl border-2 flex gap-4 cursor-pointer transition-all ${idx === 2 ? 'border-violet-600 bg-violet-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${idx === 2 ? 'border-violet-600' : 'border-slate-300'}`}>
                                    {idx === 2 && <div className="w-2.5 h-2.5 bg-violet-600 rounded-full"></div>}
                                  </div>
                                  <div>
                                    <h4 className={`font-bold text-sm mb-1 ${idx === 2 ? 'text-violet-900' : 'text-slate-800'}`}>{option.title}</h4>
                                    <p className={`text-xs font-bold ${idx === 2 ? 'text-violet-600' : 'text-slate-500'}`}>{option.desc}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {settingsTab === 'SECURITY' && (
                          <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4 mb-6">{language === 'ar' ? 'الأمان والقيود' : 'Security & Restrictions'}</h3>
                            
                            <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-6">
                              
                              {/* Unique Passwords Toggle */}
                              <div className="space-y-3">
                                <label className="cursor-pointer flex items-center justify-between gap-4 group" onClick={(e) => { e.preventDefault(); setGenerateUniquePasswords(!generateUniquePasswords); }}>
                                  <div>
                                    <span className="font-bold text-slate-800 text-sm block">{language === 'ar' ? 'توليد كلمات مرور فريدة (ديناميكية)' : 'Generate Unique Passwords (Dynamic)'}</span>
                                    <span className="text-xs text-slate-500 font-medium">{language === 'ar' ? 'إلغاء كلمة المرور الموحدة لزيادة الأمان ومنع الغش.' : 'Disables the shared password for extra security and to prevent cheating.'}</span>
                                  </div>
                                  <div className={`w-11 h-6 rounded-full relative transition-colors ${generateUniquePasswords ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-none border border-slate-200 ${generateUniquePasswords ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                  </div>
                                </label>
                                
                                <AnimatePresence>
                                  {generateUniquePasswords && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                      <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 rounded-xl p-4 flex items-start gap-3 mt-1 shadow-none">
                                        <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium leading-relaxed">
                                          {language === 'ar' ? 'سيتم توليد كلمة مرور عشوائية ومختلفة لكل طالب تلقائياً، وإرسالها كإشعار آمن داخل ملفه الشخصي (البروفايل) فور بدء وقت الإتاحة.' : 'A random, different password will be automatically generated for each student and sent as a secure notification in their profile as soon as the availability window opens.'}
                                        </p>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              <hr className="border-slate-100" />
                              
                              {/* Browser Restriction Toggle */}
                              <div className="space-y-3">
                                <label className="cursor-pointer flex items-center justify-between gap-4 group" onClick={(e) => { e.preventDefault(); setRestrictBrowser(!restrictBrowser); }}>
                                  <div>
                                    <span className="font-bold text-slate-800 text-sm block">{language === 'ar' ? 'تقييد المتصفح (منع نوافذ أخرى)' : 'Restrict Browser (Block Other Windows)'}</span>
                                    <span className="text-xs text-slate-500 font-medium">{language === 'ar' ? 'يتطلب متصفح آمن أو يغلق الاختبار عند فقدان التركيز.' : 'Requires a locked-down browser or closes the test if focus is lost.'}</span>
                                  </div>
                                  <div className={`w-11 h-6 rounded-full relative transition-colors ${restrictBrowser ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-none border border-slate-200 ${restrictBrowser ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                  </div>
                                </label>
                              </div>

                            </div>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>

                  {/* Fixed Footer */}
                  <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 shrink-0 flex justify-end gap-3 z-20 w-full shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
                    {publishError && <p className="text-sm font-bold text-rose-600 self-center ml-auto">{publishError}</p>}
                    <button onClick={() => handlePublishBlueprint('Draft')} disabled={isPublishing} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-colors text-sm shadow-none disabled:opacity-50">
                      {language === 'ar' ? 'حفظ كمسودة' : 'Save as Draft'}
                    </button>
                    <button onClick={() => handlePublishBlueprint('Active')} disabled={isPublishing} className="px-8 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm text-sm disabled:opacity-50">
                      <Globe size={18} />
                      {isPublishing ? (language === 'ar' ? 'جاري النشر...' : 'Publishing...') : (language === 'ar' ? 'نشر واعتماد التقييم' : 'Publish Assessment')}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* APPROVAL_HUB TAB */}
          {activeTab === 'APPROVAL_HUB' && (
            <div className="w-full">
              <ApprovalHub language={language} />
            </div>
          )}
        </div>
      </main>

      {/* Question Preview Modal */}
      <AnimatePresence>
        {viewingQuestion && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={() => setViewingQuestion(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-full uppercase tracking-wider">{viewingQuestion.type}</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">{viewingQuestion.question?.title}</h3>
                </div>
                <button onClick={() => setViewingQuestion(null)} className="text-slate-400 hover:text-slate-600 shrink-0"><X size={20} /></button>
              </div>

              <div className="space-y-3">
                {(viewingQuestion.question as any)?.questionImageUrl && (
                  <img src={(viewingQuestion.question as any).questionImageUrl} alt="" className="max-h-56 rounded-2xl border border-slate-200" />
                )}
                {viewingQuestion.question?.passageText && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 whitespace-pre-wrap">{viewingQuestion.question.passageText}</div>
                )}

                {Array.isArray(viewingQuestion.question?.options) && viewingQuestion.question.options.length > 0 && (
                  <div className="space-y-2">
                    {viewingQuestion.question.options.map((opt: any) => (
                      <div key={opt.id} className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm ${opt.isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-bold' : 'border-slate-200 text-slate-600'}`}>
                        {opt.imageUrl && <img src={opt.imageUrl} alt="" className="w-8 h-8 object-cover rounded-md border border-slate-200 shrink-0" />}
                        {opt.isCorrect ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />}
                        {opt.text}
                      </div>
                    ))}
                  </div>
                )}

                {viewingQuestion.question?.numericAnswer != null && (
                  <p className="text-sm text-slate-700"><span className="font-bold">{language === 'ar' ? 'الإجابة الصحيحة: ' : 'Correct answer: '}</span>{viewingQuestion.question.numericAnswer} {viewingQuestion.question.numericUnit || ''} (± {viewingQuestion.question.numericTolerance || 0})</p>
                )}

                {Array.isArray(viewingQuestion.question?.pairs) && (
                  <div className="space-y-1.5">
                    {viewingQuestion.question.pairs.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg p-2">
                        <span className="font-bold">{p.left}</span> <ArrowRight size={12} className="text-slate-400" /> <span>{p.right}</span>
                      </div>
                    ))}
                  </div>
                )}

                {Array.isArray(viewingQuestion.question?.orderItems) && (
                  <ol className="list-decimal pr-5 space-y-1 text-sm text-slate-700">
                    {viewingQuestion.question.orderItems.map((it: string, i: number) => <li key={i}>{it}</li>)}
                  </ol>
                )}

                {Array.isArray(viewingQuestion.question?.subQuestions) && viewingQuestion.question.subQuestions.map((sq: any, i: number) => (
                  <div key={sq.id || i} className="border-t border-slate-100 pt-3">
                    <p className="font-bold text-slate-800 text-sm mb-1.5">{i + 1}. {sq.title} <span className="text-slate-400 font-normal">({sq.points} {language === 'ar' ? 'نقطة' : 'pts'})</span></p>
                    {Array.isArray(sq.options) && sq.options.map((o: any) => (
                      <div key={o.id} className={`text-xs pr-4 ${o.isCorrect ? 'text-emerald-600 font-bold' : 'text-slate-500'}`}>{o.isCorrect ? '✓' : '•'} {o.text}</div>
                    ))}
                  </div>
                ))}

                <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500 font-medium">
                  <span className="bg-slate-100 px-2 py-1 rounded-full">{viewingQuestion.subject}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded-full">{viewingQuestion.grade}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded-full">{viewingQuestion.bloomLevel}</span>
                  <span className="bg-slate-100 px-2 py-1 rounded-full">{viewingQuestion.difficulty}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                <button onClick={() => { const q = viewingQuestion; setViewingQuestion(null); openEditQuestion(q); }} className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-colors shadow-none">
                  <Edit2 size={16} /> {language === 'ar' ? 'تعديل' : 'Edit'}
                </button>
                <button onClick={() => setViewingQuestion(null)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-colors shadow-none">
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
