import { supabase } from '@/lib/supabaseClient';

export interface LearnClassSection {
  id: string;
  name: string;
  gradeLevel: string;
  teacherId: string;
  students: string[];
}

export interface LearnStudent {
  id: string;
  name: string;
  grade: string;
  avatar?: string;
}

export interface LearnPeriod {
  id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
}

// بيجيب الفصول الحقيقية اللي المعلم ده معيّن عليها كمعلم رئيسي
export async function getMyClassSections(teacherId: string): Promise<LearnClassSection[]> {
  const { data, error } = await supabase
    .from('class_sections')
    .select('id, name, grade_level, teacher_id, enrollments ( student_id )')
    .eq('teacher_id', teacherId);

  if (error) {
    console.error('Error fetching class sections:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.name,
    gradeLevel: row.grade_level ?? '',
    teacherId: row.teacher_id ?? '',
    students: (row.enrollments || []).map((e: any) => e.student_id),
  }));
}

export async function getStudentsByIds(studentIds: string[]): Promise<LearnStudent[]> {
  if (studentIds.length === 0) return [];
  const { data, error } = await supabase
    .from('students')
    .select('id, grade, users ( name )')
    .in('id', studentIds);

  if (error) {
    console.error('Error fetching students:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.users?.name || '',
    grade: row.grade ?? '',
  }));
}

export async function getPeriods(sectionId: string): Promise<LearnPeriod[]> {
  const { data, error } = await supabase
    .from('class_periods')
    .select('id, subject, day, start_time, end_time')
    .eq('section_id', sectionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching periods:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    subject: row.subject,
    day: row.day ?? '',
    startTime: row.start_time ?? '',
    endTime: row.end_time ?? '',
  }));
}

export async function getAttendanceSettings(): Promise<{ mode: 'Daily' | 'Period'; lateThreshold: number }> {
  const { data, error } = await supabase
    .from('attendance_settings')
    .select('mode, late_threshold')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    return { mode: 'Period', lateThreshold: 15 };
  }
  return { mode: data.mode, lateThreshold: data.late_threshold };
}

// بيجيب الحضور المسجّل فعليًا (لو موجود) لفصل معيّن في تاريخ معيّن، مقسّم حسب الحصة
export async function getAttendanceForDate(sectionId: string, date: string): Promise<Record<string, Record<string, string>>> {
  const { data, error } = await supabase
    .from('attendance_records')
    .select('student_id, status, attendance_sessions!inner(section_id, date, period_id)')
    .eq('attendance_sessions.section_id', sectionId)
    .eq('attendance_sessions.date', date);

  if (error || !data) {
    console.error('Error fetching attendance for date:', error);
    return {};
  }

  const statusMap: Record<string, string> = { Present: 'present', Absent: 'absent', Late: 'late', Excused: 'excused' };
  const result: Record<string, Record<string, string>> = {};
  (data as any[]).forEach((row) => {
    const periodKey = row.attendance_sessions.period_id || 'daily';
    if (!result[periodKey]) result[periodKey] = {};
    result[periodKey][row.student_id] = statusMap[row.status] || 'absent';
  });
  return result;
}

export async function saveAttendanceSession(input: {
  sectionId: string;
  date: string;
  subject?: string;
  periodId?: string | null;
  records: { studentId: string; status: string }[];
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert({
      section_id: input.sectionId,
      date: input.date,
      subject: input.subject || null,
      period_id: input.periodId || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating attendance session:', error);
    return null;
  }

  const sessionId = data.id;

  if (input.records.length > 0) {
    const rows = input.records.map((r) => ({
      session_id: sessionId,
      student_id: r.studentId,
      status: r.status,
      method: 'Manual',
    }));
    const { error: recError } = await supabase.from('attendance_records').insert(rows);
    if (recError) console.error('Error saving attendance records:', recError);
  }

  return sessionId;
}

// بيحسب نسبة الحضور الحقيقية لكل طالب (من كل سجلات الحضور اللي اتسجّلت له)
export async function getAttendancePercentagesForStudents(studentIds: string[]): Promise<Record<string, number>> {
  if (studentIds.length === 0) return {};
  const { data, error } = await supabase.from('attendance_records').select('student_id, status').in('student_id', studentIds);
  if (error || !data) {
    console.error('Error computing attendance percentages:', error);
    return {};
  }
  const totals: Record<string, { present: number; total: number }> = {};
  (data as any[]).forEach((row) => {
    if (!totals[row.student_id]) totals[row.student_id] = { present: 0, total: 0 };
    totals[row.student_id].total++;
    if (row.status === 'Present' || row.status === 'Late') totals[row.student_id].present++;
  });
  const result: Record<string, number> = {};
  studentIds.forEach((id) => {
    const t = totals[id];
    result[id] = t && t.total > 0 ? Math.round((t.present / t.total) * 100) : 0;
  });
  return result;
}

