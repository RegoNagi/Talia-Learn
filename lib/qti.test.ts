import { describe, it, expect } from 'vitest';
import { unzipSync, strFromU8, strToU8, zipSync } from 'fflate';
import { buildQtiItemXml, buildQtiPackage, parseQtiFile, parseXml, exportSummary, type QtiExportItem } from './qti';

const mc: QtiExportItem = {
  type: 'اختيار من متعدد', difficulty: 'سهل', bloomLevel: 'فهم', unit: 'الوحدة 1', lesson: 'الدرس 2',
  question: {
    title: 'ما عاصمة قطر <الدوحة>؟ & أخواتها',
    options: [
      { id: '1', text: 'الرياض', isCorrect: false },
      { id: '2', text: 'الدوحة', isCorrect: true },
      { id: '3', text: 'مسقط', isCorrect: false },
    ],
    correctOption: 1,
  },
};

const roundTrip = (item: QtiExportItem) => {
  const bytes = buildQtiPackage([item], 'test');
  const res = parseQtiFile('test.zip', bytes);
  expect(res.skipped).toEqual([]);
  expect(res.questions).toHaveLength(1);
  return res.questions[0];
};

describe('QTI round trip', () => {
  it('اختيار من متعدد: النص والخيارات والإجابة الصحيحة والميتا بترجع زي ما هي', () => {
    const q = roundTrip(mc);
    expect(q.type).toBe('اختيار من متعدد');
    expect(q.question.title).toBe('ما عاصمة قطر <الدوحة>؟ & أخواتها');
    expect(q.question.options?.map((o) => o.text)).toEqual(['الرياض', 'الدوحة', 'مسقط']);
    expect(q.question.options?.map((o) => o.isCorrect)).toEqual([false, true, false]);
    expect(q.question.correctOption).toBe(1);
    expect([q.difficulty, q.bloomLevel, q.unit, q.lesson]).toEqual(['سهل', 'فهم', 'الوحدة 1', 'الدرس 2']);
  });

  it('اختيار متعدد الإجابات الصحيحة', () => {
    const q = roundTrip({ ...mc, question: { ...mc.question, options: [
      { id: '1', text: 'أ', isCorrect: true }, { id: '2', text: 'ب', isCorrect: true }, { id: '3', text: 'ج', isCorrect: false },
    ] } });
    expect(q.question.options?.map((o) => o.isCorrect)).toEqual([true, true, false]);
  });

  it('صح أم خطأ', () => {
    const q = roundTrip({ type: 'صح أم خطأ', question: { title: 'الشمس نجم', options: [
      { id: '1', text: 'صح', isCorrect: true }, { id: '2', text: 'خطأ', isCorrect: false },
    ], correctOption: 0 } });
    expect(q.type).toBe('صح أم خطأ');
    expect(q.question.options?.map((o) => [o.text, o.isCorrect])).toEqual([['صح', true], ['خطأ', false]]);
  });

  it('أكمل الفراغ وإجابة قصيرة بيحافظوا على نوعهم', () => {
    expect(roundTrip({ type: 'أكمل الفراغ', question: { title: 'عاصمة قطر', correctAnswer: 'الدوحة' } })).toMatchObject({ type: 'أكمل الفراغ', question: { correctAnswer: 'الدوحة' } });
    expect(roundTrip({ type: 'إجابة قصيرة', question: { title: 'عاصمة قطر', correctAnswer: 'الدوحة' } }).type).toBe('إجابة قصيرة');
  });

  it('إجابة رقمية بالتفاوت والوحدة', () => {
    const q = roundTrip({ type: 'إجابة رقمية', question: { title: '2.5 × 2', numericAnswer: 5, numericTolerance: 0.1, numericUnit: 'سم' } });
    expect(q.type).toBe('إجابة رقمية');
    expect(q.question).toMatchObject({ numericAnswer: 5, numericTolerance: 0.1, numericUnit: 'سم' });
  });

  it('سؤال مقالي مع الإجابة النموذجية', () => {
    const q = roundTrip({ type: 'سؤال مقالي', question: { title: 'اشرح دورة الماء', modelAnswer: 'تبخر ثم تكثف' } });
    expect(q).toMatchObject({ type: 'سؤال مقالي', question: { modelAnswer: 'تبخر ثم تكثف' } });
  });

  it('ترتيب', () => {
    const q = roundTrip({ type: 'ترتيب', question: { title: 'رتب', orderItems: ['أول', 'ثاني', 'ثالث'] } });
    expect(q.question.orderItems).toEqual(['أول', 'ثاني', 'ثالث']);
  });

  it('توصيل', () => {
    const pairs = [{ id: '1', left: 'قطر', right: 'الدوحة' }, { id: '2', left: 'مصر', right: 'القاهرة' }];
    const q = roundTrip({ type: 'توصيل', question: { title: 'صل', pairs } });
    expect(q.question.pairs?.map((p) => [p.left, p.right])).toEqual([['قطر', 'الدوحة'], ['مصر', 'القاهرة']]);
  });

  it('أنواع تاليا الخاصة بترجع كاملة', () => {
    const question = { title: 'صنف', categories: ['حي', 'غير حي'], classifyItems: [{ text: 'قط', category: 'حي' }] };
    const q = roundTrip({ type: 'تصنيف', difficulty: 'صعب', question });
    expect(q.type).toBe('تصنيف');
    expect(q.question).toEqual(question);
  });

  it('رابط صورة السؤال بيتحفظ', () => {
    const q = roundTrip({ type: 'سؤال مقالي', question: { title: 'صف الصورة', questionImageUrl: 'https://x.test/a.png?x=1&y=2' } });
    expect(q.question.questionImageUrl).toBe('https://x.test/a.png?x=1&y=2');
  });
});

