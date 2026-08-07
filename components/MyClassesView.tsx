'use client';

import React, { useState, useEffect, useMemo, startTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Users, Globe, Palette, X, Check } from 'lucide-react';
import { ClassSpaceView } from '@/features/class-space/ClassSpaceView';
import { AuthenticatedUser } from '@/services/auth';
import { getMyClassSections, LearnClassSection } from '@/services/attendanceData';
import { getStudentClassSection, getGradeSubjects, LearnClassInfo } from '@/services/academicData';
import { getSubjectThemes, getThemeFor, upsertSubjectTheme, SubjectTheme, SUBJECT_COLOR_OPTIONS, SUBJECT_ICON_OPTIONS } from '@/services/subjectThemeData';
import { getSubjectIconComponent } from '@/lib/subjectIcons';
import { getCourseProgress } from '@/services/learningPathData';

interface MyClassesViewProps {
  language: 'ar' | 'en';
  onLanguageChange?: (lang: 'ar' | 'en') => void;
  userRole: 'teacher' | 'student' | 'parent' | 'qb_supervisor';
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
  const [gradeFilter, setGradeFilter] = useState<string>('All Grades');
  const [myClasses, setMyClasses] = useState<LearnClassSection[]>([]);
  const [myClassInfo, setMyClassInfo] = useState<LearnClassInfo | null>(null);
  const [mySubjects, setMySubjects] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [subjectThemes, setSubjectThemes] = useState<Record<string, SubjectTheme>>({});
  const [editingThemeSubject, setEditingThemeSubject] = useState<string | null>(null);

  const refreshThemes = () => {
    getSubjectThemes().then(setSubjectThemes);
  };

  useEffect(() => {
    refreshThemes();
  }, []);

  const t = dict[language];

