/** روابط الفيديو في السؤال: يوتيوب / فيميو / ملف مباشر. أي حاجة تانية بتترفض (مفيش javascript: ولا data:) */

export type VideoKind = 'youtube' | 'vimeo' | 'file';
export interface ParsedVideo {
  kind: VideoKind;
  /** الرابط اللي بيتحط في iframe أو <video src> */
  src: string;
}

export interface VideoSpec {
  videoUrl?: string;
  videoStart?: number;
  videoEnd?: number;
}

const FILE_RE = /\.(mp4|webm|ogv|ogg|mov|m4v)(\?.*)?(#.*)?$/i;

export function isHttpUrl(u: string): boolean {
  try {
    const url = new URL(u.trim());
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** "1:30" أو "90" أو "1:02:03" → ثواني. فاضي/غلط → undefined */
export function parseTime(v: string | number | undefined | null): number | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined;
  const parts = v.trim().split(':');
  if (parts.length > 3 || parts.some((p) => !/^\d{1,5}$/.test(p))) return undefined;
  return parts.reduce((acc, p) => acc * 60 + Number(p), 0);
}

export function formatTime(sec: number | undefined): string {
  if (sec === undefined || !Number.isFinite(sec)) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function youtubeId(u: URL): string | null {
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.split('/')[1] || null;
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const m = /^\/(embed|shorts|live|v)\/([^/?]+)/.exec(u.pathname);
      if (m) id = m[2];
    }
  }
  return id && /^[A-Za-z0-9_-]{6,15}$/.test(id) ? id : null;
}

export function parseVideoUrl(raw: string, start?: number, end?: number): ParsedVideo | null {
  if (!raw || !isHttpUrl(raw)) return null;
  const u = new URL(raw.trim());
  const s = start && start > 0 ? Math.floor(start) : undefined;
  const e = end && end > 0 && (!s || end > s) ? Math.floor(end) : undefined;

  const yt = youtubeId(u);
  if (yt) {
    const q = new URLSearchParams({ rel: '0' });
    if (s !== undefined) q.set('start', String(s));
    if (e !== undefined) q.set('end', String(e));
    return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${yt}?${q.toString()}` };
  }
  const host = u.hostname.replace(/^www\./, '');
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = /\/(?:video\/)?(\d{5,12})(?:\/|$)/.exec(u.pathname);
    if (m) return { kind: 'vimeo', src: `https://player.vimeo.com/video/${m[1]}${s !== undefined ? `#t=${s}s` : ''}` };
    return null;
  }
  if (FILE_RE.test(u.pathname + u.search)) {
    const base = raw.trim().split('#')[0];
    const frag = s !== undefined || e !== undefined ? `#t=${s ?? 0}${e !== undefined ? `,${e}` : ''}` : '';
    return { kind: 'file', src: base + frag };
  }
  return null;
}

export function videoFromSpec(spec: VideoSpec): ParsedVideo | null {
  return spec.videoUrl ? parseVideoUrl(spec.videoUrl, spec.videoStart, spec.videoEnd) : null;
}

/** تسجيل صوتي: أنسب صيغة يدعمها المتصفح */
export function pickRecorderMime(isSupported: (m: string) => boolean): { mime: string; ext: string } {
  const candidates: [string, string][] = [
    ['audio/webm;codecs=opus', 'webm'],
    ['audio/webm', 'webm'],
    ['audio/mp4', 'm4a'],
    ['audio/ogg;codecs=opus', 'ogg'],
  ];
  for (const [mime, ext] of candidates) if (isSupported(mime)) return { mime, ext };
  return { mime: '', ext: 'webm' };
}
