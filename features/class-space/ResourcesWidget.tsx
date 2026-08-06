'use client';

import React from 'react';
import { Bookmark, Search, Download, BookOpen } from 'lucide-react';
import { ResourceItem } from '@/types/classSpace';

interface ResourcesWidgetProps {
  resources: ResourceItem[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  onGoToLibrary?: () => void;
}

export function ResourcesWidget({
  resources,
  isLoading,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onGoToLibrary
}: ResourcesWidgetProps) {
  const typeBgMap: Record<string, string> = {
    PDF: 'bg-emerald-100 text-emerald-800',
    VIDEO: 'bg-teal-100 text-teal-800',
    AUDIO: 'bg-purple-100 text-purple-800',
    SCORM: 'bg-indigo-100 text-indigo-800',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark size={18} className="text-emerald-600" />
          <h3 className="font-extrabold text-sm text-slate-900">Important Resources</h3>
        </div>

        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
          {resources.length} items
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search files, SCORM..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500"
        />
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {isLoading ? (
          <p className="text-xs text-slate-400 text-center py-4">Loading...</p>
        ) : resources.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No resources yet.</p>
        ) : resources.map((res) => (
          <a
            key={res.id}
            href={res.url || undefined}
            target="_blank"
            rel="noreferrer"
            className="block p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-100/60 transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${typeBgMap[res.type] || 'bg-slate-100 text-slate-700'}`}>
                {res.type}
              </span>
              {res.fileSize && <span className="text-[10px] text-slate-400 font-semibold">{res.fileSize}</span>}
            </div>

            <h4 className="font-bold text-xs text-slate-900 leading-tight mb-1">{res.title}</h4>

            <div className="flex items-center justify-end pt-1">
              <span className="text-xs font-extrabold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
                <Download size={12} /> Get
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Button */}
      {onGoToLibrary && (
        <button onClick={onGoToLibrary} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98">
          <BookOpen size={14} />
          <span>Go to Content Library</span>
        </button>
      )}
    </div>
  );
}
