import { supabase } from '@/lib/supabaseClient';

export interface LearnClassInfo {
  id: string;
  name: string;
  gradeLevel: string;
  studentCount: number;
}

// بيجيب الفصل الحقيقي اللي الطالب ده متسكّن فيه
export async function getStudentClassSection(studentId: string): Promise<LearnClassInfo | null> {
  const { data: enrollmentRow, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('section_id')
    .eq('student_id', studentId)
    .maybeSingle();

  if (enrollmentError || !enrollmentRow) return null;

  const { data: sectionRow, error: sectionError } = await supabase
    .from('class_sections')
    .select('id, name, grade_level, enrollments ( student_id )')
    .eq('id', enrollmentRow.section_id)
    .maybeSingle();

  if (sectionError || !sectionRow) return null;

  return {
    id: (sectionRow as any).id,
    name: (sectionRow as any).name,
    gradeLevel: (sectionRow as any).grade_level ?? '',
    studentCount: ((sectionRow as any).enrollments || []).length,
  };
}

// بيجيب اسم وصف فصل معيّن بالـ id بتاعه (مستخدم في عرض عنوان المادة الحقيقي)
export async function getClassSectionById(classId: string): Promise<{ id: string; name: string; gradeLevel: string } | null> {
  const { data, error } = await supabase.from('class_sections').select('id, name, grade_level').eq('id', classId).maybeSingle();
  if (error || !data) return null;
  return { id: data.id, name: data.name, gradeLevel: data.grade_level ?? '' };
}

// بيجيب مواد المنهج الحقيقية لصف معيّن (نفس مصدر البيانات في المنهج الدراسي بـ Talia 360)
export async function getGradeSubjects(grade: string): Promise<string[]> {
  const { data, error } = await supabase.from('curriculum_subjects').select('subject').eq('grade', grade);
  if (error) {
    console.error('Error fetching grade subjects:', error);
    return [];
  }
  return (data || []).map((row: any) => row.subject);
}

