'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, CheckCircle, BarChart3, ArrowUpRight, Settings, Zap, PenTool, Eye,
  PlayCircle, FileText, Check, Upload, UploadCloud, Clock, AlertCircle, ShieldAlert, ArrowLeft,
  Save, Plus, X, BrainCircuit, Trash2, Edit
} from 'lucide-react';
import {
  getAssignments, getQuizzes, getSubmissionsForAssignment, getMySubmission,
  submitAssignment, gradeSubmission, getSubmissionFileUrl, deleteAssignment, getClassRoster,
  startOrGetQuizAttempt, saveQuizAnswer, submitQuizAttempt, getMyQuizAttempt, getQuizAttemptsForQuiz, gradeQuizManualQuestion,
  Assignment, AssignmentSubmission, Quiz, QuizAttempt,
} from '@/services/assignmentData';
import { syncGradeToGradebook } from '@/services/gradebookSync';

interface AssessmentsTabProps {
  role?: 'teacher' | 'parent' | 'student' | 'qb_supervisor';
  teacherId?: string;
  studentId?: string;
  classId?: string;
  subject?: string;
  grade?: string;
}

export function AssessmentsTab({ role = 'teacher', teacherId, studentId, classId, subject, grade }: AssessmentsTabProps) {
  const router = useRouter();
  const scope = teacherId && classId && subject ? { teacherId, classId, subject } : null;
  const studentScope = studentId && classId && subject ? { studentId, classId, subject } : null;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, { submitted: number; graded: number; total: number }>>({});
  const [classRosterCount, setClassRosterCount] = useState(0);
  const [quizAttemptCounts, setQuizAttemptCounts] = useState<Record<string, { submitted: number; needsReview: number }>>({});
  const [activeQuizForGrading, setActiveQuizForGrading] = useState<Quiz | null>(null);
  const [quizGradingAttempts, setQuizGradingAttempts] = useState<(QuizAttempt & { studentName: string })[]>([]);
  const [activeQuizAttemptForGrading, setActiveQuizAttemptForGrading] = useState<(QuizAttempt & { studentName: string }) | null>(null);
  const [manualReviewScores, setManualReviewScores] = useState<Record<string, string>>({});
  const [isSavingQuizGrade, setIsSavingQuizGrade] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [view, setView] = useState<'list' | 'grading-list' | 'grading-student' | 'intro' | 'submit' | 'success' | 'quiz-intro' | 'quiz-taking' | 'quiz-result' | 'quiz-grading-list' | 'quiz-grading-student'>('list');
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [gradingSubmissions, setGradingSubmissions] = useState<AssignmentSubmission[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<AssignmentSubmission | null>(null);
  const [mySubmission, setMySubmission] = useState<AssignmentSubmission | null>(null);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [myQuizAttempt, setMyQuizAttempt] = useState<QuizAttempt | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, any>>({});
  const [quizQIndex, setQuizQIndex] = useState(0);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; needsManualReview: boolean } | null>(null);

  const refreshList = () => {
    if (!scope && !studentScope) return;
    setIsLoading(true);
    const fetchScope = scope || { teacherId: '', classId: classId!, subject: subject! };
    Promise.all([getAssignments(fetchScope), getQuizzes(fetchScope)]).then(async ([items, quizItems]) => {
      setAssignments(items);
      setQuizzes(quizItems);
      if (scope) {
        const counts: Record<string, { submitted: number; graded: number; total: number }> = {};
        for (const a of items) {
          const subs = await getSubmissionsForAssignment(a.id, scope.classId);
          counts[a.id] = {
            submitted: subs.filter(s => s.status !== 'Pending').length,
            graded: subs.filter(s => s.status === 'Graded').length,
            total: subs.length,
          };
        }
        setSubmissionCounts(counts);
        const classRoster = await getClassRoster(scope.classId);
        setClassRosterCount(classRoster.length);
        const qCounts: Record<string, { submitted: number; needsReview: number }> = {};
        for (const q of quizItems) {
          const attempts = await getQuizAttemptsForQuiz(q.id, scope.classId);
          qCounts[q.id] = {
            submitted: attempts.filter(a => a.status !== 'in_progress').length,
            needsReview: attempts.filter(a => a.needsManualReview && a.status !== 'graded').length,
          };
        }
        setQuizAttemptCounts(qCounts);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    refreshList();
  }, [scope?.classId, scope?.subject, studentScope?.classId, studentScope?.subject]);

  // ============ Teacher: Grading ============
  const handleDeleteItem = async (id: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    const { ok, error } = await deleteAssignment(id);
    if (ok) refreshList();
    else alert(`Error deleting: ${error}`);
  };

  const handleEditItem = (id: string, type: 'quiz' | 'assignment', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const from = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search) : '';
    router.push(`/assessment-builder?id=${id}&type=${type}&classId=${classId || ''}&subject=${encodeURIComponent(subject || '')}&grade=${encodeURIComponent(grade || '')}&from=${from}`);
  };

  const openGradingList = async (assignment: Assignment) => {
    if (!scope) return;
    setActiveAssignment(assignment);
    const subs = await getSubmissionsForAssignment(assignment.id, scope.classId);
    setGradingSubmissions(subs);
    setView('grading-list');
  };

  const openQuizGradingList = async (quiz: Quiz) => {
    if (!scope) return;
    setActiveQuizForGrading(quiz);
    const attempts = await getQuizAttemptsForQuiz(quiz.id, scope.classId);
    setQuizGradingAttempts(attempts);
    setView('quiz-grading-list');
  };

  const openQuizAttemptGrading = (attempt: QuizAttempt & { studentName: string }) => {
    setActiveQuizAttemptForGrading(attempt);
    setManualReviewScores({});
    setView('quiz-grading-student');
  };

  const handleSaveQuizManualGrade = async () => {
    if (!activeQuizForGrading || !activeQuizAttemptForGrading || !scope) return;
    setIsSavingQuizGrade(true);
    const extraScore = Object.values(manualReviewScores).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    const { ok, error } = await gradeQuizManualQuestion(activeQuizAttemptForGrading.id, extraScore);
    if (ok) {
      const finalScore = (activeQuizAttemptForGrading.score || 0) + extraScore;
      if (subject && grade) {
        syncGradeToGradebook({
          subject,
          grade,
          title: activeQuizForGrading.title,
          category: activeQuizForGrading.settings?.category || 'Uncategorized',
          maxScore: activeQuizAttemptForGrading.maxScore || 0,
          sourceType: 'quiz',
          sourceId: activeQuizForGrading.id,
          studentId: activeQuizAttemptForGrading.studentId,
          score: finalScore,
          status: 'Graded',
        });
      }
      const attempts = await getQuizAttemptsForQuiz(activeQuizForGrading.id, scope.classId);
      setQuizGradingAttempts(attempts);
      setView('quiz-grading-list');
    } else {
      alert(`Error saving grade: ${error}`);
    }
    setIsSavingQuizGrade(false);
  };

  const [gradeInput, setGradeInput] = useState('');
  const [selectedRubricLevels, setSelectedRubricLevels] = useState<Record<string, string>>({});
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  const openGradeStudent = (sub: AssignmentSubmission) => {
    setActiveSubmission(sub);
    setGradeInput(sub.grade !== null ? String(sub.grade) : '');
    setFeedbackInput(sub.feedback || '');
    setSelectedRubricLevels({});
    setView('grading-student');
  };

  const handleSaveGrade = async () => {
    if (!activeAssignment || !activeSubmission) return;
    setIsSavingGrade(true);
    const gradeValue = parseFloat(gradeInput) || 0;
    const { ok, error } = await gradeSubmission(activeAssignment.id, activeSubmission.studentId, { grade: gradeValue, feedback: feedbackInput });
    if (ok && subject && grade) {
      syncGradeToGradebook({
        subject,
        grade,
        title: activeAssignment.title,
        category: activeAssignment.settings?.category || 'Uncategorized',
        maxScore: activeAssignment.settings?.maxScore || 100,
        sourceType: 'assignment',
        sourceId: activeAssignment.id,
        studentId: activeSubmission.studentId,
        score: gradeValue,
        status: 'Graded',
      });
    }
    setIsSavingGrade(false);
    if (ok) {
      const subs = await getSubmissionsForAssignment(activeAssignment.id, scope!.classId);
      setGradingSubmissions(subs);
      setView('grading-list');
    } else {
      alert(`Error saving grade: ${error}`);
    }
  };

  // ============ Student: view + submit ============
  const openAssignmentIntro = async (assignment: Assignment) => {
    setActiveAssignment(assignment);
    if (studentId) {
      const sub = await getMySubmission(assignment.id, studentId);
      setMySubmission(sub);
    }
    setView('intro');
  };

  const openQuizIntro = async (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setQuizResult(null);
    if (studentId) {
      const attempt = await getMyQuizAttempt(quiz.id, studentId);
      setMyQuizAttempt(attempt);
    }
    setView('quiz-intro');
  };

  const handleStartQuiz = async () => {
    if (!activeQuiz || !studentId) return;
    const attempt = await startOrGetQuizAttempt(activeQuiz.id, studentId);
    if (attempt) {
      setMyQuizAttempt(attempt);
      setQuizAnswers(attempt.answers || {});
      setQuizQIndex(0);
      setView('quiz-taking');
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answer }));
    if (myQuizAttempt) saveQuizAnswer(myQuizAttempt.id, questionId, answer);
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !myQuizAttempt || !studentId) return;
    setIsSubmittingQuiz(true);
    const result = await submitQuizAttempt(myQuizAttempt.id, activeQuiz);
    if (result.ok && !result.needsManualReview && subject && grade) {
      syncGradeToGradebook({
        subject,
        grade,
        title: activeQuiz.title,
        category: activeQuiz.settings?.category || 'Uncategorized',
        maxScore: result.maxScore,
        sourceType: 'quiz',
        sourceId: activeQuiz.id,
        studentId,
        score: result.score,
        status: 'Graded',
      });
    }
    setIsSubmittingQuiz(false);
    if (result.ok) {
      setQuizResult(result);
      setView('quiz-result');
    } else {
      alert(`Error submitting quiz: ${result.error}`);
    }
  };

  const [submitText, setSubmitText] = useState('');
  const [submitFile, setSubmitFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAssignment = async () => {
    if (!activeAssignment || !studentId) return;
    setIsSubmitting(true);
    const { ok, error } = await submitAssignment({ assessmentId: activeAssignment.id, studentId, file: submitFile, textContent: submitText });
    setIsSubmitting(false);
    if (ok) {
      setView('success');
      setSubmitText('');
      setSubmitFile(null);
    } else {
      alert(`Error submitting: ${error}`);
    }
  };

  // ================= TEACHER VIEWS =================
  const renderTeacherFlow = () => {
    if (view === 'quiz-grading-student' && activeQuizForGrading && activeQuizAttemptForGrading) {
      const manualQuestions = (activeQuizForGrading.questions || []).filter((q: any) => q.type === 'short_answer' || q.type === 'file_upload');
      return (
        <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6 w-full">
          <button onClick={() => setView('quiz-grading-list')} className="w-fit text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{activeQuizForGrading.title}</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Reviewing: <span className="font-bold text-slate-700">{activeQuizAttemptForGrading.studentName}</span></p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <p className="text-sm font-bold text-slate-500 mb-4">Auto-graded score so far: <span className="text-emerald-600">{activeQuizAttemptForGrading.score}/{activeQuizAttemptForGrading.maxScore}</span> (multiple choice / true-false)</p>
          </div>
          {manualQuestions.map((q: any) => (
            <div key={q.id} className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="flex justify-between items-start mb-3">
                <p className="font-bold text-slate-800 flex-1">{q.text}</p>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full shrink-0">{q.points} pts max</span>
              </div>
              {q.type === 'short_answer' ? (
                <p className="text-slate-600 bg-slate-50 rounded-xl p-4 mb-4">{activeQuizAttemptForGrading.answers[q.id] || '(No answer)'}</p>
              ) : (
                <p className="text-slate-500 bg-slate-50 rounded-xl p-4 mb-4">{activeQuizAttemptForGrading.answers[q.id]?.name || '(No file uploaded)'}</p>
              )}
              <label className="block text-xs font-bold text-slate-500 mb-1.5">Award points (out of {q.points})</label>
              <input
                type="number"
                max={q.points}
                value={manualReviewScores[q.id] || ''}
                onChange={(e) => setManualReviewScores((prev) => ({ ...prev, [q.id]: e.target.value }))}
                className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          ))}
          <button onClick={handleSaveQuizManualGrade} disabled={isSavingQuizGrade} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold transition-all shadow-sm">
            {isSavingQuizGrade ? 'Saving...' : 'Save Final Grade'}
          </button>
        </div>
      );
    }

    if (view === 'quiz-grading-list' && activeQuizForGrading) {
      return (
        <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6 w-full">
          <button onClick={() => setView('list')} className="w-fit text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{activeQuizForGrading.title}</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">{quizGradingAttempts.length} students</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {quizGradingAttempts.map((a) => (
              <button
                key={a.studentId}
                onClick={() => a.status !== 'in_progress' && openQuizAttemptGrading(a)}
                disabled={a.status === 'in_progress'}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left disabled:cursor-not-allowed disabled:hover:bg-transparent"
              >
                <div>
                  <p className="font-bold text-slate-800 text-sm">{a.studentName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{a.status === 'in_progress' ? 'Not attempted yet' : a.submittedAt ? new Date(a.submittedAt).toLocaleString() : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  {a.score !== null && <span className="text-sm font-bold text-emerald-600">{a.score}/{a.maxScore}</span>}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    a.status === 'graded' ? 'bg-emerald-100 text-emerald-700' :
                    a.needsManualReview ? 'bg-rose-100 text-rose-600' :
                    a.status === 'in_progress' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-700'
                  }`}>{a.status === 'in_progress' ? 'Not Started' : a.needsManualReview ? 'Needs Review' : a.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (view === 'grading-student' && activeAssignment && activeSubmission) {
      return (
        <div className="p-8 max-w-6xl mx-auto flex gap-8 w-full h-full">
          <div className="flex-1 flex flex-col gap-6">
            <button onClick={() => setView('grading-list')} className="w-fit text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{activeAssignment.title}</h2>
                  <p className="text-slate-500 font-medium mt-1">Submission by: <span className="font-bold text-slate-700">{activeSubmission.studentName}</span></p>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${activeSubmission.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{activeSubmission.status}</span>
              </div>
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6">
                {activeSubmission.textContent && (
                  <div>
                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-2">Written Response</h3>
                    <p className="text-slate-600 leading-relaxed text-base whitespace-pre-wrap">{activeSubmission.textContent}</p>
                  </div>
                )}
                {activeSubmission.storagePath && (
                  <div>
                    <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-2">Attached File</h3>
                    <a href={getSubmissionFileUrl(activeSubmission.storagePath)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-600 hover:bg-slate-100">
                      <FileText size={16} /> {activeSubmission.fileName || 'View File'}
                    </a>
                  </div>
                )}
                {!activeSubmission.textContent && !activeSubmission.storagePath && (
                  <p className="text-slate-400 text-sm">{role === 'teacher' ? 'No submission yet.' : ''}</p>
                )}
              </div>
            </div>
          </div>
          <div className="w-[350px] shrink-0 flex flex-col gap-6 mt-11">
            {activeAssignment.rubric && activeAssignment.rubric.length > 0 && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={18} className="text-indigo-500"/> Rubric</h3>
                <div className="space-y-4">
                  {activeAssignment.rubric.map((crit: any) => (
                    <div key={crit.id}>
                      <p className="text-sm font-bold text-slate-700 mb-2">{crit.title} <span className="text-xs text-slate-400">({crit.weight} pts)</span></p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {crit.levels.map((lvl: any) => (
                          <button
                            key={lvl.id}
                            onClick={() => {
                              const next: Record<string, string> = { ...selectedRubricLevels, [crit.id]: lvl.id };
                              setSelectedRubricLevels(next);
                              const total = activeAssignment.rubric.reduce((sum: number, c: any) => {
                                const selectedLvlId = next[c.id];
                                const selectedLvl = c.levels.find((l: any) => l.id === selectedLvlId);
                                return sum + (selectedLvl ? selectedLvl.score : 0);
                              }, 0);
                              setGradeInput(String(total));
                            }}
                            className={`text-left px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                              selectedRubricLevels[crit.id] === lvl.id ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {lvl.title} ({lvl.score} pts)
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PenTool size={18} className="text-indigo-500"/> Grade Submission</h3>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-500 mb-2">Score (out of {activeAssignment.settings?.maxScore || 100})</label>
                <input type="number" value={gradeInput} onChange={(e) => setGradeInput(e.target.value)} className="w-full text-2xl font-black text-slate-800 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              </div>
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-500 mb-2">Feedback</label>
                <textarea rows={5} value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} className="w-full text-sm font-medium text-slate-700 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" placeholder="Enter feedback for the student..."></textarea>
              </div>
              <button onClick={handleSaveGrade} disabled={isSavingGrade} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                <Save size={18} />
                {isSavingGrade ? 'Saving...' : 'Submit Grade'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (view === 'grading-list' && activeAssignment) {
      return (
        <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6 w-full">
          <button onClick={() => setView('list')} className="w-fit text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{activeAssignment.title}</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">{gradingSubmissions.length} students</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100">
            {gradingSubmissions.map((s) => {
              const isOverdueNotSubmitted = s.status === 'Pending' && activeAssignment.dueDate && new Date(activeAssignment.dueDate) < new Date();
              return (
              <button key={s.studentId} onClick={() => s.status !== 'Pending' && openGradeStudent(s)} disabled={s.status === 'Pending'} className={`w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left disabled:cursor-not-allowed disabled:hover:bg-transparent ${isOverdueNotSubmitted ? 'bg-rose-50/50' : ''}`}>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{s.studentName}</p>
                  <p className={`text-xs mt-0.5 ${isOverdueNotSubmitted ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                    {s.status === 'Pending' ? (isOverdueNotSubmitted ? 'Overdue — did not submit' : 'Not submitted yet') : s.submittedAt ? new Date(s.submittedAt).toLocaleString() : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {s.grade !== null && <span className="text-sm font-bold text-emerald-600">{s.grade}/100</span>}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    s.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' :
                    isOverdueNotSubmitted ? 'bg-rose-100 text-rose-600' :
                    s.status === 'Pending' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-700'
                  }`}>{isOverdueNotSubmitted ? 'Overdue' : s.status}</span>
                </div>
              </button>
              );
            })}
          </div>
        </div>
      );
    }

    // List view
    const totalPending = Object.values(submissionCounts).reduce((sum, c) => sum + (c.submitted - c.graded), 0);

    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8 w-full">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Assessments Management</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Monitor student submissions and grading progress.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => {
              const from = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search) : '';
              router.push(`/assessment-builder?type=quiz&classId=${classId || ''}&subject=${encodeURIComponent(subject || '')}&grade=${encodeURIComponent(grade || '')}&from=${from}`);
            }} className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm">
              <Plus size={16} /> Add Quiz
            </button>
            <button onClick={() => {
              const from = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search) : '';
              router.push(`/assessment-builder?type=assignment&classId=${classId || ''}&subject=${encodeURIComponent(subject || '')}&grade=${encodeURIComponent(grade || '')}&from=${from}`);
            }} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm">
              <Plus size={16} /> New Assignment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Assignments</p>
              <p className="text-3xl font-black text-slate-800">{assignments.filter(a => a.status === 'Active').length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
              <Zap className="text-indigo-500" size={24} />
            </div>
          </div>
          <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Quizzes</p>
              <p className="text-3xl font-black text-slate-800">{quizzes.filter(q => q.status === 'Active').length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shadow-sm">
              <BrainCircuit className="text-purple-500" size={24} />
            </div>
          </div>
          <div className="bg-rose-50/30 backdrop-blur-2xl border border-rose-200 rounded-[2rem] p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
            <div>
              <p className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-1">Pending to Grade</p>
              <p className="text-3xl font-black text-slate-800">{totalPending}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white border border-rose-100 flex items-center justify-center shadow-sm z-10">
              <PenTool className="text-rose-500" size={24} />
            </div>
          </div>
          <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Assessments</p>
              <p className="text-3xl font-black text-slate-800">{assignments.length + quizzes.length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
              <BarChart3 className="text-emerald-500" size={24} />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/50 backdrop-blur-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-sm">
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Title</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Type</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Due Date</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Submissions</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Graded</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {isLoading ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400">Loading...</td></tr>
                ) : assignments.length === 0 && quizzes.length === 0 ? (
                  <tr><td colSpan={7} className="py-10 text-center text-slate-400">No assessments yet. Create your first one.</td></tr>
                ) : (
                  <>
                    {quizzes.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-all cursor-pointer" onClick={() => openQuizGradingList(item)}>
                        <td className="py-4 px-6">
                          <p className="font-bold text-slate-800">{item.title}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">Quiz</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-medium text-slate-500">{item.dueDate ? new Date(item.dueDate).toLocaleString() : '-'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                            item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                            item.status === 'Closed' ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700'
                          }`}>{item.status}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-bold text-slate-700">{quizAttemptCounts[item.id]?.submitted || 0}/{classRosterCount}</span>
                        </td>
                        <td className="py-4 px-6">
                          {quizAttemptCounts[item.id]?.needsReview ? (
                            <span className="text-sm font-bold text-rose-600">{quizAttemptCounts[item.id].needsReview} to review</span>
                          ) : (
                            <span className="text-sm font-bold text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <button onClick={(e) => handleEditItem(item.id, 'quiz', e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={(e) => handleDeleteItem(item.id, item.title, e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {assignments.map(item => {
                      const counts = submissionCounts[item.id] || { submitted: 0, graded: 0, total: 0 };
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-all cursor-pointer" onClick={() => openGradingList(item)}>
                          <td className="py-4 px-6">
                            <p className="font-bold text-slate-800">{item.title}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">Assignment</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-medium text-slate-500">{item.dueDate ? new Date(item.dueDate).toLocaleString() : '-'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                              item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                              item.status === 'Closed' ? 'bg-slate-100 text-slate-600' : 'bg-orange-100 text-orange-700'
                            }`}>{item.status}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-bold text-slate-700">{counts.submitted}/{counts.total}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-bold text-slate-700">{counts.graded}/{counts.submitted}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button onClick={(e) => { e.stopPropagation(); openGradingList(item); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Open">
                                <Eye size={16} />
                              </button>
                              <button onClick={(e) => handleEditItem(item.id, 'assignment', e)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit">
                                <Edit size={16} />
                              </button>
                              <button onClick={(e) => handleDeleteItem(item.id, item.title, e)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ================= STUDENT VIEWS =================
  const renderStudentFlow = () => {
    if (view === 'quiz-result' && activeQuiz && quizResult) {
      return (
        <div className="p-8 max-w-xl mx-auto flex items-center justify-center h-full w-full min-h-[600px]">
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm text-center w-full flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8">
              <CheckCircle size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3">Quiz Submitted!</h2>
            {quizResult.needsManualReview ? (
              <p className="text-slate-500 font-medium mb-6 text-lg">Some of your answers need your teacher's review before a final grade is ready.</p>
            ) : (
              <p className="text-5xl font-black text-emerald-600 mb-2">{quizResult.score}/{quizResult.maxScore}</p>
            )}
            <button onClick={() => { setActiveQuiz(null); setQuizResult(null); setView('list'); refreshList(); }} className="w-full py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-bold text-lg transition-all mt-4">
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    if (view === 'quiz-taking' && activeQuiz) {
      const oneAtATime = !!activeQuiz.settings?.oneAtATime;
      const questionsList = activeQuiz.questions || [];
      const questionsToShow = oneAtATime ? (questionsList[quizQIndex] ? [questionsList[quizQIndex]] : []) : questionsList;
      return (
        <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6 w-full">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">{activeQuiz.title}</h2>
            {oneAtATime && <span className="text-sm font-bold text-indigo-600">Question {quizQIndex + 1} of {questionsList.length}</span>}
          </div>
          {questionsToShow.map((q: any) => (
            <div key={q.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <p className="font-bold text-slate-800 flex-1">{q.text}</p>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full shrink-0">{q.points} pts</span>
              </div>
              {q.imageUrl && <img src={q.imageUrl} alt="" className="max-h-48 rounded-xl border border-slate-200 mb-4" />}
              {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                <div className="space-y-2">
                  {(q.options || []).map((opt: any) => (
                    <label key={opt.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${quizAnswers[q.id] === opt.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" checked={quizAnswers[q.id] === opt.id} onChange={() => handleAnswerChange(q.id, opt.id)} />
                      <span className="text-sm text-slate-700">{opt.text}</span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === 'short_answer' && (
                <textarea rows={3} value={quizAnswers[q.id] || ''} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full border border-slate-200 rounded-xl p-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Type your answer..." />
              )}
              {q.type === 'file_upload' && (
                <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex items-center gap-3 text-slate-400 hover:bg-slate-50 cursor-pointer block">
                  <UploadCloud size={20} /> {quizAnswers[q.id]?.name || 'Click to upload a file'}
                  <input type="file" className="hidden" onChange={(e) => handleAnswerChange(q.id, e.target.files?.[0] ? { name: e.target.files[0].name } : null)} />
                </label>
              )}
            </div>
          ))}
          {oneAtATime ? (
            <div className="flex justify-between gap-3">
              <button disabled={quizQIndex === 0} onClick={() => setQuizQIndex((i) => Math.max(0, i - 1))} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold disabled:opacity-40 hover:bg-slate-50 transition-all">
                Previous
              </button>
              {quizQIndex < questionsList.length - 1 ? (
                <button onClick={() => setQuizQIndex((i) => Math.min(questionsList.length - 1, i + 1))} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                  Next
                </button>
              ) : (
                <button onClick={handleSubmitQuiz} disabled={isSubmittingQuiz} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-60 transition-all">
                  {isSubmittingQuiz ? 'Submitting...' : 'Submit Quiz'}
                </button>
              )}
            </div>
          ) : (
            <button onClick={handleSubmitQuiz} disabled={isSubmittingQuiz} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold text-lg transition-all shadow-md">
              {isSubmittingQuiz ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>
      );
    }

    if (view === 'quiz-intro' && activeQuiz) {
      const alreadyDone = myQuizAttempt && myQuizAttempt.status !== 'in_progress';
      return (
        <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6 w-full">
          <button onClick={() => setView('list')} className="w-fit text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeQuiz.title}</h2>
            <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 font-medium flex-wrap">
              {activeQuiz.dueDate && <span className="flex items-center gap-1"><AlertCircle size={16}/> Due: {new Date(activeQuiz.dueDate).toLocaleString()}</span>}
              <span>{(activeQuiz.questions || []).length} questions</span>
              <span>{activeQuiz.settings?.maxScore || 0} pts</span>
            </div>

            {alreadyDone ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <p className="font-bold text-slate-800 mb-1">{myQuizAttempt?.status === 'graded' ? 'Your quiz has been graded' : 'Submitted — awaiting review'}</p>
                {myQuizAttempt?.status === 'graded' && <p className="text-2xl font-black text-emerald-600 mb-2">{myQuizAttempt.score}/{myQuizAttempt.maxScore}</p>}
              </div>
            ) : (
              <button onClick={handleStartQuiz} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-md flex items-center justify-center gap-2">
                <Check size={20} /> {myQuizAttempt ? 'Continue Quiz' : 'Start Quiz'}
              </button>
            )}
          </div>
        </div>
      );
    }

    if (view === 'success') {
      return (
        <div className="p-8 max-w-xl mx-auto flex items-center justify-center h-full w-full min-h-[600px]">
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 shadow-sm text-center w-full flex flex-col items-center">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8">
              <CheckCircle size={48} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-3">Submission Received!</h2>
            <p className="text-slate-500 font-medium mb-10 text-lg">Your work has been successfully submitted and is pending review.</p>
            <button onClick={() => { setActiveAssignment(null); setView('list'); refreshList(); }} className="w-full py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-bold text-lg transition-all">
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    if (view === 'submit' && activeAssignment) {
      return (
        <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6 w-full">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-slate-800">{activeAssignment.title}</h2>
            <button onClick={() => setView('intro')} className="text-sm font-bold text-slate-400 hover:text-slate-600">Close</button>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-8">
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-3">Written Response</h3>
              <textarea rows={6} value={submitText} onChange={(e) => setSubmitText(e.target.value)} className="w-full border border-slate-200 rounded-2xl p-5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 placeholder:text-slate-400 resize-none transition-all" placeholder="Type your answer or paste your links here..."></textarea>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-3">File Upload</h3>
              <label className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer block">
                <Upload size={36} className="mb-4 text-slate-400" />
                <p className="font-bold text-slate-600">{submitFile ? submitFile.name : 'Drag & drop files here'}</p>
                <p className="text-sm mt-1">or click to browse from your computer</p>
                <input type="file" className="hidden" onChange={(e) => setSubmitFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button onClick={handleSubmitAssignment} disabled={isSubmitting || (!submitText.trim() && !submitFile)} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold transition-all shadow-sm">
                {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (view === 'intro' && activeAssignment) {
      return (
        <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6 w-full">
          <button onClick={() => setView('list')} className="w-fit text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeAssignment.title}</h2>
            {activeAssignment.dueDate && (
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 font-medium">
                <span className="flex items-center gap-1"><AlertCircle size={16}/> Due: {new Date(activeAssignment.dueDate).toLocaleString()}</span>
              </div>
            )}
            <div className="mb-10">
              <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-2">Instructions</h3>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap">{activeAssignment.instructions || 'No instructions provided.'}</p>
            </div>

            {mySubmission && mySubmission.status !== 'Pending' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <p className="font-bold text-slate-800 mb-1">{mySubmission.status === 'Graded' ? 'Your submission has been graded' : 'Already submitted'}</p>
                {mySubmission.grade !== null && <p className="text-2xl font-black text-emerald-600 mb-2">{mySubmission.grade}/100</p>}
                {mySubmission.feedback && <p className="text-sm text-slate-600">{mySubmission.feedback}</p>}
              </div>
            ) : (
              <button onClick={() => setView('submit')} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-md flex items-center justify-center gap-2">
                <Check size={20} /> Begin Assignment
              </button>
            )}
          </div>
        </div>
      );
    }

    // List view
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8 w-full">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Your Assessments</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Complete your pending quizzes and assignments.</p>
          </div>
          {role === 'parent' && (
            <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full border border-indigo-100">
              <ShieldAlert size={14} /> Parent View - Read Only
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <p className="text-slate-400 col-span-2 text-center py-10">Loading...</p>
          ) : assignments.length === 0 && quizzes.length === 0 ? (
            <p className="text-slate-400 col-span-2 text-center py-10">No assessments yet.</p>
          ) : (
            <>
              {quizzes.map(item => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-purple-100 text-purple-700">Quiz</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">{item.title}</h3>
                    {item.dueDate && (
                      <p className="text-xs font-medium text-red-500 flex items-center gap-1 mb-4">
                        <AlertCircle size={14} /> Due: {new Date(item.dueDate).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => openQuizIntro(item)}
                    disabled={role === 'parent'}
                    className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4
                      ${role === 'parent' ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50 pointer-events-none' : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'}`}
                  >
                    <FileText size={18} /> Open
                  </button>
                </div>
              ))}
              {assignments.map(item => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-blue-100 text-blue-700">Assignment</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{item.title}</h3>
                {item.dueDate && (
                  <p className="text-xs font-medium text-red-500 flex items-center gap-1 mb-4">
                    <AlertCircle size={14} /> Due: {new Date(item.dueDate).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => openAssignmentIntro(item)}
                disabled={role === 'parent'}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4
                  ${role === 'parent' ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50 pointer-events-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'}`}
              >
                <FileText size={18} /> Open
              </button>
            </div>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  return role === 'teacher' ? renderTeacherFlow() : renderStudentFlow();
}
