'use client';

import { useRef, useState } from 'react';
import { CheckSquare, ChevronRight, ChevronLeft, AlertCircle, Zap, Sun, CalendarRange, BookOpen, BrainCircuit, Video, Paperclip, ClipboardList, Check, Clock } from 'lucide-react';
import { TodoTask, toggleQuickTaskCompletion } from '@/services/todoData';

const BUCKET_META: Record<TodoTask['bucket'], {
  labelAr: string; labelEn: string; sectionLabelAr: string; sectionLabelEn: string; icon: any; bg: string; text: string; border: string; hoverBorder: string; badgeBg: string; softBg: string;
}> = {
  overdue: { labelAr: 'متأخر', labelEn: 'Overdue', sectionLabelAr: 'مهام متأخرة', sectionLabelEn: 'OVERDUE TASKS', icon: AlertCircle, bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-300', hoverBorder: 'hover:border-rose-400', badgeBg: 'bg-rose-500', softBg: 'bg-rose-100' },
  today: { labelAr: 'النهاردة', labelEn: 'Today', sectionLabelAr: 'مهام النهاردة', sectionLabelEn: "TODAY'S FOCUS", icon: Zap, bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-300', hoverBorder: 'hover:border-amber-400', badgeBg: 'bg-amber-500', softBg: 'bg-amber-100' },
  tomorrow: { labelAr: 'بكرة', labelEn: 'Tomorrow', sectionLabelAr: 'مهام بكرة', sectionLabelEn: 'TOMORROW', icon: Sun, bg: 'bg-blue-500', text: 'text-sky-500', border: 'border-blue-300', hoverBorder: 'hover:border-blue-400', badgeBg: 'bg-blue-500', softBg: 'bg-blue-100' },
  upcoming: { labelAr: 'قريبًا', labelEn: 'Upcoming', sectionLabelAr: 'مهام قريبة', sectionLabelEn: 'UPCOMING TASKS', icon: CalendarRange, bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-300', hoverBorder: 'hover:border-purple-400', badgeBg: 'bg-purple-500', softBg: 'bg-purple-100' },
};

const BUCKET_ORDER: TodoTask['bucket'][] = ['overdue', 'today', 'tomorrow', 'upcoming'];

function typeIcon(type: TodoTask['type']) {
  switch (type) {
    case 'quiz': return BrainCircuit;
    case 'live_session': return Video;
    case 'curriculum': return BookOpen;
    case 'quick_task': return Paperclip;
    default: return ClipboardList;
  }
}

function formatDueLabel(task: TodoTask, language: 'ar' | 'en'): string {
  const d = new Date(task.dueDate);
  const time = d.toLocaleTimeString(language === 'ar' ? 'ar-EG' : undefined, { hour: '2-digit', minute: '2-digit' });
  if (task.bucket === 'overdue') {
    const days = Math.max(1, Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));
    return language === 'ar' ? `متأخر ${days} يوم` : `${days} Day${days > 1 ? 's' : ''} Overdue`;
  }
  if (task.bucket === 'today' || task.bucket === 'tomorrow') return time;
  return d.toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined, { month: 'short', day: 'numeric' });
}

export function TodoSidebar({
  tasks,
  isLoading,
  isOpen,
  onToggle,
  language = 'en',
  onTaskClick,
  onTaskToggled,
}: {
  tasks: TodoTask[];
  isLoading?: boolean;
  isOpen: boolean;
  onToggle: () => void;
  language?: 'ar' | 'en';
  onTaskClick?: (task: TodoTask) => void;
  onTaskToggled?: () => void;
}) {
  const isAr = language === 'ar';
  const [filter, setFilter] = useState<'all' | TodoTask['bucket']>('all');
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const scrollFilters = (direction: 'left' | 'right') => {
    filterScrollRef.current?.scrollBy({ left: direction === 'left' ? -120 : 120, behavior: 'smooth' });
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.bucket === filter);
  const grouped = BUCKET_ORDER.map((bucket) => ({
    bucket,
    tasks: filteredTasks.filter((t) => t.bucket === bucket),
  })).filter((g) => g.tasks.length > 0);

  const dueTodayTasks = tasks.filter((t) => t.bucket === 'today' || t.bucket === 'overdue');
  const dueTodayCompleted = dueTodayTasks.filter((t) => t.type === 'quick_task' && t.isCompleted).length;

  const handleToggleComplete = async (task: TodoTask) => {
    if (task.type !== 'quick_task') return;
    await toggleQuickTaskCompletion(task.id, !task.isCompleted);
    onTaskToggled?.();
  };

  return (
    <aside className={`${isOpen ? 'w-96 px-5' : 'w-20 px-2'} h-screen sticky top-0 overflow-y-auto pt-12 pb-6 border-l border-slate-100 flex flex-col gap-6 flex-shrink-0 bg-slate-50/50 transition-all duration-300`}>
      <div className={`flex items-center ${isOpen ? 'justify-between px-2' : 'justify-center'}`}>
        {isOpen && (
          <div className="flex items-center gap-2">
            <CheckSquare className="text-indigo-600" size={22} />
            <h2 className="text-xl font-bold text-slate-800">{isAr ? 'المهام' : 'To Do'}</h2>
          </div>
        )}
        <button onClick={onToggle} className="text-slate-400 hover:text-slate-600 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-200/50 transition-colors">
          {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {isLoading ? (
        isOpen && <p className="text-sm text-slate-400 px-2">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : !isOpen ? (
        <div className="flex flex-col gap-6 items-center mt-4">
          {BUCKET_ORDER.map((bucket) => {
            const bucketTasks = tasks.filter((t) => t.bucket === bucket);
            if (bucketTasks.length === 0) return null;
            const meta = BUCKET_META[bucket];
            const BucketIcon = meta.icon;
            return (
              <div key={bucket} className="relative group cursor-pointer" onClick={onToggle} title={`${isAr ? meta.labelAr : meta.labelEn} (${bucketTasks.length})`}>
                <div className={`w-10 h-10 rounded-xl ${meta.softBg} ${meta.text} flex items-center justify-center hover:opacity-80 transition-colors border ${meta.border}`}>
                  <BucketIcon size={20} />
                </div>
                <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 ${meta.badgeBg} text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white`}>
                  {bucketTasks.length}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <CheckSquare size={16} className="text-emerald-500" />
                {isAr ? 'هدف اليوم (النهاردة والمتأخر)' : 'Daily Target (Today & Due)'}
              </span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
                {dueTodayCompleted} / {dueTodayTasks.length} {isAr ? 'تم' : 'Done'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: dueTodayTasks.length > 0 ? `${(dueTodayCompleted / dueTodayTasks.length) * 100}%` : '0%' }} />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => scrollFilters('left')} className="shrink-0 text-slate-400 hover:text-slate-600 p-1"><ChevronLeft size={16} /></button>
            <div ref={filterScrollRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setFilter('all')}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${filter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {isAr ? 'الكل' : 'All'} ({tasks.length})
              </button>
              {BUCKET_ORDER.map((bucket) => {
                const count = tasks.filter((t) => t.bucket === bucket).length;
                if (count === 0) return null;
                const meta = BUCKET_META[bucket];
                const active = filter === bucket;
                return (
                  <button
                    key={bucket}
                    onClick={() => setFilter(bucket)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${active ? `${meta.bg} text-white` : `${meta.softBg} ${meta.text}`}`}
                  >
                    {isAr ? meta.labelAr : meta.labelEn}
                    <span className={`px-1.5 rounded-full text-[10px] ${active ? 'bg-white/25 text-white' : 'bg-white/60'}`}>{count}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => scrollFilters('right')} className="shrink-0 text-slate-400 hover:text-slate-600 p-1"><ChevronRight size={16} /></button>
          </div>

          {grouped.length === 0 ? (
            <p className="text-sm text-slate-400 px-2">{isAr ? 'مفيش مهام حاليًا 🎉' : 'No tasks right now 🎉'}</p>
          ) : (
            <div className="flex flex-col gap-6">
              {grouped.map(({ bucket, tasks: bucketTasks }) => {
                const meta = BUCKET_META[bucket];
                const BucketIcon = meta.icon;
                return (
                  <div key={bucket}>
                    <h3 className={`text-xs font-bold ${meta.text} mb-3 px-1 flex items-center gap-2 uppercase tracking-wide`}>
                      <BucketIcon size={14} />
                      {isAr ? meta.sectionLabelAr : meta.sectionLabelEn}
                      <span className={`ml-auto ${meta.softBg} ${meta.text} text-[10px] font-bold px-2 py-0.5 rounded-full`}>{bucketTasks.length}</span>
                    </h3>
                    <div className="flex flex-col gap-3">
                      {bucketTasks.map((task) => {
                        const TypeIcon = typeIcon(task.type);
                        const isQuickTask = task.type === 'quick_task';
                        return (
                          <div
                            key={task.id}
                            onClick={() => onTaskClick?.(task)}
                            className={`${meta.softBg} ${meta.border} shadow-sm transition-all ${meta.hoverBorder} rounded-2xl py-2.5 px-3.5 relative cursor-pointer flex items-center gap-3 ${isQuickTask && task.isCompleted ? 'opacity-60' : ''}`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white/70 text-[10px] font-bold text-slate-600 shadow-sm">
                                  <TypeIcon size={11} /> {task.subject}
                                </span>
                              </div>
                              <h4 className={`text-sm font-bold text-slate-900 mb-1.5 ${isQuickTask && task.isCompleted ? 'line-through' : ''}`}>{task.title}</h4>
                              <span className={`flex items-center gap-1 text-xs font-medium text-slate-700 ${bucket === 'overdue' ? 'font-bold text-rose-500' : ''}`}>
                                <Clock size={12} />
                                {formatDueLabel(task, language)}
                              </span>
                            </div>
                            {isQuickTask && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleComplete(task); }}
                                className={`shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${task.isCompleted ? `${meta.bg} border-transparent text-white` : `bg-white ${meta.border} ${meta.text} hover:bg-white/80`}`}
                                title={isAr ? 'علّم كمكتملة' : 'Mark complete'}
                              >
                                <Check size={16} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
