'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BrainCircuit, CheckCircle2, ChevronDown, Plus, 
  FileText, ListChecks, Image as ImageIcon, Type, 
  MoreVertical, Trash2, GripVertical, Sparkles,
  Settings, Clock, Shuffle, Eye, Calendar,
  UploadCloud, Scale, GraduationCap, AlignLeft,
  CheckSquare, Layout, Save, ArrowLeft, Pencil, Book,
  User, Send, AlertCircle, HelpCircle, Info, ShieldCheck,
  Search, Check, Lock, Copy, MessageSquare, Minus, Home
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';
import { FloatingPortal } from '@floating-ui/react';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { createAssignment, uploadAssignmentAttachment, getSubmissionFileUrl } from '@/services/assignmentData';

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'file_upload';
  text: string;
  points: number;
  options?: { id: string; text: string; isCorrect: boolean }[];
}

interface RubricLevel {
  id: string;
  score: number;
  title: string;
  description: string;
  color: 'red' | 'amber' | 'emerald' | 'blue';
}

interface RubricCriterion {
  id: string;
  title: string;
  weight: number;
  levels: RubricLevel[];
}

export const dynamic = 'force-dynamic';

function AssessmentBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authUser } = useAuth();
  const scopeClassId = searchParams.get('classId') || '';
  const scopeSubject = searchParams.get('subject') || '';
  const scopeUnitId = searchParams.get('unitId') || '';
  const returnTo = searchParams.get('from') || '';

  const goBack = () => {
    if (returnTo) router.push(decodeURIComponent(returnTo));
    else router.back();
  };
  const [isSavingReal, setIsSavingReal] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [activeTab, setActiveTab] = useState<'quiz' | 'assignment'>('assignment');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('quiz');
  const [maxScore, setMaxScore] = useState(100);
  const [isAutoCalc, setIsAutoCalc] = useState(true);
  const [isGraded, setIsGraded] = useState(true);
  
  // Settings
  const [attemptLimit, setAttemptLimit] = useState('1');
  const [timeLimitHours, setTimeLimitHours] = useState('1');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  
  // Security & Display
  const [isTimed, setIsTimed] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [oneAtATime, setOneAtATime] = useState(false);
  const [prohibitLateSubmissions, setProhibitLateSubmissions] = useState(false);
  const [prohibitBacktracking, setProhibitBacktracking] = useState(false);
  const [feedbackTiming, setFeedbackTiming] = useState('instantly');
  const [showFeedback, setShowFeedback] = useState(true);
  const [aiPlagiarism, setAiPlagiarism] = useState(true);
  const [publishToTimeline, setPublishToTimeline] = useState(true);

  // UI State
  const [isAIDraftRoomOpen, setIsAIDraftRoomOpen] = useState(false);
  const [isBankDrawerOpen, setIsBankDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  // AI Strategy Room State
  const [strategyTab, setStrategyTab] = useState<'strategy' | 'instant'>('strategy');
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [hasGeneratedQuiz, setHasGeneratedQuiz] = useState(false);
  const [activeLessonTab, setActiveLessonTab] = useState('1.1');
  const [selectedLessons, setSelectedLessons] = useState<string[]>(['1.1']);
  const [selectedLOs, setSelectedLOs] = useState<string[]>(['Understand Dimensions']);
  const [selectedBloom, setSelectedBloom] = useState<string>('Application');
  const [difficulty, setDifficulty] = useState<string>('Intermediate');
  const [magicPrompt, setMagicPrompt] = useState('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [status, setStatus] = useState<'published' | 'draft'>('draft');

  // Quiz State
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q1',
      type: 'multiple_choice',
      text: 'Which of the following best describes the primary function of a mitochondria?',
      points: 10,
      options: [
        { id: 'opt1', text: 'Protein synthesis', isCorrect: false },
        { id: 'opt2', text: 'Energy production (ATP)', isCorrect: true },
        { id: 'opt3', text: 'Cell division', isCorrect: false },
        { id: 'opt4', text: 'Photosynthesis', isCorrect: false },
      ]
    }
  ]);

  // Assignment State
  const [instructionsText, setInstructionsText] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; storagePath: string }[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [allowFileUpload, setAllowFileUpload] = useState(true);
  const [allowTextEntry, setAllowTextEntry] = useState(true);
  const [passPercentage, setPassPercentage] = useState(65);
  const [latePenalty, setLatePenalty] = useState('none');
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [lockModule, setLockModule] = useState(false);
  const [gradingMethod, setGradingMethod] = useState<'Points' | 'Percentage' | 'Scale'>('Points');

  useEffect(() => {
    if (activeTab === 'assignment') setGradingMethod('Points');
  }, [activeTab]);

  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [rubric, setRubric] = useState<RubricCriterion[]>([
    {
      id: 'crit1',
      title: 'Critical Thinking',
      weight: 40,
      levels: [
        { id: 'l1', score: 0, title: 'POOR', description: 'Lacks basic understanding and analysis.', color: 'red' }, 
        { id: 'l2', score: 50, title: 'GOOD', description: 'Shows good comprehension but misses nuance.', color: 'amber' },
        { id: 'l3', score: 100, title: 'EXCELLENT', description: 'Exceptional analysis and insight.', color: 'emerald' }
      ]
    },
    {
      id: 'crit2',
      title: 'Grammar & Mechanics',
      weight: 20,
      levels: [
        { id: 'l4', score: 0, title: 'POOR', description: 'Frequent errors impede readability.', color: 'red' }, 
        { id: 'l5', score: 50, title: 'GOOD', description: 'Minor errors, generally clear.', color: 'amber' },
        { id: 'l6', score: 100, title: 'EXCELLENT', description: 'Flawless execution.', color: 'emerald' }
      ]
    }
  ]);

  const addToast = (message: string) => {
    const id = window.crypto.randomUUID();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleSave = async () => {
    if (activeTab === 'assignment') {
      if (!authUser?.teacherId || !scopeClassId || !scopeSubject) {
        addToast('حصل خطأ: بيانات الفصل أو المادة مش متوفرة.');
        return;
      }
      if (!title.trim()) {
        addToast('اكتب عنوان الواجب الأول.');
        return;
      }
      setIsSavingReal(true);
      setSaveError('');
      const dueDateTime = dueDate ? `${dueDate}T${dueTime || '23:59'}` : null;
      const assignmentSettings = {
        maxScore,
        attemptLimit,
        allowLateSubmission,
        latePenalty: allowLateSubmission ? latePenalty : 'none',
        feedbackTiming,
        publishToTimeline,
        allowFileUpload,
        allowTextEntry,
        gradingMethod,
        passPercentage,
      };
      const { id, error } = await createAssignment(
        { teacherId: authUser.teacherId, classId: scopeClassId, subject: scopeSubject },
        { title: title.trim(), instructions: instructionsText, dueDate: dueDateTime, settings: assignmentSettings, rubric, attachments }
      );
      setIsSavingReal(false);
      if (id) {
        addToast('Assignment Saved & Published!');
        setTimeout(() => goBack(), 1000);
      } else {
        setSaveError(error || 'Unknown error');
        addToast(`حصل خطأ أثناء الحفظ: ${error}`);
      }
      return;
    }
    // الكويز لسه مش متوصّل بالحفظ الحقيقي (خطوة قادمة منفصلة)
    addToast('Assessment Saved & Published!');
    setTimeout(() => goBack(), 1000);
  };

  const handleGenerateRubric = () => {
    setIsGeneratingRubric(true);
    addToast('Faheem is analyzing your assignment goal...');
    
    setTimeout(() => {
      setRubric([
        {
          id: `crit-${window.crypto.randomUUID()}`,
          title: 'Understanding of Core Concepts',
          weight: 35,
          levels: [
            { id: `l-${window.crypto.randomUUID()}`, score: gradingMethod === 'Percentage' ? 0 : 1, title: 'POOR', description: 'Demonstrates little to no understanding of the core concepts. Fails to apply them correctly.', color: 'red' },
            { id: `l-${window.crypto.randomUUID()}`, score: gradingMethod === 'Percentage' ? 50 : 3, title: 'GOOD', description: 'Shows a solid grasp of most concepts. Applies them correctly in standard scenarios.', color: 'amber' },
            { id: `l-${window.crypto.randomUUID()}`, score: gradingMethod === 'Percentage' ? 100 : 5, title: 'EXCELLENT', description: 'Exceptional mastery of all concepts. Can apply them creatively to novel situations.', color: 'emerald' }
          ]
        },
        {
          id: `crit-${window.crypto.randomUUID()}`,
          title: 'Analytical Depth',
          weight: 35,
          levels: [
            { id: `l-${window.crypto.randomUUID()}`, score: gradingMethod === 'Percentage' ? 0 : 1, title: 'POOR', description: 'Analysis is superficial or missing. Relies heavily on summary rather than insight.', color: 'red' },
            { id: `l-${window.crypto.randomUUID()}`, score: gradingMethod === 'Percentage' ? 50 : 3, title: 'GOOD', description: 'Provides good analysis with relevant evidence, though some points may lack depth.', color: 'amber' },
            { id: `l-${window.crypto.randomUUID()}`, score: gradingMethod === 'Percentage' ? 100 : 5, title: 'EXCELLENT', description: 'Profound and nuanced analysis. Connects ideas brilliantly with strong supporting evidence.', color: 'emerald' }
          ]
        },
        {
          id: `crit-${window.crypto.randomUUID()}`,
          title: 'Clarity & Organization',
          weight: 30,
          levels: [
            { id: `l-${window.crypto.randomUUID()}`, score: gradingMethod === 'Percentage' ? 0 : 1, title: 'POOR', description: 'Disorganized and difficult to follow. Frequent errors impede readability.', color: 'red' },
            { id: `l-${window.crypto.randomUUID()}`, score: gradingMethod === 'Percentage' ? 50 : 3, title: 'GOOD', description: 'Generally well-organized and clear. Minor errors do not detract from the overall message.', color: 'amber' },
            { id: `l-${window.crypto.randomUUID()}`, score: gradingMethod === 'Percentage' ? 100 : 5, title: 'EXCELLENT', description: 'Flawlessly organized with a logical flow. Writing is exceptionally clear and engaging.', color: 'emerald' }
          ]
        }
      ]);
      setIsGeneratingRubric(false);
      addToast('Faheem generated a new rubric!');
    }, 2000);
  };

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: `q-${window.crypto.randomUUID()}`,
      type,
      text: '',
      points: 10,
      options: type === 'multiple_choice' ? [
        { id: `opt-${window.crypto.randomUUID()}`, text: 'Option 1', isCorrect: false },
        { id: `opt-${window.crypto.randomUUID()}`, text: 'Option 2', isCorrect: false }
      ] : type === 'true_false' ? [
        { id: `opt-${window.crypto.randomUUID()}`, text: 'True', isCorrect: false },
        { id: `opt-${window.crypto.randomUUID()}`, text: 'False', isCorrect: false }
      ] : undefined
    };
    setQuestions(prev => [...prev, newQuestion]);
    addToast('Question Added');
  };

  const deleteQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    addToast('Question Deleted');
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const addRubricCriterion = () => {
    const newCrit: RubricCriterion = {
      id: `crit-${window.crypto.randomUUID()}`,
      title: 'New Criterion',
      weight: 10,
      levels: [
        { id: `l-${window.crypto.randomUUID()}`, score: 1, title: 'POOR', description: 'Needs improvement.', color: 'red' },
        { id: `l-${window.crypto.randomUUID()}`, score: 3, title: 'GOOD', description: 'Meets expectations.', color: 'amber' },
        { id: `l-${window.crypto.randomUUID()}`, score: 5, title: 'EXCELLENT', description: 'Exceeds expectations.', color: 'emerald' }
      ]
    };
    setRubric(prev => [...prev, newCrit]);
    addToast('Criterion Added');
  };

  const deleteRubricCriterion = (id: string) => {
    setRubric(prev => prev.filter(c => c.id !== id));
    addToast('Criterion Deleted');
  };

  const updateRubricCriterion = (id: string, updates: Partial<RubricCriterion>) => {
    setRubric(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col font-sans text-slate-900">
      {/* 1. Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-[60]">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => router.push('/')}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
          >
            <Home size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <Link href="/" className="hover:text-indigo-600 transition-colors">Course</Link>
              <span className="text-slate-300">/</span>
              <span>Unit 1</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">Assessment Builder</span>
            </div>
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BrainCircuit size={16} className="text-indigo-600" />
              {title || 'Untitled Assessment'}
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl mx-4">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'quiz' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Quiz
          </button>
          <button
            onClick={() => setActiveTab('assignment')}
            className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'assignment' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Assignment
          </button>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          {saveError && <span className="text-xs text-rose-600 font-bold">{saveError}</span>}
          <button 
            onClick={() => setIsPreviewMode((p) => !p)}
            className={`font-bold text-sm px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${isPreviewMode ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <Eye size={16} /> {isPreviewMode ? 'Exit Preview' : 'Preview'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSavingReal}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            <Save size={16} /> {isSavingReal ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </header>

      {/* Student Preview Overlay (نفس شكل الطالب بالظبط، مش بوب أب) */}
      {isPreviewMode && (
        <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
          <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6 w-full">
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2">
              <Eye size={14} /> معاينة كطالب — كده هيشوفها الطالب بالظبط
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{title || 'بدون عنوان'}</h2>
              {dueDate && (
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 font-medium">
                  <span className="flex items-center gap-1"><AlertCircle size={16}/> Due: {new Date(`${dueDate}T${dueTime || '23:59'}`).toLocaleString()}</span>
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-2">Instructions</h3>
                <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">{instructionsText || 'مفيش تعليمات لسه.'}</p>
              </div>
              {attachments.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-2">Attachments</h3>
                  <div className="space-y-2">
                    {attachments.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-indigo-600">
                        <FileText size={16} /> {a.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-slate-100 pt-6 space-y-6">
                {allowTextEntry && (
                  <div>
                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-3">Written Response</h3>
                    <textarea disabled rows={5} className="w-full border border-slate-200 rounded-2xl p-5 text-slate-400 bg-slate-50 resize-none" placeholder="Type your answer or paste your links here..."></textarea>
                  </div>
                )}
                {allowFileUpload && (
                  <div>
                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-3">File Upload</h3>
                    <div className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                      <UploadCloud size={36} className="mb-4" />
                      <p className="font-bold">Drag & drop files here</p>
                    </div>
                  </div>
                )}
                <button disabled className="w-full py-4 bg-indigo-300 cursor-not-allowed text-white rounded-xl font-bold text-lg">
                  Submit Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isPreviewMode && (
      <>
      {/* Main Content Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 2. Left Canvas (Builder) */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-12 bg-[#FAFAFA] relative">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'quiz' ? (
              <div className="space-y-8 pb-32">
                {/* Question List */}
                <AnimatePresence mode="popLayout">
                  {questions.map((q, idx) => (
                    <motion.div 
                      key={q.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white rounded-[24px] border-2 border-blue-500 p-8 relative group transition-all"
                    >
                      {/* Drag Handle */}
                      <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-slate-300 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical size={20} />
                      </div>

                      {/* Question Header */}
                      <div className="flex justify-between items-center mb-6">
                        <div className="text-blue-600 font-bold text-xs tracking-widest uppercase">
                          QUESTION {idx + 1} • {q.type.replace('_', ' ')}
                        </div>
                        <div className="flex items-center gap-4 text-slate-400">
                          <button className="hover:text-slate-600 transition-colors">
                            <Copy size={20} />
                          </button>
                          <button 
                            onClick={() => deleteQuestion(q.id)}
                            className="hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Question Text */}
                      <div className="mb-8">
                        <textarea 
                          value={q.text}
                          onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                          rows={2}
                          className="w-full text-xl text-slate-800 font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300 resize-none"
                          placeholder="What is the question?"
                        />
                      </div>

                      {/* Options (for MC / TF) */}
                      {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                        <div className="space-y-4 mb-8">
                          {q.options?.map((opt, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx); // A, B, C, D...
                            return (
                              <div 
                                key={opt.id} 
                                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group/opt ${
                                  opt.isCorrect 
                                    ? 'border-emerald-500 bg-emerald-50/30' 
                                    : 'border-slate-100 bg-white hover:border-slate-200'
                                }`}
                              >
                                <button 
                                  onClick={() => {
                                    const newOpts = q.options?.map(o => ({ ...o, isCorrect: o.id === opt.id }));
                                    updateQuestion(q.id, { options: newOpts });
                                  }}
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shrink-0 ${
                                    opt.isCorrect 
                                      ? 'bg-emerald-500 text-white' 
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {letter}
                                </button>
                                <input 
                                  type="text" 
                                  value={opt.text}
                                  onChange={(e) => {
                                    const newOpts = q.options?.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o);
                                    updateQuestion(q.id, { options: newOpts });
                                  }}
                                  className={`flex-1 bg-transparent border-none p-0 focus:ring-0 text-base font-medium outline-none ${
                                    opt.isCorrect ? 'text-emerald-900' : 'text-slate-800'
                                  }`}
                                  placeholder={`Option ${letter}`}
                                />
                                {opt.isCorrect && (
                                  <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                                )}
                                {!opt.isCorrect && q.type === 'multiple_choice' && (
                                  <button 
                                    onClick={() => {
                                      const newOpts = q.options?.filter(o => o.id !== opt.id);
                                      updateQuestion(q.id, { options: newOpts });
                                    }}
                                    className="opacity-0 group-hover/opt:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity shrink-0"
                                  >
                                    <X size={20} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'short_answer' && (
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 text-slate-400 text-sm italic mb-8">
                          Students will provide a text-based response here.
                        </div>
                      )}

                      {q.type === 'file_upload' && (
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 flex items-center gap-4 text-slate-400 text-sm mb-8">
                          <UploadCloud size={20} />
                          <span>Students will be prompted to upload a file (PDF, Image, or Doc).</span>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                        {q.type === 'multiple_choice' && (
                          <button 
                            onClick={() => {
                              const newOpts = [...(q.options || []), { id: `opt-${Date.now()}`, text: '', isCorrect: false }];
                              updateQuestion(q.id, { options: newOpts });
                            }}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <Plus size={18} /> Add Option
                          </button>
                        )}
                        {q.type === 'multiple_choice' && (
                          <div className="w-px h-4 bg-slate-200"></div>
                        )}
                        <button className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                          <MessageSquare size={18} /> Feedback Logic
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Creation Tools */}
                <div className="pt-12 border-t border-slate-200">
                  <div className="flex flex-col items-center gap-6">
                    <div className="flex gap-3">
                      {[
                        { type: 'multiple_choice', icon: ListChecks, label: 'Multiple Choice' },
                        { type: 'true_false', icon: CheckSquare, label: 'True/False' },
                        { type: 'short_answer', icon: Type, label: 'Short Answer' },
                        { type: 'file_upload', icon: UploadCloud, label: 'File Upload' }
                      ].map((item) => (
                        <button 
                          key={item.type}
                          onClick={() => addQuestion(item.type as any)}
                          className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                          <item.icon size={18} />
                          {item.label}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setIsBankDrawerOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
                      >
                        <Book size={18} />
                        From Question Bank
                      </button>
                      <button 
                        onClick={() => setIsAIDraftRoomOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-1000 -skew-x-12 -translate-x-full"></div>
                        <Sparkles size={18} className="animate-pulse" />
                        ✨ Ask Faheem to Strategize
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Assignment Builder Content */
              <div className="space-y-12 pb-32">
                
                {/* 1. Assignment Instructions Area */}
                <section className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Assignment Instructions</h2>
                    <p className="text-slate-500 mt-1">Provide clear guidelines for your students.</p>
                  </div>
                  
                  <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm p-8 space-y-6">
                    {/* Dropzone */}
                    <label className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer group block">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700 mb-1">{isUploadingAttachment ? 'Uploading...' : 'Upload Instructions or Drag & Drop'}</h3>
                      <p className="text-xs text-slate-400">PDF, DOCX, or plain text up to 10MB</p>
                      <input
                        type="file"
                        className="hidden"
                        disabled={isUploadingAttachment}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          e.target.value = '';
                          if (!file) return;
                          setIsUploadingAttachment(true);
                          const uploaded = await uploadAssignmentAttachment(file);
                          setIsUploadingAttachment(false);
                          if (uploaded) setAttachments((prev) => [...prev, uploaded]);
                          else addToast('حصل خطأ أثناء رفع المرفق.');
                        }}
                      />
                    </label>

                    {attachments.length > 0 && (
                      <div className="space-y-2">
                        {attachments.map((a, i) => (
                          <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                            <span className="text-sm font-bold text-slate-700 truncate">{a.name}</span>
                            <button onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-rose-600">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      <div className="h-px bg-slate-100 flex-1"></div>
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">OR</span>
                      <div className="h-px bg-slate-100 flex-1"></div>
                    </div>

                    {/* Rich Text Area */}
                    <div>
                      <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
                          <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"><Type size={14} /></button>
                          <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"><AlignLeft size={14} /></button>
                          <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"><ImageIcon size={14} /></button>
                        </div>
                        <textarea 
                          value={instructionsText}
                          onChange={(e) => setInstructionsText(e.target.value)}
                          rows={6}
                          className="w-full p-4 text-sm text-slate-700 bg-white border-none focus:ring-0 resize-none placeholder:text-slate-300"
                          placeholder="Write detailed instructions here..."
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. The Colorful Rubric Builder */}
                <section className="space-y-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-slate-800">Grading Rubric</h2>
                        {activeTab !== 'assignment' && (
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                          {(['Points', 'Percentage', 'Scale'] as const).map(method => (
                            <button
                              key={method}
                              onClick={() => setGradingMethod(method)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${gradingMethod === method ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                              {method}
                            </button>
                          ))}
                        </div>
                        )}
                      </div>
                      <p className="text-slate-500 mt-1">Define how student work will be evaluated.</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={handleGenerateRubric}
                        disabled={isGeneratingRubric}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          isGeneratingRubric 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-200'
                        }`}
                      >
                        <Sparkles size={16} className={isGeneratingRubric ? "animate-pulse" : ""} /> 
                        {isGeneratingRubric ? 'Generating...' : 'AI Generate Rubric'}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {rubric.map((crit) => (
                      <div key={crit.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm relative group overflow-hidden">
                        {/* Criterion Header */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-100">
                          <div className="flex items-center gap-3 flex-1 max-w-md relative group/title">
                            <GripVertical size={16} className="text-slate-300 cursor-grab" />
                            <span className="text-slate-800 font-bold">Criterion:</span>
                            <input 
                              type="text" 
                              value={crit.title}
                              onChange={(e) => updateRubricCriterion(crit.id, { title: e.target.value })}
                              className="text-base font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 placeholder:text-slate-300 w-full pr-8"
                              placeholder="Criterion Title"
                            />
                            <Pencil size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover/title:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center bg-blue-50 rounded-full px-3 py-1 relative group/weight">
                              <span className="text-[10px] font-bold text-blue-600 uppercase mr-1">Weight:</span>
                              <input 
                                type="number" 
                                value={crit.weight}
                                onChange={(e) => updateRubricCriterion(crit.id, { weight: e.target.value === '' ? 0 : (parseInt(e.target.value) || 0) })}
                                className="w-8 bg-transparent border-none p-0 text-left text-[10px] font-bold text-blue-600 focus:ring-0"
                              />
                              <span className="text-[10px] font-bold text-blue-600 uppercase mr-4">{gradingMethod === 'Points' ? 'PTS' : '%'}</span>
                              <Pencil size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 opacity-0 group-hover/weight:opacity-100 transition-opacity pointer-events-none" />
                            </div>
                            <button 
                              onClick={() => deleteRubricCriterion(crit.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Levels Grid */}
                        <div className="flex overflow-x-auto custom-scrollbar">
                          {crit.levels.map((lvl, idx) => {
                            const textColors = {
                              red: 'text-red-500',
                              amber: 'text-amber-500',
                              emerald: 'text-emerald-500',
                              blue: 'text-blue-500'
                            };
                            
                            return (
                              <div key={lvl.id} className={`flex-1 min-w-[200px] p-5 relative group/level ${idx !== crit.levels.length - 1 ? 'border-r border-slate-100' : ''}`}>
                                <div className="flex justify-between items-center mb-3">
                                  <div className="flex items-center flex-1">
                                    <input 
                                      type="text"
                                      value={lvl.title}
                                      onChange={(e) => {
                                        const newLevels = crit.levels.map(l => l.id === lvl.id ? { ...l, title: e.target.value } : l);
                                        updateRubricCriterion(crit.id, { levels: newLevels });
                                      }}
                                      className={`font-bold text-sm bg-transparent border-none p-0 focus:ring-0 uppercase tracking-wide w-[auto] max-w-[100px] ${textColors[lvl.color]}`}
                                    />
                                    <span className={`font-bold text-sm whitespace-nowrap ${textColors[lvl.color]}`}>
                                      (
                                    </span>
                                    <input 
                                      type="number" 
                                      value={lvl.score}
                                      onChange={(e) => {
                                        const newLevels = crit.levels.map(l => l.id === lvl.id ? { ...l, score: e.target.value === '' ? 0 : (parseInt(e.target.value) || 0) } : l);
                                        updateRubricCriterion(crit.id, { levels: newLevels });
                                      }}
                                      className={`w-8 bg-transparent border-none p-0 text-center text-sm font-bold focus:ring-0 ${textColors[lvl.color]}`}
                                    />
                                    <span className={`font-bold text-sm whitespace-nowrap ${textColors[lvl.color]}`}>
                                      {gradingMethod === 'Points' ? 'PTS' : gradingMethod === 'Percentage' ? '%' : 'LVL'})
                                    </span>
                                  </div>
                                  <Pencil size={12} className="text-slate-300 opacity-0 group-hover/level:opacity-100 transition-opacity" />
                                </div>
                                <div className="relative group/ldesc">
                                  <textarea 
                                    value={lvl.description}
                                    onChange={(e) => {
                                      const newLevels = crit.levels.map(l => l.id === lvl.id ? { ...l, description: e.target.value } : l);
                                      updateRubricCriterion(crit.id, { levels: newLevels });
                                    }}
                                    rows={3}
                                    className="w-full bg-transparent border-none p-0 text-sm italic text-slate-500 leading-relaxed focus:ring-0 resize-none pr-6"
                                    placeholder="Describe this level..."
                                  />
                                  <Pencil size={12} className="absolute right-1 top-2 opacity-0 group-hover/ldesc:opacity-50 transition-opacity pointer-events-none text-slate-400" />
                                </div>
                              </div>
                            );
                          })}
                          <button 
                            onClick={() => {
                              const newLevel = { id: `l-${window.crypto.randomUUID()}`, score: 0, title: 'NEW', description: 'Describe this level...', color: 'blue' as const };
                              updateRubricCriterion(crit.id, { levels: [...crit.levels, newLevel] });
                            }}
                            className="w-12 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all border-l border-slate-100 shrink-0"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={addRubricCriterion}
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Add New Criterion
                    </button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>

        {/* 3. Inspector Sidebar (Right) */}
        <AssessmentSidebar 
          language="en"
          activeTab={activeTab}
          title={title}
          setTitle={setTitle}
          status={status as any}
          setStatus={(s) => setStatus(s as any)}
          category={category}
          setCategory={setCategory}
          isAutoCalc={isAutoCalc}
          setIsAutoCalc={setIsAutoCalc}
          maxScore={maxScore}
          setMaxScore={setMaxScore}
          attemptLimit={attemptLimit}
          setAttemptLimit={setAttemptLimit}
          timeLimitHours={timeLimitHours}
          setTimeLimitHours={setTimeLimitHours}
          timeLimitMinutes={timeLimitMinutes}
          setTimeLimitMinutes={setTimeLimitMinutes}
          dueDate={dueDate}
          setDueDate={setDueDate}
          dueTime={dueTime}
          setDueTime={setDueTime}
          prohibitLateSubmissions={prohibitLateSubmissions}
          setProhibitLateSubmissions={setProhibitLateSubmissions}
          shuffleQuestions={shuffleQuestions}
          setShuffleQuestions={setShuffleQuestions}
          oneAtATime={oneAtATime}
          setOneAtATime={setOneAtATime}
          prohibitBacktracking={prohibitBacktracking}
          setProhibitBacktracking={setProhibitBacktracking}
          feedbackTiming={feedbackTiming}
          setFeedbackTiming={setFeedbackTiming}
          aiPlagiarism={aiPlagiarism}
          setAiPlagiarism={setAiPlagiarism}
          publishToTimeline={publishToTimeline}
          setPublishToTimeline={setPublishToTimeline}
          allowFileUpload={allowFileUpload}
          setAllowFileUpload={setAllowFileUpload}
          allowTextEntry={allowTextEntry}
          setAllowTextEntry={setAllowTextEntry}
          gradingMethod={gradingMethod}
          rubric={rubric as any}
          passPercentage={passPercentage}
          setPassPercentage={setPassPercentage}
          latePenalty={latePenalty}
          setLatePenalty={setLatePenalty}
          allowLateSubmission={allowLateSubmission}
          setAllowLateSubmission={setAllowLateSubmission}
          lockModule={lockModule}
          setLockModule={setLockModule}
        />
      </div>
      </>
      )}

      {/* Portals: AI Sidebar & Bank Drawer */}
      <FloatingPortal>
        <AnimatePresence>
          {isAIDraftRoomOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAIDraftRoomOpen(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-4 md:inset-10 bg-white/90 backdrop-blur-xl shadow-2xl z-[110] flex flex-col rounded-[24px] border border-white/50 overflow-hidden max-w-4xl mx-auto"
              >
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-200/50 flex justify-between items-center bg-white/50">
                  <div className="flex items-center gap-4">
                    {hasGeneratedQuiz && (
                      <button onClick={() => setHasGeneratedQuiz(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors mr-2">
                        <ArrowLeft size={20} />
                      </button>
                    )}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        {hasGeneratedQuiz ? "Review AI Suggestions" : "Faheem AI Strategy Room"}
                      </h2>
                      <p className="text-sm text-slate-500">Unit 1: Matrix Operations</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAIDraftRoomOpen(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 bg-[#FAFAFA] flex flex-col overflow-hidden relative">
                  {!hasGeneratedQuiz ? (
                    <div className="flex-1 overflow-y-auto p-8">
                      {/* Strategy Commander Header */}
                      <div className="flex gap-4 mb-8 border-b border-slate-200/50 pb-4">
                        <button 
                          onClick={() => setStrategyTab('strategy')}
                          className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors -mb-[17px] ${
                            strategyTab === 'strategy' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          Strategy Commander
                        </button>
                        <button 
                          onClick={() => setStrategyTab('instant')}
                          className={`pb-4 px-2 text-sm font-bold border-b-2 transition-colors -mb-[17px] flex items-center gap-2 ${
                            strategyTab === 'instant' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Sparkles size={14} /> Instant Quizzes
                        </button>
                      </div>

                      {strategyTab === 'strategy' ? (
                        <div className="space-y-8">
                          {/* Magic Box */}
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Natural Language Prompt</label>
                            <div className="relative">
                              <textarea 
                                value={magicPrompt}
                                onChange={(e) => setMagicPrompt(e.target.value)}
                                placeholder="e.g., Create a hard challenge about Matrix Inverse for advanced students..."
                                className="w-full h-32 bg-white border border-slate-200 rounded-2xl p-4 text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none shadow-sm"
                              ></textarea>
                              <div className="absolute bottom-4 right-4 text-slate-300">
                                <Sparkles size={20} />
                              </div>
                            </div>
                          </div>

                          {/* Granular Controls */}
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Target Lessons</label>
                                <div className="flex flex-wrap gap-2">
                                  {['1.1', '1.2', '1.3'].map(lesson => (
                                    <button 
                                      key={lesson}
                                      onClick={() => setSelectedLessons(prev => prev.includes(lesson) ? prev.filter(l => l !== lesson) : [...prev, lesson])}
                                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                        selectedLessons.includes(lesson) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                      }`}
                                    >
                                      Lesson {lesson}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Bloom&apos;s Taxonomy</label>
                                <select 
                                  value={selectedBloom}
                                  onChange={(e) => setSelectedBloom(e.target.value)}
                                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                  <option value="Knowledge">Knowledge (Recall)</option>
                                  <option value="Application">Application (Use)</option>
                                  <option value="Analysis">Analysis (Break down)</option>
                                  <option value="Synthesis">Synthesis (Create)</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Learning Outcomes</label>
                                <select 
                                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                  <option>Understand Dimensions</option>
                                  <option>Apply Multiplication Rules</option>
                                  <option>Invert Matrices</option>
                                  <option>Calculate Determinants</option>
                                </select>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</label>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                  {['Basic', 'Intermediate', 'Advanced'].map(diff => (
                                    <button 
                                      key={diff}
                                      onClick={() => setDifficulty(diff)}
                                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                        difficulty === diff ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                      }`}
                                    >
                                      {diff}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Number of Questions</label>
                                <div className="flex items-center justify-between bg-[#FAFAFA] border border-slate-200 rounded-[12px] p-1 w-full max-w-[150px]">
                                  <button 
                                    onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                  >
                                    <Minus size={16} />
                                  </button>
                                  <input 
                                    type="number" 
                                    value={questionCount}
                                    onChange={(e) => setQuestionCount(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-12 text-center text-sm font-bold text-slate-700 bg-transparent border-none focus:ring-0 p-0 outline-none"
                                  />
                                  <button 
                                    onClick={() => setQuestionCount(questionCount + 1)}
                                    className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4">
                            <button 
                              onClick={() => {
                                setIsGeneratingStrategy(true);
                                setTimeout(() => {
                                  setIsGeneratingStrategy(false);
                                  
                                  const baseQuestions = [
                                    {
                                      q: "What is the condition for multiplying two matrices A and B?",
                                      type: "Multiple Choice",
                                      lo: "Understand Matrix Dimensions",
                                      bloom: "Knowledge",
                                      options: [
                                        { text: "Columns of A = Rows of B", correct: true },
                                        { text: "Rows of A = Columns of B", correct: false },
                                        { text: "Both must be square matrices", correct: false }
                                      ]
                                    },
                                    {
                                      q: "If Matrix A is 3x2 and Matrix B is 2x4, what are the dimensions of the product AB?",
                                      type: "Multiple Choice",
                                      lo: "Apply Multiplication Rules",
                                      bloom: "Application",
                                      options: [
                                        { text: "3x4", correct: true },
                                        { text: "2x2", correct: false },
                                        { text: "4x3", correct: false }
                                      ]
                                    },
                                    {
                                      q: "Matrix multiplication is always commutative (AB = BA).",
                                      type: "True/False",
                                      lo: "Understand Matrix Dimensions",
                                      bloom: "Knowledge",
                                      options: [
                                        { text: "True", correct: false },
                                        { text: "False", correct: true }
                                      ]
                                    },
                                    {
                                      q: "Explain why the distributive property A(B + C) = AB + AC holds true for matrices.",
                                      type: "Short Answer",
                                      lo: "Apply Multiplication Rules",
                                      bloom: "Analysis",
                                      options: []
                                    },
                                    {
                                      q: "Given A = [[1, 2], [3, 4]] and B = [[2, 0], [1, 2]], calculate AB.",
                                      type: "Short Answer",
                                      lo: "Apply Multiplication Rules",
                                      bloom: "Application",
                                      options: []
                                    },
                                    {
                                      q: "Find the inverse of the matrix [[2, 1], [1, 1]].",
                                      type: "Short Answer",
                                      lo: "Invert Matrices",
                                      bloom: "Application",
                                      options: []
                                    },
                                    {
                                      q: "Calculate the determinant of a 3x3 identity matrix.",
                                      type: "Multiple Choice",
                                      lo: "Calculate Determinants",
                                      bloom: "Knowledge",
                                      options: [
                                        { text: "1", correct: true },
                                        { text: "0", correct: false },
                                        { text: "3", correct: false }
                                      ]
                                    }
                                  ];

                                  const newQuestions = Array.from({ length: questionCount }).map((_, i) => {
                                    const base = baseQuestions[i % baseQuestions.length];
                                    return {
                                      ...base,
                                      id: `gen-${i + 1}`,
                                      q: i >= baseQuestions.length ? `${base.q} (Variation ${Math.floor(i / baseQuestions.length) + 1})` : base.q
                                    };
                                  });

                                  setGeneratedQuestions(newQuestions);
                                  setHasGeneratedQuiz(true);
                                }, 2000);
                              }}
                              disabled={isGeneratingStrategy}
                              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                            >
                              {isGeneratingStrategy ? (
                                <>
                                  <Sparkles size={20} className="animate-pulse" />
                                  Analyzing Unit Content & Generating...
                                </>
                              ) : (
                                <>
                                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-1000 -skew-x-12 -translate-x-full"></div>
                                  <Sparkles size={20} />
                                  ✨ Execute AI Strategy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-6">
                          {[
                            { title: "Weekly Review Quiz", desc: "Covers standard concepts from 1.1 to 1.3.", diff: "Intermediate", time: "15m", questions: 10 },
                            { title: "Deep Dive Assessment", desc: "Focuses heavily on Analysis and Synthesis.", diff: "Advanced", time: "30m", questions: 15 },
                            { title: "Quick Recap", desc: "Basic knowledge recall for all lessons.", diff: "Basic", time: "10m", questions: 5 }
                          ].map((quiz, i) => (
                            <div 
                              key={i} 
                              onClick={() => {
                                setIsGeneratingStrategy(true);
                                setTimeout(() => {
                                  setIsGeneratingStrategy(false);
                                  setGeneratedQuestions([
                                    {
                                      id: 'gen-1',
                                      q: "What is the condition for multiplying two matrices A and B?",
                                      type: "Multiple Choice",
                                      lo: "Understand Matrix Dimensions",
                                      bloom: "Knowledge",
                                      options: [
                                        { text: "Columns of A = Rows of B", correct: true },
                                        { text: "Rows of A = Columns of B", correct: false },
                                        { text: "Both must be square matrices", correct: false }
                                      ]
                                    },
                                    {
                                      id: 'gen-2',
                                      q: "If Matrix A is 3x2 and Matrix B is 2x4, what are the dimensions of the product AB?",
                                      type: "Multiple Choice",
                                      lo: "Apply Multiplication Rules",
                                      bloom: "Application",
                                      options: [
                                        { text: "3x4", correct: true },
                                        { text: "2x2", correct: false },
                                        { text: "4x3", correct: false }
                                      ]
                                    }
                                  ]);
                                  setHasGeneratedQuiz(true);
                                }, 1500);
                              }}
                              className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-100 transition-all cursor-pointer group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Sparkles size={20} />
                              </div>
                              <h4 className="font-bold text-slate-800 mb-2">{quiz.title}</h4>
                              <p className="text-sm text-slate-500 mb-4">{quiz.desc}</p>
                              <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                                <span className="flex items-center gap-1"><Scale size={14} /> {quiz.diff}</span>
                                <span className="flex items-center gap-1"><Clock size={14} /> {quiz.time}</span>
                                <span className="flex items-center gap-1"><CheckCircle2 size={14} /> {quiz.questions} Qs</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Magic Glow Overlay during generation */}
                      <AnimatePresence>
                        {isGeneratingStrategy && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
                          >
                            <div className="relative w-24 h-24 flex items-center justify-center">
                              <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                              <div className="absolute inset-2 bg-purple-500 rounded-full animate-ping opacity-20" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-200 z-10">
                                <Sparkles size={24} className="animate-pulse" />
                              </div>
                            </div>
                            <p className="mt-6 font-bold text-indigo-900 animate-pulse">Faheem is architecting your quiz...</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-y-auto p-8 relative">
                      {/* LO Coverage Summary */}
                      <div className="mb-8 bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-indigo-500" />
                            Learning Outcomes Coverage
                          </h4>
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-lg">
                            {Math.round((new Set(generatedQuestions.map(q => q.lo)).size / 4) * 100)}% Covered
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-2 bg-indigo-100 rounded-full mb-4 overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                            style={{ width: `${Math.round((new Set(generatedQuestions.map(q => q.lo)).size / 4) * 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {[
                            "Understand Matrix Dimensions",
                            "Apply Multiplication Rules",
                            "Invert Matrices",
                            "Calculate Determinants"
                          ].map(lo => {
                            const isCovered = new Set(generatedQuestions.map(q => q.lo)).has(lo);
                            return (
                              <div 
                                key={lo} 
                                className={`px-3 py-1.5 bg-white rounded-lg border ${isCovered ? 'border-indigo-200 text-indigo-700' : 'border-slate-200 text-slate-500 opacity-60'} text-xs font-bold flex items-center gap-2 shadow-sm`}
                              >
                                <div className={`w-2 h-2 rounded-full ${isCovered ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                {lo} {!isCovered && '(Missing)'}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Questions List */}
                      <div className="space-y-6">
                        {generatedQuestions.map((item, i) => (
                          <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 relative group hover:border-indigo-300 hover:shadow-md transition-all">
                            
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">Q{i+1} • {item.type}</span>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                                  🎯 {item.lo}
                                </span>
                                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                                  🧠 {item.bloom}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => setGeneratedQuestions(generatedQuestions.filter(q => q.id !== item.id))}
                                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            
                            <p className="w-full text-lg font-bold text-slate-800 mb-4">{item.q}</p>
                            
                            {item.options.length > 0 && (
                              <div className="space-y-2">
                                {item.options.map((opt: any, j: number) => (
                                  <div key={j} className={`flex items-center gap-3 p-3 rounded-xl border ${opt.correct ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${opt.correct ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}>
                                      <CheckCircle2 size={12} />
                                    </div>
                                    <span className={`flex-1 text-sm ${opt.correct ? 'text-emerald-900 font-medium' : 'text-slate-600'}`}>
                                      {opt.text}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {item.options.length === 0 && (
                              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 text-slate-400 text-sm italic">
                                Students will provide a text-based response here.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-slate-200/50 bg-white/50 flex justify-end gap-4 items-center">
                  <button onClick={() => setIsAIDraftRoomOpen(false)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">
                    Discard Draft
                  </button>
                  <button 
                    onClick={() => {
                      setIsAIDraftRoomOpen(false);
                      setHasGeneratedQuiz(false); // Reset for next time
                      
                      // Map generated questions to the main builder format
                      const newQuestions: Question[] = generatedQuestions.map((gq, idx) => ({
                        id: `gen-imported-${Date.now()}-${idx}`,
                        type: gq.type === 'Multiple Choice' ? 'multiple_choice' : gq.type === 'True/False' ? 'true_false' : 'short_answer',
                        text: gq.q,
                        points: 10,
                        options: gq.options.map((opt: any, oIdx: number) => ({
                          id: `opt-${Date.now()}-${oIdx}`,
                          text: opt.text,
                          isCorrect: opt.correct
                        }))
                      }));
                      
                      setQuestions([...questions, ...newQuestions]);
                    }}
                    disabled={!hasGeneratedQuiz}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${
                      hasGeneratedQuiz 
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:-translate-y-0.5' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles size={18} />
                    ✨ Import to Quiz Builder
                  </button>
                </div>
              </motion.div>
            </>
          )}

          {isBankDrawerOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBankDrawerOpen(false)}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
              />
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                className="fixed top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-[110] flex flex-col border-l border-slate-100"
              >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Book size={20} className="text-indigo-600" /> Question Bank
                  </h3>
                  <button onClick={() => setIsBankDrawerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 border-b border-slate-50">
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search questions..." className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-start gap-4 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                      <div className="w-5 h-5 rounded border-2 border-slate-200 flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                        <Check size={12} className="text-transparent group-hover:text-indigo-500" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Unit 1 • Matrices</span>
                        <p className="text-sm font-medium text-slate-700 mt-1">Define the identity matrix and its properties.</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-slate-100">
                  <button className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-all">
                    Add Selected Questions
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </FloatingPortal>

      {/* Toasts */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div 
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-800 text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl flex items-center gap-3"
            >
              <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                <Check size={12} />
              </div>
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function AssessmentBuilderPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center text-slate-400">Loading...</div>}>
      <AssessmentBuilderContent />
    </Suspense>
  );
}
