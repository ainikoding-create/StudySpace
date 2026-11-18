import type {
  AppSettings,
  CalendarEvent,
  Exam,
  Note,
  ScheduleItem,
  StudySession,
  StudySpaceData,
  Task,
  TodoItem,
} from '../types/studyspace';
import { addDaysToKey, getTodayKey } from './date';

const STORAGE_KEY = 'studyspace_data_v1';
const INITIALIZED_KEY = 'studyspace_initialized_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  nickname: 'Pelajar',
  theme: 'sage',
  visualReminders: true,
  browserNotifications: false,
  timeFormat: '24h',
  pomodoro: {
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
  },
};

export const EMPTY_DATA: StudySpaceData = {
  tasks: [],
  schedules: [],
  calendarEvents: [],
  notes: [],
  exams: [],
  todos: [],
  studySessions: [],
  settings: DEFAULT_SETTINGS,
};

export function generateId(prefix = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function createInitialStarterData(): StudySpaceData {
  const today = getTodayKey();
  const yesterday = addDaysToKey(today, -1);
  const twoDaysAgo = addDaysToKey(today, -2);
  const tomorrow = addDaysToKey(today, 1);
  const inThreeDays = addDaysToKey(today, 3);
  const inFiveDays = addDaysToKey(today, 5);
  const inNineDays = addDaysToKey(today, 9);
  const nowIso = new Date().toISOString();

  const tasks: Task[] = [
    {
      id: 't_1',
      title: 'Latihan Soal Turunan Fungsi Trigonometri',
      subject: 'Matematika Peminatan',
      description: 'Kerjakan soal nomor 1 sampai 15 dari buku paket halaman 114 beserta langkah penyelesaiannya.',
      assignedDate: twoDaysAgo,
      deadline: tomorrow,
      deadlineTime: '23:59',
      priority: 'tinggi',
      status: 'proses',
      createdAt: nowIso,
    },
    {
      id: 't_2',
      title: 'Laporan Praktikum Hukum Hooke',
      subject: 'Fisika',
      description: 'Lengkapi tabel pengukuran pegas, grafik gaya terhadap pertambahan panjang, dan kesimpulan.',
      assignedDate: yesterday,
      deadline: inThreeDays,
      deadlineTime: '14:00',
      priority: 'sedang',
      status: 'belum_dikerjakan',
      createdAt: nowIso,
    },
    {
      id: 't_3',
      title: 'Esai Analisis Teks Editorial',
      subject: 'Bahasa Indonesia',
      description: 'Analisis struktur argumentasi dan kaidah kebahasaan dari artikel opini bertema lingkungan.',
      assignedDate: twoDaysAgo,
      deadline: yesterday,
      deadlineTime: '17:00',
      priority: 'tinggi',
      status: 'belum_dikerjakan',
      createdAt: nowIso,
    },
    {
      id: 't_4',
      title: 'Ringkasan Sistem Ekskresi Manusia',
      subject: 'Biologi',
      description: 'Buat peta konsep organ ginjal, hati, paru-paru, dan kulit beserta mekanismenya.',
      assignedDate: addDaysToKey(today, -4),
      deadline: today,
      deadlineTime: '20:00',
      priority: 'rendah',
      status: 'selesai',
      completedAt: nowIso,
      createdAt: nowIso,
    },
  ];

  const schedules: ScheduleItem[] = [
    {
      id: 'sch_1',
      subject: 'Matematika Peminatan',
      teacher: 'Ibu Ratna Sari, M.Pd',
      startTime: '07:00',
      endTime: '08:30',
      room: 'Ruang XII-A',
      day: 'Senin',
      color: '#5C7A63',
    },
    {
      id: 'sch_2',
      subject: 'Bahasa Indonesia',
      teacher: 'Bapak Hendra Wijaya',
      startTime: '08:45',
      endTime: '10:15',
      room: 'Ruang XII-A',
      day: 'Senin',
      color: '#A3B18A',
    },
    {
      id: 'sch_3',
      subject: 'Fisika',
      teacher: 'Bapak Dimas Pratama',
      startTime: '07:00',
      endTime: '08:30',
      room: 'Lab Fisika',
      day: 'Selasa',
      color: '#4E6E5D',
    },
    {
      id: 'sch_4',
      subject: 'Bahasa Inggris',
      teacher: 'Ms. Nadia Putri',
      startTime: '09:00',
      endTime: '10:30',
      room: 'Lab Bahasa',
      day: 'Selasa',
      color: '#7B9071',
    },
    {
      id: 'sch_5',
      subject: 'Biologi',
      teacher: 'Ibu Sekar Melati',
      startTime: '07:30',
      endTime: '09:00',
      room: 'Lab Biologi',
      day: 'Rabu',
      color: '#6B8E6E',
    },
    {
      id: 'sch_6',
      subject: 'Kimia',
      teacher: 'Bapak Arif Nugroho',
      startTime: '09:30',
      endTime: '11:00',
      room: 'Lab Kimia',
      day: 'Kamis',
      color: '#889E73',
    },
    {
      id: 'sch_7',
      subject: 'Sejarah Indonesia',
      teacher: 'Ibu Kartika Dewi',
      startTime: '07:00',
      endTime: '08:30',
      room: 'Ruang XII-A',
      day: 'Jumat',
      color: '#958C6B',
    },
    {
      id: 'sch_8',
      subject: 'Informatika',
      teacher: 'Bapak Rian Santoso',
      startTime: '08:00',
      endTime: '09:30',
      room: 'Lab Komputer',
      day: 'Sabtu',
      color: '#344E41',
    },
  ];

  const calendarEvents: CalendarEvent[] = [
    {
      id: 'cal_1',
      title: 'Rapat Persiapan Pentas Seni Sekolah',
      date: inThreeDays,
      time: '15:00',
      category: 'kegiatan_sekolah',
      description: 'Koordinasi divisi acara dan dekorasi di aula utama.',
    },
    {
      id: 'cal_2',
      title: 'Bimbingan Belajar Kelompok',
      date: today,
      time: '16:00',
      category: 'pribadi',
      description: 'Review soal latihan Fisika dan Matematika bersama teman sekelas.',
    },
  ];

  const notes: Note[] = [
    {
      id: 'n_1',
      title: 'Rumus Turunan Fungsi Trigonometri',
      subject: 'Matematika Peminatan',
      category: 'Rumus',
      date: today,
      isPinned: true,
      updatedAt: nowIso,
      content: `Turunan dasar fungsi trigonometri:
• d/dx (sin x) = cos x
• d/dx (cos x) = -sin x
• d/dx (tan x) = sec² x
• d/dx (cot x) = -csc² x

Aturan Rantai:
Jika y = sin(u), maka y' = cos(u) · u'
Contoh: f(x) = sin(3x² + 1) → f'(x) = 6x · cos(3x² + 1).`,
    },
    {
      id: 'n_2',
      title: 'Konsep Elastisitas & Hukum Hooke',
      subject: 'Fisika',
      category: 'Materi',
      date: yesterday,
      isPinned: false,
      updatedAt: nowIso,
      content: `Hukum Hooke menyatakan bahwa pada daerah elastis, gaya pemulih sebanding dengan pertambahan panjang pegas:
F = k · Δx

Keterangan:
• F = Gaya (Newton)
• k = Konstanta pegas (N/m)
• Δx = Pertambahan panjang (m)

Susunan pegas seri: 1/ks = 1/k1 + 1/k2
Susunan pegas paralel: kp = k1 + k2`,
    },
  ];

  const exams: Exam[] = [
    {
      id: 'ex_1',
      name: 'Ulangan Harian Kalkulus',
      subject: 'Matematika Peminatan',
      date: inFiveDays,
      time: '07:30',
      notes: 'Fokus pelajari aturan rantai, turunan trigonometri, dan aplikasi nilai maksimum-minimum.',
    },
    {
      id: 'ex_2',
      name: 'Penilaian Tengah Semester Fisika',
      subject: 'Fisika',
      date: inNineDays,
      time: '09:00',
      notes: 'Ulangi materi elastisitas, fluida statis, dan kerjakan ulang soal kuis sebelumnya.',
    },
  ];

  const todos: TodoItem[] = [
    {
      id: 'td_1',
      title: 'Review catatan rumus turunan selama 20 menit',
      category: 'Belajar',
      priority: 'tinggi',
      date: today,
      completed: true,
      completedAt: nowIso,
    },
    {
      id: 'td_2',
      title: 'Selesaikan 5 soal esai Bahasa Indonesia',
      category: 'Tugas',
      priority: 'tinggi',
      date: today,
      completed: false,
    },
    {
      id: 'td_3',
      title: 'Rapikan meja belajar & siapkan buku besok',
      category: 'Pribadi',
      priority: 'rendah',
      date: today,
      completed: false,
    },
  ];

  const studySessions: StudySession[] = [
    {
      id: 'ss_1',
      mode: 'fokus',
      durationMinutes: 25,
      subject: 'Matematika Peminatan',
      completedAt: new Date(Date.now() - 86400000).toISOString(),
      date: yesterday,
    },
    {
      id: 'ss_2',
      mode: 'fokus',
      durationMinutes: 25,
      subject: 'Fisika',
      completedAt: nowIso,
      date: today,
    },
  ];

  return {
    tasks,
    schedules,
    calendarEvents,
    notes,
    exams,
    todos,
    studySessions,
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function loadStudySpaceData(): StudySpaceData {
  try {
    const initialized = localStorage.getItem(INITIALIZED_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!initialized && !raw) {
      const starter = createInitialStarterData();
      localStorage.setItem(INITIALIZED_KEY, 'true');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(starter));
      return starter;
    }

    if (!raw) {
      return { ...EMPTY_DATA, settings: { ...DEFAULT_SETTINGS } };
    }

    const parsed = JSON.parse(raw);
    return sanitizeStudySpaceData(parsed);
  } catch {
    return { ...EMPTY_DATA, settings: { ...DEFAULT_SETTINGS } };
  }
}

export function saveStudySpaceData(data: StudySpaceData): void {
  try {
    localStorage.setItem(INITIALIZED_KEY, 'true');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Gagal menyimpan data ke LocalStorage:', err);
  }
}

export function clearAllStudySpaceData(): StudySpaceData {
  const fresh: StudySpaceData = {
    tasks: [],
    schedules: [],
    calendarEvents: [],
    notes: [],
    exams: [],
    todos: [],
    studySessions: [],
    settings: { ...DEFAULT_SETTINGS },
  };
  saveStudySpaceData(fresh);
  return fresh;
}

export function sanitizeStudySpaceData(input: unknown): StudySpaceData {
  if (!input || typeof input !== 'object') {
    throw new Error('Format file JSON tidak valid.');
  }
  const obj = input as Record<string, unknown>;

  const tasks = Array.isArray(obj.tasks) ? (obj.tasks as Task[]) : [];
  const schedules = Array.isArray(obj.schedules) ? (obj.schedules as ScheduleItem[]) : [];
  const calendarEvents = Array.isArray(obj.calendarEvents) ? (obj.calendarEvents as CalendarEvent[]) : [];
  const notes = Array.isArray(obj.notes) ? (obj.notes as Note[]) : [];
  const exams = Array.isArray(obj.exams) ? (obj.exams as Exam[]) : [];
  const todos = Array.isArray(obj.todos) ? (obj.todos as TodoItem[]) : [];
  const studySessions = Array.isArray(obj.studySessions) ? (obj.studySessions as StudySession[]) : [];

  const rawSettings = (obj.settings && typeof obj.settings === 'object'
    ? obj.settings
    : {}) as Partial<AppSettings>;

  const settings: AppSettings = {
    nickname: typeof rawSettings.nickname === 'string' && rawSettings.nickname.trim()
      ? rawSettings.nickname.trim()
      : DEFAULT_SETTINGS.nickname,
    theme:
      rawSettings.theme === 'sage' ||
      rawSettings.theme === 'botanical' ||
      rawSettings.theme === 'dark'
        ? rawSettings.theme
        : DEFAULT_SETTINGS.theme,
    visualReminders:
      typeof rawSettings.visualReminders === 'boolean'
        ? rawSettings.visualReminders
        : DEFAULT_SETTINGS.visualReminders,
    browserNotifications:
      typeof rawSettings.browserNotifications === 'boolean'
        ? rawSettings.browserNotifications
        : DEFAULT_SETTINGS.browserNotifications,
    timeFormat:
      rawSettings.timeFormat === '12h' || rawSettings.timeFormat === '24h'
        ? rawSettings.timeFormat
        : DEFAULT_SETTINGS.timeFormat,
    pomodoro: {
      focusMinutes:
        typeof rawSettings.pomodoro?.focusMinutes === 'number' &&
        rawSettings.pomodoro.focusMinutes >= 1 &&
        rawSettings.pomodoro.focusMinutes <= 180
          ? rawSettings.pomodoro.focusMinutes
          : DEFAULT_SETTINGS.pomodoro.focusMinutes,
      shortBreakMinutes:
        typeof rawSettings.pomodoro?.shortBreakMinutes === 'number' &&
        rawSettings.pomodoro.shortBreakMinutes >= 1 &&
        rawSettings.pomodoro.shortBreakMinutes <= 60
          ? rawSettings.pomodoro.shortBreakMinutes
          : DEFAULT_SETTINGS.pomodoro.shortBreakMinutes,
      longBreakMinutes:
        typeof rawSettings.pomodoro?.longBreakMinutes === 'number' &&
        rawSettings.pomodoro.longBreakMinutes >= 1 &&
        rawSettings.pomodoro.longBreakMinutes <= 90
          ? rawSettings.pomodoro.longBreakMinutes
          : DEFAULT_SETTINGS.pomodoro.longBreakMinutes,
    },
  };

  return {
    tasks,
    schedules,
    calendarEvents,
    notes,
    exams,
    todos,
    studySessions,
    settings,
  };
}

export function validateImportedJson(input: unknown): { valid: true; data: StudySpaceData } | { valid: false; error: string } {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { valid: false, error: 'File JSON harus berupa objek StudySpace yang valid.' };
  }

  const obj = input as Record<string, unknown>;
  const requiredArrays = ['tasks', 'schedules', 'calendarEvents', 'notes', 'exams', 'todos'];
  const hasAnyValidKey = requiredArrays.some((key) => Array.isArray(obj[key]));

  if (!hasAnyValidKey) {
    return {
      valid: false,
      error: 'Struktur data tidak dikenali. Pastikan file berasal dari ekspor StudySpace.',
    };
  }

  for (const key of requiredArrays) {
    if (key in obj && !Array.isArray(obj[key])) {
      return { valid: false, error: `Kolom "${key}" harus berupa daftar (array).` };
    }
  }

  if (Array.isArray(obj.tasks)) {
    for (const t of obj.tasks) {
      if (!t || typeof t !== 'object' || typeof (t as Task).title !== 'string' || typeof (t as Task).deadline !== 'string') {
        return { valid: false, error: 'Data tugas pada file impor tidak lengkap atau rusak.' };
      }
    }
  }

  if (Array.isArray(obj.schedules)) {
    for (const s of obj.schedules) {
      if (!s || typeof s !== 'object' || typeof (s as ScheduleItem).subject !== 'string' || typeof (s as ScheduleItem).day !== 'string') {
        return { valid: false, error: 'Data jadwal pada file impor tidak lengkap atau rusak.' };
      }
    }
  }

  if (Array.isArray(obj.notes)) {
    for (const n of obj.notes) {
      if (!n || typeof n !== 'object' || typeof (n as Note).title !== 'string') {
        return { valid: false, error: 'Data catatan pada file impor tidak lengkap atau rusak.' };
      }
    }
  }

  if (Array.isArray(obj.exams)) {
    for (const e of obj.exams) {
      if (!e || typeof e !== 'object' || typeof (e as Exam).name !== 'string' || typeof (e as Exam).date !== 'string') {
        return { valid: false, error: 'Data ujian pada file impor tidak lengkap atau rusak.' };
      }
    }
  }

  if (Array.isArray(obj.todos)) {
    for (const td of obj.todos) {
      if (!td || typeof td !== 'object' || typeof (td as TodoItem).title !== 'string') {
        return { valid: false, error: 'Data to-do pada file impor tidak lengkap atau rusak.' };
      }
    }
  }

  return { valid: true, data: sanitizeStudySpaceData(obj) };
}
