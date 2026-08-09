import { NextRequest, NextResponse } from 'next/server';
import { purgeAllOldTrash } from '@/services/todoData';

// Vercel Cron بيستدعي الـ route ده يوميًا (اتحدد في vercel.json).
// بيتأكد إن الطلب فعلاً جاي من Vercel Cron عن طريق CRON_SECRET قبل ما يشتغل.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const result = await purgeAllOldTrash();
  return NextResponse.json(result);
}
