'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { AlertCircle, AlertTriangle, CheckCircle2, MessageSquare, Zap, ChevronDown, ChevronUp, UserX, TrendingDown, Activity, Sparkles, Bot, ShieldCheck, X, Info, Settings2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type RiskLevel = 'critical' | 'warning' | 'stable';

interface StudentRisk {
  id: string;
  name: string;
  nameEn: string;
  grade: string;
  className: string;
  avatar: string;
  risk?: RiskLevel;
  attendance: number;
  academicDrop: number;
  engagementAr: string;
  engagementEn: string;
  recentNotesAr: string;
  recentNotesEn: string;
}

const MOCK_STUDENTS: StudentRisk[] = [
  {
     id: 's1',
     name: 'أحمد محمود',
     nameEn: 'Ahmed Mahmoud',
     grade: '10',
     className: '10-A',
     avatar: 'https://picsum.photos/seed/ahmedm/100',
     attendance: 72,
     academicDrop: 25,
     engagementAr: 'منخفض جداً',
     engagementEn: 'Very Low',
     recentNotesAr: 'تغيب عن 3 حصص متتالية ولم يسلم الواجب الأخير.',
     recentNotesEn: 'Missed 3 consecutive classes and did not submit the last assignment.'
  },
  {
     id: 's2',
     name: 'سارة خالد',
     nameEn: 'Sarah Khaled',
     grade: '11',
     className: '11-B',
     avatar: 'https://picsum.photos/seed/sarahk/100',
     attendance: 85,
     academicDrop: 12,
     engagementAr: 'متوسط',
     engagementEn: 'Average',
     recentNotesAr: 'تراجع ملحوظ في درجات الاختبارات القصيرة.',
     recentNotesEn: 'Noticeable drop in short quiz grades.'
  },
  {
     id: 's3',
     name: 'يوسف العلي',
     nameEn: 'Yousef Al-Ali',
     grade: '10',
     className: '10-A',
     avatar: 'https://picsum.photos/seed/yousefa/100',
     attendance: 65,
     academicDrop: 30,
     engagementAr: 'منعدم',
     engagementEn: 'None',
     recentNotesAr: 'لا يتفاعل في الفصل إطلاقاً ودرجاته متدنية.',
     recentNotesEn: 'No in-class engagement, very low grades.'
  },
  {
     id: 's4',
     name: 'عمر زيدان',
     nameEn: 'Omar Zaidan',
     grade: '12',
     className: '12-C',
     avatar: 'https://picsum.photos/seed/omarz/100',
     attendance: 98,
     academicDrop: 0,
     engagementAr: 'مرتفع',
     engagementEn: 'High',
     recentNotesAr: 'مستوى مستقر ممتاز، تمت معالجة التأخر السابق بنجاح.',
     recentNotesEn: 'Excellent stable level, previous delay successfully handled.'
  },
  {
     id: 's5',
     name: 'ليان مصطفى',
     nameEn: 'Layan Mustafa',
     grade: '10',
     className: '10-B',
     avatar: 'https://picsum.photos/seed/layanm/100',
     attendance: 82,
     academicDrop: 8,
     engagementAr: 'متوسط',
     engagementEn: 'Average',
     recentNotesAr: 'تحتاج إلى دعم في مادة الرياضيات.',
     recentNotesEn: 'Needs support in Mathematics.'
  },
  {
     id: 's6',
     name: 'خالد النجار',
     nameEn: 'Khaled Al-Najjar',
     grade: '11',
     className: '11-A',
     avatar: 'https://picsum.photos/seed/khaledn/100',
     attendance: 96,
     academicDrop: 0,
     engagementAr: 'مرتفع',
     engagementEn: 'High',
     recentNotesAr: 'مشاركة فعالة ومستوى متقدم.',
     recentNotesEn: 'Active participation and advanced level.'
  },
  {
     id: 's7',
     name: 'دانة سالم',
     nameEn: 'Dana Salem',
     grade: '11',
     className: '11-B',
     avatar: 'https://picsum.photos/seed/danas/100',
     attendance: 68,
     academicDrop: 20,
     engagementAr: 'منخفض',
     engagementEn: 'Low',
     recentNotesAr: 'عدم تسليم المشاريع وتغيب متكرر.',
     recentNotesEn: 'Missing projects and frequent absences.'
  },
  {
     id: 's8',
     name: 'طارق عبدلله',
     nameEn: 'Tariq Abdullah',
     grade: '12',
     className: '12-A',
     avatar: 'https://picsum.photos/seed/tariqa/100',
     attendance: 88,
     academicDrop: 15,
     engagementAr: 'منخفض',
     engagementEn: 'Low',
     recentNotesAr: 'تراجع الاهتمام في الأسابيع الأخيرة.',
     recentNotesEn: 'Decreased interest in recent weeks.'
  },
  {
     id: 's9',
     name: 'نور حسن',
     nameEn: 'Noor Hassan',
     grade: '10',
     className: '10-A',
     avatar: 'https://picsum.photos/seed/noorh/100',
     attendance: 100,
     academicDrop: 0,
     engagementAr: 'مرتفع',
     engagementEn: 'High',
     recentNotesAr: 'طالبة مثالية ومتميزة.',
     recentNotesEn: 'Ideal and outstanding student.'
  },
  {
     id: 's10',
     name: 'عبدالرحمن سعد',
     nameEn: 'Abdulrahman Saad',
     grade: '12',
     className: '12-C',
     avatar: 'https://picsum.photos/seed/abdulrahmans/100',
     attendance: 60,
     academicDrop: 35,
     engagementAr: 'منعدم',
     engagementEn: 'None',
     recentNotesAr: 'انقطاع مستمر عن الحضور.',
     recentNotesEn: 'Continuous absence.'
  }
];

