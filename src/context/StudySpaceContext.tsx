import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {
  AppSettings,
  CalendarEvent,
  Exam,
  NavPage,
  Note,
  PomodoroMode,
  ProductivityTab,
  ReminderAlert,
  ScheduleItem,
  StudySession,
  StudySpaceData,
  Task,
  TaskStatus,
  ToastMessage,
  TodoItem,
} from '../types/studyspace';
import {
  formatIndonesianDate,
  formatTimeDisplay,
  getDaysDiffFromToday,
  getTodayKey,
} from '../utils/date';
import {
  clearAllStudySpaceData,
  generateId,
  loadStudySpaceData,
  saveStudySpaceData,
  validateImportedJson,
} from '../utils/storage';

const TIMER_STORAGE_KEY = 'studyspace_timer_state_v1';

interface PersistedTimerState {
  mode: PomodoroMode;
  status: 'idle' | 'running' | 'paused';
  remainingSeconds: number;
  endTimeMs: number | null;
  subject: string;
}

interface StudySpaceContextValue {
  data: StudySpaceData;
  activePage: NavPage;
  setActivePage: (page: NavPage) => void;
  productivityTab: ProductivityTab;
  setProductivityTab: (tab: ProductivityTab) => void;
  quickCreateTaskOpen: boolean;
  setQuickCreateTaskOpen: (open: boolean) => void;
  quickCreateNoteTrigger: number;
  triggerQuickCreateNote: () => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  dismissToast: (id: string) => void;

  // Reminders
  reminders: ReminderAlert[];
  sendBrowserNotification: (title: string, body: string) => void;

  // Tasks CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string, nextStatus?: TaskStatus) => void;

  // Schedule CRUD
  addSchedule: (item: Omit<ScheduleItem, 'id'>) => void;
  updateSchedule: (id: string, patch: Partial<ScheduleItem>) => void;
  deleteSchedule: (id: string) => void;

  // Calendar CRUD
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, patch: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Notes CRUD (supports autosave)
  addNote: (note: Omit<Note, 'id' | 'updatedAt'>) => Note;
  updateNote: (id: string, patch: Partial<Note>, silent?: boolean) => void;
  deleteNote: (id: string) => void;

  // Exams CRUD
  addExam: (exam: Omit<Exam, 'id'>) => void;
  updateExam: (id: string, patch: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  // Todos CRUD
  addTodo: (todo: Omit<TodoItem, 'id'>) => void;
  updateTodo: (id: string, patch: Partial<TodoItem>) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;

  // Settings & Data Management
  updateSettings: (patch: Partial<AppSettings>, silent?: boolean) => void;
  exportDataJson: () => void;
  importDataJson: (rawText: string) => boolean;
  clearAllData: () => void;

  // Pomodoro Timer
  timerMode: PomodoroMode;
  timerStatus: 'idle' | 'running' | 'paused';
  timerRemainingSeconds: number;
  timerTotalSeconds: number;
  timerSubject: string;
  setTimerSubject: (subject: string) => void;
  switchTimerMode: (mode: PomodoroMode) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
}

const StudySpaceContext = createContext<StudySpaceContextValue | null>(null);

function playGentleChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.14 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.14 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.14);
      osc.stop(ctx.currentTime + idx * 0.14 + 0.5);
    });
  } catch {
    // Ignore audio context errors when autoplay policy restricts
  }
}

