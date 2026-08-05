import { supabase } from '@/lib/supabaseClient';

export type BankScope = 'central' | 'shared' | 'private';
export type BankStatus = 'approved' | 'pending' | 'rejected';

export interface BankQuestion {
  id: string;
  title: string; // نسخة مباشرة من question.title، عشان يسهل استخدامها في الفلاتر والعرض
  options?: any[]; // نسخة مباشرة من question.options لو موجودة (لأسئلة الاختيار من متعدد)
  createdBy: string | null;
  createdByRole: 'teacher' | 'supervisor';
  scope: BankScope;
  subject: string;
  grade: string;
  unit: string;
  lesson: string | null;
  bloomLevel: string;
  difficulty: string;
  type: string;
  question: any; // شكل مرن حسب نوع السؤال: { title, options?: [{id,text,isCorrect}], correctAnswer? }
  status: BankStatus;
  rejectionNote: string | null;
  createdAt: string;
}

export interface QuestionScope {
  teacherId?: string; // فاضي لو اللي بيسأل مشرف بنك الأسئلة
  isSupervisor: boolean;
  subject?: string;
  grade?: string;
}

function mapRow(row: any): BankQuestion {
  return {
    id: row.id,
    title: row.question?.title || '',
    options: row.question?.options,
    createdBy: row.created_by,
    createdByRole: row.created_by_role,
    scope: row.scope,
    subject: row.subject,
    grade: row.grade,
    unit: row.unit,
    lesson: row.lesson,
    bloomLevel: row.bloom_level,
    difficulty: row.difficulty,
    type: row.type,
    question: row.question,
    status: row.status,
    rejectionNote: row.rejection_note,
    createdAt: row.created_at,
  };
}

// بيجيب كل الأسئلة اللي المستخدم ده مسموحله يشوفها:
// - المشرف: كل حاجة (كل النطاقات وكل الحالات)
// - المعلم: أسئلته الخاصة (أي حالة) + المشترك والمركزي المعتمدين بس
export async function getVisibleQuestions(scope: QuestionScope): Promise<BankQuestion[]> {
  let query = supabase.from('question_bank').select('*').order('created_at', { ascending: false });

  if (!scope.isSupervisor) {
    if (scope.teacherId) {
      query = query.or(`created_by.eq.${scope.teacherId},and(scope.neq.private,status.eq.approved)`);
    } else {
      query = query.eq('scope', 'central').eq('status', 'approved');
    }
  }
  if (scope.subject) query = query.eq('subject', scope.subject);
  if (scope.grade) query = query.eq('grade', scope.grade);

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching question bank:', error);
    return [];
  }
  return (data || []).map(mapRow);
}

