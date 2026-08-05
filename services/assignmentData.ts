import { supabase } from '@/lib/supabaseClient';

export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate: string | null;
  status: 'Active' | 'Closed' | 'Draft';
  createdAt: string;
  settings: Record<string, any>;
  rubric: any[];
  attachments: { name: string; storagePath: string }[];
}

export interface AssignmentSubmission {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName?: string;
  submittedAt: string | null;
  storagePath: string | null;
  fileName: string | null;
  textContent: string | null;
  grade: number | null;
  feedback: string | null;
  status: 'Pending' | 'Submitted' | 'Graded' | 'Late';
}

export interface Quiz {
  id: string;
  title: string;
  dueDate: string | null;
  releaseAt: string | null;
  status: 'Active' | 'Closed' | 'Draft';
  createdAt: string;
  settings: Record<string, any>;
  questions: any[];
  sections: any[];
}

interface AssignmentScope {
  teacherId: string;
  classId: string;
  subject: string;
}

const ASSIGNMENT_SELECT = 'id, title, instructions, due_date, status, created_at, settings, rubric, attachments';

function mapAssignment(row: any): Assignment {
  return {
    id: row.id,
    title: row.title,
    instructions: row.instructions || '',
    dueDate: row.due_date,
    status: row.status,
    createdAt: row.created_at,
    settings: row.settings || {},
    rubric: row.rubric || [],
    attachments: row.attachments || [],
  };
}

export async function getAssignments(scope: AssignmentScope): Promise<Assignment[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('class_id', scope.classId)
    .eq('subject', scope.subject)
    .eq('type', 'assignment')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching assignments:', error);
    return [];
  }
  return (data || []).map(mapAssignment);
}

export async function getAssignmentById(id: string): Promise<Assignment | null> {
  const { data, error } = await supabase.from('assignments').select(ASSIGNMENT_SELECT).eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapAssignment(data);
}

export async function createAssignment(scope: AssignmentScope, input: { title: string; instructions: string; dueDate: string | null; status?: 'Active' | 'Draft'; unitId?: string | null; settings?: Record<string, any>; rubric?: any[]; attachments?: { name: string; storagePath: string }[] }): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      teacher_id: scope.teacherId,
      class_id: scope.classId,
      subject: scope.subject,
      title: input.title,
      type: 'assignment',
      instructions: input.instructions,
      due_date: input.dueDate,
      status: input.status || 'Active',
      unit_id: input.unitId || null,
      settings: input.settings || {},
      rubric: input.rubric || [],
      attachments: input.attachments || [],
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('Error creating assignment:', error);
    return { id: null, error: error?.message || 'Unknown error creating assignment' };
  }
  return { id: data.id, error: null };
}

const QUIZ_SELECT = 'id, title, due_date, release_at, status, created_at, settings, questions, sections';

function mapQuiz(row: any): Quiz {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    releaseAt: row.release_at,
    status: row.status,
    createdAt: row.created_at,
    settings: row.settings || {},
    questions: row.questions || [],
    sections: row.sections || [],
  };
}

export async function getQuizzes(scope: AssignmentScope): Promise<Quiz[]> {
  const { data, error } = await supabase
    .from('assignments')
    .select(QUIZ_SELECT)
    .eq('class_id', scope.classId)
    .eq('subject', scope.subject)
    .eq('type', 'quiz')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching quizzes:', error);
    return [];
  }
  return (data || []).map(mapQuiz);
}

export async function getQuizById(id: string): Promise<Quiz | null> {
  const { data, error } = await supabase.from('assignments').select(QUIZ_SELECT).eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapQuiz(data);
}

export async function createQuiz(scope: AssignmentScope, input: { title: string; dueDate: string | null; releaseAt: string | null; status?: 'Active' | 'Draft'; unitId?: string | null; settings?: Record<string, any>; questions: any[]; sections: any[] }): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('assignments')
    .insert({
      teacher_id: scope.teacherId,
      class_id: scope.classId,
      subject: scope.subject,
      title: input.title,
      type: 'quiz',
      due_date: input.dueDate,
      release_at: input.releaseAt,
      status: input.status || 'Active',
      unit_id: input.unitId || null,
      settings: input.settings || {},
      questions: input.questions || [],
      sections: input.sections || [],
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('Error creating quiz:', error);
    return { id: null, error: error?.message || 'Unknown error creating quiz' };
  }
  return { id: data.id, error: null };
}

export async function updateAssignment(id: string, input: { title?: string; instructions?: string; dueDate?: string | null; status?: string }): Promise<{ ok: boolean; error: string | null }> {
  const patch: any = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.instructions !== undefined) patch.instructions = input.instructions;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate;
  if (input.status !== undefined) patch.status = input.status;
  const { error } = await supabase.from('assignments').update(patch).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

export async function deleteAssignment(id: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  return { ok: !error, error: error?.message || null };
}

