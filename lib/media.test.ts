import { describe, it, expect } from 'vitest';
import { parseVideoUrl, parseTime, formatTime, pickRecorderMime, videoFromSpec } from './media';

describe('parseVideoUrl', () => {
  it('يوتيوب بكل صيغه بيتحول لـ nocookie embed', () => {
    for (const u of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ?t=5',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=x',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    ]) {
      const r = parseVideoUrl(u);
      expect(r?.kind).toBe('youtube');
      expect(r?.src).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');
    }
  });
  it('بداية ونهاية', () => {
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ', 30, 90)?.src).toContain('start=30&end=90');
    // النهاية قبل البداية بتتتجاهل
    expect(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ', 90, 30)?.src).not.toContain('end=');
  });
  it('فيميو', () => {
    expect(parseVideoUrl('https://vimeo.com/123456789', 12)).toEqual({ kind: 'vimeo', src: 'https://player.vimeo.com/video/123456789#t=12s' });
    expect(parseVideoUrl('https://vimeo.com/channels/staff')).toBeNull();
  });
  it('ملف مباشر مع media fragment', () => {
    expect(parseVideoUrl('https://cdn.test/v.mp4', 5, 20)).toEqual({ kind: 'file', src: 'https://cdn.test/v.mp4#t=5,20' });
    expect(parseVideoUrl('https://cdn.test/v.webm')?.kind).toBe('file');
  });
  it('بيرفض الخطر والغلط', () => {
    for (const u of ['javascript:alert(1)', 'data:video/mp4;base64,AAA', 'ftp://x.test/a.mp4', 'https://evil.test/page', 'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ', 'not a url', '']) {
      expect(parseVideoUrl(u)).toBeNull();
    }
  });
  it('videoFromSpec', () => {
    expect(videoFromSpec({})).toBeNull();
    expect(videoFromSpec({ videoUrl: 'https://cdn.test/v.mp4', videoStart: 3 })?.src).toBe('https://cdn.test/v.mp4#t=3');
  });
});

describe('الوقت', () => {
  it('parseTime', () => {
    expect(parseTime('1:30')).toBe(90);
    expect(parseTime('1:02:03')).toBe(3723);
    expect(parseTime('45')).toBe(45);
    expect(parseTime('')).toBeUndefined();
    expect(parseTime('1:x')).toBeUndefined();
    expect(parseTime('-5')).toBeUndefined();
    expect(parseTime(12.7)).toBe(12);
  });
  it('formatTime', () => {
    expect(formatTime(90)).toBe('1:30');
    expect(formatTime(3723)).toBe('1:02:03');
    expect(formatTime(undefined)).toBe('');
  });
});

describe('pickRecorderMime', () => {
  it('بيختار أول صيغة مدعومة', () => {
    expect(pickRecorderMime((m) => m === 'audio/mp4')).toEqual({ mime: 'audio/mp4', ext: 'm4a' });
    expect(pickRecorderMime(() => true).ext).toBe('webm');
    expect(pickRecorderMime(() => false).mime).toBe('');
  });
});
