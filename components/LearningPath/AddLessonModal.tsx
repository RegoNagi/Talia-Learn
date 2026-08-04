'use client';

import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';
import { X, UploadCloud, Link as LinkIcon, FileText, PlayCircle, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AddLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (lesson: { title: string; type: 'video' | 'pdf'; duration: string; source: 'custom'; url?: string; file?: File | null }) => void;
  unitTitle: string;
}

export function AddLessonModal({ isOpen, onClose, onAdd, unitTitle }: AddLessonModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const [contentType, setContentType] = useState<'video' | 'pdf'>('pdf');
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSubmit = async () => {
    if (!title) return; // Basic validation
    setIsSaving(true);
    await onAdd({
      title,
      type: contentType,
      duration: duration || '5 mins', // Default if empty
      source: 'custom',
      url: activeTab === 'link' ? url : undefined,
      file: activeTab === 'upload' ? selectedFile : null,
    });
    setIsSaving(false);
    // Reset form
    setTitle('');
    setDuration('');
    setUrl('');
    setSelectedFile(null);
    onClose();
  };

  if (!mounted) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-[#FAFAFA] rounded-[24px] shadow-2xl border border-white/50 z-[110] overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Add Topic Material</h3>
                <p className="text-sm text-slate-500 mt-1">Adding to <span className="font-medium text-slate-700">{unitTitle}</span></p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              
              {/* Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2
                    ${activeTab === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <UploadCloud size={16} /> Upload File
                </button>
                <button
                  onClick={() => setActiveTab('link')}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2
                    ${activeTab === 'link' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <LinkIcon size={16} /> External Link
                </button>
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Topic Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Introduction to Linear Algebra" 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Content Type</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setContentType('pdf')}
                        className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all
                          ${contentType === 'pdf' 
                            ? 'bg-blue-50 border-blue-200 text-blue-600' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        <FileText size={16} /> PDF
                      </button>
                      <button
                        onClick={() => setContentType('video')}
                        className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all
                          ${contentType === 'video' 
                            ? 'bg-red-50 border-red-200 text-red-600' 
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        <PlayCircle size={16} /> Video
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Duration</label>
                    <input 
                      type="text" 
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 15 mins" 
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Dynamic Input based on Tab */}
                {activeTab === 'upload' ? (
                  <label className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white hover:border-indigo-200 transition-all cursor-pointer group bg-slate-50/50 block">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UploadCloud size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-700">{selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, MP4, or MOV (max. 50MB)</p>
                    <input
                      type="file"
                      accept={contentType === 'pdf' ? '.pdf' : '.mp4,.mov,video/*'}
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Resource URL</label>
                    <div className="relative">
                      <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..." 
                        className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmit}
                disabled={!title || isSaving}
                className={`px-6 py-2.5 rounded-xl text-white font-medium shadow-lg text-sm flex items-center gap-2 transition-all
                  ${!title || isSaving
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5'}`}
              >
                <CheckCircle2 size={18} /> {isSaving ? 'Saving...' : 'Add Topic'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}

