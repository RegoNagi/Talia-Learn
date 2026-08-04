'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  BarChart3, 
  Trophy, 
  AlertTriangle, 
  Eye, 
  ChevronRight, 
  GraduationCap,
  Award,
  BookOpen
} from 'lucide-react';

interface StudentGradeItem {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  gpa: string;
  scorePercentage: number;
  gradeBadge: string;
}

export function GradingWidget() {
  const [activeSubTab, setActiveSubTab] = useState<'top5' | 'atRisk'>('top5');

  const topStudents: StudentGradeItem[] = [
    {
      rank: 1,
      id: 'st-1',
      name: 'Emma Thompson',
      avatar: 'https://picsum.photos/seed/emma/100',
      gpa: '3.98',
      scorePercentage: 98,
      gradeBadge: 'A+'
    },
    {
      rank: 2,
      id: 'st-2',
      name: 'Alex Johnson',
      avatar: 'https://picsum.photos/seed/alex/100',
      gpa: '3.90',
      scorePercentage: 95,
      gradeBadge: 'A'
    },
    {
      rank: 3,
      id: 'st-3',
      name: 'Liam Chen',
      avatar: 'https://picsum.photos/seed/liam/100',
      gpa: '3.85',
      scorePercentage: 93,
      gradeBadge: 'A'
    },
    {
      rank: 4,
      id: 'st-4',
      name: 'Sophia Rodriguez',
      avatar: 'https://picsum.photos/seed/sophia/100',
      gpa: '3.78',
      scorePercentage: 91,
      gradeBadge: 'A-'
    },
    {
      rank: 5,
      id: 'st-5',
      name: 'Marcus Vance',
      avatar: 'https://picsum.photos/seed/marcus/100',
      gpa: '3.70',
      scorePercentage: 89,
      gradeBadge: 'B+'
    }
  ];

  const atRiskStudents: StudentGradeItem[] = [
    {
      rank: 1,
      id: 'st-6',
      name: 'Noah Smith',
      avatar: 'https://picsum.photos/seed/noah/100',
      gpa: '2.10',
      scorePercentage: 62,
      gradeBadge: 'D+'
    },
    {
      rank: 2,
      id: 'st-7',
      name: 'Jacob Miller',
      avatar: 'https://picsum.photos/seed/jacob/100',
      gpa: '2.25',
      scorePercentage: 65,
      gradeBadge: 'C-'
    },
    {
      rank: 3,
      id: 'st-8',
      name: 'Chloe Davis',
      avatar: 'https://picsum.photos/seed/chloe/100',
      gpa: '2.40',
      scorePercentage: 68,
      gradeBadge: 'C'
    }
  ];

  const currentList = activeSubTab === 'top5' ? topStudents : atRiskStudents;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-indigo-600" />
          <h3 className="font-extrabold text-sm text-slate-900">Grading</h3>
        </div>
        <button className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          Full View <Eye size={12} />
        </button>
      </div>

      <div className="text-[11px] text-slate-400 font-bold mb-3">
        Subject: <span className="text-slate-700">Math</span>
      </div>

      {/* Tabs */}
      <div className="bg-slate-100/80 p-1 rounded-xl flex gap-1 mb-3">
        <button
          onClick={() => setActiveSubTab('top5')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'top5'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy size={13} className="text-amber-500" />
          <span>Top 5</span>
        </button>

        <button
          onClick={() => setActiveSubTab('atRisk')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeSubTab === 'atRisk'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle size={13} className="text-rose-500" />
          <span>5 At Risk</span>
        </button>
      </div>

      <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2.5">
        {activeSubTab === 'top5' ? 'Top 5 Performing Students' : 'Students Requiring Support'}
      </div>

      {/* Student List */}
      <div className="space-y-2 mb-4">
        {currentList.map((st) => (
          <div
            key={st.id}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 hover:bg-slate-100/80 transition-colors border border-slate-100"
          >
            <div className="flex items-center gap-2.5">
              <span className={`text-[10px] font-black w-4 text-center ${
                st.rank === 1 ? 'text-amber-500' : st.rank === 2 ? 'text-slate-400' : st.rank === 3 ? 'text-amber-700' : 'text-slate-400'
              }`}>
                #{st.rank}
              </span>
              <div className="w-7 h-7 rounded-full bg-slate-200 relative overflow-hidden shrink-0">
                <Image src={st.avatar} alt={st.name} fill className="object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 leading-tight">{st.name}</h4>
                <span className="text-[10px] text-slate-400 font-semibold">GPA: {st.gpa}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-black ${activeSubTab === 'top5' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {st.scorePercentage}%
              </span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${
                activeSubTab === 'top5' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {st.gradeBadge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Button */}
      <button className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98">
        <BookOpen size={14} />
        <span>Open Full Gradebook</span>
      </button>
    </div>
  );
}
