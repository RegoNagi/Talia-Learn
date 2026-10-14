import { supabase } from '@/lib/supabaseClient';
import type { AuditEvent, AuditAction, FieldChange } from '@/lib/auditLog';

export interface AuditActor { id: string | null; name: string; role?: string }

let currentActor: AuditActor = { id: null, name: 'غير معروف' };

/** الصفحة بتسجّل المستخدم الحالي مرة واحدة، وكل عمليات البنك بعد كده بتتسجل باسمه */
export function setBankAuditActor(actor: AuditActor | null) {
  currentActor = actor || { id: null, name: 'غير معروف' };
}
export function getBankAuditActor(): AuditActor { return currentActor; }

export interface LogInput {
  action: AuditAction;
  questionId?: string | null;
  title?: string;
  subject?: string;
  grade?: string;
  scope?: string;
  changes?: FieldChange[];
  snapshot?: unknown;
  note?: string;
  actor?: AuditActor;
}

/** بيسجل حدث. best-effort: لو الجدول مش موجود أو الصلاحيات مانعة، العملية الأصلية ما تتأثرش */
export async function logBankEvent(e: LogInput): Promise<boolean> {
  try {
    const a = e.actor || currentActor;
    const { error } = await supabase.from('question_bank_audit').insert({
      actor_id: a.id, actor_name: a.name, actor_role: a.role ?? null,
      action: e.action, question_id: e.questionId ?? null, title: e.title ?? null,
      subject: e.subject ?? null, grade: e.grade ?? null, scope: e.scope ?? null,
      changes: e.changes ?? [], snapshot: e.snapshot ?? null, note: e.note ?? null,
    });
    return !error;
  } catch {
    return false;
  }
}

function mapStored(r: any): AuditEvent {
  return {
    id: String(r.id), at: r.at, byId: r.actor_id, byName: r.actor_name || 'غير معروف', byRole: r.actor_role || undefined,
    action: r.action, questionId: r.question_id, title: r.title || '', subject: r.subject || '', grade: r.grade || '', scope: r.scope || '',
    changes: Array.isArray(r.changes) ? r.changes : [], snapshot: r.snapshot ?? undefined, note: r.note || undefined, source: 'stored',
  };
}

/** أحداث الجدول. available=false معناها الجدول مش موجود (لسه ما اتشغلش ملف SQL) أو مفيش صلاحية قراءة */
export async function getStoredAuditEvents(limit = 3000): Promise<{ events: AuditEvent[]; available: boolean }> {
  try {
    const { data, error } = await supabase.from('question_bank_audit').select('*').order('at', { ascending: false }).limit(limit);
    if (error || !data) return { events: [], available: false };
    return { events: data.map(mapStored), available: true };
  } catch {
    return { events: [], available: false };
  }
}
