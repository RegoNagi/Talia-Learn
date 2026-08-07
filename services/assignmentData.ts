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
  assignedClasses: string[];
  assignedStudents: string[];
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

// شكل موحّد لأي سؤال جوه تقييم حقيقي، يغطي كل الحقول المستخدمة عبر الـ11 نوع سؤال المدعومين.
// الحقول كلها اختيارية عدا الأساسيات، لأن كل نوع سؤال بيستخدم مجموعة فرعية مختلفة منها —
// ده أدق بكتير من any من غير ما يغيّر أي سلوك فعلي أو يكسر أي كود قائم.
export interface QuizQuestion {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'file_upload' | 'numeric_answer' | 'matching' | 'ordering' | 'classification' | 'drag_and_drop' | 'hotspot' | 'passage';
  points: number;
  sectionId?: string | null;
  imageUrl?: string;
  audioUrl?: string;
  correctAnswer?: string;
  modelAnswer?: string;
  // اختيار من متعدد / صح أم خطأ / مقطع صوتي
  options?: { id: string; text: string; isCorrect: boolean; imageUrl?: string }[];
  // إجابة رقمية
  numericAnswer?: number | null;
  numericTolerance?: number;
  numericUnit?: string;
  // توصيل
  pairs?: { id: string; left: string; right: string }[];
  // ترتيب
  orderItems?: string[];
  // تصنيف
  categories?: string[];
  classifyItems?: { text: string; category: string }[];
  // سحب وإفلات
  zones?: string[];
  dragItems?: { text: string; zone: string }[];
  // منطقة تفاعلية
  hotspots?: { xPercent: number; yPercent: number; label: string; isCorrect: boolean }[];
  // قطعة
  passageText?: string;
  subQuestions?: { id: string; title: string; type: string; points: number; options?: { id: string; text: string; isCorrect: boolean }[] }[];
}

export interface Quiz {
  id: string;
  title: string;
  dueDate: string | null;
  releaseAt: string | null;
  status: 'Active' | 'Closed' | 'Draft';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvalRejectionNote: string | null;
  createdAt: string;
  settings: Record<string, any>;
  questions: QuizQuestion[];
  sections: any[];
  assignedClasses: string[];
  assignedStudents: string[];
}

interface AssignmentScope {
  teacherId: string;
  classId: string;
  subject: string;
}

const ASSIGNMENT_SELECT = 'id, title, instructions, due_date, status, created_at, settings, rubric, attachments, assigned_classes, assigned_students';

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
    assignedClasses: row.assigned_classes || [],
    assignedStudents: row.assigned_students || [],
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

export async function createAssignment(scope: AssignmentScope, input: { title: string; instructions: string; dueDate: string | null; status?: 'Active' | 'Draft'; unitId?: string | null; settings?: Record<string, any>; rubric?: any[]; attachments?: { name: string; storagePath: string }[]; assignedClasses?: string[]; assignedStudents?: string[] }): Promise<{ id: string | null; error: string | null }> {
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
      assigned_classes: input.assignedClasses || [],
      assigned_students: input.assignedStudents || [],
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('Error creating assignment:', error);
    return { id: null, error: error?.message || 'Unknown error creating assignment' };
  }
  return { id: data.id, error: null };
}

const QUIZ_SELECT = 'id, title, due_date, release_at, status, approval_status, approval_rejection_note, created_at, settings, questions, sections, assigned_classes, assigned_students';