const CANNED_RESPONSES = {
  ar: [
    { label: 'تحذير غياب', text: 'يرجى الانتباه إلى الغياب الملحوظ مؤخراً وتأثيره على المستوى المكتسب.' },
    { label: 'تراجع أكاديمي ملحوظ', text: 'نلاحظ تراجعاً أكاديمياً غير معتاد في الدرجات الأخيرة، نود التحدث لمناقشة سبل الدعم.' },
    { label: 'برجاء الانتباه', text: 'برجاء الانتباه والالتزام بتسليم التكليفات في وقتها لتجنب التأثير على التقييم النهائي.' }
  ],
  en: [
    { label: 'Absence Warning', text: 'Please pay attention to the recent noticeable absences and their impact on academic progress.' },
    { label: 'Academic Drop', text: 'We notice an unusual academic drop in recent grades. We would like to discuss support options.' },
    { label: 'Please Note', text: 'Please ensure that assignments are submitted on time to avoid affecting the final evaluation.' }
  ]
};

function FlatDropdown({ options, value, onChange, placeholder }: { options: {id: string, label: string}[], value: string, onChange: (val: string) => void, placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = value === 'all' ? placeholder : options.find(o => o.id === value)?.label || placeholder;

  return (
    <div className="relative z-20" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-none w-full min-w-[140px]"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
            className="absolute top-full start-0 w-full mt-1 bg-white border border-gray-100 rounded-xl z-20 py-1 shadow-none"
          >
            <button
              onClick={() => { onChange('all'); setIsOpen(false); }}
              className="w-full flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 text-start font-bold"
            >
              <span className="flex-1">الكل (All)</span>
              {value === 'all' && <CheckCircle2 size={14} className="text-orange-500" />}
            </button>
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                className="w-full flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 text-start font-bold"
              >
                <span className="flex-1">{opt.label}</span>
                {value === opt.id && <CheckCircle2 size={14} className="text-orange-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EarlyWarningRadar({ language = 'ar' }: { language?: 'ar' | 'en' }) {
  const isRtl = language === 'ar';
  
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [selectedStudentForMessage, setSelectedStudentForMessage] = useState<StudentRisk | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendToParent, setSendToParent] = useState(true);

  // Settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [criticalAttThreshold, setCriticalAttThreshold] = useState(75);
  const [criticalDropThreshold, setCriticalDropThreshold] = useState(15);
  const [warningAttThreshold, setWarningAttThreshold] = useState(85);
  const [warningDropThreshold, setWarningDropThreshold] = useState(5);

  const computedStudents = useMemo(() => {
    return MOCK_STUDENTS.map(s => {
      let risk: RiskLevel = 'stable';
      if (s.attendance < criticalAttThreshold || s.academicDrop > criticalDropThreshold) {
        risk = 'critical';
      } else if (s.attendance < warningAttThreshold || s.academicDrop > warningDropThreshold) {
        risk = 'warning';
      }
      return { ...s, risk };
    });
  }, [criticalAttThreshold, criticalDropThreshold, warningAttThreshold, warningDropThreshold]);

  const filteredStudents = computedStudents.filter(s => {
    if (s.risk === 'stable') return false;
    const matchesRisk = activeFilter === 'all' || s.risk === activeFilter;
    const matchesGrade = gradeFilter === 'all' || s.grade === gradeFilter;
    const matchesClass = classFilter === 'all' || s.className === classFilter;
    return matchesRisk && matchesGrade && matchesClass;
  });

  const stats = {
    critical: computedStudents.filter(s => s.risk === 'critical').length,
    warning: computedStudents.filter(s => s.risk === 'warning').length,
    resolved: computedStudents.filter(s => s.risk === 'stable').length,
  };

  const getRiskColor = (risk?: RiskLevel) => {
    switch (risk) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-amber-500';
      case 'stable': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const gradeOptions = [
    { id: '10', label: isRtl ? 'الصف العاشر' : 'Grade 10' },
    { id: '11', label: isRtl ? 'الصف الحادي عشر' : 'Grade 11' },
    { id: '12', label: isRtl ? 'الصف الثاني عشر' : 'Grade 12' },
  ];

  const classOptions = Array.from(new Set(MOCK_STUDENTS.map(s => s.className))).map(c => ({ id: c, label: c }));

  const openMessageModal = (student: StudentRisk) => {
    setSelectedStudentForMessage(student);
    setMessageText('');
    setSendToParent(true);
    setIsMessageModalOpen(true);
  };

  const cannedList = CANNED_RESPONSES[isRtl ? 'ar' : 'en'];

  return (
    <div className="w-full flex justify-center text-gray-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-6xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {isRtl ? 'رادار التحذير المبكر' : 'Early Warning Radar'}
            </h1>
            <p className="text-sm text-gray-500">
              {isRtl ? 'نظام التحليلات التنبؤية والتتبع الآلي للطلاب' : 'Predictive analytics and automated student tracking system'}
            </p>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm font-bold"
          >
            <Settings2 size={16} />
            {isRtl ? 'إعدادات المعايير' : 'Criteria Settings'}
          </button>
        </div>

        {/* Top Overview Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 shadow-none flex items-center justify-between relative group">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-red-600">
                  {isRtl ? 'حالة حرجة' : 'Critical Risk'}
                </p>
                <Info size={14} className="text-red-400 cursor-help" />
                <div className="absolute top-[calc(100%-10px)] start-0 w-[240px] bg-gray-800 text-white text-[11px] font-bold p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-none border border-gray-700">
                  {isRtl ? `الغياب أقل من ${criticalAttThreshold}% | تراجع أكاديمي أكثر من ${criticalDropThreshold}%` : `Attendance < ${criticalAttThreshold}% | Academic drop > ${criticalDropThreshold}%`}
                </div>
              </div>
              <h2 className="text-3xl font-black text-red-700">{stats.critical}</h2>
            </div>
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-none">
              <AlertCircle size={24} />
            </div>
          </div>
          
          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 shadow-none flex items-center justify-between relative group">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-amber-600">
                  {isRtl ? 'في منطقة الخطر' : 'Warning Level'}
                </p>
                <Info size={14} className="text-amber-400 cursor-help" />
                <div className="absolute top-[calc(100%-10px)] start-0 w-[240px] bg-gray-800 text-white text-[11px] font-bold p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-none border border-gray-700">
                  {isRtl ? `الغياب أقل من ${warningAttThreshold}% | تراجع أكاديمي أكثر من ${warningDropThreshold}%` : `Attendance < ${warningAttThreshold}% | Academic drop > ${warningDropThreshold}%`}
                </div>
              </div>
              <h2 className="text-3xl font-black text-amber-700">{stats.warning}</h2>
            </div>
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-none">
              <AlertTriangle size={24} />
            </div>
          </div>

          <div className="bg-green-50/50 border border-green-100 rounded-2xl p-5 shadow-none flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-green-600 mb-1">
                {isRtl ? 'تم احتوائهم' : 'Resolved'}
              </p>
              <h2 className="text-3xl font-black text-green-700">{stats.resolved}</h2>
            </div>
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-none">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>

        {/* Filters and Tabs Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4 relative z-10">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
             <button 
               onClick={() => setActiveFilter('all')}
               className={`px-5 py-2 rounded-full text-sm font-bold shadow-none border transition-colors whitespace-nowrap ${
                 activeFilter === 'all' 
                   ? 'bg-gray-800 border-gray-800 text-white' 
                   : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
               }`}
             >
               {isRtl ? 'كل الطلاب' : 'All Students'}
             </button>
             <button 
               onClick={() => setActiveFilter('critical')}
               className={`px-5 py-2 rounded-full text-sm font-bold shadow-none border transition-colors whitespace-nowrap ${
                 activeFilter === 'critical' 
                   ? 'bg-red-50 border-red-200 text-red-700' 
                   : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
               }`}
             >
               {isRtl ? 'الحالات الحرجة' : 'Critical'}
             </button>
             <button 
               onClick={() => setActiveFilter('warning')}
               className={`px-5 py-2 rounded-full text-sm font-bold shadow-none border transition-colors whitespace-nowrap ${
                 activeFilter === 'warning' 
                   ? 'bg-amber-50 border-amber-200 text-amber-700' 
                   : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
               }`}
             >
                {isRtl ? 'تنبيهات الانخفاض' : 'Warnings'}
             </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-visible relative">
             <FlatDropdown 
               options={gradeOptions} 
               value={gradeFilter} 
               onChange={setGradeFilter} 
               placeholder={isRtl ? 'الصف الدراسي' : 'Grade'} 
             />
             <FlatDropdown 
               options={classOptions} 
               value={classFilter} 
               onChange={setClassFilter} 
               placeholder={isRtl ? 'الفصل' : 'Class'} 
             />
          </div>
        </div>

        {/* The Student Risk Roster */}
        <div className="space-y-3 z-0 relative">
          {filteredStudents.map(student => (
            <div 
              key={student.id} 
              className={`bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-none transition-colors border-s-4 ${
                student.risk === 'critical' ? 'border-s-red-500' :
                student.risk === 'warning' ? 'border-s-amber-500' : 'border-s-green-500'
              }`}
            >
              <div className="p-4 flex flex-col lg:flex-row lg:items-center gap-5">
                
                {/* 1. Profile */}
                <div className="flex items-center gap-4 lg:w-1/4 shrink-0">
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-full overflow-hidden border-2 shadow-none ${
                      student.risk === 'critical' ? 'border-red-100' :
                      student.risk === 'warning' ? 'border-amber-100' : 'border-green-100'
                    }`}>
                       <Image src={student.avatar} alt={student.nameEn} fill className="object-cover rounded-full" />
                    </div>
                    <div className={`absolute bottom-0 end-0 w-3.5 h-3.5 border-2 border-white rounded-full ${getRiskColor(student.risk)} shadow-none`} />
                  </div>
                  <div>
                     <h3 className="font-bold text-gray-900 text-base leading-tight m-0">{isRtl ? student.name : student.nameEn}</h3>
                     <p className="text-xs font-bold text-gray-500 mt-1">{isRtl ? 'الفصل:' : 'Class:'} {student.className}</p>
                  </div>
                </div>

                {/* 2. Mini Metrics Grid */}
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div className="flex flex-col bg-gray-50 border border-gray-100 rounded-xl p-3 shadow-none">
                     <span className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1.5">
                       <UserX size={12} className="text-gray-500" />
                       {isRtl ? 'الغياب' : 'Attendance'}
                     </span>
                     <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full shadow-none ${student.attendance < 75 ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                       <span className={`font-black text-sm ${student.attendance < 75 ? 'text-red-700' : 'text-gray-700'}`}>
                         {student.attendance}%
                       </span>
                     </div>
                  </div>
                  
                  <div className="flex flex-col bg-gray-50 border border-gray-100 rounded-xl p-3 shadow-none">
                     <span className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1.5">
                       <TrendingDown size={12} className="text-gray-500" />
                       {isRtl ? 'التراجع الأكاديمي' : 'Academic Drop'}
                     </span>
                     <div className="flex items-center gap-2">
                       <span className="font-black text-sm text-red-600" dir="ltr">
                         {student.academicDrop}%
                       </span>
                     </div>
                  </div>

                  <div className="flex flex-col bg-gray-50 border border-gray-100 rounded-xl p-3 shadow-none">
                     <span className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1.5">
                       <Activity size={12} className="text-gray-500" />
                       {isRtl ? 'التفاعل' : 'Engagement'}
                     </span>
                     <span className="font-bold text-sm text-gray-700 truncate">
                       {isRtl ? student.engagementAr : student.engagementEn}
                     </span>
                  </div>
                </div>

                {/* 3. Quick Actions */}
                <div className="flex items-center gap-2 lg:w-auto shrink-0 mt-4 lg:mt-0">
                  <button 
                    className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl text-sm font-bold transition-colors border border-transparent hover:border-orange-200 shadow-none"
                    onClick={() => {
                      alert(isRtl ? 'تم تخصيص مسار التمكين بنجاح' : 'Empowerment path assigned successfully');
                    }}
                  >
                    <Sparkles size={16} />
                    {isRtl ? 'مسار التمكين' : 'Empower'}
                  </button>
                  <button 
                    className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600 border border-gray-200 rounded-xl transition-colors shrink-0 shadow-none"
                    title={isRtl ? 'مراسلة ولي الأمر' : 'Contact Parent'}
                    onClick={() => openMessageModal(student)}
                  >
                    <MessageSquare size={16} />
                  </button>
                  <button 
                    onClick={() => setExpandedId(expandedId === student.id ? null : student.id)}
                    className="w-10 h-10 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700 rounded-xl transition-colors shrink-0 shadow-none"
                  >
                    {expandedId === student.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
              </div>

              {/* Accordion Details */}
              {expandedId === student.id && (
                <div className="px-4 pb-4 pt-1 bg-white border-t border-gray-50">
                   <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-4 shadow-none">
                     <p className="text-sm text-gray-700 leading-relaxed font-medium flex items-start gap-2">
                       <Bot size={18} className="text-orange-500 shrink-0 mt-0.5" />
                       <span className="italic">{isRtl ? student.recentNotesAr : student.recentNotesEn}</span>
                     </p>
                   </div>
                </div>
              )}
            </div>
          ))}

          {filteredStudents.length === 0 && (
            <div className="py-12 text-center text-gray-500 bg-gray-50 border border-gray-100 rounded-2xl shadow-none">
               <ShieldCheck size={40} className="mx-auto mb-3 text-green-500 opacity-60" />
               <p className="font-bold text-sm">{isRtl ? 'لا يوجد طلاب تطابق هذه التصفية' : 'No students match this filter'}</p>
            </div>
          )}
        </div>

      </div>

      {/* Quick Message Modal Overlay */}
      <AnimatePresence>
        {isMessageModalOpen && selectedStudentForMessage && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
               onClick={() => setIsMessageModalOpen(false)}
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-none flex flex-col max-h-[90vh]"
             >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                   <div className="flex items-center gap-3">
                     <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-100 shadow-none">
                       <Image src={selectedStudentForMessage.avatar} alt={selectedStudentForMessage.nameEn} fill className="object-cover rounded-full" />
                     </div>
                     <h2 className="text-base font-bold text-gray-900 leading-none">
                       {isRtl ? `إرسال تنبيه إلى ${selectedStudentForMessage.name}` : `Send Alert to ${selectedStudentForMessage.nameEn}`}
                     </h2>
                   </div>
                   <button 
                     onClick={() => setIsMessageModalOpen(false)} 
                     className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full p-1.5 transition-colors"
                   >
                     <X size={20} />
                   </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-shrink-0 flex-grow">
                   
                   {/* Canned Responses */}
                   <div className="mb-4">
                     <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">{isRtl ? 'ردود جاهزة' : 'Canned Responses'}</p>
                     <div className="flex flex-wrap gap-2">
                       {cannedList.map((canned, idx) => (
                         <button
                           key={idx}
                           onClick={() => setMessageText(prev => prev ? `${prev} ${canned.text}` : canned.text)}
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors shadow-none"
                         >
                           <Zap size={12} className="text-orange-400" />
                           {canned.label}
                         </button>
                       ))}
                     </div>
                   </div>

                   {/* Textarea */}
                   <textarea
                     value={messageText}
                     onChange={(e) => setMessageText(e.target.value)}
                     placeholder={isRtl ? 'اكتب رسالة التنبيه هنا...' : 'Type alert message here...'}
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 min-h-[140px] resize-none focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 transition-colors placeholder:text-gray-400 shadow-none"
                   />

                   {/* Parent Toggle */}
                   <div className="mt-5 flex items-center justify-between border border-gray-100 bg-white rounded-xl p-4 shadow-none">
                     <div>
                       <p className="text-sm font-bold text-gray-900">{isRtl ? 'إرسال نسخة من الإشعار لولي الأمر' : 'Send a copy to the parent'}</p>
                       <p className="text-xs text-gray-500 mt-0.5">{isRtl ? 'سيتم إشعار ولي الأمر من خلال تطبيق الهاتف' : 'The parent will be notified via mobile app'}</p>
                     </div>
                     <button
                       onClick={() => setSendToParent(!sendToParent)}
                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shadow-none border ${sendToParent ? 'bg-orange-500 border-orange-500' : 'bg-gray-200 border-gray-200'}`}
                     >
                       <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-none ${isRtl ? (sendToParent ? '-translate-x-6' : '-translate-x-1') : (sendToParent ? 'translate-x-6' : 'translate-x-1')}`} />
                     </button>
                   </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
                   <button 
                     onClick={() => setIsMessageModalOpen(false)}
                     className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-none"
                   >
                     {isRtl ? 'إلغاء' : 'Cancel'}
                   </button>
                   <button 
                     disabled={!messageText.trim()}
                     onClick={() => {
                        setIsMessageModalOpen(false);
                        alert(isRtl ? 'تم إرسال التنبيه بنجاح' : 'Alert sent successfully');
                     }}
                     className={`px-6 py-2 text-sm font-bold text-white rounded-xl transition-colors shadow-none ${messageText.trim() ? 'bg-orange-500 hover:bg-orange-600 border border-orange-500' : 'bg-gray-300 border-gray-300 cursor-not-allowed'}`}
                   >
                     {isRtl ? 'إرسال' : 'Send'}
                   </button>
                </div>

             </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Settings Modal Overlay */}
      <AnimatePresence>
        {isSettingsOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir={isRtl ? 'rtl' : 'ltr'}>
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
               onClick={() => setIsSettingsOpen(false)}
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 10 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 10 }}
               className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-none flex flex-col max-h-[90vh]"
             >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shadow-none">
                       <Settings2 size={16} />
                     </div>
                     <h2 className="text-base font-bold text-gray-900 leading-none">
                       {isRtl ? 'إعدادات معايير الرادار' : 'Radar Criteria Settings'}
                     </h2>
                   </div>
                   <button 
                     onClick={() => setIsSettingsOpen(false)} 
                     className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full p-1.5 transition-colors"
                   >
                     <X size={20} />
                   </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-shrink-0 flex-grow space-y-6">
                   
                   <div>
                     <h3 className="font-bold text-gray-800 text-sm mb-4 border-b border-gray-100 pb-2">{isRtl ? 'الحالة الحرجة (Critical Risk)' : 'Critical Risk'}</h3>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-xs font-bold text-gray-500 mb-1.5">{isRtl ? 'نسبة الغياب أقل من (%)' : 'Attendance less than (%)'}</label>
                         <input 
                           type="number" 
                           value={criticalAttThreshold}
                           onChange={(e) => setCriticalAttThreshold(Number(e.target.value))}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-colors shadow-none"
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-gray-500 mb-1.5">{isRtl ? 'تراجع أكاديمي أكثر من (%)' : 'Academic drop greater than (%)'}</label>
                         <input 
                           type="number" 
                           value={criticalDropThreshold}
                           onChange={(e) => setCriticalDropThreshold(Number(e.target.value))}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-colors shadow-none"
                         />
                       </div>
                     </div>
                   </div>

                   <div>
                     <h3 className="font-bold text-gray-800 text-sm mb-4 border-b border-gray-100 pb-2">{isRtl ? 'الإنذار (Warning Level)' : 'Warning Level'}</h3>
                     <div className="space-y-4">
                       <div>
                         <label className="block text-xs font-bold text-gray-500 mb-1.5">{isRtl ? 'نسبة الغياب أقل من (%)' : 'Attendance less than (%)'}</label>
                         <input 
                           type="number" 
                           value={warningAttThreshold}
                           onChange={(e) => setWarningAttThreshold(Number(e.target.value))}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors shadow-none"
                         />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-gray-500 mb-1.5">{isRtl ? 'تراجع أكاديمي أكثر من (%)' : 'Academic drop greater than (%)'}</label>
                         <input 
                           type="number" 
                           value={warningDropThreshold}
                           onChange={(e) => setWarningDropThreshold(Number(e.target.value))}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors shadow-none"
                         />
                       </div>
                     </div>
                   </div>

                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3 rounded-b-2xl">
                   <button 
                     onClick={() => setIsSettingsOpen(false)}
                     className="px-5 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-none"
                   >
                     {isRtl ? 'إلغاء' : 'Cancel'}
                   </button>
                   <button 
                     onClick={() => {
                        setIsSettingsOpen(false);
                        alert(isRtl ? 'تم حفظ المعايير بنجاح' : 'Criteria saved successfully');
                     }}
                     className="px-6 py-2 text-sm font-bold text-white bg-gray-800 hover:bg-gray-900 border border-gray-800 rounded-xl transition-colors shadow-none flex items-center gap-2"
                   >
                     <Save size={16} />
                     {isRtl ? 'حفظ' : 'Save'}
                   </button>
                </div>

             </motion.div>
           </div>
        )}
      </AnimatePresence>

    </div>
  );
}

