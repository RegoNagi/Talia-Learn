'use client';

import React from 'react';
import { CheckSquare, Bookmark, Plus } from 'lucide-react';
import { HomeworkItem } from '@/types/classSpace';

interface HomeworkWidgetProps {
  homeworkList: HomeworkItem[];
  isLoading: boolean;
  onAddClick: () => void;
}

export function HomeworkWidget({
  homeworkList,
  isLoading,
  onAddClick
}: HomeworkWidgetProps) {
  const totalSubmitted = homeworkList.reduce((sum, h) => sum + h.submittedCount, 0);
  const totalStudents = homeworkList.reduce((sum, h) => sum + h.totalStudents, 0);
  const toGradeCount = homeworkList.filter((h) => h.status === 'grading').length;

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
            onClick={onAddClick}
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
            <span className="text-2xl font-black text-slate-900">{totalSubmitted}</span>
            <span className="text-xs font-bold text-slate-400">/ {totalStudents}</span>
          </div>
        </div>

        <span className="bg-white border border-slate-200 text-slate-800 text-xs font-extrabold px-3 py-1.5 rounded-xl shadow-2xs">
          {toGradeCount} To Grade
        </span>
      </div>

      {/* Items Section Header */}
      <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2">
        HOMEWORK
      </div>

      {/* Homework Items */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading...</p>
        ) : homeworkList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No homework yet.</p>
        ) : homeworkList.map((item) => (
          <div
            key={item.id}
            className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors flex items-center justify-between gap-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-slate-900 truncate">{item.title}</h4>
                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shrink-0 ${
                  item.status === 'grading' ? 'bg-amber-100 text-amber-800' : item.status === 'closed' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {item.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                <span>Submissions: <strong className="text-slate-700">{item.submittedCount}/{item.totalStudents}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
