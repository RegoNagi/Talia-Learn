import { supabase } from '@/lib/supabaseClient';
import { Post, PostComment, PostInteractions } from '@/types/classSpace';

const EMPTY_INTERACTIONS: PostInteractions = { insightful: 0, helpful: 0, love: 0, celebration: 0, thinking: 0 };

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function mapPost(row: any, currentUserId?: string): Promise<Post> {
  const { data: reactions } = await supabase.from('class_post_reactions').select('reaction_type, user_id').eq('post_id', row.id);
  const { data: commentsRows } = await supabase.from('class_post_comments').select('*').eq('post_id', row.id).order('created_at', { ascending: true });

  const interactions: PostInteractions = { ...EMPTY_INTERACTIONS };
  (reactions || []).forEach((r: any) => {
    if (interactions[r.reaction_type as keyof PostInteractions] !== undefined) {
      interactions[r.reaction_type as keyof PostInteractions]++;
    }
  });

  const comments: PostComment[] = (commentsRows || []).map((c: any) => ({
    id: c.id,
    author: { id: c.author_id, name: c.author_name || 'Unknown', role: c.author_role, avatar: '' },
    content: c.content,
    timestamp: timeAgo(c.created_at),
  }));

  return {
    id: row.id,
    author: { id: row.author_id, name: row.author_name || 'Unknown', role: row.author_role, avatar: '' },
    timestamp: timeAgo(row.created_at),
    content: row.content,
    topicTag: row.topic_tag || undefined,
    media: row.media || undefined,
    interactions,
    comments,
    type: 'standard',
  };
}

export async function getRealPosts(classId: string, subject: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('class_posts')
    .select('*')
    .eq('class_id', classId)
    .eq('subject', subject)
    .order('created_at', { ascending: false });
  if (error || !data) {
    console.error('Error fetching posts:', error);
    return [];
  }
  return Promise.all(data.map((row) => mapPost(row)));
}

// بوستات "مساحة المدرسة" — مش مربوطة بفصل أو مادة معيّنة (على مستوى المدرسة كلها)
export async function getRealSchoolPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('class_posts')
    .select('*')
    .is('class_id', null)
    .is('subject', null)
    .order('created_at', { ascending: false });
  if (error || !data) {
    console.error('Error fetching school posts:', error);
    return [];
  }
  return Promise.all(data.map((row) => mapPost(row)));
}

export async function createRealSchoolPost(input: {
  authorId: string;
  authorRole: string;
  authorName: string;
  content: string;
  topicTag?: string;
  media?: any;
}): Promise<Post | null> {
  const { data, error } = await supabase
    .from('class_posts')
    .insert({
      class_id: null,
      subject: null,
      author_id: input.authorId,
      author_role: input.authorRole,
      author_name: input.authorName,
      content: input.content,
      topic_tag: input.topicTag || null,
      media: input.media || null,
    })
    .select('*')
    .single();
  if (error || !data) {
    console.error('Error creating school post:', error);
    return null;
  }
  return mapPost(data);
}

export async function createRealPost(input: {
  classId: string;
  subject: string;
  authorId: string;
  authorRole: string;
  authorName: string;
  content: string;
  topicTag?: string;
  media?: any;
}): Promise<Post | null> {
  const { data, error } = await supabase
    .from('class_posts')
    .insert({
      class_id: input.classId,
      subject: input.subject,
      author_id: input.authorId,
      author_role: input.authorRole,
      author_name: input.authorName,
      content: input.content,
      topic_tag: input.topicTag || null,
      media: input.media || null,
    })
    .select('*')
    .single();
  if (error || !data) {
    console.error('Error creating post:', error);
    return null;
  }
  return mapPost(data);
}

export async function reactToRealPost(postId: string, userId: string, reactionType: keyof PostInteractions): Promise<void> {
  await supabase.from('class_post_reactions').upsert(
    { post_id: postId, user_id: userId, reaction_type: reactionType },
    { onConflict: 'post_id,user_id,reaction_type' }
  );
}

export async function addRealComment(postId: string, authorId: string, authorRole: string, authorName: string, content: string): Promise<void> {
  await supabase.from('class_post_comments').insert({
    post_id: postId,
    author_id: authorId,
    author_role: authorRole,
    author_name: authorName,
    content,
  });
}

// ============ محول البيانات الحقيقية لويدجت الواجب/الكويز/المصادر في مساحة المادة ============

import { getAssignments, getQuizzes, createAssignment, createQuiz, getSubmissionFileUrl, getSubmissionsForAssignment } from './assignmentData';
import { getMaterialFiles } from './libraryData';
import { HomeworkItem, QuizItem, ResourceItem } from '@/types/classSpace';

