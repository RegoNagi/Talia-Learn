// منطق صرف لنقل/استيراد الأسئلة بين البنوك: تجهيز الدفعة وكشف المكرر.
// منفصل عن Supabase عشان يتختبر بسهولة.

export const normalizeBankTitle = (s: string): string =>
  (s || '').trim().toLowerCase().replace(/[ً-ْ]/g, '').replace(/\s+/g, ' ').trim();

export interface InsertPlan<T> {
  toInsert: T[];
  duplicates: T[];
}

// بيفصل الأسئلة الجديدة عن المكررة. المكرر = نفس نص السؤال (بعد التطبيع) موجود في البنك الهدف،
// أو متكرر جوه الدفعة نفسها. لو skipDuplicates=false بيدخل الكل.
export function planBankInsert<T extends { question: { title: string } }>(
  items: T[],
  existingTitles: string[],
  skipDuplicates: boolean,
): InsertPlan<T> {
  if (!skipDuplicates) return { toInsert: items.slice(), duplicates: [] };
  const seen = new Set(existingTitles.map(normalizeBankTitle).filter(Boolean));
  const toInsert: T[] = [];
  const duplicates: T[] = [];
  for (const item of items) {
    const key = normalizeBankTitle(item.question.title);
    if (key && seen.has(key)) {
      duplicates.push(item);
    } else {
      if (key) seen.add(key);
      toInsert.push(item);
    }
  }
  return { toInsert, duplicates };
}
