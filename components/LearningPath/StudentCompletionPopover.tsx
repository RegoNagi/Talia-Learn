'use client';

import { useState, useEffect, startTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Send } from 'lucide-react';
import { getLessonCompletionDetails, LessonCompletionInfo } from '@/services/learningPathData';

interface StudentCompletionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string | null;
  classId: string;
  language?: 'ar' | 'en';
  anchorRect: DOMRect | null;
}

export function StudentCompletionPopover({ isOpen, onClose, lessonId, classId, language = 'en' }: StudentCompletionPopoverProps) {
  const isAr = language === 'ar';
  const [students, setStudents] = useState<LessonCompletionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nudgedStudents, setNudgedStudents] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !lessonId || !classId) return;
    startTransition(() => setIsLoading(true));
    getLessonCompletionDetails(lessonId, classId).then((data) => {
      setStudents(data);
      setIsLoading(false);
    });
  }, [isOpen, lessonId, classId]);

  const handleNudge = (studentId: string, studentName: string) => {
    setNudgedStudents(prev => {
      const newSet = new Set(prev);
      newSet.add(studentId);
      return newSet;
    });
    setShowToast(isAr ? `تم إرسال تذكير لـ ${studentName}` : `Nudge sent to ${studentName}`);
    setTimeout(() => setShowToast(null), 3000);
  };

  if (!isOpen) return null;

  const completedCount = students.filter((s) => s.completed).length;
  const totalCount = students.length;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden outline-none relative"
          onClick={(e) => e.stopPropagation()}
        >
              {/* Header */}
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{isAr ? 'تقدّم الطلاب' : 'Student Progress'}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{completedCount}/{totalCount} {isAr ? 'خلّصوا' : 'Completed'}</span>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 hover:bg-slate-200/50 rounded-full"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Scrollable List */}
              <div className="max-h-[350px] overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {isLoading ? (
                  <p className="text-center text-xs text-slate-400 py-8">{isAr ? 'جاري التحميل...' : 'Loading...'}</p>
                ) : students.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">{isAr ? 'مفيش طلاب في الفصل ده لسه' : 'No students in this class yet'}</p>
                ) : students.map(student => (
                  <div key={student.studentId} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-sm border border-indigo-100">
                        {(student.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-slate-700 leading-tight">{student.name || (isAr ? 'طالب' : 'Student')}</span>
                        <span className={`text-[10px] font-medium ${student.completed ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {student.completed ? (isAr ? 'خلّص' : 'Completed') : (isAr ? 'لسه' : 'In Progress')}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {student.completed ? (
                      <div className="w-8 h-8 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-full">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleNudge(student.studentId, student.name)}
                        disabled={nudgedStudents.has(student.studentId)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 relative overflow-hidden group/btn
                          ${nudgedStudents.has(student.studentId) 
                            ? 'bg-indigo-100 text-indigo-600' 
                            : 'bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white hover:shadow-md hover:shadow-indigo-200'
                          }`}
                        title={isAr ? 'إرسال تذكير' : 'Send Nudge'}
                      >
                        <AnimatePresence mode='wait'>
                          {nudgedStudents.has(student.studentId) ? (
                            <motion.div 
                              key="check"
                              initial={{ scale: 0, rotate: -45 }} 
                              animate={{ scale: 1, rotate: 0 }}
                              className="flex items-center justify-center"
                            >
                              <Check size={16} strokeWidth={3} />
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="send"
                              initial={{ scale: 1 }}
                              whileHover={{ scale: 1.1, x: 1, y: -1 }}
                              className="flex items-center justify-center"
                            >
                              <Send size={14} className="ml-0.5 mt-0.5" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[110] bg-slate-800 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 pointer-events-none"
          >
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
              <Send size={10} className="text-white ml-0.5 mt-0.5" />
            </div>
            {showToast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
