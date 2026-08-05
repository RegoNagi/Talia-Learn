'use client';

import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ClassSpaceFilterState } from '@/types/classSpace';

interface RealClass {
  id: string;
  name: string;
  gradeLevel: string;
}

interface ClassSpaceHeaderProps {
  filters: ClassSpaceFilterState;
  onFilterChange: (newFilters: Partial<ClassSpaceFilterState>) => void;
  activeStudentsCount?: number;
  liveSessionsCount?: number;
  activeHomeworkCount?: number;
  myClasses?: RealClass[];
  mySubjects?: string[];
  activeClassId?: string;
  activeSubject?: string;
  onSelectClass?: (cls: RealClass) => void;
  onSelectSubject?: (subject: string) => void;
}

export function ClassSpaceHeader({
  myClasses = [],
  mySubjects = [],
  activeClassId,
  activeSubject,
  onSelectClass,
  onSelectSubject,
}: ClassSpaceHeaderProps) {
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  const grades = Array.from(new Set(myClasses.map((c) => c.gradeLevel))).filter(Boolean);
  const [selectedGrade, setSelectedGrade] = useState<string>('All');

  const activeClass = myClasses.find((c) => c.id === activeClassId);
  const visibleClasses = selectedGrade === 'All' ? myClasses : myClasses.filter((c) => c.gradeLevel === selectedGrade);

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-2xs">
      <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Grade Pills (real grades from your classes) */}
          {grades.length > 0 && (
            <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
              {['All', ...grades].map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedGrade === g
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}

          {/* Class Dropdown (real classes) */}
          <div className="relative">
            <button
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <span className="text-slate-400">🏫</span>
              <span>{activeClass?.name || 'Select Class'}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isClassDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 max-h-72 overflow-y-auto">
                {visibleClasses.length === 0 && (
                  <p className="px-3.5 py-2 text-xs text-slate-400">No classes found.</p>
                )}
                {visibleClasses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onSelectClass?.(c);
                      setIsClassDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>{c.name}</span>
                    {activeClassId === c.id && <Check size={13} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject Pills (real subjects you teach) */}
          {mySubjects.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 custom-scrollbar">
              {mySubjects.map((subj) => (
                <button
                  key={subj}
                  onClick={() => onSelectSubject?.(subj)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeSubject === subj
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Far Right Badge */}
        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200/60 px-3 py-1 rounded-full text-xs font-bold text-orange-700">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>{activeSubject || 'No subject'} • {activeClass?.name || 'No class'}</span>
        </div>
      </div>
    </div>
  );
}
