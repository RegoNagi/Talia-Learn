import { supabase } from '@/lib/supabaseClient';

export interface RealLiveSession {
  id: string;
  title: string;
  agenda: string | null;
  scheduledAt: string; // ISO
  joinUrl: string;
}

export async function getLiveSessions(classId: string, subject: string): Promise<RealLiveSession[]> {
  const { data, error } = await supabase
    .from('live_sessions')
    .select('id, title, agenda, scheduled_at, join_url')
    .eq('class_id', classId)
    .eq('subject', subject)
    .order('scheduled_at', { ascending: true });
  if (error) {
    console.error('Error fetching live sessions:', error);
    return [];
  }
  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    agenda: row.agenda,
    scheduledAt: row.scheduled_at,
    joinUrl: row.join_url,
  }));
}

export async function createLiveSession(input: {
  classId: string;
  subject: string;
  teacherId: string;
  title: string;
  agenda?: string;
  scheduledAt: string;
  joinUrl: string;
}): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('live_sessions').insert({
    class_id: input.classId,
    subject: input.subject,
    teacher_id: input.teacherId,
    title: input.title,
    agenda: input.agenda || null,
    scheduled_at: input.scheduledAt,
    join_url: input.joinUrl,
  });
  return { ok: !error, error: error?.message || null };
}

export async function updateLiveSession(id: string, input: { title?: string; agenda?: string; scheduledAt?: string; joinUrl?: string }): Promise<{ ok: boolean; error: string | null }> {
  const patch: any = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.agenda !== undefined) patch.agenda = input.agenda;
  if (input.scheduledAt !== undefined) patch.scheduled_at = input.scheduledAt;
  if (input.joinUrl !== undefined) patch.join_url = input.joinUrl;
  const { error } = await supabase.from('live_sessions').update(patch).eq('id', id);
  return { ok: !error, error: error?.message || null };
}

export async function deleteLiveSession(id: string): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase.from('live_sessions').delete().eq('id', id);
  return { ok: !error, error: error?.message || null };
}
