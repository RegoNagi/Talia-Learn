'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Send } from 'lucide-react';
import Image from 'next/image';

interface Student {
  id: string;
  name: string;
  avatar: string;
  status: 'completed' | 'pending' | 'late' | 'missed';
  lastActive?: string;
}

interface StudentCompletionPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  completedCount: number;
  totalCount: number;
  anchorRect: DOMRect | null;
}

export function StudentCompletionPopover({ isOpen, onClose, completedCount, totalCount }: StudentCompletionPopoverProps) {
  const [nudgedStudents, setNudgedStudents] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState<string | null>(null);

  // 15 Mock students with varied statuses
  const students: Student[] = [
    { id: '1', name: 'Alice Johnson', avatar: 'https://picsum.photos/seed/alice/32/32', status: 'completed', lastActive: '2m ago' },
    { id: '2', name: 'Bob Smith', avatar: 'https://picsum.photos/seed/bob/32/32', status: 'completed', lastActive: '15m ago' },
    { id: '3', name: 'Charlie Brown', avatar: 'https://picsum.photos/seed/charlie/32/32', status: 'late', lastActive: '2d ago' },
    { id: '4', name: 'Diana Prince', avatar: 'https://picsum.photos/seed/diana/32/32', status: 'completed', lastActive: '1h ago' },
    { id: '5', name: 'Evan Wright', avatar: 'https://picsum.photos/seed/evan/32/32', status: 'pending', lastActive: '5m ago' },
    { id: '6', name: 'Fiona Gallagher', avatar: 'https://picsum.photos/seed/fiona/32/32', status: 'missed', lastActive: '3d ago' },
    { id: '7', name: 'George Harris', avatar: 'https://picsum.photos/seed/george/32/32', status: 'pending', lastActive: '1d ago' },
    { id: '8', name: 'Hannah Lee', avatar: 'https://picsum.photos/seed/hannah/32/32', status: 'completed', lastActive: '3h ago' },
    { id: '9', name: 'Ian Curtis', avatar: 'https://picsum.photos/seed/ian/32/32', status: 'late', lastActive: '4d ago' },
    { id: '10', name: 'Julia Roberts', avatar: 'https://picsum.photos/seed/julia/32/32', status: 'completed', lastActive: '10m ago' },
    { id: '11', name: 'Kevin Bacon', avatar: 'https://picsum.photos/seed/kevin/32/32', status: 'pending', lastActive: '30m ago' },
    { id: '12', name: 'Laura Palmer', avatar: 'https://picsum.photos/seed/laura/32/32', status: 'missed', lastActive: '1w ago' },
    { id: '13', name: 'Mike Ross', avatar: 'https://picsum.photos/seed/mike/32/32', status: 'completed', lastActive: '1h ago' },
    { id: '14', name: 'Nina Simone', avatar: 'https://picsum.photos/seed/nina/32/32', status: 'completed', lastActive: '2h ago' },
    { id: '15', name: 'Oscar Wilde', avatar: 'https://picsum.photos/seed/oscar/32/32', status: 'late', lastActive: '5d ago' },
  ];

  const handleNudge = (studentId: string, studentName: string) => {
    setNudgedStudents(prev => {
      const newSet = new Set(prev);
      newSet.add(studentId);
      return newSet;
    });
    setShowToast(`Nudge sent to ${studentName}`);
    setTimeout(() => setShowToast(null), 3000);
  };

  if (!isOpen) return null;

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
                  <h4 className="font-bold text-slate-800 text-sm">Student Progress</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{completedCount}/{totalCount} Completed</span>
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
                {students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-slate-100 overflow-hidden relative border border-slate-100">
                           <Image 
                             src={student.avatar} 
                             alt={student.name} 
                             fill
                             className="object-cover"
                             referrerPolicy="no-referrer"
                           />
                        </div>
                        {/* Status Indicator Dots */}
                        {(student.status === 'late' || student.status === 'missed') && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center">
                            <span className="sr-only">Late</span>
                          </div>
                        )}
                        {student.status === 'pending' && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 border-2 border-white rounded-full">
                            <span className="sr-only">Pending</span>
                          </div>
                        )}
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-slate-700 leading-tight">{student.name}</span>
                        <span className={`text-[10px] font-medium ${
                          student.status === 'late' || student.status === 'missed' ? 'text-rose-500' : 
                          student.status === 'pending' ? 'text-amber-500' : 'text-emerald-600'
                        }`}>
                          {student.status === 'late' ? 'Overdue' : 
                           student.status === 'missed' ? 'Missed' :
                           student.status === 'pending' ? 'In Progress' : 'Completed'}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {student.status === 'completed' ? (
                      <div className="w-8 h-8 flex items-center justify-center text-emerald-500 bg-emerald-50 rounded-full">
                        <Check size={16} strokeWidth={3} />
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleNudge(student.id, student.name)}
                        disabled={nudgedStudents.has(student.id)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 relative overflow-hidden group/btn
                          ${nudgedStudents.has(student.id) 
                            ? 'bg-indigo-100 text-indigo-600' 
                            : 'bg-slate-100 text-slate-400 hover:bg-indigo-600 hover:text-white hover:shadow-md hover:shadow-indigo-200'
                          }`}
                        title="Send Nudge"
                      >
                        <AnimatePresence mode='wait'>
                          {nudgedStudents.has(student.id) ? (
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
              
              {/* Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
                  View Full Gradebook
                </button>
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