export async function getRealHomeworkItems(scope: { teacherId: string; classId: string; subject: string; grade: string; className: string }): Promise<HomeworkItem[]> {
  const [items, roster] = await Promise.all([getAssignments(scope), getClassRoster(scope.classId)]);
  const results: HomeworkItem[] = [];
  for (const a of items) {
    const subs = await getSubmissionsForAssignment(a.id, scope.classId);
    const submittedCount = subs.filter((s) => s.status !== 'Pending').length;
    const ungradedCount = subs.filter((s) => s.status === 'Submitted' || s.status === 'Late').length;
    results.push({
      id: a.id,
      title: a.title,
      subject: scope.subject,
      grade: scope.grade,
      className: scope.className,
      dueDate: a.dueDate || '',
      totalStudents: roster.length,
      submittedCount,
      status: a.status === 'Draft' ? 'active' : a.status === 'Closed' ? 'closed' : ungradedCount > 0 ? 'grading' : 'active',
      instructions: a.instructions,
    });
  }
  return results;
}

export async function createRealHomeworkItem(scope: { teacherId: string; classId: string; subject: string }, data: { title: string; dueDate: string; instructions?: string }): Promise<HomeworkItem | null> {
  const { id, error } = await createAssignment(scope, { title: data.title, instructions: data.instructions || '', dueDate: data.dueDate || null });
  if (!id) {
    console.error('Error creating homework from Class Space:', error);
    return null;
  }
  return { id, title: data.title, subject: scope.subject, grade: '', className: '', dueDate: data.dueDate, totalStudents: 0, submittedCount: 0, status: 'active', instructions: data.instructions };
}

export async function getRealQuizItems(scope: { teacherId: string; classId: string; subject: string; grade: string; className: string }): Promise<QuizItem[]> {
  const items = await getQuizzes(scope);
  const results: QuizItem[] = [];
  for (const q of items) {
    const { count } = await supabase.from('quiz_attempts').select('id', { count: 'exact', head: true }).eq('quiz_id', q.id).neq('status', 'in_progress');
    results.push({
      id: q.id,
      title: q.title,
      subject: scope.subject,
      grade: scope.grade,
      className: scope.className,
      durationMinutes: (parseInt(q.settings?.timeLimitHours || '0') * 60) + parseInt(q.settings?.timeLimitMinutes || '0'),
      totalQuestions: q.questions?.length || 0,
      totalPoints: q.settings?.maxScore || 0,
      status: q.status === 'Draft' ? 'draft' : 'published',
      submissionsCount: count || 0,
    });
  }
  return results;
}

export async function getRealResourceItems(scope: { teacherId: string; classId: string; subject: string; grade: string }): Promise<ResourceItem[]> {
  const files = await getMaterialFiles(scope);
  const typeMap: Record<string, ResourceItem['type']> = { pdf: 'PDF', video: 'VIDEO', slides: 'PDF', doc: 'PDF', sheet: 'PDF', image: 'PDF', archive: 'PDF', code: 'PDF', other: 'PDF' };
  return files.map((f) => ({
    id: f.id,
    title: f.name,
    type: typeMap[f.type] || 'PDF',
    subject: scope.subject,
    grade: scope.grade,
    fileSize: f.size,
    url: f.storagePath ? getSubmissionFileUrl(f.storagePath) : '',
    category: f.type,
    downloadsCount: 0,
  }));
}

// ============ التحديات (Challenges) ============

export interface RealChallenge {
  id: string;
  title: string;
  task: string;
  maxXp: number;
  teacherName: string;
  createdAt: string;
}

export interface ChallengeSubmission {
  id: string;
  studentId: string;
  studentName: string;
  content: string;
  xpAwarded: number | null;
  submittedAt: string;
}

// بيجيب التحدي النشط الوحيد (لو موجود) لفصل ومادة معيّنين
export async function getActiveChallenge(classId: string, subject: string): Promise<RealChallenge | null> {
  const { data, error } = await supabase
    .from('challenges')
    .select('id, title, task, max_xp, created_at, teachers ( users ( name ) )')
    .eq('class_id', classId)
    .eq('subject', subject)
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title,
    task: data.task,
    maxXp: data.max_xp,
    teacherName: (data as any).teachers?.users?.name || 'Teacher',
    createdAt: data.created_at,
  };
}

