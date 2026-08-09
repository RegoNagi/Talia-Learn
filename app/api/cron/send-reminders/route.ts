import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

// Vercel Cron بيستدعي الـ route ده يوميًا (اتحدد في vercel.json).
// بيدوّر على الواجبات/الاختبارات الـ Active اللي موعد تسليمها خلال ٢٤ ساعة الجايين،
// وبيبعت تذكير إيميل لكل طالب في الفصول/الطلاب المرتبطين بيها.
// ملاحظة v1: مبيستبعدش الطلاب اللي سلّموا بالفعل — تحسين مستقبلي.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: dueItems, error: dueError } = await supabase
      .from('assignments')
      .select('id, title, type, due_date, assigned_classes, assigned_students')
      .eq('status', 'Active')
      .gte('due_date', now.toISOString())
      .lte('due_date', in24h.toISOString());

    if (dueError) {
      console.error('send-reminders: error fetching due items:', dueError);
      return NextResponse.json({ ok: false, error: dueError.message }, { status: 200 });
    }

    if (!dueItems || dueItems.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, note: 'No items due in the next 24h' });
    }

    // بنجمع كل الطلاب المستهدفين (من الفصول + المضافين مباشرة) لكل عنصر، من غير تكرار
    type Recipient = { studentId: string; itemTitle: string; itemType: string; dueDate: string };
    const recipients: Recipient[] = [];

    for (const item of dueItems) {
      const studentIdSet = new Set<string>((item.assigned_students as string[]) || []);

      const assignedClasses = (item.assigned_classes as string[]) || [];
      if (assignedClasses.length > 0) {
        const { data: sections } = await supabase
          .from('class_sections')
          .select('id, enrollments ( student_id )')
          .in('id', assignedClasses);
        for (const section of sections || []) {
          const enrollments = (section as any).enrollments || [];
          for (const e of enrollments) {
            if (e.student_id) studentIdSet.add(e.student_id);
          }
        }
      }

      for (const studentId of studentIdSet) {
        recipients.push({
          studentId,
          itemTitle: item.title,
          itemType: item.type === 'quiz' ? 'اختبار' : 'واجب',
          dueDate: item.due_date,
        });
      }
    }

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, note: 'No students to notify' });
    }

    // بنحلّ إيميل كل طالب مرة واحدة (بدل ما نكرر نفس الاستعلام لكل تذكير لنفس الطالب)
    const uniqueStudentIds = Array.from(new Set(recipients.map((r) => r.studentId)));
    const { data: studentRows } = await supabase
      .from('students')
      .select('id, user_id')
      .in('id', uniqueStudentIds);

    const userIds = (studentRows || []).map((s: any) => s.user_id).filter(Boolean);
    const { data: userRows } = await supabase.from('users').select('id, email').in('id', userIds);

    const studentIdToUserId = new Map<string, string>();
    for (const s of studentRows || []) studentIdToUserId.set((s as any).id, (s as any).user_id);
    const userIdToEmail = new Map<string, string>();
    for (const u of userRows || []) userIdToEmail.set((u as any).id, (u as any).email);

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    if (!apiKey) {
      return NextResponse.json({ ok: false, sent: 0, error: 'RESEND_API_KEY not configured' });
    }

    const sendPromises = recipients.map((r) => {
      const userId = studentIdToUserId.get(r.studentId);
      const email = userId ? userIdToEmail.get(userId) : null;
      if (!email) return Promise.resolve({ ok: false, skipped: true });

      const dueDateFormatted = new Date(r.dueDate).toLocaleString('ar-EG');
      return fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: `تذكير: ${r.itemTitle} مستحق قريبًا`,
          text: `${r.itemType} "${r.itemTitle}" موعد تسليمه ${dueDateFormatted}.`,
        }),
      });
    });

    const results = await Promise.allSettled(sendPromises);
    const sent = results.filter((r) => r.status === 'fulfilled').length;

    return NextResponse.json({ ok: true, sent, total: recipients.length });
  } catch (err: any) {
    console.error('send-reminders route error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 200 });
  }
}