function mapQuiz(row: any): Quiz {
  return {
    id: row.id,
    title: row.title,
    dueDate: row.due_date,
    releaseAt: row.release_at,
    status: row.status,
    approvalStatus: row.approval_status || 'approved',
    approvalRejectionNote: row.approval_rejection_note || null,
    createdAt: row.created_at,
    settings: row.settings || {},
    questions: row.questions || [],
    sections: row.sections || [],
    assignedClasses: row.assigned_classes || [],
    assignedStudents: row.assigned_students || [],
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

export async function createQuiz(scope: AssignmentScope, input: { title: string; dueDate: string | null; releaseAt: string | null; status?: 'Active' | 'Draft'; approvalStatus?: 'pending' | 'approved'; unitId?: string | null; settings?: Record<string, any>; questions: QuizQuestion[]; sections: any[]; assignedClasses?: string[]; assignedStudents?: string[] }): Promise<{ id: string | null; error: string | null }> {
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
      approval_status: input.approvalStatus || 'approved',
      unit_id: input.unitId || null,
      settings: input.settings || {},
      questions: input.questions || [],
      sections: input.sections || [],
      assigned_classes: input.assignedClasses || [],
      assigned_students: input.assignedStudents || [],
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('Error creating quiz:', error);
    return { id: null, error: error?.message || 'Unknown error creating quiz' };
  }
  return { id: data.id, error: null };
}

export async function updateAssignment(id: string, input: { title?: string; instructions?: string; dueDate?: string | null; status?: string; unitId?: string | null; settings?: Record<string, any>; rubric?: any[]; attachments?: { name: string; storagePath: string }[]; assignedClasses?: string[]; assignedStudents?: string[] }): Promise<{ ok: boolean; error: string | null }> {
  const patch: any = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.instructions !== undefined) patch.instructions = input.instructions;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate;
  if (input.status !== undefined) patch.status = input.status;
  if (input.unitId !== undefined) patch.unit_id = input.unitId;
  if (input.settings !== undefined) patch.settings = input.settings;
  if (input.rubric !== undefined) patch.rubric = input.rubric;
  if (input.attachments !== undefined) patch.attachments = input.attachments;
  if (input.assignedClasses !== undefined) patch.assigned_classes = input.assignedClasses;
  if (input.assignedStudents !== undefined) patch.assigned_students = input.assignedStudents;
  const { error } = await supabase.from('assignments').update(patch).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

export async function updateQuiz(id: string, input: { title?: string; dueDate?: string | null; releaseAt?: string | null; status?: string; approvalStatus?: 'pending' | 'approved' | 'rejected'; approvalRejectionNote?: string | null; unitId?: string | null; settings?: Record<string, any>; questions?: QuizQuestion[]; sections?: any[]; assignedClasses?: string[]; assignedStudents?: string[] }): Promise<{ ok: boolean; error: string | null }> {
  const patch: any = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate;
  if (input.releaseAt !== undefined) patch.release_at = input.releaseAt;
  if (input.status !== undefined) patch.status = input.status;
  if (input.approvalStatus !== undefined) patch.approval_status = input.approvalStatus;
  if (input.approvalRejectionNote !== undefined) patch.approval_rejection_note = input.approvalRejectionNote;
  if (input.unitId !== undefined) patch.unit_id = input.unitId;
  if (input.settings !== undefined) patch.settings = input.settings;
  if (input.questions !== undefined) patch.questions = input.questions;
  if (input.sections !== undefined) patch.sections = input.sections;
  if (input.assignedClasses !== undefined) patch.assigned_classes = input.assignedClasses;
  if (input.assignedStudents !== undefined) patch.assigned_students = input.assignedStudents;
  const { error } = await supabase.from('assignments').update(patch).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

export async function deleteAssignment(id: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('assignments').delete().eq('id', id);
  return { ok: !error, error: error?.message || null };
}

// بيجيب الوحدات (Modules) الحقيقية للفصل والمادة دي، عشان تقدر تربط الواجب/الكويز بوحدة
// بيجيب فصول تانية بتاعة نفس المعلم عشان يقدر يشارك الواجب/الكويز معاها
export async function getTeacherOtherClasses(teacherId: string, excludeClassId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('class_sections').select('id, name').eq('teacher_id', teacherId);
  if (error) return [];
  return (data || []).filter((c: any) => c.id !== excludeClassId);
}

// بيجيب طلاب الفصل الحالي عشان تقدر تخصص لطلاب معيّنين بس
export async function getClassRoster(classId: string): Promise<{ id: string; name: string }[]> {
  const { data, error } = await supabase.from('class_sections').select('enrollments ( student_id, students ( id, users ( name ) ) )').eq('id', classId).maybeSingle();
  if (error || !data) return [];
  const enrollments = (data as any).enrollments || [];
  return enrollments.map((e: any) => ({ id: e.students?.id || e.student_id, name: e.students?.users?.name || '' })).filter((s: any) => s.id);
}

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

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: Record<string, any>;
  score: number | null;
  maxScore: number | null;
  needsManualReview: boolean;
  status: 'in_progress' | 'submitted' | 'graded';
  startedAt: string;
  submittedAt: string | null;
}

function mapQuizAttempt(row: any): QuizAttempt {
  return {
    id: row.id,
    quizId: row.quiz_id,
    studentId: row.student_id,
    answers: row.answers || {},
    score: row.score,
    maxScore: row.max_score,
    needsManualReview: row.needs_manual_review,
    status: row.status,
    startedAt: row.started_at,
    submittedAt: row.submitted_at,
  };
}

// بيبدأ محاولة جديدة للطالب في الكويز، أو يرجّع المحاولة الموجودة لو فيه واحدة أصلًا
export async function startOrGetQuizAttempt(quizId: string, studentId: string): Promise<QuizAttempt | null> {
  const { data: existing } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).eq('student_id', studentId).maybeSingle();
  if (existing) return mapQuizAttempt(existing);
  const { data, error } = await supabase.from('quiz_attempts').insert({ quiz_id: quizId, student_id: studentId, answers: {} }).select('*').single();
  if (error || !data) {
    console.error('Error starting quiz attempt:', error);
    return null;
  }
  return mapQuizAttempt(data);
}

