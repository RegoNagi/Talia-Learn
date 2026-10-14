import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RichContent, QuestionStem, DokBadge } from './RichContent';
import { mathSpan } from '@/lib/richText';
import { latexToHtml } from '@/lib/mathRender';

(globalThis as any).React = React;

describe('RichContent (SSR)', () => {
  it('بيعرض HTML نضيف وبيشيل السكربتات ومعالجات الأحداث', () => {
    const out = renderToStaticMarkup(<RichContent html={'<p onclick="x()">أهلا <b>بكم</b></p><script>alert(1)</script><img src=x onerror=alert(1)>'} />);
    expect(out).toContain('<p>أهلا <b>بكم</b></p>');
    expect(out).not.toMatch(/script|onclick|onerror|<img/i);
  });
  it('نص عادي بيتهرّب ويحافظ على السطور', () => {
    const out = renderToStaticMarkup(<RichContent text={'a<b>\nc'} />);
    expect(out).toContain('a&lt;b&gt;<br>c');
  });
  it('فاضي = مفيش حاجة', () => {
    expect(renderToStaticMarkup(<RichContent html="" text="" />)).toBe('');
  });
  it('المعادلة بتتحفظ كـ span جاهز للرسم', () => {
    const out = renderToStaticMarkup(<RichContent html={mathSpan('x^2', 'ar')} />);
    expect(out).toContain('class="tl-math"');
    expect(out).toContain('data-latex="x^2"');
  });
});

describe('QuestionStem (SSR)', () => {
  it('بيعرض الصورة والصوت وفيديو يوتيوب بدون كوكيز، والتلميح مقفول', () => {
    const out = renderToStaticMarkup(
      <QuestionStem data={{ title: 'س', questionImageUrl: 'https://x.test/a.png', audioUrl: 'https://x.test/a.webm', videoUrl: 'https://youtu.be/dQw4w9WgXcQ', videoStart: 5, hint: { text: 'فكّر في الجذر' } }} />,
    );
    expect(out).toContain('src="https://x.test/a.png"');
    expect(out).toContain('<audio');
    expect(out).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&amp;start=5');
    expect(out).toContain('sandbox=');
    expect(out).toContain('عرض التلميح');
    expect(out).not.toContain('فكّر في الجذر'); // التلميح ما يظهرش قبل ما الطالب يطلبه
  });
  it('تلميح مفتوح للمراجع', () => {
    const out = renderToStaticMarkup(<QuestionStem data={{ title: 'س', hint: { text: 'فكّر في الجذر' } }} hintOpen />);
    expect(out).toContain('فكّر في الجذر');
  });
  it('فيديو برابط مش مدعوم بيتتجاهل', () => {
    const out = renderToStaticMarkup(<QuestionStem data={{ title: 'س', videoUrl: 'javascript:alert(1)' }} />);
    expect(out).not.toMatch(/iframe|video|javascript/i);
  });
  it('DOK للمعلم بس لما يتطلب', () => {
    expect(renderToStaticMarkup(<QuestionStem data={{ title: 'س', dok: 3 }} />)).not.toContain('DOK');
    expect(renderToStaticMarkup(<QuestionStem data={{ title: 'س', dok: 3 }} showDok />)).toContain('DOK 3');
    expect(renderToStaticMarkup(<DokBadge dok={9} />)).toBe('');
  });
});

describe('KaTeX', () => {
  it('بيرسم صيغ سليمة ويرجّع خطأ للغلط', () => {
    expect(latexToHtml('\\frac{1}{2}').error).toBeNull();
    expect(latexToHtml('\\frac{1}{2}').html).toContain('katex');
    expect(latexToHtml('\\ce{H2O}').error).toBeNull();
    expect(latexToHtml('\\frac{1').error).not.toBeNull();
  });
  it('بيرفض الأوامر الخطرة (trust=false)', () => {
    const r = latexToHtml('\\href{javascript:alert(1)}{x}');
    expect(r.html).not.toMatch(/<a [^>]*href/i); // الصيغة بتظهر كنص بس، مفيش رابط حقيقي
  });
});
