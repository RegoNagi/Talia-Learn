import { supabase } from '@/lib/supabaseClient';

export interface StudentNote {
  id: string;
  studentId: string;
  text: string;
  published: boolean;
  createdAt: string;
}

export async function getStudentNotes(studentId: string): Promise<StudentNote[]> {
  const { data, error } = await supabase
    .from('student_notes')
    .select('id, student_id, text, published, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data.map((row: any) => ({ id: row.id, studentId: row.student_id, text: row.text, published: row.published, createdAt: row.created_at }));
}

export async function getNoteCountsForStudents(studentIds: string[]): Promise<Record<string, number>> {
  if (studentIds.length === 0) return {};
  const { data, error } = await supabase.from('student_notes').select('student_id').in('student_id', studentIds);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  (data as any[]).forEach((row) => {
    counts[row.student_id] = (counts[row.student_id] || 0) + 1;
  });
  return counts;
}

export async function addStudentNote(input: { studentId: string; teacherId: string; text: string; published: boolean }): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('student_notes').insert({
    student_id: input.studentId,
    teacher_id: input.teacherId,
    text: input.text,
    published: input.published,
  });
  return { ok: !error, error: error?.message || null };
}

export async function updateStudentNote(id: string, input: { text?: string; published?: boolean }): Promise<{ ok: boolean; error: string | null }> {
  const patch: any = {};
  if (input.text !== undefined) patch.text = input.text;
  if (input.published !== undefined) patch.published = input.published;
  const { error } = await supabase.from('student_notes').update(patch).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

export async function deleteStudentNote(id: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('student_notes').delete().eq('id', id);
  return { ok: !error, error: error?.message || null };
}

// بيتأكد لو الطالب غايب النهاردة فعليًا (من آخر سجل حضور مسجّل النهاردة)
export async function getTodayAbsentStudentIds(studentIds: string[]): Promise<Set<string>> {
  if (studentIds.length === 0) return new Set();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('attendance_records')
    .select('student_id, status, attendance_sessions!inner(date)')
    .in('student_id', studentIds)
    .eq('attendance_sessions.date', today);
  if (error || !data) return new Set();
  const absent = new Set<string>();
  (data as any[]).forEach((row) => {
    if (row.status === 'Absent') absent.add(row.student_id);
  });
  return absent;
}
