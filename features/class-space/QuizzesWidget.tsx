'use client';

import React, { useState } from 'react';
import { Zap, Bookmark, Plus, X, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizItem } from '@/types/classSpace';

interface QuizzesWidgetProps {
  quizzes: QuizItem[];
  isLoading: boolean;
  onCreateQuiz: (data: Omit<QuizItem, 'id' | 'submissionsCount'>) => void;
}

export function QuizzesWidget({
  quizzes,
  isLoading,
  onCreateQuiz
}: QuizzesWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onCreateQuiz({
      title,
      subject: 'Mathematics',
      grade: 'Grade 10',
      className: '10-A',
      durationMinutes: 15,
      totalQuestions: 10,
      totalPoints: 50,
      status: 'published'
    });

    setTitle('');
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-amber-500 fill-amber-500" />
          <h3 className="font-extrabold text-sm text-slate-900">Quizzes</h3>
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

      {/* Total Submissions Box */}
      <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between mb-3">
        <div>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
            TOTAL QUIZ SUBMISSIONS
          </span>
          <span className="text-2xl font-black text-slate-900 block mt-0.5">142</span>
        </div>

        <span className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
          1 Active Quizzes
        </span>
      </div>

      {/* Top Performers Card */}
      <div className="p-3 rounded-xl border border-amber-100 bg-amber-50/40 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider flex items-center gap-1">
            <Trophy size={11} className="text-amber-600" /> TOP PERFORMERS (MATH)
          </span>
          <span className="text-[9px] font-bold text-amber-700">Quiz Leaders</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-1.5 rounded-lg bg-white border border-amber-200/60 shadow-2xs">
            <span className="text-[10px] font-extrabold text-amber-600 block">🥇 1st</span>
            <span className="text-xs font-bold text-slate-800 block truncate">Emma T.</span>
            <span className="text-[10px] font-black text-emerald-600">100%</span>
          </div>

          <div className="p-1.5 rounded-lg bg-white border border-amber-200/60 shadow-2xs">
            <span className="text-[10px] font-extrabold text-slate-400 block">🥈 2nd</span>
            <span className="text-xs font-bold text-slate-800 block truncate">Alex J.</span>
            <span className="text-[10px] font-black text-emerald-600">98%</span>
          </div>

          <div className="p-1.5 rounded-lg bg-white border border-amber-200/60 shadow-2xs">
            <span className="text-[10px] font-extrabold text-amber-700 block">🥉 3rd</span>
            <span className="text-xs font-bold text-slate-800 block truncate">Liam C.</span>
            <span className="text-[10px] font-black text-emerald-600">95%</span>
          </div>
        </div>
      </div>

      {/* Quiz Item */}
      <div className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-bold text-xs text-slate-900 truncate">Unit 1: Matrix Algebra Diagnostic</h4>
          <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
            Diagnostic
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-1">
          <span>15 mins • 50 pts • Active Now</span>
          <strong className="text-indigo-600">28 Submissions</strong>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-amber-600 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap size={18} />
                  <h3 className="font-extrabold text-sm">Create Diagnostic Quiz</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quiz Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Unit 1 Diagnostic Quiz"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-amber-500"
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
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Publish Quiz
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
