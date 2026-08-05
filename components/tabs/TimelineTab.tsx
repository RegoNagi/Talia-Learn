'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, AlertCircle, BrainCircuit, ClipboardList, X, ArrowRight, Video, BookOpen, Paperclip, Plus, Upload, Target, Library } from 'lucide-react';
import { getRealTodoTasks, createQuickTask, getQuickTaskAttachmentUrl, TodoTask } from '@/services/todoData';

interface TimelineTabProps {
  role?: string;
  language?: string;
  classId?: string;
  subject?: string;
  grade?: string;
  teacherId?: string;
  onOpenAssessments?: () => void;
}

const BUCKET_LABELS: Record<TodoTask['bucket'], { en: string; ar: string }> = {
  overdue: { en: 'Overdue', ar: 'متأخر' },
  today: { en: 'Today', ar: 'النهاردة' },
  tomorrow: { en: 'Tomorrow', ar: 'بكرة' },
  upcoming: { en: 'Upcoming', ar: 'قريبًا' },
};

const BUCKET_ORDER: TodoTask['bucket'][] = ['overdue', 'today', 'tomorrow', 'upcoming'];

function taskIcon(type: TodoTask['type']) {
  switch (type) {
    case 'quiz': return <BrainCircuit size={20} />;
    case 'live_session': return <Video size={20} />;
    case 'curriculum': return <BookOpen size={20} />;
    case 'quick_task': return <Paperclip size={20} />;
    default: return <ClipboardList size={20} />;
  }
}

function taskColor(type: TodoTask['type']) {
  switch (type) {
    case 'quiz': return 'bg-purple-100 text-purple-600';
    case 'live_session': return 'bg-rose-100 text-rose-600';
    case 'curriculum': return 'bg-teal-100 text-teal-600';
    case 'quick_task': return 'bg-amber-100 text-amber-600';
    default: return 'bg-blue-50 text-blue-500';
  }
}