export async function createQuestion(input: {
  createdBy: string | null;
  createdByRole: 'teacher' | 'supervisor';
  scope: BankScope;
  subject: string;
  grade: string;
  unit: string;
  lesson?: string;
  bloomLevel: string;
  difficulty: string;
  type: string;
  question: any;
}): Promise<{ id: string | null; error: string | null }> {
  // المعلم لما يضيف سؤال لنطاق مشترك أو مركزي، بيدخل "معلّق" لحد ما مشرف بنك الأسئلة يعتمده
  // أسئلته الخاصة (private) بتتحفظ معتمدة على طول لأنها بس ليه هو
  const status: BankStatus = input.createdByRole === 'supervisor' || input.scope === 'private' ? 'approved' : 'pending';

  const { data, error } = await supabase
    .from('question_bank')
    .insert({
      created_by: input.createdBy,
      created_by_role: input.createdByRole,
      scope: input.scope,
      subject: input.subject,
      grade: input.grade,
      unit: input.unit,
      lesson: input.lesson || null,
      bloom_level: input.bloomLevel,
      difficulty: input.difficulty,
      type: input.type,
      question: input.question,
      status,
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error creating bank question:', error);
    return { id: null, error: error?.message || 'Unknown error' };
  }
  return { id: data.id, error: null };
}

export async function updateQuestion(id: string, input: Partial<{
  subject: string; grade: string; unit: string; lesson: string; bloomLevel: string; difficulty: string; type: string; question: any; scope: BankScope;
}>): Promise<{ ok: boolean; error: string | null }> {
  const patch: any = {};
  if (input.subject !== undefined) patch.subject = input.subject;
  if (input.grade !== undefined) patch.grade = input.grade;
  if (input.unit !== undefined) patch.unit = input.unit;
  if (input.lesson !== undefined) patch.lesson = input.lesson;
  if (input.bloomLevel !== undefined) patch.bloom_level = input.bloomLevel;
  if (input.difficulty !== undefined) patch.difficulty = input.difficulty;
  if (input.type !== undefined) patch.type = input.type;
  if (input.question !== undefined) patch.question = input.question;
  if (input.scope !== undefined) patch.scope = input.scope;
  const { error } = await supabase.from('question_bank').update(patch).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

export async function deleteQuestion(id: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('question_bank').delete().eq('id', id);
  return { ok: !error, error: error?.message || null };
}

// ============ الاعتمادات (يستخدمها المشرف بس) ============

export async function getPendingQuestions(): Promise<(BankQuestion & { creatorName: string })[]> {
  const { data, error } = await supabase
    .from('question_bank')
    .select('*, teachers(users(name))')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || []).map((row: any) => ({
    ...mapRow(row),
    creatorName: row.teachers?.users?.name || 'غير معروف',
  }));
}

export async function approveQuestion(id: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('question_bank').update({ status: 'approved', rejection_note: null }).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

export async function rejectQuestion(id: string, note: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('question_bank').update({ status: 'rejected', rejection_note: note }).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

// ============ ربط أسئلة البنك بكويز حقيقي (لمخطط التقييمات أو الاختيار اليدوي) ============

export async function linkQuestionsToQuiz(quizId: string, questionBankIds: string[]): Promise<void> {
  if (questionBankIds.length === 0) return;
  const rows = questionBankIds.map((qid) => ({ quiz_id: quizId, question_bank_id: qid }));
  const { error } = await supabase.from('question_bank_quiz_links').insert(rows);
  if (error) console.error('Error linking bank questions to quiz:', error);
}

export async function unlinkAllQuestionsFromQuiz(quizId: string): Promise<void> {
  const { error } = await supabase.from('question_bank_quiz_links').delete().eq('quiz_id', quizId);
  if (error) console.error('Error unlinking bank questions from quiz:', error);
}

// خوارزمية اختيار حقيقية من البنك حسب نسب الصعوبة ومستويات بلوم اللي المستخدم حددها
export async function generateBlueprintQuestions(input: {
  subject: string;
  grade: string;
  totalQuestions: number;
  difficultyPercents: { 'سهل': number; 'متوسط': number; 'صعب': number };
  bloomPercents: Record<string, number>;
  types?: string[];
}): Promise<BankQuestion[]> {
  const pool = await getVisibleQuestions({ subject: input.subject, grade: input.grade, isSupervisor: true });
  const approved = pool.filter((q) => q.status === 'approved' && (!input.types || input.types.length === 0 || input.types.includes(q.type)));

  const difficulties: ('سهل' | 'متوسط' | 'صعب')[] = ['سهل', 'متوسط', 'صعب'];
  const selected: BankQuestion[] = [];
  const usedIds = new Set<string>();

  for (const diff of difficulties) {
    const wantCount = Math.round((input.difficultyPercents[diff] / 100) * input.totalQuestions);
    if (wantCount <= 0) continue;
    const diffPool = approved.filter((q) => q.difficulty === diff && !usedIds.has(q.id));

    // حاول توزّع حسب مستويات بلوم جوه نفس مستوى الصعوبة ده
    const bloomLevels = Object.keys(input.bloomPercents).filter((b) => input.bloomPercents[b] > 0);
    let pickedInDiff: BankQuestion[] = [];
    if (bloomLevels.length > 0) {
      for (const bloom of bloomLevels) {
        const wantBloomCount = Math.round((input.bloomPercents[bloom] / 100) * wantCount);
        const bloomPool = diffPool.filter((q) => q.bloomLevel === bloom && !usedIds.has(q.id));
        const picks = bloomPool.slice(0, wantBloomCount);
        picks.forEach((p) => usedIds.add(p.id));
        pickedInDiff.push(...picks);
      }
    }
    // لو لسه ناقص عدد (مفيش أسئلة كفاية تطابق مستوى بلوم)، كمّل من نفس مستوى الصعوبة من غير قيد بلوم
    if (pickedInDiff.length < wantCount) {
      const remaining = diffPool.filter((q) => !usedIds.has(q.id));
      const extra = remaining.slice(0, wantCount - pickedInDiff.length);
      extra.forEach((p) => usedIds.add(p.id));
      pickedInDiff.push(...extra);
    }
    selected.push(...pickedInDiff);
  }

  return selected;
}

// التقييمات الحقيقية اللي اتعملت عن طريق مخطط بنك الأسئلة (مش أي كويز عادي)
export async function getBlueprintAssessments(scope: { teacherId?: string; isSupervisor: boolean }): Promise<{ id: string; title: string; subject: string; status: string; approvalStatus: string; questionCount: number; totalPoints: number; className: string; classId: string; createdAt: string }[]> {
  const { data: links, error: linksError } = await supabase.from('question_bank_quiz_links').select('quiz_id');
  if (linksError || !links) return [];
  const quizIds = Array.from(new Set(links.map((l: any) => l.quiz_id)));
  if (quizIds.length === 0) return [];

  let query = supabase
    .from('assignments')
    .select('id, title, subject, status, approval_status, questions, created_at, class_id, class_sections(name)')
    .in('id', quizIds);
  if (!scope.isSupervisor && scope.teacherId) {
    query = query.eq('teacher_id', scope.teacherId);
  }
  const { data, error } = await query;
  if (error) return [];

  return (data || []).map((row: any) => {
    const qs = row.questions || [];
    return {
      id: row.id,
      title: row.title,
      subject: row.subject,
      status: row.status,
      approvalStatus: row.approval_status || 'approved',
      questionCount: qs.length,
      totalPoints: qs.reduce((sum: number, q: any) => sum + (q.points || 0), 0),
      className: row.class_sections?.name || '',
      classId: row.class_id,
      createdAt: row.created_at,
    };
  });
}

// التقييمات المولّدة من مخطط بنك الأسئلة واللي لسه بانتظار اعتماد مشرف بنك الأسئلة
export async function getPendingAssessments(): Promise<{ id: string; title: string; subject: string; className: string; teacherName: string; questionCount: number; createdAt: string }[]> {
  const { data: links, error: linksError } = await supabase.from('question_bank_quiz_links').select('quiz_id');
  if (linksError || !links) return [];
  const quizIds = Array.from(new Set(links.map((l: any) => l.quiz_id)));
  if (quizIds.length === 0) return [];

  const { data, error } = await supabase
    .from('assignments')
    .select('id, title, subject, questions, created_at, class_sections(name), teachers(users(name))')
    .in('id', quizIds)
    .eq('approval_status', 'pending')
    .order('created_at', { ascending: true });
  if (error) return [];

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    subject: row.subject,
    className: row.class_sections?.name || '',
    teacherName: row.teachers?.users?.name || 'غير معروف',
    questionCount: (row.questions || []).length,
    createdAt: row.created_at,
  }));
}