describe('QTI من أنظمة تانية', () => {
  const external = (body: string, decl: string) => `<?xml version="1.0"?>
<assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1" identifier="x" title="t">${decl}<itemBody>${body}</itemBody></assessmentItem>`;

  it('ملف XML منفرد بسؤال اختيار من QTI 2.1 عادي', () => {
    const xml = external(
      '<p>2 + 2 = ؟</p><choiceInteraction responseIdentifier="RESPONSE" maxChoices="1"><prompt>اختر</prompt><simpleChoice identifier="A">3</simpleChoice><simpleChoice identifier="B">4</simpleChoice></choiceInteraction>',
      '<responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier"><correctResponse><value>B</value></correctResponse></responseDeclaration>',
    );
    const res = parseQtiFile('q.xml', strToU8(xml));
    expect(res.questions).toHaveLength(1);
    expect(res.questions[0].type).toBe('اختيار من متعدد');
    expect(res.questions[0].question.title).toBe('2 + 2 = ؟ اختر');
    expect(res.questions[0].question.options?.map((o) => o.isCorrect)).toEqual([false, true]);
  });

  it('QTI 3 بأسماء qti- بتتقرأ', () => {
    const xml = `<qti-assessment-item identifier="x" title="t"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>T</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><p>الأرض كروية</p><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="T">True</qti-simple-choice><qti-simple-choice identifier="F">False</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`;
    const res = parseQtiFile('q3.xml', strToU8(xml));
    expect(res.questions[0].type).toBe('صح أم خطأ');
    expect(res.questions[0].question.options?.map((o) => [o.text, o.isCorrect])).toEqual([['صح', true], ['خطأ', false]]);
  });

  it('سؤال بدون إجابة صحيحة بيتستورد مع تحذير', () => {
    const xml = external(
      '<p>سؤال</p><choiceInteraction responseIdentifier="RESPONSE"><simpleChoice identifier="A">1</simpleChoice><simpleChoice identifier="B">2</simpleChoice></choiceInteraction>',
      '<responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier"/>',
    );
    const res = parseQtiFile('q.xml', strToU8(xml));
    expect(res.questions[0].warnings.length).toBe(1);
  });

  it('textEntry جوه الجملة بيتحول لـ ____', () => {
    const xml = external(
      '<p>عاصمة قطر <textEntryInteraction responseIdentifier="RESPONSE"/> مدينة</p>',
      '<responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string"><correctResponse><value>الدوحة</value></correctResponse></responseDeclaration>',
    );
    const q = parseQtiFile('q.xml', strToU8(xml)).questions[0];
    expect(q.question.title).toBe('عاصمة قطر ____ مدينة');
    expect(q.question.correctAnswer).toBe('الدوحة');
  });

  it('الملفات المش أسئلة بتتخطى ومعاها سبب', () => {
    const zip = zipSync({
      'imsmanifest.xml': strToU8('<manifest/>'),
      'a.xml': strToU8('<assessmentTest identifier="t"/>'),
      'b.xml': strToU8('مش xml'),
      'c.txt': strToU8('x'),
    });
    const res = parseQtiFile('p.zip', zip);
    expect(res.questions).toEqual([]);
    expect(res.skipped.map((s) => s.source).sort()).toEqual(['a.xml', 'b.xml']);
  });

  it('ملف ZIP تالف', () => {
    const res = parseQtiFile('bad.zip', new Uint8Array([0x50, 0x4b, 1, 2, 3]));
    expect(res.questions).toEqual([]);
    expect(res.skipped).toHaveLength(1);
  });
});

describe('شكل الحزمة المصدّرة', () => {
  it('فيها manifest وملف لكل سؤال وXML سليم', () => {
    const files = unzipSync(buildQtiPackage([mc, mc], 'bank'));
    expect(Object.keys(files).sort()).toEqual(['imsmanifest.xml', 'items/item-1.xml', 'items/item-2.xml']);
    const manifest = strFromU8(files['imsmanifest.xml']);
    expect(manifest).toContain('href="items/item-2.xml"');
    expect(() => parseXml(strFromU8(files['items/item-1.xml']))).not.toThrow();
    expect(buildQtiItemXml(mc, 'ID')).toContain('&lt;الدوحة&gt;');
  });

  it('ملخص التصدير بيفرق القياسي عن الخاص بتاليا', () => {
    expect(exportSummary([mc, { type: 'تصنيف', question: { title: 'x' } }])).toEqual({ total: 2, native: 1, talia: 1 });
  });
});
