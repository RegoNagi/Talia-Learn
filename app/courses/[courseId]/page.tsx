'use client';

import { useState, useEffect } from 'react';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { DailyCompass, ActionAlert } from '@/components/DailyCompass';
import { ActionItem, MagicButton } from '@/components/MagicButton';
import { SpacesView } from '@/components/SpacesView';
import { LearningPathTab } from '@/components/tabs/LearningPathTab';
import { TimelineTab } from '@/components/tabs/TimelineTab';
import { BrowseLibraryTab } from '@/components/tabs/BrowseLibraryTab';
import { AssessmentsTab } from '@/components/tabs/AssessmentsTab';
import { GradebookTab } from '@/components/tabs/GradebookTab';
import { LiveSessionsTab } from '@/components/tabs/LiveSessionsTab';
import { TaliaAIAssistant } from '@/components/TaliaAIAssistant';
import { AssessmentLanding, QuizEngine, AssignmentEngine } from '@/components/AssessmentEngine';
import { User, Task } from '@/types/course';
import { motion } from 'motion/react';
import { Plus, Wand2, FileText, PenTool, Video, Book, Layout, MessageSquare, ArrowLeft, Calendar, Sparkles, Globe, Clock, AlertCircle, BookOpen, Compass, Zap, Sun, CalendarRange, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useParams, useRouter } from 'next/navigation';

import { useSmartToDo } from '@/hooks/useSmartToDo';
import { ScheduleSessionPopup } from '@/components/ScheduleSessionPopup';
import { useAuth } from '@/contexts/AuthContext';
import { getClassSectionById } from '@/services/academicData';

// ملحوظة: بيانات المستخدم بقت حقيقية (من AuthContext) بدل الاسم الثابت اللي كان هنا
const mockTasks: Task[] = [];

const mockAlerts: ActionAlert[] = [];

const tabs = [
  { id: 'subject-space', label: 'Subject Space' },
  { id: 'learning-path', label: 'Course Content' },
  { id: 'live-sessions', label: 'Live Sessions' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'gradebook', label: 'Gradebook' },
];

export interface DemoAssessment {
  id: string;
  type: 'quiz' | 'assignment';
  title: string;
  status: 'NOT_STARTED' | 'PENDING_REVIEW' | 'COMPLETED';
  grade: string;
  timeLimit: string;
  totalPoints: number;
  instructions: string;
  dueDate: string;
}

export const dynamic = 'force-dynamic';

