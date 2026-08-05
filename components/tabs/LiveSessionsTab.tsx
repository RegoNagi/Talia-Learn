'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { getLiveSessions, createLiveSession, deleteLiveSession, RealLiveSession } from '@/services/liveSessionsData';
import { broadcastMessageToClass, getClassAnnouncementsForStudent, AppMessage } from '@/services/messagesData';
import { getClassRoster } from '@/services/assignmentData';
import { 
  Video, 
  Calendar, 
  Users, 
  Play, 
  Sparkles, 
  Users2, 
  MoreVertical, 
  MessageSquare,
  Clock,
  ChevronRight,
  Radio,
  Plus,
  X,
  FileText,
  Download,
  BarChart3,
  PieChart,
  CalendarPlus,
  Trash2,
  Edit,
  EyeOff,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Book
} from 'lucide-react';

interface Session {
  id: string;
  title: string;
  date: string;
  time: string;
  attendance: string;
  hasSummary: boolean;
}

interface UpcomingSession {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
  joinUrl: string;
}

export function LiveSessionsTab({ viewRole = 'TEACHER', classId, subject, teacherId, teacherName, studentId, className }: { viewRole?: string; classId?: string; subject?: string; teacherId?: string; teacherName?: string; studentId?: string; className?: string }) {
  const isTeacher = viewRole === 'TEACHER';
  const isStudent = viewRole === 'STUDENT';
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showScheduleFormModal, setShowScheduleFormModal] = useState(false);
  const [showAllArchiveModal, setShowAllArchiveModal] = useState(false);
  const [isAnnouncementsModalOpen, setIsAnnouncementsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [sessions, setSessions] = useState<RealLiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = () => {
    if (!classId || !subject) { setIsLoading(false); return; }
    setIsLoading(true);
    getLiveSessions(classId, subject).then((data) => {
      setSessions(data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    refresh();
  }, [classId, subject]);

  const now = new Date();
  const upcomingAll = sessions.filter((s) => new Date(s.scheduledAt) >= now).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const pastAll = sessions.filter((s) => new Date(s.scheduledAt) < now).sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const activeSession = upcomingAll[0] ? {
    id: upcomingAll[0].id,
    title: upcomingAll[0].title,
    date: new Date(upcomingAll[0].scheduledAt).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    time: new Date(upcomingAll[0].scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    agenda: upcomingAll[0].agenda ? upcomingAll[0].agenda.split('\n').filter(Boolean) : [],
    joinUrl: upcomingAll[0].joinUrl,
  } : null;

  const upcomingSessions: UpcomingSession[] = upcomingAll.slice(1).map((s) => ({
    id: s.id,
    date: new Date(s.scheduledAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    time: new Date(s.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    title: s.title,
    color: 'bg-indigo-400',
    joinUrl: s.joinUrl,
  }));

  const archiveSessions: Session[] = pastAll.map((s) => ({
    id: s.id,
    title: s.title,
    date: new Date(s.scheduledAt).toLocaleDateString(),
    time: new Date(s.scheduledAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
    attendance: '—',
    hasSummary: false,
  }));

  // ============ Schedule Form ============
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newAgenda, setNewAgenda] = useState('');
  const [newJoinUrl, setNewJoinUrl] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  const handleCreateSession = async () => {
    if (!classId || !subject || !teacherId || !newTitle.trim() || !newDate || !newJoinUrl.trim()) return;
    setIsSavingSession(true);
    setScheduleError('');
    const { ok, error } = await createLiveSession({
      classId,
      subject,
      teacherId,
      title: newTitle.trim(),
      agenda: newAgenda.trim(),
      scheduledAt: `${newDate}T${newTime || '10:00'}`,
      joinUrl: newJoinUrl.trim(),
    });
    setIsSavingSession(false);
    if (ok) {
      setShowScheduleFormModal(false);
      setNewTitle('');
      setNewDate('');
      setNewTime('10:00');
      setNewAgenda('');
      setNewJoinUrl('');
      refresh();
    } else {
      setScheduleError(error || 'Unknown error');
    }
  };

  // ============ Announcements ============
  const [announcements, setAnnouncements] = useState<AppMessage[]>([]);
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState('');

  useEffect(() => {
    if (isStudent && studentId) {
      getClassAnnouncementsForStudent(studentId, isAnnouncementsModalOpen ? 50 : 5).then(setAnnouncements);
    }
  }, [isStudent, studentId, isAnnouncementsModalOpen]);

  const handleSendAnnouncement = async () => {
    if (!classId || !teacherId || !teacherName || !broadcastText.trim()) return;
    setIsBroadcasting(true);
    setBroadcastResult('');
    const roster = await getClassRoster(classId);
    const { ok, error } = await broadcastMessageToClass({
      senderId: teacherId,
      senderName: teacherName,
      studentIds: roster.map((s) => s.id),
      content: broadcastText.trim(),
    });
    setIsBroadcasting(false);
    if (ok) {
      setBroadcastText('');
      setShowBroadcastModal(false);
    } else {
      setBroadcastResult(error || 'Failed to send.');
    }
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-6 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Main Work Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Hero Card: Start Session */}
          <section>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              
              <div className="relative bg-white rounded-[2rem] border border-slate-100 shadow-none p-8">
                {!activeSession ? (
                  <div className="text-center py-8">
                    <Video size={36} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium mb-4">{isTeacher ? 'No upcoming session scheduled yet.' : 'No upcoming session scheduled yet.'}</p>
                    {isTeacher && (
                      <button onClick={() => setShowScheduleFormModal(true)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all">
                        Schedule a Session
                      </button>
                    )}
                  </div>
                ) : (
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                        <Radio size={14} className="text-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none">READY TO START</span>
                      </div>
                      <span className="text-slate-400 text-xs font-medium flex items-center gap-1">
                        <Clock size={14} /> {activeSession.date} • {activeSession.time}
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold text-slate-800 leading-tight">
                      {activeSession.title}
                    </h2>

                    {activeSession.agenda.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">PLANNED AGENDA</p>
                      <ul className="space-y-2">
                        {activeSession.agenda.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-none"></div>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <a href={activeSession.joinUrl} target="_blank" rel="noreferrer" className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                      {isTeacher ? 'Start Live Session' : 'Join Live Session'}
                      <Video size={18} />
                    </a>
                    <button className="w-full bg-white border border-slate-100 text-slate-600 px-6 py-4 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-none" onClick={() => setShowMaterialsModal(true)}>
                      Session Materials
                    </button>
                  </div>
                </div>
                )}
              </div>
            </div>
          </section>

          {/* Archive Section: Class Performance */}
          <section className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Past Sessions Archive</h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowAllArchiveModal(true)}
                    className="text-sm font-semibold text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    View All
                  </button>
                  {!isStudent && (
                    <button 
                      onClick={() => setShowReportsModal(true)}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      View Reports
                    </button>
                  )}
                </div>
              </div>

              {/* Minimalist Filter Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-slate-100 p-3 rounded-2xl shadow-none">
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
                  <button className="px-4 py-2 bg-white text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-none hover:bg-slate-50 transition-colors whitespace-nowrap">Today</button>
                  <button className="px-4 py-2 bg-transparent text-slate-500 text-xs font-semibold rounded-xl border border-transparent hover:bg-slate-200/50 transition-colors whitespace-nowrap">This Week</button>
                  <button className="px-4 py-2 bg-transparent text-slate-500 text-xs font-semibold rounded-xl border border-transparent hover:bg-slate-200/50 transition-colors whitespace-nowrap">This Month</button>
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">From</span>
                    <input 
                      type="date" 
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-none font-medium"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">To</span>
                    <input 
                      type="date" 
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-none font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {archiveSessions.slice(0, 3).map((session) => (
                <div 
                  key={session.id}
                  className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between hover:shadow-none transition-all group relative"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <Play size={20} fill="currentColor" />
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{session.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400 font-medium">{session.date}</span>
                        <div className="flex items-center gap-2">
                          {session.hasSummary && (
                            <span className="flex items-center gap-1 bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-100">
                              <Sparkles size={10} /> AI Summary Ready
                            </span>
                          )}
                          <span className="flex items-center gap-1 bg-slate-50 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-100">
                            <Users size={10} /> {session.attendance} Attended
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isStudent && (
                      <>
                        <button 
                          onClick={() => setShowInsightsModal(true)}
                          className="hidden md:flex px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors shadow-none"
                        >
                          Insights
                        </button>
                        <div className="relative">
                          <button 
                            onClick={() => setActiveMenuId(activeMenuId === session.id ? null : session.id)}
                            className={`p-2 rounded-lg transition-colors ${activeMenuId === session.id ? 'bg-slate-100 text-slate-900' : 'text-slate-300 hover:text-slate-600 hover:bg-slate-50'}`}
                          >
                            <MoreVertical size={20} />
                          </button>
                          
                          <AnimatePresence>
                            {activeMenuId === session.id && (
                              <div key={`menu-wrapper-${session.id}`}>
                                <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-none border border-slate-100 py-2 z-50"
                                >
                                  {[
                                    { id: 'delete', icon: <Trash2 size={14} />, label: 'Delete Session', color: 'text-rose-600' },
                                  ].map((item) => (
                                    <button
                                      key={item.id}
                                      onClick={async () => {
                                        if (confirm(`Delete "${session.title}"?`)) {
                                          await deleteLiveSession(session.id);
                                          refresh();
                                        }
                                        setActiveMenuId(null);
                                      }}
                                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold hover:bg-slate-50 transition-colors ${item.color}`}
                                    >
                                      {item.icon}
                                      {item.label}
                                    </button>
                                  ))}
                                </motion.div>
                              </div>
                            )}
                          </AnimatePresence>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Contextual Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Class Communication Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-none p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center mb-4 border border-indigo-100">
                <Users2 size={40} className="text-indigo-500" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">{className || subject || 'Class'}</h4>
              <p className="text-xs font-medium text-slate-400 mb-6">Fall 2026 Class</p>
              
              {!isStudent ? (
                <button 
                  onClick={() => setShowBroadcastModal(true)}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-none"
                >
                  <MessageSquare size={18} />
                  Send Announcement
                </button>
              ) : (
                <div className="w-full mt-2 text-left space-y-3 flex flex-col">
                  <h5 className="font-bold text-slate-800 text-sm mb-1">Latest Announcements</h5>
                  {announcements.length === 0 ? (
                    <p className="text-xs text-slate-400">No announcements yet.</p>
                  ) : announcements.slice(0, 2).map((a) => (
                    <div key={a.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm text-slate-600 text-left">
                      <p className="mb-2">{a.content}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                  ))}
                  <button 
                    onClick={() => setIsAnnouncementsModalOpen(true)}
                    className="w-full py-2.5 mt-1 bg-transparent text-teal-600 hover:bg-teal-50 rounded-xl font-bold text-sm transition-colors shadow-none text-center"
                  >
                    View All Announcements
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Schedule Card */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-none p-6">
            <div className="flex items-center justify-between mb-6 px-1">
              <h4 className="text-lg font-bold text-slate-800">Upcoming Sessions</h4>
              <button 
                onClick={() => setShowCalendarModal(true)}
                className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1.5 group"
              >
                Full Calendar
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
            
            <div className="space-y-3">
              {upcomingSessions.map((u, index) => (
                <div 
                  key={u.id} 
                  className={`relative p-4 rounded-xl transition-all cursor-pointer flex items-center gap-4 ${
                    index === 0 
                      ? 'bg-indigo-50/50 border-l-4 border-indigo-600 rounded-r-xl rounded-l-sm' 
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'
                  }`} 
                  onClick={() => window.open(u.joinUrl, '_blank')}
                >
                  {index === 0 && (
                    <div className="absolute top-3 right-4">
                      <span className="bg-white text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-none border border-indigo-100">
                        Live Soon
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center justify-center w-12 h-12 bg-white border border-slate-100 rounded-lg shadow-none shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
                      {u.date.split(' ')[0]}
                    </span>
                    <span className="text-lg font-bold text-slate-800 leading-none">
                      {u.date.split(' ')[1]}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-indigo-500 animate-pulse' : u.color.replace('bg-', 'bg-')}`}></div>
                       <p className={`text-sm font-bold truncate ${index === 0 ? 'text-slate-900' : 'text-slate-700'} group-hover:text-indigo-600 transition-colors`}>
                        {u.title}
                      </p>
                    </div>
                    <p className={`text-xs mt-0.5 ${index === 0 ? 'text-indigo-600 font-semibold' : 'text-slate-400 font-medium'}`}>
                      {u.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Class Attendance Stats */}
          {!isStudent && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-none p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-slate-800 text-sm">Class Engagement</h4>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  Excellent
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-end justify-between font-bold">
                  <span className="text-3xl text-slate-800">92%</span>
                  <span className="text-xs text-slate-400 pb-1 uppercase tracking-widest">Average Attendance</span>
                </div>
                
                <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden" onClick={() => setShowReportsModal(true)}>
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full"
                    style={{ width: '92%' }}
                  ></div>
                </div>
                
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  <span className="text-slate-800 font-bold">22 out of 25</span> students attend live sessions regularly.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Broadcast Modal */}
        {showBroadcastModal && (
          <div key="modal-broadcast" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBroadcastModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-none overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800">Send Announcement</h3>
                <button onClick={() => setShowBroadcastModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-900 shadow-none">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500">This message will be sent as a notification to all students in <span className="font-bold text-slate-800">{className || subject || 'this class'}</span>.</p>
                <textarea 
                  value={broadcastText}
                  onChange={(e) => setBroadcastText(e.target.value)}
                  placeholder="Write your announcement here..."
                  className="w-full h-40 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none shadow-none"
                />
                {broadcastResult && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">{broadcastResult}</p>}
                <button 
                  onClick={handleSendAnnouncement}
                  disabled={!broadcastText.trim() || isBroadcasting}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-none"
                >
                  {isBroadcasting ? 'Sending...' : 'Send to Class'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Calendar Modal */}
        {showCalendarModal && (
          <div key="modal-calendar" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCalendarModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-none overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]"
            >
              <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800 tracking-tight">Class Schedule</h3>
                  <p className="text-sm font-semibold text-slate-400">Spring Term 2026</p>
                </div>
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-none">
                    <RefreshCw size={16} />
                    <span className="hidden sm:inline">Sync Outlook</span>
                  </button>
                  <button 
                    onClick={() => setShowScheduleFormModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-none shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                  >
                    <CalendarPlus size={18} />
                    <span className="hidden sm:inline">Schedule New Session</span>
                  </button>
                  <button onClick={() => setShowCalendarModal(false)} className="p-2.5 bg-white border border-slate-100 hover:bg-slate-50 rounded-xl transition-colors text-slate-900 shadow-none">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-8 bg-white overflow-y-auto flex-1 custom-scrollbar">
                {/* Day Selector Tabs */}
                <div className="flex gap-2 bg-slate-50 p-1.5 rounded-full inline-flex mb-6">
                  <button className="text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-none font-medium px-6 py-2 rounded-full transition-colors">Sun</button>
                  <button className="bg-blue-600 text-white shadow-none font-medium px-6 py-2 rounded-full transition-colors">Mon</button>
                  <button className="text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-none font-medium px-6 py-2 rounded-full transition-colors">Tue</button>
                  <button className="text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-none font-medium px-6 py-2 rounded-full transition-colors">Wed</button>
                  <button className="text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-none font-medium px-6 py-2 rounded-full transition-colors">Thu</button>
                </div>
                
                {/* Schedule List */}
                <div className="border border-slate-100 rounded-2xl bg-white shadow-none overflow-hidden">
                  {/* Table Headers */}
                  <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="col-span-3 text-slate-400 text-sm font-medium uppercase tracking-wider">Time</div>
                    <div className="col-span-4 text-slate-400 text-sm font-medium uppercase tracking-wider">Session</div>
                    <div className="col-span-2 text-slate-400 text-sm font-medium uppercase tracking-wider">Instructor</div>
                    <div className="col-span-1 text-slate-400 text-sm font-medium uppercase tracking-wider text-center">Status</div>
                    <div className="col-span-2 text-slate-400 text-sm font-medium uppercase tracking-wider text-right">Action</div>
                  </div>
                  
                  {/* Rows */}
                  <div className="divide-y divide-slate-100">
                    {/* Row 1 - Live Now */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 hover:bg-slate-50 transition-colors group">
                      <div className="col-span-3 font-semibold text-slate-800 text-sm">
                        11:30 AM - 12:30 PM
                      </div>
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                          <Book size={16} className="text-indigo-600" />
                        </div>
                        <span className="text-slate-800 font-medium text-sm truncate">Physics - Mechanics</span>
                      </div>
                      <div className="col-span-2 text-slate-600 text-sm font-medium truncate">
                        Alex Johnson
                      </div>
                      <div className="col-span-1 flex justify-center">
                         <span className="bg-red-50 text-red-600 border border-red-100 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider whitespace-nowrap">
                           LIVE NOW
                         </span>
                      </div>
                      <div className="col-span-2 flex justify-end">
                         <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-none w-full md:w-auto text-center">
                           Join Class
                         </button>
                      </div>
                    </div>
                    
                    {/* Row 2 - Upcoming */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 hover:bg-slate-50 transition-colors group">
                      <div className="col-span-3 font-semibold text-slate-600 text-sm">
                        01:00 PM - 02:00 PM
                      </div>
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                          <Book size={16} className="text-emerald-600" />
                        </div>
                        <span className="text-slate-700 font-medium text-sm truncate">Mathematics - Linear Algebra</span>
                      </div>
                      <div className="col-span-2 text-slate-500 text-sm font-medium truncate">
                        Alex Johnson
                      </div>
                      <div className="col-span-1 flex justify-center">
                         <span className="bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider whitespace-nowrap">
                           Upcoming
                         </span>
                      </div>
                      <div className="col-span-2 flex justify-end">
                         <button className="bg-slate-100 text-slate-600 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-none w-full md:w-auto text-center">
                           Copy Link
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="px-8 py-4 border-t border-slate-50 bg-slate-50 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-none"></span>
                    <span className="text-xs text-slate-500 font-medium tracking-wide">Live Sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-none"></span>
                    <span className="text-xs text-slate-500 font-medium tracking-wide">Scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-none"></span>
                    <span className="text-xs text-slate-500 font-medium tracking-wide">Recordings</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Materials Modal */}
        {showMaterialsModal && (
          <div key="modal-materials" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMaterialsModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-none overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-800">Session Materials</h3>
                <button onClick={() => setShowMaterialsModal(false)} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 text-slate-900">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Materials</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { name: 'Matrix Transformations.pdf', size: '2.4 MB', type: 'PDF' },
                      { name: 'Determinant Visualizer.pptx', size: '15.8 MB', type: 'Slides' },
                      { name: 'Problem Set 4.docx', size: '840 KB', type: 'Doc' }
                    ].map((file, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-50 group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-none">
                            <FileText size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">{file.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{file.type} • {file.size}</p>
                          </div>
                        </div>
                        <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors">
                          <Download size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {!isStudent && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Upload New</h4>
                    <div className="border-2 border-dashed border-slate-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer group">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-all">
                        <UploadCloud size={28} className="text-slate-400 group-hover:text-indigo-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-700 mb-1">Click or drag to upload</p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-6">PDF, Slides, Doc (Max 50MB)</p>
                      <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-none group-hover:bg-indigo-700 transition-all">
                        + Upload Material
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* Insights Modal */}
        {showInsightsModal && (
          <div key="modal-insights" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInsightsModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-none overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">Attendance Roster</h3>
                  <p className="text-sm font-medium text-slate-400">Session 3: Basic Operations • April 28</p>
                </div>
                <button onClick={() => setShowInsightsModal(false)} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 text-slate-900">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {[
                  { name: 'Sarah Jenkins', avatar: 'https://picsum.photos/seed/sarah/100', present: true, timeAttended: '58m' },
                  { name: 'Alex Rivera', avatar: 'https://picsum.photos/seed/alex2/100', present: true, timeAttended: '60m' },
                  { name: 'Jordan Smith', avatar: 'https://picsum.photos/seed/jordan/100', present: false, timeAttended: '0m' },
                  { name: 'Taylor Wong', avatar: 'https://picsum.photos/seed/taylor/100', present: true, timeAttended: '45m' },
                  { name: 'Casey Jones', avatar: 'https://picsum.photos/seed/casey/100', present: true, timeAttended: '60m' },
                ].map((student, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 relative">
                        <Image 
                          src={student.avatar} 
                          alt={student.name} 
                          fill 
                          className="object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{student.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Time: {student.timeAttended}</p>
                      </div>
                    </div>
                    {student.present ? (
                      <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-emerald-100">
                        <CheckCircle2 size={10} /> Present
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-rose-50 text-rose-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-rose-100">
                        <AlertCircle size={10} /> Absent
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100">
                <button className="w-full py-3 bg-white border border-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-white/50 transition-colors">
                  Download Full Roster (Excel)
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Reports Modal */}
        {showReportsModal && (
          <div key="modal-reports" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportsModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-none overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-800">Class Performance Reports</h3>
                <button onClick={() => setShowReportsModal(false)} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-400 text-slate-900">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Avg Attendance', value: '92%', icon: <Users size={20} className="text-emerald-500" />, color: 'bg-emerald-50' },
                    { label: 'Participation Level', value: 'High', icon: <BarChart3 size={20} className="text-indigo-500" />, color: 'bg-indigo-50' },
                    { label: 'Materials Accessed', value: '84%', icon: <PieChart size={20} className="text-purple-500" />, color: 'bg-purple-50' },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 bg-white border border-slate-100 shadow-none rounded-3xl flex flex-col gap-4">
                      <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center`}>
                        {stat.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Attendance Trend (Last 5 Sessions)</h4>
                  <div className="h-48 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-end justify-around p-8">
                    {[85, 92, 88, 96, 92].map((val, i) => (
                      <div key={i} className="flex flex-col items-center gap-3 h-full justify-end">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${val}%` }}
                          transition={{ duration: 1, delay: i * 0.1 }}
                          className="w-12 bg-indigo-500 rounded-t-xl relative group"
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {val}%
                          </div>
                        </motion.div>
                        <span className="text-[10px] font-bold text-slate-400">S{i + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Schedule Form Modal */}
        {showScheduleFormModal && (
          <div key="modal-schedule-form" className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScheduleFormModal(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[2rem] shadow-none overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]"
            >
              <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800">Schedule New Session</h3>
                  <p className="text-sm font-medium text-slate-400">Add a session to {className || subject || 'this class'}</p>
                </div>
                <button onClick={() => setShowScheduleFormModal(false)} className="p-2.5 hover:bg-slate-50 rounded-xl transition-colors text-slate-900 border border-transparent">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Session Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Session 5: Eigenvalues & Stability"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Date</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="date" 
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Time</label>
                    <div className="relative">
                      <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="time" 
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Meeting Link</label>
                  <div className="relative">
                    <Video size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="url" 
                      value={newJoinUrl}
                      onChange={(e) => setNewJoinUrl(e.target.value)}
                      placeholder="Paste your Google Meet link (meet.google.com/new)"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-400 ml-1">Open meet.google.com/new in another tab, copy the link, and paste it here.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Agenda / Summary</label>
                  <textarea 
                    value={newAgenda}
                    onChange={(e) => setNewAgenda(e.target.value)}
                    placeholder="Briefly describe what will be covered..."
                    className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                  />
                </div>

                {scheduleError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">{scheduleError}</p>}

                <button 
                  onClick={handleCreateSession}
                  disabled={!newTitle.trim() || !newDate || !newJoinUrl.trim() || isSavingSession}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-none shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-60 transition-all active:scale-[0.99]"
                >
                  {isSavingSession ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* All Archive Modal */}
        {showAllArchiveModal && (
          <div key="modal-all-archive" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllArchiveModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-[2rem] shadow-none overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]"
            >
              <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                <div className="space-y-1">
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">All Past Sessions</h3>
                  <p className="text-sm font-medium text-slate-400">Browse and search through previous sessions</p>
                </div>
                <button 
                  onClick={() => setShowAllArchiveModal(false)} 
                  className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100 active:scale-95"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-8 py-4 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row gap-4 shrink-0">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search sessions..."
                    className="w-full pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                  />
                </div>
                <div className="relative w-full md:w-64 text-slate-900">
                   <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Filter by date..."
                    className="w-full pl-11 pr-6 py-3 bg-white border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4 custom-scrollbar bg-white">
                {archiveSessions.map((session, i) => (
                  <div 
                    key={`${session.id}-${i}`}
                    className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-between hover:shadow-none transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Play size={20} fill="currentColor" />
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-slate-800 text-base">{session.title}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400 font-medium">{session.date}</span>
                          <div className="flex items-center gap-2">
                            {session.hasSummary && (
                              <span className="flex items-center gap-1 bg-purple-50 text-purple-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-purple-100">
                                <Sparkles size={10} /> AI Summary
                              </span>
                            )}
                            <span className="flex items-center gap-1 bg-slate-50 text-slate-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-slate-100">
                              <Users size={10} /> {session.attendance}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {!isStudent && (
                      <button 
                        onClick={() => setShowInsightsModal(true)}
                        className="px-5 py-2.5 bg-slate-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100"
                      >
                        View Insights
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Announcements Modal */}
        {isAnnouncementsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAnnouncementsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-none overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white shrink-0">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900">All Announcements</h3>
                  <p className="text-xs font-medium text-slate-400">{className || subject || 'Class'} notifications</p>
                </div>
                <button 
                  onClick={() => setIsAnnouncementsModalOpen(false)} 
                  className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar bg-white">
                {announcements.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No announcements yet.</p>
                ) : announcements.map((a) => (
                  <div key={a.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-600">
                    <p className="mb-2 font-medium">{a.content}</p>
                    <span className="text-xs text-slate-400 font-medium tracking-wide">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
