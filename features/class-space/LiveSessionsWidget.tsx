'use client';

import React from 'react';
import { Calendar, Plus, Video } from 'lucide-react';
import { LiveSession } from '@/types/classSpace';

interface LiveSessionsWidgetProps {
  sessions: LiveSession[];
  isLoading: boolean;
  onAddClick: () => void;
}

export function LiveSessionsWidget({
  sessions,
  isLoading,
  onAddClick
}: LiveSessionsWidgetProps) {
  const activeSession = sessions.find(s => s.status === 'live') || sessions.find(s => s.status === 'upcoming');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video size={18} className="text-rose-600" />
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 leading-none">Live Sessions</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">{sessions.length} Session{sessions.length === 1 ? '' : 's'} scheduled</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <Calendar size={16} />
          </button>
          <button
            onClick={onAddClick}
            title="Create Session"
            className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all shadow-xs"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Active/Upcoming Live Session Card */}
      {isLoading ? (
        <p className="text-xs text-slate-400 text-center py-4">Loading...</p>
      ) : !activeSession ? (
        <p className="text-xs text-slate-400 text-center py-4">No live sessions scheduled yet.</p>
      ) : (
        <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
              {activeSession.title}
            </h4>
            <span className={`font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${activeSession.status === 'live' ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {activeSession.status === 'live' ? 'LIVE' : 'UPCOMING'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            {new Date(activeSession.scheduledAt).toLocaleString()}
          </p>

          {activeSession.joinUrl && (
            <a
              href={activeSession.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98"
            >
              {activeSession.status === 'live' && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
              )}
              <span>{activeSession.status === 'live' ? 'Join Live Class Now' : 'View Session'}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
