import { supabase } from '@/lib/supabaseClient';

export interface LearnUnit {
  id: string;
  title: string;
  weeksLabel: string;
  displayOrder: number;
}

export interface LearnLesson {
  id: string;
  unitId: string;
  title: string;
  type: 'video' | 'pdf' | 'link' | 'library';
  weekLabel: string;
  url: string | null;
  libraryFileId: string | null;
  displayOrder: number;
}

interface UnitScope {
  teacherId: string;
  classId: string;
  subject: string;
}

export async function getUnits(scope: UnitScope): Promise<LearnUnit[]> {
  const { data, error } = await supabase
    .from('learning_units')
    .select('id, title, weeks_label, display_order')
    .eq('class_id', scope.classId)
    .eq('subject', scope.subject)
    .order('display_order', { ascending: true });
  if (error) {
    console.error('Error fetching units:', error);
    return [];
  }
  return (data || []).map((row: any) => ({ id: row.id, title: row.title, weeksLabel: row.weeks_label || '', displayOrder: row.display_order }));
}

export async function createUnit(scope: UnitScope, input: { title: string; weeksLabel: string }): Promise<string | null> {
  const { data: existing } = await supabase.from('learning_units').select('display_order').eq('class_id', scope.classId).eq('subject', scope.subject).order('display_order', { ascending: false }).limit(1).maybeSingle();
  const nextOrder = (existing?.display_order ?? -1) + 1;
  const { data, error } = await supabase
    .from('learning_units')
    .insert({ teacher_id: scope.teacherId, class_id: scope.classId, subject: scope.subject, title: input.title, weeks_label: input.weeksLabel, display_order: nextOrder })
    .select('id')
    .single();
  if (error || !data) {
    console.error('Error creating unit:', error);
    return null;
  }
  return data.id;
}

export async function updateUnit(id: string, input: { title?: string; weeksLabel?: string }): Promise<boolean> {
  const patch: any = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.weeksLabel !== undefined) patch.weeks_label = input.weeksLabel;
  const { error } = await supabase.from('learning_units').update(patch).eq('id', id);
  return !error;
}

export async function deleteUnit(id: string): Promise<boolean> {
  const { error } = await supabase.from('learning_units').delete().eq('id', id);
  return !error;
}

export async function getLessons(unitIds: string[]): Promise<LearnLesson[]> {
  if (unitIds.length === 0) return [];
  const { data, error } = await supabase
    .from('learning_lessons')
    .select('id, unit_id, title, type, week_label, url, library_file_id, display_order')
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
    displayOrder: row.display_order,
  }));
}

export async function createLesson(input: { unitId: string; title: string; type: LearnLesson['type']; weekLabel: string; url?: string | null; libraryFileId?: string | null }): Promise<string | null> {
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
      display_order: nextOrder,
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('Error creating lesson:', error);
    return null;
  }
  return data.id;
}

export async function deleteLesson(id: string): Promise<boolean> {
  const { error } = await supabase.from('learning_lessons').delete().eq('id', id);
  return !error;
}
