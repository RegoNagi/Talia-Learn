import { describe, it, expect } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { buildXlsx, colName, safeSheetName } from './xlsxLite';
import { parseXml } from './qti';

describe('xlsxLite', () => {
  it('عمود A..Z..AA', () => {
    expect([colName(0), colName(25), colName(26), colName(701), colName(702)]).toEqual(['A', 'Z', 'AA', 'ZZ', 'AAA']);
  });
  it('أسماء الأوراق: حروف ممنوعة، طول 31، من غير تكرار', () => {
    const used = new Set<string>();
    expect(safeSheetName('تقرير/المادة:علوم?', used)).toBe('تقرير المادة علوم');
    expect(safeSheetName('تقرير/المادة:علوم?', used)).toBe('تقرير المادة علوم 2');
    expect(safeSheetName('x'.repeat(50), used)).toHaveLength(31);
  });
  it('بيطلّع حزمة صالحة: كل الملفات XML سليمة والقيم في مكانها', () => {
    const bytes = buildXlsx([
      { name: 'ملخص', rows: [['البند', 'العدد'], ['أسئلة <معتمدة> & أخرى', 12], ['فاضي', null], ['سطرين', 'أ\nب']] },
      { name: 'ورقة 2', rows: [['x']] },
    ]);
    const files = unzipSync(bytes);
    expect(Object.keys(files).sort()).toEqual(['[Content_Types].xml', '_rels/.rels', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/workbook.xml', 'xl/worksheets/sheet1.xml', 'xl/worksheets/sheet2.xml']);
    for (const [name, data] of Object.entries(files)) expect(() => parseXml(strFromU8(data)), name).not.toThrow();
    const s1 = strFromU8(files['xl/worksheets/sheet1.xml']);
    expect(s1).toContain('rightToLeft="1"');
    expect(s1).toContain('أسئلة &lt;معتمدة&gt; &amp; أخرى');
    expect(s1).toContain('<c r="B2"><v>12</v></c>');
    expect(s1).not.toContain('r="B3"');
    expect(s1).toContain('s="1"'); // العناوين
    expect(strFromU8(files['xl/workbook.xml'])).toContain('name="ملخص"');
  });
  it('محارف تحكم ممنوعة في XML بتتشال', () => {
    const files = unzipSync(buildXlsx([{ name: 'a', rows: [['a\u0001b']] }]));
    expect(strFromU8(files['xl/worksheets/sheet1.xml'])).toContain('>ab<');
  });
  it('من غير أوراق ما بيكسرش', () => {
    expect(() => buildXlsx([])).not.toThrow();
  });
});
