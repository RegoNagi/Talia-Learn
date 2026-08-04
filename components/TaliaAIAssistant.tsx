'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Zap, FileText, BarChart2, Lightbulb } from 'lucide-react';

export function TaliaAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const quickActions = [
    { label: 'Summarize Feed', icon: <Zap size={12} /> },
    { label: 'Draft Announcement', icon: <FileText size={12} /> },
    { label: 'Student Insights', icon: <BarChart2 size={12} /> },
    { label: 'Generate Quiz', icon: <Lightbulb size={12} /> },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-28 right-8 w-80 sm:w-96 h-[500px] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center gap-1.5">
                  <Sparkles size={16} className="text-violet-600" /> Talia AI
                </span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4 custom-scrollbar">
              {/* AI Greeting */}
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles size={16} />
                </div>
                <div className="bg-white border border-slate-100 text-slate-700 p-3 rounded-2xl rounded-tl-sm shadow-sm text-sm leading-relaxed">
                  Hello Alex! I am Talia, your teaching assistant. How can I help you manage the Advanced Linear Algebra class today?
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 pl-10">
                {quickActions.map((action, idx) => (
                  <button 
                    key={idx}
                    className="bg-violet-50 text-violet-700 hover:bg-violet-100 text-[11px] font-medium py-1.5 px-3 rounded-full border border-violet-100 cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    {action.icon} {action.label}
                  </button>
                ))}
              </div>

              {/* Mock Interaction - User */}
              <div className="flex justify-end gap-2">
                <div className="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[80%]">
                  Summarize today&apos;s feed.
                </div>
              </div>

              {/* Mock Interaction - AI Response */}
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles size={16} />
                </div>
                <div className="bg-white border border-slate-100 text-slate-700 p-3 rounded-2xl rounded-tl-sm shadow-sm text-sm leading-relaxed">
                  Sure! Today, 3 students asked for help visualizing Eigenvectors. Sarah Miller uploaded a helpful video resource. I recommend addressing Eigenvectors in tomorrow&apos;s live session.
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask Talia..."
                  className="w-full bg-slate-50 border-none outline-none focus:ring-2 focus:ring-violet-500/10 text-sm rounded-full px-4 py-2.5 transition-all"
                />
              </div>
              <button 
                className="bg-violet-600 hover:bg-violet-700 text-white w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-lg shadow-violet-200 transition-all active:scale-90"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-xl flex items-center justify-center hover:scale-110 hover:-rotate-6 active:scale-95 transition-all relative group shadow-violet-200/50 ${isOpen ? 'rotate-90' : ''}`}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="group-hover:scale-110 transition-transform" />}
      </button>
    </div>
  );
}
