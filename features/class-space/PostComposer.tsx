'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { 
  Zap, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Send 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, AIChallenge } from '@/types/classSpace';
import { uploadAssignmentAttachment, getSubmissionFileUrl } from '@/services/assignmentData';

interface PostComposerProps {
  currentUser: User | null;
  onPublishPost: (postData: {
    content: string;
    topicTag?: string;
    media?: any;
    type?: 'standard' | 'challenge';
    challenge?: AIChallenge;
  }) => void;
}

export function PostComposer({ currentUser, onPublishPost }: PostComposerProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // AI Challenge Modal State
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [challengeTitle, setChallengeTitle] = useState('');
  const [challengeDesc, setChallengeDesc] = useState('');
  const [challengeXp, setChallengeXp] = useState(100);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setIsUploading(true);
    const uploaded = await uploadAssignmentAttachment(file);
    setIsUploading(false);
    if (uploaded) {
      setAttachments((prev) => [...prev, { id: `${Date.now()}`, name: uploaded.name, url: getSubmissionFileUrl(uploaded.storagePath) }]);
    }
  };

  const handlePostSubmit = () => {
    if (!content.trim() && attachments.length === 0) return;

    let mediaObj: any = undefined;
    if (attachments.length > 0) {
      mediaObj = {
        type: 'image',
        url: attachments[0].url,
      };
    }

    onPublishPost({
      content,
      media: mediaObj,
      type: 'standard'
    });

    setContent('');
    setAttachments([]);
  };


  const handlePublishChallenge = () => {
    if (!challengeTitle.trim()) return;

    onPublishPost({
      content: challengeDesc || challengeTitle,
      type: 'challenge',
      challenge: {
        id: `ch-${Date.now()}`,
        title: challengeTitle,
        description: challengeDesc,
        xpReward: challengeXp,
        subject: 'Mathematics & Science',
        grade: 'Grade 10'
      }
    });

    setIsChallengeModalOpen(false);
    setChallengeTitle('');
    setChallengeDesc('');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs mb-5">
      <div className="flex gap-3">
        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0 relative overflow-hidden border border-slate-200">
          <Image
            src={currentUser?.avatar || 'https://picsum.photos/seed/sarah/100'}
            alt={currentUser?.name || 'User'}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Text Area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write an announcement, question, or resource for this class..."
            className="w-full bg-slate-50/70 border border-slate-200/80 focus:border-indigo-400 focus:bg-white rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 resize-none min-h-[75px] outline-none transition-all font-medium"
          />

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  <ImageIcon size={13} />
                  <span>{att.name}</span>
                  <button onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))} className="text-indigo-400 hover:text-indigo-600">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100">
            <div className="flex items-center gap-3 text-xs font-bold">
              {/* Create Challenge */}
              <button
                onClick={() => setIsChallengeModalOpen(true)}
                className="flex items-center gap-1 text-orange-600 hover:text-orange-700 font-extrabold"
              >
                <Zap size={14} className="fill-orange-500 text-orange-500" />
                <span>Create Challenge</span>
              </button>

              {/* Photo / Video */}
              <label className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 cursor-pointer">
                <ImageIcon size={14} className="text-emerald-500" />
                <span>{isUploading ? 'Uploading...' : 'Photo/Video'}</span>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} disabled={isUploading} />
              </label>

              {/* Document */}
              <label className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 cursor-pointer">
                <FileText size={14} className="text-indigo-500" />
                <span>{isUploading ? 'Uploading...' : 'Document'}</span>
                <input type="file" className="hidden" onChange={handleFileSelect} disabled={isUploading} />
              </label>
            </div>

            {/* Post Button */}
            <button
              onClick={handlePostSubmit}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs active:scale-98"
            >
              Post to Wall
            </button>
          </div>
        </div>
      </div>

      {/* AI Challenge Launcher Modal */}
      <AnimatePresence>
        {isChallengeModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="fill-white" />
                  <h3 className="font-extrabold text-sm">Create Class Challenge</h3>
                </div>
                <button onClick={() => setIsChallengeModalOpen(false)} className="text-white/80 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Challenge Title</label>
                  <input
                    type="text"
                    value={challengeTitle}
                    onChange={(e) => setChallengeTitle(e.target.value)}
                    placeholder="e.g. Matrix Vector Challenge #4"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Problem Description</label>
                  <textarea
                    value={challengeDesc}
                    onChange={(e) => setChallengeDesc(e.target.value)}
                    rows={3}
                    placeholder="Describe problem prompt..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-800 outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsChallengeModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublishChallenge}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Publish Challenge
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
