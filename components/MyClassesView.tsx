'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  BookOpen, 
  Users, 
  Clock, 
  Globe, 
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';
import { ClassSpaceView } from '@/features/class-space/ClassSpaceView';

interface MyClassesViewProps {
  language: 'ar' | 'en';
  onLanguageChange?: (lang: 'ar' | 'en') => void;
  userRole: 'teacher' | 'student' | 'parent';
  defaultSubTab?: 'subjects' | 'space';
}

const dict = {
  ar: {
    myClasses: 'فصولي الدراسية',
    subjectsTab: 'المواد الدراسية',
    spaceTab: 'المساحة',
    welcomeTeacher: 'مرحباً بكِ، سارة! 👋',
    welcomeStudent: 'مرحباً بك، أليكس! 👋',
    welcomeParent: 'مرحباً بك السيد ديفيد! 👋',
    teacherSubtitle: 'لديكِ مهام لتقييمها في 3 فصول.',
    studentSubtitle: 'مستعد لحصصك اليوم؟',
    parentSubtitle: 'متابعة أداء أليكس.',
    teacherName: 'سارة جنكينز',
    studentName: 'أليكس جونسون',
    parentName: 'ديفيد جونسون',
    teacherRole: 'معلم أول • رياضيات',
    studentRole: 'طالب • 10-A',
    parentRole: 'ولي أمر',
    allClasses: 'جميع الفصول',
    yourCourses: 'دوراتك الدراسية',
    syllabusProgress: 'تقدم المنهج',
    studentsCount: '24 طالب',
  },
  en: {
    myClasses: 'My Classes',
    subjectsTab: 'Subjects',
    spaceTab: 'Space',
    welcomeTeacher: 'Welcome back, Sarah! 👋',
    welcomeStudent: 'Welcome back, Alex! 👋',
    welcomeParent: 'Welcome back, Mr. Johnson! 👋',
    teacherSubtitle: 'You have assignments to grade across 3 classes.',
    studentSubtitle: 'Ready for your classes today?',
    parentSubtitle: "Viewing Alex's dashboard.",
    teacherName: 'Sarah Jenkins',
    studentName: 'Alex Johnson',
    parentName: 'David Johnson',
    teacherRole: 'Senior Teacher • Mathematics',
    studentRole: 'Student • 10-A',
    parentRole: 'Parent',
    allClasses: 'All Classes',
    yourCourses: 'Your Courses',
    syllabusProgress: 'Syllabus Progress',
    studentsCount: '24 Students',
  }
};

const translatedCourses = {
  ar: {
    'chem101': { title: 'الكيمياء', nextDue: 'مطلوب تقرير المختبر غداً' },
    'eng201': { title: 'الأدب الإنجليزي', nextDue: 'مسودة المقال مطلوبة بعد يومين' },
    'phys301': { title: 'فيزياء متقدمة', nextDue: 'امتحان منتصف الفصل الجمعة' },
    'hist105': { title: 'تاريخ العالم', nextDue: 'مراجعة ورقة البحث' }
  },
  en: {
    'chem101': { title: 'Chemistry', nextDue: 'Lab Report due tomorrow' },
    'eng201': { title: 'English Literature', nextDue: 'Essay Draft due in 2 days' },
    'phys301': { title: 'Advanced Physics', nextDue: 'Midterm Exam Friday' },
    'hist105': { title: 'World History', nextDue: 'Research Paper review' }
  }
};

