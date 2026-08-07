import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Clock, UploadCloud, CheckCircle2, CheckCircle, Calendar, File, BookOpen } from 'lucide-react';
import { DemoAssessment } from '@/app/courses/[courseId]/page';

interface AssessmentComponentProps {
  assessment: DemoAssessment;
  onClose: () => void;
  onStartQuiz?: () => void;
  onStartAssignment?: () => void;
  onComplete: (status: 'COMPLETED' | 'PENDING_REVIEW', grade: string) => void;
  viewRole?: string;
}

export function AssessmentLanding({ assessment, onClose, onStartQuiz, onStartAssignment, viewRole }: AssessmentComponentProps) {
  const isParent = viewRole === 'parent';
  return (
    <div className="flex-1 bg-[#FAFAFA] flex flex-col h-full overflow-hidden">
      <header className="px-8 py-6 bg-white border-b border-slate-100 flex items-center shrink-0">
        <button onClick={onClose} className="mr-4 p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-xl transition-colors shadow-none">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{assessment.title}</h1>
          <p className="text-sm font-medium text-slate-400">MATH 301 • Advanced Linear Algebra</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div className="w-full max-w-3xl bg-white border border-slate-100 rounded-3xl p-10 shadow-none">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10 pb-10 border-b border-slate-100">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Due</div>
              <div className="font-semibold text-slate-800">{assessment.dueDate}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Points</div>
              <div className="font-semibold text-slate-800">{assessment.totalPoints}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Time Limit</div>
              <div className="font-semibold text-slate-800">{assessment.timeLimit}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Attempts</div>
              <div className="font-semibold text-slate-800">1 Allowed</div>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Instructions</h3>
            <p className="text-slate-600 leading-relaxed">{assessment.instructions}</p>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={assessment.type === 'quiz' ? onStartQuiz : onStartAssignment}
              disabled={assessment.status !== 'NOT_STARTED' || isParent}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-base font-bold transition-all shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {assessment.status === 'NOT_STARTED' 
                ? (assessment.type === 'quiz' ? 'Start Quiz' : 'Start Assignment') 
                : (assessment.status === 'COMPLETED' ? 'Completed' : 'Pending Review')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuizEngine({ assessment, onClose, onComplete, viewRole }: AssessmentComponentProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const isParent = viewRole === 'parent';

  const questions = [
    { question: 'What is the determinant of a 2x2 identity matrix?', options: ['0', '1', '2', 'Undefined'] },
    { question: 'Which of the following is equivalent to A + B?', options: ['B * A', 'B - A', 'B + A', 'A * B'] },
    { question: 'What is the rank of an invertible n x n matrix?', options: ['0', '1', 'n - 1', 'n'] },
    { question: 'Eigenvectors of a symmetric matrix corresponding to distinct eigenvalues are:', options: ['Parallel', 'Orthogonal', 'Linearly dependent', 'Zero vectors'] },
    { question: 'What is the trace of a matrix?', options: ['The product of its diagonal elements', 'The sum of its diagonal elements', 'Its determinant', 'Its inverse'] }
  ];

  if (isSubmitted) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center h-full">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] text-center max-w-md w-full">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Quiz Completed Successfully!</h2>
          <p className="text-lg text-slate-600 font-medium mb-8">Score: 4/5</p>
          <button 
            onClick={() => {
              onClose();
            }} 
            className="w-full px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md transition-all"
          >
            Return to Assessments
          </button>
        </div>
      </div>
    );
  }

  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-start h-full">
      <div className="w-full max-w-3xl">
        <div className="mb-4">
          <div className="text-slate-500 font-medium font-sans">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="w-full h-2 bg-slate-200/50 rounded-full mt-2 overflow-hidden">
             <div 
               className="bg-indigo-600 h-full transition-all duration-500" 
               style={{ width: `${progressPercentage}%` }}
             ></div>
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] mt-6">
          <h2 className="text-2xl text-slate-800 font-bold mb-8">{questions[currentQuestionIndex].question}</h2>
          
          <div className="flex flex-col gap-4">
            {questions[currentQuestionIndex].options.map((opt) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === opt;
              return (
                <button 
                  key={opt}
                  onClick={() => !isParent && setSelectedAnswers({...selectedAnswers, [currentQuestionIndex]: opt})}
                  className={`flex flex-row items-center justify-between transition-all rounded-2xl p-5 text-lg font-medium text-left
                    ${isParent ? 'pointer-events-none opacity-80 cursor-default' : 'cursor-pointer'}
                    ${isSelected 
                      ? 'bg-indigo-600 border border-indigo-600 text-white shadow-lg hover:-translate-y-1' 
                      : 'bg-white/50 backdrop-blur-md border border-slate-200/80 text-slate-700 hover:bg-indigo-50/50 hover:border-indigo-200'}`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 size={24} className="text-white" />}
                </button>
              );
            })}
          </div>

          <div className="flex flex-row items-center justify-between mt-10 w-full">
            <button 
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="text-slate-500 hover:bg-slate-100 rounded-xl px-6 py-3 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {currentQuestionIndex < questions.length - 1 ? (
              <button 
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                disabled={!selectedAnswers[currentQuestionIndex] && !isParent}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-3 font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button 
                onClick={() => {
                  setIsSubmitted(true);
                  onComplete('COMPLETED', '4/5');
                }}
                disabled={(!selectedAnswers[currentQuestionIndex] && !isParent) || isParent}
                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-8 py-3 font-semibold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssignmentEngine({ assessment, onClose, onComplete, viewRole }: AssessmentComponentProps) {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [studentNote, setStudentNote] = useState('');
  const [isAssignmentSubmitted, setIsAssignmentSubmitted] = useState(false);
  const isParent = viewRole === 'parent';

  if (isAssignmentSubmitted) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center h-full">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] text-center max-w-md w-full">
          <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Assignment Submitted Successfully!</h2>
          <button 
            onClick={() => {
              onClose();
            }} 
            className="w-full text-slate-500 hover:bg-slate-100 px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Return to Assessments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full flex flex-col items-center justify-start h-full">
      <div className="w-full max-w-3xl">
        <div className="bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800">Advanced Matrix Applications Research</h2>
          <div className="flex flex-row items-center gap-4 mt-3 text-slate-500 text-sm font-medium">
            <span className="flex items-center gap-1.5"><BookOpen size={16} /> Linear Algebra</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5"><Calendar size={16} /> Due: Oct 25, 11:59 PM</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5"><Clock size={16} /> 15 Points</span>
          </div>
          <p className="text-slate-600 mt-4 leading-relaxed">
            Please upload your research in PDF format. Ensure all mathematical proofs are clearly formatted.
          </p>

          {!uploadedFile && !isParent ? (
            <div 
              className="mt-8 border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-10 flex flex-col items-center justify-center hover:bg-indigo-50/60 transition-all cursor-pointer"
              onClick={() => setUploadedFile('research_matrix_applications_final.pdf')}
            >
              <UploadCloud size={40} className="text-indigo-400 mb-4" />
              <p className="font-semibold text-slate-700">Drag & Drop your file here</p>
              <p className="text-sm text-slate-500 mt-1">or click to browse (PDF, DOCX max 10MB)</p>
            </div>
          ) : !uploadedFile && isParent ? (
            <div className="mt-8 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-10 flex flex-col items-center justify-center pointer-events-none opacity-80">
              <UploadCloud size={40} className="text-slate-400 mb-4" />
              <p className="font-semibold text-slate-600">Uploads restricted in Observer Mode</p>
            </div>
          ) : (
            <div className="mt-8 bg-white/60 border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <File size={24} className="text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{uploadedFile}</p>
                  <p className="text-xs text-slate-500 font-medium">1.2 MB</p>
                </div>
              </div>
              <button 
                onClick={() => setUploadedFile(null)}
                className="text-rose-500 hover:bg-rose-50 px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                Remove
              </button>
            </div>
          )}

          <label className="text-sm font-semibold text-slate-700 mt-8 mb-2 block">
            Add a comment to your teacher (Optional)
          </label>
          <textarea 
            value={studentNote}
            onChange={(e) => setStudentNote(e.target.value)}
            className="w-full bg-white/50 border border-slate-200 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
            placeholder="Type your note here..."
          />

          <div className="flex flex-row justify-end gap-4 mt-8">
            <button 
              onClick={onClose}
              className="text-slate-500 hover:bg-slate-100 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button 
              disabled={(!uploadedFile && !isParent) || isParent}
              onClick={() => {
                setIsAssignmentSubmitted(true);
                onComplete('PENDING_REVIEW', '-');
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