// بينشئ تحدي جديد، وبيلغي (يوقف) أي تحدي نشط قبله لنفس الفصل والمادة تلقائيًا
export async function createChallenge(input: {
  classId: string;
  subject: string;
  teacherId: string;
  title: string;
  task: string;
  maxXp: number;
}): Promise<{ ok: boolean; error: string | null }> {
  await supabase.from('challenges').update({ is_active: false }).eq('class_id', input.classId).eq('subject', input.subject).eq('is_active', true);
  const { error } = await supabase.from('challenges').insert({
    class_id: input.classId,
    subject: input.subject,
    teacher_id: input.teacherId,
    title: input.title,
    task: input.task,
    max_xp: input.maxXp,
  });
  return { ok: !error, error: error?.message || null };
}

export async function submitToChallenge(challengeId: string, studentId: string, content: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('challenge_submissions').upsert(
    { challenge_id: challengeId, student_id: studentId, content },
    { onConflict: 'challenge_id,student_id' }
  );
  return { ok: !error, error: error?.message || null };
}

export async function getMyChallengeSubmission(challengeId: string, studentId: string): Promise<ChallengeSubmission | null> {
  const { data, error } = await supabase.from('challenge_submissions').select('*').eq('challenge_id', challengeId).eq('student_id', studentId).maybeSingle();
  if (error || !data) return null;
  return { id: data.id, studentId: data.student_id, studentName: '', content: data.content, xpAwarded: data.xp_awarded, submittedAt: data.submitted_at };
}

export async function getChallengeSubmissions(challengeId: string): Promise<ChallengeSubmission[]> {
  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('id, student_id, content, xp_awarded, submitted_at, students ( users ( name ) )')
    .eq('challenge_id', challengeId)
    .order('submitted_at', { ascending: false });
  if (error || !data) return [];
  return (data as any[]).map((row) => ({
    id: row.id,
    studentId: row.student_id,
    studentName: row.students?.users?.name || 'Student',
    content: row.content,
    xpAwarded: row.xp_awarded,
    submittedAt: row.submitted_at,
  }));
}

export async function gradeChallengeSubmission(submissionId: string, xp: number, maxXp: number): Promise<{ ok: boolean; error: string | null }> {
  const cappedXp = Math.max(0, Math.min(xp, maxXp));
  const { error } = await supabase.from('challenge_submissions').update({ xp_awarded: cappedXp, graded_at: new Date().toISOString() }).eq('id', submissionId);
  return { ok: !error, error: error?.message || null };
}

// بيجيب أعلى 3 طلاب بالنقط في التحدي النشط
export async function getTopChallengers(challengeId: string): Promise<ChallengeSubmission[]> {
  const all = await getChallengeSubmissions(challengeId);
  return all
    .filter((s) => s.xpAwarded !== null)
    .sort((a, b) => (b.xpAwarded || 0) - (a.xpAwarded || 0))
    .slice(0, 3);
}

// ============ فعاليات المدرسة (School Events) ============

export interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  eventDate: string;
  status: 'draft' | 'published';
}

export async function getUpcomingSchoolEvents(limit: number = 5): Promise<SchoolEvent[]> {
  const { data, error } = await supabase
    .from('school_events')
    .select('id, title, description, location, event_date, status')
    .eq('status', 'published')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row: any) => ({ id: row.id, title: row.title, description: row.description, location: row.location, eventDate: row.event_date, status: row.status }));
}

export async function createSchoolEvent(input: {
  creatorId: string;
  creatorRole: string;
  title: string;
  description?: string;
  location?: string;
  eventDate: string;
  status: 'draft' | 'published';
}): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('school_events').insert({
    creator_id: input.creatorId,
    creator_role: input.creatorRole,
    title: input.title,
    description: input.description || null,
    location: input.location || null,
    event_date: input.eventDate,
    status: input.status,
  });
  return { ok: !error, error: error?.message || null };
}

// ============ إعلانات المدرسة الرسمية (Official Announcements) ============

export interface SchoolAnnouncement {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  createdAt: string;
}

export async function getSchoolAnnouncements(limit: number = 5): Promise<SchoolAnnouncement[]> {
  const { data, error } = await supabase
    .from('school_announcements')
    .select('id, title, content, status, created_at')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row: any) => ({ id: row.id, title: row.title, content: row.content, status: row.status, createdAt: row.created_at }));
}

export async function createSchoolAnnouncement(input: {
  creatorId: string;
  creatorRole: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
}): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('school_announcements').insert({
    creator_id: input.creatorId,
    creator_role: input.creatorRole,
    title: input.title,
    content: input.content,
    status: input.status,
  });
  return { ok: !error, error: error?.message || null };
}