export default function CourseWorkspace() {
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [activeTab, setActiveTab] = useState('learning-path');
  const [activeSpace, setActiveSpace] = useState<string | null>(null);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(true);
  const [isScheduleSessionOpen, setIsScheduleSessionOpen] = useState(false);
  
  // Assessment Journey view state
  const [engineView, setEngineView] = useState<'NONE' | 'ASSESSMENT_LANDING' | 'QUIZ_ENGINE' | 'ASSIGNMENT_ENGINE'>('NONE');
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { authUser, logout, isAuthLoading } = useAuth();

  const handleLogoutAndRedirect = () => {
    logout();
    router.push('/');
  };

  useEffect(() => {
    if (!isAuthLoading && !authUser) router.push('/');
  }, [authUser, isAuthLoading, router]);
  const viewRole = ((authUser?.role || '').toUpperCase() === 'TEACHER' ? 'TEACHER' : 'STUDENT') as 'TEACHER' | 'STUDENT';

  // courseId الحقيقي شكله classId__subject (بيتبني من نفس الصيغة في شاشة "فصولي")
  const rawCourseId = (params?.courseId as string) || '';
  const [realClassId, encodedSubject] = rawCourseId.split('__');
  const realSubject = encodedSubject ? decodeURIComponent(encodedSubject) : '';

  const smartTasks = useSmartToDo(mockTasks);
  const [realClassInfo, setRealClassInfo] = useState<{ id: string; name: string; gradeLevel: string } | null>(null);

  useEffect(() => {
    if (realClassId) getClassSectionById(realClassId).then(setRealClassInfo);
  }, [realClassId]);

  const [demoAssessments, setDemoAssessments] = useState<DemoAssessment[]>([
    {
      id: 'math-quiz',
      type: 'quiz',
      title: 'Unit 1: Mathematics Quiz',
      status: 'NOT_STARTED',
      grade: '-',
      timeLimit: '30 Minutes',
      totalPoints: 100,
      instructions: 'Please complete all questions before the timer runs out. You will not be able to return to previous questions.',
      dueDate: 'Tomorrow, 11:59 PM'
    },
    {
      id: 'phys-lab',
      type: 'assignment',
      title: 'Assignment: Physics Lab Report',
      status: 'NOT_STARTED',
      grade: '-',
      timeLimit: 'None',
      totalPoints: 50,
      instructions: 'Upload your completed lab report as a PDF. Ensure all data tables and graphs are included.',
      dueDate: 'Next Friday, 5:00 PM'
    }
  ]);

  const addGrade = (grade: any) => {
    // We update the associated demo assessment
  };

  const updateAssessmentStatus = (id: string, status: DemoAssessment['status'], grade: string) => {
    setDemoAssessments(prev => prev.map(a => a.id === id ? { ...a, status, grade } : a));
  };

  const handleSpaceSelect = (space: string | null) => {
    setActiveSpace(space);
    if (space === 'subject') {
      setActiveTab('subject-space');
    } else if (space) {
      setActiveTab(''); // Clear course tab when in global spaces
    } else {
      setActiveTab('learning-path'); // Reset to default when going home
    }
  };

  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'subject-space') {
      setActiveSpace('subject');
    } else {
      setActiveSpace(null);
    }
  };

  // Define actions based on active tab
  const getMagicActions = (): ActionItem[] | undefined => {
    if (activeTab === 'learning-path') {
      return [
        { icon: <Layout size={20} />, label: "Add Lesson", color: "bg-indigo-500" },
        { icon: <Book size={20} />, label: "Import from Library", color: "bg-blue-500" },
        { icon: <Wand2 size={20} />, label: "AI Generate Module", color: "bg-purple-500" },
      ];
    }
    if (activeTab === 'live-sessions') {
      return [
        { icon: <Video size={20} />, label: "Schedule Session", color: "bg-rose-500", onClick: () => setIsScheduleSessionOpen(true) },
        { icon: <Calendar size={20} />, label: "Broadcast Settings", color: "bg-slate-700" },
        { icon: <Sparkles size={20} />, label: "AI Prep Assistance", color: "bg-purple-500" },
      ];
    }
    // Return undefined to use defaults for other tabs
    return [
      { icon: <Wand2 size={20} />, label: "AI Generate Quiz", color: "bg-purple-500" },
      { icon: <FileText size={20} />, label: "New Assignment", color: "bg-blue-500" },
      { icon: <Video size={20} />, label: "Live Session", color: "bg-rose-500", onClick: () => setIsScheduleSessionOpen(true) },
      { icon: <PenTool size={20} />, label: "Create Post", color: "bg-emerald-500" },
    ];
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* 1. Global Sidebar */}
      <GlobalSidebar 
        onSpaceSelect={handleSpaceSelect} 
        activeSpace={activeSpace} 
        isPinned={isSidebarPinned}
        setIsPinned={setIsSidebarPinned}
        language={language}
        onLanguageChange={setLanguage}
        userRole={viewRole.toLowerCase() as 'student' | 'teacher' | 'parent'}
        onLogout={handleLogoutAndRedirect}
      />

      {/* 2. Main Course Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-50/30">
        {activeSpace && activeSpace !== 'subject' ? (
          <div className="flex-1 overflow-y-auto">
            <SpacesView space={activeSpace as 'school' | 'class'} />
          </div>
        ) : (
          <>
            {/* Tab Navigation Navigation */}
            {engineView === 'NONE' ? (
              <header className="px-8 py-6 bg-white border-b border-slate-100 flex justify-between items-end shrink-0 z-20">
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit"
                    type="button"
                  >
                    <Globe size={14} />
                    <span dir="ltr">{language === 'ar' ? 'English' : 'عربي'}</span>
                  </button>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Link href="/" className="text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 text-xs font-medium mr-2">
                        <ArrowLeft size={14} />
                        {language === 'ar' ? 'المواد' : 'Subjects'}
                      </Link>
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{realClassInfo?.name || '...'}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">{realSubject || '...'}</h1>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  {/* Tab Navigation */}
                  <nav className="flex bg-slate-100/50 p-1 rounded-2xl">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabSelect(tab.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative flex items-center
                        ${activeTab === tab.id ? 'text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                      `}
                    >
                      {activeTab === tab.id && (
                        <motion.div 
                          layoutId="activeTab"
                          className="absolute inset-0 bg-white rounded-xl shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center">
                        {tab.label}
                      </span>
                    </button>
                  ))}
                </nav>
                </div>
              </header>
            ) : null}

            {/* Content Area */}
            {viewRole.toLowerCase() === 'parent' && (
              <div className="absolute top-[88px] left-1/2 -translate-x-1/2 z-50">
                <span className="bg-indigo-600/20 backdrop-blur-md text-indigo-300 border border-indigo-500/30 px-4 py-1 rounded-full text-xs shadow-sm whitespace-nowrap">
                  {language === 'ar' ? 'عرض ولي الأمر - للقراءة فقط' : 'Parent View - Read Only'}
                </span>
              </div>
            )}
            <div className="flex-1 overflow-y-auto relative z-10 bg-white">
              <div className="h-full">
                {engineView !== 'NONE' ? (
                  <>
                    {engineView === 'ASSESSMENT_LANDING' && (
                      <AssessmentLanding 
                        assessment={demoAssessments.find(a => a.id === currentAssessmentId)!} 
                        onClose={() => setEngineView('NONE')}
                        onStartQuiz={() => setEngineView('QUIZ_ENGINE')}
                        onStartAssignment={() => setEngineView('ASSIGNMENT_ENGINE')}
                        onComplete={() => {}}
                        viewRole={viewRole.toLowerCase()}
                      />
                    )}
                    {engineView === 'QUIZ_ENGINE' && (
                      <QuizEngine 
                        assessment={demoAssessments.find(a => a.id === currentAssessmentId)!} 
                        onClose={() => setEngineView('NONE')}
                        onComplete={(status, grade) => updateAssessmentStatus(currentAssessmentId!, status, grade)}
                        viewRole={viewRole.toLowerCase()}
                      />
                    )}
                    {engineView === 'ASSIGNMENT_ENGINE' && (
                      <AssignmentEngine 
                        assessment={demoAssessments.find(a => a.id === currentAssessmentId)!} 
                        onClose={() => setEngineView('NONE')}
                        onComplete={(status, grade) => updateAssessmentStatus(currentAssessmentId!, status, grade)}
                        viewRole={viewRole.toLowerCase()}
                      />
                    )}
                  </>
                ) : (
                  <>
                    {activeTab === 'subject-space' && <SpacesView space="subject" />}
                    {activeTab === 'learning-path' && <LearningPathTab viewRole={viewRole} demoAssessments={demoAssessments} language={language} onAssessmentClick={(id) => { setCurrentAssessmentId(id); setEngineView('ASSESSMENT_LANDING'); }} teacherId={authUser?.teacherId} classId={realClassId} subject={realSubject} grade={realClassInfo?.gradeLevel} />}
                    {activeTab === 'live-sessions' && <LiveSessionsTab viewRole={viewRole} />}
                    {activeTab === 'timeline' && <TimelineTab role={viewRole.toLowerCase()} language={language} />}
                    {activeTab === 'assessments' && <AssessmentsTab role={viewRole.toLowerCase() as any} teacherId={authUser?.teacherId} studentId={authUser?.studentId} classId={realClassId} subject={realSubject} />}
                    {activeTab === 'gradebook' && <GradebookTab viewRole={viewRole} demoAssessments={demoAssessments} />}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Magic Button */}
        <MagicButton actions={getMagicActions()} />
        
        {/* Talia AI */}
        {activeTab === 'subject-space' && <TaliaAIAssistant />}
      </main>

      {/* The Compass Sidebar (Right Sidebar) */}
      <aside className={`${isTodoOpen ? 'w-96 px-5' : 'w-20 px-2'} h-screen sticky top-0 overflow-y-auto pt-12 pb-6 border-l border-slate-100 flex flex-col gap-6 flex-shrink-0 bg-slate-50/50 transition-all duration-300`}>
        <div className={`flex items-center ${isTodoOpen ? 'justify-between px-2' : 'justify-center'}`}>
          {isTodoOpen && (
            <div className="flex items-center gap-2">
              <Compass className="text-indigo-600" size={22} />
              <h2 className="text-xl font-bold text-slate-800">{language === 'ar' ? 'المهام' : 'To Do'}</h2>
            </div>
          )}
          <button onClick={() => setIsTodoOpen(!isTodoOpen)} className="text-slate-400 hover:text-slate-600 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-200/50 transition-colors">
            {isTodoOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        
        {isTodoOpen ? (
          <div className="flex flex-col gap-6">
            {/* 1. Overdue / Cumulative */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 px-2 flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-500" />
                Overdue / Cumulative
              </h3>
              <div className="flex flex-col gap-3">
                <div className="bg-rose-100 border border-rose-300 shadow-sm opacity-100 transition-all hover:border-rose-400 rounded-2xl py-2.5 px-3.5 relative cursor-pointer">
                   <div className="flex justify-end mb-1.5">
                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 text-[10px] font-bold text-slate-600 shadow-sm"><BookOpen size={12}/> Chemistry</span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900 mb-2 mt-1">Grading: 12 Lab Reports Pending</h4>
                   <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-700">
                     <span className="flex items-center gap-1 font-bold text-rose-500"><AlertCircle size={12}/> 2 Days Overdue</span>
                   </div>
                </div>
                
                <div className="bg-rose-100 border border-rose-300 shadow-sm opacity-100 transition-all hover:border-rose-400 rounded-2xl py-2.5 px-3.5 relative cursor-pointer">
                   <div className="flex justify-end mb-1.5">
                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 text-[10px] font-bold text-slate-600 shadow-sm"><BookOpen size={12}/> Math</span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900 mb-2 mt-1">Review Math Assignments</h4>
                   <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-700">
                     <span className="flex items-center gap-1 font-bold text-rose-500"><AlertCircle size={12}/> 1 Day Overdue</span>
                   </div>
                </div>
              </div>
            </div>

            {/* 2. Today */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 px-2 flex items-center gap-2">
                <Zap size={16} className="text-amber-500" />
                Today
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              </h3>
              <div className="flex flex-col gap-3">
                <div className="bg-amber-100 border border-amber-300 shadow-sm opacity-100 transition-all hover:border-amber-400 rounded-2xl py-2.5 px-3.5 relative cursor-pointer">
                   <div className="flex justify-end mb-1.5">
                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 text-[10px] font-bold text-slate-600 shadow-sm"><BookOpen size={12}/> Math</span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900 mb-2 mt-1">Monitor Quiz: Advanced Linear Algebra</h4>
                   <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-700">
                     <span className="flex items-center gap-1"><Calendar size={12}/> Today</span>
                     <span className="flex items-center gap-1 text-red-500 font-bold"><Clock size={12}/> 🔴 Live Now</span>
                   </div>
                </div>

                <div className="bg-amber-100 border border-amber-300 shadow-sm opacity-100 transition-all hover:border-amber-400 rounded-2xl py-2.5 px-3.5 relative cursor-pointer">
                   <div className="flex justify-end mb-1.5">
                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 text-[10px] font-bold text-slate-600 shadow-sm"><BookOpen size={12}/> Physics</span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900 mb-2 mt-1">Host Live Session</h4>
                   <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-700">
                     <span className="flex items-center gap-1"><Calendar size={12}/> Today</span>
                     <span className="flex items-center gap-1"><Clock size={12}/> 2:00 PM</span>
                   </div>
                </div>

                <div className="bg-amber-100 border border-amber-300 shadow-sm opacity-100 transition-all hover:border-amber-400 rounded-2xl py-2.5 px-3.5 relative cursor-pointer">
                   <div className="flex justify-end mb-1.5">
                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 text-[10px] font-bold text-slate-600 shadow-sm"><BookOpen size={12}/> English</span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900 mb-2 mt-1">Grade Literature Essays</h4>
                   <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-700">
                     <span className="flex items-center gap-1"><Calendar size={12}/> Today</span>
                     <span className="flex items-center gap-1"><Clock size={12}/> 5:30 PM</span>
                   </div>
                </div>
              </div>
            </div>

            {/* 3. Tomorrow */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 px-2 flex items-center gap-2">
                <Sun size={16} className="text-sky-500" />
                Tomorrow
              </h3>
              <div className="flex flex-col gap-3">
                <div className="bg-blue-100 border border-blue-300 shadow-sm opacity-100 transition-all hover:border-blue-400 rounded-2xl py-2.5 px-3.5 relative cursor-pointer">
                   <div className="flex justify-end mb-1.5">
                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 text-[10px] font-bold text-slate-600 shadow-sm"><BookOpen size={12}/> World History</span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900 mb-2 mt-1">Review 25 History Projects</h4>
                   <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-700">
                     <span className="flex items-center gap-1"><Calendar size={12}/> Tomorrow</span>
                     <span className="flex items-center gap-1"><Clock size={12}/> 11:59 PM</span>
                   </div>
                </div>
                
                <div className="bg-blue-100 border border-blue-300 shadow-sm opacity-100 transition-all hover:border-blue-400 rounded-2xl py-2.5 px-3.5 relative cursor-pointer">
                   <div className="flex justify-end mb-1.5">
                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 text-[10px] font-bold text-slate-600 shadow-sm"><BookOpen size={12}/> Chemistry</span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900 mb-2 mt-1">Prepare Chemical Reactions Lab</h4>
                   <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-700">
                     <span className="flex items-center gap-1"><Calendar size={12}/> Tomorrow</span>
                     <span className="flex items-center gap-1"><Clock size={12}/> 10:00 AM</span>
                   </div>
                </div>
              </div>
            </div>

            {/* 4. Next Week */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-3 px-2 flex items-center gap-2">
                <CalendarRange size={16} className="text-purple-600" />
                Next Week
              </h3>
              <div className="flex flex-col gap-3">
                <div className="bg-purple-100 border border-purple-300 shadow-sm opacity-100 transition-all hover:border-purple-400 rounded-2xl py-2.5 px-3.5 relative cursor-pointer">
                   <div className="flex justify-end mb-1.5">
                     <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/60 text-[10px] font-bold text-slate-600 shadow-sm"><BookOpen size={12}/> All Subjects</span>
                   </div>
                   <h4 className="text-sm font-bold text-slate-900 mb-2 mt-1">Curriculum Planning: Finals Week</h4>
                   <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-slate-700">
                     <span className="flex items-center gap-1"><Calendar size={12}/> Next Thursday</span>
                   </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 items-center mt-4">
            <div className="relative group cursor-pointer" onClick={() => setIsTodoOpen(true)} title="Overdue / Cumulative (2)">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center hover:bg-rose-200 transition-colors border border-rose-200">
                <AlertCircle size={20} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">2</span>
            </div>
            <div className="relative group cursor-pointer" onClick={() => setIsTodoOpen(true)} title="Today (3)">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center hover:bg-amber-200 transition-colors border border-amber-200">
                <Zap size={20} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">3</span>
            </div>
            <div className="relative group cursor-pointer" onClick={() => setIsTodoOpen(true)} title="Tomorrow (2)">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-sky-500 flex items-center justify-center hover:bg-blue-200 transition-colors border border-blue-200">
                <Sun size={20} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">2</span>
            </div>
            <div className="relative group cursor-pointer" onClick={() => setIsTodoOpen(true)} title="Next Week (1)">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center hover:bg-purple-200 transition-colors border border-purple-200">
                <CalendarRange size={20} />
              </div>
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">1</span>
            </div>
          </div>
        )}
      </aside>

      <ScheduleSessionPopup 
        isOpen={isScheduleSessionOpen} 
        onClose={() => setIsScheduleSessionOpen(false)} 
        language={language} 
      />
    </div>
  );
}
