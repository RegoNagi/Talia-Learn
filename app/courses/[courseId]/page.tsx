'use client';

import { useState, useEffect, Suspense, startTransition } from 'react';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { ActionItem, MagicButton } from '@/components/MagicButton';
import { SpacesView } from '@/components/SpacesView';
import { LearningPathTab } from '@/components/tabs/LearningPathTab';
import { TimelineTab } from '@/components/tabs/TimelineTab';
import { BrowseLibraryTab } from '@/components/tabs/BrowseLibraryTab';
import { AssessmentsTab } from '@/components/tabs/AssessmentsTab';
import { GradebookTab } from '@/components/tabs/GradebookTab';
import { LiveSessionsTab } from '@/components/tabs/LiveSessionsTab';
import { TaliaAIAssistant } from '@/components/TaliaAIAssistant';
import { TodoSidebar } from '@/components/TodoSidebar';
import { getRealTodoTasks, TodoTask } from '@/services/todoData';
import { AssessmentLanding, QuizEngine, AssignmentEngine } from '@/components/AssessmentEngine';
import { User, Task } from '@/types/course';
import { motion } from 'motion/react';
import { Wand2, FileText, PenTool, Video, Book, Layout, ArrowLeft, Calendar, Sparkles, Globe } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useParams, useRouter } from 'next/navigation';

import { ScheduleSessionPopup } from '@/components/ScheduleSessionPopup';
import { useAuth } from '@/contexts/AuthContext';
import { getClassSectionById } from '@/services/academicData';

// ملحوظة: بيانات المستخدم بقت حقيقية (من AuthContext) بدل الاسم الثابت اللي كان هنا

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

function CourseWorkspaceContent() {
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const [activeTab, setActiveTab] = useState('learning-path');
  const [activeSpace, setActiveSpace] = useState<string | null>(null);
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [todoTasks, setTodoTasks] = useState<TodoTask[]>([]);
  const [isTodoLoading, setIsTodoLoading] = useState(true);
  const [isScheduleSessionOpen, setIsScheduleSessionOpen] = useState(false);
  
  // Assessment Journey view state
  const [engineView, setEngineView] = useState<'NONE' | 'ASSESSMENT_LANDING' | 'QUIZ_ENGINE' | 'ASSIGNMENT_ENGINE'>('NONE');
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const { authUser, logout, isAuthLoading } = useAuth();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) startTransition(() => setActiveTab(tabParam));
  }, [searchParams]);

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

  const [realClassInfo, setRealClassInfo] = useState<{ id: string; name: string; gradeLevel: string } | null>(null);

  useEffect(() => {
    if (realClassId) getClassSectionById(realClassId).then(setRealClassInfo);
  }, [realClassId]);

  const refreshTodo = (silent = false) => {
    if (!realClassId || !realSubject) { startTransition(() => setIsTodoLoading(false)); return; }
    if (!silent) startTransition(() => setIsTodoLoading(true));
    getRealTodoTasks({ teacherId: authUser?.teacherId, classId: realClassId, subject: realSubject, grade: realClassInfo?.gradeLevel }).then((tasks) => {
      setTodoTasks(tasks);
      setIsTodoLoading(false);
    });
  };

  useEffect(() => {
    refreshTodo();
  }, [realClassId, realSubject, realClassInfo?.gradeLevel, authUser?.teacherId]);

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

  if (isAuthLoading || !authUser) {
    return <div className="w-full h-screen flex items-center justify-center text-slate-400">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

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
        authUser={authUser}
      />

      {/* 2. Main Course Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-gray-50/30">
        {activeSpace && activeSpace !== 'subject' ? (
          <div className="flex-1 overflow-y-auto">
            <SpacesView space={activeSpace as 'school' | 'class'} authUser={authUser} />
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
                    {activeTab === 'subject-space' && <SpacesView space="subject" classId={realClassId} subject={realSubject} authUser={authUser} onNavigate={setActiveTab} />}
                    {activeTab === 'learning-path' && <LearningPathTab viewRole={viewRole} demoAssessments={demoAssessments} language={language} onAssessmentClick={(id) => { setCurrentAssessmentId(id); setEngineView('ASSESSMENT_LANDING'); }} teacherId={authUser?.teacherId} studentId={authUser?.studentId} classId={realClassId} subject={realSubject} grade={realClassInfo?.gradeLevel} />}
                    {activeTab === 'live-sessions' && <LiveSessionsTab viewRole={viewRole} classId={realClassId} subject={realSubject} teacherId={authUser?.teacherId} teacherName={authUser?.name} studentId={authUser?.studentId} className={realClassInfo?.name} />}
                    {activeTab === 'timeline' && <TimelineTab role={viewRole.toLowerCase()} language={language} classId={realClassId} subject={realSubject} grade={realClassInfo?.gradeLevel} teacherId={authUser?.teacherId} onOpenAssessments={() => setActiveTab('assessments')} />}
                    {activeTab === 'assessments' && <AssessmentsTab role={viewRole.toLowerCase() as any} teacherId={authUser?.teacherId} studentId={authUser?.studentId} classId={realClassId} subject={realSubject} grade={realClassInfo?.gradeLevel} />}
                    {activeTab === 'gradebook' && <GradebookTab viewRole={viewRole} classId={realClassId} subject={realSubject} grade={realClassInfo?.gradeLevel} studentId={authUser?.studentId} teacherId={authUser?.teacherId} teacherName={authUser?.name} />}
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

      {/* Real To Do Sidebar */}
      <TodoSidebar
        tasks={todoTasks}
        isLoading={isTodoLoading}
        isOpen={isTodoOpen}
        onToggle={() => setIsTodoOpen(!isTodoOpen)}
        language={language}
        onTaskToggled={() => refreshTodo(true)}
      />

      <ScheduleSessionPopup 
        isOpen={isScheduleSessionOpen} 
        onClose={() => setIsScheduleSessionOpen(false)} 
        language={language} 
      />
    </div>
  );
}

export default function CourseWorkspace() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <CourseWorkspaceContent />
    </Suspense>
  );
}
