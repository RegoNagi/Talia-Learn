'use client';

import React, { useState } from 'react';
import { 
  Users, CheckCircle, BarChart3, ArrowUpRight, Settings, Zap, PenTool, Eye,
  PlayCircle, FileText, Check, Upload, Clock, AlertCircle, ShieldAlert, ArrowLeft,
  Save
} from 'lucide-react';

export interface ManagementAssessmentItem {
  id: string;
  title: string;
  status: 'Active' | 'Closed' | 'Draft';
  submissions: number;
  totalStudents: number;
  graded: number;
  averageScore?: string;
  scheduleDate?: string;
}

export interface StudentAssessmentItem {
  id: string;
  title: string;
  type: 'quiz' | 'assignment';
  timeLimit: string;
  dueDate: string;
  instructions: string;
}

interface AssessmentsTabProps {
  role?: 'teacher' | 'parent' | 'student';
}

export function AssessmentsTab({ role = 'teacher' }: AssessmentsTabProps) {
  const [view, setView] = useState<'list' | 'intro' | 'quiz' | 'assignment' | 'success' | 'grading-student'>('list');
  const [activeItem, setActiveItem] = useState<StudentAssessmentItem | null>(null);
  const [quizStep, setQuizStep] = useState(1);

  const teacherAssessments: ManagementAssessmentItem[] = [
    { 
      id: '1', title: 'Advanced Algebra Quiz', status: 'Active', 
      submissions: 28, totalStudents: 30, graded: 15, averageScore: '84%' 
    },
    { 
      id: '2', title: 'Matrix Research Project', status: 'Active', 
      submissions: 12, totalStudents: 30, graded: 5, averageScore: '88%' 
    },
    { 
      id: '3', title: 'Literature Review Essay', status: 'Closed', 
      submissions: 30, totalStudents: 30, graded: 30, averageScore: '92%' 
    },
    { 
      id: '4', title: 'Quantum Basics Pop Quiz', status: 'Draft', 
      submissions: 0, totalStudents: 30, graded: 0, scheduleDate: 'Scheduled for Monday' 
    },
    { 
      id: '5', title: 'Lab Report: Kinetics', status: 'Closed', 
      submissions: 30, totalStudents: 30, graded: 25, averageScore: '89%' 
    },
    { 
      id: '6', title: 'Final Term Preparation', status: 'Draft', 
      submissions: 0, totalStudents: 30, graded: 0 
    }
  ];

  const studentAssessments: StudentAssessmentItem[] = [
    { id: '1', title: 'Algebra Quiz 1', type: 'quiz', timeLimit: '15 mins', dueDate: 'Tomorrow, 11:59 PM', instructions: 'This quiz covers basic algebraic expressions. No calculators allowed.' },
    { id: '2', title: 'Chemistry Lab Report', type: 'assignment', timeLimit: 'No Limit', dueDate: 'Friday, 5:00 PM', instructions: 'Upload your lab report as a PDF outlining your experiment.' },
    { id: '3', title: 'History Essay', type: 'assignment', timeLimit: 'No Limit', dueDate: 'Next Monday, 8:00 AM', instructions: 'Write a 500-word essay on the Industrial Revolution.' },
    { id: '4', title: 'Physics Kinematics Quiz', type: 'quiz', timeLimit: '30 mins', dueDate: 'Today, 10:00 PM', instructions: 'Solve all kinematics problems. You may use a calculator.' },
  ];

  const handleAction = (action: string, title: string) => {
    alert(`${action} triggered for: ${title}`);
  };

  const renderTeacherFlow = () => {
    if (view === 'grading-student' && activeItem) {
      return (
        <div className="p-8 max-w-6xl mx-auto flex gap-8 w-full h-full">
          <div className="flex-1 flex flex-col gap-6">
            <button onClick={() => setView('list')} className="w-fit text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
            
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{activeItem.title}</h2>
                  <p className="text-slate-500 font-medium mt-1">Submission by: <span className="font-bold text-slate-700">Alex Johnson</span></p>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full">Submitted On Time</span>
              </div>
  
              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <h3 className="text-xl font-bold text-slate-800 mb-6">The Impact of the Industrial Revolution</h3>
                <div className="text-slate-600 space-y-6 text-lg leading-relaxed">
                  <p>The Industrial Revolution, which began in Britain in the late 18th century, profoundly changed the world. It marked a shift from agrarian, handicraft economies to industry and machine manufacturing. This period introduced novel ways of working and living and fundamentally transformed society.</p>
                  <p>One of the most significant changes was urbanization. As factories sprang up, people moved from rural areas to cities in search of work. This led to the rapid growth of urban centers but also brought about severe challenges, including overcrowding, poor sanitation, and the spread of diseases.</p>
                  <p>Furthermore, the revolution had a massive impact on the environment. The reliance on coal and other fossil fuels led to increased pollution. However, it also set the stage for modern technological advancements that continue to shape our world today.</p>
                </div>
              </div>
            </div>
          </div>
  
          <div className="w-[350px] shrink-0 flex flex-col gap-6 mt-11">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><PenTool size={18} className="text-indigo-500"/> Grade Submission</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-500 mb-2">Score (out of 100)</label>
                <input type="number" className="w-full text-2xl font-black text-slate-800 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" defaultValue="85" />
              </div>
  
              <div className="mb-8">
                <label className="block text-sm font-bold text-slate-500 mb-2">Feedback</label>
                <textarea rows={5} className="w-full text-sm font-medium text-slate-700 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all" placeholder="Enter feedback for the student..."></textarea>
              </div>
  
              <button onClick={() => {
                alert('Grade saved successfully!');
                setView('list');
              }} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm">
                <Save size={18} />
                Submit Grade
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8 w-full">
        <div className="mb-2">
          <h2 className="text-2xl font-bold text-slate-800">Assessments Management</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Monitor student submissions, grading progress, and performance analytics.
          </p>
        </div>
        
        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Active Assessments</p>
              <p className="text-3xl font-black text-slate-800">2</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
              <Zap className="text-indigo-500" size={24} />
            </div>
          </div>
          
          <div className="bg-rose-50/30 backdrop-blur-2xl border border-rose-200 rounded-[2rem] p-6 shadow-sm flex items-center justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl rounded-tr-[2rem]"></div>
            <div>
              <p className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-1">Pending to Grade</p>
              <p className="text-3xl font-black text-slate-800">18</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white border border-rose-100 flex items-center justify-center shadow-sm z-10">
              <PenTool className="text-rose-500" size={24} />
            </div>
          </div>
  
          <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Class Average</p>
              <p className="text-3xl font-black text-slate-800">86%</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm">
              <BarChart3 className="text-emerald-500" size={24} />
            </div>
          </div>
        </div>
  
        {/* Data Table Section */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white/50 backdrop-blur-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-sm">
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Assessment Title</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Submissions</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Grading</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {teacherAssessments.map(item => {
                  const submissionPercentage = item.totalStudents > 0 ? (item.submissions / item.totalStudents) * 100 : 0;
                  const isDraft = item.status === 'Draft';
                  const pendingGrading = item.submissions - item.graded;
  
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50 transition-all group ${!isDraft ? 'cursor-pointer' : ''}`}
                      onClick={() => {
                        if (!isDraft) {
                          setActiveItem({
                            id: item.id,
                            title: item.title,
                            type: 'assignment',
                            timeLimit: '',
                            dueDate: '',
                            instructions: ''
                          });
                          setView('grading-student');
                        }
                      }}
                    >
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800">{item.title}</p>
                        {isDraft && item.scheduleDate && (
                          <p className="text-xs text-slate-500 mt-1">{item.scheduleDate}</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                          item.status === 'Closed' ? 'bg-slate-100 text-slate-600' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {isDraft ? (
                          <span className="text-sm font-medium text-slate-400">-</span>
                        ) : (
                          <div className="flex flex-col gap-1.5 w-24">
                            <span className="text-sm font-bold text-slate-700">{item.submissions}/{item.totalStudents}</span>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${submissionPercentage}%` }} />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-bold text-slate-700">
                          {isDraft ? '-' : `${item.graded}/${item.submissions}`}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-sm font-bold text-slate-700">
                          {item.averageScore || '-'}
                        </span>
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

  const renderStudentFlow = () => {
    if (view === 'list') {
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
            {studentAssessments.map(item => (
              <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                      item.type === 'quiz' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.type === 'quiz' ? 'Quiz' : 'Assignment'}
                    </span>
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <Clock size={14} /> {item.timeLimit}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">{item.title}</h3>
                  <p className="text-xs font-medium text-red-500 flex items-center gap-1 mb-4">
                    <AlertCircle size={14} /> Due: {item.dueDate}
                  </p>
                </div>
                <button
                  onClick={() => {
                     setActiveItem(item);
                     setView('intro');
                  }}
                  disabled={role === 'parent'}
                  className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-4
                    ${role === 'parent' ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50 pointer-events-none' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'}`}
                >
                  {item.type === 'quiz' ? <PlayCircle size={18} /> : <FileText size={18} />}
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }
  
    if (view === 'intro' && activeItem) {
      return (
        <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6 w-full">
           <button onClick={() => setView('list')} className="w-fit text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold transition-colors">
             <ArrowLeft size={16} /> Back
           </button>
           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
             <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeItem.title}</h2>
             <div className="flex items-center gap-4 text-sm text-slate-500 mb-8 font-medium">
               <span className="flex items-center gap-1"><Clock size={16}/> {activeItem.timeLimit}</span>
               <span className="flex items-center gap-1"><AlertCircle size={16}/> Due: {activeItem.dueDate}</span>
             </div>
             <div className="mb-10">
               <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-2">Instructions</h3>
               <p className="text-slate-600 leading-relaxed text-lg">{activeItem.instructions}</p>
             </div>
             <button 
                onClick={() => {
                   if (activeItem.type === 'quiz') {
                     setQuizStep(1);
                     setView('quiz');
                   } else {
                     setView('assignment');
                   }
                }}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg transition-all shadow-md flex items-center justify-center gap-2"
              >
               <Check size={20} />
               Begin Assessment
             </button>
           </div>
        </div>
      )
    }

    if (view === 'quiz' && activeItem) {
      return (
         <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6 w-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-800">{activeItem.title}</h2>
              <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Question {quizStep} of 3</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${(quizStep / 3) * 100}%` }}></div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
               <h3 className="text-xl font-bold text-slate-800 mb-8 leading-tight">Sample Question {quizStep}: Please select the most appropriate answer from the choices below.</h3>
               <div className="flex flex-col gap-4 mb-10">
                 {[1, 2, 3, 4].map((opt) => (
                   <label key={opt} className="flex items-center gap-4 p-5 border border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-400 transition-all hover:bg-indigo-50 group">
                     <input type="radio" name="q" className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer" />
                     <span className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Possible Answer Option {opt}</span>
                   </label>
                 ))}
               </div>
               <div className="flex justify-between items-center">
                 <button onClick={() => setView('intro')} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Abort Quiz</button>
                 <button 
                   onClick={() => {
                     if (quizStep < 3) {
                       setQuizStep(prev => prev + 1);
                     } else {
                       setView('success');
                     }
                   }}
                   className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm"
                 >
                   {quizStep === 3 ? 'Submit Quiz' : 'Next Question'}
                 </button>
               </div>
            </div>
         </div>
      );
    }

    if (view === 'assignment' && activeItem) {
       return (
          <div className="p-8 max-w-2xl mx-auto flex flex-col gap-6 w-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold text-slate-800">{activeItem.title}</h2>
              <button onClick={() => setView('list')} className="text-sm font-bold text-slate-400 hover:text-slate-600">Close</button>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-8">
               
               <div>
                  <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-3">Written Response</h3>
                  <textarea 
                     rows={6} 
                     className="w-full border border-slate-200 rounded-2xl p-5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 placeholder:text-slate-400 resize-none transition-all"
                     placeholder="Type your answer or paste your links here..."
                  ></textarea>
               </div>
               
               <div>
                  <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider mb-3">File Upload</h3>
                  <div className="w-full border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer">
                     <Upload size={36} className="mb-4 text-slate-400" />
                     <p className="font-bold text-slate-600">Drag & drop files here</p>
                     <p className="text-sm mt-1">or click to browse from your computer</p>
                  </div>
               </div>

               <div className="flex justify-end pt-4 border-t border-slate-100">
                 <button 
                   onClick={() => setView('success')}
                   className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm"
                 >
                   Submit Assignment
                 </button>
               </div>
            </div>
          </div>
       )
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
                <button 
                   onClick={() => {
                     setActiveItem(null);
                     setView('list');
                   }}
                   className="w-full py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-bold text-lg transition-all"
                >
                   Back to Dashboard
                </button>
             </div>
          </div>
       )
    }

    return null;
  }

  return role === 'teacher' ? renderTeacherFlow() : renderStudentFlow();
}