export function MyClassesView({
  language,
  onLanguageChange,
  userRole,
  defaultSubTab = 'space'
}: MyClassesViewProps) {
  const [activeTab, setActiveTab] = useState<'subjects' | 'space'>(defaultSubTab);
  const [activeFilter, setActiveFilter] = useState<string>('All Classes');

  const t = dict[language];

  const courses = [
    { 
      id: 'chem101', 
      title: translatedCourses[language]['chem101'].title, 
      code: 'CHEM 101', 
      className: '10-A', 
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600&h=400', 
      progress: 65, 
      nextDue: translatedCourses[language]['chem101'].nextDue, 
      pendingGradingCount: 5, 
      progressColor: 'bg-emerald-500' 
    },
    { 
      id: 'eng201', 
      title: translatedCourses[language]['eng201'].title, 
      code: 'ENG 201', 
      className: '10-B', 
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=600&h=400', 
      progress: 42, 
      nextDue: translatedCourses[language]['eng201'].nextDue, 
      pendingGradingCount: 12, 
      progressColor: 'bg-indigo-500' 
    },
    { 
      id: 'phys301', 
      title: translatedCourses[language]['phys301'].title, 
      code: 'PHYS 301', 
      className: '11-C', 
      image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=600&h=400', 
      progress: 88, 
      nextDue: translatedCourses[language]['phys301'].nextDue, 
      pendingGradingCount: 0, 
      progressColor: 'bg-cyan-500' 
    },
    { 
      id: 'hist105', 
      title: translatedCourses[language]['hist105'].title, 
      code: 'HIST 105', 
      className: '10-A', 
      image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600&h=400', 
      progress: 12, 
      nextDue: translatedCourses[language]['hist105'].nextDue, 
      pendingGradingCount: 3, 
      progressColor: 'bg-amber-500' 
    },
  ];

  const classes = ['All Classes', '10-A', '10-B', '11-C'];

  const filteredCourses = activeFilter === 'All Classes' 
    ? courses 
    : courses.filter(c => c.className === activeFilter);

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Work Area Navigation (Subjects vs Class Space) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs mb-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Main Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('space')}
              className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all text-left w-full sm:w-auto ${
                activeTab === 'space'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${activeTab === 'space' ? 'bg-white/20 text-white' : 'bg-white text-orange-500 shadow-2xs'}`}>
                <Users size={18} />
              </div>
              <div>
                <span className="block text-sm font-extrabold leading-tight">
                  {t.spaceTab}
                </span>
                <span className={`block text-[10px] font-medium mt-0.5 ${activeTab === 'space' ? 'text-white/80' : 'text-slate-400'}`}>
                  {language === 'ar' ? 'المنشورات والأنشطة المباشرة' : 'Live Wall & Community'}
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all text-left w-full sm:w-auto ${
                activeTab === 'subjects'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${activeTab === 'subjects' ? 'bg-white/20 text-white' : 'bg-white text-orange-500 shadow-2xs'}`}>
                <BookOpen size={18} />
              </div>
              <div>
                <span className="block text-sm font-extrabold leading-tight">
                  {t.subjectsTab}
                </span>
                <span className={`block text-[10px] font-medium mt-0.5 ${activeTab === 'subjects' ? 'text-white/80' : 'text-slate-400'}`}>
                  {language === 'ar' ? 'المناهج والدورات' : 'Courses & Syllabus'}
                </span>
              </div>
            </button>
          </div>

          {/* Context Badge */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-50 border border-orange-200/70 text-xs font-extrabold text-orange-800">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
            <span>
              {activeTab === 'subjects' 
                ? (language === 'ar' ? 'عرض المواد والمناهج الدراسية' : 'Viewing: Subjects & Courses') 
                : (language === 'ar' ? 'عرض جدار الفصل المباشر والأنشطة' : 'Viewing: Class Space Wall')}
            </span>
          </div>
        </div>
      </div>

      {/* TAB 1: SUBJECTS VIEW */}
      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <header className="flex justify-between items-start relative">
            <div className="flex flex-col gap-4">
              {onLanguageChange && (
                <button 
                  onClick={() => onLanguageChange(language === 'ar' ? 'en' : 'ar')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit ${language === 'ar' ? 'mr-0' : 'ml-0'}`}
                  type="button"
                >
                  <Globe size={14} />
                  <span dir="ltr">{language === 'ar' ? 'English' : 'عربي'}</span>
                </button>
              )}
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  {userRole === 'teacher' ? t.welcomeTeacher : userRole === 'parent' ? t.welcomeParent : t.welcomeStudent}
                </h1>
                <p className="text-slate-500 mt-1">
                  {userRole === 'teacher' ? t.teacherSubtitle : userRole === 'parent' ? t.parentSubtitle : t.studentSubtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800">
                  {userRole === 'teacher' ? t.teacherName : userRole === 'parent' ? t.parentName : t.studentName}
                </p>
                <p className="text-xs text-slate-400">
                  {userRole === 'teacher' ? t.teacherRole : userRole === 'parent' ? t.parentRole : t.studentRole}
                </p>
              </div>
              <div className="relative w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0">
                <Image 
                  src={userRole === 'teacher' ? "https://picsum.photos/seed/sarah/100" : userRole === 'parent' ? "https://picsum.photos/seed/david/100" : "https://picsum.photos/seed/alex/100"}
                  alt="Profile" 
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </header>

          {/* Class Filter Bar */}
          {userRole === 'teacher' && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {classes.map(cls => (
                <button
                  key={cls}
                  onClick={() => setActiveFilter(cls)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    activeFilter === cls 
                      ? 'bg-slate-800 text-white shadow-sm' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {cls === 'All Classes' ? t.allClasses : cls}
                </button>
              ))}
            </div>
          )}

          <section>
            <div className="flex justify-between items-end mb-6">
              <h2 className="text-xl font-bold text-slate-800">{t.yourCourses}</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <Link href={`/courses/${course.id}?role=${userRole || 'student'}`} key={course.id} className="group block h-[380px]">
                  <div className="bg-white rounded-3xl border border-slate-100 hover:bg-gray-50 transition-all duration-300 overflow-hidden h-full flex flex-col relative w-full">
                
                {/* Pending Grading Badge */}
                {course.pendingGradingCount > 0 && (
                  <div className="absolute top-3 right-3 z-20 flex items-center justify-center w-7 h-7 bg-rose-500 text-white text-xs font-bold rounded-full shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse">
                    {course.pendingGradingCount}
                  </div>
                )}

                {/* Header (60% Height) */}
                <div className="h-[60%] relative overflow-hidden">
                  <Image 
                    src={course.image} 
                    alt={course.title} 
                    fill 
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-10"></div>
                  
                  {/* Class Tag */}
                  {userRole === 'teacher' && (
                    <div className="absolute top-4 left-4 z-20">
                      <span className="bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border border-white/10">
                        {course.className}
                      </span>
                    </div>
                  )}

                  {/* Title Overlay */}
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                    <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">
                      {course.title}
                    </h3>
                  </div>
                </div>
                
                {/* Course Details (40% Height) */}
                <div className="p-5 flex-1 flex flex-col justify-between bg-white z-20">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                      <Clock size={14} className="shrink-0" />
                      <span>{course.nextDue}</span>
                    </div>
                    
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${course.progressColor} opacity-80`} style={{ width: `${course.progress}%` }}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs font-medium text-slate-500">{t.syllabusProgress}</p>
                      <p className="text-xs font-bold text-slate-700">{course.progress}%</p>
                    </div>
                  </div>
                  
                  {userRole === 'teacher' && (
                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="relative w-6 h-6 rounded-full border-2 border-slate-100 bg-slate-200 overflow-hidden">
                            <Image 
                              src={`https://picsum.photos/seed/${course.id}${i}/50`} 
                              alt="Student"
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))}
                      </div>
                      <span className="text-xs font-medium text-slate-400">
                        {t.studentsCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )}

      {/* TAB 2: CLASS SPACE VIEW */}
      {activeTab === 'space' && (
        <div className="w-full">
          <ClassSpaceView />
        </div>
      )}
    </div>
  );
}
