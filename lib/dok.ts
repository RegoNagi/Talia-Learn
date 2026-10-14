/** مستويات العمق المعرفي (Webb's Depth of Knowledge) */
export type DokLevel = 1 | 2 | 3 | 4;

export const DOK_LEVELS: { level: DokLevel; ar: string; en: string; descAr: string; descEn: string; color: string }[] = [
  { level: 1, ar: 'استدعاء', en: 'Recall', descAr: 'تذكّر حقيقة أو تعريف أو خطوة بسيطة.', descEn: 'Recall a fact, definition or simple procedure.', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { level: 2, ar: 'مهارة ومفهوم', en: 'Skill / Concept', descAr: 'تطبيق مهارة أو مفهوم، تصنيف، مقارنة، تفسير.', descEn: 'Apply a skill or concept: classify, compare, interpret.', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { level: 3, ar: 'تفكير استراتيجي', en: 'Strategic thinking', descAr: 'تحليل وتبرير باستدلال، أكتر من حل واحد ممكن.', descEn: 'Reason and justify; more than one valid approach.', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { level: 4, ar: 'تفكير ممتد', en: 'Extended thinking', descAr: 'تحقيق أو مشروع بيمتد على وقت ويربط أكتر من مصدر.', descEn: 'Investigation over time, synthesising several sources.', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

export function normalizeDok(v: unknown): DokLevel | undefined {
  const n = typeof v === 'string' ? Number(v) : v;
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : undefined;
}

export function dokLabel(level: unknown, language: 'ar' | 'en' = 'ar'): string {
  const l = normalizeDok(level);
  const d = DOK_LEVELS.find((x) => x.level === l);
  return d ? `DOK ${d.level} · ${language === 'ar' ? d.ar : d.en}` : '';
}