// بيجيب الوحدات (Modules) الحقيقية للفصل والمادة دي، عشان تقدر تربط الواجب/الكويز بوحدة
export async function getUnitsForAssignment(classId: string, subject: string): Promise<{ id: string; title: string }[]> {
  const { data, error } = await supabase.from('learning_units').select('id, title').eq('class_id', classId).eq('subject', subject).order('display_order', { ascending: true });
  if (error) {
    console.error('Error fetching units for assignment:', error);
    return [];
  }
  return data || [];
}

// بيجيب كل الطلاب المسجّلين في الفصل + حالة تسليمهم للواجب (Pending لو لسه ملموش سطر)
export async function getSubmissionsForAssignment(assessmentId: string, classId: string): Promise<AssignmentSubmission[]> {
  const [{ data: sectionRow }, { data: subRows, error }] = await Promise.all([
    supabase.from('class_sections').select('id, enrollments ( student_id )').eq('id', classId).maybeSingle(),
    supabase.from('assignment_submissions').select('id, assessment_id, student_id, submitted_at, storage_path, file_name, text_content, grade, feedback, status').eq('assessment_id', assessmentId),
  ]);
  if (error) console.error('Error fetching submissions:', error);

  const studentIds: string[] = ((sectionRow as any)?.enrollments || []).map((e: any) => e.student_id);
  const { data: studentRows } = studentIds.length > 0
    ? await supabase.from('students').select('id, users ( name )').in('id', studentIds)
    : { data: [] as any[] };

  const nameMap: Record<string, string> = {};
  (studentRows || []).forEach((s: any) => { nameMap[s.id] = s.users?.name || ''; });

  const subByStudent: Record<string, any> = {};
  (subRows || []).forEach((s: any) => { subByStudent[s.student_id] = s; });

  return studentIds.map((sid) => {
    const sub = subByStudent[sid];
    return {
      id: sub?.id || '',
      assessmentId,
      studentId: sid,
      studentName: nameMap[sid] || '',
      submittedAt: sub?.submitted_at || null,
      storagePath: sub?.storage_path || null,
      fileName: sub?.file_name || null,
      textContent: sub?.text_content || null,
      grade: sub?.grade ?? null,
      feedback: sub?.feedback || null,
      status: sub?.status || 'Pending',
    };
  });
}

// بيجيب تسليم طالب معيّن (لعرض حالته هو بس، جانب الطالب)
export async function getMySubmission(assessmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
  const { data, error } = await supabase
    .from('assignment_submissions')
    .select('id, assessment_id, student_id, submitted_at, storage_path, file_name, text_content, grade, feedback, status')
    .eq('assessment_id', assessmentId)
    .eq('student_id', studentId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    assessmentId: data.assessment_id,
    studentId: data.student_id,
    submittedAt: data.submitted_at,
    storagePath: data.storage_path,
    fileName: data.file_name,
    textContent: data.text_content,
    grade: data.grade,
    feedback: data.feedback,
    status: data.status,
  };
}

// بيرفع الملف فعليًا (لو موجود) لنفس bucket المكتبة، وبيسجّل التسليم
// بيرفع مرفق حقيقي للواجب نفسه (بيضاف عليه المعلم، زي ورقة تعليمات أو نموذج)
export async function uploadAssignmentAttachment(file: File): Promise<{ name: string; storagePath: string } | null> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const storagePath = `assignment-attachments/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from('library-files').upload(storagePath, file);
  if (error) {
    console.error('Error uploading assignment attachment:', error);
    return null;
  }
  return { name: file.name, storagePath };
}

export async function submitAssignment(input: { assessmentId: string; studentId: string; file?: File | null; textContent?: string }): Promise<{ ok: boolean; error: string | null }> {
  let storagePath: string | null = null;
  let fileName: string | null = null;

  if (input.file) {
    const safeName = input.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    storagePath = `submissions/${input.assessmentId}/${input.studentId}_${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('library-files').upload(storagePath, input.file);
    if (uploadError) {
      console.error('Error uploading submission file:', uploadError);
      return { ok: false, error: uploadError.message };
    }
    fileName = input.file.name;
  }

  const { error } = await supabase
    .from('assignment_submissions')
    .upsert({
      assessment_id: input.assessmentId,
      student_id: input.studentId,
      submitted_at: new Date().toISOString(),
      storage_path: storagePath,
      file_name: fileName,
      text_content: input.textContent || null,
      status: 'Submitted',
    }, { onConflict: 'assessment_id,student_id' });

  if (error) {
    console.error('Error submitting assignment:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true, error: null };
}

export async function gradeSubmission(assessmentId: string, studentId: string, input: { grade: number; feedback: string }): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase
    .from('assignment_submissions')
    .update({ grade: input.grade, feedback: input.feedback, status: 'Graded' })
    .eq('assessment_id', assessmentId)
    .eq('student_id', studentId);
  return { ok: !error, error: error?.message || null };
}

export function getSubmissionFileUrl(storagePath: string): string {
  const { data } = supabase.storage.from('library-files').getPublicUrl(storagePath);
  return data.publicUrl;
}
