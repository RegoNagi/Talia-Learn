// سجل مراجعة بسيط بيتخزن جوه جسم السؤال نفسه (question.reviewLog): مين راجع ومتى وإيه اللي حصل.

export type ReviewAction = 'approved' | 'rejected' | 'edited';

export interface ReviewLogEntry {
  at: string;
  by: string;
  byId: string | null;
  action: ReviewAction;
  note?: string;
  changes?: string[];
}

const MAX_ENTRIES = 30;

export function appendReviewLog<T extends { reviewLog?: ReviewLogEntry[] }>(question: T, entry: ReviewLogEntry): T & { reviewLog: ReviewLogEntry[] } {
  const prev = Array.isArray(question.reviewLog) ? question.reviewLog : [];
  return { ...question, reviewLog: [...prev, entry].slice(-MAX_ENTRIES) };
}

// أسماء الحقول اللي اتغيرت بين نسختين من السؤال (للسجل)
export function changedFields(before: Record<string, unknown>, after: Record<string, unknown>, extra: { before: Record<string, unknown>; after: Record<string, unknown> } = { before: {}, after: {} }): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  keys.delete('reviewLog');
  const changed: string[] = [];
  for (const k of keys) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) changed.push(k);
  }
  for (const k of new Set([...Object.keys(extra.before), ...Object.keys(extra.after)])) {
    if (JSON.stringify(extra.before[k]) !== JSON.stringify(extra.after[k])) changed.push(k);
  }
  return changed;
}
