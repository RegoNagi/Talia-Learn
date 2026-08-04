'use client';

import React, { useState } from 'react';
import { CheckSquare, Bookmark, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HomeworkItem } from '@/types/classSpace';

interface HomeworkWidgetProps {
  homeworkList: HomeworkItem[];
  isLoading: boolean;
  onCreateHomework: (data: Omit<HomeworkItem, 'id' | 'submittedCount' | 'status'>) => void;
}

export function HomeworkWidget({
  homeworkList,
  isLoading,
  onCreateHomework
}: HomeworkWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateHomework({
      title,
      subject: 'Mathematics',
      grade: 'Grade 10',
      className: '10-A',
      dueDate: new Date().toISOString(),
      totalStudents: 28,
      instructions: ''
    });

    setTitle('');
    setIsModalOpen(false);
  };

  const sampleItems = [
    {
      id: 'hw-1',
      title: 'Matrix Transformations Works...',
      statusBadge: '4 To Grade',
      statusColor: 'bg-amber-100 text-amber-800',
      submissions: '22/28',
      points: '20 pts'
    },
    {
      id: 'hw-2',
      title: "Newton's 2nd Law Problem Set",
      statusBadge: 'Graded',
      statusColor: 'bg-emerald-100 text-emerald-800',
      submissions: '24/24',
      points: '30 pts'
    },
    {
      id: 'hw-3',
      title: 'Chemical Bonding Quiz Prep',
      statusBadge: '6 To Grade',
      statusColor: 'bg-amber-100 text-amber-800',
      submissions: '18/30',
      points: '15 pts'
    },
    {
      id: 'hw-4',
      title: 'Cellular Respiration Essay Draft',
      statusBadge: '2 To Grade',
      statusColor: 'bg-amber-100 text-amber-800',
      submissions: '14/28',
      points: '25 pts'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare size={18} className="text-indigo-600" />
          <h3 className="font-extrabold text-sm text-slate-900">Homework</h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <Bookmark size={16} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all shadow-xs"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Total Submissions Metric Box */}
      <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between mb-3">
        <div>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
            TOTAL HOMEWORK SUBMISSIONS
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-black text-slate-900">18</span>
            <span className="text-xs font-bold text-slate-400">/ 24</span>
          </div>
        </div>

        <span className="bg-white border border-slate-200 text-slate-800 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
          4 To Grade
        </span>
      </div>

      {/* Items Section Header */}
      <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
        HOMEWORK REQUIRING GRADING
      </div>

      {/* Homework Items */}
      <div className="space-y-2">
        {sampleItems.map((item) => (
          <div
            key={item.id}
            className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-slate-900 truncate">{item.title}</h4>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${item.statusColor}`}>
                  {item.statusBadge}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                <span>Submissions: <strong className="text-slate-700">{item.submissions}</strong></span>
              </div>
            </div>

            <span className="text-[10px] font-bold text-slate-400 shrink-0">{item.points}</span>
          </div>
        ))}
      </div>

      {/* Create Homework Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckSquare size={18} />
                  <h3 className="font-extrabold text-sm">New Homework Assignment</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Matrix Transformations Problem Set"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Create Assignment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
