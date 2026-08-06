import { supabase } from '@/lib/supabaseClient';

export interface SubjectTheme {
  icon: string;
  color: string;
}

// نفس مجموعة الألوان المستخدمة في تاليا 360 (classes Tailwind من نوع bg-X-500) عشان الثيم يتطابق بصريًا في المكانين
export const SUBJECT_COLOR_OPTIONS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
  'bg-teal-500', 'bg-orange-500', 'bg-lime-500', 'bg-purple-500',
];

// أسماء أيقونات lucide-react مناسبة للمواد الدراسية الشائعة — القائمة دي بتتقرا في المكانين (بيانات فقط، مش مكوّنات)
export const SUBJECT_ICON_OPTIONS = [
  'book-open', 'calculator', 'flask-conical', 'atom', 'languages',
  'globe', 'landmark', 'palette', 'music', 'dumbbell', 'code',
  'microscope', 'pen-tool', 'compass', 'graduation-cap',
];

const DEFAULT_THEME: SubjectTheme = { icon: 'book-open', color: 'bg-violet-500' };

export async function getSubjectThemes(): Promise<Record<string, SubjectTheme>> {
  const { data, error } = await supabase.from('subject_themes').select('subject_name, icon, color');
  if (error || !data) return {};
  const map: Record<string, SubjectTheme> = {};
  for (const row of data) {
    map[row.subject_name] = { icon: row.icon || DEFAULT_THEME.icon, color: row.color || DEFAULT_THEME.color };
  }
  return map;
}

export function getThemeFor(themes: Record<string, SubjectTheme>, subjectName: string): SubjectTheme {
  return themes[subjectName] || DEFAULT_THEME;
}

// بيحفظ (أو يعدّل) ثيم مادة — نفس الاسم بيتحدّث في كل مكان بيقرا من الجدول ده (360 وليرن)
export async function upsertSubjectTheme(subjectName: string, theme: SubjectTheme): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('subject_themes').upsert({
    subject_name: subjectName,
    icon: theme.icon,
    color: theme.color,
  }, { onConflict: 'subject_name' });
  return { ok: !error, error: error?.message || null };
}
