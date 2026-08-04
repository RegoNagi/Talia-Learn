'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertCircle, 
  BookOpen, 
  Clock, 
  FileText, 
  Video, 
  Users,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Globe,
  ChevronDown
} from 'lucide-react';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { motion, AnimatePresence } from 'motion/react';

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
        className="flex items-center justify-between gap-3 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-none w-full min-w-[160px]"
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

export default function ActivityStreamPage() {
  const [activeSpace, setActiveSpace] = React.useState<string | null>(null);
  const [isSidebarPinned, setIsSidebarPinned] = React.useState(false);
  const [language, setLanguage] = React.useState<'ar' | 'en'>('en');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');

  const gradeOptions = [
    { id: '10', label: language === 'ar' ? 'الصف العاشر' : 'Grade 10' },
    { id: '11', label: language === 'ar' ? 'الصف الحادي عشر' : 'Grade 11' },
    { id: '12', label: language === 'ar' ? 'الصف الثاني عشر' : 'Grade 12' },
  ];

  const classOptions = [
    { id: '10-A', label: '10-A' },
    { id: '10-B', label: '10-B' },
    { id: '11-A', label: '11-A' },
    { id: '11-B', label: '11-B' },
  ];

  const content = {
    ar: {
      title: "مسار الأنشطة",
      subtitle: "مرحباً يا أستاذ رياض، استعرض وجدول مهامك ودروسك عبر جميع فصولك.",
      gradeFilter: "الصف الدراسي",
      classFilter: "الفصل",
      sections: [
        {
          id: 'urgent',
          title: 'مهام عاجلة/متأخرة',
          items: [
            {
              id: 'u1',
              title: 'تصحيح 24 تكليف كيمياء',
              course: 'الكيمياء العضوية',
              time: 'متأخر منذ يومين',
              icon: FileCheck,
              status: 'urgent',
              classBadge: 'الصف 11-A',
              grade: '11',
              className: '11-A'
            },
            {
              id: 'u2',
              title: 'مراجعة 5 تنبيهات رادار حرجة',
              course: 'تفقد الغياب والمستوى',
              time: 'استجدت اليوم',
              icon: AlertTriangle,
              status: 'critical',
              classBadge: 'الصف 10-B',
              grade: '10',
              className: '10-B'
            }
          ]
        },
        {
          id: 'today',
          title: 'اليوم',
          items: [
            {
              id: 't1',
              title: 'بدء حصة البث المباشر (مراجعة الفصل الثالث)',
              course: 'فيزياء',
              time: 'الآن',
              icon: Video,
              status: 'live',
              classBadge: 'الصف 12',
              grade: '12',
              className: 'all'
            },
            {
              id: 't2',
              title: 'اجتماع مع أولياء الأمور (متابعة الأداء)',
              course: 'توجيه طلابي',
              time: 'اليوم، 2:00 مساءً',
              icon: Users,
              status: 'normal',
              classBadge: 'الصف 10-A',
              grade: '10',
              className: '10-A'
            }
          ]
        },
        {
          id: 'upcoming',
          title: 'الأسبوع القادم',
          items: [
            {
              id: 'n1',
              title: 'نشر امتحان منتصف الفصل',
              course: 'العلوم العامة',
              time: 'الأحد القادم، 8:00 صباحاً',
              icon: FileText,
              status: 'normal',
              classBadge: 'الصف 11-B',
              grade: '11',
              className: '11-B'
            }
          ]
        }
      ]
    },
    en: {
      title: "Activity Stream",
      subtitle: "Welcome Prof. Riad, review and schedule your tasks and classes across all your courses.",
      gradeFilter: "Grade",
      classFilter: "Class",
      sections: [
        {
          id: 'urgent',
          title: 'Urgent / Overdue Tasks',
          items: [
            {
              id: 'u1',
              title: 'Grade 24 Chemistry Assignments',
              course: 'Organic Chemistry',
              time: '2 days overdue',
              icon: FileCheck,
              status: 'urgent',
              classBadge: 'Grade 11-A',
              grade: '11',
              className: '11-A'
            },
            {
              id: 'u2',
              title: 'Review 5 Critical Radar Alerts',
              course: 'Attendance & Performance Check',
              time: 'Updated today',
              icon: AlertTriangle,
              status: 'critical',
              classBadge: 'Grade 10-B',
              grade: '10',
              className: '10-B'
            }
          ]
        },
        {
          id: 'today',
          title: 'Today',
          items: [
            {
              id: 't1',
              title: 'Start Live Broadcast (Chapter 3 Review)',
              course: 'Physics',
              time: 'Now',
              icon: Video,
              status: 'live',
              classBadge: 'Grade 12',
              grade: '12',
              className: 'all'
            },
            {
              id: 't2',
              title: 'Parent-Teacher Meeting (Performance Review)',
              course: 'Student Guidance',
              time: 'Today 2:00 PM',
              icon: Users,
              status: 'normal',
              classBadge: 'Grade 10-A',
              grade: '10',
              className: '10-A'
            }
          ]
        },
        {
          id: 'upcoming',
          title: 'Next Week',
          items: [
            {
              id: 'n1',
              title: 'Publish Mid-term Exam',
              course: 'General Science',
              time: 'Next Sunday, 8:00 AM',
              icon: FileText,
              status: 'normal',
              classBadge: 'Grade 11-B',
              grade: '11',
              className: '11-B'
            }
          ]
        }
      ]
    }
  };

  const currentContent = content[language];
  const isRtl = language === 'ar';

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden" dir={isRtl ? "rtl" : "ltr"} style={{ fontFamily: "'Cairo', sans-serif" }}>
      <GlobalSidebar 
        onSpaceSelect={setActiveSpace} 
        activeSpace={activeSpace} 
        isPinned={isSidebarPinned}
        setIsPinned={setIsSidebarPinned}
        language={language}
        onLanguageChange={setLanguage}
      />
      
      <main className="flex-1 h-full overflow-y-auto bg-gray-50/50 custom-scrollbar relative">
        <div className="max-w-[1200px] mx-auto w-full p-8 md:p-12">
          
          <header className={`mb-6 flex justify-between items-start`}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentContent.title}</h1>
              <p className="text-gray-500 text-base">{currentContent.subtitle}</p>
            </div>
            <button 
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit shrink-0`}
              type="button"
            >
              <Globe size={14} />
              <span dir="ltr">{language === 'ar' ? 'English' : 'عربي'}</span>
            </button>
          </header>

          {/* Top Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 pb-6 border-b border-gray-100 relative z-20">
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <FlatDropdown 
                  options={gradeOptions} 
                  value={gradeFilter} 
                  onChange={setGradeFilter} 
                  placeholder={currentContent.gradeFilter}
                />
                <FlatDropdown 
                  options={classOptions} 
                  value={classFilter} 
                  onChange={setClassFilter} 
                  placeholder={currentContent.classFilter}
                />
             </div>
          </div>

          <div className={`space-y-12 z-10 relative`}>
            {currentContent.sections.map((section) => {
              const filteredItems = section.items.filter(item => {
                const matchesGrade = gradeFilter === 'all' || item.grade === gradeFilter;
                const matchesClass = classFilter === 'all' || item.className === classFilter || item.className === 'all';
                return matchesGrade && matchesClass;
              });

              if (filteredItems.length === 0) return null;

              return (
                <section key={section.id}>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    {section.title}
                  </h2>
                  
                  <div className="flex flex-col gap-4">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      let cardStyles = "bg-white border border-gray-100 shadow-none border-s-4";
                      let borderLeftColor = "border-s-slate-200";
                      let iconBoxStyles = "bg-slate-50 text-slate-500";

                      if (item.status === 'urgent' || item.status === 'critical') {
                        borderLeftColor = "border-s-red-400";
                        iconBoxStyles = "bg-red-50 text-red-500";
                        cardStyles = "bg-white border border-red-50 shadow-none border-s-4";
                      } else if (item.status === 'live') {
                        borderLeftColor = "border-s-orange-400";
                        iconBoxStyles = "bg-orange-50 text-orange-500";
                      } else if (item.status === 'normal') {
                        borderLeftColor = "border-s-indigo-400";
                        iconBoxStyles = "bg-indigo-50 text-indigo-500";
                      }

                      return (
                        <div 
                          key={item.id} 
                          className={`flex items-start sm:items-center justify-between p-5 rounded-2xl transition-colors cursor-pointer hover:bg-gray-50/50 ${cardStyles} ${borderLeftColor}`}
                        >
                          <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row w-full sm:w-auto">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-none ${iconBoxStyles}`}>
                              <Icon size={20} />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <h3 className="text-base font-bold text-gray-900 leading-tight m-0">{item.title}</h3>
                                <div className="flex items-center gap-2 mt-0.5 sm:mt-0">
                                   <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold shadow-none leading-none tracking-wider whitespace-nowrap">
                                     {item.classBadge}
                                   </span>
                                   {item.status === 'live' && (
                                     <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 text-red-600 text-[10px] font-bold tracking-wide shadow-none">
                                       <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shadow-none"></span>
                                       {isRtl ? 'مباشر' : 'LIVE'}
                                     </span>
                                   )}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                                <span className="flex items-center gap-1">
                                  <BookOpen size={14} className="text-gray-400" />
                                  {item.course}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="flex items-center gap-1">
                                  <Clock size={14} className="text-gray-400" />
                                  <span className={item.status === 'urgent' || item.status === 'critical' ? 'text-red-500 font-bold' : ''}>{item.time}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

        </div>
      </main>
    </div>
  );
}

