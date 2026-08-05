'use client';

import { useState, useEffect } from 'react';
import { Download, Search, AlertTriangle, Sparkles, Send, PanelRightOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getGradebookConfigFull, getRealAssessments, getRealGradeEntries, syncGradeEntry,
} from '@/services/gradebookSync';
import { getClassRoster } from '@/services/assignmentData';
import { sendMessage, sendMessageToStudentParent } from '@/services/messagesData';

interface RealStudent {
  id: string;
  name: string;
}

interface RealAssessment {
  id: string;
  title: string;
  category: string;
  maxScore: number;
}

export function GradebookTab({
  viewRole = 'TEACHER',
  classId,
  subject,
  grade,
  studentId,
  teacherId,
  teacherName,
}: {
  viewRole?: 'TEACHER' | 'STUDENT';
  classId?: string;
  subject?: string;
  grade?: string;
  studentId?: string;
  teacherId?: string;
  teacherName?: string;
}) {
  const isStudent = viewRole === 'STUDENT';

  const [isLoading, setIsLoading] = useState(true);
  const [configId, setConfigId] = useState<string | null>(null);
  const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>({});
  const [passingScore, setPassingScore] = useState(60);
  const [assessments, setAssessments] = useState<RealAssessment[]>([]);
  const [students, setStudents] = useState<RealStudent[]>([]);
  // entries[studentId][assessmentId] = score
  const [entries, setEntries] = useState<Record<string, Record<string, number | null>>>({});

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<RealStudent[]>([]);
  const [sendToStudent, setSendToStudent] = useState(true);
  const [sendToGuardian, setSendToGuardian] = useState(true);
  const [messageDraft, setMessageDraft] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'A' | 'B' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = async () => {
    if (!subject || !grade) { setIsLoading(false); return; }
    setIsLoading(true);
    const config = await getGradebookConfigFull(subject, grade);
    if (!config) {
      setConfigId(null);
      setIsLoading(false);
      return;
    }
    setConfigId(config.id);
    setCategoryWeights(config.categoryWeights);
    setPassingScore(config.passingScore || 60);

    const [realAssessments, realEntries, roster] = await Promise.all([
      getRealAssessments(config.id),
      getRealGradeEntries(config.id),
      classId ? getClassRoster(classId) : Promise.resolve([]),
    ]);
    setAssessments(realAssessments);
    setStudents(roster);

    const entryMap: Record<string, Record<string, number | null>> = {};
    for (const e of realEntries) {
      if (!entryMap[e.studentId]) entryMap[e.studentId] = {};
      entryMap[e.studentId][e.assessmentId] = e.score;
    }
    setEntries(entryMap);
    setIsLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [subject, grade, classId]);

  const categories = Array.from(new Set(assessments.map(a => a.category)));

  const computeWeightedTotal = (studentEntries: Record<string, number | null>) => {
    let total = 0;
    let totalWeight = 0;
    for (const cat of categories) {
      const catAssessments = assessments.filter(a => a.category === cat);
      const weight = categoryWeights[cat] || 0;
      if (weight === 0 || catAssessments.length === 0) continue;
      const sumScore = catAssessments.reduce((s, a) => s + (studentEntries[a.id] ?? 0), 0);
      const sumMax = catAssessments.reduce((s, a) => s + a.maxScore, 0);
      if (sumMax === 0) continue;
      total += (sumScore / sumMax) * weight;
      totalWeight += weight;
    }
    return totalWeight > 0 ? (total / totalWeight) * 100 : null;
  };

  const filteredStudents = students.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleExportCsv = () => {
    const header = ['Student Name', ...assessments.map((a) => a.title), 'Total %'];
    const rows = filteredStudents.map((student) => {
      const studentEntries = entries[student.id] || {};
      const total = computeWeightedTotal(studentEntries);
      const scoreCells = assessments.map((a) => (studentEntries[a.id] ?? ''));
      return [student.name, ...scoreCells, total !== null ? total.toFixed(1) : ''];
    });
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${subject || 'gradebook'}-${grade || ''}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGradeChange = async (sId: string, assessmentId: string, value: string) => {
    const score = value === '' ? null : Number(value);
    setEntries(prev => ({ ...prev, [sId]: { ...(prev[sId] || {}), [assessmentId]: score } }));
    await syncGradeEntry(assessmentId, sId, score, score === null ? 'Pending' : 'Graded');
  };

  const atRiskStudents = students.filter(s => {
    const total = computeWeightedTotal(entries[s.id] || {});
    return total !== null && total < passingScore;
  });

  const classAverage = (() => {
    const totals = students.map(s => computeWeightedTotal(entries[s.id] || {})).filter((t): t is number => t !== null);
    if (totals.length === 0) return null;
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  })();

  const openIntervention = (studentsToNotify: RealStudent[]) => {
    setSelectedStudents(studentsToNotify);
    setIsDrawerOpen(true);
    setSelectedTemplate(null);
    setMessageDraft('');
  };

  const applyTemplate = (type: 'A' | 'B') => {
    setSelectedTemplate(type);
    const names = selectedStudents.map(s => s.name).join(', ');
    if (type === 'A') {
      setMessageDraft(`Hello Guardian(s) of ${names},\n\nI am writing to inform you about your student's current standing in ${subject || 'this class'}. Let's discuss a support plan to get them back on track.\n\nBest,\nTeacher`);
    } else {
      setMessageDraft(`Hi ${names},\n\nI noticed you're struggling with some recent material. Let's review the core concepts together.\n\nBest,\nTeacher`);
    }
  };

  const [isSendingIntervention, setIsSendingIntervention] = useState(false);
  const [interventionResult, setInterventionResult] = useState<string | null>(null);

  const handleSendIntervention = async () => {
    if (!teacherId || !teacherName) {
      setInterventionResult('Error: missing teacher info.');
      return;
    }
    setIsSendingIntervention(true);
    let successCount = 0;
    let failCount = 0;
    for (const student of selectedStudents) {
      if (sendToGuardian) {
        const { ok } = await sendMessageToStudentParent({
          senderId: teacherId,
          senderRole: 'teacher',
          senderName: teacherName,
          studentId: student.id,
          subject: `Regarding ${student.name} — ${subject || ''}`,
          content: messageDraft,
        });
        if (ok) successCount++; else failCount++;
      }
      if (sendToStudent) {
        const { ok } = await sendMessage({
          senderId: teacherId,
          senderRole: 'teacher',
          senderName: teacherName,
          recipientId: student.id,
          recipientRole: 'student',
          subject: `Regarding your grades — ${subject || ''}`,
          content: messageDraft,
          relatedStudentId: student.id,
        });
        if (ok) successCount++; else failCount++;
      }
    }
    setIsSendingIntervention(false);
    setInterventionResult(failCount > 0 ? `Sent ${successCount}, failed ${failCount} (some students may not have a linked parent account yet).` : `Message sent to ${successCount} recipient(s).`);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setInterventionResult(null);
    }, 1800);
  };

  // ============ Student view ============
  if (isStudent) {
    const myEntries = entries[studentId || ''] || {};
    const myTotal = computeWeightedTotal(myEntries);
    return (
      <div className="h-full flex flex-col p-8 bg-white overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Grades — {subject}</h1>
          {myTotal !== null && (
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase">Overall</div>
              <div className="text-2xl font-black text-indigo-600">{myTotal.toFixed(1)}%</div>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto bg-white border border-slate-100 rounded-3xl">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white">
              <tr>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-r border-slate-100">Assessment</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-r border-slate-100 text-center">Category</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-r border-slate-100 text-center">Score</th>
                <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-400">Loading...</td></tr>
              ) : assessments.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-slate-400">No graded assessments yet.</td></tr>
              ) : assessments.map((a) => {
                const score = myEntries[a.id];
                return (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 border-r border-slate-100 font-bold text-slate-800">{a.title}</td>
                    <td className="p-4 text-center border-r border-slate-100 text-slate-500 font-medium">{a.category}</td>
                    <td className="p-4 text-center border-r border-slate-100 font-bold text-slate-600">
                      {score !== undefined && score !== null ? `${score} / ${a.maxScore}` : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-[10px] font-bold px-2.5 py-1 border rounded-md uppercase tracking-wider ${
                        score !== undefined && score !== null ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {score !== undefined && score !== null ? 'Graded' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ============ Teacher view ============
  return (
    <div className="h-full flex relative overflow-hidden bg-white">
      <div className="flex-1 flex flex-col min-w-0 p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{subject || 'Gradebook'}</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 w-64 outline-none transition-all" />
              <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
            </div>
            <button onClick={handleExportCsv} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all">
              <Download size={16} /> Export CSV
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-3 rounded-xl border transition-colors ${isSidebarOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              title="Toggle Analytics Sidebar"
            >
              <PanelRightOpen size={20} />
            </button>
          </div>
        </div>

        {!configId && !isLoading && (
          <div className="flex-1 flex items-center justify-center text-center">
            <div className="max-w-md">
              <p className="text-slate-500 font-medium">No approved Gradebook setup found for {subject} / {grade} in Talia 360 yet. Once one exists, real grades will appear here.</p>
            </div>
          </div>
        )}

        {configId && (
        <div className="flex-1 overflow-auto bg-white border border-slate-100 rounded-3xl">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white">
              <tr>
                <th rowSpan={2} className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-r border-slate-100 w-64 align-bottom">Student Name</th>
                {categories.map((cat) => {
                  const catAssessments = assessments.filter(a => a.category === cat);
                  return (
                    <th key={cat} colSpan={catAssessments.length || 1} className="p-4 text-center border-b border-r border-slate-100">
                      <div className="text-indigo-600 font-bold text-sm uppercase tracking-wider">{cat}</div>
                      <div className="text-slate-400 text-[10px] italic mt-0.5">Weight: {categoryWeights[cat] || 0}%</div>
                    </th>
                  );
                })}
                <th rowSpan={2} className="p-6 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 text-center bg-slate-50/50 align-bottom">Total</th>
              </tr>
              <tr>
                {categories.map((cat) =>
                  assessments.filter(a => a.category === cat).map((a) => (
                    <th key={a.id} className="p-3 text-xs font-bold text-slate-400 text-center border-b border-r border-slate-100">{a.title}</th>
                  ))
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr><td colSpan={99} className="p-10 text-center text-slate-400">Loading...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={99} className="p-10 text-center text-slate-400">No students enrolled yet.</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={99} className="p-10 text-center text-slate-400">No students match "{searchQuery}".</td></tr>
              ) : filteredStudents.map((student) => {
                const studentEntries = entries[student.id] || {};
                const total = computeWeightedTotal(studentEntries);
                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 border-r border-slate-100">
                      <span className="font-bold text-slate-800">{student.name}</span>
                    </td>
                    {assessments.map((a) => (
                      <td key={a.id} className="p-4 text-center border-r border-slate-100">
                        <div className="flex items-center justify-center">
                          <input
                            type="number"
                            max={a.maxScore}
                            value={studentEntries[a.id] ?? ''}
                            onChange={(e) => handleGradeChange(student.id, a.id, e.target.value)}
                            className="w-10 text-right bg-transparent text-slate-600 font-medium text-sm focus:outline-none focus:border-b-2 focus:border-indigo-500 transition-colors"
                          />
                          <span className="text-slate-400 text-xs ml-1">/{a.maxScore}</span>
                        </div>
                      </td>
                    ))}
                    <td className="p-4 text-center font-bold text-indigo-600 bg-slate-50/50">
                      {total !== null ? `${total.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Analytics Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-l border-slate-100 bg-white flex flex-col overflow-y-auto overflow-x-hidden shrink-0"
          >
            <div className="w-[380px] p-8 flex flex-col h-full">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Class Performance</h3>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-6">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Class Average</div>
                <div className="text-3xl font-bold text-indigo-500">{classAverage !== null ? `${classAverage.toFixed(1)}%` : 'No data yet'}</div>
              </div>

              <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Intervention Suggested</div>
                    <div className="text-sm font-bold text-slate-800">{atRiskStudents.length} student(s) below {passingScore}%</div>
                  </div>
                </div>
                <div className="space-y-2 mb-5 max-h-[200px] overflow-y-auto pr-2">
                  {atRiskStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer" onClick={() => openIntervention([student])}>
                      <span className="text-sm font-bold text-slate-700">{student.name}</span>
                      <span className="text-[10px] font-bold px-2 py-1 bg-rose-50 text-rose-600 rounded-md uppercase tracking-wider">
                        {computeWeightedTotal(entries[student.id] || {})?.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {atRiskStudents.length === 0 && <p className="text-sm text-slate-400">No students currently at risk.</p>}
                </div>
                {atRiskStudents.length > 0 && (
                  <button onClick={() => openIntervention(atRiskStudents)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2">
                    <Sparkles size={16} /> Bulk Notify
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intervention Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedStudents.length > 0 && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsDrawerOpen(false)} className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute top-0 right-0 bottom-0 w-[450px] bg-white z-50 flex flex-col border-l border-slate-200">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#FAFAFA]">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Academic Intervention</h2>
                  <p className="text-sm text-slate-500">for {selectedStudents.length === 1 ? selectedStudents[0].name : `${selectedStudents.length} Students`}</p>
                </div>
                <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recipients</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={sendToStudent} onChange={(e) => setSendToStudent(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-slate-700">Send to Student (App Notification)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={sendToGuardian} onChange={(e) => setSendToGuardian(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                      <span className="text-sm font-medium text-slate-700">Send to Guardian (Email/SMS)</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-500" /> Faheem Smart Drafts
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => applyTemplate('A')} className={`p-3 rounded-xl border text-left transition-all ${selectedTemplate === 'A' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}>
                      <div className="text-sm font-bold text-slate-800 mb-1">Academic Alert</div>
                      <div className="text-xs text-slate-500 line-clamp-2">Focuses on standing and support plan.</div>
                    </button>
                    <button onClick={() => applyTemplate('B')} className={`p-3 rounded-xl border text-left transition-all ${selectedTemplate === 'B' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}>
                      <div className="text-sm font-bold text-slate-800 mb-1">Progress & Review</div>
                      <div className="text-xs text-slate-500 line-clamp-2">Suggests remedial review of recent topics.</div>
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
                  <textarea value={messageDraft} onChange={(e) => setMessageDraft(e.target.value)} placeholder="Select a template or type your message here..." className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-white space-y-2">
                {interventionResult && (
                  <p className="text-xs font-bold text-center text-slate-600">{interventionResult}</p>
                )}
                <button onClick={handleSendIntervention} disabled={isSendingIntervention || !messageDraft.trim() || (!sendToStudent && !sendToGuardian)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                  <Send size={18} /> {isSendingIntervention ? 'Sending...' : 'Send Intervention'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
