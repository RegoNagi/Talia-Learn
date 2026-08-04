import React, { useState } from 'react';
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
}

interface Unit {
  id: string;
  title: string;
  weeks: string;
  progress: number;
  lessons: Lesson[];
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
  const [units, setUnits] = useState<Unit[]>([
    {
      id: 'u1',
      title: 'Unit 1: System of Linear Equations',
      weeks: 'Week 1 - 2',
      progress: 82,
      lessons: [
        { id: 'l1.1', title: '1.1 Introduction to Linear Systems', type: 'video', source: 'official', week: 'Week 1', completedCount: 22, totalCount: 22, status: 'success' },
        { id: 'l1.2', title: '1.2 Matrix Notation and Gaussian Elimination', type: 'pdf', source: 'official', week: 'Week 1', completedCount: 20, totalCount: 22, status: 'ongoing' },
        { id: 'l1.3', title: 'Quiz: Row Operations', type: 'quiz', source: 'custom', week: 'Week 2', completedCount: 18, totalCount: 22, status: 'overdue' },
        { id: 'math-quiz', title: 'Unit 1: Mathematics Quiz', type: 'quiz', source: 'official', week: 'Week 2', completedCount: 0, totalCount: 22, status: 'upcoming' },
        { id: 'phys-lab', title: 'Assignment: Physics Lab Report', type: 'assignment', source: 'official', week: 'Week 2', completedCount: 0, totalCount: 22, status: 'upcoming' },
        { id: 'l1.4', title: 'Applications of Linear Systems', type: 'video', source: 'ai', week: 'Week 2', completedCount: 10, totalCount: 22, status: 'urgent' },
        { id: 'l1.5', title: 'Additional Resources', type: 'link', source: 'official', week: 'Week 2', completedCount: 22, totalCount: 22, status: 'success' },
      ]
    },
    {
      id: 'u2',
      title: 'Unit 2: Matrix Algebra',
      weeks: 'Week 3 - 4',
      progress: 45,
      lessons: [
        { id: 'l2.1', title: '2.1 Matrix Operations', type: 'video', source: 'official', week: 'Week 3', completedCount: 0, totalCount: 22, status: 'upcoming' },
        { id: 'l2.2', title: '2.2 The Inverse of a Matrix', type: 'assignment', source: 'official', week: 'Week 3', completedCount: 22, totalCount: 22, status: 'grading' },
        { id: 'l2.3', title: 'Summary of Properties', type: 'pdf', source: 'custom', week: 'Week 4', completedCount: 15, totalCount: 22, status: 'ongoing' },
        { id: 'l2.4', title: 'Solved Examples', type: 'video', source: 'official', week: 'Week 4', completedCount: 5, totalCount: 22, status: 'upcoming' },
      ]
    },
    {
      id: 'u3',
      title: 'Unit 3: Determinants',
      weeks: 'Week 5 - 6',
      progress: 15,
      lessons: [
        { id: 'l3.1', title: '3.1 Properties of Determinants', type: 'video', source: 'official', week: 'Week 5', completedCount: 12, totalCount: 22, status: 'ongoing' },
        { id: 'l3.2', title: 'Applied Assignment', type: 'assignment', source: 'custom', week: 'Week 5', completedCount: 0, totalCount: 22, status: 'upcoming' },
        { id: 'l3.3', title: 'Cramer\'s Rule', type: 'video', source: 'official', week: 'Week 6', completedCount: 0, totalCount: 22, status: 'upcoming' },
        { id: 'l3.4', title: 'Interactive Review', type: 'link', source: 'ai', week: 'Week 6', completedCount: 0, totalCount: 22, status: 'upcoming' },
      ]
    },
    {
      id: 'u4',
      title: 'Unit 4: Vector Spaces',
      weeks: 'Week 7 - 8',
      progress: 0,
      lessons: [
        { id: 'l4.1', title: '4.1 Subspaces and Spanning Sets', type: 'video', source: 'official', week: 'Week 7', completedCount: 0, totalCount: 22, status: 'upcoming' },
        { id: 'l4.2', title: 'Unit Notes', type: 'pdf', source: 'custom', week: 'Week 7', completedCount: 0, totalCount: 22, status: 'upcoming' },
        { id: 'l4.3', title: 'Midterm Evaluation Project', type: 'project', source: 'official', week: 'Week 8', completedCount: 0, totalCount: 22, status: 'upcoming' },
      ]
    },
    {
      id: 'u5',
      title: 'Unit 5: Eigenvalues and Eigenvectors',
      weeks: 'Week 9 - 10',
      progress: 0,
      lessons: [
        { id: 'l5.1', title: 'Introduction to Eigenvalues', type: 'video', source: 'official', week: 'Week 9', completedCount: 0, totalCount: 22, status: 'upcoming' },
        { id: 'l5.2', title: 'Explanation File', type: 'pdf', source: 'official', week: 'Week 9', completedCount: 0, totalCount: 22, status: 'upcoming' },
        { id: 'l5.3', title: 'Comprehensive Unit Quiz', type: 'quiz', source: 'custom', week: 'Week 10', completedCount: 0, totalCount: 22, status: 'upcoming' },
      ]
    }
  ]);

