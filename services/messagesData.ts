import { supabase } from '@/lib/supabaseClient';

// بيلاقي بريد المستلم الحقيقي (لإرسال إشعار إيميل) حسب نوع حسابه
export async function getEmailForRecipient(recipientId: string, recipientRole: string): Promise<string | null> {
  const table = recipientRole === 'teacher' ? 'teachers' : recipientRole === 'student' ? 'students' : recipientRole === 'parent' ? 'parents' : null;
  if (!table) return null;
  const { data: roleRow } = await supabase.from(table).select('user_id').eq('id', recipientId).maybeSingle();
  if (!roleRow?.user_id) return null;
  const { data: userRow } = await supabase.from('users').select('email').eq('id', roleRow.user_id).maybeSingle();
  return userRow?.email || null;
}

// بيبعت إشعار إيميل حقيقي — عن طريق الطريق البرمجي بتاعنا (مش من المتصفح مباشرة،
// عشان مفتاح خدمة الإيميل السري يفضل على السيرفر بس). فشل الإرسال هنا لا يوقف
// إرسال الرسالة نفسها — الإشعار "إضافي" مش أساسي.
async function notifyByEmail(recipientId: string, recipientRole: string, subject: string, bodyText: string): Promise<void> {
  try {
    const email = await getEmailForRecipient(recipientId, recipientRole);
    if (!email) return;
    await fetch('/api/notifications/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: email, subject, bodyText }),
    });
  } catch (err) {
    console.error('Error sending email notification:', err);
  }
}

export interface AppMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientRole: string;
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

// بيبعت رسالة حقيقية توصل لحساب المستلم (تظهرله لما يسجّل دخول، مش SMS).
// sendEmailCopy: اختياري — لو true، بيبعت كمان نسخة إيميل حقيقية للمستلم،
// بدل ما ده يحصل تلقائي كل مرة.
export async function sendMessage(input: {
  senderId: string;
  senderRole: string;
  senderName: string;
  recipientId: string;
  recipientRole: string;
  subject?: string;
  content: string;
  relatedStudentId?: string;
  sendEmailCopy?: boolean;
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
  if (!error && input.sendEmailCopy) {
    notifyByEmail(input.recipientId, input.recipientRole, input.subject || `رسالة جديدة من ${input.senderName}`, input.content);
  }
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
  sendEmailCopy?: boolean;
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
    sendEmailCopy: input.sendEmailCopy,
  });
}

export async function getMyMessages(recipientId: string, recipientRole: string): Promise<AppMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, sender_name, sender_role, recipient_id, recipient_role, subject, content, is_read, created_at')
    .eq('recipient_id', recipientId)
    .eq('recipient_role', recipientRole)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    recipientId: row.recipient_id,
    recipientRole: row.recipient_role,
    subject: row.subject,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

// بيجيب كل الرسائل اللي أنا بعتها فعليًا (مش اللي وصلتلي) — عشان نقدر نبني
// محادثة كاملة الاتجاهين (أنا وهو) مش بس اللي وصلني
export async function getMySentMessages(senderId: string, senderRole: string): Promise<AppMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, sender_name, sender_role, recipient_id, recipient_role, subject, content, is_read, created_at')
    .eq('sender_id', senderId)
    .eq('sender_role', senderRole)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching sent messages:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    recipientId: row.recipient_id,
    recipientRole: row.recipient_role,
    subject: row.subject,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
  }));
}

// بيجيب كل الرسائل بين شخصين بالظبط (الاتجاهين) — دي محادثة حقيقية كاملة
export async function getConversation(myId: string, myRole: string, otherId: string, otherRole: string): Promise<AppMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, sender_name, sender_role, recipient_id, recipient_role, subject, content, is_read, created_at')
    .or(`and(sender_id.eq.${myId},sender_role.eq.${myRole},recipient_id.eq.${otherId},recipient_role.eq.${otherRole}),and(sender_id.eq.${otherId},sender_role.eq.${otherRole},recipient_id.eq.${myId},recipient_role.eq.${myRole})`)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching conversation:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderRole: row.sender_role,
    recipientId: row.recipient_id,
    recipientRole: row.recipient_role,
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
  sendEmailCopy?: boolean;
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
  if (!error && input.sendEmailCopy) {
    input.studentIds.forEach((studentId) => {
      notifyByEmail(studentId, 'student', input.subject || 'Class Announcement', input.content);
    });
  }
  return { ok: !error, sentCount: error ? 0 : rows.length, error: error?.message || null };
}

// بيجيب آخر إعلانات وصلت للطالب في الفصل ده (رسائل المعلم فقط)
export async function getClassAnnouncementsForStudent(studentId: string, limit: number = 5): Promise<AppMessage[]> {
  const all = await getMyMessages(studentId, 'student');
  return all.filter((m) => m.senderRole === 'teacher').slice(0, limit);
}

export interface MessageContact {
  id: string;
  role: 'student' | 'parent' | 'teacher';
  name: string;
  avatar?: string;
  className?: string;      // للطالب
  studentName?: string;    // لولي الأمر
  studentId?: string;      // لولي الأمر — لازم عشان نبعتله عن طريق sendMessageToStudentParent
}

// جهات اتصال حقيقية: كل طلاب فصول المعلم ده
export async function getMyStudentContacts(teacherId: string): Promise<MessageContact[]> {
  const { data: sections } = await supabase.from('class_sections').select('id, name, enrollments ( student_id )').eq('teacher_id', teacherId);
  const studentIdToClass = new Map<string, string>();
  (sections || []).forEach((sec: any) => {
    (sec.enrollments || []).forEach((e: any) => studentIdToClass.set(e.student_id, sec.name));
  });
  const studentIds = Array.from(studentIdToClass.keys());
  if (studentIds.length === 0) return [];
  const { data: students } = await supabase.from('students').select('id, users ( name )').in('id', studentIds);
  return (students || []).map((s: any) => ({
    id: s.id,
    role: 'student' as const,
    name: s.users?.name || '',
    className: studentIdToClass.get(s.id),
  }));
}

// جهات اتصال حقيقية: أولياء أمور طلاب المعلم ده (مربوطين فعليًا بحساب)
export async function getMyParentContacts(teacherId: string): Promise<MessageContact[]> {
  const students = await getMyStudentContacts(teacherId);
  if (students.length === 0) return [];
  const studentIds = students.map((s) => s.id);
  const { data: links } = await supabase.from('parent_students').select('parent_id, student_id').in('student_id', studentIds);
  if (!links || links.length === 0) return [];
  const parentIds = Array.from(new Set(links.map((l: any) => l.parent_id)));
  const { data: parents } = await supabase.from('parents').select('id, users ( name )').in('id', parentIds);
  const studentNameById = new Map(students.map((s) => [s.id, s.name]));
  return (links || []).map((l: any) => {
    const parent = (parents || []).find((p: any) => p.id === l.parent_id);
    if (!parent) return null;
    return {
      id: parent.id,
      role: 'parent' as const,
      name: parent.users?.name || 'Parent',
      studentName: studentNameById.get(l.student_id),
      studentId: l.student_id,
    };
  }).filter((c): c is MessageContact => c !== null);
}

// جهات اتصال حقيقية: باقي المعلمين في المدرسة (لمراسلة زميل)
export async function getAllTeacherContacts(excludeTeacherId: string): Promise<MessageContact[]> {
  const { data } = await supabase.from('teachers').select('id, users ( name )').neq('id', excludeTeacherId);
  return (data || []).map((t: any) => ({ id: t.id, role: 'teacher' as const, name: t.users?.name || 'Teacher' }));
}
