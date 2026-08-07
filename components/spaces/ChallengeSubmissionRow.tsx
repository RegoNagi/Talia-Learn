'use client';

import { useState } from 'react';
import { gradeChallengeSubmission, ChallengeSubmission } from '@/services/classSpaceData';

export function ChallengeSubmissionRow({ submission, maxXp, onGraded }: { submission: ChallengeSubmission; maxXp: number; onGraded: () => void }) {
  const [xpInput, setXpInput] = useState(submission.xpAwarded !== null ? String(submission.xpAwarded) : '');
  const [isSaving, setIsSaving] = useState(false);
  const handleGrade = async () => {
    const xp = parseInt(xpInput) || 0;
    setIsSaving(true);
    await gradeChallengeSubmission(submission.id, xp, maxXp);
    setIsSaving(false);
    onGraded();
  };
  return (
    <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-800">{submission.studentName}</span>
        <span className="text-[10px] text-slate-400">{new Date(submission.submittedAt).toLocaleString()}</span>
      </div>
      <p className="text-sm text-slate-600 mb-3">{submission.content}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          max={maxXp}
          min={0}
          value={xpInput}
          onChange={(e) => setXpInput(e.target.value)}
          placeholder="0"
          className="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-orange-100"
        />
        <span className="text-xs text-slate-400">/ {maxXp} XP</span>
        <button
          onClick={handleGrade}
          disabled={isSaving}
          className="ml-auto px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-lg text-xs font-bold transition-colors"
        >
          {isSaving ? '...' : submission.xpAwarded !== null ? 'Update' : 'Award XP'}
        </button>
      </div>
    </div>
  );
}
