'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Database, BookOpen, Activity, LayoutGrid, ChevronDown, Check, 
  Filter, TrendingUp, Presentation, BrainCircuit, AlignRight, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Sector, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

import { getBankAnalytics } from '@/services/questionBankData';
import { getGradeLevels, getSubjectGradeCombos } from '@/services/academicData';

// أيقونات افتراضية للأسئلة الحديثة حسب النوع (البيانات نفسها حقيقية، الأيقونة بس شكلية)
const typeIcons: Record<string, any> = {
  'اختيار من متعدد': AlignRight,
  'سؤال مقالي': FileText,
  'صح أم خطأ': BrainCircuit,
  'أكمل الفراغ': FileText,
};

// --- CUSTOM DROPDOWN COMPONENT ---
function FilterDropdown({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) {
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
    <div className="relative w-48 flex flex-col" ref={containerRef}>
      <span className="text-sm font-medium text-slate-500 mb-1">{label}</span>
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
            className="absolute top-full mt-2 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden"
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

// --- MAIN DASHBOARD COMPONENT ---
export function AnalyticsDashboard({ language = 'ar' }: { language?: 'ar' | 'en' }) {
  const chartLabelNames: Record<string, string> = {
    'سهل': 'Easy', 'متوسط': 'Medium', 'صعب': 'Hard',
    'تذكر': 'Remember', 'فهم': 'Understand', 'تطبيق': 'Apply', 'تحليل': 'Analyze', 'تقييم': 'Evaluate', 'ابتكار': 'Create',
  };
  const chartLabel = (name: string) => language === 'ar' ? name : (chartLabelNames[name] || name);
  const typeLabels: Record<string, string> = {
    'اختيار من متعدد': 'Multiple Choice',
    'سؤال مقالي': 'Essay',
    'صح أم خطأ': 'True/False',
    'أكمل الفراغ': 'Fill in the Blank',
  };
  const typeLabel = (type: string) => language === 'ar' ? type : (typeLabels[type] || type);
  const [grade, setGrade] = useState('كل الصفوف');
  const [subject, setSubject] = useState('كل المواد');
  const [timeRange, setTimeRange] = useState('أخر 30 يوم');

  const [bloomData, setBloomData] = useState<{ name: string; value: number }[]>([]);
  const [difficultyData, setDifficultyData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [typeData, setTypeData] = useState<{ subject: string; A: number; fullMark: number }[]>([]);
  const [recentQuestions, setRecentQuestions] = useState<{ title: string; type: string; time: string; subject: string }[]>([]);
  const [topSubjects, setTopSubjects] = useState<{ name: string; count: number; percent: number }[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [activeSubjectsCount, setActiveSubjectsCount] = useState(0);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [gradeOptions, setGradeOptions] = useState<string[]>(['كل الصفوف']);
  const [subjectOptions, setSubjectOptions] = useState<string[]>(['كل المواد']);

  useEffect(() => {
    getGradeLevels().then((grades) => setGradeOptions(['كل الصفوف', ...grades]));
    getSubjectGradeCombos({ isSupervisor: true }).then((combos) => {
      setSubjectOptions(['كل المواد', ...Array.from(new Set(combos.map((c) => c.subject)))]);
    });
  }, []);

  useEffect(() => {
    setIsLoadingAnalytics(true);
    const daysBack = timeRange === 'أخر 7 أيام' ? 7 : timeRange === 'أخر 30 يوم' ? 30 : timeRange === 'أخر 3 شهور' ? 90 : undefined;
    getBankAnalytics({
      grade: grade === 'كل الصفوف' ? undefined : grade,
      subject: subject === 'كل المواد' ? undefined : subject,
      daysBack,
    }).then((result) => {
      setBloomData(result.bloomData);
      setDifficultyData(result.difficultyData);
      setTypeData(result.typeData);
      setRecentQuestions(result.recentQuestions);
      setTopSubjects(result.topSubjects);
      setTotalQuestions(result.totalQuestions);
      setApprovedCount(result.approvedCount);
      setActiveSubjectsCount(result.activeSubjectsCount);
      setIsLoadingAnalytics(false);
    });
  }, [grade, subject, timeRange]);

  // Calculate generic total string 
  const totalQuestionsDifficulty = difficultyData.reduce((acc, curr) => acc + curr.value, 0).toLocaleString('en-US');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      
      {/* 1. GLOBAL FILTER BAR */}
      <div className="flex gap-4 items-end bg-white p-4 rounded-xl border border-slate-100 shadow-none">
         <div className="flex items-center gap-2 text-slate-400 mr-2 ml-4 mb-3">
            <Filter size={18} />
            <span className="font-bold text-sm">{language === 'ar' ? 'تصفية لوحة البيانات:' : 'Filter Dashboard:'}</span>
         </div>
         <FilterDropdown 
           label={language === 'ar' ? 'الصف الدراسي' : 'Grade'} 
           value={grade} 
           options={gradeOptions} 
           onChange={setGrade} 
         />
         <FilterDropdown 
           label={language === 'ar' ? 'المادة' : 'Subject'} 
           value={subject} 
           options={subjectOptions} 
           onChange={setSubject} 
         />
         <FilterDropdown 
           label={language === 'ar' ? 'النطاق الزمني' : 'Time Range'} 
           value={timeRange} 
           options={['أخر 7 أيام', 'أخر 30 يوم', 'أخر 3 شهور', 'هذا العام', 'فترة مخصصة...']} 
           onChange={setTimeRange} 
         />
         {timeRange === 'فترة مخصصة...' && (
           <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} className="flex items-center gap-4">
             <div className="flex flex-col">
               <span className="text-sm font-medium text-slate-500 mb-1">{language === 'ar' ? 'من:' : 'From:'}</span>
               <input type="date" className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500 transition-all shadow-none h-10 w-36" />
             </div>
             <div className="flex flex-col">
               <span className="text-sm font-medium text-slate-500 mb-1">{language === 'ar' ? 'إلى:' : 'To:'}</span>
               <input type="date" className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-violet-500 transition-all shadow-none h-10 w-36" />
             </div>
           </motion.div>
         )}
      </div>

      {isLoadingAnalytics && (
        <div className="text-center text-sm font-bold text-slate-400 py-2">{language === 'ar' ? 'جاري تحديث البيانات...' : 'Refreshing data...'}</div>
      )}

      {/* 2. TOP KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* Card 1 */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none flex justify-between items-center">
            <div className="flex flex-col">
               <div className="text-slate-500 font-bold text-sm mb-1">{language === 'ar' ? 'إجمالي الأسئلة في البنك' : 'Total Bank Questions'}</div>
               <div className="text-3xl font-black text-slate-800 tracking-tight">{totalQuestions.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</div>
            </div>
            <div className="bg-violet-50 text-violet-600 p-3 rounded-full shrink-0">
               <Database size={24} />
            </div>
         </div>
         {/* Card 2 */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none flex justify-between items-center">
            <div className="flex flex-col">
               <div className="text-slate-500 font-bold text-sm mb-1">{language === 'ar' ? 'المواد النشطة' : 'Active Subjects'}</div>
               <div className="text-3xl font-black text-slate-800 tracking-tight">{activeSubjectsCount}</div>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-full shrink-0">
               <BookOpen size={24} />
            </div>
         </div>
         {/* Card 3 */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none flex justify-between items-center">
            <div className="flex flex-col">
               <div className="text-slate-500 font-bold text-sm mb-1">{language === 'ar' ? 'الأسئلة المعتمدة' : 'Approved Questions'}</div>
               <div className="text-3xl font-black text-slate-800 tracking-tight">{approvedCount.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</div>
               <div className="text-[10px] font-bold text-emerald-500 mt-1">{language === 'ar' ? 'جاهزة للاستخدام في التقييمات' : 'Ready to use in assessments'}</div>
            </div>
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-full shrink-0">
               <Check size={24} />
            </div>
         </div>
         {/* Card 4 */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none flex justify-between items-center">
            <div className="flex flex-col">
               <div className="text-slate-500 font-bold text-sm mb-1">{language === 'ar' ? 'إجمالي أنواع الأسئلة المستخدمة' : 'Question Types Used'}</div>
               <div className="text-3xl font-black text-slate-800 tracking-tight">{typeData.length}</div>
            </div>
            <div className="bg-amber-50 text-amber-600 p-3 rounded-full shrink-0">
               <LayoutGrid size={24} />
            </div>
         </div>
      </div>

      {/* 3. VISUAL ANALYTICS - CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Chart 1 */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none flex flex-col">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
               <Presentation size={18} className="text-violet-600" /> {language === 'ar' ? 'توزيع مستويات بلوم المعرفية' : "Bloom's Taxonomy Distribution"}
            </h3>
            <div className="h-64 mt-auto">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={bloomData} barSize={32} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} tickFormatter={chartLabel} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                   <Tooltip 
                     cursor={{ fill: 'transparent' }} 
                     contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontWeight: 'bold' }} 
                   />
                   <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Chart 2 */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none flex flex-col relative">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
               <BrainCircuit size={18} className="text-violet-600" /> {language === 'ar' ? 'مستوى الصعوبة' : 'Difficulty Level'}
            </h3>
            <div className="h-64 relative mt-auto">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                   <Pie
                     data={difficultyData}
                     cx="50%"
                     cy="50%"
                     innerRadius={70}
                     outerRadius={100}
                     paddingAngle={2}
                     dataKey="value"
                     stroke="none"
                   >
                     {difficultyData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontWeight: 'bold' }} 
                     itemStyle={{ color: '#1e293b' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
               {/* Center Total */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-2">
                  <span className="text-2xl font-black text-slate-800 leading-none">{totalQuestionsDifficulty}</span>
                  <span className="text-xs font-bold text-slate-400 mt-1">{language === 'ar' ? 'سؤال' : 'questions'}</span>
               </div>
            </div>
            {/* Custom Legend */}
            <div className="flex justify-center gap-6 mt-4">
              {difficultyData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <span className="text-xs font-bold text-slate-600">{chartLabel(entry.name)}</span>
                </div>
              ))}
            </div>
         </div>

         {/* Chart 3 */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none flex flex-col">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
               <LayoutGrid size={18} className="text-violet-600" /> {language === 'ar' ? 'توزيع أنواع الأسئلة' : 'Question Type Distribution'}
            </h3>
            <div className="h-64 mt-auto -ml-4">
               <ResponsiveContainer width="100%" height="100%">
                 <RadarChart cx="50%" cy="50%" outerRadius={85} data={typeData}>
                   <PolarGrid stroke="#e2e8f0" />
                   <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                   <Radar name={language === 'ar' ? 'الأنواع' : 'Types'} dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)', fontWeight: 'bold' }} 
                   />
                 </RadarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* 4. INSIGHTS & TABLES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Left Panel */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none h-[380px] flex flex-col">
           <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Database size={18} className="text-violet-600" /> {language === 'ar' ? 'أحدث الأسئلة المضافة' : 'Recently Added Questions'}
             </div>
             <button className="text-sm font-bold text-violet-600 hover:text-violet-700">{language === 'ar' ? 'عرض الكل' : 'View All'}</button>
           </h3>
           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
             {recentQuestions.map((q, i) => {
               const Icon = typeIcons[q.type] || FileText;
               return (
                 <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group cursor-pointer">
                   <div className="w-10 h-10 rounded-lg bg-slate-50 group-hover:bg-violet-50 text-slate-400 group-hover:text-violet-600 flex items-center justify-center shrink-0 transition-colors">
                     <Icon size={18} />
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-slate-800 truncate mb-1">{q.title}</p>
                     <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-right">{typeLabel(q.type)}</span>
                        <span className="text-[10px] font-bold bg-violet-100 text-violet-700 px-2 py-0.5 rounded text-right">{q.subject}</span>
                       <span className="text-[11px] font-bold text-slate-400">{q.time}</span>
                     </div>
                   </div>
                 </div>
               );
             })}
           </div>
         </div>

         {/* Right Panel */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-none h-[380px] flex flex-col">
           <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
             <TrendingUp size={18} className="text-violet-600" /> {language === 'ar' ? 'أكثر المواد ثراءً بالأسئلة' : 'Subjects with Most Questions'}
           </h3>
           <div className="flex-1 flex flex-col justify-between">
             {topSubjects.map((sub, i) => (
               <div key={i} className="space-y-2">
                 <div className="flex items-center justify-between text-sm font-bold">
                   <span className="text-slate-700">{sub.name}</span>
                   <span className="text-slate-500">{sub.count.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')} {language === 'ar' ? 'سؤال' : 'questions'}</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }} 
                     animate={{ width: `${sub.percent}%` }} 
                     transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                     className="h-full bg-violet-500 rounded-full"
                   />
                 </div>
               </div>
             ))}
           </div>
         </div>
      </div>
      
    </motion.div>
  );
}
