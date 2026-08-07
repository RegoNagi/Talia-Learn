'use client';

import React, { useState, useRef, useEffect, startTransition } from 'react';
import { BookOpen, Clock, Video, CheckCircle2, Globe, ChevronDown, BrainCircuit, ClipboardList, Paperclip, Plus, Upload, X, Trash2, Edit, RotateCcw, Check, ArrowLeft } from 'lucide-react';
import { GlobalSidebar } from '@/components/GlobalSidebar';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/contexts/AuthContext';
import { getMyClassSections } from '@/services/attendanceData';
import { getRealTodoTasksMulti, createQuickTask, getQuickTaskAttachmentUrl, TodoTask, updateQuickTask, deleteQuickTask, restoreQuickTask, permanentlyDeleteQuickTask, getDeletedQuickTasks, emptyQuickTasksTrash, toggleQuickTaskCompletion, purgeOldTrash, DeletedQuickTask } from '@/services/todoData';

function FlatDropdown({ options, value, onChange, placeholder }: { options: {id: string, label: string}[], value: string, onChange: (val: string) => void, placeholder: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = value === 'all' ? placeholder : options.find(o => o.id === value)?.label || placeholder;

  return (
    <div className="relative z-20" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-none w-full min-w-[160px]"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
            className="absolute top-full start-0 w-full mt-1 bg-white border border-gray-100 rounded-xl z-20 py-1 shadow-none"
          >
            <button
              onClick={() => { onChange('all'); setIsOpen(false); }}
              className="w-full flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 text-start font-bold"
            >
              <span className="flex-1">الكل (All)</span>
              {value === 'all' && <CheckCircle2 size={14} className="text-orange-500" />}
            </button>
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setIsOpen(false); }}
                className="w-full flex items-center px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 text-start font-bold"
              >
                <span className="flex-1">{opt.label}</span>
                {value === opt.id && <CheckCircle2 size={14} className="text-orange-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
    case 'quiz': return BrainCircuit;
    case 'live_session': return Video;
    case 'curriculum': return BookOpen;
    case 'quick_task': return Paperclip;
    default: return ClipboardList;
  }
}

