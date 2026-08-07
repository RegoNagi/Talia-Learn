'use client';

import { useState, useEffect } from 'react';
import { FileText, MessageSquare, Heart, CheckCircle, Star, Trophy, Link as LinkIcon, Plus, ArrowRight, Calendar } from 'lucide-react';
import Image from 'next/image';
import { getUpcomingSchoolEvents, getSchoolAnnouncements, ChallengeSubmission, SchoolEvent, SchoolAnnouncement } from '@/services/classSpaceData';
import { getAssignments, getSubmissionsForAssignment, getSubmissionFileUrl } from '@/services/assignmentData';
import { getMaterialFiles } from '@/services/libraryData';
import { getLiveSessions, RealLiveSession } from '@/services/liveSessionsData';
import { CreateEventPanel } from './CreateEventPanel';
import { CreateAnnouncementPanel } from './CreateAnnouncementPanel';

export function SpacesSidebar({ space, language = 'en', classId, subject, teacherId, authUser, isRealScope, topChallengers = [], hasActiveChallenge, onNavigate }: { space: 'school' | 'class' | 'subject', language?: 'ar' | 'en', classId?: string, subject?: string, teacherId?: string, authUser?: any, isRealScope?: boolean, topChallengers?: ChallengeSubmission[], hasActiveChallenge?: boolean, onNavigate?: (tab: string) => void }) {
  const creatorId = authUser?.teacherId || authUser?.userId || '';
  const creatorRole = authUser?.role === 'teacher' ? 'teacher' : 'admin';

  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [announcements, setSchoolAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [isEventPanelOpen, setIsEventPanelOpen] = useState(false);
  const [isAnnouncementPanelOpen, setIsAnnouncementPanelOpen] = useState(false);

  const refreshSchoolWidgets = () => {
    getUpcomingSchoolEvents().then(setEvents);
    getSchoolAnnouncements().then(setSchoolAnnouncements);
  };

  useEffect(() => {
    if (space === 'school') refreshSchoolWidgets();
  }, [space]);

  const [pendingItems, setPendingItems] = useState<{ id: string; title: string; sub: string; badge: string }[]>([]);
  const [resources, setResources] = useState<{ id: string; title: string; type: string; size: string; url: string }[]>([]);
  const [liveSessions, setLiveSessions] = useState<RealLiveSession[]>([]);
  const [isLoadingSidebarData, setIsLoadingSidebarData] = useState(false);

  useEffect(() => {
    if (!isRealScope || space !== 'subject' || !classId || !subject || !teacherId) return;
    setIsLoadingSidebarData(true);
    (async () => {
      const [assignments, files, sessions] = await Promise.all([
        getAssignments({ teacherId, classId, subject }),
        getMaterialFiles({ teacherId, classId, subject }),
        getLiveSessions(classId, subject),
      ]);
      setLiveSessions(sessions);
      const pending: { id: string; title: string; sub: string; badge: string }[] = [];
      for (const a of assignments.filter((x) => x.status === 'Active')) {
        const subs = await getSubmissionsForAssignment(a.id, classId);
        const toGrade = subs.filter((s) => s.status === 'Submitted' || s.status === 'Late').length;
        if (toGrade > 0) pending.push({ id: a.id, title: a.title, sub: `${toGrade} submissions`, badge: `${toGrade} Review` });
      }
      setPendingItems(pending.slice(0, 3));
      setResources(files.slice(0, 3).map((f) => ({ id: f.id, title: f.name, type: f.type, size: f.size, url: f.storagePath ? getSubmissionFileUrl(f.storagePath) : '' })));
      setIsLoadingSidebarData(false);
    })();
  }, [isRealScope, space, classId, subject, teacherId]);
  if (space === 'school') {
    return (
      <div className="w-80 flex-shrink-0 hidden xl:block space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Star className="text-yellow-500" size={20} /> Upcoming Events
            </h3>
            <button onClick={() => setIsEventPanelOpen(true)} className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-colors" title="Add Event">
              <Plus size={16} />
            </button>
          </div>
          {events.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming events.</p>
          ) : (
            <ul className="space-y-4">
              {events.map((ev) => {
                const d = new Date(ev.eventDate);
                return (
                  <li key={ev.id} className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold uppercase">{d.toLocaleDateString(undefined, { month: 'short' })}</span>
                      <span className="text-lg font-black leading-none">{d.getDate()}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm">{ev.title}</h4>
                      <p className="text-xs text-slate-500">{ev.location ? `${ev.location} • ` : ''}{d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="text-blue-500" size={20} /> Official Announcements
            </h3>
            <button onClick={() => setIsAnnouncementPanelOpen(true)} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors" title="Add Announcement">
              <Plus size={16} />
            </button>
          </div>
          {announcements.length === 0 ? (
            <p className="text-sm text-slate-400">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                  <h4 className="font-semibold text-blue-800 text-sm">{a.title}</h4>
                  <p className="text-xs text-blue-600 mt-1">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <CreateEventPanel isOpen={isEventPanelOpen} onClose={() => setIsEventPanelOpen(false)} creatorId={creatorId} creatorRole={creatorRole} onSaved={refreshSchoolWidgets} />
        <CreateAnnouncementPanel isOpen={isAnnouncementPanelOpen} onClose={() => setIsAnnouncementPanelOpen(false)} creatorId={creatorId} creatorRole={creatorRole} onSaved={refreshSchoolWidgets} />
      </div>
    );
  }

  if (space === 'class') {
    return (
      <div className="w-80 flex-shrink-0 hidden xl:block space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} /> {language === 'ar' ? 'طالب الأسبوع' : 'Student of the Week'}
          </h3>
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 relative overflow-hidden border-4 border-yellow-100 shadow-sm mb-3">
              <Image 
                src="https://picsum.photos/seed/studentweek/100" 
                alt="Student of the week" 
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <h4 className="font-bold text-slate-800">Emma Thompson</h4>
            <p className="text-xs text-slate-500 mt-1">{language === 'ar' ? 'للمساعدة المتميزة في المشاريع الجماعية والحفاظ على سلوك إيجابي!' : 'For outstanding help during group projects and maintaining a positive attitude!'}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Heart className="text-pink-500" size={20} /> {language === 'ar' ? 'متعقب مزاج الفصل' : 'Class Mood Tracker'}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl">😊</span>
              <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 w-[65%]"></div>
              </div>
              <span className="text-xs font-bold text-slate-500">65%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl">🤔</span>
              <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 w-[25%]"></div>
              </div>
              <span className="text-xs font-bold text-slate-500">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl">😴</span>
              <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 w-[10%]"></div>
              </div>
              <span className="text-xs font-bold text-slate-500">10%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (space === 'subject') {
    const now = Date.now();
    const liveNow = liveSessions.find((s) => {
      const start = new Date(s.scheduledAt).getTime();
      return Math.abs(now - start) < 60 * 60 * 1000 && now >= start;
    });
    const upcoming = liveSessions
      .filter((s) => new Date(s.scheduledAt).getTime() > now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];
    return (
      <div className="w-80 flex-shrink-0 hidden xl:block space-y-4">
        {/* Compact Live Now Card */}
        {liveNow && (
        <div className="bg-red-50/50 rounded-2xl border border-slate-100 border-l-[6px] border-l-red-500 shadow-md shadow-red-100/50 p-5 relative overflow-hidden group">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide text-red-600 uppercase">Live Now</span>
          </div>
          <h4 className="text-slate-900 font-semibold mb-4 leading-tight">{liveNow.title}</h4>
          <div className="flex items-center gap-2">
            <a href={liveNow.joinUrl} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95 shadow-sm text-center">
              Join Session
            </a>
            <button onClick={() => onNavigate?.('live-sessions')} className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors active:scale-95">
              Manage
            </button>
          </div>
        </div>
        )}

        {/* Compact Next Session Card */}
        {upcoming && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Next Session</span>
          </div>
          <h4 className="text-base font-bold text-slate-800">{upcoming.title}</h4>
          <p className="text-xs font-semibold text-indigo-500 mt-1">{new Date(upcoming.scheduledAt).toLocaleString(language === 'ar' ? 'ar-EG' : undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          <div className="flex justify-end mt-4 pt-3 border-t border-slate-50">
            <button onClick={() => onNavigate?.('live-sessions')} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 transition-colors group/link cursor-pointer">
              Open Calendar <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        )}

        {/* Compact Pending Assessments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 transition-all hover:shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-orange-500" />
            <h4 className="text-sm font-bold text-slate-800">Pending Assessments</h4>
          </div>
          <div className="space-y-3">
            {isLoadingSidebarData ? (
              <p className="text-xs text-slate-400">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
            ) : !isRealScope || pendingItems.length === 0 ? (
              <p className="text-xs text-slate-400">{language === 'ar' ? 'مفيش حاجة محتاجة تصحيح دلوقتي.' : 'Nothing pending grading right now.'}</p>
            ) : pendingItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex flex-col">
                  <h5 className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate max-w-[140px]">{item.title}</h5>
                  <p className="text-[10px] text-slate-400">{item.sub}</p>
                </div>
                <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded-md">{item.badge}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4 pt-3 border-t border-slate-50">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 transition-colors group/link">
              Open Gradebook <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <LinkIcon className="text-indigo-500" size={20} /> Important Resources
            </h3>
            {onNavigate && (
              <button onClick={() => onNavigate('learning-path')} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 transition-colors">
                {language === 'ar' ? 'عرض الكل' : 'View All'} <ArrowRight size={12} />
              </button>
            )}
          </div>
          <ul className="space-y-3">
            {isLoadingSidebarData ? (
              <p className="text-xs text-slate-400">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
            ) : !isRealScope || resources.length === 0 ? (
              <p className="text-xs text-slate-400">{language === 'ar' ? 'مفيش مصادر مضافة لسه.' : 'No resources added yet.'}</p>
            ) : resources.map((r) => (
              <li key={r.id}>
                <a href={r.url || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 text-sm group-hover:text-indigo-600 transition-colors">{r.title}</h4>
                    <p className="text-xs text-slate-400">{r.type.toUpperCase()} • {r.size}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            🏆 Top Challengers
          </h3>
          {!isRealScope ? (
            <p className="text-sm text-slate-400">{language === 'ar' ? 'لسه مفيش تحدي حاليًا.' : 'No challenge yet.'}</p>
          ) : !hasActiveChallenge ? (
            <p className="text-sm text-slate-400">{language === 'ar' ? 'لسه مفيش تحدي حاليًا.' : 'No challenge yet.'}</p>
          ) : topChallengers.length === 0 ? (
            <p className="text-sm text-slate-400">{language === 'ar' ? 'لسه مفيش حد اتقيّم في التحدي ده.' : 'No one graded yet in this challenge.'}</p>
          ) : (
            <ul className="space-y-2">
              {topChallengers.map((tc, idx) => (
                <li key={tc.id} className={`flex items-center gap-3 rounded-lg p-2 ${idx === 0 ? 'bg-amber-50/50' : ''}`}>
                  <span className="text-xl">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <span className={`text-sm truncate ${idx === 0 ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>{tc.studentName}</span>
                  <span className={`ml-auto font-bold text-sm ${idx === 0 ? 'text-orange-600' : 'text-slate-600'}`}>{tc.xpAwarded} XP</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return null;
}
