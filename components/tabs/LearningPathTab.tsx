import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, ChevronDown, MoreHorizontal, PlayCircle, FileText, BrainCircuit, Shuffle, Plus, Sparkles, Trash2, EyeOff, Eye, Share2, Edit, Layout, Check, ClipboardCheck, X, MoreVertical, Link as LinkIcon, LayoutGrid, List, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';

import { LibraryDrawer } from '@/components/LearningPath/LibraryDrawer';
import { AddLessonModal } from '@/components/LearningPath/AddLessonModal';
import { AddAssessmentModal } from '@/components/LearningPath/AddAssessmentModal';
import { StudentCompletionPopover } from '@/components/LearningPath/StudentCompletionPopover';
import { UnitMasteryBuilder } from '@/components/UnitMasteryBuilder';
import { BrowseLibraryTab } from '@/components/tabs/BrowseLibraryTab';
import { getUnits, createUnit, deleteUnit, updateUnit, toggleUnitHidden, toggleUnitComplete, updateUnitSharing, getLessons, createLesson, updateLesson, deleteLesson, toggleLessonHidden, toggleLessonComplete, getLessonFileUrl, toggleLessonCompletionForStudent, getLessonCompletionCounts, getStudentLessonCompletions } from '@/services/learningPathData';
import { getAssignmentsForUnits } from '@/services/assignmentData';
import { getTeacherClassNames } from '@/services/libraryData';

type ContentType = 'video' | 'pdf' | 'quiz' | 'assignment' | 'project' | 'link';
type LessonSource = 'official' | 'custom' | 'ai';
type LessonStatus = 'success' | 'ongoing' | 'overdue' | 'urgent' | 'upcoming' | 'grading';

interface Lesson {
  id: string;
  title: string;
  type: ContentType;
  source: LessonSource;
  week: string;
  completedCount: number;
  totalCount: number;
  dueDate?: string;
  status: LessonStatus;
  completed?: boolean;
  isHidden: boolean;
  isTopicComplete: boolean;
  url?: string | null;
  storagePath?: string | null;
}

interface Unit {
  id: string;
  title: string;
  weeks: string;
  progress: number;
  lessons: Lesson[];
  isHidden: boolean;
  isComplete: boolean;
  sharedWith: string[];
}

