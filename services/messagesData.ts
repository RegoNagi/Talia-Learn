import { supabase } from '@/lib/supabaseClient';

export interface AppMessage {
  id: string;
  senderName: string;
  senderRole: string;
  subject: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

// بيلاقي حساب ولي أمر الطالب (لو موجود) عشان نبعتله الرسالة على حسابه هو
export async function getParentIdForStudent(studentId: string): Promise<string | null> {
  const { data, error } = await supabase.from('parent_students').select('parent_id').eq('student_id', studentId).maybeSingle();
  if (error || !data) return null;
  return data.parent_id;
}

// بيبعت رسالة حقيقية توصل لحساب المستلم (تظهرله لما يسجّل دخول، مش SMS)
export async function sendMessage(input: {
  senderId: string;
  senderRole: string;
  senderName: string;
  recipientId: string;
  recipientRole: string;
  subject?: string;
  content: string;
  relatedStudentId?: string;
}): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('messages').insert({
    sender_id: input.senderId,
    sender_role: input.senderRole,
    sender_name: input.senderName,
    recipient_id: input.recipientId,
    recipient_role: input.recipientRole,
    subject: input.subject || null,
    content: input.content,
    related_student_id: input.relatedStudentId || null,
  });
  return { ok: !error, error: error?.message || null };
}

// بيبعت رسالة لولي أمر طالب معيّن مباشرة (بيلاقي حسابه تلقائيًا)
export async function sendMessageToStudentParent(input: {
  senderId: string;
  senderRole: string;
  senderName: string;
  studentId: string;
  subject?: string;
  content: string;
}): Promise<{ ok: boolean; error: string | null }> {
  const parentId = await getParentIdForStudent(input.studentId);
  if (!parentId) return { ok: false, error: 'No parent account linked to this student yet.' };
  return sendMessage({
    senderId: input.senderId,
    senderRole: input.senderRole,
    senderName: input.senderName,
    recipientId: parentId,
    recipientRole: 'parent',
    subject: input.subject,
    content: input.content,
    relatedStudentId: input.studentId,
  });
}

export async function getMyMessages(recipientId: string, recipientRole: string): Promise<AppMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_name, sender_role, subject, content, is_read, created_at')
    .eq('recipient_id', recipientId)
    .eq('recipient_role', recipientRole)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    subject: row.subject,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

export async function getUnreadMessageCount(recipientId: string, recipientRole: string): Promise<number> {
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', recipientId)
    .eq('recipient_role', recipientRole)
    .eq('is_read', false);
  return count || 0;
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  await supabase.from('messages').update({ is_read: true }).eq('id', messageId);
}

// بيبعت نفس الإعلان لكل طلاب الفصل دفعة واحدة (يستخدم نفس نظام الرسائل الحقيقي)
export async function broadcastMessageToClass(input: {
  senderId: string;
  senderName: string;
  studentIds: string[];
  subject?: string;
  content: string;
}): Promise<{ ok: boolean; sentCount: number; error: string | null }> {
  if (input.studentIds.length === 0) return { ok: false, sentCount: 0, error: 'No students in this class yet.' };
  const rows = input.studentIds.map((studentId) => ({
    sender_id: input.senderId,
    sender_role: 'teacher',
    sender_name: input.senderName,
    recipient_id: studentId,
    recipient_role: 'student',
    subject: input.subject || 'Class Announcement',
    content: input.content,
  }));
  const { error } = await supabase.from('messages').insert(rows);
  return { ok: !error, sentCount: error ? 0 : rows.length, error: error?.message || null };
}

// بيجيب آخر إعلانات وصلت للطالب في الفصل ده (رسائل المعلم فقط)
export async function getClassAnnouncementsForStudent(studentId: string, limit: number = 5): Promise<AppMessage[]> {
  const all = await getMyMessages(studentId, 'student');
  return all.filter((m) => m.senderRole === 'teacher').slice(0, limit);
}
