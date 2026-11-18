export type NavPage =
  | 'dashboard'
  | 'tugas'
  | 'jadwal'
  | 'kalender'
  | 'catatan'
  | 'produktivitas'
  | 'todo'
  | 'pengaturan';

export type ProductivityTab = 'statistik' | 'timer' | 'ujian';

export type PriorityLevel = 'rendah' | 'sedang' | 'tinggi';

export type TaskStatus = 'belum_dikerjakan' | 'proses' | 'selesai';

export interface Task {
  id: string;
  title: string;
  subject: string;
  description: string;
  assignedDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  deadlineTime?: string; // HH:mm
  priority: PriorityLevel;
  status: TaskStatus;
  completedAt?: string; // ISO
  createdAt: string; // ISO
}

export type SchoolDay =
  | 'Senin'
  | 'Selasa'
  | 'Rabu'
  | 'Kamis'
  | 'Jumat'
  | 'Sabtu';

export interface ScheduleItem {
  id: string;
  subject: string;
  teacher?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  room?: string;
  day: SchoolDay;
  color: string;
}

export type CalendarCategory =
  | 'kegiatan_sekolah'
  | 'ujian'
  | 'tugas'
  | 'pribadi';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  category: CalendarCategory;
  description?: string;
}

export type NoteCategory =
  | 'Materi'
  | 'Ringkasan'
  | 'Rumus'
  | 'Latihan'
  | 'Lainnya';

export interface Note {
  id: string;
  title: string;
  subject: string;
  content: string;
  date: string; // YYYY-MM-DD
  category: NoteCategory;
  isPinned: boolean;
  updatedAt: string; // ISO
}

export interface Exam {
  id: string;
  name: string;
  subject: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  notes?: string;
}

export type TodoCategory =
  | 'Belajar'
  | 'Tugas'
  | 'Pribadi'
  | 'Organisasi'
  | 'Kesehatan';

export interface TodoItem {
  id: string;
  title: string;
  category: TodoCategory;
  priority: PriorityLevel;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt?: string; // ISO
}

export type PomodoroMode = 'fokus' | 'istirahat_pendek' | 'istirahat_panjang';

export interface StudySession {
  id: string;
  mode: PomodoroMode;
  durationMinutes: number;
  subject?: string;
  completedAt: string; // ISO
  date: string; // YYYY-MM-DD
}

export type AppTheme = 'sage' | 'botanical' | 'dark';

export interface PomodoroSettings {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
}

export interface AppSettings {
  nickname: string;
  theme: AppTheme;
  visualReminders: boolean;
  browserNotifications: boolean;
  timeFormat: '24h' | '12h';
  pomodoro: PomodoroSettings;
}

export interface StudySpaceData {
  tasks: Task[];
  schedules: ScheduleItem[];
  calendarEvents: CalendarEvent[];
  notes: Note[];
  exams: Exam[];
  todos: TodoItem[];
  studySessions: StudySession[];
  settings: AppSettings;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface ReminderAlert {
  id: string;
  type: 'overdue' | 'near_deadline' | 'exam' | 'agenda';
  title: string;
  subtitle: string;
  targetPage: NavPage;
  targetTab?: ProductivityTab;
  urgency: 'high' | 'medium' | 'normal';
}