export default function ActivityStreamPage() {
  const [activeSpace, setActiveSpace] = React.useState<string | null>(null);
  const [isSidebarPinned, setIsSidebarPinned] = React.useState(false);
  const [language, setLanguage] = React.useState<'ar' | 'en'>('en');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const isRtl = language === 'ar';

  const { authUser } = useAuth();

  const [sections, setSections] = useState<{ id: string; name: string; gradeLevel: string }[]>([]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<TodoTask | null>(null);

  const refresh = () => {
    if (!authUser?.teacherId) { startTransition(() => setIsLoading(false)); return; }
    startTransition(() => setIsLoading(true));
    getMyClassSections(authUser.teacherId).then((secs) => {
      setSections(secs);
      const scopes = secs.flatMap((sec) =>
        (authUser.subjects || []).map((subject: string) => ({ teacherId: authUser.teacherId, classId: sec.id, subject, grade: sec.gradeLevel }))
      );
      getRealTodoTasksMulti(scopes).then((data) => {
        setTasks(data);
        setIsLoading(false);
      });
    });
  };

  const [activeView, setActiveView] = useState<'tasks' | 'trash'>('tasks');
  const [deletedTasks, setDeletedTasks] = useState<DeletedQuickTask[]>([]);
  const [isLoadingTrash, setIsLoadingTrash] = useState(false);
  const [undoToast, setUndoToast] = useState<{ id: string; title: string } | null>(null);

  const refreshTrash = () => {
    if (!authUser?.teacherId) return;
    startTransition(() => setIsLoadingTrash(true));
    purgeOldTrash(authUser.teacherId).then(() => {
      getDeletedQuickTasks(authUser.teacherId!).then((data) => {
        setDeletedTasks(data);
        setIsLoadingTrash(false);
      });
    });
  };

  useEffect(() => {
    refresh();
    refreshTrash();
  }, [authUser?.teacherId, authUser?.subjects]);

  const gradeOptions = Array.from(new Set(sections.map((s) => s.gradeLevel))).map((g) => ({ id: g, label: isRtl ? `الصف ${g}` : `Grade ${g}` }));
  const classOptions = sections.filter((s) => gradeFilter === 'all' || s.gradeLevel === gradeFilter).map((s) => ({ id: s.id, label: s.name }));

  const filteredTasks = tasks.filter((task) => {
    const sec = sections.find((s) => s.id === task.classId);
    const matchesGrade = gradeFilter === 'all' || sec?.gradeLevel === gradeFilter;
    const matchesClass = classFilter === 'all' || task.classId === classFilter;
    return matchesGrade && matchesClass;
  });

  const grouped = BUCKET_ORDER.map((bucket) => ({
    bucket,
    tasks: filteredTasks.filter((t) => t.bucket === bucket),
  })).filter((g) => g.tasks.length > 0);

  // ============ Create Task Modal ============
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newClassId, setNewClassId] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (activeView === 'trash') refreshTrash();
  }, [activeView, authUser?.teacherId]);

  const openCreateModal = () => {
    setEditingTaskId(null);
    setNewTitle('');
    setNewDate('');
    setNewTime('09:00');
    setNewFile(null);
    setNewClassId(sections[0]?.id || '');
    setNewSubject((authUser?.subjects || [])[0] || '');
    setIsCreateOpen(true);
  };

  const openEditModal = (task: TodoTask) => {
    setEditingTaskId(task.id);
    setNewTitle(task.title);
    const [d, t] = task.dueDate.split('T');
    setNewDate(d);
    setNewTime(t?.slice(0, 5) || '09:00');
    setNewClassId(task.classId);
    setNewSubject(task.subject);
    setIsCreateOpen(true);
  };

  const handleCreateTask = async () => {
    if (editingTaskId) {
      if (!newTitle.trim() || !newDate) return;
      setIsSaving(true);
      setCreateError('');
      const { ok, error } = await updateQuickTask(editingTaskId, {
        title: newTitle.trim(),
        dueDate: `${newDate}T${newTime || '09:00'}`,
      });
      setIsSaving(false);
      if (ok) {
        setIsCreateOpen(false);
        setEditingTaskId(null);
        setNewTitle('');
        setNewDate('');
        setNewTime('09:00');
        refresh();
      } else {
        setCreateError(error || 'Unknown error');
      }
      return;
    }
    if (!authUser?.teacherId || !newClassId || !newSubject || !newTitle.trim() || !newDate) return;
    setIsSaving(true);
    setCreateError('');
    const { ok, error } = await createQuickTask({
      classId: newClassId,
      subject: newSubject,
      teacherId: authUser.teacherId,
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

  const handleDeleteTask = async (id: string, title: string) => {
    await deleteQuickTask(id);
    refresh();
    setUndoToast({ id, title });
    setTimeout(() => setUndoToast((prev) => (prev?.id === id ? null : prev)), 5000);
  };

  const handleUndoDelete = async () => {
    if (!undoToast) return;
    await restoreQuickTask(undoToast.id);
    setUndoToast(null);
    refresh();
  };

  const handleRestoreTask = async (id: string) => {
    await restoreQuickTask(id);
    refreshTrash();
    refresh();
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm(isRtl ? 'حذف نهائي؟ مش هينفع ترجعها تاني.' : 'Delete permanently? This cannot be undone.')) return;
    await permanentlyDeleteQuickTask(id);
    refreshTrash();
  };

  const handleEmptyTrash = async () => {
    if (!authUser?.teacherId) return;
    if (!window.confirm(isRtl ? 'متأكد إنك عايز تفضّي السلة؟ كل المهام هتتمسح نهائي.' : 'Empty the trash? All tasks will be permanently deleted.')) return;
    await emptyQuickTasksTrash(authUser.teacherId);
    refreshTrash();
  };

  const handleToggleTaskComplete = async (task: TodoTask, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleQuickTaskCompletion(task.id, !task.isCompleted);
    refresh();
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden" dir={isRtl ? "rtl" : "ltr"} style={{ fontFamily: "'Cairo', sans-serif" }}>
      <GlobalSidebar 
        onSpaceSelect={setActiveSpace} 
        activeSpace={activeSpace} 
        isPinned={isSidebarPinned}
        setIsPinned={setIsSidebarPinned}
        language={language}
        onLanguageChange={setLanguage}
        authUser={authUser}
      />
      
      <main className="flex-1 h-full overflow-y-auto bg-gray-50/50 custom-scrollbar relative">
        <div className="max-w-[1200px] mx-auto w-full p-8 md:p-12">
          
          <header className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{isRtl ? 'مسار الأنشطة' : 'Activity Stream'}</h1>
              <p className="text-gray-500 text-base">{isRtl ? `مرحباً يا ${authUser?.name || 'أستاذ'}، استعرض وجدول مهامك ودروسك عبر جميع فصولك.` : `Welcome ${authUser?.name || 'Teacher'}, review and schedule your tasks across all your classes.`}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setActiveView(activeView === 'trash' ? 'tasks' : 'trash')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-none border ${activeView === 'trash' ? 'bg-slate-800 text-white border-transparent' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                {activeView === 'trash' ? <ArrowLeft size={16} /> : <Trash2 size={16} />}
                {activeView === 'trash' ? (isRtl ? 'رجوع للمهام' : 'Back to Tasks') : (isRtl ? 'السلة' : 'Trash')}
                {activeView !== 'trash' && deletedTasks.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{deletedTasks.length}</span>
                )}
              </button>
              {activeView === 'tasks' && (
              <button 
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors shadow-none"
              >
                <Plus size={16} /> {isRtl ? 'إضافة مهمة' : 'Add Task'}
              </button>
              )}
              <button 
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors w-fit shrink-0"
                type="button"
              >
                <Globe size={14} />
                <span dir="ltr">{language === 'ar' ? 'English' : 'عربي'}</span>
              </button>
            </div>
          </header>

          {activeView === 'tasks' && (<>
          {/* Top Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-10 pb-6 border-b border-gray-100 relative z-20">
             <div className="flex items-center gap-3 w-full sm:w-auto">
                <FlatDropdown 
                  options={gradeOptions} 
                  value={gradeFilter} 
                  onChange={(v) => { setGradeFilter(v); setClassFilter('all'); }} 
                  placeholder={isRtl ? 'الصف الدراسي' : 'Grade'}
                />
                <FlatDropdown 
                  options={classOptions} 
                  value={classFilter} 
                  onChange={setClassFilter} 
                  placeholder={isRtl ? 'الفصل' : 'Class'}
                />
             </div>
          </div>

          {isLoading ? (
            <p className="text-gray-400 text-center py-10">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
          ) : grouped.length === 0 ? (
            <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-gray-400">
              {isRtl ? 'مفيش مهام أو مواعيد قادمة.' : 'No upcoming tasks or deadlines.'}
            </div>
          ) : (
            <div className="space-y-12 z-10 relative">
              {grouped.map((group) => (
                <section key={group.bucket}>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-start gap-2">
                    <span className={`w-2 h-2 rounded-full ${group.bucket === 'overdue' ? 'bg-red-400' : group.bucket === 'today' ? 'bg-indigo-400' : 'bg-slate-400'}`}></span>
                    {isRtl ? BUCKET_LABELS[group.bucket].ar : BUCKET_LABELS[group.bucket].en}
                  </h2>

                  <div className="flex flex-col gap-4">
                    {group.tasks.map((task) => {
                      const Icon = taskIcon(task.type);
                      const sec = sections.find((s) => s.id === task.classId);
                      let borderLeftColor = "border-s-slate-200";
                      let iconBoxStyles = "bg-slate-50 text-slate-500";
                      if (task.bucket === 'overdue') {
                        borderLeftColor = "border-s-red-400";
                        iconBoxStyles = "bg-red-50 text-red-500";
                      } else if (task.bucket === 'today') {
                        borderLeftColor = "border-s-orange-400";
                        iconBoxStyles = "bg-orange-50 text-orange-500";
                      } else {
                        borderLeftColor = "border-s-indigo-400";
                        iconBoxStyles = "bg-indigo-50 text-indigo-500";
                      }

                      return (
                        <div
                          key={task.id}
                          onClick={() => setActiveTask(task)}
                          role="button"
                          className={`flex items-start sm:items-center justify-between p-5 rounded-2xl transition-colors text-start hover:bg-gray-50/50 bg-white border border-gray-100 shadow-none border-s-4 cursor-pointer ${borderLeftColor}`}
                        >
                          <div className="flex items-start sm:items-center gap-4 flex-col sm:flex-row w-full sm:w-auto">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-none ${iconBoxStyles}`}>
                              <Icon size={20} />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <h3 className={`text-base font-bold text-gray-900 leading-tight m-0 ${task.type === 'quick_task' && task.isCompleted ? 'line-through text-gray-400' : ''}`}>{task.title}</h3>
                                <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold shadow-none leading-none tracking-wider whitespace-nowrap">
                                  {sec?.name || task.subject}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
                                <span className="flex items-center gap-1">
                                  <BookOpen size={14} className="text-gray-400" />
                                  {task.subject}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="flex items-center gap-1">
                                  <Clock size={14} className="text-gray-400" />
                                  <span className={task.bucket === 'overdue' ? 'text-red-500 font-bold' : ''}>{new Date(task.dueDate).toLocaleString()}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {task.type === 'quick_task' && (
                            <div className="flex items-center gap-1 shrink-0 self-start sm:self-center">
                              <button
                                onClick={(e) => handleToggleTaskComplete(task, e)}
                                title={isRtl ? 'وضع علامة اكتمل' : 'Mark as complete'}
                                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 transition-colors ${task.isCompleted ? 'bg-emerald-500 border-transparent text-white' : 'bg-white border-emerald-500 text-emerald-500 hover:bg-emerald-50'}`}
                              >
                                <Check size={14} className="stroke-[3]" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditModal(task); }}
                                title={isRtl ? 'تعديل' : 'Edit'}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id, task.title); }}
                                title={isRtl ? 'حذف' : 'Delete'}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
          </>)}

          {activeView === 'trash' && (
            <div>
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                <p className="text-sm text-gray-500">{isRtl ? 'المهام المحذوفة بتفضل هنا لحد ما تسترجعها أو تفضّي السلة.' : 'Deleted tasks stay here until you restore them or empty the trash.'}</p>
                {deletedTasks.length > 0 && (
                  <button
                    onClick={handleEmptyTrash}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-bold transition-colors shrink-0"
                  >
                    <Trash2 size={16} /> {isRtl ? 'تفضية السلة' : 'Empty Trash'}
                  </button>
                )}
              </div>

              {isLoadingTrash ? (
                <p className="text-gray-400 text-center py-10">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
              ) : deletedTasks.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center text-gray-400">
                  {isRtl ? 'السلة فاضية.' : 'Trash is empty.'}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {deletedTasks.map((task) => {
                    const sec = sections.find((s) => s.id === task.classId);
                    return (
                      <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-gray-100 shadow-none">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-bold text-gray-700 truncate">{task.title}</h3>
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold shrink-0">{sec?.name || task.subject}</span>
                          </div>
                          <p className="text-xs text-gray-400">{isRtl ? 'اتحذفت في' : 'Deleted'} {new Date(task.deletedAt).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleRestoreTask(task.id)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-colors"
                          >
                            <RotateCcw size={14} /> {isRtl ? 'استرجاع' : 'Restore'}
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(task.id)}
                            className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title={isRtl ? 'حذف نهائي' : 'Delete permanently'}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Item detail modal (same pattern as Timeline) */}
      <AnimatePresence>
        {activeTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveTask(null)} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 z-[101] flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
                <button onClick={() => setActiveTask(null)} className="absolute top-6 end-6 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{activeTask.title}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
                  <Clock size={14} /> {isRtl ? 'الاستحقاق' : 'Due'}: {new Date(activeTask.dueDate).toLocaleString()}
                </p>
                {activeTask.type === 'quick_task' && activeTask.meta?.attachmentPath && (
                  <a href={getQuickTaskAttachmentUrl(activeTask.meta.attachmentPath)} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 hover:bg-slate-100 w-fit">
                    <Paperclip size={16} /> {isRtl ? 'فتح المرفق' : 'Open attachment'}
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Task Modal (same fields as Timeline's Add Task) */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsCreateOpen(false); setEditingTaskId(null); }} className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100]" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="fixed inset-0 z-[101] flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 relative">
                <button onClick={() => { setIsCreateOpen(false); setEditingTaskId(null); }} className="absolute top-6 end-6 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${editingTaskId ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                  {editingTaskId ? <Edit size={24} /> : <Plus size={26} />}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-6">{editingTaskId ? (isRtl ? 'تعديل المهمة' : 'Edit Task') : (isRtl ? 'إضافة مهمة جديدة' : 'Add New Task')}</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isRtl ? 'الاسم' : 'Name'}</label>
                    <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={isRtl ? 'اكتب اسم المهمة' : 'Task name'} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  {!editingTaskId && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isRtl ? 'الفصل' : 'Class'}</label>
                      <select value={newClassId} onChange={(e) => setNewClassId(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                        {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isRtl ? 'المادة' : 'Subject'}</label>
                      <select value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm">
                        {(authUser?.subjects || []).map((s: string) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  )}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isRtl ? 'التاريخ' : 'Date'}</label>
                      <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isRtl ? 'الوقت' : 'Time'}</label>
                      <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  {!editingTaskId && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{isRtl ? 'مرفق (اختياري)' : 'Attachment (optional)'}</label>
                    <label className="w-full border-2 border-dashed border-slate-200 rounded-xl p-4 flex items-center gap-2 text-slate-500 hover:bg-slate-50 cursor-pointer">
                      <Upload size={16} />
                      <span className="text-sm">{newFile ? newFile.name : (isRtl ? 'اختر ملف' : 'Choose a file')}</span>
                      <input type="file" className="hidden" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  )}
                  {createError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{createError}</p>}
                  <button
                    onClick={handleCreateTask}
                    disabled={!newTitle.trim() || !newDate || (!editingTaskId && (!newClassId || !newSubject)) || isSaving}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold transition-all"
                  >
                    {isSaving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : editingTaskId ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إضافة' : 'Add Task')}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {undoToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 start-1/2 z-[110] bg-slate-800 text-white pl-3 pr-4 py-3 rounded-2xl text-sm font-medium shadow-xl flex items-center gap-3"
          >
            <span>{isRtl ? `اتحذفت "${undoToast.title}"` : `Deleted "${undoToast.title}"`}</span>
            <button onClick={handleUndoDelete} className="font-bold text-indigo-300 hover:text-indigo-200 transition-colors">
              {isRtl ? 'تراجع' : 'Undo'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
