'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, CheckCircle, BarChart3, ArrowUpRight, Settings, Zap, PenTool, Eye,
  PlayCircle, FileText, Check, Upload, Clock, AlertCircle, ShieldAlert, ArrowLeft,
  Save, Plus, X
} from 'lucide-react';
import {
  getAssignments, createAssignment, getSubmissionsForAssignment, getMySubmission,
  submitAssignment, gradeSubmission, getSubmissionFileUrl,
  Assignment, AssignmentSubmission,
} from '@/services/assignmentData';

interface AssessmentsTabProps {
  role?: 'teacher' | 'parent' | 'student';
  teacherId?: string;
  studentId?: string;
  classId?: string;
  subject?: string;
}

export function AssessmentsTab({ role = 'teacher', teacherId, studentId, classId, subject }: AssessmentsTabProps) {
  const scope = teacherId && classId && subject ? { teacherId, classId, subject } : null;
  const studentScope = studentId && classId && subject ? { studentId, classId, subject } : null;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, { submitted: number; graded: number; total: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [view, setView] = useState<'list' | 'create' | 'grading-list' | 'grading-student' | 'intro' | 'submit' | 'success'>('list');
  const [activeAssignment, setActiveAssignment] = useState<Assignment | null>(null);
  const [gradingSubmissions, setGradingSubmissions] = useState<AssignmentSubmission[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<AssignmentSubmission | null>(null);
  const [mySubmission, setMySubmission] = useState<AssignmentSubmission | null>(null);

  const refreshList = () => {
    if (!scope && !studentScope) return;
    setIsLoading(true);
    const fetchScope = scope || { teacherId: '', classId: classId!, subject: subject! };
    getAssignments(fetchScope).then(async (items) => {
      setAssignments(items);
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
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    refreshList();
  }, [scope?.classId, scope?.subject, studentScope?.classId, studentScope?.subject]);

  // ============ Teacher: Create Assignment ============
  const [newTitle, setNewTitle] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleCreateAssignment = async () => {
    if (!scope || !newTitle.trim()) return;
    setIsSavingNew(true);
    setCreateError('');
    const { id, error } = await createAssignment(scope, { title: newTitle.trim(), instructions: newInstructions, dueDate: newDueDate || null });
    setIsSavingNew(false);
    if (id) {
      refreshList();
      setView('list');
      setNewTitle('');
      setNewInstructions('');
      setNewDueDate('');
    } else {
      setCreateError(error || 'Unknown error');
    }
  };

  // ============ Teacher: Grading ============
  const openGradingList = async (assignment: Assignment) => {
    if (!scope) return;
    setActiveAssignment(assignment);
    const subs = await getSubmissionsForAssignment(assignment.id, scope.classId);
    setGradingSubmissions(subs);
    setView('grading-list');
  };

  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  const openGradeStudent = (sub: AssignmentSubmission) => {
    setActiveSubmission(sub);
    setGradeInput(sub.grade !== null ? String(sub.grade) : '');
    setFeedbackInput(sub.feedback || '');
    setView('grading-student');
  };

  const handleSaveGrade = async () => {
    if (!activeAssignment || !activeSubmission) return;
    setIsSavingGrade(true);
    const { ok, error } = await gradeSubmission(activeAssignment.id, activeSubmission.studentId, { grade: parseFloat(gradeInput) || 0, feedback: feedbackInput });
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
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PenTool size={18} className="text-indigo-500"/> Grade Submission</h3>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-500 mb-2">Score (out of 100)</label>
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
            {gradingSubmissions.map((s) => (
              <button key={s.studentId} onClick={() => s.status !== 'Pending' && openGradeStudent(s)} disabled={s.status === 'Pending'} className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left disabled:cursor-not-allowed disabled:hover:bg-transparent">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{s.studentName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.status === 'Pending' ? 'Not submitted yet' : s.submittedAt ? new Date(s.submittedAt).toLocaleString() : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  {s.grade !== null && <span className="text-sm font-bold text-emerald-600">{s.grade}/100</span>}
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    s.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' :
                    s.status === 'Pending' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-700'
                  }`}>{s.status}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (view === 'create') {
      return (
        <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6 w-full">
          <button onClick={() => setView('list')} className="w-fit text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-5">
            <h2 className="text-xl font-bold text-slate-800">Create Assignment</h2>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Title</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Chemistry Lab Report" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructions</label>
              <textarea rows={4} value={newInstructions} onChange={(e) => setNewInstructions(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="What should students do?" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
              <input type="datetime-local" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {createError && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{createError}</p>}
            <button onClick={handleCreateAssignment} disabled={!newTitle.trim() || isSavingNew} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold transition-all shadow-sm">
              {isSavingNew ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </div>
      );
    }

    // List view
    const totalPending = Object.values(submissionCounts).reduce((sum, c) => sum + (c.total - c.graded), 0);

    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8 w-full">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Assessments Management</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Monitor student submissions and grading progress.</p>
          </div>
          <button onClick={() => setView('create')} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm">
            <Plus size={16} /> New Assignment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Assignments</p>
              <p className="text-3xl font-black text-slate-800">{assignments.filter(a => a.status === 'Active').length}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
              <Zap className="text-indigo-500" size={24} />
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
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Assignments</p>
              <p className="text-3xl font-black text-slate-800">{assignments.length}</p>
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
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Submissions</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Graded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {isLoading ? (
                  <tr><td colSpan={4} className="py-10 text-center text-slate-400">Loading...</td></tr>
                ) : assignments.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-slate-400">No assignments yet. Create your first one.</td></tr>
                ) : assignments.map(item => {
                  const counts = submissionCounts[item.id] || { submitted: 0, graded: 0, total: 0 };
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-all cursor-pointer" onClick={() => openGradingList(item)}>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800">{item.title}</p>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ================= STUDENT VIEWS =================
  const renderStudentFlow = () => {
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
            <h2 className="text-2xl font-bold text-slate-800">Your Assignments</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Complete your pending assignments.</p>
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
          ) : assignments.length === 0 ? (
            <p className="text-slate-400 col-span-2 text-center py-10">No assignments yet.</p>
          ) : assignments.map(item => (
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
        </div>
      </div>
    );
  };

  return role === 'teacher' ? renderTeacherFlow() : renderStudentFlow();
}
