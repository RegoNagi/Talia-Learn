// تعريفات مبسطة لـ KaTeX (الحزمة نفسها مفيهاش types)
declare module 'katex' {
  export interface KatexOptions {
    displayMode?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    output?: 'html' | 'mathml' | 'htmlAndMathml';
    strict?: boolean | string | ((code: string) => string | boolean);
    trust?: boolean;
    maxSize?: number;
    maxExpand?: number;
  }
  const katex: {
    render(expression: string, element: HTMLElement, options?: KatexOptions): void;
    renderToString(expression: string, options?: KatexOptions): string;
  };
  export default katex;
}
declare module 'katex/contrib/mhchem';
