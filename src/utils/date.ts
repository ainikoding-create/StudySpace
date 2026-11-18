import type { SchoolDay } from '../types/studyspace';

export const INDONESIAN_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const;

export const SCHOOL_DAYS: SchoolDay[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export const INDONESIAN_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayKey(): string {
  return toLocalDateKey(new Date());
}

export function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(y, (m || 1) - 1, (d || 1) + days);
  return toLocalDateKey(dt);
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatIndonesianDate(
  dateInput: string | Date,
  options: { withWeekday?: boolean; shortMonth?: boolean } = {}
): string {
  const date = typeof dateInput === 'string' ? parseDateKey(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) return '-';
  const weekday = INDONESIAN_DAYS[date.getDay()];
  const day = date.getDate();
  const month = options.shortMonth
    ? INDONESIAN_MONTHS_SHORT[date.getMonth()]
    : INDONESIAN_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return options.withWeekday
    ? `${weekday}, ${day} ${month} ${year}`
    : `${day} ${month} ${year}`;
}

export function formatTimeDisplay(
  timeStr: string | undefined,
  format: '12h' | '24h'
): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return timeStr;
  const mm = String(m).padStart(2, '0');
  if (format === '24h') {
    return `${String(h).padStart(2, '0')}:${mm}`;
  }
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${period}`;
}

export function formatLiveClock(date: Date, format: '12h' | '24h'): string {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  if (format === '24h') {
    return `${String(h).padStart(2, '0')}:${m}:${s}`;
  }
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${m}:${s} ${period}`;
}

export function getGreeting(hour: number): string {
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

export function getCurrentSchoolDay(date = new Date()): SchoolDay | null {
  const dayIndex = date.getDay(); // 0 = Minggu, 1 = Senin ... 6 = Sabtu
  if (dayIndex === 0) return null;
  return SCHOOL_DAYS[dayIndex - 1] ?? null;
}

export function getDaysDiffFromToday(dateKey: string): number {
  const today = parseDateKey(getTodayKey());
  const target = parseDateKey(dateKey);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getDeadlineBadgeText(deadlineKey: string): string {
  const diff = getDaysDiffFromToday(deadlineKey);
  if (diff < 0) return `Terlambat ${Math.abs(diff)} hari`;
  if (diff === 0) return 'Deadline hari ini';
  if (diff === 1) return 'Deadline besok';
  if (diff <= 3) return `${diff} hari lagi`;
  return formatIndonesianDate(deadlineKey, { shortMonth: true });
}

export function getExamTargetTimestamp(dateKey: string, timeStr?: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [hh, mm] = (timeStr || '08:00').split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0).getTime();
}

export function getCountdownParts(targetMs: number, nowMs: number) {
  const diff = Math.max(0, targetMs - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    isPast: targetMs <= nowMs,
    days,
    hours,
    minutes,
    seconds,
  };
}

export function getWeekDateKeys(referenceDate: Date): string[] {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  const keys: string[] = [];
  for (let i = 0; i < 7; i++) {
    const item = new Date(d);
    item.setDate(d.getDate() + i);
    keys.push(toLocalDateKey(item));
  }
  return keys;
}

export function getMonthGridDays(year: number, month: number): { dateKey: string; inMonth: boolean; dayNumber: number }[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday start
  const cells: { dateKey: string; inMonth: boolean; dayNumber: number }[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const dt = new Date(year, month, -i);
    cells.push({
      dateKey: toLocalDateKey(dt),
      inMonth: false,
      dayNumber: dt.getDate(),
    });
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dt = new Date(year, month, day);
    cells.push({
      dateKey: toLocalDateKey(dt),
      inMonth: true,
      dayNumber: day,
    });
  }

  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const dt = new Date(year, month + 1, i);
    cells.push({
      dateKey: toLocalDateKey(dt),
      inMonth: false,
      dayNumber: dt.getDate(),
    });
  }

  return cells;
}
