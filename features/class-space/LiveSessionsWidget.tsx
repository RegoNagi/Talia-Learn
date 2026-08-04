'use client';

import React, { useState } from 'react';
import { Radio, Calendar, Plus, Video, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveSession } from '@/types/classSpace';

interface LiveSessionsWidgetProps {
  sessions: LiveSession[];
  isLoading: boolean;
  onScheduleSession: (sessionData: Omit<LiveSession, 'id' | 'hostName' | 'hostAvatar' | 'status'>) => void;
}

export function LiveSessionsWidget({
  sessions,
  isLoading,
  onScheduleSession
}: LiveSessionsWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');

  const handleSubmitModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onScheduleSession({
      title,
      subject,
      grade: 'Grade 10',
      className: '10-A',
      scheduledAt: new Date().toISOString(),
      durationMinutes: 45
    });

    setTitle('');
    setIsModalOpen(false);
  };

  const activeSession = sessions.find(s => s.status === 'live') || sessions[0] || {
    id: 'ls-mock',
    title: 'Live Q&A: Matrix Multiplication Tricks',
    status: 'live',
    hostName: 'Ms. Sarah Jenkins',
    joinUrl: '#'
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Video size={18} className="text-rose-600" />
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 leading-none">Live Sessions</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-1">1 Sessions scheduled</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <Calendar size={16} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-all shadow-xs"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Main Active Live Session Card Inside */}
      <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-extrabold text-xs text-slate-900 leading-snug">
            {activeSession.title}
          </h4>
          <span className="bg-rose-600 text-white font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0">
            LIVE
          </span>
        </div>

        <p className="text-[11px] text-slate-500 font-medium">
          Host: {activeSession.hostName}
        </p>

        <a
          href={activeSession.joinUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span>Join Live Class Now</span>
        </a>
      </div>

      {/* Scheduler Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-rose-600 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Radio size={18} />
                  <h3 className="font-extrabold text-sm">Schedule Live Broadcast</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmitModal} className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Broadcast Topic Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Matrix Multiplication Live Q&A"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-rose-500"
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
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Schedule Stream
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