  useEffect(() => {
    startTransition(() => setIsLoadingData(true));
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
        grade: cls.gradeLevel,
        studentCount: cls.students.length,
      })))
    : myClassInfo
      ? mySubjects.map((subject) => ({
          id: `${myClassInfo!.id}__${encodeURIComponent(subject)}`,
          title: subject,
          className: myClassInfo!.name,
          grade: myClassInfo!.gradeLevel,
          studentCount: myClassInfo!.studentCount,
        }))
      : [];

  const classes = ['All Classes', ...Array.from(new Set(myClasses.map((c) => c.name)))];
  const grades = ['All Grades', ...Array.from(new Set(courses.map((c) => c.grade).filter(Boolean)))];

  const [courseProgress, setCourseProgress] = useState<Record<string, { completed: number; total: number }>>({});

  useEffect(() => {
    if (courses.length === 0 || !authUser.teacherId) return;
    Promise.all(
      courses.map((c) =>
        getCourseProgress({ teacherId: authUser.teacherId!, classId: c.id.split('__')[0], subject: c.title }).then((p) => [c.id, p] as const)
      )
    ).then((results) => {
      setCourseProgress(Object.fromEntries(results));
    });
  }, [myClasses, myClassInfo, mySubjects, authUser.teacherId]);


  const filteredCourses = courses
    .filter((c) => activeFilter === 'All Classes' || c.className === activeFilter)
    .filter((c) => gradeFilter === 'All Grades' || c.grade === gradeFilter);

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

          {/* Grade + Class Filter Bar (side by side, grade first) */}
          {userRole === 'teacher' && (
            <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide">
              <div className="flex gap-2 shrink-0">
                {grades.map(g => (
                  <button
                    key={g}
                    onClick={() => setGradeFilter(g)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                      gradeFilter === g 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    {g === 'All Grades' ? (language === 'ar' ? 'كل الصفوف' : 'All Grades') : g}
                  </button>
                ))}
              </div>
              <div className="w-px h-6 bg-slate-200 shrink-0" />
              <div className="flex gap-2 shrink-0">
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
                {filteredCourses.map((course) => {
                  const theme = getThemeFor(subjectThemes, course.title);
                  const SubjectIcon = getSubjectIconComponent(theme.icon);
                  return (
                  <Link href={`/courses/${course.id}`} key={course.id} className="group block h-[220px]">
                  <div className="bg-white rounded-3xl border border-slate-100 hover:bg-gray-50 transition-all overflow-hidden h-full flex flex-col relative w-full">
                    <div className={`flex-[2] relative overflow-hidden ${theme.color} flex items-center justify-center`}>
                      <SubjectIcon size={40} className="text-white/90" />
                      {userRole === 'teacher' && (
                        <div className="absolute top-3 left-3 z-20 flex items-center gap-1">
                          <span className="bg-black/30 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-white/10">
                            {course.className}
                          </span>
                          {course.grade && (
                            <span className="bg-white/25 backdrop-blur-md text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border border-white/10">
                              {course.grade}
                            </span>
                          )}
                        </div>
                      )}
                      {userRole === 'teacher' && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingThemeSubject(course.title); }}
                          className="absolute top-3 right-3 z-20 w-7 h-7 rounded-lg bg-black/30 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                          title={language === 'ar' ? 'تخصيص شكل المادة' : 'Customize subject theme'}
                        >
                          <Palette size={14} />
                        </button>
                      )}
                      <div className="absolute bottom-3 left-4 right-4 z-20">
                        <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">
                          {course.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex-1 px-4 py-2 flex flex-col justify-center gap-1.5 bg-white z-20">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users size={14} className="shrink-0" />
                        <span>{course.studentCount} {language === 'ar' ? 'طالب' : 'students'}</span>
                      </div>
                      {(() => {
                        const prog = courseProgress[course.id];
                        if (!prog || prog.total === 0) return null;
                        const pct = Math.round((prog.completed / prog.total) * 100);
                        return (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${theme.color}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">{pct}%</span>
                          </div>
                        );
                      })()}
                      </div>
                    </div>
                  </Link>
                  );
                })}
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

      {editingThemeSubject && (
        <SubjectThemeModal
          subjectName={editingThemeSubject}
          currentTheme={getThemeFor(subjectThemes, editingThemeSubject)}
          language={language}
          onClose={() => setEditingThemeSubject(null)}
          onSaved={() => { setEditingThemeSubject(null); refreshThemes(); }}
        />
      )}
    </div>
  );
}

function SubjectThemeModal({ subjectName, currentTheme, language, onClose, onSaved }: { subjectName: string; currentTheme: SubjectTheme; language: 'ar' | 'en'; onClose: () => void; onSaved: () => void }) {
  const [selectedColor, setSelectedColor] = useState(currentTheme.color);
  const [selectedIcon, setSelectedIcon] = useState(currentTheme.icon);
  const [isSaving, setIsSaving] = useState(false);
  const PreviewIcon = useMemo(() => getSubjectIconComponent(selectedIcon), [selectedIcon]);

  const handleSave = async () => {
    setIsSaving(true);
    await upsertSubjectTheme(subjectName, { color: selectedColor, icon: selectedIcon });
    setIsSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className={`${selectedColor} p-5 text-white flex justify-between items-center transition-colors`}>
          <div className="flex items-center gap-2">
            <PreviewIcon size={20} />
            <h3 className="font-extrabold text-sm">{subjectName}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">{language === 'ar' ? 'اللون' : 'Color'}</label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full ${c} flex items-center justify-center transition-transform ${selectedColor === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''}`}
                >
                  {selectedColor === c && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">{language === 'ar' ? 'الأيقونة' : 'Icon'}</label>
            <div className="grid grid-cols-6 gap-2">
              {SUBJECT_ICON_OPTIONS.map((iconName) => {
                const IconComp = getSubjectIconComponent(iconName);
                return (
                  <button
                    key={iconName}
                    onClick={() => setSelectedIcon(iconName)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${selectedIcon === iconName ? `${selectedColor} text-white border-transparent` : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                  >
                    <IconComp size={16} />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl">
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button onClick={handleSave} disabled={isSaving} className="px-5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs">
              {isSaving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ' : 'Save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
