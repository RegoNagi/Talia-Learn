'use client';

import { useState, useRef, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { SpacesView } from '@/components/SpacesView';
import { ClassSpaceView } from '@/features/class-space/ClassSpaceView';
import { MyClassesView } from '@/components/MyClassesView';
import { MessagesCenter } from '@/components/MessagesCenter';
import { EarlyWarningRadar } from '@/components/EarlyWarningRadar';
import { ClassRoster } from '@/components/ClassRoster';
import { EducationalCalendar } from '@/components/EducationalCalendar';
import { TeacherDashboard } from '@/components/TeacherDashboard';
import { TakeAttendance } from '@/components/TakeAttendance';
import { TodoSidebar } from '@/components/TodoSidebar';
import { getRealTodoTasksMulti, TodoTask } from '@/services/todoData';
import { getMyClassSections } from '@/services/attendanceData';
import { useAuth } from '@/contexts/AuthContext';
import { Globe, BookOpen, BrainCircuit, Building, BarChart2, Menu, CheckSquare } from 'lucide-react';

import taliaLogo from '@/assets/talia-learn-logo.png';

const dict = {
  ar: {
    loginTitle: 'تسجيل الدخول',
    loginSubtitle: 'مرحباً بك في تاليا ليرن',
    password: 'كلمة المرور',
    signIn: 'دخول للمنصة',
  },
  en: {
    loginTitle: 'Login',
    loginSubtitle: 'Welcome to Talia Learn',
    password: 'Password',
    signIn: 'Sign In',
  }
};

export default function Dashboard() {
  const [activeSpace, setActiveSpace] = useState<string | null>('myClasses');
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [todoTasks, setTodoTasks] = useState<TodoTask[]>([]);
  const [isTodoLoading, setIsTodoLoading] = useState(true);
  
  // Auth & Global State
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const { authUser, isLoggedIn, isAuthLoading, login, logout } = useAuth();
  const router = useRouter();

  const refreshTodo = (silent = false) => {
    if (!authUser?.teacherId) { startTransition(() => setIsTodoLoading(false)); return; }
    if (!silent) startTransition(() => setIsTodoLoading(true));
    getMyClassSections(authUser.teacherId).then((secs) => {
      const scopes = secs.flatMap((sec) =>
        (authUser.subjects || []).map((subject: string) => ({ teacherId: authUser.teacherId, classId: sec.id, subject, grade: sec.gradeLevel }))
      );
      getRealTodoTasksMulti(scopes).then((data) => {
        setTodoTasks(data);
        setIsTodoLoading(false);
      });
    });
  };

  useEffect(() => {
    refreshTodo();
  }, [authUser?.teacherId, authUser?.subjects]);

  // مشرف بنك الأسئلة معندوش أي حاجة تانية يشوفها هنا، فبنوديه على طول لصفحته
  useEffect(() => {
    if (!isAuthLoading && isLoggedIn && authUser?.role === 'qb_supervisor') {
      router.push('/question-bank');
    }
  }, [isAuthLoading, isLoggedIn, authUser?.role]);
  const userRole = authUser?.role || null;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const t = dict[language];

  const handleLogout = () => {
    logout();
    setUsername('');
    setPassword('');
    setLoginError('');
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const user = await login(username.trim(), password);
    setIsLoggingIn(false);
    if (!user) {
      setLoginError(language === 'ar' ? 'الإيميل أو كلمة المرور غلط.' : 'Incorrect email or password.');
      return;
    }
    if (user.role === 'qb_supervisor') {
      router.push('/question-bank');
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ fontFamily: "'Cairo', sans-serif" }}>
      {isAuthLoading || (isLoggedIn && authUser?.role === 'qb_supervisor') ? (
        <div className="w-full h-full flex items-center justify-center text-gray-400">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</div>
      ) : !isLoggedIn ? (
        // --- LOGIN PAGE ---
        <div className="w-screen h-screen flex relative">
          {/* Form Side (Pure White Panel) */}
          <div className="w-full lg:flex-1 bg-white relative flex flex-col">
            {/* The Header (Horizontal, Absolute Top) */}
            <div className="absolute top-0 w-full p-6 flex justify-between items-start z-10">
              <button 
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                type="button"
              >
                <Globe size={16} />
                <span dir="ltr">{language === 'ar' ? 'English' : 'عربي'}</span>
              </button>
            </div>

            {/* The Form (Centered) */}
            <div className="max-w-md w-full mx-auto flex flex-col justify-center flex-1 px-8 lg:px-0 mt-16 lg:mt-0">
              {!logoError ? (
                <div className="flex items-center justify-center w-64 h-20 mx-auto mb-10">
                  <img 
                    src={typeof taliaLogo === 'string' ? taliaLogo : taliaLogo.src} 
                    alt="Talia Learn Logo" 
                    className="w-full h-full object-contain"
                    onError={() => setLogoError(true)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 w-64 h-20 mx-auto mb-10">
                  <div className="w-12 h-12 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">T</span>
                  </div>
                  <span className="text-3xl font-black text-orange-600 tracking-tight" style={{ fontFamily: "'Cairo', sans-serif" }}>Talia Learn</span>
                </div>
              )}

              <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{t.loginTitle}</h1>
                <p className="text-gray-500 text-lg">{t.loginSubtitle}</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{language === 'ar' ? 'الإيميل' : 'Email'}</label>
                  <input 
                    type="email" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    placeholder="name@school.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.password}</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {loginError && (
                  <p className="text-sm text-red-600 font-medium">{loginError}</p>
                )}
                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors mt-2 disabled:opacity-60"
                >
                  {isLoggingIn ? (language === 'ar' ? 'جاري الدخول...' : 'Signing in...') : t.signIn}
                </button>
              </form>
            </div>
          </div>

          {/* Marketing Side (Orange Gradient Panel) */}
          <div className="hidden lg:flex flex-1 bg-gradient-to-br from-orange-600 to-orange-900 flex-col justify-center items-center text-white p-10 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
            
            <div className="relative z-10 w-full max-w-lg mb-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center mb-6 shadow-2xl shadow-orange-900/50">
                <BrainCircuit className="text-white w-10 h-10" />
              </div>
              <h2 className="text-4xl font-bold text-white leading-tight">
                {language === 'ar' ? 'مستقبل التعليم مدعوم بالذكاء الاصطناعي' : 'The Future of Education Powered by AI'}
              </h2>
            </div>
            
            <div className="relative z-10 w-full max-w-md space-y-4">
              {/* Feature Card 1 */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 flex items-center gap-4 transition-transform hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <Building size={24} className="text-orange-100" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-0.5">
                    {language === 'ar' ? 'إدارة مركزية' : 'Centralized Management'}
                  </h3>
                  <p className="text-orange-100/80 text-sm">
                    {language === 'ar' ? 'لجميع الأكاديميات والمدارس' : 'For all academies and schools'}
                  </p>
                </div>
              </div>

              {/* Feature Card 2 */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 flex items-center gap-4 transition-transform hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <BarChart2 size={24} className="text-orange-100" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-0.5">
                    {language === 'ar' ? 'تحليلات ذكية' : 'Smart Analytics'}
                  </h3>
                  <p className="text-orange-100/80 text-sm">
                    {language === 'ar' ? 'قرارات مبنية على بيانات فورية' : 'Data-driven instant decisions'}
                  </p>
                </div>
              </div>

              {/* Feature Card 3 */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 flex items-center gap-4 transition-transform hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <BookOpen size={24} className="text-orange-100" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-0.5">
                    {language === 'ar' ? 'مناهج مؤتمتة' : 'Automated Curriculums'}
                  </h3>
                  <p className="text-orange-100/80 text-sm">
                    {language === 'ar' ? 'تخطيط دروس مدعوم بالـ AI' : 'AI-powered lesson planning'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- DASHBOARD PAGE ---
        <div className="flex h-screen w-full bg-white overflow-hidden relative" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <GlobalSidebar 
            onSpaceSelect={setActiveSpace} 
            activeSpace={activeSpace} 
            isPinned={isSidebarPinned}
            setIsPinned={setIsSidebarPinned}
            language={language}
            onLanguageChange={setLanguage}
            onLogout={handleLogout}
            userRole={userRole || 'student'}
            canUseQuestionBank={authUser?.canUseQuestionBank}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
            authUser={authUser}
          />
          
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            {/* Mobile Navigation Header */}
            <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shrink-0 z-30">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  aria-label="Open menu"
                >
                  <Menu size={22} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                    T
                  </div>
                  <span className="font-black text-sm text-slate-800 tracking-tight">Talia Learn</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <span dir="ltr">{language === 'ar' ? 'EN' : 'عربي'}</span>
                </button>
                <button
                  onClick={() => setIsTodoOpen(!isTodoOpen)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-bold text-xs relative ${
                    isTodoOpen 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                      : 'bg-indigo-50 border border-indigo-200/90 text-indigo-700 hover:bg-indigo-100'
                  }`}
                  aria-label="Toggle To Do list"
                >
                  <CheckSquare size={16} />
                  <span>To Do</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isTodoOpen ? 'bg-white/20 text-white' : 'bg-indigo-200/80 text-indigo-900'
                  }`}>
                    {todoTasks.filter(t => t.type !== 'quick_task' || !t.isCompleted).length}
                  </span>
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-[#f8f9fa]">
              <div className={`w-full max-w-[1400px] mx-auto ${activeSpace === 'calendar' ? 'h-full p-2 sm:p-4 lg:p-6' : 'p-3 sm:p-6 lg:p-10'}`}>
                {activeSpace === 'myClasses' || activeSpace === 'subjects' || activeSpace === 'class' ? (
                  authUser && (
                  <MyClassesView 
                    language={language}
                    onLanguageChange={setLanguage}
                    userRole={userRole || 'student'}
                    defaultSubTab={activeSpace === 'subjects' ? 'subjects' : 'space'}
                    authUser={authUser}
                  />
                  )
                ) : activeSpace === 'school' ? (
                  <SpacesView space="school" language={language} authUser={authUser} />
                ) : activeSpace === 'messages' ? (
                  <MessagesCenter language={language} authUser={authUser} />
                ) : activeSpace === 'radar' ? (
                  <EarlyWarningRadar language={language} teacherId={authUser?.teacherId} authUser={authUser} />
                ) : activeSpace === 'roster' ? (
                  <ClassRoster language={language} teacherId={authUser?.teacherId} authUser={authUser} />
                ) : activeSpace === 'attendance' && authUser?.teacherId ? (
                  <TakeAttendance language={language} teacherId={authUser.teacherId} />
                ) : activeSpace === 'calendar' ? (
                  <EducationalCalendar language={language} teacherId={authUser?.teacherId} authUser={authUser} />
                ) : activeSpace === 'home' ? (
                  <TeacherDashboard language={language} userRole={userRole || 'student'} authUser={authUser} onNavigate={setActiveSpace} />
                ) : (
                  authUser && (
                  <MyClassesView 
                    language={language}
                    onLanguageChange={setLanguage}
                    userRole={userRole || 'student'}
                    defaultSubTab="space"
                    authUser={authUser}
                  />
                  )
                )}
              </div>
            </main>
          </div>

          {/* Real To Do Sidebar */}
          {(activeSpace === 'home' || activeSpace === 'myClasses' || activeSpace === 'subjects' || activeSpace === 'class' || activeSpace === 'subject' || !activeSpace) && (
            <>
              {isTodoOpen && (
                <div
                  onClick={() => setIsTodoOpen(false)}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 xl:hidden"
                />
              )}
              <TodoSidebar
                tasks={todoTasks}
                isLoading={isTodoLoading}
                isOpen={isTodoOpen}
                onToggle={() => setIsTodoOpen(!isTodoOpen)}
                language={language}
                onTaskToggled={() => refreshTodo(true)}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
