'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { createSchoolAnnouncement } from '@/services/classSpaceData';

export function CreateAnnouncementPanel({ isOpen, onClose, creatorId, creatorRole, onSaved }: { isOpen: boolean; onClose: () => void; creatorId: string; creatorRole: string; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setTitle(''); setContent(''); setError(''); };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!creatorId || !title.trim() || !content.trim()) return;
    setIsSaving(true);
    setError('');
    const { ok, error: err } = await createSchoolAnnouncement({ creatorId, creatorRole, title: title.trim(), content: content.trim(), status });
    setIsSaving(false);
    if (ok) {
      reset();
      onClose();
      onSaved();
    } else {
      setError(err || 'Unknown error');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-slate-900/40 z-[150]" />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[160] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">New Announcement</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Winter Break Schedule" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} placeholder="Write the announcement..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              {error && <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">{error}</p>}
            </div>
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button onClick={() => handleSave('draft')} disabled={!title.trim() || !content.trim() || isSaving} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 rounded-xl font-bold transition-colors">
                Save Draft
              </button>
              <button onClick={() => handleSave('published')} disabled={!title.trim() || !content.trim() || isSaving} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-bold transition-colors">
                {isSaving ? 'Saving...' : 'Publish'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
