'use client';

import React, { useState, useEffect } from 'react';
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
import { AuthenticatedUser } from '@/services/auth';
import { getMyClassSections, LearnClassSection } from '@/services/attendanceData';
import { getStudentClassSection, getGradeSubjects, LearnClassInfo } from '@/services/academicData';

interface MyClassesViewProps {
  language: 'ar' | 'en';
  onLanguageChange?: (lang: 'ar' | 'en') => void;
  userRole: 'teacher' | 'student' | 'parent';
  defaultSubTab?: 'subjects' | 'space';
  authUser: AuthenticatedUser;
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
  defaultSubTab = 'space',
  authUser
}: MyClassesViewProps) {
  const [activeTab, setActiveTab] = useState<'subjects' | 'space'>(defaultSubTab);
  const [activeFilter, setActiveFilter] = useState<string>('All Classes');
  const [myClasses, setMyClasses] = useState<LearnClassSection[]>([]);
  const [myClassInfo, setMyClassInfo] = useState<LearnClassInfo | null>(null);
  const [mySubjects, setMySubjects] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const t = dict[language];

  useEffect(() => {
    setIsLoadingData(true);
    if (userRole === 'teacher' && authUser.teacherId) {
      getMyClassSections(authUser.teacherId).then((classes) => {
        setMyClasses(classes);
        setIsLoadingData(false);
      });
    } else if (userRole === 'student' && authUser.studentId) {
      Promise.all([
        getStudentClassSection(authUser.studentId),
        authUser.studentGrade ? getGradeSubjects(authUser.studentGrade) : Promise.resolve([]),
      ]).then(([cls, subjects]) => {
        setMyClassInfo(cls);
        setMySubjects(subjects);
        setIsLoadingData(false);
      });
    } else if (userRole === 'parent' && (authUser.childStudentIds || []).length > 0) {
      const childId = authUser.childStudentIds![0];
      getStudentClassSection(childId).then((cls) => {
        setMyClassInfo(cls);
        if (cls) {
          getGradeSubjects(cls.gradeLevel).then((subjects) => {
            setMySubjects(subjects);
            setIsLoadingData(false);
          });
        } else {
          setIsLoadingData(false);
        }
      });
    } else {
      setIsLoadingData(false);
    }
  }, [userRole, authUser]);

  // بطاقات المواد الحقيقية: لكل فصل حقيقي × مادة حقيقية بيدرّسها المعلم فيه، أو مواد صف الطالب/الابن الحقيقية
  const courses = userRole === 'teacher'
    ? myClasses.flatMap((cls) => (authUser.subjects || []).map((subject) => ({
        id: `${cls.id}__${encodeURIComponent(subject)}`,
        title: subject,
        className: cls.name,
        studentCount: cls.students.length,
      })))
    : myClassInfo
      ? mySubjects.map((subject) => ({
          id: `${myClassInfo!.id}__${encodeURIComponent(subject)}`,
          title: subject,
          className: myClassInfo!.name,
          studentCount: myClassInfo!.studentCount,
        }))
      : [];

  const classes = ['All Classes', ...Array.from(new Set(myClasses.map((c) => c.name)))];

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
                  {language === 'ar' ? `مرحباً بك، ${authUser.name}! 👋` : `Welcome back, ${authUser.name}! 👋`}
                </h1>
                <p className="text-slate-500 mt-1">
                  {userRole === 'teacher' ? t.teacherSubtitle : userRole === 'parent' ? t.parentSubtitle : t.studentSubtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-slate-800">{authUser.name}</p>
                <p className="text-xs text-slate-400">
                  {userRole === 'teacher' ? (authUser.subjects || []).join('، ') || t.teacherRole : userRole === 'parent' ? t.parentRole : myClassInfo?.name || t.studentRole}
                </p>
              </div>
              <div className="relative w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden shrink-0 bg-orange-100 flex items-center justify-center">
                <span className="text-orange-600 font-bold text-lg">{authUser.name?.charAt(0) || '?'}</span>
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

            {isLoadingData ? (
              <p className="text-center text-slate-400 py-16">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {filteredCourses.map((course) => (
                  <Link href={`/courses/${course.id}`} key={course.id} className="group block h-[200px]">
                  <div className="bg-white rounded-3xl border border-slate-100 hover:bg-gray-50 transition-all overflow-hidden h-full flex flex-col relative w-full">
                    <div className="h-[55%] relative overflow-hidden bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                      <BookOpen size={40} className="text-white/90" />
                      {userRole === 'teacher' && (
                        <div className="absolute top-4 left-4 z-20">
                          <span className="bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border border-white/10">
                            {course.className}
                          </span>
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 right-4 z-20">
                        <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">
                          {course.title}
                        </h3>
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center bg-white z-20">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users size={14} className="shrink-0" />
                        <span>{course.studentCount} {language === 'ar' ? 'طالب' : 'students'}</span>
                      </div>
                    </div>
                  </div>
                  </Link>
                ))}
                {filteredCourses.length === 0 && (
                  <p className="col-span-full text-center text-slate-400 py-16">
                    {language === 'ar' ? 'مفيش فصول أو مواد مرتبطة بحسابك لسه.' : 'No classes or subjects linked to your account yet.'}
                  </p>
                )}
              </div>
            )}
          </section>
    </div>
  )}

      {/* TAB 2: CLASS SPACE VIEW */}
      {activeTab === 'space' && (
        <div className="w-full">
          <ClassSpaceView
            authUser={authUser}
            userRole={userRole}
            classId={userRole === 'teacher' ? myClasses[0]?.id : myClassInfo?.id}
            subject={userRole === 'teacher' ? (authUser.subjects || [])[0] : mySubjects[0]}
            grade={userRole === 'teacher' ? myClasses[0]?.gradeLevel : myClassInfo?.gradeLevel}
            className={userRole === 'teacher' ? myClasses[0]?.name : myClassInfo?.name}
            myClasses={userRole === 'teacher' ? myClasses : (myClassInfo ? [myClassInfo] : [])}
            mySubjects={userRole === 'teacher' ? (authUser.subjects || []) : mySubjects}
          />
        </div>
      )}
    </div>
  );
}
