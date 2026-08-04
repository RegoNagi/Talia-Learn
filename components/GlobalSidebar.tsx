'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Building, Database, LogOut, Globe, Users, ListVideo, MessageSquare, Activity, Calendar, BookOpen, X } from 'lucide-react';
import taliaLogo from '@/assets/talia-learn-logo.png';

const dict = {
  ar: {
    home: 'الرئيسية',
    myClasses: 'فصولي',
    schoolSpace: 'مساحة المدرسة',
    messages: 'مركز الرسائل',
    radar: 'رادار التحذير',
    roster: 'قائمة طلاب الفصل',
    calendar: 'التقويم',
    activityStream: 'مسار الأنشطة',
    questionBank: 'بنك الأسئلة',
    systemLive: 'حالة النظام',
    logout: 'تسجيل الخروج',
  },
  en: {
    home: 'Home',
    myClasses: 'My Classes',
    schoolSpace: 'School Space',
    messages: 'Messages',
    radar: 'Early Warning Radar',
    roster: 'Class Roster',
    calendar: 'Calendar',
    activityStream: 'Activity Stream',
    questionBank: 'Question Bank',
    systemLive: 'System Live',
    logout: 'Logout',
  }
};

export function GlobalSidebar({ 
  onSpaceSelect, 
  activeSpace, 
  isPinned, 
  setIsPinned,
  language = 'en',
  onLanguageChange,
  onLogout,
  userRole = 'teacher',
  isMobileOpen = false,
  onMobileClose
}: { 
  onSpaceSelect?: (space: string | null) => void, 
  activeSpace?: string | null, 
  isPinned?: boolean, 
  setIsPinned?: (pinned: boolean) => void,
  language?: 'ar' | 'en',
  onLanguageChange?: (lang: 'ar' | 'en') => void,
  onLogout?: () => void,
  userRole?: 'student' | 'teacher' | 'parent',
  isMobileOpen?: boolean,
  onMobileClose?: () => void
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [internalLang, setInternalLang] = useState<'ar' | 'en'>('en');
  const [logoError, setLogoError] = useState(false);
  const currentLang = onLanguageChange ? language : internalLang;

  const handleLanguageToggle = () => {
    const newLang = currentLang === 'ar' ? 'en' : 'ar';
    if (onLanguageChange) {
      onLanguageChange(newLang);
    } else {
      setInternalLang(newLang);
    }
  };
  
  useEffect(() => {
    if (setIsPinned) {
      setIsPinned(true);
    }
  }, [setIsPinned]);

  const t = dict[currentLang];
  const isRtl = currentLang === 'ar';
  const isTeacher = userRole === 'teacher';

  const handleNavClick = (action: () => void) => {
    action();
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onMobileClose} 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300" 
        />
      )}

      <aside 
        className={`
          w-64 shrink-0 bg-white border-gray-200 flex flex-col py-6 px-4 z-50 
          transition-transform duration-300 ease-in-out
          fixed top-0 bottom-0 ${isRtl ? 'right-0 border-l' : 'left-0 border-r'}
          lg:static lg:translate-x-0
          ${isMobileOpen 
            ? 'translate-x-0 shadow-2xl' 
            : (isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0')
          }
        `}
      >
        {/* Mobile Close Button */}
        {onMobileClose && (
          <button 
            onClick={onMobileClose} 
            className="lg:hidden absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        )}

        {/* Top Area: Logo */}
      <div className="w-24 h-24 mx-auto mb-8 shrink-0 flex items-center justify-center rounded-xl overflow-hidden">
        {!logoError ? (
          <img 
            src={typeof taliaLogo === 'string' ? taliaLogo : taliaLogo.src} 
            alt="Talia Learn Logo" 
            className="w-full h-auto object-contain"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-xs font-black text-orange-600 tracking-tight" style={{ fontFamily: "'Cairo', sans-serif" }}>Talia Learn</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 flex flex-col gap-2 w-full overflow-y-auto">
        <NavItem 
          icon={<Home size={20} />} 
          label={t.home} 
          active={pathname === '/' && activeSpace === 'home'}
          onClick={() => handleNavClick(() => {
            if (pathname !== '/') router.push('/');
            onSpaceSelect?.('home');
          })} 
        />
        <NavItem 
          icon={<BookOpen size={20} />} 
          label={t.myClasses} 
          active={pathname === '/' && (activeSpace === 'myClasses' || activeSpace === 'subjects' || activeSpace === 'class')}
          onClick={() => handleNavClick(() => {
            if (pathname !== '/') router.push('/');
            onSpaceSelect?.('myClasses');
          })} 
        />
        <NavItem 
          icon={<Building size={20} />} 
          label={t.schoolSpace} 
          active={activeSpace === 'school'}
          onClick={() => handleNavClick(() => onSpaceSelect?.('school'))} 
        />
        
        {isTeacher && (
          <NavItem 
            icon={<Users size={20} />} 
            label={t.roster} 
            active={activeSpace === 'roster'}
            onClick={() => handleNavClick(() => onSpaceSelect?.('roster'))} 
          />
        )}
        
        <NavItem 
          icon={<MessageSquare size={20} />} 
          label={t.messages} 
          active={activeSpace === 'messages'}
          onClick={() => handleNavClick(() => onSpaceSelect?.('messages'))} 
        />

        {isTeacher && (
          <NavItem 
            icon={<Activity size={20} />} 
            label={t.radar} 
            active={activeSpace === 'radar'}
            onClick={() => handleNavClick(() => onSpaceSelect?.('radar'))} 
          />
        )}

        <NavItem 
          icon={<Calendar size={20} />} 
          label={t.calendar} 
          active={activeSpace === 'calendar'}
          onClick={() => handleNavClick(() => onSpaceSelect?.('calendar'))} 
        />

        {isTeacher && (
          <NavItem 
            icon={<ListVideo size={20} />} 
            label={t.activityStream} 
            active={pathname === '/activity-stream'} 
            onClick={() => handleNavClick(() => router.push('/activity-stream'))}
          />
        )}

        {isTeacher && (
          <NavItem 
            icon={<Database size={20} />} 
            label={t.questionBank} 
            active={pathname === '/question-bank'} 
            onClick={() => handleNavClick(() => router.push('/question-bank'))}
          />
        )}
      </nav>

      {/* Bottom Area (Footer Widgets) */}
      <div className="mt-auto flex flex-col gap-2 w-full pt-4 border-t border-gray-200 shrink-0">
        <div className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-600">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          {t.systemLive}
        </div>
        <button onClick={onLogout} className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full text-start cursor-pointer outline-none">
          <div className="shrink-0 text-gray-400">
            <LogOut size={20} />
          </div>
          <span className="font-medium text-sm">{t.logout}</span>
        </button>
      </div>
    </aside>
    </>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className={`w-full text-start flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
        ${active 
          ? 'bg-orange-50 text-orange-700' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
        }`}
    >
      <div className={`shrink-0 ${active ? 'text-orange-500' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}
