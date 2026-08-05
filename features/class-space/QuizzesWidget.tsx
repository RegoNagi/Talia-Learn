'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Bookmark, Plus } from 'lucide-react';
import { QuizItem } from '@/types/classSpace';

interface QuizzesWidgetProps {
  quizzes: QuizItem[];
  isLoading: boolean;
  onCreateQuiz: (data: Omit<QuizItem, 'id' | 'submissionsCount'>) => void;
  classId?: string;
  subject?: string;
}

export function QuizzesWidget({
  quizzes,
  isLoading,
  classId,
  subject,
}: QuizzesWidgetProps) {
  const router = useRouter();

  const goToQuizBuilder = () => {
    const from = typeof window !== 'undefined' ? encodeURIComponent(window.location.pathname + window.location.search) : '';
    router.push(`/assessment-builder?type=quiz&classId=${classId || ''}&subject=${encodeURIComponent(subject || '')}&from=${from}`);
  };

  const activeCount = quizzes.filter((q) => q.status === 'published').length;
  const totalSubmissions = quizzes.reduce((sum, q) => sum + q.submissionsCount, 0);

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
            onClick={goToQuizBuilder}
            title="Create Quiz"
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
          <span className="text-2xl font-black text-slate-900 block mt-0.5">{totalSubmissions}</span>
        </div>

        <span className="bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
          {activeCount} Active Quizzes
        </span>
      </div>

      {/* Real quiz list */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading...</p>
        ) : quizzes.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No quizzes yet.</p>
        ) : quizzes.map((q) => (
          <div key={q.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-bold text-xs text-slate-900 truncate">{q.title}</h4>
              <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${q.status === 'published' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                {q.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-1">
              <span>{q.totalQuestions} questions • {q.totalPoints} pts</span>
              <strong className="text-indigo-600">{q.submissionsCount} Submissions</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
