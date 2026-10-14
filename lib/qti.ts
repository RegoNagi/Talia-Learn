// استيراد وتصدير أسئلة بنك الأسئلة بصيغة IMS QTI 2.1 (XML داخل حزمة ZIP، أو ملف XML منفرد).
// الملف ده منطق صرف (من غير React ولا Supabase) عشان يتختبر بسهولة.
//
// الأنواع المدعومة بشكل قياسي (أي نظام QTI تاني يفهمها):
//   اختيار من متعدد / صح أم خطأ → choiceInteraction
//   أكمل الفراغ / إجابة قصيرة / إجابة رقمية → textEntryInteraction
//   سؤال مقالي → extendedTextInteraction
//   ترتيب → orderInteraction
//   توصيل → matchInteraction
// باقي أنواع تاليا (تصنيف، سحب وإفلات، منطقة تفاعلية، مقطع صوتي، قطعة) بتتصدّر كـ customInteraction
// فيها السؤال كامل، فتترجع كاملة لو اتستوردت في تاليا، وباقي الأنظمة بتشوف نص السؤال بس.

import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';

// ============================== أنواع ==============================

export interface QtiOption { id: string; text: string; isCorrect: boolean; imageUrl?: string }

export interface QtiQuestionContent {
  title: string;
  questionImageUrl?: string;
  options?: QtiOption[];
  correctOption?: number;
  correctAnswer?: string;
  modelAnswer?: string;
  numericAnswer?: number | null;
  numericTolerance?: number;
  numericUnit?: string;
  pairs?: { id: string; left: string; right: string }[];
  orderItems?: string[];
  // أي حقول إضافية (تصنيف، منطقة تفاعلية...) بتعدي زي ما هي
  [key: string]: unknown;
}

export interface QtiExportItem {
  type: string;
  difficulty?: string;
  bloomLevel?: string;
  unit?: string;
  lesson?: string | null;
  question: QtiQuestionContent;
}

export interface ParsedQtiQuestion {
  type: string;
  difficulty?: string;
  bloomLevel?: string;
  unit?: string;
  lesson?: string;
  question: QtiQuestionContent;
  source: string; // اسم الملف جوه الحزمة
  warnings: string[];
}

export interface QtiParseResult {
  questions: ParsedQtiQuestion[];
  skipped: { source: string; reason: string }[];
}

// ============================== XML ==============================

type XmlChild = XmlNode | string;
interface XmlNode { name: string; attrs: Record<string, string>; children: XmlChild[] }

const ENTITIES: Record<string, string> = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };

function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, (m, g: string) => {
    if (g[0] === '#') {
      const code = g[1] === 'x' ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[g] ?? m;
  });
}

export function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] as string));
}

// qti-choice-interaction (QTI 3) و choiceInteraction (QTI 2) بيتحولوا لنفس الاسم: choiceInteraction
function normName(raw: string): string {
  let n = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : raw;
  if (n.startsWith('qti-')) n = n.slice(4);
  return n.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
}

const TOKEN = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>|<\/([^\s>]+)\s*>|<([^\s/>!?]+)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>|([^<]+)/g;
const ATTR = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

export function parseXml(text: string): XmlNode {
  const root: XmlNode = { name: '#root', attrs: {}, children: [] };
  const stack: XmlNode[] = [root];
  TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(text)) !== null) {
    const top = stack[stack.length - 1];
    if (m[1] !== undefined) {
      top.children.push(m[1]);
    } else if (m[2] !== undefined) {
      if (stack.length > 1) stack.pop();
    } else if (m[3] !== undefined) {
      const attrs: Record<string, string> = {};
      ATTR.lastIndex = 0;
      let a: RegExpExecArray | null;
      while ((a = ATTR.exec(m[4] || '')) !== null) {
        const key = normName(a[1]);
        if (a[1] === 'xmlns' || a[1].startsWith('xmlns:')) continue;
        attrs[key] = decodeEntities(a[2] ?? a[3] ?? '');
      }
      const node: XmlNode = { name: normName(m[3]), attrs, children: [] };
      top.children.push(node);
      if (m[5] !== '/') stack.push(node);
    } else if (m[6] !== undefined) {
      top.children.push(decodeEntities(m[6]));
    }
  }
  const first = root.children.find((c): c is XmlNode => typeof c !== 'string');
  if (!first) throw new Error('الملف مش XML صالح');
  return first;
}

function findAll(node: XmlNode, name: string, out: XmlNode[] = []): XmlNode[] {
  for (const c of node.children) {
    if (typeof c === 'string') continue;
    if (c.name === name) out.push(c);
    findAll(c, name, out);
  }
  return out;
}

