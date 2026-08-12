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

// بيجيب موارد المنهج الرسمية الحقيقية (المكتبة الرسمية) لصف ومادة معيّنين — نفس مصدر بيانات المنهج الدراسي في Talia 360
export async function getOfficialCurriculumResources(grade: string, subject: string): Promise<{ id: string; title: string; type: string; url: string }[]> {
  const { data, error } = await supabase
    .from('curriculum_resources')
    .select('id, title, type, url')
    .eq('grade', grade)
    .eq('subject', subject)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching official curriculum resources:', error);
    return [];
  }
  return (data || []).map((row: any) => ({ id: row.id, title: row.title, type: row.type, url: row.url }));
}

// بيجيب فئات جدول الدرجات الحقيقية (من Talia 360) لمادة وصف معيّنين
export async function getGradebookCategories(subject: string, grade: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('gradebook_configs')
    .select('category_weights, gradebook_config_grades ( grade )')
    .eq('subject_name', subject);
  if (error || !data) {
    console.error('Error fetching gradebook categories:', error);
    return [];
  }
  const matching = data.find((row: any) => (row.gradebook_config_grades || []).some((g: any) => g.grade === grade));
  if (!matching) return [];
  return Object.keys((matching as any).category_weights || {});
}

// بيجيب كل الصفوف الدراسية الحقيقية المعرّفة في المنهج (Talia 360)
export async function getGradeLevels(): Promise<string[]> {
  const { data, error } = await supabase.from('grade_levels').select('name, display_order').order('display_order', { ascending: true });
  if (error) {
    console.error('Error fetching grade levels:', error);
    return [];
  }
  return (data || []).map((row: any) => row.name);
}

// بيبني قايمة مادة×صف حقيقية لبنك الأسئلة — كل حاجة للمشرف، بس مواد وصفوف المعلم نفسه للمعلم
export async function getSubjectGradeCombos(scope: { isSupervisor: boolean; teacherGrades?: string[]; teacherSubjects?: string[] }): Promise<{ subject: string; grade: string }[]> {
  const grades = scope.isSupervisor ? await getGradeLevels() : (scope.teacherGrades || []);
  const combos: { subject: string; grade: string }[] = [];
  for (const grade of grades) {
    const subjects = await getGradeSubjects(grade);
    for (const subject of subjects) {
      if (scope.isSupervisor || (scope.teacherSubjects || []).includes(subject)) {
        combos.push({ subject, grade });
      }
    }
  }
  return combos;
}

// بيجيب كل فصول المدرسة الحقيقية (يستخدمها مشرف بنك الأسئلة اللي مالوش فصول خاصة بيه)
export async function getAllClassSections(): Promise<{ id: string; name: string; gradeLevel: string }[]> {
  const { data, error } = await supabase.from('class_sections').select('id, name, grade_level');
  if (error) {
    console.error('Error fetching all class sections:', error);
    return [];
  }
  return (data || []).map((row: any) => ({ id: row.id, name: row.name, gradeLevel: row.grade_level ?? '' }));
}

// بيجيب خطط الدروس الرسمية الحقيقية (من Talia 360) لصف ومادة معيّنين — بس اللي المشرف اعتمدها فعليًا للمادة
export async function getOfficialLessonPlans(grade: string, subject: string): Promise<{ id: string; title: string; content: string; weekNumber: number | null }[]> {
  const { data, error } = await supabase
    .from('curriculum_lesson_plans')
    .select('id, title, content, week_number')
    .eq('grade', grade)
    .eq('subject', subject)
    .eq('assigned_to_subject', true)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching official lesson plans:', error);
    return [];
  }
  return (data || []).map((row: any) => ({ id: row.id, title: row.title, content: row.content || '', weekNumber: row.week_number }));
}
