import { supabase } from '@/lib/supabaseClient';
import { getMyClassSections, getPeriods } from './attendanceData';
import { getLiveSessions } from './liveSessionsData';
import { getUpcomingSchoolEvents } from './classSpaceData';

// نفس ترتيب أيام الأسبوع بالعربي المستخدم فعليًا وقت إنشاء الحصص في Talia 360 (index = getDay() في JS: 0 الأحد ... 6 السبت)
const WEEK_DAY_MAP_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export interface CalendarEvent {
  id: string;
  title: string;
  className: string;
  type: 'standard' | 'live' | 'event';
  date: string; // ISO date (YYYY-MM-DD)
  time?: string; // HH:MM لو متاح، لعرض يوم واحد بالتفصيل
}

// بيجيب كل الأحداث الحقيقية (حصص أسبوعية متكررة + حصص مباشرة + فعاليات المدرسة) اللي بتقع في شهر معيّن، لكل فصول المعلم
export async function getCalendarEvents(teacherId: string, subjects: string[], year: number, month: number): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  const sections = await getMyClassSections(teacherId);

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // الحصص الدراسية الأسبوعية المتكررة الحقيقية — بنطابق اسم اليوم بالعربي مع كل يوم فعلي في الشهر المعروض
  for (const sec of sections) {
    const periods = await getPeriods(sec.id);
    if (periods.length === 0) continue;
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(year, month, day);
      const arabicDayName = WEEK_DAY_MAP_AR[cellDate.getDay()];
      periods.filter((p) => p.day === arabicDayName).forEach((p) => {
        events.push({
          id: `period-${p.id}-${day}`,
          title: p.subject,
          className: sec.name,
          type: 'standard',
          date: cellDate.toISOString().slice(0, 10),
          time: p.startTime,
        });
      });
    }
  }

  // الحصص المباشرة الحقيقية لكل فصل ومادة
  for (const sec of sections) {
    for (const subject of subjects) {
      const sessions = await getLiveSessions(sec.id, subject);
      sessions.forEach((s) => {
        const d = new Date(s.scheduledAt);
        if (d.getFullYear() === year && d.getMonth() === month) {
          events.push({ id: `live-${s.id}`, title: s.title, className: sec.name, type: 'live', date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) });
        }
      });
    }
  }

  // فعاليات المدرسة الحقيقية المنشورة (مش محددة بفصل معيّن)
  const schoolEvents = await getUpcomingSchoolEvents(50);
  schoolEvents.forEach((ev) => {
    const d = new Date(ev.eventDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      events.push({ id: `event-${ev.id}`, title: ev.title, className: 'All', type: 'event', date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) });
    }
  });

  return events;
}

export interface TermRange {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
}

// بيجيب الترم النشط حاليًا (أو أول ترم موجود لو مفيش واحد نشط)
export async function getActiveTermRange(): Promise<TermRange | null> {
  const { data, error } = await supabase.from('grading_terms').select('id, name, start_date, end_date, status').order('created_at', { ascending: true });
  if (error || !data || data.length === 0) return null;
  const active = data.find((t: any) => t.status === 'Active') || data[0];
  return { id: active.id, name: active.name, startDate: active.start_date, endDate: active.end_date };
}

// بيجيب كل الأحداث الحقيقية (حصص مباشرة + فعاليات مدرسة) في مدى تاريخ معيّن (مفيد لعرض الترم كله)
export async function getEventsInRange(teacherId: string, subjects: string[], startDate: string, endDate: string): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];
  const sections = await getMyClassSections(teacherId);
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (const sec of sections) {
    for (const subject of subjects) {
      const sessions = await getLiveSessions(sec.id, subject);
      sessions.forEach((s) => {
        const d = new Date(s.scheduledAt);
        if (d >= start && d <= end) {
          events.push({ id: `live-${s.id}`, title: s.title, className: sec.name, type: 'live', date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) });
        }
      });
    }
  }

  const schoolEvents = await getUpcomingSchoolEvents(100);
  schoolEvents.forEach((ev) => {
    const d = new Date(ev.eventDate);
    if (d >= start && d <= end) {
      events.push({ id: `event-${ev.id}`, title: ev.title, className: 'All', type: 'event', date: d.toISOString().slice(0, 10), time: d.toTimeString().slice(0, 5) });
    }
  });

  return events.sort((a, b) => a.date.localeCompare(b.date));
}
