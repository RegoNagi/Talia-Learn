import { NextResponse } from 'next/server';

// صفحة اختبار مؤقتة بس — بترمي خطأ متعمد وآمن عشان نتأكد إن Sentry بيستقبل الأخطاء
export async function GET() {
  throw new Error('Test error for Sentry verification — safe to ignore');
  return NextResponse.json({ ok: true });
}
