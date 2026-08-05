import { supabase } from '@/lib/supabaseClient';

// الخدمة دي بتزامن درجات Talia Learn (الواجبات والكويزات) مع جدول الدرجات الحقيقي
// في Talia 360 (نفس قاعدة البيانات، جداول gradebook_configs / assessments / grade_entries)

// بيلاقي إعداد الدرجات (gradebook config) الحقيقي لمادة وصف معيّنين
export async function getGradebookConfigId(subject: string, grade: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('gradebook_configs')
    .select('id, gradebook_config_grades ( grade )')
    .eq('subject_name', subject);
  if (error || !data) return null;
  const match = data.find((row: any) => (row.gradebook_config_grades || []).some((g: any) => g.grade === grade));
  return match ? (match as any).id : null;
}

// بيجيب أول فصل دراسي موجود، ولو مفيش بينشئ واحد افتراضي (زي ما 360 بتعمل بالظبط)
export async function getOrCreateDefaultTermId(): Promise<string | null> {
  const { data, error } = await supabase.from('grading_terms').select('id').order('created_at', { ascending: true }).limit(1);
  if (!error && data && data.length > 0) return data[0].id;
  const { data: newTerm, error: insertError } = await supabase
    .from('grading_terms')
    .insert({ name: 'الفصل الدراسي الأول' })
    .select('id')
    .single();
  if (insertError || !newTerm) {
    console.error('Error creating default term:', insertError);
    return null;
  }
  return newTerm.id;
}

// بيلاقي أو ينشئ عنصر التقييم (assessment) المطابق في جدول درجات 360، عشان أي مزامنة تالية تستخدم نفس السطر مش تكرره
export async function syncAssessmentToGradebook(input: {
  subject: string;
  grade: string;
  title: string;
  category: string;
  maxScore: number;
  sourceType: 'assignment' | 'quiz';
  sourceId: string;
}): Promise<string | null> {
  const configId = await getGradebookConfigId(input.subject, input.grade);
  if (!configId) return null; // مفيش إعداد درجات معتمد لسه لمادة وصف الفصل ده، مفيش حاجة نزامنها بيه

  // بندوّر على عنصر تقييم مرتبط بنفس المصدر (Talia Learn) قبل كده عشان منكررش
  const { data: existing } = await supabase
    .from('assessments')
    .select('id')
    .eq('config_id', configId)
    .eq('source_type', input.sourceType)
    .eq('source_id', input.sourceId)
    .maybeSingle();
  if (existing) return existing.id;

  const termId = await getOrCreateDefaultTermId();
  if (!termId) return null;

  const { data, error } = await supabase
    .from('assessments')
    .insert({
      config_id: configId,
      term_id: termId,
      title: input.title,
      category: input.category || 'Uncategorized',
      max_score: input.maxScore,
      date: new Date().toISOString().slice(0, 10),
      source_type: input.sourceType,
      source_id: input.sourceId,
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('Error syncing assessment to gradebook:', error);
    return null;
  }
  return data.id;
}

// بيسجّل درجة طالب فعليًا في جدول الدرجات الحقيقي (grade_entries)
export async function syncGradeEntry(assessmentId: string, studentId: string, score: number | null, status: string): Promise<boolean> {
  const { error } = await supabase.from('grade_entries').upsert(
    { assessment_id: assessmentId, student_id: studentId, score, status },
    { onConflict: 'assessment_id,student_id' }
  );
  if (error) {
    console.error('Error syncing grade entry:', error);
    return false;
  }
  return true;
}

// بتعمل الاتنين مرة واحدة: تتأكد إن عنصر التقييم موجود، وبعدين تسجّل درجة الطالب
export async function syncGradeToGradebook(input: {
  subject: string;
  grade: string;
  title: string;
  category: string;
  maxScore: number;
  sourceType: 'assignment' | 'quiz';
  sourceId: string;
  studentId: string;
  score: number | null;
  status: string;
}): Promise<boolean> {
  const assessmentId = await syncAssessmentToGradebook(input);
  if (!assessmentId) return false;
  return syncGradeEntry(assessmentId, input.studentId, input.score, input.status);
}

// بيجيب إعداد الدرجات الكامل (id + أوزان الفئات) لمادة وصف معيّنين
export async function getGradebookConfigFull(subject: string, grade: string): Promise<{ id: string; categoryWeights: Record<string, number>; passingScore: number } | null> {
  const { data, error } = await supabase
    .from('gradebook_configs')
    .select('id, category_weights, passing_score, gradebook_config_grades ( grade )')
    .eq('subject_name', subject);
  if (error || !data) return null;
  const match = data.find((row: any) => (row.gradebook_config_grades || []).some((g: any) => g.grade === grade));
  if (!match) return null;
  return { id: (match as any).id, categoryWeights: (match as any).category_weights || {}, passingScore: (match as any).passing_score };
}

// بيجيب كل عناصر التقييم الحقيقية (Assessments) بتاعة إعداد درجات معيّن
export async function getRealAssessments(configId: string): Promise<{ id: string; title: string; category: string; maxScore: number }[]> {
  const { data, error } = await supabase.from('assessments').select('id, title, category, max_score').eq('config_id', configId).order('date', { ascending: true });
  if (error) return [];
  return (data || []).map((row: any) => ({ id: row.id, title: row.title, category: row.category, maxScore: row.max_score }));
}

// بيجيب كل الدرجات الحقيقية بتاعة إعداد درجات معيّن، منظّمة (studentId-assessmentId -> score)
export async function getRealGradeEntries(configId: string): Promise<{ studentId: string; assessmentId: string; score: number | null; status: string }[]> {
  const { data, error } = await supabase
    .from('grade_entries')
    .select('student_id, assessment_id, score, status, assessments!inner(config_id)')
    .eq('assessments.config_id', configId);
  if (error) return [];
  return (data as any[]).map((row) => ({ studentId: row.student_id, assessmentId: row.assessment_id, score: row.score, status: row.status }));
}

