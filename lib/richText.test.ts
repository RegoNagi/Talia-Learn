import { describe, it, expect } from 'vitest';
import { sanitizeRichHtml, htmlToText, textToHtml, isRichEmpty, mathSpan, isSafeHref } from './richText';

describe('sanitizeRichHtml — الحماية', () => {
  const vectors: [string, string][] = [
    ['<script>alert(1)</script>نص', 'نص'],
    ['<img src=x onerror=alert(1)>نص', 'نص'],
    ['<p onclick="alert(1)">نص</p>', '<p>نص</p>'],
    ['<a href="javascript:alert(1)">اضغط</a>', '<a>اضغط</a>'],
    ['<a href=" JaVa\tScRiPt:alert(1)">x</a>', '<a>x</a>'],
    ['<a href="data:text/html;base64,AAA">x</a>', '<a>x</a>'],
    ['<iframe src="https://evil.test"></iframe>بعد', 'بعد'],
    ['<style>body{display:none}</style>س', 'س'],
    ['<svg onload=alert(1)><circle/></svg>س', 'س'],
    ['<math><mi>x</mi></math>س', 'س'],
    ['<p style="background:url(javascript:alert(1))">س</p>', '<p>س</p>'],
    ['<p style="position:fixed;top:0;left:0;width:100%">س</p>', '<p>س</p>'],
    ['<p style="color:red;expression(alert(1))">س</p>', '<p style="color:red">س</p>'],
    ['<span style="color:#fff\\;">س</span>', '<span>س</span>'],
    ['<b <script>alert(1)</script>>x</b>', '<b>alert(1)&gt;x</b>'],
    ['<!-- <script>x</script> -->س', 'س'],
    ['<form action=x><input name=a></form>س', 'س'],
    ['<button onclick=x>ضغط</button>س', 'س'],
  ];
  for (const [input, expected] of vectors) {
    it(`يشيل: ${input.slice(0, 50)}`, () => {
      const out = sanitizeRichHtml(input);
      expect(out).toBe(expected);
      expect(out).not.toMatch(/javascript:|onerror|onclick|onload|<script|<iframe|url\(/i);
    });
  }

  it('رابط https بيتحول لتاب جديد مع rel آمن', () => {
    expect(sanitizeRichHtml('<a href="https://qatar.test/a?b=1&c=2">رابط</a>')).toBe(
      '<a href="https://qatar.test/a?b=1&amp;c=2" target="_blank" rel="noopener noreferrer nofollow">رابط</a>',
    );
    expect(sanitizeRichHtml('<a href="mailto:a@b.co">م</a>')).toContain('mailto:a@b.co');
  });

  it('محاولة كسر الخاصية بعلامة تنصيص بتتهرّب', () => {
    const out = sanitizeRichHtml('<a href=\'https://x.test/" onmouseover="alert(1)\'>x</a>');
    // الـ " اتهربت جوه قيمة href، فمفيش خاصية onmouseover حقيقية
    expect(out).toBe('<a href="https://x.test/&quot; onmouseover=&quot;alert(1)" target="_blank" rel="noopener noreferrer nofollow">x</a>');
  });

  it('نص فيه < و > عادية بيتهرّب', () => {
    expect(sanitizeRichHtml('إذا كان 3 < 5 و 7 > 2')).toBe('إذا كان 3 &lt; 5 و 7 &gt; 2');
    expect(sanitizeRichHtml('a &lt;script&gt; &amp; b')).toBe('a &lt;script&gt; &amp; b');
    expect(sanitizeRichHtml('R&D')).toBe('R&amp;D');
  });

  it('مدخل مش نصي أو فاضي', () => {
    expect(sanitizeRichHtml(null)).toBe('');
    expect(sanitizeRichHtml(42)).toBe('');
    expect(sanitizeRichHtml('')).toBe('');
  });

  it('بيقفل الوسوم المفتوحة ويتجاهل الإغلاق الزايد', () => {
    expect(sanitizeRichHtml('<b>غامق<i>مائل')).toBe('<b>غامق<i>مائل</i></b>');
    expect(sanitizeRichHtml('نص</b></p>')).toBe('نص');
  });

  it('وسوم غير معروفة بتتفك والنص بيفضل', () => {
    expect(sanitizeRichHtml('<blink>مهم</blink> <font color=red>أحمر</font>')).toBe('مهم أحمر');
  });

  it('طول زيادة بيرجّع فاضي', () => {
    expect(sanitizeRichHtml('<p>' + 'س'.repeat(500) + '</p>', 100)).toBe('');
  });

  it('وسوم متداخلة بعمق كبير ما بتكسرش', () => {
    const deep = '<div>'.repeat(500) + 'x' + '</div>'.repeat(500);
    const out = sanitizeRichHtml(deep);
    expect((out.match(/<div>/g) || []).length).toBeLessThanOrEqual(40);
    expect((out.match(/<div>/g) || []).length).toBe((out.match(/<\/div>/g) || []).length);
  });
});

describe('sanitizeRichHtml — اللي لازم يفضل', () => {
  it('التنسيق الأساسي', () => {
    const html = '<p dir="rtl"><b>غامق</b> <i>مائل</i> <u>تحته خط</u> H<sub>2</sub>O x<sup>2</sup></p><ul><li>أ</li><li>ب</li></ul>';
    expect(sanitizeRichHtml(html)).toBe(html);
  });

  it('أنماط آمنة: لون وحجم ومحاذاة واتجاه', () => {
    const out = sanitizeRichHtml('<span style="color: #ff0000; font-size: 20px; text-align:center; direction: rtl">س</span>');
    expect(out).toBe('<span style="color:#ff0000;font-size:20px;text-align:center;direction:rtl">س</span>');
    expect(sanitizeRichHtml('<span style="font-size:900px">س</span>')).toBe('<span>س</span>');
    expect(sanitizeRichHtml('<span style="color:rgb(10, 20, 30)">س</span>')).toContain('color:rgb(10, 20, 30)');
  });

  it('الجداول مع colspan', () => {
    const html = '<table><thead><tr><th colspan="2">عنوان</th></tr></thead><tbody><tr><td>1</td><td rowspan="2">2</td></tr></tbody></table>';
    expect(sanitizeRichHtml(html)).toBe(html);
    expect(sanitizeRichHtml('<table><tr><td colspan="999">x</td></tr></table>')).toBe('<table><tr><td>x</td></tr></table>');
  });

  it('المعادلات بتفضل لو بالشكل الصح بس', () => {
    const m = mathSpan('\\frac{1}{2}', 'ar');
    expect(sanitizeRichHtml(m)).toBe(m);
    // span عادي مش هيكتسب data-latex
    expect(sanitizeRichHtml('<span data-latex="x">س</span>')).toBe('<span>س</span>');
    // قيمة digits غلط
    expect(sanitizeRichHtml('<span class="tl-math" data-latex="x" data-digits="evil">$x$</span>')).not.toContain('data-digits');
    // class تانية مش بتعدي
    expect(sanitizeRichHtml('<span class="fixed inset-0" >س</span>')).toBe('<span>س</span>');
  });

  it('المعادلة الطويلة جدًا بتتقص', () => {
    const out = sanitizeRichHtml(mathSpan('x'.repeat(2000)));
    expect((out.match(/x/g) || []).length).toBeLessThan(1300);
  });

  it('idempotent: التنضيف مرتين = مرة', () => {
    const dirty = '<p onclick=1>أ <b>ب</b> <script>x</script><a href="https://a.test">ج</a>' + mathSpan('x^2');
    const once = sanitizeRichHtml(dirty);
    expect(sanitizeRichHtml(once)).toBe(once);
  });
});

describe('htmlToText', () => {
  it('بيحوّل السطور والقوائم والجداول لنص', () => {
    const html = '<p>سطر 1</p><p>سطر 2<br>سطر 3</p><ul><li>أ</li><li>ب</li></ul><table><tr><td>1</td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>';
    expect(htmlToText(html)).toBe('سطر 1\nسطر 2\nسطر 3\n• أ\n• ب\n1 | 2\n3 | 4');
  });
  it('المعادلة بترجع $latex$', () => {
    expect(htmlToText(`احسب ${mathSpan('\\frac{a}{b}')} الآن`)).toBe('احسب $\\frac{a}{b}$ الآن');
  });
  it('الكيانات بتتفك', () => {
    expect(htmlToText('a &lt; b &amp; c&nbsp;d')).toBe('a < b & c d');
  });
  it('الـ script ما بيتسربش للنص', () => {
    expect(htmlToText('س<script>alert(1)</script>ص')).toBe('سص');
  });
  it('مدخل غلط', () => { expect(htmlToText(undefined)).toBe(''); });
});

describe('مساعدات', () => {
  it('textToHtml بيهرّب ويحوّل السطور', () => {
    expect(textToHtml('a<b\nc')).toBe('a&lt;b<br>c');
  });
  it('isRichEmpty', () => {
    expect(isRichEmpty('')).toBe(true);
    expect(isRichEmpty('<p><br></p>')).toBe(true);
    expect(isRichEmpty('<p>س</p>')).toBe(false);
    expect(isRichEmpty(mathSpan('x'))).toBe(false);
    expect(isRichEmpty('<table><tr><td></td></tr></table>')).toBe(false);
  });
  it('isSafeHref', () => {
    expect(isSafeHref('https://a.test')).toBe(true);
    expect(isSafeHref('//a.test')).toBe(false);
    expect(isSafeHref('vbscript:x')).toBe(false);
  });
});