export function LearningPathTab({ 
  viewRole = 'TEACHER',
  demoAssessments = [],
  language = 'en',
  onAssessmentClick = () => {},
  teacherId,
  studentId,
  classId,
  subject,
  grade,
}: { 
  viewRole?: 'TEACHER' | 'STUDENT',
  demoAssessments?: any[],
  language?: 'ar' | 'en',
  onAssessmentClick?: (id: string) => void,
  teacherId?: string,
  studentId?: string,
  classId?: string,
  subject?: string,
  grade?: string,
}) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const learnScope = teacherId && classId && subject ? { teacherId, classId, subject } : null;

  const refreshUnits = () => {
    if (!learnScope) return;
    setIsLoadingUnits(true);
    getUnits(learnScope).then(async (realUnits) => {
      const unitIds = realUnits.map(u => u.id);
      const [lessons, unitAssessments] = await Promise.all([
        getLessons(unitIds),
        getAssignmentsForUnits(unitIds),
      ]);
      const lessonIds = lessons.map((l) => l.id);
      const [counts, myCompletions] = await Promise.all([
        classId ? getLessonCompletionCounts(lessonIds, classId) : Promise.resolve({} as Record<string, { completed: number; total: number }>),
        studentId ? getStudentLessonCompletions(studentId, lessonIds) : Promise.resolve(new Set<string>()),
      ]);
      const mapped: Unit[] = realUnits.map((u) => ({
        id: u.id,
        title: u.title,
        weeks: u.weeksLabel,
        progress: 0,
        isHidden: u.isHidden,
        isComplete: u.isComplete,
        sharedWith: u.sharedWith,
        lessons: [
          ...lessons.filter(l => l.unitId === u.id).map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type as ContentType,
          source: 'custom' as LessonSource,
          week: l.weekLabel,
          completedCount: counts[l.id]?.completed || 0,
          totalCount: counts[l.id]?.total || 0,
          status: 'upcoming' as LessonStatus,
          completed: myCompletions.has(l.id),
          isHidden: l.isHidden,
          isTopicComplete: l.isComplete,
          url: l.url,
          storagePath: l.storagePath,
          })),
          ...unitAssessments.filter(a => a.unitId === u.id).map((a) => ({
            id: a.id,
            title: a.title,
            type: a.type as ContentType,
            source: 'custom' as LessonSource,
            week: u.weeksLabel,
            completedCount: 0,
            totalCount: 0,
            status: 'upcoming' as LessonStatus,
            completed: false,
            isHidden: false,
            isTopicComplete: a.status === 'Closed',
            url: null,
            storagePath: null,
          })),
        ],
      }));
      setUnits(mapped);
      setIsLoadingUnits(false);
    });
  };

  useEffect(() => {
    refreshUnits();
  }, [learnScope?.classId, learnScope?.subject]);

  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);
  const [lessonViewMode, setLessonViewMode] = useState<'grid' | 'list'>('grid');
  const [activeUnitMenuId, setActiveUnitMenuId] = useState<string | null>(null);
  const [activeLessonMenuId, setActiveLessonMenuId] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    if (!activeUnitMenuId && !activeLessonMenuId) return;
    const closeMenus = () => { setActiveUnitMenuId(null); setActiveLessonMenuId(null); };
    document.addEventListener('click', closeMenus);
    return () => document.removeEventListener('click', closeMenus);
  }, [activeUnitMenuId, activeLessonMenuId]);

  const expandAllUnits = () => setExpandedUnits(units.map(u => u.id));
  const collapseAllUnits = () => setExpandedUnits([]);

  const [activeUnitForAdd, setActiveUnitForAdd] = useState<string | null>(null);
  const [activeCompletion, setActiveCompletion] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [activeMasteryUnitId, setActiveMasteryUnitId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [targetUnitTitle, setTargetUnitTitle] = useState('');
  const [targetUnitId, setTargetUnitId] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [shareUnit, setShareUnit] = useState<Unit | null>(null);
  const [unitTargetClasses, setUnitTargetClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedUnitShareClasses, setSelectedUnitShareClasses] = useState<string[]>([]);

  const openUnitShareModal = (unit: Unit) => {
    setShareUnit(unit);
    setSelectedUnitShareClasses(unit.sharedWith || []);
    if (teacherId) getTeacherClassNames(teacherId).then((classes) => setUnitTargetClasses(classes.filter(c => c.id !== classId)));
  };

  const handleSaveUnitShare = async () => {
    if (!shareUnit) return;
    const ok = await updateUnitSharing(shareUnit.id, selectedUnitShareClasses);
    if (ok) {
      refreshUnits();
      setShareUnit(null);
    }
  };


  // Smart Course Planner State
  const [isBuildingUnit, setIsBuildingUnit] = useState(false);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [newUnitMode, setNewUnitMode] = useState<'manual' | null>(null);

  const [contentView, setContentView] = useState<'path' | 'material' | 'my-library'>('path');

  const isStudent = viewRole === 'STUDENT';

  const toggleLessonCompletion = async (unitId: string, lessonId: string, forceStatus?: boolean) => {
    const unit = units.find((u) => u.id === unitId);
    const lesson = unit?.lessons.find((l) => l.id === lessonId);
    const nextStatus = forceStatus !== undefined ? forceStatus : !lesson?.completed;
    // تحديث فوري في الواجهة عشان الاستجابة تبقى سريعة، وبعدين نحفظ فعليًا
    setUnits(prevUnits => prevUnits.map(u => {
      if (u.id === unitId) {
        return {
          ...u,
          lessons: u.lessons.map(l => {
            if (l.id === lessonId) {
              return { ...l, completed: nextStatus, completedCount: (l.completedCount || 0) + (nextStatus ? 1 : -1) };
            }
            return l;
          })
        };
      }
      return u;
    }));
    if (studentId) {
      await toggleLessonCompletionForStudent(lessonId, studentId, nextStatus);
    }
  };

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => 
      prev.includes(unitId) ? prev.filter(id => id !== unitId) : [...prev, unitId]
    );
  };

  const handleAddClick = (unitId: string) => {
    if (isStudent) return;
    setActiveUnitForAdd(activeUnitForAdd === unitId ? null : unitId);
  };

  const toggleCompletionPopover = (lessonId: string, event: React.MouseEvent) => {
    if (isStudent) return;
    if (activeCompletion?.id === lessonId) {
      setActiveCompletion(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      setActiveCompletion({ id: lessonId, rect });
    }
  };

  const openLibrary = (unitTitle: string) => {
    setTargetUnitTitle(unitTitle);
    setIsLibraryOpen(true);
    setActiveUnitForAdd(null);
  };

  const openAddLesson = (unitId: string, unitTitle: string) => {
    setTargetUnitId(unitId);
    setTargetUnitTitle(unitTitle);
    setIsAddLessonOpen(true);
    setActiveUnitForAdd(null);
  };

  const [newAssessmentType, setNewAssessmentType] = useState<'quiz' | 'assignment'>('assignment');
  const openAddAssessment = (unitId: string, unitTitle: string, type: 'quiz' | 'assignment') => {
    setTargetUnitId(unitId);
    setTargetUnitTitle(unitTitle);
    setNewAssessmentType(type);
    setIsAddAssessmentOpen(true);
    setActiveUnitForAdd(null);
  };

  const handleSaveLesson = async (lessonData: { title: string; type: ContentType; source: 'custom'; url?: string; file?: File | null }) => {
    if (!targetUnitId) return;
    const { id, error } = await createLesson({
      unitId: targetUnitId,
      title: lessonData.title,
      type: (lessonData.type === 'video' || lessonData.type === 'pdf') ? lessonData.type : (lessonData.url ? 'link' : 'link'),
      weekLabel: units.find(u => u.id === targetUnitId)?.weeks || '',
      url: lessonData.url || null,
      file: lessonData.file || null,
    });
    if (id) {
      refreshUnits();
    } else {
      alert(language === 'ar' ? `حصل خطأ أثناء إضافة الموضوع: ${error}` : `Error adding topic: ${error}`);
    }
  };

  const getStatusColor = (status: LessonStatus) => {
    switch (status) {
      case 'success': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'ongoing': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'overdue': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'urgent': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'grading': return 'bg-sky-50 text-sky-600 border-sky-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  const getStatusIconColor = (status: LessonStatus) => {
    switch (status) {
      case 'success': return 'fill-emerald-100 text-emerald-600';
      case 'ongoing': return 'fill-amber-100 text-amber-600';
      case 'overdue': return 'fill-rose-100 text-rose-600';
      case 'urgent': return 'fill-orange-100 text-orange-600';
      case 'grading': return 'fill-sky-100 text-sky-600';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="h-full w-full max-w-[1200px] mx-auto p-6 relative font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Course Content</h2>
          <p className="text-slate-500 text-sm mt-1">{isStudent ? 'Browse and learn from the organized course material' : 'Manage and organize course material'}</p>
        </div>

        <div className="flex border-b border-slate-200 w-full mb-2">
          <button
            onClick={() => setContentView('path')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${contentView === 'path' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            Learning Path
          </button>
          <button
            onClick={() => setContentView('material')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${contentView === 'material' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            Material
          </button>
          {!isStudent && (
            <button
              onClick={() => setContentView('my-library')}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${contentView === 'my-library' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              My Library
            </button>
          )}
        </div>
      </div>

      {contentView === 'material' || contentView === 'my-library' ? (
        <BrowseLibraryTab language={language} role={viewRole?.toLowerCase() || 'student'} teacherId={teacherId} classId={classId} subject={subject} grade={grade} forcedMode={contentView === 'material' ? 'material' : 'my-library'} />
      ) : (
        <>
          {units.length > 0 && (
            <div className="flex justify-end items-center gap-2 mb-4">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 mr-auto">
                <button
                  onClick={() => setLessonViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${lessonViewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title={language === 'ar' ? 'عرض شبكي' : 'Grid view'}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setLessonViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${lessonViewMode === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  title={language === 'ar' ? 'عرض قائمة' : 'List view'}
                >
                  <List size={16} />
                </button>
              </div>
              <button onClick={expandAllUnits} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                {language === 'ar' ? 'فتح الكل' : 'Expand All'}
              </button>
              <button onClick={collapseAllUnits} className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                {language === 'ar' ? 'قفل الكل' : 'Collapse All'}
              </button>
            </div>
          )}
          {/* Units List */}
          <div className="space-y-6 pb-20 w-full">
        {isLoadingUnits ? (
          <p className="text-center text-sm text-slate-400 py-10">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        ) : lessonViewMode === 'grid' && expandedUnits.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {units.map((unit) => (
              <div
                key={unit.id}
                onClick={() => setExpandedUnits([unit.id])}
                className="group bg-white rounded-2xl border border-slate-100 hover:border-teal-200 hover:shadow-md transition-all cursor-pointer p-5 flex flex-col gap-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <Book size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-sm leading-snug">{unit.title}</h3>
                    {unit.isHidden && <EyeOff size={12} className="text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {unit.lessons.length} {language === 'ar' ? 'عنصر' : 'items'}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${unit.progress}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">{unit.progress}%</span>
                </div>
              </div>
            ))}
            {!isStudent && (
              <button
                onClick={() => setIsBuildingUnit(true)}
                className="group bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-all p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-teal-600 min-h-[168px]"
              >
                <Plus size={28} />
                <span className="text-sm font-bold">{language === 'ar' ? 'إنشاء موديول جديد' : 'Create New Module'}</span>
              </button>
            )}
          </div>
        ) : (
        <>
        {lessonViewMode === 'grid' && (
          <button
            onClick={() => setExpandedUnits([])}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft size={16} /> {language === 'ar' ? 'رجوع للموديولات' : 'Back to Modules'}
          </button>
        )}
        {(lessonViewMode === 'grid' ? units.filter((u) => expandedUnits.includes(u.id)) : units).map((unit) => (
          <div key={unit.id} className="bg-white rounded-3xl border border-slate-100 shadow-none overflow-visible relative z-0">
            {/* Unit Header */}
            {lessonViewMode === 'grid' && (
            <div className="p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-black text-slate-900 text-2xl">{unit.title}</h2>
                  {unit.isHidden && (
                    <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-200">
                      <EyeOff size={11} /> {language === 'ar' ? 'مخفي عن الطلاب' : 'Hidden from students'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2.5">
                  <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all duration-500" style={{ width: `${unit.progress}%` }} />
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{unit.progress}% {language === 'ar' ? 'مكتمل' : 'completed'}</span>
                </div>
              </div>

              {!isStudent && (
                <div className="relative">
                  <button
                    onClick={() => setActiveUnitMenuId(activeUnitMenuId === unit.id ? null : unit.id)}
                    className="w-10 h-10 flex items-center justify-center border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {activeUnitMenuId === unit.id && (
                    <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-slate-100 p-1 z-30">
                      <button
                        onClick={async () => { setActiveUnitMenuId(null); const ok = await toggleUnitComplete(unit.id, !unit.isComplete); if (ok) refreshUnits(); }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                      >
                        <Check size={14} /> {unit.isComplete ? (language === 'ar' ? 'إلغاء الاكتمال' : 'Unmark Complete') : (language === 'ar' ? 'وضع علامة اكتمل' : 'Mark as Complete')}
                      </button>
                      <button
                        onClick={async () => { setActiveUnitMenuId(null); const ok = await toggleUnitHidden(unit.id, !unit.isHidden); if (ok) refreshUnits(); }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                      >
                        {unit.isHidden ? <Eye size={14} /> : <EyeOff size={14} />} {unit.isHidden ? (language === 'ar' ? 'إظهار للطلاب' : 'Show to students') : (language === 'ar' ? 'إخفاء عن الطلاب' : 'Hide from students')}
                      </button>
                      <button
                        onClick={() => { setActiveUnitMenuId(null); openUnitShareModal(unit); }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                      >
                        <Share2 size={14} /> {language === 'ar' ? 'مشاركة مع فصول تانية' : 'Share with other classes'}
                      </button>
                      <button
                        onClick={() => { setActiveUnitMenuId(null); handleAddClick(unit.id); }}
                        className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                      >
                        <Plus size={14} /> {language === 'ar' ? 'إضافة محتوى' : 'Add Material'}
                      </button>
                      <div className="h-px bg-slate-100 my-1" />
                      <button
                        onClick={async () => {
                          setActiveUnitMenuId(null);
                          if (window.confirm('Are you sure you want to delete this module? This cannot be undone.')) {
                            const { ok, error } = await deleteUnit(unit.id);
                            if (ok) refreshUnits();
                            else alert(language === 'ar' ? `حصل خطأ أثناء الحذف: ${error}` : `Error deleting: ${error}`);
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                      >
                        <Trash2 size={14} /> {language === 'ar' ? 'حذف الموديول' : 'Delete Module'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            {lessonViewMode === 'list' && (
            <div className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors rounded-t-3xl border-b border-slate-50">
              <div 
                onClick={() => toggleUnit(unit.id)}
                className="flex items-center gap-4 cursor-pointer flex-1"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-800 text-lg">{unit.title}</h3>
                    {unit.isHidden && (
                      <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-amber-200">
                        <EyeOff size={11} /> {language === 'ar' ? 'مخفي عن الطلاب' : 'Hidden from students'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                        style={{ width: `${unit.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{unit.progress}% completed</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!isStudent && (
                  <>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const ok = await toggleUnitComplete(unit.id, !unit.isComplete);
                        if (ok) refreshUnits();
                      }}
                      title={language === 'ar' ? 'وضع علامة اكتمل' : 'Mark as Complete'}
                      className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-all shadow-none ${
                        unit.isComplete ? 'bg-emerald-500 text-white border-transparent' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-500'
                      }`}
                    >
                      <Check size={18} className="stroke-[3]" />
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const ok = await toggleUnitHidden(unit.id, !unit.isHidden);
                        if (ok) refreshUnits();
                      }}
                      className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-all shadow-none
                        ${unit.isHidden
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
                        }`}
                      title={unit.isHidden ? (language === 'ar' ? 'إظهار للطلاب' : 'Show to students') : (language === 'ar' ? 'إخفاء عن الطلاب' : 'Hide from students')}
                    >
                      {unit.isHidden ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openUnitShareModal(unit); }}
                      className="w-9 h-9 flex items-center justify-center border rounded-xl transition-all shadow-none bg-white border-slate-200 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                      title={language === 'ar' ? 'مشاركة مع فصول تانية' : 'Share with other classes'}
                    >
                      <Share2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMasteryUnitId(activeMasteryUnitId === unit.id ? null : unit.id);
                      }}
                      className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-all shadow-none
                        ${activeMasteryUnitId === unit.id 
                          ? 'bg-orange-50 text-orange-600 border-orange-200' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200'
                        }`}
                      title="Mastery Paths"
                    >
                      <Shuffle size={18} />
                    </button>
                    <button 
                      onClick={() => handleAddClick(unit.id)}
                      className={`w-9 h-9 flex items-center justify-center border rounded-xl transition-all shadow-none
                        ${activeUnitForAdd === unit.id 
                          ? 'bg-teal-600 border-teal-600 text-white' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200'
                        }`}
                      title="Add Material"
                    >
                      <Plus size={18} />
                    </button>
                    
                    <div className="w-px h-6 bg-slate-200 mx-2" />

                    <div className="relative">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveUnitMenuId(activeUnitMenuId === unit.id ? null : unit.id); }}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors shadow-none"
                      >
                        <MoreVertical size={18} />
                      </button>
                      {activeUnitMenuId === unit.id && (
                      <div onClick={(e) => e.stopPropagation()} className="absolute top-full mt-1 right-0 w-48 bg-white rounded-xl shadow-lg border border-slate-100 p-1 z-20">
                        <button 
                          onClick={() => { setEditingUnit({ ...unit }); setActiveUnitMenuId(null); }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 shadow-none"
                        >
                          <Edit size={14} /> Edit Module
                        </button>
                        <div className="h-px bg-slate-100 my-1" />
                        <button 
                          onClick={async () => {
                            setActiveUnitMenuId(null);
                            if (window.confirm('Are you sure you want to delete this module? This cannot be undone.')) {
                              const { ok, error } = await deleteUnit(unit.id);
                              if (ok) refreshUnits();
                              else alert(language === 'ar' ? `حصل خطأ أثناء الحذف: ${error}` : `Error deleting: ${error}`);
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 shadow-none"
                        >
                          <Trash2 size={14} /> Delete Module
                        </button>
                      </div>
                      )}
                    </div>
                  </>
                )}

                <button 
                  onClick={() => toggleUnit(unit.id)}
                  className="text-slate-400 p-2 hover:bg-slate-100 rounded-full transition-colors shadow-none"
                >
                  <motion.div animate={{ rotate: expandedUnits.includes(unit.id) ? 180 : 0 }}>
                    <ChevronDown size={24} />
                  </motion.div>
                </button>
              </div>
            </div>
            )}

            {/* Lessons List */}
            <AnimatePresence>
              {expandedUnits.includes(unit.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  {/* Mastery Path Unit Builder */}
                  {activeMasteryUnitId === unit.id && (
                    <div className="p-4 bg-orange-50/50 border-b border-orange-100/50">
                      <UnitMasteryBuilder language={language} availableLessons={unit.lessons} />
                    </div>
                  )}

                  {lessonViewMode === 'grid' && (
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/30 rounded-b-3xl">
                    {unit.lessons.map((lesson) => (
                      <div key={lesson.id} className="group relative bg-white rounded-2xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div
                            onClick={() => {
                              if (lesson.type === 'link' && lesson.url) {
                                window.open(lesson.url, '_blank');
                              } else if (lesson.type === 'pdf' && lesson.storagePath) {
                                window.open(getLessonFileUrl(lesson.storagePath), '_blank');
                              } else if (lesson.type === 'quiz' || lesson.type === 'assignment') {
                                onAssessmentClick(lesson.id);
                              }
                            }}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 cursor-pointer
                              ${lesson.type === 'video' ? 'bg-pink-500 text-white' :
                                lesson.type === 'pdf' ? 'bg-blue-500 text-white' :
                                lesson.type === 'link' ? 'bg-orange-500 text-white' :
                                lesson.type === 'quiz' ? 'bg-orange-500 text-white' :
                                ['assignment', 'project'].includes(lesson.type) ? 'bg-teal-500 text-white' :
                                'bg-slate-400 text-white'
                              }`}
                          >
                            {lesson.type === 'video' ? <PlayCircle size={18} /> :
                             lesson.type === 'pdf' ? <FileText size={18} /> :
                             lesson.type === 'link' ? <LinkIcon size={18} /> :
                             lesson.type === 'quiz' ? <span className="font-black text-sm">?</span> :
                             <ClipboardCheck size={18} />}
                          </div>

                          {!isStudent && (
                            <div className="relative shrink-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); setActiveLessonMenuId(activeLessonMenuId === lesson.id ? null : lesson.id); }}
                                className="p-1 text-slate-300 hover:text-slate-500 rounded-lg transition-colors"
                              >
                                <MoreHorizontal size={18} />
                              </button>

                              {activeLessonMenuId === lesson.id && (
                              <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 p-1 z-20">
                                <button
                                  onClick={() => { setEditingLesson({ ...lesson }); setActiveLessonMenuId(null); }}
                                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 shadow-none"
                                >
                                  <Edit size={14} /> {language === 'ar' ? 'تعديل الاسم' : 'Edit Name'}
                                </button>
                                <button
                                  onClick={async () => {
                                    setActiveLessonMenuId(null);
                                    const ok = await toggleLessonHidden(lesson.id, !lesson.isHidden);
                                    if (ok) refreshUnits();
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 shadow-none"
                                >
                                  <EyeOff size={14} /> {lesson.isHidden ? (language === 'ar' ? 'إظهار للطلاب' : 'Show to Students') : (language === 'ar' ? 'إخفاء عن الطلاب' : 'Hide from Students')}
                                </button>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                  onClick={async () => {
                                    setActiveLessonMenuId(null);
                                    if (window.confirm(language === 'ar' ? 'متأكد إنك عايز تمسح الموضوع ده؟' : 'Delete this topic?')) {
                                      const { ok, error } = await deleteLesson(lesson.id);
                                      if (ok) refreshUnits();
                                      else alert(language === 'ar' ? `حصل خطأ أثناء الحذف: ${error}` : `Error deleting: ${error}`);
                                    }
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 shadow-none"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                              )}
                            </div>
                          )}
                        </div>

                        <h4
                          onClick={() => {
                            if (lesson.type === 'link' && lesson.url) {
                              window.open(lesson.url, '_blank');
                            } else if (lesson.type === 'pdf' && lesson.storagePath) {
                              window.open(getLessonFileUrl(lesson.storagePath), '_blank');
                            } else if (lesson.type === 'quiz' || lesson.type === 'assignment') {
                              onAssessmentClick(lesson.id);
                            }
                          }}
                          className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 cursor-pointer hover:text-teal-600 transition-colors"
                        >
                          {lesson.title}
                        </h4>

                        <div className="flex items-center justify-between gap-2 mt-auto">
                          {(() => {
                            const isDone = !isStudent ? lesson.isTopicComplete : (lesson.completed || ['COMPLETED', 'PENDING_REVIEW'].includes(demoAssessments.find(a => a.id === lesson.id)?.status || ''));
                            return (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!isStudent) {
                                    const ok = await toggleLessonComplete(lesson.id, !lesson.isTopicComplete);
                                    if (ok) refreshUnits();
                                  } else if ((lesson.id === 'math-quiz' || lesson.id === 'phys-lab')) {
                                    onAssessmentClick(lesson.id);
                                  } else {
                                    toggleLessonCompletion(unit.id, lesson.id);
                                  }
                                }}
                                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${isDone ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                {isDone ? <CheckCircle2 size={14} className="fill-emerald-100" /> : <Clock size={14} />}
                                {isDone ? (language === 'ar' ? 'مكتمل' : 'completed') : (language === 'ar' ? 'قيد الانتظار' : 'pending')}
                              </button>
                            );
                          })()}
                          <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider
                            ${lesson.source === 'ai' ? 'bg-purple-50 text-purple-600' :
                              lesson.type === 'video' ? 'bg-pink-50 text-pink-600' :
                              lesson.type === 'quiz' ? 'bg-amber-50 text-amber-600' :
                              lesson.type === 'assignment' ? 'bg-teal-50 text-teal-600' :
                              'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {lesson.source === 'ai' ? (language === 'ar' ? 'ذكاء اصطناعي' : 'AI') : lesson.type === 'video' ? 'VIDEO' : lesson.type === 'quiz' ? 'QUIZ' : lesson.type === 'assignment' ? 'ASSIGNMENT' : lesson.source === 'official' ? 'OFFICIAL' : 'CUSTOM'}
                          </span>
                        </div>

                        {lesson.isHidden && (
                          <span className="flex items-center gap-1 text-amber-600 text-[10px] font-bold">
                            <EyeOff size={10} /> {language === 'ar' ? 'مخفي عن الطلاب' : 'Hidden from students'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  )}

                  {lessonViewMode === 'list' && (
                  <div className="bg-white rounded-b-3xl divide-y divide-slate-50">
                    {unit.lessons.map((lesson) => {
                      const ListTypeIcon = lesson.type === 'video' ? PlayCircle :
                        lesson.type === 'pdf' ? FileText :
                        lesson.type === 'link' ? LinkIcon :
                        lesson.type === 'quiz' ? BrainCircuit :
                        ClipboardCheck;
                      const isDone = !isStudent ? lesson.isTopicComplete : (lesson.completed || ['COMPLETED', 'PENDING_REVIEW'].includes(demoAssessments.find(a => a.id === lesson.id)?.status || ''));
                      return (
                      <div
                        key={lesson.id}
                        onClick={() => {
                          if (lesson.type === 'link' && lesson.url) {
                            window.open(lesson.url, '_blank');
                          } else if (lesson.type === 'pdf' && lesson.storagePath) {
                            window.open(getLessonFileUrl(lesson.storagePath), '_blank');
                          } else if (lesson.type === 'quiz' || lesson.type === 'assignment') {
                            onAssessmentClick(lesson.id);
                            return;
                          }
                          if (isStudent) {
                            if ((lesson.id === 'math-quiz' || lesson.id === 'phys-lab')) {
                              onAssessmentClick(lesson.id);
                            } else {
                              toggleLessonCompletion(unit.id, lesson.id, true);
                            }
                          }
                        }}
                        className="group flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <div className={`relative w-32 h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center
                          ${lesson.type === 'video' ? 'bg-pink-50 text-pink-400' :
                            lesson.type === 'pdf' ? 'bg-blue-50 text-blue-400' :
                            lesson.type === 'link' ? 'bg-orange-50 text-orange-400' :
                            lesson.type === 'quiz' ? 'bg-purple-50 text-purple-400' :
                            'bg-teal-50 text-teal-400'
                          }`}
                        >
                          <ListTypeIcon size={32} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-800 text-base truncate">{lesson.title}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {lesson.isHidden && (
                              <span className="flex items-center gap-1 text-amber-600 text-[10px] font-bold">
                                <EyeOff size={9} /> {language === 'ar' ? 'مخفي' : 'Hidden'}
                              </span>
                            )}
                            {!isStudent && lesson.source === 'ai' && (
                              <span className="flex items-center gap-1 text-purple-600 text-[10px] font-bold">
                                <Sparkles size={9} /> AI
                              </span>
                            )}
                          </div>
                        </div>
                        {!isStudent && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const ok = await toggleLessonComplete(lesson.id, !lesson.isTopicComplete);
                              if (ok) refreshUnits();
                            }}
                            className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-all border ${
                              isDone ? 'bg-emerald-500 text-white border-transparent' : 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50'
                            }`}
                          >
                            <Check size={14} className="stroke-[3]" />
                          </button>
                        )}
                        {isStudent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if ((lesson.id === 'math-quiz' || lesson.id === 'phys-lab')) {
                                onAssessmentClick(lesson.id);
                              } else {
                                toggleLessonCompletion(unit.id, lesson.id);
                              }
                            }}
                            className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                              isDone ? 'bg-emerald-500 text-white border-transparent' : 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50'
                            }`}
                          >
                            <Check size={13} className="stroke-[3]" />
                          </button>
                        )}
                        {!isStudent && (
                          <div className="relative shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveLessonMenuId(activeLessonMenuId === lesson.id ? null : lesson.id); }}
                              className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            {activeLessonMenuId === lesson.id && (
                            <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-100 p-1 z-20">
                              <button
                                onClick={() => { setEditingLesson({ ...lesson }); setActiveLessonMenuId(null); }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                              >
                                <Edit size={14} /> {language === 'ar' ? 'تعديل الاسم' : 'Edit Name'}
                              </button>
                              <button
                                onClick={async () => {
                                  setActiveLessonMenuId(null);
                                  const ok = await toggleLessonHidden(lesson.id, !lesson.isHidden);
                                  if (ok) refreshUnits();
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                              >
                                <EyeOff size={14} /> {lesson.isHidden ? (language === 'ar' ? 'إظهار للطلاب' : 'Show to Students') : (language === 'ar' ? 'إخفاء عن الطلاب' : 'Hide from Students')}
                              </button>
                              <div className="h-px bg-slate-100 my-1" />
                              <button
                                onClick={async () => {
                                  setActiveLessonMenuId(null);
                                  if (window.confirm(language === 'ar' ? 'متأكد إنك عايز تمسح الموضوع ده؟' : 'Delete this topic?')) {
                                    const { ok, error } = await deleteLesson(lesson.id);
                                    if (ok) refreshUnits();
                                    else alert(language === 'ar' ? `حصل خطأ أثناء الحذف: ${error}` : `Error deleting: ${error}`);
                                  }
                                }}
                                className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                  )}
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        </>
        )}

        {/* Create New Unit Button / Smart Course Planner */}
        {!isStudent && (
          !isBuildingUnit ? (
            (lessonViewMode === 'grid') ? null : (
            <button 
              onClick={() => setIsBuildingUnit(true)}
              className="w-full py-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 font-medium hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center gap-2 shadow-none"
            >
              <Plus size={20} />
              {language === 'ar' ? 'إنشاء وحدة جديدة' : 'Create New Module'}
            </button>
            )
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-none p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Set Up New Module</h3>
                <button onClick={() => { setIsBuildingUnit(false); setNewUnitMode(null); setNewUnitTitle(''); }} className="text-slate-400 hover:text-slate-600 shadow-none">
                  <X size={20} />
                </button>
              </div>
              
              {!newUnitMode ? (
                <div className="flex gap-3">
                  <button 
                    onClick={() => setNewUnitMode('manual')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 border border-slate-200 rounded-2xl hover:border-teal-300 hover:bg-teal-50 transition-all shadow-none"
                  >
                    <Layout size={18} className="text-teal-600" />
                    <span className="font-bold text-slate-700 text-sm">{language === 'ar' ? 'إنشاء يدوي' : 'Manual Build'}</span>
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{language === 'ar' ? 'اسم الوحدة' : 'Module Title'}</label>
                  <input 
                    type="text" 
                    autoFocus
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    placeholder="e.g.: Algebraic Expressions"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-none mb-4"
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setNewUnitMode(null)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors shadow-none">
                      {language === 'ar' ? 'رجوع' : 'Back'}
                    </button>
                    <button 
                      onClick={async () => {
                        if (!learnScope || !newUnitTitle.trim()) return;
                        const { id, error } = await createUnit(learnScope, { title: newUnitTitle, weeksLabel: '' });
                        if (id) {
                          refreshUnits();
                          setIsBuildingUnit(false);
                          setNewUnitMode(null);
                          setNewUnitTitle('');
                        } else {
                          alert(language === 'ar' ? `حصل خطأ أثناء إنشاء الوحدة: ${error}` : `Error creating module: ${error}`);
                        }
                      }}
                      disabled={!newUnitTitle.trim()}
                      className="flex-1 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors shadow-none"
                    >
                      {language === 'ar' ? 'إضافة' : 'Add'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* Add Material Modal */}
      <AnimatePresence>
        {activeUnitForAdd && !isStudent && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-lg relative shadow-none"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Add Content</h3>
                <button 
                  onClick={() => setActiveUnitForAdd(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors shadow-none"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => openAddLesson(activeUnitForAdd, units.find(u => u.id === activeUnitForAdd)?.title || '')}
                  className="flex flex-col items-center gap-3 p-6 border border-slate-200 hover:border-teal-300 hover:bg-teal-50 rounded-2xl text-center group transition-all shadow-none"
                >
                  <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Layout size={24} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-700 mb-1">Add Topic</span>
                    <span className="block text-xs text-slate-500">Upload video, PDF or link</span>
                  </div>
                </button>
                <button 
                  onClick={() => openAddAssessment(activeUnitForAdd, units.find(u => u.id === activeUnitForAdd)?.title || '', 'quiz')}
                  className="flex flex-col items-center gap-3 p-6 border border-slate-200 hover:border-purple-300 hover:bg-purple-50 rounded-2xl text-center group transition-all shadow-none"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BrainCircuit size={24} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-700 mb-1">Add Quiz</span>
                    <span className="block text-xs text-slate-500">Questions, auto-graded</span>
                  </div>
                </button>
                <button 
                  onClick={() => openAddAssessment(activeUnitForAdd, units.find(u => u.id === activeUnitForAdd)?.title || '', 'assignment')}
                  className="flex flex-col items-center gap-3 p-6 border border-slate-200 hover:border-orange-300 hover:bg-orange-50 rounded-2xl text-center group transition-all shadow-none"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ClipboardCheck size={24} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-700 mb-1">Add Assignment</span>
                    <span className="block text-xs text-slate-500">Upload/submit, manual grading</span>
                  </div>
                </button>
                <button 
                  onClick={() => openLibrary(units.find(u => u.id === activeUnitForAdd)?.title || '')}
                  className="flex flex-col items-center gap-3 p-6 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-2xl text-center group transition-all shadow-none"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Book size={24} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-700 mb-1">Import from Library</span>
                    <span className="block text-xs text-slate-500">Official curriculum content</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals & Drawers */}
      <LibraryDrawer 
        isOpen={isLibraryOpen} 
        onClose={() => setIsLibraryOpen(false)} 
        targetUnitTitle={targetUnitTitle} 
        language={language}
        grade={grade}
        subject={subject}
        teacherId={teacherId}
        classId={classId}
        onInject={async (items: any[]) => {
          if (!targetUnitId) return;
          for (const item of items) {
            await createLesson({
              unitId: targetUnitId,
              title: item.title,
              type: 'library',
              weekLabel: units.find(u => u.id === targetUnitId)?.weeks || '',
              libraryFileId: item.id,
              url: item.url || null,
            });
          }
          refreshUnits();
        }}
      />

      <AddLessonModal
        isOpen={isAddLessonOpen}
        onClose={() => setIsAddLessonOpen(false)}
        onAdd={handleSaveLesson}
        unitTitle={targetUnitTitle}
      />

      <AddAssessmentModal
        isOpen={isAddAssessmentOpen}
        onClose={() => setIsAddAssessmentOpen(false)}
        unitTitle={targetUnitTitle}
        classId={classId}
        subject={subject}
        grade={grade}
        unitId={targetUnitId}
        assessmentType={newAssessmentType}
      />

      <StudentCompletionPopover 
        isOpen={!!activeCompletion} 
        onClose={() => setActiveCompletion(null)}
        lessonId={activeCompletion?.id || null}
        classId={classId || ''}
        language={language}
        anchorRect={activeCompletion?.rect || null}
      />

      <AnimatePresence>
        {editingUnit && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-md relative shadow-none"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{language === 'ar' ? 'تعديل الوحدة' : 'Edit Module'}</h3>
                <button 
                  onClick={() => setEditingUnit(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors shadow-none"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'ar' ? 'اسم الوحدة' : 'Module Title'}</label>
                  <input 
                    type="text" 
                    value={editingUnit.title}
                    onChange={(e) => setEditingUnit({ ...editingUnit, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button 
                  onClick={() => setEditingUnit(null)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors shadow-none"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (editingUnit) {
                      const { ok, error } = await updateUnit(editingUnit.id, { title: editingUnit.title });
                      if (ok) {
                        refreshUnits();
                        setEditingUnit(null);
                      } else {
                        alert(language === 'ar' ? `حصل خطأ أثناء التعديل: ${error}` : `Error saving: ${error}`);
                      }
                    } else {
                      setEditingUnit(null);
                    }
                  }}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors shadow-none"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Topic Modal */}
      <AnimatePresence>
        {editingLesson && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-md relative shadow-none"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{language === 'ar' ? 'تعديل الموضوع' : 'Edit Topic'}</h3>
                <button onClick={() => setEditingLesson(null)} className="text-slate-400 hover:text-slate-600 transition-colors shadow-none">
                  <X size={24} />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{language === 'ar' ? 'اسم الموضوع' : 'Topic Title'}</label>
                <input 
                  type="text" 
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button onClick={() => setEditingLesson(null)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors shadow-none">
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (!editingLesson) return;
                    const { ok, error } = await updateLesson(editingLesson.id, { title: editingLesson.title });
                    if (ok) {
                      refreshUnits();
                      setEditingLesson(null);
                    } else {
                      alert(language === 'ar' ? `حصل خطأ أثناء التعديل: ${error}` : `Error saving: ${error}`);
                    }
                  }}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors shadow-none"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Module Modal */}
      <AnimatePresence>
        {shareUnit && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-100 p-6 w-full max-w-md relative shadow-none"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">{language === 'ar' ? `مشاركة "${shareUnit.title}"` : `Share "${shareUnit.title}"`}</h3>
                <button onClick={() => setShareUnit(null)} className="text-slate-400 hover:text-slate-600 transition-colors shadow-none">
                  <X size={24} />
                </button>
              </div>

              <label className="block text-xs font-bold text-slate-500 mb-2">{language === 'ar' ? 'شارك مع فصولي التانية' : 'Share with my other classes'}</label>
              <div className="space-y-1.5 max-h-52 overflow-y-auto mb-6">
                {unitTargetClasses.map((c) => (
                  <label key={c.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selectedUnitShareClasses.includes(c.id)}
                      onChange={() => setSelectedUnitShareClasses((prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id])}
                      className="accent-teal-600"
                    />
                    <span className="text-xs font-medium text-slate-700">{c.name}</span>
                  </label>
                ))}
                {unitTargetClasses.length === 0 && <p className="text-xs text-slate-400 py-2">{language === 'ar' ? 'مفيش فصول تانية عندك لسه.' : 'No other classes yet.'}</p>}
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShareUnit(null)} className="px-5 py-2.5 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors shadow-none">
                  Cancel
                </button>
                <button onClick={handleSaveUnitShare} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors shadow-none">
                  {language === 'ar' ? 'حفظ المشاركة' : 'Save Sharing'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </>
      )}

    </div>
  );
}
