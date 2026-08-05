'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Trophy, 
  AlertTriangle, 
  Eye, 
  BookOpen
} from 'lucide-react';
import { getGradebookConfigFull, getRealAssessments, getRealGradeEntries } from '@/services/gradebookSync';
import { getClassRoster } from '@/services/assignmentData';

interface StudentGradeItem {
  rank: number;
  id: string;
  name: string;
  total: number;
}

interface GradingWidgetProps {
  classId?: string;
  subject?: string;
  grade?: string;
}

export function GradingWidget({ classId, subject, grade }: GradingWidgetProps) {
  const router = useRouter();
  const [activeSubTab, setActiveSubTab] = useState<'top5' | 'atRisk'>('top5');
  const [isLoading, setIsLoading] = useState(true);
  const [ranked, setRanked] = useState<StudentGradeItem[]>([]);
  const [passingScore, setPassingScore] = useState(60);

  useEffect(() => {
    if (!classId || !subject || !grade) { setIsLoading(false); return; }
    setIsLoading(true);
    (async () => {
      const config = await getGradebookConfigFull(subject, grade);
      if (!config) { setIsLoading(false); setRanked([]); return; }
      setPassingScore(config.passingScore || 60);

      const [assessments, entries, roster] = await Promise.all([
        getRealAssessments(config.id),
        getRealGradeEntries(config.id),
        getClassRoster(classId),
      ]);

      const categories = Array.from(new Set(assessments.map((a) => a.category)));
      const entryMap: Record<string, Record<string, number | null>> = {};
      for (const e of entries) {
        if (!entryMap[e.studentId]) entryMap[e.studentId] = {};
        entryMap[e.studentId][e.assessmentId] = e.score;
      }

      const computeTotal = (studentEntries: Record<string, number | null>) => {
        let total = 0;
        let totalWeight = 0;
        for (const cat of categories) {
          const catAssessments = assessments.filter((a) => a.category === cat);
          const weight = config.categoryWeights[cat] || 0;
          if (weight === 0 || catAssessments.length === 0) continue;
          const sumScore = catAssessments.reduce((s, a) => s + (studentEntries[a.id] ?? 0), 0);
          const sumMax = catAssessments.reduce((s, a) => s + a.maxScore, 0);
          if (sumMax === 0) continue;
          total += (sumScore / sumMax) * weight;
          totalWeight += weight;
        }
        return totalWeight > 0 ? (total / totalWeight) * 100 : null;
      };

      const results = roster
        .map((s) => ({ id: s.id, name: s.name, total: computeTotal(entryMap[s.id] || {}) }))
        .filter((r): r is { id: string; name: string; total: number } => r.total !== null)
        .sort((a, b) => b.total - a.total)
        .map((r, i) => ({ rank: i + 1, id: r.id, name: r.name, total: r.total }));

      setRanked(results);
      setIsLoading(false);
    })();
  }, [classId, subject, grade]);

  const top5 = ranked.slice(0, 5);
  const atRisk = ranked.filter((r) => r.total < passingScore).slice(-5).reverse().map((r, i) => ({ ...r, rank: i + 1 }));
  const currentList = activeSubTab === 'top5' ? top5 : atRisk;

  if (!classId || !subject) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 size={18} className="text-indigo-600" />
          <h3 className="font-extrabold text-sm text-slate-900">Grading</h3>
        </div>
        <p className="text-xs text-slate-400">Select a class and subject above to see grading data.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-indigo-600" />
          <h3 className="font-extrabold text-sm text-slate-900">Grading</h3>
        </div>
        <button onClick={() => router.push(`/courses/${classId}__${encodeURIComponent(subject || '')}?tab=gradebook`)} className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          Full View <Eye size={12} />
        </button>
      </div>

      <div className="text-[11px] text-slate-400 font-bold mb-3">
        Subject: <span className="text-slate-700">{subject}</span>
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
          <span>At Risk</span>
        </button>
      </div>

      <div className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider mb-2.5">
        {activeSubTab === 'top5' ? 'Top Performing Students' : 'Students Requiring Support'}
      </div>

      {/* Student List */}
      <div className="space-y-2 mb-4">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading...</p>
        ) : currentList.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No graded data yet.</p>
        ) : currentList.map((st) => (
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
              <h4 className="font-bold text-xs text-slate-900 leading-tight">{st.name}</h4>
            </div>

            <span className={`text-xs font-black ${activeSubTab === 'top5' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {st.total.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      {/* Footer Button */}
      <button onClick={() => router.push(`/courses/${classId}__${encodeURIComponent(subject || '')}?tab=gradebook`)} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98">
        <BookOpen size={14} />
        <span>Open Full Gradebook</span>
      </button>
    </div>
  );
}