function findFirst(node: XmlNode, name: string): XmlNode | undefined {
  return findAll(node, name)[0];
}

function textOf(node: XmlNode, skip?: (n: XmlNode) => string | null): string {
  let out = '';
  for (const c of node.children) {
    if (typeof c === 'string') { out += c; continue; }
    const replaced = skip ? skip(c) : null;
    if (replaced !== null) { out += replaced; continue; }
    out += textOf(c, skip);
    if (c.name === 'p' || c.name === 'br' || c.name === 'div') out += ' ';
  }
  return out;
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim();

// ============================== Base64 ==============================

function toBase64(s: string): string {
  const bytes = strToU8(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromBase64(b64: string): string {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return strFromU8(bytes);
}

// ============================== تصدير ==============================

const NS = 'http://www.imsglobal.org/xsd/imsqti_v2p1';
const TRUE_FALSE = ['صح', 'خطأ'];
const NATIVE_TYPES = new Set(['اختيار من متعدد', 'صح أم خطأ', 'أكمل الفراغ', 'إجابة قصيرة', 'إجابة رقمية', 'سؤال مقالي', 'ترتيب', 'توصيل']);

function metaDiv(item: QtiExportItem): string {
  const q = item.question;
  const attrs: [string, string | undefined][] = [
    ['data-type', item.type],
    ['data-difficulty', item.difficulty],
    ['data-bloom', item.bloomLevel],
    ['data-unit', item.unit],
    ['data-lesson', item.lesson || undefined],
    ['data-tolerance', q.numericTolerance !== undefined ? String(q.numericTolerance) : undefined],
    ['data-unit-label', q.numericUnit],
    ['data-model-answer', q.modelAnswer],
  ];
  const body = attrs.filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}="${escapeXml(String(v))}"`).join(' ');
  return `<div class="talia-meta" ${body}/>`;
}

export function buildQtiItemXml(item: QtiExportItem, identifier: string): string {
  const q = item.question;
  const title = q.title || '';
  const img = q.questionImageUrl && /^https?:\/\//.test(q.questionImageUrl) ? `<p><img src="${escapeXml(q.questionImageUrl)}" alt=""/></p>` : '';
  const head = `<?xml version="1.0" encoding="UTF-8"?>\n<assessmentItem xmlns="${NS}" identifier="${escapeXml(identifier)}" title="${escapeXml(title.slice(0, 80))}" adaptive="false" timeDependent="false">\n`;
  const score = `  <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float"/>\n`;
  const matchTemplate = `  <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>\n`;
  const meta = metaDiv(item);
  const prompt = `<p>${escapeXml(title)}</p>`;

  let decl = '';
  let interaction = '';
  let processing = '';

  if (item.type === 'اختيار من متعدد' || item.type === 'صح أم خطأ') {
    const opts = (q.options && q.options.length > 0)
      ? q.options
      : TRUE_FALSE.map((t, i) => ({ id: String(i + 1), text: t, isCorrect: q.correctOption === i }));
    const correct = opts.map((o, i) => (o.isCorrect ? `C${i + 1}` : null)).filter((x): x is string => !!x);
    const multi = correct.length > 1;
    decl = `  <responseDeclaration identifier="RESPONSE" cardinality="${multi ? 'multiple' : 'single'}" baseType="identifier">\n` +
      (correct.length > 0 ? `    <correctResponse>${correct.map((c) => `<value>${c}</value>`).join('')}</correctResponse>\n` : '') +
      `  </responseDeclaration>\n`;
    interaction = `    <choiceInteraction responseIdentifier="RESPONSE" shuffle="false" maxChoices="${multi ? 0 : 1}">\n` +
      opts.map((o, i) => `      <simpleChoice identifier="C${i + 1}">${escapeXml(o.text)}</simpleChoice>`).join('\n') +
      `\n    </choiceInteraction>`;
    processing = correct.length > 0 ? matchTemplate : '';
  } else if (item.type === 'أكمل الفراغ' || item.type === 'إجابة قصيرة') {
    const ans = q.correctAnswer;
    decl = `  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string">\n` +
      (ans ? `    <correctResponse><value>${escapeXml(ans)}</value></correctResponse>\n` : '') +
      `  </responseDeclaration>\n`;
    interaction = `    <p><textEntryInteraction responseIdentifier="RESPONSE" expectedLength="30"/></p>`;
    processing = ans ? matchTemplate : '';
  } else if (item.type === 'إجابة رقمية') {
    const has = q.numericAnswer !== null && q.numericAnswer !== undefined;
    decl = `  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="float">\n` +
      (has ? `    <correctResponse><value>${q.numericAnswer}</value></correctResponse>\n` : '') +
      `  </responseDeclaration>\n`;
    interaction = `    <p><textEntryInteraction responseIdentifier="RESPONSE" expectedLength="12"/></p>`;
    processing = has ? matchTemplate : '';
  } else if (item.type === 'سؤال مقالي') {
    decl = `  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string"/>\n`;
    interaction = `    <extendedTextInteraction responseIdentifier="RESPONSE" expectedLines="6"/>`;
  } else if (item.type === 'ترتيب') {
    const items = q.orderItems || [];
    decl = `  <responseDeclaration identifier="RESPONSE" cardinality="ordered" baseType="identifier">\n` +
      `    <correctResponse>${items.map((_, i) => `<value>O${i + 1}</value>`).join('')}</correctResponse>\n` +
      `  </responseDeclaration>\n`;
    interaction = `    <orderInteraction responseIdentifier="RESPONSE" shuffle="true">\n` +
      items.map((t, i) => `      <simpleChoice identifier="O${i + 1}">${escapeXml(t)}</simpleChoice>`).join('\n') +
      `\n    </orderInteraction>`;
    processing = matchTemplate;
  } else if (item.type === 'توصيل') {
    const pairs = q.pairs || [];
    decl = `  <responseDeclaration identifier="RESPONSE" cardinality="multiple" baseType="directedPair">\n` +
      `    <correctResponse>${pairs.map((_, i) => `<value>L${i + 1} R${i + 1}</value>`).join('')}</correctResponse>\n` +
      `  </responseDeclaration>\n`;
    interaction = `    <matchInteraction responseIdentifier="RESPONSE" shuffle="true" maxAssociations="${pairs.length}">\n` +
      `      <simpleMatchSet>\n` + pairs.map((p, i) => `        <simpleAssociableChoice identifier="L${i + 1}" matchMax="1">${escapeXml(p.left)}</simpleAssociableChoice>`).join('\n') + `\n      </simpleMatchSet>\n` +
      `      <simpleMatchSet>\n` + pairs.map((p, i) => `        <simpleAssociableChoice identifier="R${i + 1}" matchMax="1">${escapeXml(p.right)}</simpleAssociableChoice>`).join('\n') + `\n      </simpleMatchSet>\n` +
      `    </matchInteraction>`;
    processing = matchTemplate;
  } else {
    // نوع مش موجود في QTI القياسي: بنحط السؤال كامل في customInteraction
    const payload = toBase64(JSON.stringify({ type: item.type, question: q }));
    decl = `  <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="string"/>\n`;
    interaction = `    <customInteraction responseIdentifier="RESPONSE" class="talia-question" data-talia-question="${payload}"/>`;
  }

  return head + decl + score +
    `  <itemBody>\n    ${meta}\n    ${prompt}\n    ${img}\n${interaction}\n  </itemBody>\n` +
    processing +
    `</assessmentItem>\n`;
}

export function buildQtiPackage(items: QtiExportItem[], packageName: string): Uint8Array {
  const files: Record<string, Uint8Array> = {};
  const resources: string[] = [];
  items.forEach((item, i) => {
    const n = i + 1;
    const href = `items/item-${n}.xml`;
    files[href] = strToU8(buildQtiItemXml(item, `ITEM-${n}`));
    resources.push(`    <resource identifier="RES-${n}" type="imsqti_item_xmlv2p1" href="${href}"><file href="${href}"/></resource>`);
  });
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" identifier="PKG-${escapeXml(packageName)}">\n` +
    `  <metadata><schema>QTI Package</schema><schemaversion>2.1</schemaversion></metadata>\n` +
    `  <organizations/>\n  <resources>\n${resources.join('\n')}\n  </resources>\n</manifest>\n`;
  files['imsmanifest.xml'] = strToU8(manifest);
  return zipSync(files);
}

export function exportSummary(items: QtiExportItem[]): { total: number; native: number; talia: number } {
  const native = items.filter((i) => NATIVE_TYPES.has(i.type)).length;
  return { total: items.length, native, talia: items.length - native };
}

// ============================== استيراد ==============================

const TF_TRUE = new Set(['true', 'صح', 'صحيح', 'نعم', 'yes']);
const TF_FALSE = new Set(['false', 'خطأ', 'خاطئ', 'غلط', 'لا', 'no']);
const FAMILY_CHOICE = ['اختيار من متعدد', 'صح أم خطأ'];
const FAMILY_TEXT = ['أكمل الفراغ', 'إجابة قصيرة'];

function correctValues(root: XmlNode, responseId: string): string[] {
  const decl = findAll(root, 'responseDeclaration').find((d) => d.attrs.identifier === responseId);
  if (!decl) return [];
  const cr = findFirst(decl, 'correctResponse');
  return cr ? findAll(cr, 'value').map((v) => clean(textOf(v))) : [];
}

function declBaseType(root: XmlNode, responseId: string): string {
  const decl = findAll(root, 'responseDeclaration').find((d) => d.attrs.identifier === responseId);
  return decl?.attrs.baseType || '';
}

const INTERACTIONS = ['choiceInteraction', 'textEntryInteraction', 'extendedTextInteraction', 'orderInteraction', 'matchInteraction', 'customInteraction'];

export function parseQtiItem(root: XmlNode, source: string): ParsedQtiQuestion | { skip: string } {
  if (root.name !== 'assessmentItem') return { skip: 'مش عنصر سؤال (assessmentItem)' };
  const body = findFirst(root, 'itemBody');
  if (!body) return { skip: 'السؤال مفيهوش itemBody' };

  const metaNode = findAll(body, 'div').find((d) => (d.attrs.class || '').includes('talia-meta'));
  const meta = metaNode?.attrs || {};
  const base = {
    difficulty: meta.dataDifficulty,
    bloomLevel: meta.dataBloom,
    unit: meta.dataUnit,
    lesson: meta.dataLesson,
  };
  const warnings: string[] = [];

  // سؤال تاليا الكامل (للأنواع اللي مش في QTI القياسي)
  const custom = findAll(body, 'customInteraction').find((c) => c.attrs.dataTaliaQuestion);
  if (custom) {
    try {
      const payload = JSON.parse(fromBase64(custom.attrs.dataTaliaQuestion)) as { type: string; question: QtiQuestionContent };
      return { ...base, type: payload.type, question: payload.question, source, warnings };
    } catch {
      return { skip: 'بيانات سؤال تاليا جوه الملف تالفة' };
    }
  }

  const interaction = INTERACTIONS.map((n) => findFirst(body, n)).find((n): n is XmlNode => !!n);
  if (!interaction) return { skip: 'نوع السؤال مش مدعوم (مفيش تفاعل مفهوم)' };

  const responseId = interaction.attrs.responseIdentifier || 'RESPONSE';
  const correct = correctValues(root, responseId);

  // نص السؤال: محتوى الجسم من غير التفاعلات والميتا، والفراغات النصية بتتحول لـ ____
  const stem = clean(textOf(body, (n) => {
    if (n === metaNode) return '';
    if (n.name === 'textEntryInteraction') return ' ____ ';
    if (INTERACTIONS.includes(n.name)) {
      const p = findFirst(n, 'prompt');
      return p ? ` ${textOf(p)} ` : '';
    }
    return null;
  }));
  const img = findFirst(body, 'img');
  const imgSrc = img?.attrs.src;
  const questionImageUrl = imgSrc && /^https?:\/\//.test(imgSrc) ? imgSrc : undefined;
  if (imgSrc && !questionImageUrl) warnings.push('الصورة جوه الحزمة ومش رابط مباشر، اتخطّت');

  const title = stem || clean(root.attrs.title || '');
  if (!title) return { skip: 'السؤال بدون نص' };
  const content: QtiQuestionContent = { title, ...(questionImageUrl ? { questionImageUrl } : {}) };

  switch (interaction.name) {
    case 'choiceInteraction': {
      const choices = findAll(interaction, 'simpleChoice');
      if (choices.length < 2) return { skip: 'اختيار من متعدد بأقل من خيارين' };
      const options: QtiOption[] = choices.map((c, i) => ({ id: String(i + 1), text: clean(textOf(c)), isCorrect: correct.includes(c.attrs.identifier) }));
      if (!options.some((o) => o.isCorrect)) warnings.push('مفيش إجابة صحيحة محددة في الملف، لازم تتحدد بعد الاستيراد');
      const lower = options.map((o) => o.text.toLowerCase());
      const isTf = options.length === 2 && lower.some((t) => TF_TRUE.has(t)) && lower.some((t) => TF_FALSE.has(t));
      if (isTf) {
        const ordered = options.slice().sort((a, b) => (TF_TRUE.has(a.text.toLowerCase()) ? -1 : 1) - (TF_TRUE.has(b.text.toLowerCase()) ? -1 : 1));
        content.options = [
          { id: '1', text: TRUE_FALSE[0], isCorrect: ordered[0].isCorrect },
          { id: '2', text: TRUE_FALSE[1], isCorrect: ordered[1].isCorrect },
        ];
      } else {
        content.options = options;
      }
      content.correctOption = Math.max(0, content.options.findIndex((o) => o.isCorrect));
      const structural = isTf ? 'صح أم خطأ' : 'اختيار من متعدد';
      return { ...base, type: structural, question: content, source, warnings };
    }
    case 'textEntryInteraction': {
      const bt = declBaseType(root, responseId);
      if (bt === 'float' || bt === 'integer') {
        const n = correct.length > 0 ? Number(correct[0]) : NaN;
        content.numericAnswer = Number.isFinite(n) ? n : null;
        content.numericTolerance = meta.dataTolerance ? Number(meta.dataTolerance) || 0 : 0;
        if (meta.dataUnitLabel) content.numericUnit = meta.dataUnitLabel;
        if (content.numericAnswer === null) warnings.push('مفيش إجابة رقمية في الملف');
        return { ...base, type: 'إجابة رقمية', question: content, source, warnings };
      }
      if (correct.length > 0) content.correctAnswer = correct[0];
      else warnings.push('مفيش إجابة صحيحة في الملف');
      if (correct.length > 1) warnings.push('فيه أكتر من إجابة مقبولة، اتاخدت الأولى بس');
      const type = FAMILY_TEXT.includes(meta.dataType || '') ? meta.dataType : 'أكمل الفراغ';
      return { ...base, type, question: content, source, warnings };
    }
    case 'extendedTextInteraction': {
      if (meta.dataModelAnswer) content.modelAnswer = meta.dataModelAnswer;
      return { ...base, type: 'سؤال مقالي', question: content, source, warnings };
    }
    case 'orderInteraction': {
      const choices = findAll(interaction, 'simpleChoice');
      const byId = new Map(choices.map((c) => [c.attrs.identifier, clean(textOf(c))]));
      const ordered = correct.length > 0 ? correct.map((id) => byId.get(id)).filter((t): t is string => !!t) : choices.map((c) => clean(textOf(c)));
      if (correct.length === 0) warnings.push('مفيش ترتيب صحيح في الملف، اتاخد ترتيب العرض');
      if (ordered.length < 2) return { skip: 'ترتيب بأقل من عنصرين' };
      content.orderItems = ordered;
      return { ...base, type: 'ترتيب', question: content, source, warnings };
    }
    case 'matchInteraction': {
      const sets = findAll(interaction, 'simpleMatchSet');
      if (sets.length < 2) return { skip: 'توصيل بدون مجموعتين' };
      const left = new Map(findAll(sets[0], 'simpleAssociableChoice').map((c) => [c.attrs.identifier, clean(textOf(c))]));
      const right = new Map(findAll(sets[1], 'simpleAssociableChoice').map((c) => [c.attrs.identifier, clean(textOf(c))]));
      const pairs = correct.map((v, i) => {
        const [a, b] = v.split(/\s+/);
        return { id: String(i + 1), left: left.get(a) || '', right: right.get(b) || '' };
      }).filter((p) => p.left && p.right);
      if (pairs.length === 0) return { skip: 'توصيل من غير أزواج صحيحة' };
      content.pairs = pairs;
      return { ...base, type: 'توصيل', question: content, source, warnings };
    }
    default:
      return { skip: 'نوع التفاعل مش مدعوم' };
  }
}

function isZip(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export function parseQtiFile(fileName: string, bytes: Uint8Array): QtiParseResult {
  const result: QtiParseResult = { questions: [], skipped: [] };
  const sources: { name: string; text: string }[] = [];

  if (isZip(bytes) || /\.zip$/i.test(fileName)) {
    let entries: Record<string, Uint8Array>;
    try {
      entries = unzipSync(bytes);
    } catch {
      result.skipped.push({ source: fileName, reason: 'ملف ZIP تالف أو مش قابل للفك' });
      return result;
    }
    for (const [name, data] of Object.entries(entries)) {
      if (!/\.xml$/i.test(name) || /imsmanifest\.xml$/i.test(name)) continue;
      sources.push({ name, text: strFromU8(data) });
    }
    if (sources.length === 0) result.skipped.push({ source: fileName, reason: 'الحزمة مفيهاش ملفات أسئلة XML' });
  } else {
    sources.push({ name: fileName, text: strFromU8(bytes) });
  }

  for (const s of sources) {
    try {
      const parsed = parseQtiItem(parseXml(s.text), s.name);
      if ('skip' in parsed) result.skipped.push({ source: s.name, reason: parsed.skip });
      else result.questions.push(parsed);
    } catch (e) {
      result.skipped.push({ source: s.name, reason: e instanceof Error ? e.message : 'خطأ في قراءة الملف' });
    }
  }
  return result;
}