// بيجيب تفاصيل تقييم واحد بانتظار الاعتماد، مع الأسئلة الحقيقية المرتبطة بيه لعرضها في شاشة المراجعة
export async function getPendingAssessmentDetail(assignmentId: string): Promise<{
  id: string; title: string; subject: string; className: string; teacherName: string; createdAt: string;
  bloomData: { name: string; value: number }[];
  difficultyData: { name: string; value: number; color: string }[];
  questions: BankQuestion[];
} | null> {
  const { data: row, error } = await supabase
    .from('assignments')
    .select('id, title, subject, created_at, class_sections(name), teachers(users(name))')
    .eq('id', assignmentId)
    .maybeSingle();
  if (error || !row) return null;

  const questions = await getQuestionsForQuiz(assignmentId);
  const bloomLevels = ['تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'ابتكار'];
  const bloomData = bloomLevels.map((name) => ({ name, value: questions.filter((q) => q.bloomLevel === name).length })).filter((b) => b.value > 0);
  const diffColors: Record<string, string> = { 'سهل': '#10b981', 'متوسط': '#f59e0b', 'صعب': '#f43f5e' };
  const difficultyData = ['سهل', 'متوسط', 'صعب'].map((name) => ({ name, value: questions.filter((q) => q.difficulty === name).length, color: diffColors[name] })).filter((d) => d.value > 0);

  return {
    id: (row as any).id,
    title: (row as any).title,
    subject: (row as any).subject,
    className: (row as any).class_sections?.name || '',
    teacherName: (row as any).teachers?.users?.name || 'غير معروف',
    createdAt: (row as any).created_at,
    bloomData,
    difficultyData,
    questions,
  };
}

export async function approveAssessment(id: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('assignments').update({ approval_status: 'approved', approval_rejection_note: null }).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

export async function rejectAssessment(id: string, note: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('assignments').update({ approval_status: 'rejected', approval_rejection_note: note, status: 'Draft' }).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

// تحليلات حقيقية لبنك الأسئلة (لوحة البيانات) — بتحسب كل الأرقام من الأسئلة الفعلية في قاعدة البيانات
export async function getBankAnalytics(filters?: { grade?: string; subject?: string; daysBack?: number }): Promise<{
  bloomData: { name: string; value: number }[];
  difficultyData: { name: string; value: number; color: string }[];
  typeData: { subject: string; A: number; fullMark: number }[];
  recentQuestions: { title: string; type: string; time: string; subject: string }[];
  topSubjects: { name: string; count: number; percent: number }[];
  totalQuestions: number;
  approvedCount: number;
  activeSubjectsCount: number;
}> {
  let query = supabase.from('question_bank').select('*');
  if (filters?.grade) query = query.eq('grade', filters.grade);
  if (filters?.subject) query = query.eq('subject', filters.subject);
  if (filters?.daysBack) {
    const since = new Date();
    since.setDate(since.getDate() - filters.daysBack);
    query = query.gte('created_at', since.toISOString());
  }
  const { data, error } = await query;
  if (error || !data) {
    return { bloomData: [], difficultyData: [], typeData: [], recentQuestions: [], topSubjects: [], totalQuestions: 0, approvedCount: 0, activeSubjectsCount: 0 };
  }

  const bloomLevels = ['تذكر', 'فهم', 'تطبيق', 'تحليل', 'تقييم', 'ابتكار'];
  const bloomData = bloomLevels.map((name) => ({ name, value: data.filter((q: any) => q.bloom_level === name).length }));

  const diffColors: Record<string, string> = { 'سهل': '#10b981', 'متوسط': '#f59e0b', 'صعب': '#f43f5e' };
  const difficultyData = ['سهل', 'متوسط', 'صعب'].map((name) => ({ name, value: data.filter((q: any) => q.difficulty === name).length, color: diffColors[name] }));

  const typeCounts: Record<string, number> = {};
  data.forEach((q: any) => { typeCounts[q.type] = (typeCounts[q.type] || 0) + 1; });
  const maxTypeCount = Math.max(1, ...Object.values(typeCounts));
  const typeData = Object.keys(typeCounts).map((subject) => ({ subject, A: Math.round((typeCounts[subject] / maxTypeCount) * 100), fullMark: 100 }));

  const recentQuestions = [...data]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((q: any) => ({ title: q.question?.title || '', type: q.type, time: new Date(q.created_at).toLocaleDateString(), subject: q.subject }));

  const subjectCounts: Record<string, number> = {};
  data.forEach((q: any) => { subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1; });
  const maxSubjectCount = Math.max(1, ...Object.values(subjectCounts));
  const topSubjects = Object.keys(subjectCounts)
    .map((name) => ({ name, count: subjectCounts[name], percent: Math.round((subjectCounts[name] / maxSubjectCount) * 100) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    bloomData,
    difficultyData,
    typeData,
    recentQuestions,
    topSubjects,
    totalQuestions: data.length,
    approvedCount: data.filter((q: any) => q.status === 'approved').length,
    activeSubjectsCount: new Set(data.map((q: any) => q.subject)).size,
  };
}

// بيجيب أسئلة بنك محددة بالـ id بتاعها (يستخدم لإعادة فتح تقييم موجود اتعمل بالمخطط للتعديل)
export async function getQuestionsByIds(ids: string[]): Promise<BankQuestion[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('question_bank').select('*').in('id', ids);
  if (error) return [];
  return (data || []).map(mapRow);
}

// بيجيب أسئلة بنك مرتبطة بكويز معيّن (عن طريق جدول الربط)
export async function getQuestionsForQuiz(quizId: string): Promise<BankQuestion[]> {
  const { data: links, error: linksError } = await supabase.from('question_bank_quiz_links').select('question_bank_id').eq('quiz_id', quizId);
  if (linksError || !links) return [];
  return getQuestionsByIds(links.map((l: any) => l.question_bank_id));
}

// تحويل سؤال حقيقي من بنك الأسئلة لصيغة السؤال اللي محرك تسليم الاختبار (AssessmentsTab) فاهمها فعليًا
// بيصلّح 3 مشاكل حرجة كانت موجودة قبل كده: (1) الحقل type مكانش موجود خالص فيسقط أي تصحيح تلقائي،
// (2) عنوان السؤال كان محفوظ باسم title بس المحرك بيقرا text، (3) مفيش نقاط لكل سؤال فيبقى المجموع صفر
export function convertBankQuestionToQuizQuestion(bq: BankQuestion, pointsPerQuestion: number = 1): any {
  const typeMap: Record<string, string> = {
    'اختيار من متعدد': 'multiple_choice',
    'صح أم خطأ': 'true_false',
    'سؤال مقالي': 'short_answer',
    'أكمل الفراغ': 'short_answer',
    'إجابة قصيرة': 'short_answer',
  };
  return {
    id: bq.id,
    text: bq.title,
    type: typeMap[bq.type] || 'short_answer',
    options: bq.options,
    points: pointsPerQuestion,
  };
}
