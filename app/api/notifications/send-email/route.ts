import { NextRequest, NextResponse } from 'next/server';

// نقطة الإرسال المشتركة على السيرفر — أي مكان في المشروع محتاج يبعت إيميل
// بيمر من هنا، عشان RESEND_API_KEY يفضل سري على السيرفر ومايوصلش للمتصفح خالص.
export async function POST(request: NextRequest) {
  try {
    const { to, subject, bodyText } = await request.json();

    if (!to || !subject || !bodyText) {
      return NextResponse.json({ ok: false, error: 'Missing to/subject/bodyText' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // مفيش مفتاح متسجّل لسه — بنرجّع تمام (بدون خطأ) عشان مانوقفش أي حاجة تانية،
      // لكن من غير ما نبعت حاجة فعليًا.
      return NextResponse.json({ ok: false, error: 'RESEND_API_KEY not configured' }, { status: 200 });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        text: bodyText,
      }),
    });

    if (!resendResponse.ok) {
      const errText = await resendResponse.text().catch(() => '');
      console.error('Resend API error:', resendResponse.status, errText);
      return NextResponse.json({ ok: false, error: `Resend error ${resendResponse.status}: ${errText}` }, { status: 200 });
    }

    return NextResponse.json({ ok: true, error: null });
  } catch (err: any) {
    console.error('send-email route error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Unknown error' }, { status: 200 });
  }
}
