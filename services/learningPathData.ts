import { supabase } from '@/lib/supabaseClient';

export interface LearnUnit {
  id: string;
  title: string;
  weeksLabel: string;
  displayOrder: number;
  isHidden: boolean;
  sharedWith: string[];
}

export interface LearnLesson {
  id: string;
  unitId: string;
  title: string;
  type: 'video' | 'pdf' | 'link' | 'library';
  weekLabel: string;
  url: string | null;
  libraryFileId: string | null;
  storagePath: string | null;
  displayOrder: number;
}

interface UnitScope {
  teacherId: string;
  classId: string;
  subject: string;
}

// Modules (الوحدات) — بتجيب بتاعة الفصل ده + أي حاجة اتشاركت من فصول تانية
export async function getUnits(scope: UnitScope): Promise<LearnUnit[]> {
  const [ownRes, sharedRes] = await Promise.all([
    supabase.from('learning_units').select('id, title, weeks_label, display_order, is_hidden, shared_with').eq('class_id', scope.classId).eq('subject', scope.subject),
    supabase.from('learning_units').select('id, title, weeks_label, display_order, is_hidden, shared_with').contains('shared_with', [scope.classId]),
  ]);
  if (ownRes.error) console.error('Error fetching units:', ownRes.error);
  const seen = new Set<string>();
  const all = [...(ownRes.data || []), ...(sharedRes.data || [])].filter((r: any) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
  return all.map((row: any) => ({
    id: row.id,
    title: row.title,
    weeksLabel: row.weeks_label || '',
    displayOrder: row.display_order,
    isHidden: row.is_hidden,
    sharedWith: row.shared_with || [],
  }));
}

export async function createUnit(scope: UnitScope, input: { title: string; weeksLabel: string }): Promise<{ id: string | null; error: string | null }> {
  const { data: existing } = await supabase.from('learning_units').select('display_order').eq('class_id', scope.classId).eq('subject', scope.subject).order('display_order', { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (existing?.display_order ?? -1) + 1;
  const { data, error } = await supabase
    .from('learning_units')
    .insert({ teacher_id: scope.teacherId, class_id: scope.classId, subject: scope.subject, title: input.title, weeks_label: input.weeksLabel, display_order: nextOrder })
    .select('id')
    .single();
  if (error || !data) {
    console.error('Error creating unit:', error);
    return { id: null, error: error?.message || 'Unknown error creating module' };
  }
  return { id: data.id, error: null };
}

export async function updateUnit(id: string, input: { title?: string; weeksLabel?: string }): Promise<{ ok: boolean; error: string | null }> {
  const patch: any = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.weeksLabel !== undefined) patch.weeks_label = input.weeksLabel;
  const { error } = await supabase.from('learning_units').update(patch).eq('id', id);
  if (error) console.error('Error updating unit:', error);
  return { ok: !error, error: error?.message || null };
}

export async function deleteUnit(id: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('learning_units').delete().eq('id', id);
  if (error) console.error('Error deleting unit:', error);
  return { ok: !error, error: error?.message || null };
}

export async function toggleUnitHidden(id: string, isHidden: boolean): Promise<boolean> {
  const { error } = await supabase.from('learning_units').update({ is_hidden: isHidden }).eq('id', id);
  return !error;
}

export async function updateUnitSharing(id: string, sharedWith: string[]): Promise<boolean> {
  const { error } = await supabase.from('learning_units').update({ shared_with: sharedWith }).eq('id', id);
  return !error;
}

export async function getLessons(unitIds: string[]): Promise<LearnLesson[]> {
  if (unitIds.length === 0) return [];
  const { data, error } = await supabase
    .from('learning_lessons')
    .select('id, unit_id, title, type, week_label, url, library_file_id, storage_path, display_order')
    .in('unit_id', unitIds)
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Error fetching lessons:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    unitId: row.unit_id,
    title: row.title,
    type: row.type,
    weekLabel: row.week_label || '',
    url: row.url,
    libraryFileId: row.library_file_id,
    storagePath: row.storage_path,
    displayOrder: row.display_order,
  }));
}

// بيرفع الملف فعليًا (لو موجود) لنفس bucket المكتبة، وبيسجّل الدرس بعد كده
export async function createLesson(input: { unitId: string; title: string; type: LearnLesson['type']; weekLabel: string; url?: string | null; libraryFileId?: string | null; file?: File | null }): Promise<{ id: string | null; error: string | null }> {
  let storagePath: string | null = null;

  if (input.file) {
    const safeName = input.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    storagePath = `lessons/${input.unitId}/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('library-files').upload(storagePath, input.file);
    if (uploadError) {
      console.error('Error uploading lesson file:', uploadError);
      return { id: null, error: uploadError.message };
    }
  }

  const { data: existing } = await supabase.from('learning_lessons').select('display_order').eq('unit_id', input.unitId).order('display_order', { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (existing?.display_order ?? -1) + 1;
  const { data, error } = await supabase
    .from('learning_lessons')
    .insert({
      unit_id: input.unitId,
      title: input.title,
      type: input.type,
      week_label: input.weekLabel,
      url: input.url || null,
      library_file_id: input.libraryFileId || null,
      storage_path: storagePath,
      display_order: nextOrder,
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('Error creating lesson:', error);
    return { id: null, error: error?.message || 'Unknown error creating topic' };
  }
  return { id: data.id, error: null };
}

export function getLessonFileUrl(storagePath: string): string {
  const { data } = supabase.storage.from('library-files').getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function deleteLesson(id: string): Promise<boolean> {
  const { error } = await supabase.from('learning_lessons').delete().eq('id', id);
  return !error;
}
