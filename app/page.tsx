'use client';

import { useState, useRef, useEffect } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight, Clock, Globe, Laptop, BookOpen, Layers, BrainCircuit, Building, BarChart2, Calendar, AlertCircle, Compass, Zap, Sun, CalendarRange, Users, ChevronRight, ChevronLeft, Bell, Menu, X, CheckCircle2, CheckSquare, Filter } from 'lucide-react';

import taliaLogo from '@/assets/talia-learn-logo.png';

const dict = {
  ar: {
    teacherView: 'عرض المعلم',
    studentView: 'عرض الطالب',
    parentView: 'عرض ولي الأمر',
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
    loginTitle: 'تسجيل الدخول',
    loginSubtitle: 'مرحباً بك في تاليا ليرن',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    signIn: 'دخول للمنصة',
    demoLoginAs: 'أو الدخول التجريبي كـ',
    teacherAccount: 'حساب المعلم',
    studentAccount: 'حساب الطالب',
    parentAccount: 'حساب ولي الأمر',
    theFutureOfEducation: 'مستقبل التعليم',
  },
  en: {
    teacherView: 'Teacher View',
    studentView: 'Student View',
    parentView: 'Parent View',
    welcomeTeacher: 'Welcome back, Sarah! 👋',
    welcomeStudent: 'Welcome back, Alex! 👋',
    welcomeParent: 'Welcome back, Mr. Johnson! 👋',
    teacherSubtitle: 'You have assignments to grade across 3 classes.',
    studentSubtitle: 'Ready for your classes today?',
    parentSubtitle: 'Viewing Alex\'s dashboard.',
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
    loginTitle: 'Login',
    loginSubtitle: 'Welcome to Talia Learn',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign In',
    demoLoginAs: 'Or Demo Login as',
    teacherAccount: 'Teacher Account',
    studentAccount: 'Student Account',
    parentAccount: 'Parent Account',
    theFutureOfEducation: 'The Future of Education',
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

export default function Dashboard() {
  const [activeSpace, setActiveSpace] = useState<string | null>('myClasses');
  const [isSidebarPinned, setIsSidebarPinned] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isTodoOpen, setIsTodoOpen] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('All Classes');
  
  // To Do State & Quick Focus Filter
  const todoFilterRef = useRef<HTMLDivElement>(null);
  const scrollTodoFilters = (direction: 'left' | 'right') => {
    if (todoFilterRef.current) {
      const scrollAmount = direction === 'left' ? -120 : 120;
      todoFilterRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const [todoFilter, setTodoFilter] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'completed'>('all');
  const [todoItems, setTodoItems] = useState([
    { id: '1', title: 'Grading: 12 Lab Reports Pending', subject: 'Chemistry', category: 'overdue', time: '2 Days Overdue', completed: false, priority: 'critical' },
    { id: '2', title: 'Review Math Assignments', subject: 'Math', category: 'overdue', time: '1 Day Overdue', completed: false, priority: 'critical' },
    { id: '3', title: 'Monitor Quiz: Advanced Linear Algebra', subject: 'Math', category: 'today', time: '🔴 Live Now', completed: false, priority: 'today' },
    { id: '4', title: 'Host Live Session', subject: 'Physics', category: 'today', time: '2:00 PM', completed: false, priority: 'today' },
    { id: '5', title: 'Grade Literature Essays', subject: 'English', category: 'today', time: '5:30 PM', completed: false, priority: 'today' },
    { id: '6', title: 'Review 25 History Projects', subject: 'World History', category: 'upcoming', time: 'Tomorrow 11:59 PM', completed: false, priority: 'upcoming' },
    { id: '7', title: 'Prepare Chemical Reactions Lab', subject: 'Chemistry', category: 'upcoming', time: 'Tomorrow 10:00 AM', completed: false, priority: 'upcoming' },
    { id: '8', title: 'Curriculum Planning: Finals Week', subject: 'All Subjects', category: 'upcoming', time: 'Next Thursday', completed: false, priority: 'upcoming' },
  ]);

  const toggleTodoItem = (id: string) => {
    setTodoItems(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };
  
  // Auth & Global State
  const [language, setLanguage] = useState<'ar' | 'en'>('en');
  const { authUser, isLoggedIn, isAuthLoading, login, logout } = useAuth();
  const router = useRouter();

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

  const courses = [
    { id: 'chem101', title: translatedCourses[language]['chem101'].title, code: 'CHEM 101', className: '10-A', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600&h=400', progress: 65, nextDue: translatedCourses[language]['chem101'].nextDue, pendingGradingCount: 5, progressColor: 'bg-emerald-500' },
    { id: 'eng201', title: translatedCourses[language]['eng201'].title, code: 'ENG 201', className: '10-B', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=600&h=400', progress: 42, nextDue: translatedCourses[language]['eng201'].nextDue, pendingGradingCount: 12, progressColor: 'bg-indigo-500' },
    { id: 'phys301', title: translatedCourses[language]['phys301'].title, code: 'PHYS 301', className: '11-C', image: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=600&h=400', progress: 88, nextDue: translatedCourses[language]['phys301'].nextDue, pendingGradingCount: 0, progressColor: 'bg-cyan-500' },
    { id: 'hist105', title: translatedCourses[language]['hist105'].title, code: 'HIST 105', className: '10-A', image: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600&h=400', progress: 12, nextDue: translatedCourses[language]['hist105'].nextDue, pendingGradingCount: 3, progressColor: 'bg-amber-500' },
  ];

  const classes = ['All Classes', '10-A', '10-B', '11-C'];

  const filteredCourses = activeFilter === 'All Classes' 
    ? courses 
    : courses.filter(c => c.className === activeFilter);

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden" dir={language === 'ar' ? 'rtl' : 'ltr'} style={{ fontFamily: "'Cairo', sans-serif" }}>
      {isAuthLoading ? (
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
                    {todoItems.filter(i => !i.completed).length}
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

          {/* The Compass Sidebar (Right Sidebar) */}
          {(activeSpace === 'home' || activeSpace === 'myClasses' || activeSpace === 'subjects' || activeSpace === 'class' || activeSpace === 'subject' || !activeSpace) && (
            <>
              {/* Mobile overlay for ToDo drawer */}
              {isTodoOpen && (
                <div 
                  onClick={() => setIsTodoOpen(false)}
                  className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 xl:hidden"
                />
              )}

              <aside 
                className={`
                  h-screen overflow-y-auto pt-6 xl:pt-12 pb-6 border-l border-slate-200 
                  flex flex-col gap-6 bg-slate-50/90 transition-all duration-300 z-50
                  fixed top-0 bottom-0 right-0 xl:static
                  ${isTodoOpen 
                    ? 'w-80 sm:w-96 px-4 sm:px-5 translate-x-0 shadow-2xl xl:shadow-none' 
                    : 'w-0 px-0 translate-x-full xl:translate-x-0 xl:w-20 xl:px-2'
                  }
                `}
              >
          <div className={`flex items-center ${isTodoOpen ? 'justify-between px-2' : 'flex-col gap-3 items-center'}`}>
            {isTodoOpen ? (
              <div className="flex items-center gap-2">
                <CheckSquare className="text-indigo-600" size={22} />
                <h2 className="text-xl font-bold text-slate-800">{language === 'ar' ? 'المهام' : 'To Do'}</h2>
              </div>
            ) : (
              <button
                onClick={() => setIsTodoOpen(true)}
                title="Open To Do List"
                className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex flex-col items-center justify-center relative shadow-md hover:bg-indigo-700 transition-all hover:scale-105"
              >
                <CheckSquare size={20} />
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full border-2 border-white shadow-2xs">
                  {todoItems.filter(i => !i.completed).length}
                </span>
              </button>
            )}
            <button 
              onClick={() => setIsTodoOpen(!isTodoOpen)} 
              className="text-slate-400 hover:text-slate-600 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-200/50 transition-colors"
              title={isTodoOpen ? 'Collapse To Do' : 'Expand To Do'}
            >
              {isTodoOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          
          {isTodoOpen ? (
            <div className="flex flex-col gap-4">
              {/* Daily Progress Target Banner (Today & Overdue tasks) */}
              {(() => {
                const targetTasks = todoItems.filter(i => i.category === 'today' || i.category === 'overdue');
                const doneTargetTasks = targetTasks.filter(i => i.completed).length;
                const totalTargetTasks = targetTasks.length;
                const progressPct = totalTargetTasks > 0 ? (doneTargetTasks / totalTargetTasks) * 100 : 0;
                
                return (
                  <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 text-slate-800 font-bold">
                        <CheckSquare size={14} className="text-emerald-600" /> Daily Target (Today & Due)
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-bold border border-slate-200">
                        {doneTargetTasks} / {totalTargetTasks} Done
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Quick Focus Filter Pills with Left & Right Arrow Controls */}
              <div className="relative flex items-center gap-1">
                <button
                  onClick={() => scrollTodoFilters('left')}
                  className="shrink-0 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  aria-label="Scroll filter left"
                  title="Scroll left"
                >
                  <ChevronLeft size={13} />
                </button>

                <div 
                  ref={todoFilterRef}
                  className="flex-1 flex items-center gap-1.5 overflow-x-auto py-0.5 scroll-smooth scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  <button
                    onClick={() => setTodoFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                      todoFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/50'
                    }`}
                  >
                    All ({todoItems.length})
                  </button>

                  <button
                    onClick={() => setTodoFilter('overdue')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                      todoFilter === 'overdue'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <span>Overdue</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      todoFilter === 'overdue' ? 'bg-white/25 text-white' : 'bg-rose-200/80 text-rose-800'
                    }`}>
                      {todoItems.filter(i => i.category === 'overdue' && !i.completed).length}
                    </span>
                  </button>

                  <button
                    onClick={() => setTodoFilter('today')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                      todoFilter === 'today'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <span>Today</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      todoFilter === 'today' ? 'bg-white/25 text-white' : 'bg-amber-200/80 text-amber-900'
                    }`}>
                      {todoItems.filter(i => i.category === 'today' && !i.completed).length}
                    </span>
                  </button>

                  <button
                    onClick={() => setTodoFilter('upcoming')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                      todoFilter === 'upcoming'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                    }`}
                  >
                    <span>Upcoming</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      todoFilter === 'upcoming' ? 'bg-white/25 text-white' : 'bg-blue-200/80 text-blue-900'
                    }`}>
                      {todoItems.filter(i => i.category === 'upcoming' && !i.completed).length}
                    </span>
                  </button>

                  <button
                    onClick={() => setTodoFilter('completed')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      todoFilter === 'completed'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    Done ({todoItems.filter(i => i.completed).length})
                  </button>
                </div>

                <button
                  onClick={() => scrollTodoFilters('right')}
                  className="shrink-0 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  aria-label="Scroll filter right"
                  title="Scroll right"
                >
                  <ChevronRight size={13} />
                </button>
              </div>

              {/* Rich Light-Dark Colored Tasks List (No Stroke, Darker Subject Badges with White Text & Simple Checkmark) */}
              <div className="space-y-4">
                {/* 1. Overdue Section */}
                {(todoFilter === 'all' || todoFilter === 'overdue') && (
                  <div>
                    <h3 className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle size={14} /> Overdue Tasks
                      </span>
                      <span className="text-[10px] bg-rose-200 text-rose-900 font-extrabold px-2 py-0.5 rounded-full">
                        {todoItems.filter(i => i.category === 'overdue').length}
                      </span>
                    </h3>

                    <div className="flex flex-col gap-2">
                      {todoItems.filter(i => i.category === 'overdue').map(item => (
                        <div
                          key={item.id}
                          className={`rounded-2xl p-3 relative transition-all duration-200 ${
                            item.completed
                              ? 'bg-slate-200/60 opacity-60'
                              : 'bg-rose-100/90 hover:bg-rose-200/90'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-extrabold shadow-2xs">
                                  <BookOpen size={10} /> {item.subject}
                                </span>
                                <span className="text-[10px] font-bold text-rose-800 flex items-center gap-0.5">
                                  <Clock size={10} /> {item.time}
                                </span>
                              </div>

                              <h4 className={`text-xs font-bold leading-snug ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {item.title}
                              </h4>
                            </div>

                            <button
                              onClick={() => toggleTodoItem(item.id)}
                              title={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                              className="shrink-0 p-1 transition-transform active:scale-90 cursor-pointer"
                            >
                              <CheckCircle2 size={22} className={item.completed ? 'fill-emerald-500 text-white' : 'text-rose-400/80 hover:text-emerald-500'} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Today Section */}
                {(todoFilter === 'all' || todoFilter === 'today') && (
                  <div>
                    <h3 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Zap size={14} /> Today&apos;s Focus
                      </span>
                      <span className="text-[10px] bg-amber-200 text-amber-950 font-extrabold px-2 py-0.5 rounded-full">
                        {todoItems.filter(i => i.category === 'today').length}
                      </span>
                    </h3>

                    <div className="flex flex-col gap-2">
                      {todoItems.filter(i => i.category === 'today').map(item => (
                        <div
                          key={item.id}
                          className={`rounded-2xl p-3 relative transition-all duration-200 ${
                            item.completed
                              ? 'bg-slate-200/60 opacity-60'
                              : 'bg-amber-100/90 hover:bg-amber-200/90'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-extrabold shadow-2xs">
                                  <BookOpen size={10} /> {item.subject}
                                </span>
                                <span className="text-[10px] font-bold text-amber-900 flex items-center gap-0.5">
                                  <Clock size={10} /> {item.time}
                                </span>
                              </div>

                              <h4 className={`text-xs font-bold leading-snug ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {item.title}
                              </h4>
                            </div>

                            <button
                              onClick={() => toggleTodoItem(item.id)}
                              title={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                              className="shrink-0 p-1 transition-transform active:scale-90 cursor-pointer"
                            >
                              <CheckCircle2 size={22} className={item.completed ? 'fill-emerald-500 text-white' : 'text-amber-500/80 hover:text-emerald-500'} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Upcoming Section */}
                {(todoFilter === 'all' || todoFilter === 'upcoming') && (
                  <div>
                    <h3 className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sun size={14} /> Upcoming Tasks
                      </span>
                      <span className="text-[10px] bg-blue-200 text-blue-950 font-extrabold px-2 py-0.5 rounded-full">
                        {todoItems.filter(i => i.category === 'upcoming').length}
                      </span>
                    </h3>

                    <div className="flex flex-col gap-2">
                      {todoItems.filter(i => i.category === 'upcoming').map(item => (
                        <div
                          key={item.id}
                          className={`rounded-2xl p-3 relative transition-all duration-200 ${
                            item.completed
                              ? 'bg-slate-200/60 opacity-60'
                              : 'bg-blue-100/90 hover:bg-blue-200/90'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-extrabold shadow-2xs">
                                  <BookOpen size={10} /> {item.subject}
                                </span>
                                <span className="text-[10px] font-bold text-blue-800 flex items-center gap-0.5">
                                  <Calendar size={10} /> {item.time}
                                </span>
                              </div>

                              <h4 className={`text-xs font-bold leading-snug ${item.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                {item.title}
                              </h4>
                            </div>

                            <button
                              onClick={() => toggleTodoItem(item.id)}
                              title={item.completed ? 'Mark as incomplete' : 'Mark as complete'}
                              className="shrink-0 p-1 transition-transform active:scale-90 cursor-pointer"
                            >
                              <CheckCircle2 size={22} className={item.completed ? 'fill-emerald-500 text-white' : 'text-blue-400/80 hover:text-emerald-500'} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
        </>
      )}
        </div>
      )}
    </div>
  );
}
