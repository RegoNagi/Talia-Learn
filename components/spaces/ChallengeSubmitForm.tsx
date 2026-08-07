'use client';

import { useState } from 'react';
import { submitToChallenge, RealChallenge } from '@/services/classSpaceData';

export function ChallengeSubmitForm({ challenge, studentId, onSubmitted }: { challenge: RealChallenge; studentId: string; onSubmitted: () => void }) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const handleSubmit = async () => {
    if (!content.trim() || !studentId) return;
    setIsSaving(true);
    const { ok } = await submitToChallenge(challenge.id, studentId, content.trim());
    setIsSaving(false);
    if (ok) onSubmitted();
  };
  return (
    <div className="p-5 space-y-3.5">
      <label className="block text-xs font-bold text-slate-700">Your Answer</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder="Write your response to the challenge..."
        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-orange-400 resize-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!content.trim() || isSaving}
        className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl font-bold transition-colors"
      >
        {isSaving ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  );
}
