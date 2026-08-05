import { supabase } from '@/lib/supabaseClient';

export type LearnRole = 'teacher' | 'student' | 'parent' | 'qb_supervisor';

export interface AuthenticatedUser {
  userId: string;
  name: string;
  role: LearnRole;
  email: string;
  // نطاق البيانات الخاص بكل دور
  teacherId?: string;
  subjects?: string[];       // للمعلم: المواد اللي بيدرّسها
  grades?: string[];         // للمعلم: الصفوف اللي بيدرّسها
  canUseQuestionBank?: boolean; // للمعلم: يقدر يضيف أسئلة لبنك الأسئلة (إضافة بس)
  studentId?: string;
  studentGrade?: string;     // للطالب: صفّه هو
  parentId?: string;
  childStudentIds?: string[]; // لولي الأمر: أبناؤه
}

// بيسجّل الدخول بإيميل وباسورد حقيقيين (نفس حسابات Talia 360)، وبيرجّع نطاق البيانات المناسب لدوره
export async function loginToTaliaLearn(email: string, password: string): Promise<AuthenticatedUser | null> {
  const { data: userRow, error } = await supabase
    .from('users')
    .select('id, name, role, email')
    .eq('email', email)
    .eq('password', password)
    .maybeSingle();

  if (error || !userRow) {
    return null;
  }

  const roleUpper = (userRow.role || '').toUpperCase();

  if (roleUpper === 'TEACHER') {
    const { data: teacherRow } = await supabase
      .from('teachers')
      .select('id, can_add_to_question_bank')
      .eq('user_id', userRow.id)
      .maybeSingle();

    if (!teacherRow) return null;

    const [{ data: subjectRows }, { data: gradeRows }] = await Promise.all([
      supabase.from('teacher_subjects').select('subject').eq('teacher_id', teacherRow.id),
      supabase.from('teacher_grades').select('grade').eq('teacher_id', teacherRow.id),
    ]);

    return {
      userId: userRow.id,
      name: userRow.name,
      role: 'teacher',
      email: userRow.email,
      teacherId: teacherRow.id,
      subjects: (subjectRows || []).map((r: any) => r.subject),
      grades: (gradeRows || []).map((r: any) => r.grade),
      canUseQuestionBank: teacherRow.can_add_to_question_bank || false,
    };
  }

  if (roleUpper === 'STUDENT') {
    const { data: studentRow } = await supabase
      .from('students')
      .select('id, grade')
      .eq('user_id', userRow.id)
      .maybeSingle();

    if (!studentRow) return null;

    return {
      userId: userRow.id,
      name: userRow.name,
      role: 'student',
      email: userRow.email,
      studentId: studentRow.id,
      studentGrade: studentRow.grade,
    };
  }

  if (roleUpper === 'PARENT') {
    const { data: parentRow } = await supabase
      .from('parents')
      .select('id')
      .eq('user_id', userRow.id)
      .maybeSingle();

    if (!parentRow) return null;

    const { data: linkRows } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', parentRow.id);

    return {
      userId: userRow.id,
      name: userRow.name,
      role: 'parent',
      email: userRow.email,
      parentId: parentRow.id,
      childStudentIds: (linkRows || []).map((r: any) => r.student_id),
    };
  }

  if (roleUpper === 'ADMIN') {
    const { data: adminRow } = await supabase
      .from('admins')
      .select('id')
      .eq('user_id', userRow.id)
      .maybeSingle();

    if (!adminRow) return null;

    const { data: permRows } = await supabase
      .from('admin_permissions')
      .select('permission')
      .eq('admin_id', adminRow.id);

    const permissions = (permRows || []).map((r: any) => r.permission);
    // بنك الأسئلة في Talia Learn مقصور على أدمن معاه صلاحية "qb_manage" فعليًا — أي أدمن تاني مالوش دخول هنا
    if (!permissions.includes('qb_manage')) return null;

    return {
      userId: userRow.id,
      name: userRow.name,
      role: 'qb_supervisor',
      email: userRow.email,
    };
  }

  // أي دور تاني (أدمن من غير صلاحية بنك الأسئلة، إلخ) مش من أدوار Talia Learn
  return null;
}
