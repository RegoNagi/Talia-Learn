import { describe, it, expect } from 'vitest';
import { insertTemplate, nextPlaceholder, previewLatex, finalizeLatex, convertDigits, MATH_GROUPS, PLACEHOLDER } from './mathTemplates';
import { normalizeDok, dokLabel } from './dok';

describe('قوالب المعادلات', () => {
  it('إدراج قالب بيحدد أول □', () => {
    const r = insertTemplate('x+', 2, 2, '\\frac{□}{□}');
    expect(r.text).toBe('x+\\frac{□}{□}');
    expect(r.text.slice(r.selStart, r.selEnd)).toBe(PLACEHOLDER);
    expect(r.selStart).toBe(2 + '\\frac{'.length);
  });
  it('التحديد بيدخل جوه أول □', () => {
    const r = insertTemplate('abc', 0, 3, '\\sqrt{□}');
    expect(r.text).toBe('\\sqrt{abc}');
    expect(r.selStart).toBe(r.selEnd);
  });
  it('قالب من غير □ بيحط المؤشر في الآخر', () => {
    const r = insertTemplate('1', 1, 1, '\\pi');
    expect(r).toEqual({ text: '1\\pi', selStart: 4, selEnd: 4 });
  });
  it('حدود غلط ما بتكسرش', () => {
    expect(insertTemplate('ab', 10, 20, '+').text).toBe('ab+');
  });
  it('Tab بيلف على الـ □', () => {
    const t = '\\frac{□}{□}';
    const a = nextPlaceholder(t, 0)!;
    const b = nextPlaceholder(t, a.end)!;
    expect(b.start).toBeGreaterThan(a.start);
    expect(nextPlaceholder(t, b.end)!.start).toBe(a.start);
    expect(nextPlaceholder('x^2', 0)).toBeNull();
    expect(nextPlaceholder(t, b.start, true)!.start).toBe(a.start);
  });
  it('preview و finalize', () => {
    expect(previewLatex('\\frac{□}{2}')).toBe('\\frac{\\square }{2}');
    expect(finalizeLatex('\\frac{□}{□}')).toBe('\\frac{}{}');
  });
  it('الأرقام', () => {
    expect(convertDigits('x=12.5', 'ar')).toBe('x=١٢.٥');
    expect(convertDigits('7', 'ar-ex')).toBe('۷');
    expect(convertDigits('7', 'en')).toBe('7');
  });
  it('كل المجموعات ليها عناصر ومفيش latex فاضي', () => {
    for (const g of MATH_GROUPS) {
      expect(g.items.length).toBeGreaterThan(3);
      for (const i of g.items) expect(i.latex.length).toBeGreaterThan(0);
    }
  });
});

describe('DOK', () => {
  it('normalize / label', () => {
    expect(normalizeDok('3')).toBe(3);
    expect(normalizeDok(5)).toBeUndefined();
    expect(normalizeDok(undefined)).toBeUndefined();
    expect(dokLabel(2, 'ar')).toContain('DOK 2');
    expect(dokLabel(9)).toBe('');
  });
});
