'use client';

import { useState } from 'react';
import { Download, Upload, Search, Filter, Info, MessageSquare, AlertTriangle, Zap, X, CheckCircle2, Sparkles, Send, Clock, PanelRightOpen, Users } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';

type GradeItem = {
  score: number | string;
  max: number;
  status?: 'late' | 'missed';
};

type Student = {
  id: number;
  name: string;
  initials: string;
  color: string;
  avatar: string;
  riskReason?: string;
  grades: {
    lab1: GradeItem;
    lab2: GradeItem;
    midterm: GradeItem;
    popup: GradeItem;
    project: GradeItem;
  };
  notified: boolean;
};

export function GradebookTab({ 
  viewRole = 'TEACHER', 
  demoAssessments = [] 
}: { 
  viewRole?: 'TEACHER' | 'STUDENT',
  demoAssessments?: any[]
}) {
  const isStudent = viewRole === 'STUDENT';
  const studentGrades = [
    { id: 1, name: "Advanced Algebra Quiz", type: "Quiz", score: 85, total: 100, weight: "15%", status: "Graded" },
    { id: 2, name: "Matrix Research Project", type: "Assignment", score: 92, total: 100, weight: "25%", status: "Graded" },
    { id: 3, name: "Vector Basics Assignment", type: "Assignment", score: 48, total: 50, weight: "10%", status: "Graded" },
    { id: 4, name: "Quantum Physics Pop Quiz", type: "Quiz", score: null, total: 20, weight: "5%", status: "Pending" },
    { id: 5, name: "Literature Analysis Essay", type: "Assignment", score: null, total: 100, weight: "25%", status: "Upcoming" }
  ];
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: 'Alex Johnson', initials: 'AJ', color: 'bg-indigo-100 text-indigo-600', avatar: 'https://picsum.photos/seed/alex/100', grades: { lab1: { score: 24, max: 25 }, lab2: { score: 45, max: 50, status: 'late' }, midterm: { score: 85, max: 100 }, popup: { score: 12, max: 15 }, project: { score: 180, max: 200 } }, notified: false },
    { id: 2, name: 'Maria Garcia', initials: 'MG', color: 'bg-emerald-100 text-emerald-600', avatar: 'https://picsum.photos/seed/maria/100', grades: { lab1: { score: 48, max: 50 }, lab2: { score: 49, max: 50 }, midterm: { score: 92, max: 100 }, popup: { score: 20, max: 20 }, project: { score: 195, max: 200 } }, notified: false },
    { id: 3, name: 'James Smith', initials: 'JS', color: 'bg-amber-100 text-amber-600', avatar: 'https://picsum.photos/seed/james/100', riskReason: '3 Missed', grades: { lab1: { score: 15, max: 25 }, lab2: { score: 0, max: 50, status: 'missed' }, midterm: { score: 70, max: 100 }, popup: { score: 18, max: 20 }, project: { score: 150, max: 200 } }, notified: false },
    { id: 4, name: 'Elena Vogt', initials: 'EV', color: 'bg-purple-100 text-purple-600', avatar: 'https://picsum.photos/seed/elena/100', grades: { lab1: { score: 42, max: 50 }, lab2: { score: 44, max: 50 }, midterm: { score: 88, max: 100 }, popup: { score: 19, max: 20 }, project: { score: 175, max: 200 } }, notified: false },
    { id: 5, name: 'Marcus Chen', initials: 'MC', color: 'bg-rose-100 text-rose-600', avatar: 'https://picsum.photos/seed/marcus/100', riskReason: 'Low Avg', grades: { lab1: { score: 10, max: 25 }, lab2: { score: 20, max: 50 }, midterm: { score: 60, max: 100 }, popup: { score: 10, max: 20 }, project: { score: 120, max: 200 } }, notified: false },
    { id: 6, name: 'Sarah Jenkins', initials: 'SJ', color: 'bg-cyan-100 text-cyan-600', avatar: 'https://picsum.photos/seed/sarah/100', riskReason: '2 Missed', grades: { lab1: { score: 0, max: 25, status: 'missed' }, lab2: { score: 0, max: 50, status: 'missed' }, midterm: { score: 65, max: 100 }, popup: { score: 15, max: 20 }, project: { score: 140, max: 200 } }, notified: false },
    { id: 7, name: 'David Kim', initials: 'DK', color: 'bg-indigo-100 text-indigo-600', avatar: 'https://picsum.photos/seed/david/100', riskReason: 'Low Avg', grades: { lab1: { score: 12, max: 25 }, lab2: { score: 25, max: 50 }, midterm: { score: 55, max: 100 }, popup: { score: 8, max: 20 }, project: { score: 130, max: 200 } }, notified: false },
  ]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isPublished, setIsPublished] = useState(false);
  
  // Intervention Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [sendToStudent, setSendToStudent] = useState(true);
  const [sendToGuardian, setSendToGuardian] = useState(true);
  const [messageDraft, setMessageDraft] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'A' | 'B' | null>(null);

  const openIntervention = (studentsToNotify: Student[]) => {
    setSelectedStudents(studentsToNotify);
    setIsDrawerOpen(true);
    setSelectedTemplate(null);
    setMessageDraft('');
  };

  const applyTemplate = (type: 'A' | 'B') => {
    setSelectedTemplate(type);
    const names = selectedStudents.map(s => s.name).join(', ');
    if (type === 'A') {
      setMessageDraft(`Hello Guardian(s) of ${names},\n\nI am writing to inform you about some missed assignments in Linear Algebra. Let's discuss a support plan to get them back on track.\n\nBest,\nTeacher`);
    } else {
      setMessageDraft(`Hi ${names},\n\nI noticed you're struggling with Matrices. Check out this remedial video I've unlocked for you to help you review the core concepts.\n\nBest,\nTeacher`);
    }
  };

  const handleSendIntervention = () => {
    // Mark student as notified
    const selectedIds = selectedStudents.map(s => s.id);
    setStudents(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, notified: true } : s));
    setIsDrawerOpen(false);
  };

  const updateGrade = (studentId: number, assignment: keyof Student['grades'], newScore: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          grades: {
            ...s.grades,
            [assignment]: {
              ...s.grades[assignment],
              score: newScore === '' ? '' : Number(newScore)
            }
          }
        };
      }
      return s;
    }));
  };

  const calculateTotal = (grades: any) => {
    const hwScore = ((Number(grades.lab1.score) + Number(grades.lab2.score)) / (grades.lab1.max + grades.lab2.max)) * 20;
    const quizScore = ((Number(grades.midterm.score) + Number(grades.popup.score)) / (grades.midterm.max + grades.popup.max)) * 30;
    const finalScore = (Number(grades.project.score) / grades.project.max) * 50;
    return (hwScore + quizScore + finalScore).toFixed(1);
  };

  const getGradeDisplay = (student: Student) => {
    if (student.name === 'Alex Johnson') return '8';
    if (student.name === 'Maria Garcia') return '9';
    if (student.name === 'James Smith') return '5';
    if (student.name === 'Elena Vogt') return '8';
    if (student.name === 'Marcus Chen') return '4';
    if (student.name === 'Sarah Jenkins') return '4';
    
    const total = parseFloat(calculateTotal(student.grades));
    if (total >= 90) return '9';
    if (total >= 80) return '8';
    if (total >= 70) return '7';
    if (total >= 60) return '5';
    if (total >= 50) return '4';
    if (total >= 40) return '3';
    return 'U';
  };

  const atRiskStudents = students.filter(s => parseFloat(calculateTotal(s.grades)) < 70);

  return (
    <div className="h-full flex relative overflow-hidden bg-white">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 leading-tight">Applied<br/>Sciences II</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl bg-white">
              <span className="text-slate-400"><Filter size={16} /></span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Section</span>
                <span className="text-sm font-bold text-slate-700">A-1</span>
              </div>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 w-64 outline-none transition-all shadow-none"
              />
            </div>
            {!isStudent && (
              <>
                <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-none transition-all transform active:scale-95">
                  <Download size={16} /> Export CSV
                </button>
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`p-3 rounded-xl border transition-colors ${isSidebarOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  title="Toggle Analytics Sidebar"
                >
                  <PanelRightOpen size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto bg-white border border-slate-100 rounded-3xl shadow-none">
          {isStudent ? (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-white">
                <tr>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-r border-slate-100 w-64">
                    Assessment Name
                  </th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-r border-slate-100 text-center">
                    Weight
                  </th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-r border-slate-100 text-center">
                    Score
                  </th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-r border-slate-100 text-center">
                    Percentage
                  </th>
                  <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {studentGrades.map((assessment) => {
                  const percentage = assessment.score !== null ? ((assessment.score / assessment.total) * 100).toFixed(0) + '%' : '-';
                  const scoreDisplay = assessment.score !== null ? `${assessment.score} / ${assessment.total}` : '-';

                  return (
                    <tr key={assessment.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 border-r border-slate-100">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-800">{assessment.name}</span>
                          <span className={`text-[10px] w-fit font-bold px-2 py-0.5 rounded-md ${
                            assessment.type === 'Quiz' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {assessment.type}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center border-r border-slate-100 font-medium text-slate-500">
                        {assessment.weight}
                      </td>
                      <td className="p-4 text-center border-r border-slate-100 font-bold text-slate-600">
                        {scoreDisplay}
                      </td>
                      <td className="p-4 text-center border-r border-slate-100 font-bold text-indigo-600">
                        {percentage}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-bold px-2.5 py-1 border rounded-md uppercase tracking-wider flex items-center justify-center gap-1.5 w-max mx-auto
                          ${assessment.status === 'Graded' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                            assessment.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                            'bg-slate-50 text-slate-500 border-slate-200'}`}>
                          {assessment.status === 'Graded' && <CheckCircle2 size={12} />}
                          {assessment.status === 'Pending' && <Clock size={12} />}
                          {assessment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-white">
              {/* Top Header Row */}
              <tr>
                <th rowSpan={2} className="p-6 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-r border-slate-100 w-64 align-bottom">
                  Student Name
                </th>
                <th colSpan={2} className="p-4 text-center border-b border-r border-slate-100">
                  <div className="text-indigo-600 font-bold text-sm uppercase tracking-wider">FORMATIVE</div>
                  <div className="text-slate-400 text-[10px] italic mt-0.5">Weight: 20%</div>
                </th>
                <th colSpan={2} className="p-4 text-center border-b border-r border-slate-100">
                  <div className="text-indigo-600 font-bold text-sm uppercase tracking-wider">TOPIC TESTS</div>
                  <div className="text-slate-400 text-[10px] italic mt-0.5">Weight: 30%</div>
                </th>
                <th className="p-4 text-center border-b border-r border-slate-100 bg-slate-50/50">
                  <div className="text-indigo-600 font-bold text-sm uppercase tracking-wider">MOCK EXAMS</div>
                  <div className="text-slate-400 text-[10px] italic mt-0.5">Weight: 50%</div>
                </th>
                <th rowSpan={2} className="p-6 text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 text-center bg-slate-50/50 align-bottom">
                  Grade
                </th>
              </tr>
              {/* Sub Header Row */}
              <tr>
                <th className="p-3 text-xs font-bold text-slate-400 text-center border-b border-r border-slate-100">Weekly Assessment 1</th>
                <th className="p-3 text-xs font-bold text-slate-400 text-center border-b border-r border-slate-100">Weekly Assessment 2</th>
                <th className="p-3 text-xs font-bold text-slate-400 text-center border-b border-r border-slate-100">Unit Test 1</th>
                <th className="p-3 text-xs font-bold text-slate-400 text-center border-b border-r border-slate-100">Unit Test 2</th>
                <th className="p-3 text-xs font-bold text-slate-400 text-center border-b border-r border-slate-100 bg-slate-50/50">Mock 1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {students.map((student) => {
                const gradeDisplay = getGradeDisplay(student);
                return (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 border-r border-slate-100">
                      <div className="flex items-center gap-4 pl-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${student.color}`}>
                          {student.initials}
                        </div>
                        <span className="font-bold text-slate-800">{student.name}</span>
                      </div>
                    </td>
                    
                    {/* Lab 01 */}
                    <td className="p-4 text-center border-r border-slate-100 relative group">
                      <div className="flex items-center justify-center">
                        <input 
                          type="number" 
                          value={student.grades.lab1.score}
                          onChange={(e) => updateGrade(student.id, 'lab1', e.target.value)}
                          className="w-10 text-right bg-transparent text-slate-600 font-medium text-sm focus:outline-none focus:border-b-2 focus:border-indigo-500 transition-colors"
                        />
                        <span className="text-slate-400 text-xs ml-1">/{student.grades.lab1.max}</span>
                      </div>
                      {student.grades.lab1.status === 'late' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500"></div>}
                      {student.grades.lab1.status === 'missed' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500"></div>}
                    </td>
                    
                    {/* Lab 02 */}
                    <td className="p-4 text-center border-r border-slate-100 relative group">
                      <div className="flex items-center justify-center">
                        <input 
                          type="number" 
                          value={student.grades.lab2.score}
                          onChange={(e) => updateGrade(student.id, 'lab2', e.target.value)}
                          className="w-10 text-right bg-transparent text-slate-600 font-medium text-sm focus:outline-none focus:border-b-2 focus:border-indigo-500 transition-colors"
                        />
                        <span className="text-slate-400 text-xs ml-1">/{student.grades.lab2.max}</span>
                      </div>
                      {student.grades.lab2.status === 'late' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500"></div>}
                      {student.grades.lab2.status === 'missed' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500"></div>}
                    </td>
                    
                    {/* Midterm */}
                    <td className="p-4 text-center border-r border-slate-100 relative group">
                      <div className="flex items-center justify-center">
                        <input 
                          type="number" 
                          value={student.grades.midterm.score}
                          onChange={(e) => updateGrade(student.id, 'midterm', e.target.value)}
                          className="w-10 text-right bg-transparent text-slate-600 font-medium text-sm focus:outline-none focus:border-b-2 focus:border-indigo-500 transition-colors"
                        />
                        <span className="text-slate-400 text-xs ml-1">/{student.grades.midterm.max}</span>
                      </div>
                      {student.grades.midterm.status === 'late' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500"></div>}
                      {student.grades.midterm.status === 'missed' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500"></div>}
                    </td>
                    
                    {/* Popup */}
                    <td className="p-4 text-center border-r border-slate-100 relative group">
                      <div className="flex items-center justify-center">
                        <input 
                          type="number" 
                          value={student.grades.popup.score}
                          onChange={(e) => updateGrade(student.id, 'popup', e.target.value)}
                          className="w-10 text-right bg-transparent text-slate-600 font-medium text-sm focus:outline-none focus:border-b-2 focus:border-indigo-500 transition-colors"
                        />
                        <span className="text-slate-400 text-xs ml-1">/{student.grades.popup.max}</span>
                      </div>
                      {student.grades.popup.status === 'late' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500"></div>}
                      {student.grades.popup.status === 'missed' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500"></div>}
                    </td>
                    
                    {/* Project */}
                    <td className="p-4 text-center border-r border-slate-100 bg-slate-50/30 relative group">
                      <div className="flex items-center justify-center">
                        <input 
                          type="number" 
                          value={student.grades.project.score}
                          onChange={(e) => updateGrade(student.id, 'project', e.target.value)}
                          className="w-10 text-right bg-transparent text-slate-600 font-medium text-sm focus:outline-none focus:border-b-2 focus:border-indigo-500 transition-colors"
                        />
                        <span className="text-slate-400 text-xs ml-1">/{student.grades.project.max}</span>
                      </div>
                      {student.grades.project.status === 'late' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-orange-500"></div>}
                      {student.grades.project.status === 'missed' && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500"></div>}
                    </td>
                    
                    {/* Total Grade */}
                    <td className="p-4 text-center font-bold text-indigo-600 bg-slate-50/50">
                      {gradeDisplay}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 ml-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Late Submission</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Missed Deadline</span>
          </div>
        </div>
      </div>

      {/* Analytics Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="border-l border-slate-100 bg-white flex flex-col overflow-y-auto overflow-x-hidden shrink-0"
          >
            <div className="w-[380px] p-8 flex flex-col h-full">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Class Performance</h3>

              {/* Chart Card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-none mb-6">
                <div className="flex items-end justify-between h-32 mb-6 gap-2">
                  <div className="w-full bg-indigo-400 rounded-t-lg h-[40%] hover:bg-indigo-500 transition-colors cursor-pointer"></div>
                  <div className="w-full bg-indigo-400 rounded-t-lg h-[60%] hover:bg-indigo-500 transition-colors cursor-pointer"></div>
                  <div className="w-full bg-indigo-500 rounded-t-lg h-[100%] hover:bg-indigo-600 transition-colors cursor-pointer"></div>
                  <div className="w-full bg-indigo-500 rounded-t-lg h-[85%] hover:bg-indigo-600 transition-colors cursor-pointer"></div>
                  <div className="w-full bg-indigo-400 rounded-t-lg h-[75%] hover:bg-indigo-500 transition-colors cursor-pointer"></div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Class Average</div>
                    <div className="text-3xl font-bold text-indigo-500">82.4%</div>
                  </div>
                  <div className="px-2 py-1 bg-emerald-50 text-emerald-500 text-xs font-bold rounded-lg mb-1">
                    +4.2%
                  </div>
                </div>
              </div>

              {/* At Risk Card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-none mb-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Intervention Required</div>
                    <div className="text-sm font-bold text-slate-800">{atRiskStudents.length} Students require attention</div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-5 max-h-[200px] overflow-y-auto pr-2">
                  {atRiskStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100" onClick={() => openIntervention([student])}>
                      <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                          <Image src={student.avatar} alt={student.name} fill className="object-cover" />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{student.name}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 bg-rose-50 text-rose-600 rounded-md uppercase tracking-wider">
                        {student.riskReason || 'Low Avg'}
                      </span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => openIntervention(atRiskStudents)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-none"
                >
                  <Sparkles size={16} /> Bulk Notify
                </button>
              </div>

              {/* Grade Distribution */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-none mb-6">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-5">Grade Distribution</div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="w-4 font-bold text-slate-800 text-sm">A</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-slate-500">45%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-4 font-bold text-slate-800 text-sm">B</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-slate-500">30%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="w-4 font-bold text-slate-800 text-sm">C</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-300 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                    <span className="w-8 text-right text-xs font-medium text-slate-500">15%</span>
                  </div>
                </div>
              </div>

              {/* Upcoming Milestone */}
              <div className="bg-indigo-600 rounded-3xl p-6 shadow-none text-white mt-auto border border-indigo-500">
                <div className="text-xs font-medium text-indigo-200 mb-1">Upcoming Milestone</div>
                <div className="text-lg font-bold mb-4">Final Capstone Submission</div>
                <div className="flex items-center gap-2 text-sm font-medium mb-6">
                  <Clock size={16} />
                  In 3 days (Apr 15)
                </div>
                <button className="w-full py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-bold transition-colors backdrop-blur-sm">
                  Grade Submissions
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intervention Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedStudents.length > 0 && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-[450px] bg-white shadow-none z-50 flex flex-col border-l border-slate-200"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#FAFAFA]">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Academic Intervention</h2>
                  <p className="text-sm text-slate-500">for {selectedStudents.length === 1 ? selectedStudents[0].name : `${selectedStudents.length} Students`}</p>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Recipients */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recipients</label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={sendToStudent}
                        onChange={(e) => setSendToStudent(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Send to Student (App Notification)</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <input 
                        type="checkbox" 
                        checked={sendToGuardian}
                        onChange={(e) => setSendToGuardian(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Send to Guardian (Email/SMS)</span>
                    </label>
                  </div>
                  {sendToStudent && sendToGuardian && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-2">
                      <CheckCircle2 size={14} /> Recommended: Sending to both channels
                    </p>
                  )}
                </div>

                {/* AI Templates */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-500" />
                    Faheem Smart Drafts
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => applyTemplate('A')}
                      className={`p-3 rounded-xl border text-left transition-all ${selectedTemplate === 'A' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}
                    >
                      <div className="text-sm font-bold text-slate-800 mb-1">Academic Alert</div>
                      <div className="text-xs text-slate-500 line-clamp-2">Focuses on missed assignments and support plan.</div>
                    </button>
                    <button 
                      onClick={() => applyTemplate('B')}
                      className={`p-3 rounded-xl border text-left transition-all ${selectedTemplate === 'B' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}
                    >
                      <div className="text-sm font-bold text-slate-800 mb-1">Progress & Review</div>
                      <div className="text-xs text-slate-500 line-clamp-2">Suggests remedial resources and specific topics.</div>
                    </button>
                  </div>
                </div>

                {/* Message Editor */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Message</label>
                  <textarea 
                    value={messageDraft}
                    onChange={(e) => setMessageDraft(e.target.value)}
                    placeholder="Select a template or type your message here..."
                    className="w-full h-48 p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                  <p className="text-xs text-slate-400 italic">This message will be logged in the Student History for transparency.</p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-white">
                <button 
                  onClick={handleSendIntervention}
                  disabled={!messageDraft.trim() || (!sendToStudent && !sendToGuardian)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={18} />
                  Send Intervention
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