// بيحفظ إجابة سؤال واحد أثناء ما الطالب لسه بياخد الكويز
export async function saveQuizAnswer(attemptId: string, questionId: string, answer: any): Promise<void> {
  const { data } = await supabase.from('quiz_attempts').select('answers').eq('id', attemptId).maybeSingle();
  const answers = { ...(data?.answers || {}), [questionId]: answer };
  await supabase.from('quiz_attempts').update({ answers }).eq('id', attemptId);
}

// بيسلّم الكويز ويصحح تلقائيًا الأسئلة اللي ليها إجابة صحيحة محددة (اختيار من متعدد / صح وغلط)
export async function submitQuizAttempt(attemptId: string, quiz: Quiz): Promise<{ ok: boolean; score: number; maxScore: number; needsManualReview: boolean; error: string | null }> {
  const { data: attempt } = await supabase.from('quiz_attempts').select('answers').eq('id', attemptId).maybeSingle();
  const answers = attempt?.answers || {};
  let score = 0;
  let maxScore = 0;
  let needsManualReview = false;

  for (const q of quiz.questions || []) {
    maxScore += q.points || 0;
    if (q.type === 'multiple_choice' || q.type === 'true_false') {
      const correctOption = (q.options || []).find((o: any) => o.isCorrect);
      const studentAnswer = answers[q.id];
      if (correctOption && studentAnswer === correctOption.id) {
        score += q.points || 0;
      }
    } else if (q.type === 'numeric_answer') {
      const studentAnswer = parseFloat(answers[q.id]);
      const correctValue = typeof q.numericAnswer === 'number' ? q.numericAnswer : NaN;
      const tolerance = q.numericTolerance || 0;
      if (!isNaN(studentAnswer) && !isNaN(correctValue) && Math.abs(studentAnswer - correctValue) <= tolerance) {
        score += q.points || 0;
      }
    } else if (q.type === 'matching' && Array.isArray(q.pairs) && q.pairs.length > 0) {
      const studentPairs = answers[q.id] || {};
      const correctCount = q.pairs.filter((p: any) => studentPairs[p.id] === p.right).length;
      score += (q.points || 0) * (correctCount / q.pairs.length);
    } else if (q.type === 'ordering' && Array.isArray(q.orderItems) && q.orderItems.length > 0) {
      const studentOrder: string[] = answers[q.id] || [];
      const correctPositions = q.orderItems.filter((item: string, idx: number) => studentOrder[idx] === item).length;
      score += (q.points || 0) * (correctPositions / q.orderItems.length);
    } else if (q.type === 'classification' && Array.isArray(q.classifyItems) && q.classifyItems.length > 0) {
      const studentAnswers = answers[q.id] || {};
      const correctCount = q.classifyItems.filter((item: any, idx: number) => studentAnswers[idx] === item.category).length;
      score += (q.points || 0) * (correctCount / q.classifyItems.length);
    } else if (q.type === 'drag_and_drop' && Array.isArray(q.dragItems) && q.dragItems.length > 0) {
      const studentAssignments = answers[q.id] || {};
      const correctCount = q.dragItems.filter((item: any) => studentAssignments[item.text] === item.zone).length;
      score += (q.points || 0) * (correctCount / q.dragItems.length);
    } else if (q.type === 'hotspot' && Array.isArray(q.hotspots) && q.hotspots.length > 0) {
      const selectedIdx = answers[q.id];
      const selectedHotspot = typeof selectedIdx === 'number' ? q.hotspots[selectedIdx] : null;
      if (selectedHotspot && selectedHotspot.isCorrect) {
        score += q.points || 0;
      }
    } else if (q.type === 'passage' && Array.isArray(q.subQuestions) && q.subQuestions.length > 0) {
      const subAnswers = answers[q.id] || {};
      for (const sq of q.subQuestions) {
        if (sq.type === 'اختيار من متعدد' || sq.type === 'صح أم خطأ') {
          const correctOption = (sq.options || []).find((o: any) => o.isCorrect);
          if (correctOption && subAnswers[sq.id] === correctOption.id) {
            score += sq.points || 0;
          }
        } else {
          // الأسئلة الفرعية "إجابة قصيرة" محتاجة مراجعة يدوية من المعلم
          needsManualReview = true;
        }
      }
    } else {
      // short_answer و file_upload محتاجين مراجعة يدوية من المعلم
      needsManualReview = true;
    }
  }

  const { error } = await supabase
    .from('quiz_attempts')
    .update({
      status: needsManualReview ? 'submitted' : 'graded',
      score,
      max_score: maxScore,
      needs_manual_review: needsManualReview,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', attemptId);

  return { ok: !error, score, maxScore, needsManualReview, error: error?.message || null };
}

export async function getMyQuizAttempt(quizId: string, studentId: string): Promise<QuizAttempt | null> {
  const { data, error } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).eq('student_id', studentId).maybeSingle();
  if (error || !data) return null;
  return mapQuizAttempt(data);
}

export async function getQuizAttemptsForQuiz(quizId: string, classId: string): Promise<(QuizAttempt & { studentName: string })[]> {
  const roster = await getClassRoster(classId);
  const { data } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId);
  return roster.map((s) => {
    const row = (data || []).find((a: any) => a.student_id === s.id);
    if (row) return { ...mapQuizAttempt(row), studentName: s.name };
    return { id: '', quizId, studentId: s.id, answers: {}, score: null, maxScore: null, needsManualReview: false, status: 'in_progress' as const, startedAt: '', submittedAt: null, studentName: s.name };
  });
}

export async function gradeQuizManualQuestion(attemptId: string, extraScore: number): Promise<{ ok: boolean; error: string | null }> {
  const { data: attempt } = await supabase.from('quiz_attempts').select('score').eq('id', attemptId).maybeSingle();
  const newScore = (attempt?.score || 0) + extraScore;
  const { error } = await supabase.from('quiz_attempts').update({ score: newScore, status: 'graded', needs_manual_review: false }).eq('id', attemptId);
  return { ok: !error, error: error?.message || null };
}

// الواجبات والكويزات الحقيقية المرتبطة بوحدات معيّنة في مسار التعلّم — عشان تظهر فعليًا كعناصر داخل الموديول
export async function getAssignmentsForUnits(unitIds: string[]): Promise<{ id: string; unitId: string; title: string; type: 'assignment' | 'quiz'; dueDate: string | null; status: string }[]> {
  if (unitIds.length === 0) return [];
  const { data, error } = await supabase
    .from('assignments')
    .select('id, unit_id, title, type, due_date, status')
    .in('unit_id', unitIds);
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    unitId: row.unit_id,
    title: row.title,
    type: row.type === 'quiz' ? 'quiz' as const : 'assignment' as const,
    dueDate: row.due_date,
    status: row.status,
  }));
}
