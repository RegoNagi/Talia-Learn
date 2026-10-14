/**
 * قوالب المعادلات. الـ "□" مكان فاضي بينتقل له بالـ Tab.
 * المنطق هنا نقي (من غير DOM) عشان نختبره.
 */
export const PLACEHOLDER = '□';

export interface MathTemplate { label: string; latex: string; title?: string }
export interface MathGroup { id: string; ar: string; en: string; items: MathTemplate[] }

export const MATH_GROUPS: MathGroup[] = [
  { id: 'basic', ar: 'أساسية', en: 'Basic', items: [
    { label: '□/□', latex: '\\frac{□}{□}', title: 'كسر' },
    { label: 'x²', latex: '□^{□}', title: 'أس' },
    { label: 'xₙ', latex: '□_{□}', title: 'سفلي' },
    { label: '√', latex: '\\sqrt{□}', title: 'جذر تربيعي' },
    { label: 'ⁿ√', latex: '\\sqrt[□]{□}', title: 'جذر نوني' },
    { label: '|x|', latex: '\\left|□\\right|', title: 'قيمة مطلقة' },
    { label: '( )', latex: '\\left(□\\right)', title: 'أقواس' },
    { label: '±', latex: '\\pm' },
    { label: '×', latex: '\\times' },
    { label: '÷', latex: '\\div' },
    { label: '·', latex: '\\cdot' },
    { label: '%', latex: '\\%' },
  ] },
  { id: 'relations', ar: 'علاقات', en: 'Relations', items: [
    { label: '≠', latex: '\\neq' }, { label: '≈', latex: '\\approx' }, { label: '≤', latex: '\\leq' }, { label: '≥', latex: '\\geq' },
    { label: '<', latex: '<' }, { label: '>', latex: '>' }, { label: '∝', latex: '\\propto' }, { label: '≡', latex: '\\equiv' },
    { label: '→', latex: '\\rightarrow' }, { label: '⇒', latex: '\\Rightarrow' }, { label: '⇔', latex: '\\Leftrightarrow' }, { label: '∞', latex: '\\infty' },
  ] },
  { id: 'greek', ar: 'يونانية', en: 'Greek', items: [
    ['α', '\\alpha'], ['β', '\\beta'], ['γ', '\\gamma'], ['δ', '\\delta'], ['ε', '\\epsilon'], ['θ', '\\theta'], ['λ', '\\lambda'], ['μ', '\\mu'],
    ['π', '\\pi'], ['ρ', '\\rho'], ['σ', '\\sigma'], ['τ', '\\tau'], ['φ', '\\phi'], ['ω', '\\omega'], ['Δ', '\\Delta'], ['Σ', '\\Sigma'], ['Ω', '\\Omega'], ['Φ', '\\Phi'],
  ].map(([label, latex]) => ({ label, latex })) },
  { id: 'calculus', ar: 'تفاضل وتكامل', en: 'Calculus', items: [
    { label: '∫', latex: '\\int_{□}^{□} □\\,d□', title: 'تكامل' },
    { label: '∑', latex: '\\sum_{□}^{□} □', title: 'مجموع' },
    { label: '∏', latex: '\\prod_{□}^{□} □' },
    { label: 'lim', latex: '\\lim_{□ \\to □} □', title: 'نهاية' },
    { label: 'dy/dx', latex: '\\frac{d□}{d□}', title: 'مشتقة' },
    { label: '∂', latex: '\\frac{\\partial □}{\\partial □}' },
    { label: 'log', latex: '\\log_{□}(□)' },
    { label: 'ln', latex: '\\ln(□)' },
  ] },
  { id: 'trig', ar: 'مثلثات', en: 'Trig', items: [
    ['sin', '\\sin(□)'], ['cos', '\\cos(□)'], ['tan', '\\tan(□)'], ['cot', '\\cot(□)'], ['sec', '\\sec(□)'], ['csc', '\\csc(□)'],
    ['sin⁻¹', '\\sin^{-1}(□)'], ['°', '^{\\circ}'], ['∠', '\\angle'], ['⊥', '\\perp'], ['∥', '\\parallel'], ['△', '\\triangle'],
  ].map(([label, latex]) => ({ label, latex })) },
  { id: 'sets', ar: 'مجموعات ومنطق', en: 'Sets & logic', items: [
    ['∈', '\\in'], ['∉', '\\notin'], ['⊂', '\\subset'], ['⊆', '\\subseteq'], ['∪', '\\cup'], ['∩', '\\cap'], ['∅', '\\emptyset'], ['∀', '\\forall'],
    ['∃', '\\exists'], ['¬', '\\neg'], ['∧', '\\land'], ['∨', '\\lor'], ['ℕ', '\\mathbb{N}'], ['ℤ', '\\mathbb{Z}'], ['ℚ', '\\mathbb{Q}'], ['ℝ', '\\mathbb{R}'],
  ].map(([label, latex]) => ({ label, latex })) },
  { id: 'matrix', ar: 'مصفوفات ونظم', en: 'Matrices & systems', items: [
    { label: '2×2', latex: '\\begin{pmatrix} □ & □ \\\\ □ & □ \\end{pmatrix}', title: 'مصفوفة 2×2' },
    { label: '3×3', latex: '\\begin{pmatrix} □ & □ & □ \\\\ □ & □ & □ \\\\ □ & □ & □ \\end{pmatrix}', title: 'مصفوفة 3×3' },
    { label: '{ ', latex: '\\begin{cases} □ \\\\ □ \\end{cases}', title: 'نظام معادلات' },
    { label: 'vec', latex: '\\vec{□}', title: 'متجه' },
    { label: 'x̄', latex: '\\overline{□}' },
    { label: 'x̂', latex: '\\hat{□}' },
  ] },
  { id: 'chem', ar: 'كيمياء', en: 'Chemistry', items: [
    { label: 'H₂O', latex: '\\ce{H2O}', title: 'صيغة' },
    { label: '→', latex: '\\ce{A -> B}', title: 'تفاعل' },
    { label: '⇌', latex: '\\ce{A <=> B}', title: 'تفاعل عكسي' },
    { label: 'SO₄²⁻', latex: '\\ce{SO4^2-}', title: 'أيون' },
    { label: '↑', latex: '\\ce{CO2 ^}', title: 'غاز' },
    { label: 'Δ', latex: '\\ce{->[\\Delta]}', title: 'حرارة' },
  ] },
  { id: 'arabic', ar: 'حروف عربية', en: 'Arabic letters', items: [
    ['س', '\\text{س}'], ['ص', '\\text{ص}'], ['ع', '\\text{ع}'], ['ل', '\\text{ل}'], ['م', '\\text{م}'], ['ن', '\\text{ن}'], ['ك', '\\text{ك}'], ['هـ', '\\text{هـ}'],
    ['أ', '\\text{أ}'], ['ب', '\\text{ب}'], ['ج', '\\text{ج}'], ['د', '\\text{د}'],
  ].map(([label, latex]) => ({ label, latex })) },
];

