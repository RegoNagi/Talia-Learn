import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Book, 
  ChevronDown, 
  MoreHorizontal, 
  PlayCircle, 
  FileText, 
  BrainCircuit, 
  ShieldCheck, 
  Shuffle,
  Plus,
  User,
  Sparkles,
  Trash2,
  Copy,
  EyeOff,
  Eye,
  Share2,
  Edit,
  Layout,
  Wand2,
  Calendar,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  ClipboardCheck,
  X,
  MoreVertical,
  Link as LinkIcon,
  CloudUpload
} from 'lucide-react';

import { LibraryDrawer } from '@/components/LearningPath/LibraryDrawer';
import { AddLessonModal } from '@/components/LearningPath/AddLessonModal';
import { AddAssessmentModal } from '@/components/LearningPath/AddAssessmentModal';
import { StudentCompletionPopover } from '@/components/LearningPath/StudentCompletionPopover';
import { UnitMasteryBuilder } from '@/components/UnitMasteryBuilder';
import { BrowseLibraryTab } from '@/components/tabs/BrowseLibraryTab';
import { getUnits, createUnit, deleteUnit, updateUnit, toggleUnitHidden, toggleUnitComplete, updateUnitSharing, getLessons, createLesson, updateLesson, deleteLesson, toggleLessonHidden, toggleLessonComplete } from '@/services/learningPathData';
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
  classId,
  subject,
  grade,
}: { 
  viewRole?: 'TEACHER' | 'STUDENT',
  demoAssessments?: any[],
  language?: 'ar' | 'en',
  onAssessmentClick?: (id: string) => void,
  teacherId?: string,
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
      const lessons = await getLessons(realUnits.map(u => u.id));
      const mapped: Unit[] = realUnits.map((u) => ({
        id: u.id,
        title: u.title,
        weeks: u.weeksLabel,
        progress: 0,
        isHidden: u.isHidden,
        isComplete: u.isComplete,
        sharedWith: u.sharedWith,
        lessons: lessons.filter(l => l.unitId === u.id).map((l) => ({
          id: l.id,
          title: l.title,
          type: l.type as ContentType,
          source: 'custom' as LessonSource,
          week: l.weekLabel,
          completedCount: 0,
          totalCount: 0,
          status: 'upcoming' as LessonStatus,
          isHidden: l.isHidden,
          isTopicComplete: l.isComplete,
        })),
      }));
      setUnits(mapped);
      setIsLoadingUnits(false);
    });
  };

  useEffect(() => {
    refreshUnits();
  }, [learnScope?.classId, learnScope?.subject]);

  const [expandedUnits, setExpandedUnits] = useState<string[]>([]);
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
  const [newUnitMode, setNewUnitMode] = useState<'ai' | 'manual' | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any[] | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<{title: string, prompt: string} | null>(null);

  const [contentView, setContentView] = useState<'path' | 'material' | 'my-library'>('path');

  const isStudent = viewRole === 'STUDENT';

  const toggleLessonCompletion = (unitId: string, lessonId: string, forceStatus?: boolean) => {
    setUnits(prevUnits => prevUnits.map(unit => {
      if (unit.id === unitId) {
        return {
          ...unit,
          lessons: unit.lessons.map(lesson => {
            if (lesson.id === lessonId) {
              return { ...lesson, completed: forceStatus !== undefined ? forceStatus : !lesson.completed };
            }
            return lesson;
          })
        };
      }
      return unit;
    }));
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

  const handleSaveAssessment = (assessmentData: { title: string; type: 'quiz' | 'assignment' | 'project'; category: string; source: 'custom' }) => {
    if (!targetUnitId) return;

    const newLesson: Lesson = {
      id: `a${window.crypto.randomUUID()}`,
      title: assessmentData.title,
      type: assessmentData.type,
      source: assessmentData.source,
      week: 'Week 1', // Default for new items
      completedCount: 0,
      totalCount: 22,
      status: 'upcoming',
      isHidden: false,
      isTopicComplete: false,
    };

    setUnits(prevUnits => prevUnits.map(unit => {
      if (unit.id === targetUnitId) {
        return {
          ...unit,
          lessons: [...unit.lessons, newLesson]
        };
      }
      return unit;
    }));
  };

  const handleGeneratePlan = () => {
    setIsGeneratingPlan(true);
    setTimeout(() => {
      setGeneratedPlan([
        { id: 'gen1', title: 'Introduction to Expressions', type: 'video', effort: '15 mins', prompt: 'Create a 15-minute video script introducing algebraic expressions.', added: false },
        { id: 'gen2', title: 'Simplifying Terms', type: 'pdf', effort: '20 mins', prompt: 'Generate a study guide on simplifying algebraic terms.', added: false },
        { id: 'gen3', title: 'Expressions Quiz', type: 'quiz', effort: '10 mins', prompt: 'Create a 5-question multiple choice quiz on algebraic expressions.', added: false },
        { id: 'gen4', title: 'Matrix Multiplication Practice Sheet', type: 'assignment', effort: '30 mins', prompt: 'Generate a practice worksheet with 10 problems on multiplying matrices of varying dimensions. Include an answer key.', added: false },
      ]);
      setIsGeneratingPlan(false);
    }, 1500);
  };

  const handleAddGeneratedItem = (item: any) => {
    let currentUnitId = units.find(u => u.title === newUnitTitle)?.id;
    if (!currentUnitId) {
      currentUnitId = `u${window.crypto.randomUUID()}`;
      setUnits(prev => [...prev, { 
        id: currentUnitId!, 
        title: newUnitTitle || 'Untitled Module', 
        weeks: 'Week 1', 
        progress: 0, 
        lessons: [],
        isHidden: false,
        isComplete: false,
        sharedWith: [],
      }]);
      setExpandedUnits(prev => [...prev, currentUnitId!]);
    }

    const newLesson: Lesson = {
      id: `l${window.crypto.randomUUID()}`,
      title: item.title,
      type: item.type,
      source: 'ai',
      week: 'Week 1',
      completedCount: 0,
      totalCount: 22,
      status: 'upcoming',
      isHidden: false,
      isTopicComplete: false,
    };

    setUnits(prevUnits => prevUnits.map(unit => {
      if (unit.id === currentUnitId) {
        const updatedLessons = [...unit.lessons, newLesson];
        const progress = Math.min(100, updatedLessons.length * 15);
        return {
          ...unit,
          progress,
          lessons: updatedLessons
        };
      }
      return unit;
    }));

    setGeneratedPlan(prev => prev?.map(p => p.id === item.id ? { ...p, added: true } : p) || null);
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
            <div className="flex justify-end gap-2 mb-4">
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
        {units.map((unit) => (
          <div key={unit.id} className="bg-white rounded-3xl border border-slate-100 shadow-none overflow-visible relative z-0">
            {/* Unit Header */}
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

                  <div className="p-2 space-y-1 bg-slate-50/30 rounded-b-3xl">
                    {unit.lessons.map((lesson) => (
                      <React.Fragment key={lesson.id}>
                        <div 
                          onClick={() => {
                          if (isStudent) {
                            if ((lesson.id === 'math-quiz' || lesson.id === 'phys-lab')) {
                              onAssessmentClick(lesson.id);
                            } else {
                              toggleLessonCompletion(unit.id, lesson.id, true);
                            }
                          }
                        }}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white hover:bg-slate-50 border border-transparent hover:border-slate-100 group transition-colors mx-4 relative cursor-pointer shadow-none"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                            ${lesson.type === 'video' ? 'bg-pink-50 text-pink-500' :
                              lesson.type === 'pdf' ? 'bg-blue-50 text-blue-500' :
                              lesson.type === 'link' ? 'bg-orange-50 text-orange-500' :
                              lesson.type === 'quiz' ? 'bg-purple-50 text-purple-500' :
                              ['assignment', 'project'].includes(lesson.type) ? 'bg-teal-50 text-teal-500' :
                              'bg-slate-50 text-slate-500'
                            }`}
                          >
                            {lesson.type === 'video' ? <PlayCircle size={20} /> :
                             lesson.type === 'pdf' ? <FileText size={20} /> :
                             lesson.type === 'link' ? <LinkIcon size={20} /> :
                             lesson.type === 'quiz' ? <BrainCircuit size={20} /> :
                             <ClipboardCheck size={20} />}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-slate-800 text-sm">{lesson.title}</h4>
                              {lesson.isHidden && (
                                <span className="flex items-center gap-1 bg-amber-50 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-amber-200">
                                  <EyeOff size={9} /> {language === 'ar' ? 'مخفي' : 'Hidden'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {/* Badges */}
                              {!isStudent && lesson.source === 'official' && (
                                <span className="flex items-center gap-1 bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-200">
                                  <ShieldCheck size={10} /> Official
                                </span>
                              )}
                              {!isStudent && lesson.source === 'custom' && (
                                <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
                                  <User size={10} /> Custom
                                </span>
                              )}
                              {!isStudent && lesson.source === 'ai' && (
                                <span className="flex items-center gap-1 bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-100">
                                  <Sparkles size={10} /> AI Generated
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Side Controls */}
                        <div className="flex items-center gap-2">
                          
                          {/* Mark as Complete (Teacher) */}
                          {!isStudent && (
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                const ok = await toggleLessonComplete(lesson.id, !lesson.isTopicComplete);
                                if (ok) refreshUnits();
                              }}
                              title={language === 'ar' ? 'وضع علامة اكتمل' : 'Mark as Complete'}
                              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all shadow-none border ${
                                lesson.isTopicComplete ? 'bg-emerald-500 text-white border-transparent' : 'border-slate-200 text-slate-300 hover:border-slate-300 hover:text-slate-400'
                              }`}
                            >
                              <Check size={16} className="stroke-[3]" />
                            </button>
                          )}

                          {isStudent && (
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if ((lesson.id === 'math-quiz' || lesson.id === 'phys-lab')) {
                                    onAssessmentClick(lesson.id);
                                  } else {
                                    toggleLessonCompletion(unit.id, lesson.id);
                                  }
                                }}
                                className={`flex items-center justify-center w-6 h-6 rounded-full transition-all shadow-none ${
                                  (lesson.completed || ['COMPLETED', 'PENDING_REVIEW'].includes(demoAssessments.find(a => a.id === lesson.id)?.status || '')) ? 'bg-emerald-500 text-white border-transparent' : 'border border-slate-200 text-slate-200 hover:border-slate-300 hover:text-slate-300'
                                }`}
                                title="Mark as Complete"
                              >
                                <Check size={14} className="stroke-[3]" />
                              </button>
                            </div>
                          )}

                          {/* Context Menu (3-dots) for Teacher */}
                          {!isStudent && (
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setActiveLessonMenuId(activeLessonMenuId === lesson.id ? null : lesson.id); }}
                                  className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors shadow-none"
                                >
                                  <MoreHorizontal size={20} />
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
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* No more inline MasteryPathInlinePanel */}
                    </React.Fragment>
                  ))}
                </div>
              </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Create New Unit Button / Smart Course Planner */}
        {!isStudent && (
          !isBuildingUnit ? (
            <button 
              onClick={() => setIsBuildingUnit(true)}
              className="w-full py-6 border-2 border-dashed border-slate-200 rounded-3xl text-slate-500 font-medium hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600 transition-all flex items-center justify-center gap-2 shadow-none"
            >
              <Plus size={20} />
              {language === 'ar' ? 'إنشاء وحدة جديدة' : 'Create New Module'}
            </button>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-none p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Set Up New Module</h3>
                <button onClick={() => { setIsBuildingUnit(false); setNewUnitMode(null); setGeneratedPlan(null); setNewUnitTitle(''); }} className="text-slate-400 hover:text-slate-600 shadow-none">
                  <X size={20} />
                </button>
              </div>
              
              {!newUnitMode ? (
                <div className="flex gap-3">
                  <button 
                    onClick={() => setNewUnitMode('ai')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 border border-slate-200 rounded-2xl hover:border-purple-300 hover:bg-purple-50 transition-all shadow-none"
                  >
                    <Sparkles size={18} className="text-purple-600" />
                    <span className="font-bold text-slate-700 text-sm">{language === 'ar' ? 'توليد بالذكاء الاصطناعي' : 'AI Generation'}</span>
                  </button>
                  <button 
                    onClick={() => setNewUnitMode('manual')}
                    className="flex-1 flex items-center justify-center gap-2 py-4 border border-slate-200 rounded-2xl hover:border-teal-300 hover:bg-teal-50 transition-all shadow-none"
                  >
                    <Layout size={18} className="text-teal-600" />
                    <span className="font-bold text-slate-700 text-sm">{language === 'ar' ? 'إنشاء يدوي' : 'Manual Build'}</span>
                  </button>
                </div>
              ) : newUnitMode === 'manual' ? (
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
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Module Title</label>
                  <input 
                    type="text" 
                    value={newUnitTitle}
                    onChange={(e) => setNewUnitTitle(e.target.value)}
                    placeholder="e.g.: Algebraic Expressions"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-none mb-4"
                  />
                {!generatedPlan ? (
                    <button 
                      onClick={handleGeneratePlan}
                      disabled={!newUnitTitle || isGeneratingPlan}
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-none"
                    >
                      {isGeneratingPlan ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Analyzing curriculum...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Generate Full Plan
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800">AI Suggested Plan</h4>
                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-md shadow-none">Standards Based</span>
                      </div>
                      
                      {generatedPlan.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-white shadow-none">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                              ${item.type === 'video' ? 'bg-pink-50 text-pink-500' :
                                item.type === 'pdf' ? 'bg-blue-50 text-blue-500' :
                                item.type === 'quiz' ? 'bg-purple-50 text-purple-500' :
                                'bg-teal-50 text-teal-500'
                              }`}
                            >
                              {item.type === 'video' ? <PlayCircle size={20} /> :
                               item.type === 'pdf' ? <FileText size={20} /> :
                               item.type === 'quiz' ? <BrainCircuit size={20} /> :
                               <ClipboardCheck size={20} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-slate-700">{item.title}</h5>
                                <span className="flex items-center gap-1 bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-100 shadow-none">
                                  <Sparkles size={10} /> AI Generated
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> {item.effort}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.type === 'assignment' && (
                              <button 
                                onClick={() => setPreviewPrompt({ title: item.title, prompt: item.prompt })}
                                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors shadow-none"
                              >
                                Preview Prompt
                              </button>
                            )}
                            <button 
                              onClick={() => handleAddGeneratedItem(item)}
                              disabled={item.added}
                              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-none
                                ${item.added ? 'bg-emerald-50 text-emerald-600' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'}`}
                            >
                              {item.added ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                              {item.added ? 'Added' : 'Add to Module'}
                            </button>
                          </div>
                        </div>
                      ))}

                      <div className="pt-4 border-t border-slate-100 mt-4">
                        <button 
                          onClick={() => setNewUnitMode('manual')}
                          className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 shadow-none"
                        >
                          <Plus size={18} />
                          Add Item Manually
                        </button>
                      </div>
                    </div>
                  )}
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
                <button 
                  onClick={() => {
                    setActiveUnitForAdd(null);
                    setIsBuildingUnit(true);
                    setNewUnitMode('ai');
                    setNewUnitTitle(units.find(u => u.id === activeUnitForAdd)?.title || '');
                  }}
                  className="flex flex-col items-center gap-3 p-6 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-2xl text-center group transition-all shadow-none"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wand2 size={24} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-700 mb-1">AI Generation</span>
                    <span className="block text-xs text-slate-500">Generate content instantly</span>
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
        onAdd={handleSaveAssessment}
        unitTitle={targetUnitTitle}
        classId={classId}
        subject={subject}
        unitId={targetUnitId}
        assessmentType={newAssessmentType}
      />

      <StudentCompletionPopover 
        isOpen={!!activeCompletion} 
        onClose={() => setActiveCompletion(null)}
        completedCount={units.flatMap(u => u.lessons).find(l => l.id === activeCompletion?.id)?.completedCount || 0}
        totalCount={units.flatMap(u => u.lessons).find(l => l.id === activeCompletion?.id)?.totalCount || 0}
        anchorRect={activeCompletion?.rect || null}
      />

      {/* Preview Prompt Modal */}
      {previewPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-none max-w-lg w-full overflow-hidden border border-slate-100"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-500" />
                AI Prompt Preview
              </h3>
              <button onClick={() => setPreviewPrompt(null)} className="text-slate-400 hover:text-slate-600 shadow-none">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 bg-slate-50">
              <p className="text-sm font-medium text-slate-700 mb-2">Target Item:</p>
              <p className="text-sm text-slate-600 mb-4">{previewPrompt.title}</p>
              
              <p className="text-sm font-medium text-slate-700 mb-2">Generated Prompt:</p>
              <div className="p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-mono leading-relaxed text-left shadow-none">
                {previewPrompt.prompt}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setPreviewPrompt(null)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-colors shadow-none"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Unit Modal */}
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
