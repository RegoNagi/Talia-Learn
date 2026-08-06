import { getAssignments, getQuizzes } from './assignmentData';
import { supabase } from '@/lib/supabaseClient';

export interface TodoTask {
  id: string;
  title: string;
  type: 'assignment' | 'quiz' | 'live_session' | 'curriculum' | 'quick_task';
  dueDate: string; // ISO
  bucket: 'overdue' | 'today' | 'tomorrow' | 'upcoming';
  classId: string;
  subject: string;
  isCompleted?: boolean; // علامة "تم" حقيقية — بتخص المهام السريعة (quick_task) بس، لأنها الوحيدة اللي المعلم بيعلّمها بإيده
  meta?: { outcome?: string | null; resourceTitle?: string | null; lessonPlanTitle?: string | null; attachmentPath?: string | null };
}

function computeBucket(dueDate: string): TodoTask['bucket'] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const due = new Date(dueDate);

  if (due < today) return 'overdue';
  if (due >= today && due < tomorrow) return 'today';
  if (due >= tomorrow && due < dayAfterTomorrow) return 'tomorrow';
  return 'upcoming';
}

// بيجيب مواضيع الجدول الزمني الحقيقية من Talia 360 (curriculum_weeks) — خطط الدروس والمصادر والمواضيع المربوطة بكل أسبوع
async function getCurriculumTasks(classId: string, subject: string, grade: string): Promise<TodoTask[]> {
  if (!grade) return [];
  const { data, error } = await supabase
    .from('curriculum_weeks')
    .select('id, week_number, start_date, end_date, topics')
    .eq('grade', grade)
    .eq('subject', subject);
  if (error || !data) return [];

  const tasks: TodoTask[] = [];
  for (const week of data) {
    const topics: any[] = week.topics || [];
    topics.forEach((topic, idx) => {
      if (!week.start_date) return;
      tasks.push({
        id: `${week.id}-${idx}`,
        title: topic.text || 'Untitled topic',
        type: 'curriculum',
        dueDate: week.start_date,
        bucket: computeBucket(week.start_date),
        classId,
        subject,
        meta: {
          outcome: topic.outcome || null,
          resourceTitle: topic.resourceTitle || null,
          lessonPlanTitle: topic.lessonPlanTitle || null,
        },
      });
    });
  }
  return tasks;
}

// ============ مهام سريعة (تُنشأ مباشرة من التايم لاين) ============

export async function getQuickTasks(classId: string, subject: string): Promise<TodoTask[]> {
  const { data, error } = await supabase
    .from('quick_tasks')
    .select('id, title, due_date, attachment_path, is_completed')
    .eq('class_id', classId)
    .eq('subject', subject);
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    type: 'quick_task' as const,
    dueDate: row.due_date,
    bucket: computeBucket(row.due_date),
    classId,
    subject,
    isCompleted: !!row.is_completed,
    meta: { attachmentPath: row.attachment_path || null },
  }));
}

export async function createQuickTask(input: {
  classId: string;
  subject: string;
  teacherId: string;
  title: string;
  dueDate: string;
  file?: File | null;
}): Promise<{ ok: boolean; error: string | null }> {
  let attachmentName: string | null = null;
  let attachmentPath: string | null = null;
  if (input.file) {
    const safeName = input.file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const storagePath = `quick-tasks/${Date.now()}_${safeName}`;
    const { error: uploadError } = await supabase.storage.from('library-files').upload(storagePath, input.file);
    if (!uploadError) {
      attachmentName = input.file.name;
      attachmentPath = storagePath;
    }
  }
  const { error } = await supabase.from('quick_tasks').insert({
    class_id: input.classId,
    subject: input.subject,
    teacher_id: input.teacherId,
    title: input.title,
    due_date: input.dueDate,
    attachment_name: attachmentName,
    attachment_path: attachmentPath,
  });
  return { ok: !error, error: error?.message || null };
}

export function getQuickTaskAttachmentUrl(storagePath: string): string {
  const { data } = supabase.storage.from('library-files').getPublicUrl(storagePath);
  return data.publicUrl;
}

// تعليم مهمة سريعة "تم" أو التراجع عن كده — المهام السريعة بس اللي ليها علامة إنجاز يدوية حقيقية
export async function toggleQuickTaskCompletion(id: string, isCompleted: boolean): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('quick_tasks').update({ is_completed: isCompleted }).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

// بيجيب كل المهام الحقيقية اللي ليها تاريخ (واجبات، كويزات، مواضيع الجدول الزمني من 360، والمهام السريعة)
// لفصل ومادة معيّنين، ومرتبة حسب: متأخر، النهاردة، بكرة، قريبًا
export async function getRealTodoTasks(scope: { teacherId?: string; classId: string; subject: string; grade?: string }): Promise<TodoTask[]> {
  const fetchScope = { teacherId: scope.teacherId || '', classId: scope.classId, subject: scope.subject };
  const [assignments, quizzes, curriculumTasks, quickTasks] = await Promise.all([
    getAssignments(fetchScope),
    getQuizzes(fetchScope),
    getCurriculumTasks(scope.classId, scope.subject, scope.grade || ''),
    getQuickTasks(scope.classId, scope.subject),
  ]);

  const tasks: TodoTask[] = [...curriculumTasks, ...quickTasks];
  for (const a of assignments) {
    if (!a.dueDate || a.status !== 'Active') continue;
    tasks.push({
      id: a.id,
      title: a.title,
      type: 'assignment',
      dueDate: a.dueDate,
      bucket: computeBucket(a.dueDate),
      classId: scope.classId,
      subject: scope.subject,
    });
  }
  for (const q of quizzes) {
    if (!q.dueDate || q.status !== 'Active') continue;
    tasks.push({
      id: q.id,
      title: q.title,
      type: 'quiz',
      dueDate: q.dueDate,
      bucket: computeBucket(q.dueDate),
      classId: scope.classId,
      subject: scope.subject,
    });
  }

  return tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

// بيجيب المهام من أكتر من فصل/مادة مرة واحدة (لصفحة To Do العامة اللي فوق كل الفصول)
export async function getRealTodoTasksMulti(scopes: { teacherId?: string; classId: string; subject: string; grade?: string }[]): Promise<TodoTask[]> {
  const results = await Promise.all(scopes.map((s) => getRealTodoTasks(s)));
  return results.flat().sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}
