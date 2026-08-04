'use client';

import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ClassSpaceFilterState } from '@/types/classSpace';

interface ClassSpaceHeaderProps {
  filters: ClassSpaceFilterState;
  onFilterChange: (newFilters: Partial<ClassSpaceFilterState>) => void;
  activeStudentsCount?: number;
  liveSessionsCount?: number;
  activeHomeworkCount?: number;
}

export function ClassSpaceHeader({
  filters,
  onFilterChange
}: ClassSpaceHeaderProps) {
  const gradePills = ['All', 'G4', 'G5', 'G6'];
  const [selectedGradePill, setSelectedGradePill] = useState('All');

  const classOptions = ['All Classes', 'Grade 10-A', 'Grade 10-B', 'Grade 11-A', 'Grade 12-A'];
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  const subjectPills = ['All Subjects', 'Mathematics', 'Science', 'Arabic', 'History'];
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 shadow-2xs">
      <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Grade Pills (All, G4, G5, G6) */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            {gradePills.map((g) => (
              <button
                key={g}
                onClick={() => {
                  setSelectedGradePill(g);
                  onFilterChange({ grade: g === 'All' ? 'Grade 10' : g });
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedGradePill === g
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Class Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
            >
              <span className="text-slate-400">🏫</span>
              <span>{filters.className || 'All Classes'}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isClassDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50">
                {classOptions.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onFilterChange({ className: c });
                      setIsClassDropdownOpen(false);
                    }}
                    className="w-full text-left px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                  >
                    <span>{c}</span>
                    {filters.className === c && <Check size={13} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 custom-scrollbar">
            {subjectPills.map((subj) => (
              <button
                key={subj}
                onClick={() => {
                  setSelectedSubject(subj);
                  onFilterChange({ subject: subj });
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedSubject === subj
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Far Right Badge */}
        <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200/60 px-3 py-1 rounded-full text-xs font-bold text-orange-700">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Math • All Grades</span>
        </div>
      </div>
    </div>
  );
}
