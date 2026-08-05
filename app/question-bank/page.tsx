'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { Database, Filter, Plus, UploadCloud, DownloadCloud, ArrowRight, BrainCircuit, PenTool, LayoutTemplate, MoreVertical, Edit2, Trash2, BookOpen, ListChecks, CheckCircle2, AlignRight, Type, Image as ImageIcon, Video, Mic, Copy, Eye, Search, ChevronDown, ChevronUp, MessageSquare, GitMerge, ListOrdered, MinusSquare, Map, Layers, LineChart, Move, Calculator, BarChart, MoreHorizontal, FileText, LayoutGrid, MoveHorizontal, Headphones, Signal, Award, Play, X, Paperclip, Binary, Atom, FlaskConical, Microscope, Languages, Text, Landmark, Globe, Monitor, Flag, Check, Sparkles, Loader2, Bot, MousePointerClick, Settings2, RefreshCw, ShieldCheck, Calendar, Clock, Sigma } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApprovalHub } from '@/components/ApprovalHub';
import { useAuth } from '@/contexts/AuthContext';

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

  const [objVsEssay, setObjVsEssay] = useState(80);

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
  
  const mockClasses = ["الصف العاشر أ", "الصف العاشر ب", "الصف الحادي عشر"];
  const mockStudents = ["أحمد خليل", "سارة الماجد", "عمر فاروق", "يوسف الحربي"];

  const [savedQuestions, setSavedQuestions] = useState([
    { id: 'g1', title: 'اشرح تأثير الجاذبية على الأجسام في الفراغ.', type: 'مقال', bloom: 'تحليل', diff: 'صعب', options: ['يقلل الوزن', 'يزيد الكتلة', 'لا يغير شيء', 'ينعدم الوزن'], correctIdx: 3 },
    { id: 'g2', title: 'ما هو وحدة قياس القوة في النظام الدولي للمتجهات؟', type: 'اختيار من متعدد', bloom: 'تذكر', diff: 'سهل', options: ['جول', 'نيوتن', 'وات', 'باسكال'], correctIdx: 1 },
    { id: 'g3', title: 'احسب تسارع جسم كتلته 5 كجم وقوته 20 نيوتن.', type: 'أكمل الفراغ', bloom: 'تطبيق', diff: 'متوسط', options: ['10 م/ث2', '4 م/ث2', '8 م/ث2', '2 م/ث2'], correctIdx: 1 },
  ]);

  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [swappingIds, setSwappingIds] = useState<string[]>([]);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  const toggleQuestionExpanded = (id: string) => {
    setExpandedQuestions(prev => prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]);
  };

  const handleSwapBlueprintQuestion = (id: string) => {
    setSwappingIds(prev => [...prev, id]);
    setTimeout(() => {
      const mockTitles = [
        'قارن بين طاقة الوضع وطاقة الحركة في نظام مغلق.',
        'أي من القوانين التالية يمثل قانون نيوتن الثالث؟',
        'استنتج سرعة جسم يسقط سقوطا حرا بعد 5 ثواني.',
        'ما هي العوامل المؤثرة على قوة الاحتكاك السكوني؟'
      ];
      setSavedQuestions(prev => prev.map(q => {
         if (q.id === id) {
            return {
               ...q,
               title: mockTitles[Math.floor(Math.random() * mockTitles.length)]
            };
         }
         return q;
      }));
      setSwappingIds(prev => prev.filter(qId => qId !== id));
      
      setHighlightedIds(prev => [...prev, id]);
      setTimeout(() => {
         setHighlightedIds(prev => prev.filter(qId => qId !== id));
      }, 1500);
    }, 1000);
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
  const [activeSubject, setActiveSubject] = useState<{id: string, name: string} | null>(null);
  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', title: 'ما هي عاصمة جمهورية مصر العربية؟', type: 'اختيار من متعدد', unit: 'الجغرافيا', lesson: 'العواصم العربية', bloomLevel: 'تذكر', difficulty: 'سهل' },
    { id: '2', title: 'اشرح تأثير الجاذبية على تسارع الأجسام الساقطة.', type: 'سؤال مقالي', unit: 'الفيزياء', lesson: 'قوانين نيوتن', bloomLevel: 'فهم', difficulty: 'متوسط' },
    { id: '3', title: 'تتكون جزيئات الماء من ذرتي هيدروجين وذرة أكسجين.', type: 'صح أم خطأ', unit: 'الكيمياء', lesson: 'الروابط الجزيئية', bloomLevel: 'تذكر', difficulty: 'سهل' },
    { id: '4', title: 'إذا كان س + 5 = 12، فإن قيمة س تساوي ___', type: 'أكمل الفراغ', unit: 'الجبر', lesson: 'المعادلات الخطية', bloomLevel: 'تطبيق', difficulty: 'متوسط' },
    { id: '5', title: 'قارن بين الخلايا النباتية والحيوانية من حيث التركيب.', type: 'سؤال مقالي', unit: 'الأحياء', lesson: 'بيولوجيا الخلية', bloomLevel: 'تحليل', difficulty: 'صعب' },
    { id: '6', title: 'النباتات الخضراء تقوم بعملية البناء الضوئي لإنتاج الغذاء.', type: 'صح أم خطأ', unit: 'الأحياء', lesson: 'تغذية النبات', bloomLevel: 'فهم', difficulty: 'متوسط' },
    { id: '7', title: 'أوجد مساحة مثلث طول قاعدته 10 سم وارتفاعه 5 سم.', type: 'اختيار من متعدد', unit: 'الهندسة', lesson: 'حساب المساحات', bloomLevel: 'تطبيق', difficulty: 'متوسط' },
    { id: '8', title: 'من هو مؤسس علم الخوارزميات؟', type: 'اختيار من متعدد', unit: 'التاريخ', lesson: 'العلماء العرب', bloomLevel: 'تذكر', difficulty: 'صعب' },
    { id: '9', title: 'لماذا يعتبر الغلاف الجوي ضرورياً لاستمرار الحياة؟ قم بتقييم الأسباب.', type: 'سؤال مقالي', unit: 'العلوم البيئية', lesson: 'طبقات الغلاف الجوي', bloomLevel: 'تقييم', difficulty: 'صعب' },
    { id: '10', title: 'ابتكر نموذجاً جديداً يوضح دورة المياه في الطبيعة.', type: 'سؤال مقالي', unit: 'الجغرافيا', lesson: 'المناخ والطقس', bloomLevel: 'ابتكار', difficulty: 'صعب' },
  ]);

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
  const [factoryMode, setFactoryMode] = useState<'MANUAL' | 'AI'>('MANUAL');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // New Question Form
  const [newQTitle, setNewQTitle] = useState('');
  const [newQUnit, setNewQUnit] = useState('');
  const [newQBloom, setNewQBloom] = useState('تذكر');
  const [newQDiff, setNewQDiff] = useState('سهل');
  const [newQType, setNewQType] = useState('اختيار من متعدد');
  const [targetBank, setTargetBank] = useState('بنك مركزي (الوزارة)');
  const [qStandard, setQStandard] = useState('الهدف الأول');
  const [qTime, setQTime] = useState('5');
  const [newQOptions, setNewQOptions] = useState<any[]>([
    { id: '1', text: '', isCorrect: true, mediaFile: null, mediaType: null, mediaPreviewUrl: null },
    { id: '2', text: '', isCorrect: false, mediaFile: null, mediaType: null, mediaPreviewUrl: null },
    { id: '3', text: '', isCorrect: false, mediaFile: null, mediaType: null, mediaPreviewUrl: null },
    { id: '4', text: '', isCorrect: false, mediaFile: null, mediaType: null, mediaPreviewUrl: null }
  ]);
  const [newQCorrectOption, setNewQCorrectOption] = useState<number>(0);
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


  const hubSubjects = [
    { id: 'math10', name: 'الرياضيات المتقدمة', grade: 'الصف العاشر', term: 'الفصل الدراسي الأول', count: 320, icon: Binary, colorText: 'text-indigo-600', colorBg: 'bg-indigo-50', colorBorder: 'hover:border-indigo-300', colorProgress: 'bg-indigo-500', shadowGlow: 'hover:shadow-indigo-500/20' },
    { id: 'phys10', name: 'الفيزياء الكلاسيكية', grade: 'الصف العاشر', term: 'الفصل الدراسي الأول', count: 145, icon: Atom, colorText: 'text-purple-600', colorBg: 'bg-purple-50', colorBorder: 'hover:border-purple-300', colorProgress: 'bg-purple-500', shadowGlow: 'hover:shadow-purple-500/20' },
    { id: 'chem10', name: 'الكيمياء العضوية', grade: 'الصف الحادي عشر', term: 'الفصل الدراسي الثاني', count: 210, icon: FlaskConical, colorText: 'text-emerald-600', colorBg: 'bg-emerald-50', colorBorder: 'hover:border-emerald-300', colorProgress: 'bg-emerald-500', shadowGlow: 'hover:shadow-emerald-500/20' },
    { id: 'bio10', name: 'علم الأحياء', grade: 'الصف العاشر', term: 'الفصل الدراسي الأول', count: 180, icon: Microscope, colorText: 'text-rose-600', colorBg: 'bg-rose-50', colorBorder: 'hover:border-rose-300', colorProgress: 'bg-rose-500', shadowGlow: 'hover:shadow-rose-500/20' },
    { id: 'arabic10', name: 'اللغة العربية', grade: 'الصف العاشر', term: 'الفصل الدراسي الأول', count: 450, icon: Languages, colorText: 'text-teal-600', colorBg: 'bg-teal-50', colorBorder: 'hover:border-teal-300', colorProgress: 'bg-teal-500', shadowGlow: 'hover:shadow-teal-500/20' },
    { id: 'eng10', name: 'اللغة الإنجليزية', grade: 'الصف الثاني عشر', term: 'الفصل الدراسي الثاني', count: 310, icon: Text, colorText: 'text-sky-600', colorBg: 'bg-sky-50', colorBorder: 'hover:border-sky-300', colorProgress: 'bg-sky-500', shadowGlow: 'hover:shadow-sky-500/20' },
    { id: 'history10', name: 'التاريخ المعاصر', grade: 'الصف العاشر', term: 'الفصل الدراسي الأول', count: 120, icon: Landmark, colorText: 'text-amber-600', colorBg: 'bg-amber-50', colorBorder: 'hover:border-amber-300', colorProgress: 'bg-amber-500', shadowGlow: 'hover:shadow-amber-500/20' },
    { id: 'geo10', name: 'الجغرافيا الخرائطية', grade: 'الصف الحادي عشر', term: 'الفصل الدراسي الأول', count: 95, icon: Globe, colorText: 'text-orange-600', colorBg: 'bg-orange-50', colorBorder: 'hover:border-orange-300', colorProgress: 'bg-orange-500', shadowGlow: 'hover:shadow-orange-500/20' },
    { id: 'cs10', name: 'الحاسب الآلي', grade: 'الصف العاشر', term: 'الفصل الدراسي الثاني', count: 275, icon: Monitor, colorText: 'text-blue-600', colorBg: 'bg-blue-50', colorBorder: 'hover:border-blue-300', colorProgress: 'bg-blue-500', shadowGlow: 'hover:shadow-blue-500/20' },
    { id: 'national10', name: 'التربية الوطنية', grade: 'الصف العاشر', term: 'الفصل الدراسي الأول', count: 65, icon: Flag, colorText: 'text-red-600', colorBg: 'bg-red-50', colorBorder: 'hover:border-red-300', colorProgress: 'bg-red-500', shadowGlow: 'hover:shadow-red-500/20' },
  ];

  const assessmentsList = [
    { id: 'a1', title: 'اختبار منتصف الفصل', subject: 'الفيزياء', count: 40, points: 100, target: 'الصف العاشر', status: 'PUBLISHED', date: '10 أكتوبر 2026', icon: Atom, colorText: 'text-indigo-600', colorBg: 'bg-indigo-50', colorBorder: 'border-indigo-100 hover:border-indigo-300', shadowGlow: 'hover:shadow-indigo-500/20' },
    { id: 'a2', title: 'تقييم شامل', subject: 'اللغة العربية', count: 50, points: 120, target: 'الصف الثاني عشر', status: 'DRAFT', date: '15 نوفمبر 2026', icon: BookOpen, colorText: 'text-emerald-600', colorBg: 'bg-emerald-50', colorBorder: 'border-emerald-100 hover:border-emerald-300', shadowGlow: 'hover:shadow-emerald-500/20' },
    { id: 'a3', title: 'اختبار قصير', subject: 'الرياضيات', count: 15, points: 30, target: 'الصف الحادي عشر', status: 'PUBLISHED', date: '21 ديسمبر 2026', icon: Calculator, colorText: 'text-rose-600', colorBg: 'bg-rose-50', colorBorder: 'border-rose-100 hover:border-rose-300', shadowGlow: 'hover:shadow-rose-500/20' },
    { id: 'a4', title: 'مراجعة نهائية', subject: 'الكيمياء', count: 60, points: 150, target: 'الصف العاشر', status: 'DRAFT', date: '5 يناير 2027', icon: FlaskConical, colorText: 'text-sky-600', colorBg: 'bg-sky-50', colorBorder: 'border-sky-100 hover:border-sky-300', shadowGlow: 'hover:shadow-sky-500/20' },
  ];




  const handleGenerateAI = () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setTimeout(() => {
      setNewQTitle('استناداً لنظرية التطور، ما هي المعايير الأساسية لبقاء الكائنات؟ (تم التوليد بالذكاء الاصطناعي بناءً على الوصف المدخل)');
      setIsGenerating(false);
    }, 1500);
  };

  const handleSaveQuestion = (stayInEditor: boolean = false) => {
    if (!newQTitle) return;
    const newQ: Question = {
      id: Date.now().toString(),
      title: newQTitle,
      unit: newQUnit || 'بدون وحدة',
      bloomLevel: newQBloom,
      difficulty: newQDiff,
      type: newQType,
      options: newQOptions
    };
    setQuestions([newQ, ...questions]);
    
    // Clear only text entry inputs to allow continuous fluid flow
    setNewQTitle('');
    setNewQOptions([
      { id: '1', text: '', isCorrect: true, mediaFile: null, mediaType: null, mediaPreviewUrl: null },
      { id: '2', text: '', isCorrect: false, mediaFile: null, mediaType: null, mediaPreviewUrl: null },
      { id: '3', text: '', isCorrect: false, mediaFile: null, mediaType: null, mediaPreviewUrl: null },
      { id: '4', text: '', isCorrect: false, mediaFile: null, mediaType: null, mediaPreviewUrl: null }
    ]);
    setNewQCorrectOption(0);
    setAiPrompt('');
    // CRITICAL: We explicitly do NOT clear newQType, newQUnit, newQBloom, or newQDiff.
    
    if (!stayInEditor) {
      setMgtStep('WORKSPACE');
    }
  };

  // بوابة الصلاحية الحقيقية — إما مشرف بنك الأسئلة (وصول كامل) أو معلم عنده صلاحية "إضافة أسئلة" بس
  const isSupervisor = authUser?.role === 'qb_supervisor';
  const canContribute = isSupervisor || (authUser?.role === 'teacher' && !!authUser?.canUseQuestionBank);

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
                <h1 className="text-3xl font-bold text-slate-800">بنك الأسئلة</h1>
                <p className="text-slate-500 font-medium">المركز الشامل لإدارة الأسئلة وتقييمات الطلاب</p>
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
                لوحة البيانات
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
                إدارة البنك
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
                التقييمات
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
                الاعتمادات
              </button>
              )}
            </div>
          </header>

          {/* DASHBOARD TAB */}
          {activeTab === 'DASHBOARD' && (
            <div className="w-full">
              <AnalyticsDashboard />
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
                      بنوك مركزية (الوزارة)
                    </button>
                    <button
                      onClick={() => setBankScope('shared')}
                      className={`px-8 py-2.5 text-sm font-bold rounded-lg transition-all shadow-none ${
                        bankScope === 'shared'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      بنوك مشتركة (المدرسة)
                    </button>
                    <button
                      onClick={() => setBankScope('private')}
                      className={`px-8 py-2.5 text-sm font-bold rounded-lg transition-all shadow-none ${
                        bankScope === 'private'
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                      }`}
                    >
                      بنكي الخاص (المعلم)
                    </button>
                  </div>

                  {/* Subject Filters */}
                  <div className="flex gap-4 items-end bg-white p-4 rounded-2xl border border-slate-100 shadow-none">
                     <div className="flex items-center gap-2 text-slate-400 mr-2 ml-4 mb-3">
                        <Filter size={18} />
                        <span className="font-bold text-sm">تصفية المواد:</span>
                     </div>
                     <HubFilterDropdown 
                       label="الصف الدراسي" 
                       value="كل الصفوف" 
                       options={['كل الصفوف', 'الصف العاشر', 'الصف الحادي عشر', 'الصف الثاني عشر']} 
                       onChange={() => {}} 
                     />
                     <HubFilterDropdown 
                       label="الفصل الدراسي" 
                       value="كل الفصول" 
                       options={['كل الفصول', 'الفصل الدراسي الأول', 'الفصل الدراسي الثاني']} 
                       onChange={() => {}} 
                     />
                     <HubFilterDropdown 
                       label="المادة" 
                       value="كل المواد" 
                       options={['كل المواد', 'الرياضيات المتقدمة', 'الفيزياء الكلاسيكية', 'الكيمياء العضوية', 'علم الأحياء', 'اللغة العربية', 'اللغة الإنجليزية', 'التاريخ المعاصر']} 
                       onChange={() => {}} 
                     />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {hubSubjects.map(sub => {
                      const Icon = sub.icon;
                      return (
                        <div 
                          key={sub.id} 
                          onClick={() => { setActiveSubject(sub); setMgtStep('WORKSPACE'); }}
                          className={`bg-white border border-slate-100 p-4 rounded-2xl transition-all duration-300 cursor-pointer group hover:-translate-y-1 hover:shadow-xl ${sub.shadowGlow} ${sub.colorBorder}`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1"></div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${sub.colorBg} ${sub.colorText}`}>
                              <Icon size={18} />
                            </div>
                          </div>
                          <h3 className="font-bold text-slate-800 text-base mb-0.5 group-hover:text-slate-900">{sub.name}</h3>
                          <p className="text-[11px] font-bold text-slate-400 mb-4">{sub.grade} • {sub.term}</p>
                          <div className="border-t border-slate-50 pt-3 mt-auto">
                            <div className="flex items-center justify-between mb-2">
                               <span className="text-xs font-semibold text-slate-700">{sub.count.toLocaleString('ar-SA')} سؤال</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div className={`h-full rounded-full ${sub.colorProgress}`} style={{ width: `${Math.min(100, sub.count / 5)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
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
                      <h2 className="text-2xl font-bold text-slate-800">{activeSubject.name}</h2>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      <button className="px-6 py-2.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-bold rounded-xl flex items-center gap-2 transition-colors shadow-none text-sm">
                        <UploadCloud size={18} />
                        استيراد بنك أسئلة (QTI XML / Excel)
                      </button>
                      <button className="px-6 py-2.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-bold rounded-xl flex items-center gap-2 transition-colors shadow-none text-sm">
                        <DownloadCloud size={18} />
                        تصدير البنك الحالي (QTI XML)
                      </button>
                      <button onClick={() => setMgtStep('FACTORY')} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-none text-sm">
                        <Plus size={18} />
                        إضافة سؤال جديد
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
                           placeholder="البحث في الأسئلة..." 
                           value={mainSearchQuery}
                           onChange={(e) => setMainSearchQuery(e.target.value)}
                           className="h-12 pl-4 pr-12 rounded-xl w-full border border-slate-200 text-sm focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 font-medium shadow-sm transition-all bg-white" 
                         />
                       </div>
                       
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 w-full">
                         <CustomSelect value={filterType} onChange={setFilterType} options={uniqueTypes} icon={ListChecks} label="نوع السؤال" />
                         <CustomSelect value={filterUnit} onChange={setFilterUnit} options={uniqueUnits} icon={BookOpen} label="الوحدة" />
                         <CustomSelect value={filterLesson} onChange={setFilterLesson} options={uniqueLessons} icon={LayoutTemplate} label="الدرس" />
                         <CustomSelect value={filterBloom} onChange={setFilterBloom} options={uniqueBlooms} icon={BrainCircuit} label="مستوى بلوم" />
                         <CustomSelect value={filterDifficulty} onChange={setFilterDifficulty} options={uniqueDifficulties} icon={Filter} label="الصعوبة" />
                       </div>
                    </div>

                    {/* Modern Data Table */}
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="px-6 py-5 font-bold text-slate-500 w-1/3 text-xs uppercase tracking-wider">نص السؤال</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider">نوع السؤال</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider">الوحدة</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-xs uppercase tracking-wider">الدرس</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-center text-xs uppercase tracking-wider">مستوى بلوم</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-center text-xs uppercase tracking-wider">الصعوبة</th>
                            <th className="px-6 py-5 font-bold text-slate-500 text-center text-xs uppercase tracking-wider">الإجراءات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50/80">
                          {filteredQuestions.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                لا توجد أسئلة تطابق معايير البحث الحالية.
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
                                    <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors flex items-center justify-center" aria-label="معاينة">
                                      <Eye size={14} />
                                    </button>
                                    <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 transition-colors flex items-center justify-center" aria-label="تعديل">
                                      <Edit2 size={14} />
                                    </button>
                                    <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors flex items-center justify-center" aria-label="حذف">
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
                            أسئلة الجلسة الحالية
                          </h3>
                          <p className="text-xs font-medium text-slate-400 mt-2">الأسئلة التي تمت إضافتها مؤخراً ({questions.length})</p>
                         </div>
                         <button onClick={() => setIsVaultOpen(false)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm transition-colors"><ArrowRight size={16} /></button>
                       </div>
                       
                       <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10 space-y-3">
                         <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                              type="text" 
                              placeholder="ابحث في نص السؤال..." 
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
                                  <option key={type} value={type}>{type === 'الكل' ? 'تصفية حسب النوع: الكل' : type}</option>
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
                                 <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-violet-600 hover:bg-violet-50 flex items-center justify-center transition-colors shadow-none"><Edit2 size={14} /></button>
                                 <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors shadow-none"><Trash2 size={14} /></button>
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
                              <p className="text-sm font-medium">لم يتم العثور على أي أسئلة</p>
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
                          بنوك الأسئلة <span className="text-slate-300">/</span> {activeSubject.name} <span className="text-slate-300">/</span> <span className="text-slate-800">إنشاء سؤال جديد</span>
                       </h2>
                       <div className="flex items-center gap-3">
                         <button 
                           onClick={() => setIsVaultOpen(true)}
                           className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-lg hover:bg-violet-700 transition-all shadow-sm group"
                         >
                           <Layers size={16} className="text-violet-200 group-hover:text-white transition-colors" />
                           سجل الأسئلة المضافة
                           <span className="bg-white text-violet-700 text-[10px] font-black min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full ml-1 border border-transparent">
                             {questions.length}
                           </span>
                         </button>
                         <button onClick={() => setMgtStep('WORKSPACE')} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"><ArrowRight size={16} /></button>
                       </div>
                    </div>

                    {/* STUDIO WORKSPACE */}
                    <div className="flex relative w-full min-h-[75vh] gap-6 items-start" dir="rtl">
                       
                       {/* 1. THE RIGHT-SIDE TYPE MENU (Question Types) */}
                       <div className="w-[280px] shrink-0 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden sticky top-6">
                           <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                               <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                  <LayoutGrid size={16} className="text-violet-600" /> أنواع الأسئلة
                               </h3>
                           </div>
                           <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 pb-20">
                               {[
                                  { label: 'اختيار من متعدد', icon: ListChecks },
                                  { label: 'صح أم خطأ', icon: CheckCircle2 },
                                  { label: 'إجابة قصيرة', icon: AlignRight },
                                  { label: 'توصيل', icon: GitMerge },
                                  { label: 'ترتيب', icon: ListOrdered },
                                  { label: 'أكمل الفراغ', icon: Type },
                                  { label: 'سؤال مقالي', icon: FileText },
                                  { label: 'منطقة تفاعلية', icon: Map },
                                  { label: 'تصنيف', icon: Layers },
                                  { label: 'رسم بياني', icon: LineChart },
                                  { label: 'سحب وإفلات', icon: Move },
                                  { label: 'مقطع صوتي', icon: Headphones },
                                  { label: 'إجابة رقمية', icon: Calculator },
                                  { label: 'استبيان', icon: BarChart }
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
                                        {type.label}
                                     </button>
                                  )
                               })}
                           </div>
                       </div>

                       {/* CENTRAL MAIN AREA (Context + Card) */}
                       <div className="flex-1 flex flex-col relative space-y-4">
                         
                         {/* 1. Target Bank Selector */}
                         <div className="flex flex-col gap-2 mb-2">
                           <label className="text-xs font-bold text-slate-500 px-1">مستودع حفظ السؤال:</label>
                           <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shadow-none h-12 items-center gap-1 w-full md:w-max">
                             {['بنك مركزي (الوزارة)', 'بنك مشترك (المدرسة)', 'بنكي الخاص (المعلم)'].map(bank => (
                               <button
                                 key={bank}
                                 onClick={() => setTargetBank(bank)}
                                 className={`px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-none h-full ${targetBank === bank ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                               >
                                 {bank}
                               </button>
                             ))}
                           </div>
                         </div>

                         {/* 2. THE GLOBAL CONTEXT ROW */}
                         <div className="grid grid-cols-1 md:grid-cols-5 gap-4 shrink-0 transition-all z-20">
                             <FormSelect label="الوحدة" value={newQUnit} onChange={setNewQUnit} options={['الوحدة الأولى', 'الوحدة الثانية', 'الوحدة الثالثة']} icon={BookOpen} />
                             <FormSelect label="الدرس" value={''} onChange={() => {}} options={['الدرس الأول', 'الدرس الثاني']} icon={FileText} />
                             <FormSelect label="مستوى بلوم" value={newQBloom} onChange={setNewQBloom} options={['تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'ابتكار']} icon={BrainCircuit} />
                             <FormSelect label="معيار المنهج / الهدف" value={qStandard} onChange={setQStandard} options={['الهدف الأول', 'الهدف الثاني']} icon={Flag} />
                             <div>
                               <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2 px-1">
                                 <Clock size={12} />
                                 زمن الحل (دقائق)
                               </label>
                               <input type="number" min="1" value={qTime} onChange={e => setQTime(e.target.value)} className="w-full h-[42px] px-3.5 rounded-xl border text-xs font-bold transition-all bg-slate-50 border-slate-100 text-slate-700 focus:outline-none focus:border-violet-300 shadow-none" placeholder="مثال: 5" />
                             </div>
                         </div>

                         {/* 3. THE MAIN QUESTION CARD */}
                         <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col relative overflow-hidden">
                             
                             {/* Card Header (Inline Metadata) */}
                             <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white shrink-0">
                                <div className="flex items-center gap-4">
                                   <div className="flex items-center gap-2">
                                      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                                        <Signal size={14} /> الصعوبة:
                                      </label>
                                      <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200/60 h-8 items-center gap-1">
                                        {['سهل', 'متوسط', 'صعب'].map(level => (
                                           <button
                                             key={level}
                                             onClick={() => setNewQDiff(level)}
                                             className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all shadow-none h-full ${newQDiff === level ? 'bg-white text-violet-700 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}
                                           >
                                             {level}
                                           </button>
                                        ))}
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                  <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:text-violet-600 transition-colors" aria-label="نسخ"><Copy size={16} /></button>
                                  <button className="w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:text-red-600 hover:border-red-200 transition-colors" aria-label="حذف"><Trash2 size={16} /></button>
                                </div>
                             </div>

                         {/* 3. THE QUESTION CANVAS */}
                         <div className="p-8 flex-1 bg-slate-50/30">
                            <div className="flex justify-between items-center mb-6">
                               <div className="text-violet-600 font-extrabold text-[10px] tracking-widest uppercase bg-violet-50 px-3 py-1 rounded-full border border-violet-100/50">
                                  السؤال 1 • {newQType}
                               </div>
                           </div>

                           {/* Question Title */}
                           <div className="mb-10 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-none focus-within:border-violet-300 transition-colors">
                              {/* WYSIWYG Toolbar */}
                              <div className="flex items-center gap-2 p-2 px-3 border-b border-gray-100 bg-slate-50">
                                <button className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="تسجيل صوتي">
                                  <Mic size={16} />
                                </button>
                                <button className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors" title="معادلات">
                                  <Sigma size={16} />
                                </button>
                              </div>
                              <textarea 
                                value={newQTitle}
                                onChange={e => setNewQTitle(e.target.value)}
                                placeholder="اكتب نص السؤال هنا..."
                                className="w-full p-4 text-xl font-bold text-slate-800 bg-transparent resize-y outline-none placeholder:text-slate-300 min-h-[140px]"
                                rows={5}
                              />
                           </div>

                           {/* Options / Inputs based on Type */}
                           <AnimatePresence mode="wait">
                              {newQType === 'اختيار من متعدد' && (
                                 <motion.div key="mcq" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 mb-4">
                                    {newQOptions.map((opt, idx) => {
                                      const isSelected = opt.isCorrect;
                                      const arabicLetters = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'];
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
                                             {arabicLetters[idx] || (idx + 1)}
                                          </button>
                                          <input 
                                             type="text" 
                                             value={opt.text}
                                             onChange={(e) => {
                                               const newOpts = [...newQOptions];
                                               newOpts[idx].text = e.target.value;
                                               setNewQOptions(newOpts);
                                             }}
                                             placeholder={`الخيار ${idx + 1}`}
                                             className="flex-1 w-full bg-transparent text-slate-800 text-sm font-bold focus:outline-none placeholder:font-normal placeholder:text-slate-400"
                                          />
                                          
                                          {opt.mediaPreviewUrl && (
                                            <div className="relative shrink-0 flex items-center justify-center mr-2">
                                               {opt.mediaType?.startsWith('image/') ? (
                                                  <img src={opt.mediaPreviewUrl} alt="preview" className="h-8 w-8 object-cover rounded-md border border-slate-200" />
                                               ) : (
                                                  <div className="h-8 w-8 bg-slate-800 rounded-md flex items-center justify-center border border-slate-700">
                                                     <Play size={14} className="text-white fill-white" />
                                                  </div>
                                               )}
                                               <button
                                                  onClick={(e) => {
                                                     e.stopPropagation();
                                                     const newOpts = [...newQOptions];
                                                     newOpts[idx].mediaFile = null;
                                                     newOpts[idx].mediaType = null;
                                                     newOpts[idx].mediaPreviewUrl = null;
                                                     setNewQOptions(newOpts);
                                                  }}
                                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
                                               >
                                                  <X size={10} strokeWidth={3} />
                                               </button>
                                            </div>
                                          )}

                                          <label
                                            className={`cursor-pointer shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${opt.mediaFile ? 'text-violet-600 bg-violet-50' : 'text-slate-400 hover:text-violet-600 hover:bg-slate-50'}`}
                                            title="إضافة وسائط (صورة/فيديو)"
                                          >
                                            <input 
                                               type="file" 
                                               accept="image/*,video/*" 
                                               className="hidden" 
                                               onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                     const newOpts = [...newQOptions];
                                                     newOpts[idx].mediaFile = file;
                                                     newOpts[idx].mediaType = file.type;
                                                     newOpts[idx].mediaPreviewUrl = URL.createObjectURL(file);
                                                     setNewQOptions(newOpts);
                                                  }
                                                  e.target.value = '';
                                               }} 
                                            />
                                            <Paperclip size={16} />
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
                                      const labels = ['صح', 'خطأ'];
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
                                      placeholder="نموذج الإجابة أو دليل التصحيح..."
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
                                        placeholder="الكلمة المفقودة (الإجابة الصحيحة)..."
                                        className="w-full bg-transparent text-slate-800 text-sm font-bold px-4 py-3 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
                                      />
                                    </div>
                                    <p className="text-xs font-semibold text-slate-400 px-2 mt-2">ملاحظة: استخدم الرمز <span className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">___</span> في نص السؤال للإشارة إلى الفراغ.</p>
                                 </motion.div>
                              )}
                           </AnimatePresence>

                           {/* Media Actions */}
                           <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-4 text-[13px] font-bold text-slate-400">
                               {newQType === 'اختيار من متعدد' && (
                                  <>
                                    <button 
                                      onClick={() => {
                                        if (newQOptions.length < 6) {
                                          setNewQOptions([...newQOptions, { id: Date.now().toString(), text: '', isCorrect: false, mediaFile: null, mediaType: null, mediaPreviewUrl: null }]);
                                        }
                                      }}
                                      disabled={newQOptions.length >= 6}
                                      className="flex items-center gap-2 hover:text-violet-600 transition-colors disabled:opacity-50 disabled:hover:text-slate-400"
                                    >
                                      <Plus size={16} /> إضافة خيار
                                    </button>
                                    <div className="w-px h-4 bg-slate-200"></div>
                                  </>
                               )}
                               <button className="flex items-center gap-2 hover:text-violet-600 transition-colors">
                                 <MessageSquare size={16} strokeWidth={2.5} /> وسائط وملاحظات إضافية
                               </button>
                           </div>
                       </div>

                       {/* 4. DEDICATED ACTION BAR */}
                       <div className="relative mt-auto p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end z-10 space-x-reverse space-x-3">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => {}} 
                              className="px-6 py-2.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 font-bold rounded-xl transition-colors shadow-none flex items-center gap-2 text-sm"
                            >
                              <RefreshCw size={16} />
                              فحص التطابق / التكرار
                            </button>
                            <button 
                              onClick={() => { handleSaveQuestion(true); setIsVaultOpen(true); }} 
                              disabled={!newQTitle} 
                              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-none flex items-center gap-2 text-sm"
                            >
                              <Plus size={16} />
                              حفظ وإضافة جديد
                            </button>
                            <button 
                              onClick={() => handleSaveQuestion(false)} 
                              disabled={!newQTitle} 
                              className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 font-bold rounded-xl transition-colors shadow-none text-sm"
                            >
                              حفظ والعودة
                            </button>
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
                      <h2 className="text-xl font-bold text-slate-800">مكتبة التقييمات</h2>
                      <p className="text-sm font-medium text-slate-500 mt-1">إدارة الاختبارات والتقييمات المحفوظة وتعيينها للطلاب</p>
                    </div>
                    <button onClick={() => setAssessmentView('BLUEPRINT_FORM')} className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-none">
                      <Plus size={18} />
                      إنشاء تقييم بالمعايير
                    </button>
                  </div>

                  {/* Assessment Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {assessmentsList.map(assessment => {
                      const Icon = assessment.icon;
                      return (
                      <div key={assessment.id} className={`bg-white border ${assessment.colorBorder} p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${assessment.shadowGlow} group flex flex-col`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-12 h-12 ${assessment.colorBg} ${assessment.colorText} rounded-2xl flex items-center justify-center`}>
                            <Icon size={24} />
                          </div>
                          {assessment.status === 'PUBLISHED' ? (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">منشور</span>
                          ) : (
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">مسودة</span>
                          )}
                        </div>
                        
                        <div className="mb-4 flex-1">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center border ${assessment.colorBg} border-white ${assessment.colorText}`}>{assessment.subject}</span>
                          </div>
                          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2">{assessment.title}</h3>
                          <p className="text-xs font-bold text-slate-400">{assessment.target} • {assessment.date}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-5 pt-4 border-t border-slate-100 mt-auto">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-slate-400 mb-0.5">الأسئلة</span>
                             <span className="text-sm font-black text-slate-700">{assessment.count} سؤال</span>
                           </div>
                           <div className="w-px h-8 bg-slate-200"></div>
                           <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-slate-400 mb-0.5">إجمالي الدرجات</span>
                             <span className="text-sm font-black text-slate-700">{assessment.points} نقطة</span>
                           </div>
                        </div>

                        <button onClick={() => setAssessmentView('SETTINGS')} className="w-full py-3 text-sm font-bold text-slate-700 bg-slate-50 hover:bg-violet-600 hover:text-white border border-slate-200 hover:border-violet-600 rounded-xl transition-colors flex items-center justify-center gap-2">
                          <Settings2 size={18} />
                          ضبط الإعدادات والنشر
                        </button>
                      </div>
                    )})}
                  </div>
                </motion.div>
              )}

              {assessmentView === 'BLUEPRINT_FORM' && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="max-w-5xl mx-auto space-y-6 pb-24">
                  {/* Header & Back */}
                  <div className="flex items-center justify-between mb-2">
                     <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        التقييمات <span className="text-slate-300">/</span> <span className="text-slate-800">محرك بناء المعايير</span>
                     </h2>
                     <button onClick={() => setAssessmentView('LIBRARY')} className="w-10 h-10 bg-white border border-slate-200 text-slate-500 rounded-xl flex items-center justify-center hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-none">
                       <ArrowRight size={20} />
                     </button>
                  </div>

                  {/* 1. SECTION 1: CORE ASSESSMENT DATA */}
                  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none">
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div className="flex flex-col">
                         <label className="text-sm text-slate-500 mb-1 font-bold">اسم التقييم</label>
                         <input type="text" placeholder="مثال: التقييم الختامي..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors" />
                       </div>
                       <div className="flex flex-col">
                         <label className="text-sm text-slate-500 mb-1 font-bold">المادة</label>
                         <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors">
                           <option>الفيزياء الكلاسيكية</option>
                           <option>الرياضيات المتقدمة</option>
                         </select>
                       </div>
                       <div className="flex flex-col">
                         <label className="text-sm text-slate-500 mb-1 font-bold">الوحدات المستهدفة</label>
                         <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer">
                           <option>كل الوحدات</option>
                           <option>الوحدة الأولى: الميكانيكا</option>
                           <option>الوحدة الثانية: الديناميكا الحرارية</option>
                         </select>
                       </div>
                       <div className="flex flex-col">
                         <label className="text-sm text-slate-500 mb-1 font-bold">إجمالي الأسئلة</label>
                         <input type="number" value={TotalQuestions} onChange={(e) => setTotalQuestions(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors" />
                       </div>
                     </div>
                  </div>

                  {/* 2. SECTION 2: CRITERIA ENGINEERING CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CARD A */}
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none flex flex-col">
                      <div className="flex items-center justify-between mb-6">
                         <h3 className="font-bold text-slate-800 text-lg">توزيع مستويات الصعوبة</h3>
                         <span className={`text-xs font-bold px-2 py-1 rounded-md ${diffTotal === 100 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>إجمالي النسبة: {diffTotal}%</span>
                      </div>
                      <div className="space-y-6 flex-1">
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-sm font-bold text-slate-600">سهل</span>
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
                             <span className="text-sm font-bold text-slate-600">متوسط</span>
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
                             <span className="text-sm font-bold text-slate-600">صعب</span>
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
                         <h3 className="font-bold text-slate-800 text-lg">توزيع مستويات بلوم المعرفية</h3>
                         <span className={`text-xs font-bold px-2 py-1 rounded-md ${bloomTotal === 100 ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>إجمالي النسبة: {bloomTotal}%</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                         <div className="flex flex-col gap-2">
                           <div className="flex items-center justify-between">
                             <span className="text-xs font-bold text-slate-600">تذكر</span>
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
                             <span className="text-xs font-bold text-slate-600">فهم</span>
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
                             <span className="text-xs font-bold text-slate-600">تطبيق</span>
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
                             <span className="text-xs font-bold text-slate-600">تحليل</span>
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
                             <span className="text-xs font-bold text-slate-600">تقييم</span>
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
                             <span className="text-xs font-bold text-slate-600">ابتكار</span>
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
                     <h3 className="font-bold text-slate-800 text-lg mb-4">توزيع أنواع الأسئلة</h3>
                     
                     <div className="mb-6">
                       <h4 className="text-sm font-bold text-slate-500 mb-3">اختر الأنواع</h4>
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
                               {type}
                             </button>
                           );
                         })}
                       </div>
                     </div>

                     {selectedTypes.length > 0 && (
                       <div>
                         <h4 className="text-sm font-bold text-slate-500 mb-3">الأنواع المحددة</h4>
                         <div className="flex flex-col gap-3">
                           {selectedTypes.map((type) => {
                             const count = typeCounts[type] || 0;
                             const percentage = typePercentages[type] || 0;
                             
                             return (
                               <div key={type} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                 <span className="font-bold text-slate-700 text-sm">{type}</span>
                                 <div className="flex items-center gap-4">
                                   <div className="flex items-center gap-2">
                                     <span className="text-xs font-bold text-slate-400">العدد</span>
                                     <input 
                                       type="number" 
                                       min="0" 
                                       value={count} 
                                       onChange={(e) => handleTypeCountChange(type, Number(e.target.value))} 
                                       className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-center focus:outline-none focus:border-violet-500 transition-colors" 
                                     />
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <span className="text-xs font-bold text-slate-400">النسبة</span>
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
                        اختيار الأسئلة يدوياً
                     </button>
                     <button onClick={() => setAssessmentView('BLUEPRINT_REVIEW')} className="w-full md:w-auto px-8 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm">
                        <Bot size={18} />
                        توليد آلي بالذكاء الاصطناعي
                     </button>
                  </div>

                </motion.div>
              )}

              {assessmentView === 'MANUAL_SELECTION' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto pb-24">
                  {/* Header & Back */}
                  <div className="flex items-center justify-between mb-6">
                     <h2 className="text-sm font-bold text-slate-500 flex items-center gap-2">
                        التقييمات <span className="text-slate-300">/</span> محرك بناء المعايير <span className="text-slate-300">/</span> <span className="text-slate-800">اختيار الأسئلة يدوياً</span>
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
                            <h3 className="font-bold text-slate-800 text-center w-full mb-6">المراقب الذكي للمعايير</h3>
                            
                            <div className="w-32 h-32 relative mb-4">
                               <svg className="w-full h-full -rotate-90">
                                 <circle cx="64" cy="64" r="56" fill="none" className="stroke-slate-100" strokeWidth="8" />
                                 <circle cx="64" cy="64" r="56" fill="none" className="stroke-violet-600 transition-all duration-500 ease-out" strokeWidth="8" strokeLinecap="round" strokeDasharray="351.85" strokeDashoffset={351.85 - (351.85 * (Math.min(TotalQuestions > 0 ? manualSelectedQuestions.length / TotalQuestions : 0, 1)))} />
                               </svg>
                               <div className="absolute inset-0 flex items-center justify-center">
                                 <span className="font-black text-violet-700 text-3xl">{TotalQuestions > 0 ? Math.round((manualSelectedQuestions.length / TotalQuestions) * 100) : 0}%</span>
                               </div>
                            </div>
                            <p className="text-sm font-bold text-slate-500 text-center">تم اختيار <span className="text-violet-600">{manualSelectedQuestions.length}</span> من أصل <span className="text-slate-800">{TotalQuestions}</span> أسئلة</p>
                         </div>

                         {/* Compliance Checklist */}
                         <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm">حالة المعايير</h3>
                            <ul className="space-y-3">
                              <li className="flex items-center gap-3 text-sm">
                                <span className={`w-2 h-2 rounded-full ${manualSelectedQuestions.length >= (TotalQuestions * diffHard / 100) ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <span className="font-bold text-slate-600 flex-1">أسئلة صعبة ({Math.round(TotalQuestions * diffHard / 100)})</span>
                              </li>
                              <li className="flex items-center gap-3 text-sm">
                                <span className={`w-2 h-2 rounded-full ${manualSelectedQuestions.length >= (TotalQuestions * diffEasy / 100) ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                <span className="font-bold text-slate-600 flex-1">أسئلة سهلة ({Math.round(TotalQuestions * diffEasy / 100)})</span>
                              </li>
                              <li className="flex items-center gap-3 text-sm">
                                <span className={`w-2 h-2 rounded-full ${manualSelectedQuestions.length >= (TotalQuestions * bloomRemember / 100) ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                                <span className="font-bold text-slate-600 flex-1">معيار التذكر ({Math.round(TotalQuestions * bloomRemember / 100)})</span>
                              </li>
                              <li className="flex items-center gap-3 text-sm">
                                <span className={`w-2 h-2 rounded-full ${manualSelectedQuestions.length >= (TotalQuestions * bloomApply / 100) ? 'bg-emerald-500' : 'bg-amber-400'}`}></span>
                                <span className="font-bold text-slate-600 flex-1">معيار التطبيق ({Math.round(TotalQuestions * bloomApply / 100)})</span>
                              </li>
                            </ul>
                         </div>

                         {/* Action Footer */}
                         <button 
                           onClick={() => setAssessmentView('BLUEPRINT_REVIEW')}
                           disabled={manualSelectedQuestions.length === 0}
                           className={`w-full py-4 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-sm ${
                             manualSelectedQuestions.length === TotalQuestions ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
                           }`}
                         >
                           {manualSelectedQuestions.length === TotalQuestions ? <CheckCircle2 size={18} /> : <Eye size={18} />}
                           {manualSelectedQuestions.length === TotalQuestions ? 'اعتماد التقييم النهائي' : 'مراجعة الأسئلة المختارة'}
                         </button>
                       </div>
                     </div>

                     {/* RIGHT COLUMN: QUESTION REPOSITORY (span 8) */}
                     <div className="lg:col-span-8 order-1 lg:order-2 flex flex-col h-[calc(100vh-180px)]">
                       <div className="bg-slate-50 pb-4 pt-2 -mt-2 shrink-0">
                         <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                           <input type="text" placeholder="ابحث في مخزن الأسئلة..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors" />
                           <div className="flex gap-2 items-center overflow-x-auto custom-scrollbar pb-1">
                             <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg px-3 py-2 outline-none focus:border-violet-500 cursor-pointer">
                               <option>الوحدة (الكل)</option>
                             </select>
                             <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg px-3 py-2 outline-none focus:border-violet-500 cursor-pointer">
                               <option>النوع (الكل)</option>
                             </select>
                             <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg px-3 py-2 outline-none focus:border-violet-500 cursor-pointer">
                               <option>الصعوبة (الكل)</option>
                             </select>
                             <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg px-3 py-2 outline-none focus:border-violet-500 cursor-pointer">
                               <option>مستوى بلوم (الكل)</option>
                             </select>
                           </div>
                         </div>
                       </div>
                       
                       <div className="flex-1 overflow-y-auto pl-2 space-y-4 custom-scrollbar">
                         {/* We will reuse our generatedQuestions array to show some available questions to select */}
                         {[...savedQuestions, {id: 'm1', title: 'علل: لا يمكن اعتبار الضوء موجة ميكانيكية.', options: [], type: 'مقال', bloom: 'تحليل', diff: 'صعب', correctIdx: -1}, {id: 'm2', title: 'الزخم هو حاصل ضرب الكتلة في التسارع', options: ['صح', 'خطأ'], type: 'صح أم خطأ', bloom: 'تذكر', diff: 'سهل', correctIdx: 1}].map((q) => {
                            const isSelected = manualSelectedQuestions.includes(q.id);
                            return (
                               <div key={q.id} className={`bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 ${isSelected ? 'border-violet-500 ring-1 ring-violet-500/20 shadow-violet-500/10' : 'border-slate-200 hover:border-slate-300'}`}>
                                 <div className="flex gap-4">
                                   <div className="flex-1">
                                     <p className="text-sm font-bold text-slate-800 mb-3 leading-relaxed">{q.title}</p>
                                     <div className="flex flex-wrap gap-2 mb-4">
                                       <span className="text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-600 px-2 py-1 rounded">{q.type}</span>
                                       <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-1 rounded">{q.bloom}</span>
                                       <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">{q.diff}</span>
                                     </div>
                                     {q.options && q.options.length > 0 && (
                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
                                         {q.options.map((opt, oIdx) => (
                                           <div key={oIdx} className={`text-xs font-bold p-2 rounded-lg border ${oIdx === q.correctIdx ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                             {opt}
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
                                       {isSelected ? <><Trash2 size={14} /> إزالة</> : <><Plus size={14} /> إضافة للتقييم</>}
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
                        التقييمات <span className="text-slate-300">/</span> <span className="text-slate-800">مراجعة التقييم المولد</span>
                     </h2>
                     <div className="flex gap-3">
                     </div>
                  </div>

                  {/* Compliance Meter */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-none flex items-center gap-6">
                    <div className="w-16 h-16 relative shrink-0">
                       <svg className="w-full h-full -rotate-90">
                         <circle cx="32" cy="32" r="28" fill="none" className="stroke-slate-100" strokeWidth="4" />
                         <circle cx="32" cy="32" r="28" fill="none" className="stroke-violet-600 outline-none" strokeWidth="4" strokeLinecap="round" strokeDasharray="175.93" strokeDashoffset={175.93 - (175.93 * 0.94)} />
                       </svg>
                       <div className="absolute inset-0 flex items-center justify-center">
                         <span className="font-black text-violet-700 text-lg">94%</span>
                       </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">تطابق عالي مع المعايير المطلوبة</h3>
                      <p className="text-sm font-medium text-slate-500 mt-1">تم تحقيق 94% من معايير التوزيع للبلوم والصعوبة. يمكنك مراجعة الأسئلة واستبدالها إذا لزم الأمر.</p>
                    </div>
                  </div>

                  {/* Selected Questions List */}
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-none">
                     <div className="flex items-center justify-between mb-6">
                       <h3 className="text-lg font-bold text-slate-800">الأسئلة المختارة (20 سؤال)</h3>
                     </div>
                     <div className="space-y-3">
                       {savedQuestions.map((q, idx) => {
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
                               <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded">{q.bloom}</span>
                               <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{q.diff}</span>
                             </div>

                             {isExpanded && q.options && (
                               <div className="mt-4 pt-4 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {q.options.map((opt, oIdx) => (
                                     <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-lg border ${oIdx === q.correctIdx ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-slate-200 text-slate-700'}`}>
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${oIdx === q.correctIdx ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'}`}>
                                           {oIdx === q.correctIdx && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                        </div>
                                        <span className="text-sm font-bold">{opt}</span>
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
                               {isSwapping ? 'جارٍ...' : 'استبدال'}
                             </button>
                             {activeSwapMenuId === q.id && (
                                <DropdownMenu 
                                  options={[
                                    {label: 'استبدال ذكي آلي', icon: Bot},
                                    {label: 'استبدال يدوي', icon: MousePointerClick}
                                  ]} 
                                  onSelect={(opt) => {
                                     setActiveSwapMenuId(null);
                                     if (opt === 'استبدال ذكي آلي') {
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
                         تعديل المعايير
                       </button>
                       <button onClick={() => setAssessmentView('LIBRARY')} className="px-6 py-2.5 bg-violet-600 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-violet-700 transition-colors shadow-sm text-sm">
                         اعتماد وحفظ في المكتبة <Check size={16} />
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
                                   <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><RefreshCw size={18} className="text-violet-600" /> استبدال يدوي</h3>
                                   <p className="text-[11px] font-bold text-slate-500 mt-1">الأسئلة مفلترة لتتطابق مع المعايير المطلوبة</p>
                                 </div>
                                 <button onClick={() => setManualSwapModalQId(null)} className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors">
                                   <X size={16} />
                                 </button>
                               </div>
                               <div className="px-6 pb-4 space-y-3">
                                 <input type="text" placeholder="ابحث في الأسئلة البديلة..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors" />
                                 <div className="flex gap-2 items-center overflow-x-auto custom-scrollbar pb-1">
                                   <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-md px-2 py-1.5 outline-none focus:border-violet-500 cursor-pointer">
                                     <option>الوحدة (الكل)</option>
                                   </select>
                                   <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-md px-2 py-1.5 outline-none focus:border-violet-500 cursor-pointer">
                                     <option>النوع (الكل)</option>
                                   </select>
                                   <select className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-md px-2 py-1.5 outline-none focus:border-violet-500 cursor-pointer">
                                     <option>الصعوبة (مفلتر مسبقاً)</option>
                                   </select>
                                 </div>
                               </div>
                             </div>
                             
                             <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                               {[
                                 {id: 'alt1', title: 'علل: لا يعتبر الزجاج مادة بلورية.', options: ['لأنه سائل فائق التبريد', 'لأنه يتمدد بالحرارة', 'لأنه عازل للكهرباء', 'لأنه شفاف'], correctIdx: 0},
                                 {id: 'alt2', title: 'فسر التوتر السطحي للسوائل بناءً على القوى الجزيئية.', options: ['قوى التلاصق', 'قوى التماسك', 'قوى الاحتكاك', 'قوى الجاذبية'], correctIdx: 1}
                               ].map((alt) => (
                                 <div key={alt.id} className="p-4 border border-slate-200 rounded-xl hover:border-violet-300 transition-colors bg-white">
                                    <p className="text-sm font-bold text-slate-800 mb-3">{alt.title}</p>
                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                      {alt.options.map((opt, oIdx) => (
                                        <div key={oIdx} className={`text-xs font-bold p-2 rounded-lg border ${oIdx === alt.correctIdx ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                                          {opt}
                                        </div>
                                      ))}
                                    </div>
                                    <div className="flex justify-end">
                                      <button onClick={() => {
                                        setSavedQuestions(prev => prev.map(q => {
                                          if (q.id === manualSwapModalQId) {
                                            return { ...q, title: alt.title, options: alt.options, correctIdx: alt.correctIdx };
                                          }
                                          return q;
                                        }));
                                        setManualSwapModalQId(null);
                                        // highlight the swapped question
                                        setHighlightedIds(prev => [...prev, manualSwapModalQId]);
                                        setTimeout(() => {
                                          setHighlightedIds(prev => prev.filter(qId => qId !== manualSwapModalQId));
                                        }, 1500);
                                      }} className="px-5 py-2 bg-violet-50 text-violet-700 hover:bg-violet-100 font-bold rounded-lg transition-colors text-sm border border-violet-100 flex items-center gap-2">
                                        <Check size={14} /> اختيار
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
                    <h2 className="text-xl font-bold text-slate-800">إعدادات التقييم المتقدمة</h2>
                    <p className="text-sm font-medium text-slate-500">ضبط خصائص النشر، الوقت، والربط بسجل الدرجات للتقييم.</p>
                  </div>

                  <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 w-full">
                    {/* RIGHT SIDEBAR (Vertical Tabs) */}
                    <div className="lg:col-span-3 border-l border-slate-200 bg-white overflow-y-auto w-full">
                      <div className="p-4 space-y-1">
                        {[
                          { id: 'AVAILABILITY', label: 'الإتاحة والاستهداف', icon: Globe },
                          { id: 'DELIVERY', label: 'خيارات التقديم', icon: Play },
                          { id: 'GRADEBOOK', label: 'الربط بسجل الدرجات', icon: Award },
                          { id: 'RESULTS', label: 'النتائج والتغذية الراجعة', icon: BarChart },
                          { id: 'SECURITY', label: 'الأمان والقيود', icon: Settings2 }
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
                            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4 mb-6">الإتاحة والاستهداف</h3>
                            
                            <div className="border border-slate-200 rounded-2xl p-6 flex flex-col gap-8">
                              {/* Targeting Field */}
                              <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">تحديد المستهدفين</label>
                                <div className="relative w-full">
                                  <button onClick={(e) => { e.preventDefault(); setIsTargetDropdownOpen(!isTargetDropdownOpen); }} className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors shadow-none text-right hover:bg-slate-50">
                                    <span>{targetingType === 'ALL' ? 'كل طلاب الصف' : targetingType === 'CLASSES' ? 'فصول محددة' : 'طلاب محددين'}</span>
                                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isTargetDropdownOpen ? 'rotate-180' : ''}`} />
                                  </button>
                                  {/* Dropdown Menu Concept */}
                                  <AnimatePresence>
                                    {isTargetDropdownOpen && (
                                      <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsTargetDropdownOpen(false)}></div>
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-12 right-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden">
                                          <div className="p-1">
                                            <button onClick={(e) => { e.preventDefault(); setTargetingType('ALL'); setSelectedItems([]); setIsTargetDropdownOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg">كل طلاب الصف</button>
                                            <button onClick={(e) => { e.preventDefault(); setTargetingType('CLASSES'); setSelectedItems([]); setIsTargetDropdownOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">فصول محددة</button>
                                            <button onClick={(e) => { e.preventDefault(); setTargetingType('STUDENTS'); setSelectedItems([]); setIsTargetDropdownOpen(false); }} className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">طلاب محددين</button>
                                          </div>
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </div>
                                <p className="text-xs text-slate-400 mt-2 font-medium">اختر الفصول أو المجموعات المسموح لها بإجراء هذا التقييم.</p>

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
                                            placeholder="ابحث واختر..." 
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
                                                    const options = targetingType === 'CLASSES' ? mockClasses : mockStudents;
                                                    const filtered = options.filter(opt => opt.includes(searchQuery) && !selectedItems.includes(opt));
                                                    
                                                    if (filtered.length === 0) {
                                                      return <div className="p-4 text-center text-sm text-slate-500 font-medium">لا توجد نتائج مطابقة</div>;
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
                                <label className="text-sm font-bold text-slate-700 block">إتاحة التقييم</label>
                                <div className="flex flex-col sm:flex-row gap-6">
                                  <label className="cursor-pointer flex items-center gap-3 group" onClick={(e) => { e.preventDefault(); setAvailabilityMode('ALWAYS'); }}>
                                    {availabilityMode === 'ALWAYS' ? (
                                      <div className="w-5 h-5 rounded-full border-2 border-violet-600 flex justify-center items-center shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-violet-400 transition-colors shrink-0" />
                                    )}
                                    <span className={availabilityMode === 'ALWAYS' ? "text-sm font-bold text-violet-700" : "text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors"}>متاح دائماً</span>
                                  </label>

                                  <label className="cursor-pointer flex items-center gap-3 group" onClick={(e) => { e.preventDefault(); setAvailabilityMode('TIMEFRAME'); }}>
                                    {availabilityMode === 'TIMEFRAME' ? (
                                      <div className="w-5 h-5 rounded-full border-2 border-violet-600 flex justify-center items-center shrink-0">
                                        <div className="w-2.5 h-2.5 rounded-full bg-violet-600" />
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 group-hover:border-violet-400 transition-colors shrink-0" />
                                    )}
                                    <span className={availabilityMode === 'TIMEFRAME' ? "text-sm font-bold text-violet-700" : "text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors"}>تحديد فترة زمنية</span>
                                  </label>
                                </div>
                              </div>

                              {/* Date & Time Selectors */}
                              <div className={`flex flex-col gap-6 transition-all duration-300 ${availabilityMode === 'TIMEFRAME' ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none select-none'}`}>
                                {/* Start Row */}
                                <div>
                                  <label className="text-sm font-bold text-slate-700 block mb-2">تاريخ ووقت البدء</label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <button className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-right">
                                      <Calendar size={18} className="text-slate-400 shrink-0" />
                                      <span className="block text-sm font-bold text-slate-800">12 أكتوبر 2026</span>
                                    </button>
                                    <button className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-right">
                                      <Clock size={18} className="text-slate-400 shrink-0" />
                                      <span className="block text-sm font-bold text-slate-800">08:00 صباحاً</span>
                                    </button>
                                  </div>
                                </div>
                                
                                <hr className="border-slate-100 border-dashed" />
                                
                                {/* Due Row */}
                                <div>
                                  <label className="text-sm font-bold text-slate-700 block mb-2">تاريخ الاستحقاق</label>
                                  <div className="grid grid-cols-2 gap-4">
                                    <button className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-right">
                                      <Calendar size={18} className="text-slate-400 shrink-0" />
                                      <span className="block text-sm font-bold text-slate-800">15 أكتوبر 2026</span>
                                    </button>
                                    <button className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-right">
                                      <Clock size={18} className="text-slate-400 shrink-0" />
                                      <span className="block text-sm font-bold text-slate-800">11:59 مساءً</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'DELIVERY' && (
                          <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4 mb-6">خيارات التقديم</h3>
                            
                            {/* Container 1 (Time Limit) */}
                            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden divide-y divide-slate-100 mb-6">
                              <div className="flex justify-between items-center p-5">
                                <label className="text-sm font-bold text-slate-700">المدة الزمنية (بالدقائق)</label>
                                <input type="number" defaultValue="45" className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors hover:bg-slate-100" />
                              </div>
                              <div className="flex justify-between items-center p-5 bg-slate-50">
                                <label className="text-sm font-bold text-slate-700">عند انتهاء الوقت</label>
                                <div className="relative w-56 group">
                                  <button className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors shadow-none text-slate-700">
                                    <span>تسليم تلقائي للإجابات</span>
                                    <ChevronDown size={14} className="text-slate-400" />
                                  </button>
                                  <div className="absolute top-11 right-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 overflow-hidden">
                                    <div className="p-1">
                                      <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">تسليم تلقائي للإجابات</button>
                                      <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">فترة سماح 5 دقائق</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Container 2 (Toggles Group) */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100 mb-6">
                              <div className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50" onClick={() => setShuffleQuestions(!shuffleQuestions)}>
                                <span className="font-bold text-slate-700 text-sm">خلط الأسئلة</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${shuffleQuestions ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${shuffleQuestions ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50" onClick={() => setShuffleAnswers(!shuffleAnswers)}>
                                <span className="font-bold text-slate-700 text-sm">خلط الإجابات</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${shuffleAnswers ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${shuffleAnswers ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50" onClick={() => setShowOneQuestion(!showOneQuestion)}>
                                <span className="font-bold text-slate-700 text-sm">عرض سؤال واحد في كل مرة</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${showOneQuestion ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${showOneQuestion ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>
                              
                              <div className={`flex justify-between items-center p-5 bg-slate-50 transition-all duration-300 ${showOneQuestion ? 'opacity-100 pointer-events-auto cursor-pointer hover:bg-slate-100' : 'opacity-40 pointer-events-none select-none'}`} onClick={() => showOneQuestion && setPreventBacktracking(!preventBacktracking)}>
                                <span className="font-bold text-slate-600 text-sm">منع الرجوع للسؤال السابق</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${preventBacktracking ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${preventBacktracking ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Container 3 (Advanced Attempts) */}
                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm divide-y divide-slate-100 mb-6">
                              <div className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50" onClick={() => setAllowMultipleAttempts(!allowMultipleAttempts)}>
                                <span className="font-bold text-slate-700 text-sm">السماح بمحاولات متعددة</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${allowMultipleAttempts ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${allowMultipleAttempts ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>

                              <div className={`bg-slate-50 p-5 flex justify-between items-center transition-all duration-300 ${allowMultipleAttempts ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none select-none'}`}>
                                <label className="text-sm font-bold text-slate-600">طريقة احتساب الدرجة</label>
                                <div className="relative w-48 group">
                                  <button className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors shadow-none text-slate-700">
                                    <span>أعلى درجة</span>
                                    <ChevronDown size={14} className="text-slate-400" />
                                  </button>
                                  {/* Dropdown Menu Concept (Visible on hover for now to satisfy pure CSS) */}
                                  <div className="absolute top-11 right-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 overflow-hidden">
                                    <div className="p-1">
                                      <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">أعلى درجة</button>
                                      <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">متوسط الدرجات</button>
                                      <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">المحاولة الأخيرة</button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className={`bg-slate-50 p-5 flex justify-between items-center transition-all duration-300 ${allowMultipleAttempts ? 'opacity-100 pointer-events-auto' : 'opacity-40 pointer-events-none select-none'}`}>
                                <label className="text-sm font-bold text-slate-600">الانتظار بين المحاولات (بالساعات)</label>
                                <input type="number" defaultValue="24" className="w-24 bg-white border border-slate-200 rounded-lg px-3 py-2 text-center text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-colors hover:bg-slate-50" />
                              </div>
                            </div>

                            {/* Container 4 (Late Submission) */}
                            <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                              <div className="flex justify-between items-center p-5 cursor-pointer hover:bg-slate-50" onClick={() => setAllowLateSubmission(!allowLateSubmission)}>
                                <span className="font-bold text-slate-700 text-sm">السماح بالتسليم بعد تاريخ الاستحقاق (يُسجل كمتأخر)</span>
                                <div className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${allowLateSubmission ? 'bg-violet-600' : 'bg-slate-300'}`}>
                                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${allowLateSubmission ? 'left-0.5 translate-x-5' : 'left-0.5'}`}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {settingsTab === 'GRADEBOOK' && (
                          <div className="space-y-6">
                            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4 mb-6">الربط بسجل الدرجات</h3>

                            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                              {/* Card Header (The Toggle) */}
                              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 cursor-pointer" onClick={() => setAddToGradebook(!addToGradebook)}>
                                <div className="space-y-1">
                                  <span className="font-bold text-slate-800 text-base block">إدراج في دفتر الدرجات</span>
                                  <span className="text-sm font-medium text-slate-500 block">سيتم احتساب التقييم ضمن المجموع النهائي</span>
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
                                        <label className="text-sm font-bold text-slate-700">تصنيف التقييم</label>
                                        <div className="relative w-full group">
                                          <button className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:border-violet-500 transition-colors shadow-none text-slate-700">
                                            <span>أعمال سنة</span>
                                            <ChevronDown size={14} className="text-slate-400" />
                                          </button>
                                          {/* Headless Dropdown Menu */}
                                          <div className="absolute top-12 right-0 w-full bg-white border border-slate-200 shadow-xl rounded-xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-50 overflow-hidden">
                                            <div className="p-1">
                                              <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">أعمال سنة</button>
                                              <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">اختبار نصفي</button>
                                              <button className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg">مشاركة وتفاعل</button>
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
                                            <span className={gradebookCalculationMode === 'PERCENTAGE' ? "text-sm font-bold text-violet-700" : "text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors"}>نسبة مئوية</span>
                                          </label>
                                          
                                          <label className="cursor-pointer flex items-center gap-2 group" onClick={(e) => { e.preventDefault(); setGradebookCalculationMode('POINTS'); }}>
                                            {gradebookCalculationMode === 'POINTS' ? (
                                              <div className="w-4 h-4 rounded-full border-2 border-violet-600 flex justify-center items-center">
                                                <div className="w-2 h-2 rounded-full bg-violet-600" />
                                              </div>
                                            ) : (
                                              <div className="w-4 h-4 rounded-full border-2 border-slate-300 group-hover:border-violet-400 transition-colors" />
                                            )}
                                            <span className={gradebookCalculationMode === 'POINTS' ? "text-sm font-bold text-violet-700" : "text-sm font-medium text-slate-500 group-hover:text-slate-700 transition-colors"}>نقاط</span>
                                          </label>
                                        </div>
                                        
                                        {/* Number Input */}
                                        <div className="relative">
                                          <input 
                                            type="number" 
                                            defaultValue="20" 
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
                            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4 mb-6">النتائج والتغذية الراجعة</h3>
                            
                            <p className="text-sm font-bold text-slate-600 mb-2">ماذا يرى الطالب بعد التسليم؟</p>
                            <div className="space-y-3 max-w-lg">
                              {[
                                { id: 'SCORE_ONLY', title: 'الدرجة النهائية فقط', desc: 'يظهر للطالب الدرجة التي حصل عليها فقط.' },
                                { id: 'SCORE_ERRORS', title: 'الدرجة + الأخطاء', desc: 'يظهر للطالب أسئلته الخاطئة دون عرض الإجابة الصحيحة.' },
                                { id: 'FULL', title: 'الدرجة + الإجابات النموذجية', desc: 'مراجعة كاملة لكل الإجابات الصحيحة والخاطئة.'}
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
                            <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-4 mb-6">الأمان والقيود</h3>
                            
                            <div className="border border-gray-200 rounded-2xl p-6 flex flex-col gap-6">
                              
                              {/* Unique Passwords Toggle */}
                              <div className="space-y-3">
                                <label className="cursor-pointer flex items-center justify-between gap-4 group" onClick={(e) => { e.preventDefault(); setGenerateUniquePasswords(!generateUniquePasswords); }}>
                                  <div>
                                    <span className="font-bold text-slate-800 text-sm block">توليد كلمات مرور فريدة (ديناميكية)</span>
                                    <span className="text-xs text-slate-500 font-medium">إلغاء كلمة المرور الموحدة لزيادة الأمان ومنع الغش.</span>
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
                                          سيتم توليد كلمة مرور عشوائية ومختلفة لكل طالب تلقائياً، وإرسالها كإشعار آمن داخل ملفه الشخصي (البروفايل) فور بدء وقت الإتاحة.
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
                                    <span className="font-bold text-slate-800 text-sm block">تقييد المتصفح (منع نوافذ أخرى)</span>
                                    <span className="text-xs text-slate-500 font-medium">يتطلب متصفح آمن أو يغلق الاختبار عند فقدان التركيز.</span>
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
                    <button onClick={() => setAssessmentView('LIBRARY')} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-colors text-sm shadow-none">
                      حفظ كمسودة
                    </button>
                    <button onClick={() => setAssessmentView('LIBRARY')} className="px-8 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm text-sm">
                      <Globe size={18} />
                      نشر واعتماد التقييم
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* APPROVAL_HUB TAB */}
          {activeTab === 'APPROVAL_HUB' && (
            <div className="w-full">
              <ApprovalHub />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