export const StudySpaceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<StudySpaceData>(() => loadStudySpaceData());
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [productivityTab, setProductivityTab] = useState<ProductivityTab>('statistik');
  const [quickCreateTaskOpen, setQuickCreateTaskOpen] = useState(false);
  const [quickCreateNoteTrigger, setQuickCreateNoteTrigger] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastMessage['type'] = 'success') => {
      const id = generateId('toast');
      setToasts((prev) => [...prev.slice(-3), { id, type, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3600);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Persist StudySpace data whenever it changes
  useEffect(() => {
    saveStudySpaceData(data);
  }, [data]);

  // Apply theme classes cleanly on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-botanical');
    if (data.settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (data.settings.theme === 'botanical') {
      root.classList.add('theme-botanical');
    }
  }, [data.settings.theme]);

  const sendBrowserNotification = useCallback(
    (title: string, body: string) => {
      if (!data.settings.browserNotifications) return;
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, { body });
        } catch {
          // Ignore unsupported browser notification errors
        }
      }
    },
    [data.settings.browserNotifications]
  );

  // Trigger quick note creation from Dashboard
  const triggerQuickCreateNote = useCallback(() => {
    setActivePage('catatan');
    setQuickCreateNoteTrigger((n) => n + 1);
  }, []);

  // Pomodoro helpers
  const getModeDurationSeconds = useCallback(
    (mode: PomodoroMode, settings = data.settings) => {
      if (mode === 'fokus') return settings.pomodoro.focusMinutes * 60;
      if (mode === 'istirahat_pendek') return settings.pomodoro.shortBreakMinutes * 60;
      return settings.pomodoro.longBreakMinutes * 60;
    },
    [data.settings]
  );

  const [timerState, setTimerState] = useState<PersistedTimerState>(() => {
    try {
      const saved = localStorage.getItem(TIMER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PersistedTimerState;
        if (parsed.status === 'running' && parsed.endTimeMs) {
          const remaining = Math.max(0, Math.ceil((parsed.endTimeMs - Date.now()) / 1000));
          return {
            ...parsed,
            remainingSeconds: remaining,
          };
        }
        return parsed;
      }
    } catch {
      // ignore
    }
    return {
      mode: 'fokus',
      status: 'idle',
      remainingSeconds: data.settings.pomodoro.focusMinutes * 60,
      endTimeMs: null,
      subject: '',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(timerState));
    } catch {
      // ignore
    }
  }, [timerState]);

  const completedSessionLockRef = useRef(false);

  const completePomodoroSession = useCallback(
    (mode: PomodoroMode, subject: string) => {
      if (completedSessionLockRef.current) return;
      completedSessionLockRef.current = true;

      const durationMinutes =
        mode === 'fokus'
          ? data.settings.pomodoro.focusMinutes
          : mode === 'istirahat_pendek'
          ? data.settings.pomodoro.shortBreakMinutes
          : data.settings.pomodoro.longBreakMinutes;

      const session: StudySession = {
        id: generateId('ses'),
        mode,
        durationMinutes,
        subject: subject.trim() || undefined,
        completedAt: new Date().toISOString(),
        date: getTodayKey(),
      };

      setData((prev) => ({
        ...prev,
        studySessions: [session, ...prev.studySessions],
      }));

      playGentleChime();
      const label =
        mode === 'fokus'
          ? 'Sesi Fokus Selesai!'
          : mode === 'istirahat_pendek'
          ? 'Istirahat Singkat Selesai!'
          : 'Istirahat Panjang Selesai!';

      showToast(
        `${label} (${durationMinutes} menit tercatat di riwayat).`,
        'success'
      );
      sendBrowserNotification(
        `StudySpace — ${label}`,
        mode === 'fokus'
          ? `Kamu baru saja fokus selama ${durationMinutes} menit. Waktunya istirahat sejenak.`
          : `Waktu istirahat ${durationMinutes} menit selesai. Siap lanjut belajar!`
      );

      const nextDuration = getModeDurationSeconds(mode);
      setTimerState((prev) => ({
        ...prev,
        status: 'idle',
        endTimeMs: null,
        remainingSeconds: nextDuration,
      }));

      window.setTimeout(() => {
        completedSessionLockRef.current = false;
      }, 500);
    },
    [data.settings.pomodoro, getModeDurationSeconds, sendBrowserNotification, showToast]
  );

  // Accurate timestamp-based tick + visibilitychange sync
  useEffect(() => {
    if (timerState.status !== 'running' || !timerState.endTimeMs) return;

    const syncRemaining = () => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.ceil((timerState.endTimeMs! - now) / 1000));
      if (diffSec <= 0) {
        completePomodoroSession(timerState.mode, timerState.subject);
      } else {
        setTimerState((prev) =>
          prev.remainingSeconds !== diffSec
            ? { ...prev, remainingSeconds: diffSec }
            : prev
        );
      }
    };

    syncRemaining();
    const interval = window.setInterval(syncRemaining, 500);
    const onVisibility = () => {
      if (!document.hidden) syncRemaining();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [
    timerState.status,
    timerState.endTimeMs,
    timerState.mode,
    timerState.subject,
    completePomodoroSession,
  ]);

  const switchTimerMode = useCallback(
    (mode: PomodoroMode) => {
      const secs = getModeDurationSeconds(mode);
      setTimerState((prev) => ({
        ...prev,
        mode,
        status: 'idle',
        endTimeMs: null,
        remainingSeconds: secs,
      }));
    },
    [getModeDurationSeconds]
  );

  const startTimer = useCallback(() => {
    setTimerState((prev) => {
      const secs =
        prev.remainingSeconds > 0
          ? prev.remainingSeconds
          : getModeDurationSeconds(prev.mode);
      return {
        ...prev,
        status: 'running',
        remainingSeconds: secs,
        endTimeMs: Date.now() + secs * 1000,
      };
    });
  }, [getModeDurationSeconds]);

  const pauseTimer = useCallback(() => {
    setTimerState((prev) => {
      const remaining = prev.endTimeMs
        ? Math.max(1, Math.ceil((prev.endTimeMs - Date.now()) / 1000))
        : prev.remainingSeconds;
      return {
        ...prev,
        status: 'paused',
        endTimeMs: null,
        remainingSeconds: remaining,
      };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      status: 'running',
      endTimeMs: Date.now() + prev.remainingSeconds * 1000,
    }));
  }, []);

  const resetTimer = useCallback(() => {
    const secs = getModeDurationSeconds(timerState.mode);
    setTimerState((prev) => ({
      ...prev,
      status: 'idle',
      endTimeMs: null,
      remainingSeconds: secs,
    }));
  }, [getModeDurationSeconds, timerState.mode]);

  const setTimerSubject = useCallback((subject: string) => {
    setTimerState((prev) => ({ ...prev, subject }));
  }, []);

  // Tasks CRUD
  const addTask = useCallback(
    (taskInput: Omit<Task, 'id' | 'createdAt'>) => {
      const newTask: Task = {
        ...taskInput,
        id: generateId('task'),
        createdAt: new Date().toISOString(),
        completedAt:
          taskInput.status === 'selesai' ? new Date().toISOString() : undefined,
      };
      setData((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
      showToast('Tugas berhasil ditambahkan.');
    },
    [showToast]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id !== id) return t;
          const nextStatus = patch.status ?? t.status;
          const completedAt =
            nextStatus === 'selesai'
              ? t.completedAt || new Date().toISOString()
              : undefined;
          return { ...t, ...patch, completedAt };
        }),
      }));
      showToast('Perubahan tugas disimpan.');
    },
    [showToast]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.filter((t) => t.id !== id),
      }));
      showToast('Tugas berhasil dihapus.');
    },
    [showToast]
  );

  const toggleTaskStatus = useCallback(
    (id: string, nextStatus?: TaskStatus) => {
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => {
          if (t.id !== id) return t;
          const resolved: TaskStatus =
            nextStatus ?? (t.status === 'selesai' ? 'belum_dikerjakan' : 'selesai');
          return {
            ...t,
            status: resolved,
            completedAt:
              resolved === 'selesai' ? new Date().toISOString() : undefined,
          };
        }),
      }));
      showToast('Status tugas diperbarui.');
    },
    [showToast]
  );

  // Schedule CRUD
  const addSchedule = useCallback(
    (item: Omit<ScheduleItem, 'id'>) => {
      setData((prev) => ({
        ...prev,
        schedules: [...prev.schedules, { ...item, id: generateId('sch') }],
      }));
      showToast('Jadwal mata pelajaran ditambahkan.');
    },
    [showToast]
  );

  const updateSchedule = useCallback(
    (id: string, patch: Partial<ScheduleItem>) => {
      setData((prev) => ({
        ...prev,
        schedules: prev.schedules.map((s) =>
          s.id === id ? { ...s, ...patch } : s
        ),
      }));
      showToast('Jadwal mata pelajaran diperbarui.');
    },
    [showToast]
  );

  const deleteSchedule = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        schedules: prev.schedules.filter((s) => s.id !== id),
      }));
      showToast('Jadwal berhasil dihapus.');
    },
    [showToast]
  );

  // Calendar CRUD
  const addCalendarEvent = useCallback(
    (event: Omit<CalendarEvent, 'id'>) => {
      setData((prev) => ({
        ...prev,
        calendarEvents: [
          ...prev.calendarEvents,
          { ...event, id: generateId('cal') },
        ],
      }));
      showToast('Agenda kalender ditambahkan.');
    },
    [showToast]
  );

  const updateCalendarEvent = useCallback(
    (id: string, patch: Partial<CalendarEvent>) => {
      setData((prev) => ({
        ...prev,
        calendarEvents: prev.calendarEvents.map((e) =>
          e.id === id ? { ...e, ...patch } : e
        ),
      }));
      showToast('Agenda kalender diperbarui.');
    },
    [showToast]
  );

  const deleteCalendarEvent = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        calendarEvents: prev.calendarEvents.filter((e) => e.id !== id),
      }));
      showToast('Agenda kalender dihapus.');
    },
    [showToast]
  );

  // Notes CRUD
  const addNote = useCallback(
    (noteInput: Omit<Note, 'id' | 'updatedAt'>): Note => {
      const created: Note = {
        ...noteInput,
        id: generateId('note'),
        updatedAt: new Date().toISOString(),
      };
      setData((prev) => ({ ...prev, notes: [created, ...prev.notes] }));
      showToast('Catatan baru dibuat.');
      return created;
    },
    [showToast]
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<Note>, silent = false) => {
      setData((prev) => ({
        ...prev,
        notes: prev.notes.map((n) =>
          n.id === id
            ? { ...n, ...patch, updatedAt: new Date().toISOString() }
            : n
        ),
      }));
      if (!silent) {
        showToast('Catatan berhasil disimpan.');
      }
    },
    [showToast]
  );

  const deleteNote = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => n.id !== id),
      }));
      showToast('Catatan dihapus.');
    },
    [showToast]
  );

  // Exams CRUD
  const addExam = useCallback(
    (exam: Omit<Exam, 'id'>) => {
      setData((prev) => ({
        ...prev,
        exams: [...prev.exams, { ...exam, id: generateId('exam') }],
      }));
      showToast('Jadwal ujian ditambahkan.');
    },
    [showToast]
  );

  const updateExam = useCallback(
    (id: string, patch: Partial<Exam>) => {
      setData((prev) => ({
        ...prev,
        exams: prev.exams.map((ex) =>
          ex.id === id ? { ...ex, ...patch } : ex
        ),
      }));
      showToast('Jadwal ujian diperbarui.');
    },
    [showToast]
  );

  const deleteExam = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        exams: prev.exams.filter((ex) => ex.id !== id),
      }));
      showToast('Jadwal ujian dihapus.');
    },
    [showToast]
  );

  // Todos CRUD
  const addTodo = useCallback(
    (todo: Omit<TodoItem, 'id'>) => {
      setData((prev) => ({
        ...prev,
        todos: [{ ...todo, id: generateId('todo') }, ...prev.todos],
      }));
      showToast('Aktivitas harian ditambahkan.');
    },
    [showToast]
  );

  const updateTodo = useCallback(
    (id: string, patch: Partial<TodoItem>) => {
      setData((prev) => ({
        ...prev,
        todos: prev.todos.map((td) =>
          td.id === id ? { ...td, ...patch } : td
        ),
      }));
      showToast('Aktivitas harian diperbarui.');
    },
    [showToast]
  );

  const toggleTodo = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      todos: prev.todos.map((td) => {
        if (td.id !== id) return td;
        const completed = !td.completed;
        return {
          ...td,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }),
    }));
  }, []);

  const deleteTodo = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        todos: prev.todos.filter((td) => td.id !== id),
      }));
      showToast('Aktivitas dihapus.');
    },
    [showToast]
  );

  // Settings & Data Management
  const updateSettings = useCallback(
    (patch: Partial<AppSettings>, silent = false) => {
      setData((prev) => {
        const nextSettings: AppSettings = {
          ...prev.settings,
          ...patch,
          pomodoro: {
            ...prev.settings.pomodoro,
            ...(patch.pomodoro || {}),
          },
        };
        return { ...prev, settings: nextSettings };
      });
      if (patch.pomodoro) {
        setTimerState((prev) => {
          if (prev.status !== 'idle') return prev;
          const nextPomodoro = {
            ...data.settings.pomodoro,
            ...patch.pomodoro,
          };
          const mins =
            prev.mode === 'fokus'
              ? nextPomodoro.focusMinutes
              : prev.mode === 'istirahat_pendek'
              ? nextPomodoro.shortBreakMinutes
              : nextPomodoro.longBreakMinutes;
          return { ...prev, remainingSeconds: mins * 60 };
        });
      }
      if (!silent) {
        showToast('Pengaturan disimpan.');
      }
    },
    [data.settings.pomodoro, showToast]
  );

  const exportDataJson = useCallback(() => {
    try {
      const payload = {
        app: 'StudySpace',
        version: 1,
        exportedAt: new Date().toISOString(),
        ...data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyspace-backup-${getTodayKey()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data berhasil diekspor ke file JSON.');
    } catch {
      showToast('Gagal mengekspor data JSON.', 'error');
    }
  }, [data, showToast]);

  const importDataJson = useCallback(
    (rawText: string): boolean => {
      try {
        const parsed = JSON.parse(rawText);
        const result = validateImportedJson(parsed);
        if (result.valid === false) {
          showToast(result.error, 'error');
          return false;
        }
        setData(result.data);
        showToast('Data berhasil diimpor dan dipulihkan.');
        return true;
      } catch {
        showToast('File bukan format JSON yang valid.', 'error');
        return false;
      }
    },
    [showToast]
  );

  const clearAllData = useCallback(() => {
    const fresh = clearAllStudySpaceData();
    setData(fresh);
    setTimerState({
      mode: 'fokus',
      status: 'idle',
      remainingSeconds: fresh.settings.pomodoro.focusMinutes * 60,
      endTimeMs: null,
      subject: '',
    });
    showToast('Seluruh data StudySpace telah dihapus.', 'info');
  }, [showToast]);

  // Compute active visual reminders
  const reminders = useMemo<ReminderAlert[]>(() => {
    if (!data.settings.visualReminders) return [];
    const list: ReminderAlert[] = [];
    const todayKey = getTodayKey();

    data.tasks
      .filter((t) => t.status !== 'selesai')
      .forEach((t) => {
        const diff = getDaysDiffFromToday(t.deadline);
        if (diff < 0) {
          list.push({
            id: `rem_over_${t.id}`,
            type: 'overdue',
            title: `Terlambat: ${t.title}`,
            subtitle: `${t.subject} · Terlambat ${Math.abs(diff)} hari`,
            targetPage: 'tugas',
            urgency: 'high',
          });
        } else if (diff <= 2) {
          list.push({
            id: `rem_near_${t.id}`,
            type: 'near_deadline',
            title:
              diff === 0
                ? `Deadline Hari Ini: ${t.title}`
                : diff === 1
                ? `Deadline Besok: ${t.title}`
                : `Deadline 2 Hari Lagi: ${t.title}`,
            subtitle: `${t.subject}${t.deadlineTime ? ` · Pukul ${formatTimeDisplay(t.deadlineTime, data.settings.timeFormat)}` : ''}`,
            targetPage: 'tugas',
            urgency: diff === 0 ? 'high' : 'medium',
          });
        }
      });

    data.exams.forEach((ex) => {
      const diff = getDaysDiffFromToday(ex.date);
      if (diff >= 0 && diff <= 5) {
        list.push({
          id: `rem_exam_${ex.id}`,
          type: 'exam',
          title:
            diff === 0
              ? `Ujian Hari Ini: ${ex.name}`
              : `Ujian ${diff} Hari Lagi: ${ex.name}`,
          subtitle: `${ex.subject} · ${formatIndonesianDate(ex.date, { shortMonth: true })}`,
          targetPage: 'produktivitas',
          targetTab: 'ujian',
          urgency: diff <= 1 ? 'high' : 'medium',
        });
      }
    });

    data.calendarEvents
      .filter((ev) => ev.date === todayKey)
      .forEach((ev) => {
        list.push({
          id: `rem_cal_${ev.id}`,
          type: 'agenda',
          title: `Agenda Hari Ini: ${ev.title}`,
          subtitle: ev.time
            ? `Pukul ${formatTimeDisplay(ev.time, data.settings.timeFormat)}`
            : 'Sepanjang hari',
          targetPage: 'kalender',
          urgency: 'normal',
        });
      });

    return list;
  }, [data]);

  const timerTotalSeconds = getModeDurationSeconds(timerState.mode);

  return (
    <StudySpaceContext.Provider
      value={{
        data,
        activePage,
        setActivePage,
        productivityTab,
        setProductivityTab,
        quickCreateTaskOpen,
        setQuickCreateTaskOpen,
        quickCreateNoteTrigger,
        triggerQuickCreateNote,
        toasts,
        showToast,
        dismissToast,
        reminders,
        sendBrowserNotification,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        addNote,
        updateNote,
        deleteNote,
        addExam,
        updateExam,
        deleteExam,
        addTodo,
        updateTodo,
        toggleTodo,
        deleteTodo,
        updateSettings,
        exportDataJson,
        importDataJson,
        clearAllData,
        timerMode: timerState.mode,
        timerStatus: timerState.status,
        timerRemainingSeconds: timerState.remainingSeconds,
        timerTotalSeconds,
        timerSubject: timerState.subject,
        setTimerSubject,
        switchTimerMode,
        startTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
      }}
    >
      {children}
    </StudySpaceContext.Provider>
  );
};

export function useStudySpace(): StudySpaceContextValue {
  const ctx = useContext(StudySpaceContext);
  if (!ctx) {
    throw new Error('useStudySpace must be used within StudySpaceProvider');
  }
  return ctx;
}