export interface Insertion { text: string; selStart: number; selEnd: number }

/** يحط القالب مكان التحديد. لو في تحديد بيروح لأول □ جوه القالب */
export function insertTemplate(text: string, selStart: number, selEnd: number, template: string): Insertion {
  const s = Math.max(0, Math.min(selStart, text.length));
  const e = Math.max(s, Math.min(selEnd, text.length));
  const selected = text.slice(s, e);
  let ins = template;
  if (selected && ins.includes(PLACEHOLDER)) ins = ins.replace(PLACEHOLDER, selected);
  const out = text.slice(0, s) + ins + text.slice(e);
  const first = ins.indexOf(PLACEHOLDER);
  if (first >= 0) return { text: out, selStart: s + first, selEnd: s + first + 1 };
  const caret = s + ins.length;
  return { text: out, selStart: caret, selEnd: caret };
}

/** أقرب □ بعد الموضع ده (أو من الأول لو مفيش). بيرجع null لو مفيش ولا واحد */
export function nextPlaceholder(text: string, from: number, backwards = false): { start: number; end: number } | null {
  if (!text.includes(PLACEHOLDER)) return null;
  if (backwards) {
    let i = text.lastIndexOf(PLACEHOLDER, Math.max(0, from - 1));
    if (i === -1) i = text.lastIndexOf(PLACEHOLDER);
    return { start: i, end: i + 1 };
  }
  let i = text.indexOf(PLACEHOLDER, from);
  if (i === -1) i = text.indexOf(PLACEHOLDER);
  return { start: i, end: i + 1 };
}

/** للمعاينة: □ تظهر مربع. للحفظ: □ الفاضية بتتشال */
export function previewLatex(latex: string): string {
  return latex.split(PLACEHOLDER).join('\\square ');
}
export function finalizeLatex(latex: string): string {
  return latex.split(PLACEHOLDER).join('').replace(/\s+/g, ' ').trim();
}

/** رموز لوحة مفاتيح الطالب (الإجابة الرقمية/النصية) — قصة 46 */
export const STUDENT_SYMBOLS = ['+', '−', '×', '÷', '=', '≠', '≤', '≥', '²', '³', '√', 'π', '°', '±', '%', '∞', '½'];

export type DigitStyle = 'en' | 'ar' | 'ar-ex';
export function convertDigits(s: string, style: DigitStyle): string {
  if (style === 'en') return s;
  const base = style === 'ar' ? 0x0660 : 0x06f0;
  return s.replace(/[0-9]/g, (d) => String.fromCharCode(base + Number(d)));
}