  const [expandedUnits, setExpandedUnits] = useState<string[]>(['u1']);
  const [activeUnitForAdd, setActiveUnitForAdd] = useState<string | null>(null);
  const [activeCompletion, setActiveCompletion] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [activeMasteryUnitId, setActiveMasteryUnitId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [targetUnitTitle, setTargetUnitTitle] = useState('');
  const [targetUnitId, setTargetUnitId] = useState<string | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

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

  const openAddAssessment = (unitId: string, unitTitle: string) => {
    setTargetUnitId(unitId);
    setTargetUnitTitle(unitTitle);
    setIsAddAssessmentOpen(true);
    setActiveUnitForAdd(null);
  };

  const handleSaveLesson = (lessonData: { title: string; type: ContentType; source: 'custom' }) => {
    if (!targetUnitId) return;

    const newLesson: Lesson = {
      id: `l${window.crypto.randomUUID()}`,
      ...lessonData,
      week: 'Week 1', // Default for new items
      completedCount: 0,
      totalCount: 22,
      status: 'upcoming'
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
      status: 'upcoming'
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
        title: newUnitTitle || 'Untitled Unit', 
        weeks: 'Week 1', 
        progress: 0, 
        lessons: [] 
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
      status: 'upcoming'
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
        <BrowseLibraryTab language={language} role={viewRole?.toLowerCase() || 'student'} teacherId={teacherId} classId={classId} subject={subject} forcedMode={contentView === 'material' ? 'material' : 'my-library'} />
      ) : (
        <>
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
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-none">
                      <Calendar size={12} /> {unit.weeks}
                    </span>
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

                    <div className="relative group/unit-menu">
                      <button 
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-colors shadow-none"
                      >
                        <MoreVertical size={18} />
                      </button>
                      <div className="absolute top-full mt-1 right-0 w-48 bg-white rounded-xl shadow-none border border-slate-100 p-1 hidden group-hover/unit-menu:block z-20">
                        <button 
                          onClick={() => setEditingUnit({ ...unit })}
                          className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 shadow-none"
                        >
                          <Edit size={14} /> Edit Unit
                        </button>
                        <div className="h-px bg-slate-100 my-1" />
                        <button 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this unit? This cannot be undone.')) {
                              setUnits(prev => prev.filter(u => u.id !== unit.id));
                            }
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 shadow-none"
                        >
                          <Trash2 size={14} /> Delete Unit
                        </button>
                      </div>
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
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {/* Week Label */}
                              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                <Calendar size={10} /> {lesson.week}
                              </span>

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
                          
                          {/* Completion Visual */}
                          {!isStudent && (
                            <div className="relative">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCompletionPopover(lesson.id, e);
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors border shadow-none ${getStatusColor(lesson.status)}`}
                              >
                                {lesson.status === 'overdue' || lesson.status === 'urgent' ? (
                                  <AlertCircle size={16} className={getStatusIconColor(lesson.status)} />
                                ) : (
                                  <CheckCircle2 size={16} className={getStatusIconColor(lesson.status)} />
                                )}
                                <span className="text-xs font-bold">{lesson.completedCount}/{lesson.totalCount}</span>
                              </button>
                            </div>
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
                              <div className="relative group/menu">
                                <button className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors shadow-none">
                                  <MoreHorizontal size={20} />
                                </button>
                                
                                {/* Hover Menu Dropdown */}
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-none border border-slate-100 p-1 hidden group-hover/menu:block z-20">
                                {lesson.source === 'official' ? (
                                  <>
                                    <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 shadow-none">
                                      <EyeOff size={14} /> Hide from Students
                                    </button>
                                    <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 shadow-none">
                                      <Copy size={14} /> Duplicate
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 shadow-none">
                                      <Edit size={14} /> Edit Content
                                    </button>
                                    <button className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg flex items-center gap-2 shadow-none">
                                      <Copy size={14} /> Duplicate
                                    </button>
                                    <div className="h-px bg-slate-100 my-1" />
                                    <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 shadow-none">
                                      <Trash2 size={14} /> Delete
                                    </button>
                                  </>
                                )}
                              </div>
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
              Create New Unit
            </button>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-none p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Set Up New Unit</h3>
                <button onClick={() => { setIsBuildingUnit(false); setNewUnitMode(null); setGeneratedPlan(null); setNewUnitTitle(''); }} className="text-slate-400 hover:text-slate-600 shadow-none">
                  <X size={20} />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Unit Title</label>
                <input 
                  type="text" 
                  value={newUnitTitle}
                  onChange={(e) => setNewUnitTitle(e.target.value)}
                  placeholder="e.g.: Algebraic Expressions"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-none"
                />
              </div>

              {!newUnitMode ? (
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setNewUnitMode('ai')}
                    className="p-6 border border-slate-200 rounded-2xl text-left hover:border-purple-300 hover:bg-purple-50 transition-all group shadow-none"
                  >
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles size={24} />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-1">AI Generation</h4>
                    <p className="text-sm text-slate-500">Smart plan based on national standards</p>
                  </button>
                  <button 
                    onClick={() => setNewUnitMode('manual')}
                    className="p-6 border border-slate-200 rounded-2xl text-left hover:border-teal-300 hover:bg-teal-50 transition-all group shadow-none"
                  >
                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Layout size={24} />
                    </div>
                    <h4 className="font-bold text-slate-800 mb-1">Manual Build</h4>
                    <p className="text-sm text-slate-500">Create custom structure from scratch</p>
                  </button>
                </div>
              ) : newUnitMode === 'ai' ? (
                <div>
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
                              {item.added ? 'Added' : 'Add to Unit'}
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
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Layout size={32} />
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">Manual Build</h4>
                  <p className="text-sm text-slate-500 mb-6">Drag and drop files or create items from scratch.</p>
                  <button 
                    onClick={() => {
                      const newUnitId = `u${window.crypto.randomUUID()}`;
                      setUnits([...units, { id: newUnitId, title: newUnitTitle || 'Untitled Unit', weeks: 'Week 1', progress: 0, lessons: [] }]);
                      setIsBuildingUnit(false);
                      setNewUnitMode(null);
                      setNewUnitTitle('');
                    }}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-colors shadow-none"
                  >
                    Create Empty Unit
                  </button>
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
                    <span className="block text-sm font-bold text-slate-700 mb-1">Add Lesson</span>
                    <span className="block text-xs text-slate-500">Upload video, PDF or link</span>
                  </div>
                </button>
                <button 
                  onClick={() => openAddAssessment(activeUnitForAdd, units.find(u => u.id === activeUnitForAdd)?.title || '')}
                  className="flex flex-col items-center gap-3 p-6 border border-slate-200 hover:border-purple-300 hover:bg-purple-50 rounded-2xl text-center group transition-all shadow-none"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BrainCircuit size={24} />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-slate-700 mb-1">Add Assessment</span>
                    <span className="block text-xs text-slate-500">Quiz or Assignment</span>
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
                <h3 className="text-xl font-bold text-slate-800">Edit Unit</h3>
                <button 
                  onClick={() => setEditingUnit(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors shadow-none"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Title</label>
                  <input 
                    type="text" 
                    value={editingUnit.title}
                    onChange={(e) => setEditingUnit({ ...editingUnit, title: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Timeframe (Weeks)</label>
                  <input 
                    type="text" 
                    value={editingUnit.weeks}
                    onChange={(e) => setEditingUnit({ ...editingUnit, weeks: e.target.value })}
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
                  onClick={() => {
                    setUnits(prev => prev.map(u => u.id === editingUnit.id ? editingUnit : u));
                    setEditingUnit(null);
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
      </>
      )}

    </div>
  );
}