export function TimelineTab({ role = 'student', language = 'en', classId, subject, grade, teacherId, onOpenAssessments }: TimelineTabProps) {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TodoTask | null>(null);
  const isAr = language === 'ar';
  const isTeacher = role === 'teacher';

  const refresh = () => {
    if (!classId || !subject) { setIsLoading(false); return; }
    setIsLoading(true);
    getRealTodoTasks({ teacherId, classId, subject, grade }).then((t) => {
      setTasks(t);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    refresh();
  }, [classId, subject, teacherId, grade]);

  const grouped = BUCKET_ORDER.map((bucket) => ({
    bucket,
    tasks: tasks.filter((t) => t.bucket === bucket),
  })).filter((g) => g.tasks.length > 0);

  // ============ Create Task Modal ============
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleCreateTask = async () => {
    if (!classId || !subject || !teacherId || !newTitle.trim() || !newDate) return;
    setIsSaving(true);
    setCreateError('');
    const { ok, error } = await createQuickTask({
      classId,
      subject,
      teacherId,
      title: newTitle.trim(),
      dueDate: `${newDate}T${newTime || '09:00'}`,
      file: newFile,
    });
    setIsSaving(false);
    if (ok) {
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDate('');
      setNewTime('09:00');
      setNewFile(null);
      refresh();
    } else {
      setCreateError(error || 'Unknown error');
    }
  };

  return (
    <div className="h-full max-w-4xl mx-auto p-6">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{isAr ? 'المهام والمواعيد' : 'To Do & Timeline'}</h2>
          <p className="text-slate-500 text-sm mt-1">{isAr ? 'كل حاجة ليها ميعاد — واجبات، كويزات، الجدول الزمني، ومهامك الخاصة' : 'Everything with a date — assignments, quizzes, curriculum schedule, and your own tasks'}</p>
        </div>
        {isTeacher && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            <Plus size={16} /> {isAr ? 'إضافة مهمة' : 'Add Task'}
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-slate-400 text-center py-10">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
      ) : tasks.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center text-slate-400">
          {isAr ? 'مفيش مهام أو مواعيد قادمة.' : 'No upcoming tasks or deadlines.'}
        </div>
      ) : (
        <div className="space-y-8 relative">
          <div className="absolute left-[19px] rtl:right-[19px] rtl:left-auto top-4 bottom-0 w-0.5 bg-slate-100 -z-10" />

          {grouped.map((group) => (
            <div key={group.bucket} className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-10 h-10 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 shrink-0 ${
                  group.bucket === 'overdue' ? 'bg-red-50' : group.bucket === 'today' ? 'bg-indigo-50' : 'bg-slate-50'
                }`}>
                  <Calendar size={18} className={group.bucket === 'overdue' ? 'text-red-600' : group.bucket === 'today' ? 'text-indigo-600' : 'text-slate-500'} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{isAr ? BUCKET_LABELS[group.bucket].ar : BUCKET_LABELS[group.bucket].en}</h3>
              </div>

              <div className="space-y-4 ltr:pl-14 rtl:pr-14">
                {group.tasks.map((task) => (
                  <motion.button
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setActiveTask(task)}
                    className="w-full text-left bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex items-center justify-between group flex-wrap gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${taskColor(task.type)}`}>
                        {taskIcon(task.type)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-700 text-sm">{task.title}</h4>
                        <span className="text-xs font-medium text-slate-400">{new Date(task.dueDate).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      task.bucket === 'overdue' ? 'text-red-600 bg-red-50' : task.bucket === 'today' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 bg-slate-50 border border-slate-100'
                    }`}>
                      {task.bucket === 'overdue' && <AlertCircle size={14} />}
                      {isAr ? BUCKET_LABELS[task.bucket].ar : BUCKET_LABELS[task.bucket].en}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Unified item-open modal (same pattern for every task type) */}
      <AnimatePresence>
        {activeTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveTask(null)} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
                <button onClick={() => setActiveTask(null)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${taskColor(activeTask.type)}`}>
                  {taskIcon(activeTask.type)}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{activeTask.title}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
                  <Clock size={14} /> {isAr ? 'الاستحقاق' : 'Due'}: {new Date(activeTask.dueDate).toLocaleString()}
                </p>

                {activeTask.type === 'curriculum' && activeTask.meta && (
                  <div className="space-y-2 mb-6">
                    {activeTask.meta.outcome && (
                      <p className="text-xs text-slate-600 flex items-start gap-1.5"><Target size={14} className="mt-0.5 shrink-0" /> {activeTask.meta.outcome}</p>
                    )}
                    {activeTask.meta.lessonPlanTitle && (
                      <p className="text-xs text-slate-600 flex items-start gap-1.5"><BookOpen size={14} className="mt-0.5 shrink-0" /> {activeTask.meta.lessonPlanTitle}</p>
                    )}
                    {activeTask.meta.resourceTitle && (
                      <p className="text-xs text-slate-600 flex items-start gap-1.5"><Library size={14} className="mt-0.5 shrink-0" /> {activeTask.meta.resourceTitle}</p>
                    )}
                  </div>
                )}

                {activeTask.type === 'quick_task' && activeTask.meta?.attachmentPath && (
                  <a
                    href={getQuickTaskAttachmentUrl(activeTask.meta.attachmentPath)}
                    target="_blank"
                    rel="noreferrer"
                    className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 hover:bg-slate-100 w-fit"
                  >
                    <Paperclip size={16} /> {isAr ? 'فتح المرفق' : 'Open attachment'}
                  </a>
                )}

                {(activeTask.type === 'assignment' || activeTask.type === 'quiz') && (
                  <button
                    onClick={() => { setActiveTask(null); onOpenAssessments?.(); }}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    {isAr ? 'روح له' : 'Go to it'} <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Task Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateOpen(false)} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
                <button onClick={() => setIsCreateOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 bg-amber-100 text-amber-600">
                  <Plus size={26} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-6">{isAr ? 'إضافة مهمة جديدة' : 'Add New Task'}</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isAr ? 'الاسم' : 'Name'}</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder={isAr ? 'اكتب اسم المهمة' : 'Task name'}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isAr ? 'التاريخ' : 'Date'}</label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isAr ? 'الوقت' : 'Time'}</label>
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isAr ? 'مرفق (اختياري)' : 'Attachment (optional)'}</label>
                    <label className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center gap-2 text-slate-500 hover:bg-slate-50 cursor-pointer">
                      <Upload size={16} />
                      <span className="text-sm">{newFile ? newFile.name : (isAr ? 'اختر ملف' : 'Choose a file')}</span>
                      <input type="file" className="hidden" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  {createError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{createError}</p>}
                  <button
                    onClick={handleCreateTask}
                    disabled={!newTitle.trim() || !newDate || isSaving}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold transition-all"
                  >
                    {isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'إضافة' : 'Add Task')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
