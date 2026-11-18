import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Edit3,
  GraduationCap,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Timer,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { useStudySpace } from '../context/StudySpaceContext';
import type { Exam, PomodoroMode } from '../types/studyspace';
import {
  addDaysToKey,
  formatIndonesianDate,
  formatTimeDisplay,
  getCountdownParts,
  getDaysDiffFromToday,
  getExamTargetTimestamp,
  getTodayKey,
  INDONESIAN_DAYS,
  INDONESIAN_MONTHS_SHORT,
  parseDateKey,
} from '../utils/date';

export const ProductivityPage: React.FC = () => {
  const {
    data,
    productivityTab,
    setProductivityTab,
    updateSettings,
    // Timer
    timerMode,
    timerStatus,
    timerRemainingSeconds,
    timerTotalSeconds,
    timerSubject,
    setTimerSubject,
    switchTimerMode,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    // Exams
    addExam,
    updateExam,
    deleteExam,
  } = useStudySpace();

  const todayKey = getTodayKey();
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Tick every second when on Ujian tab
  useEffect(() => {
    if (productivityTab !== 'ujian') return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [productivityTab]);

  // --- Statistik computations (100% real user data) ---
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter((t) => t.status === 'selesai');
  const incompleteTasks = data.tasks.filter((t) => t.status !== 'selesai');
  const overdueTasks = incompleteTasks.filter(
    (t) => getDaysDiffFromToday(t.deadline) < 0
  );
  const completionPercent =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  const totalTodos = data.todos.length;
  const completedTodos = data.todos.filter((td) => td.completed).length;
  const todoPercent =
    totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

  // Weekly chart: last 7 days (completed tasks + completed todos + focus sessions)
  const weeklyChart = useMemo(() => {
    const days: {
      dateKey: string;
      label: string;
      doneItems: number;
      focusMinutes: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const key = addDaysToKey(todayKey, -i);
      const dt = parseDateKey(key);
      const shortDay = INDONESIAN_DAYS[dt.getDay()].slice(0, 3);

      const tasksDoneOnDay = data.tasks.filter(
        (t) => t.status === 'selesai' && t.completedAt?.slice(0, 10) === key
      ).length;
      const todosDoneOnDay = data.todos.filter(
        (td) => td.completed && (td.completedAt?.slice(0, 10) === key || td.date === key)
      ).length;
      const focusMins = data.studySessions
        .filter((s) => s.date === key && s.mode === 'fokus')
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      days.push({
        dateKey: key,
        label: shortDay,
        doneItems: tasksDoneOnDay + todosDoneOnDay,
        focusMinutes: focusMins,
      });
    }
    return days;
  }, [data.tasks, data.todos, data.studySessions, todayKey]);

  const maxWeeklyScore = Math.max(
    1,
    ...weeklyChart.map((d) => d.doneItems + Math.round(d.focusMinutes / 25))
  );

  // Monthly chart: last 6 months
  const monthlyChart = useMemo(() => {
    const now = new Date();
    const months: {
      key: string;
      label: string;
      completedCount: number;
      focusHours: number;
    }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = INDONESIAN_MONTHS_SHORT[d.getMonth()];

      const tasksDone = data.tasks.filter(
        (t) =>
          t.status === 'selesai' &&
          (t.completedAt?.slice(0, 7) === ym || t.deadline.slice(0, 7) === ym)
      ).length;
      const todosDone = data.todos.filter(
        (td) => td.completed && td.date.slice(0, 7) === ym
      ).length;
      const focusMins = data.studySessions
        .filter((s) => s.date.slice(0, 7) === ym && s.mode === 'fokus')
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      months.push({
        key: ym,
        label,
        completedCount: tasksDone + todosDone,
        focusHours: Number((focusMins / 60).toFixed(1)),
      });
    }
    return months;
  }, [data.tasks, data.todos, data.studySessions]);

  const maxMonthlyCount = Math.max(
    1,
    ...monthlyChart.map((m) => m.completedCount)
  );

  // --- Timer formatting ---
  const timerMins = Math.floor(timerRemainingSeconds / 60);
  const timerSecs = timerRemainingSeconds % 60;
  const timerClock = `${String(timerMins).padStart(2, '0')}:${String(
    timerSecs
  ).padStart(2, '0')}`;
  const timerProgress =
    timerTotalSeconds > 0
      ? ((timerTotalSeconds - timerRemainingSeconds) / timerTotalSeconds) * 100
      : 0;
  const ringRadius = 96;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset =
    ringCircumference - (timerProgress / 100) * ringCircumference;

  // Pomodoro duration customization state
  const [focusMinsInput, setFocusMinsInput] = useState(
    data.settings.pomodoro.focusMinutes
  );
  const [shortBreakInput, setShortBreakInput] = useState(
    data.settings.pomodoro.shortBreakMinutes
  );
  const [longBreakInput, setLongBreakInput] = useState(
    data.settings.pomodoro.longBreakMinutes
  );

  useEffect(() => {
    setFocusMinsInput(data.settings.pomodoro.focusMinutes);
    setShortBreakInput(data.settings.pomodoro.shortBreakMinutes);
    setLongBreakInput(data.settings.pomodoro.longBreakMinutes);
  }, [data.settings.pomodoro]);

  const handleSavePomodoroSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      pomodoro: {
        focusMinutes: Math.max(1, Math.min(180, Number(focusMinsInput) || 25)),
        shortBreakMinutes: Math.max(
          1,
          Math.min(60, Number(shortBreakInput) || 5)
        ),
        longBreakMinutes: Math.max(
          1,
          Math.min(90, Number(longBreakInput) || 15)
        ),
      },
    });
  };

  // --- Exam Modal State ---
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null);

  const [examName, setExamName] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState(todayKey);
  const [examTime, setExamTime] = useState('');
  const [examNotes, setExamNotes] = useState('');
  const [examError, setExamError] = useState('');

  const sortedExams = useMemo(() => {
    return [...data.exams].sort((a, b) => {
      const ta = getExamTargetTimestamp(a.date, a.time);
      const tb = getExamTargetTimestamp(b.date, b.time);
      return ta - tb;
    });
  }, [data.exams]);

  const openAddExam = () => {
    setEditingExam(null);
    setExamName('');
    setExamSubject('');
    setExamDate(todayKey);
    setExamTime('');
    setExamNotes('');
    setExamError('');
    setExamModalOpen(true);
  };

  const openEditExam = (ex: Exam) => {
    setEditingExam(ex);
    setExamName(ex.name);
    setExamSubject(ex.subject);
    setExamDate(ex.date);
    setExamTime(ex.time || '');
    setExamNotes(ex.notes || '');
    setExamError('');
    setExamModalOpen(true);
  };

  const handleSubmitExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) {
      setExamError('Nama ujian wajib diisi.');
      return;
    }
    if (!examSubject.trim()) {
      setExamError('Mata pelajaran ujian wajib diisi.');
      return;
    }
    if (!examDate) {
      setExamError('Tanggal ujian wajib dipilih.');
      return;
    }

    const payload = {
      name: examName.trim(),
      subject: examSubject.trim(),
      date: examDate,
      time: examTime || undefined,
      notes: examNotes.trim() || undefined,
    };

    if (editingExam) {
      updateExam(editingExam.id, payload);
    } else {
      addExam(payload);
    }
    setExamModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Pusat Produktivitas
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Pantau statistik belajarmu, jalankan Study Timer Pomodoro, dan hitung mundur jadwal ujian.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-2xl bg-[var(--bg-muted)] w-fit shrink-0">
          {(
            [
              { id: 'statistik', label: 'Statistik', icon: BarChart3 },
              { id: 'timer', label: 'Study Timer', icon: Timer },
              { id: 'ujian', label: 'Countdown Ujian', icon: GraduationCap },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = productivityTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setProductivityTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: STATISTIK PRODUKTIVITAS */}
      {productivityTab === 'statistik' && (
        <div className="space-y-6">
          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="study-card p-5">
              <p className="text-xs font-medium text-[var(--text-muted)]">Total Tugas</p>
              <p className="font-display text-2xl font-bold tabular-nums mt-1">
                {totalTasks}
              </p>
            </div>
            <div className="study-card p-5">
              <p className="text-xs font-medium text-[var(--text-muted)]">Tugas Selesai</p>
              <p className="font-display text-2xl font-bold tabular-nums mt-1 text-[#344E41] dark:text-[#A3B18A]">
                {completedTasks.length}
              </p>
            </div>
            <div className="study-card p-5">
              <p className="text-xs font-medium text-[var(--text-muted)]">Belum Selesai</p>
              <p className="font-display text-2xl font-bold tabular-nums mt-1">
                {incompleteTasks.length}
              </p>
            </div>
            <div className="study-card p-5">
              <p className="text-xs font-medium text-[var(--text-muted)]">Terlambat</p>
              <p className="font-display text-2xl font-bold tabular-nums mt-1 text-red-600 dark:text-red-400">
                {overdueTasks.length}
              </p>
            </div>
            <div className="study-card p-5 col-span-2 sm:col-span-1">
              <p className="text-xs font-medium text-[var(--text-muted)]">Penyelesaian</p>
              <p className="font-display text-2xl font-bold tabular-nums mt-1 text-[#344E41] dark:text-[#A3B18A]">
                {completionPercent}%
              </p>
            </div>
          </div>

          {/* Weekly & Monthly Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="study-card p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                Grafik Produktivitas Mingguan
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 mb-6">
                Aktivitas selesai & sesi fokus selama 7 hari terakhir
              </p>

              <div className="h-48 flex items-end justify-between gap-2 sm:gap-3 pt-4">
                {weeklyChart.map((day) => {
                  const score =
                    day.doneItems + Math.round(day.focusMinutes / 25);
                  const heightPct = Math.max(
                    score > 0 ? 14 : 4,
                    Math.round((score / maxWeeklyScore) * 100)
                  );
                  return (
                    <div
                      key={day.dateKey}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                    >
                      <span className="text-[11px] font-mono-num text-[var(--text-secondary)]">
                        {day.doneItems > 0 || day.focusMinutes > 0
                          ? `${day.doneItems}·${day.focusMinutes}m`
                          : '0'}
                      </span>
                      <div className="w-full max-w-[36px] bg-[var(--bg-muted)] rounded-t-xl h-32 flex items-end overflow-hidden">
                        <div
                          className="w-full rounded-t-xl bg-[#344E41] dark:bg-[#A3B18A] transition-all duration-300"
                          style={{ height: `${heightPct}%` }}
                          title={`${day.label}: ${day.doneItems} tugas/to-do selesai, ${day.focusMinutes} menit fokus`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-muted)]">
                        {day.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="study-card p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                Grafik Bulanan
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 mb-6">
                Total tugas & to-do selesai 6 bulan terakhir
              </p>

              <div className="h-48 flex items-end justify-between gap-2 sm:gap-3 pt-4">
                {monthlyChart.map((m) => {
                  const heightPct = Math.max(
                    m.completedCount > 0 ? 14 : 4,
                    Math.round((m.completedCount / maxMonthlyCount) * 100)
                  );
                  return (
                    <div
                      key={m.key}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                    >
                      <span className="text-[11px] font-mono-num text-[var(--text-secondary)]">
                        {m.completedCount}
                      </span>
                      <div className="w-full max-w-[40px] bg-[var(--bg-muted)] rounded-t-xl h-32 flex items-end overflow-hidden">
                        <div
                          className="w-full rounded-t-xl bg-[#A3B18A] dark:bg-[#5C7A63] transition-all duration-300"
                          style={{ height: `${heightPct}%` }}
                          title={`${m.label}: ${m.completedCount} selesai, ${m.focusHours} jam fokus`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-muted)]">
                        {m.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Riwayat Tugas Selesai & Progress To-Do */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <section className="lg:col-span-7 study-card p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)] mb-1">
                Riwayat Tugas Selesai
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Daftar tugas yang berhasil kamu tuntaskan
              </p>

              {completedTasks.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-6 text-center">
                  Belum ada tugas yang selesai. Tandai tugas selesai di menu Tugas untuk melihat riwayat.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border-hairline)]">
                  {completedTasks.slice(0, 6).map((t) => (
                    <div
                      key={t.id}
                      className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-[#344E41] dark:text-[#A3B18A] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {t.title}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] truncate">
                            {t.subject}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-mono-num text-[var(--text-muted)] shrink-0">
                        {formatIndonesianDate(
                          t.completedAt ? t.completedAt.slice(0, 10) : t.deadline,
                          { shortMonth: true }
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="lg:col-span-5 study-card p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                  Progress To-Do Harian
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Akumulasi seluruh aktivitas checklist yang tercatat
                </p>
              </div>

              <div className="my-6 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-3xl font-bold tabular-nums text-[#344E41] dark:text-[#A3B18A]">
                    {todoPercent}%
                  </span>
                  <span className="text-xs font-mono-num text-[var(--text-secondary)]">
                    {completedTodos}/{totalTodos} selesai
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#344E41] dark:bg-[#A3B18A] transition-all duration-300"
                    style={{ width: `${todoPercent}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)]">
                Total sesi fokus Pomodoro tercatat:{' '}
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {data.studySessions.filter((s) => s.mode === 'fokus').length} sesi
                </span>
              </p>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: STUDY TIMER (POMODORO) */}
      {productivityTab === 'timer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Pomodoro Timer Card */}
          <section className="lg:col-span-7 study-card p-6 sm:p-8 flex flex-col items-center text-center">
            {/* Mode Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-muted)] mb-6">
              {(
                [
                  {
                    id: 'fokus',
                    label: `Fokus (${data.settings.pomodoro.focusMinutes}m)`,
                  },
                  {
                    id: 'istirahat_pendek',
                    label: `Istirahat (${data.settings.pomodoro.shortBreakMinutes}m)`,
                  },
                  {
                    id: 'istirahat_panjang',
                    label: `Istirahat Panjang (${data.settings.pomodoro.longBreakMinutes}m)`,
                  },
                ] as { id: PomodoroMode; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => switchTimerMode(m.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                    timerMode === m.id
                      ? 'bg-[#344E41] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Circular Progress SVG */}
            <div className="relative w-56 h-56 flex items-center justify-center my-2">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
                <circle
                  cx="110"
                  cy="110"
                  r={ringRadius}
                  fill="none"
                  stroke="var(--bg-muted)"
                  strokeWidth="12"
                />
                <circle
                  cx="110"
                  cy="110"
                  r={ringRadius}
                  fill="none"
                  stroke={timerMode === 'fokus' ? '#344E41' : '#A3B18A'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-[stroke-dashoffset] duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono-num text-4xl sm:text-5xl font-bold text-[var(--text-primary)]">
                  {timerClock}
                </span>
                <span className="text-xs font-medium text-[var(--text-muted)] mt-1.5">
                  {timerStatus === 'running'
                    ? 'Sedang berjalan (akurat di background tab)'
                    : timerStatus === 'paused'
                    ? 'Dijeda'
                    : 'Siap dimulai'}
                </span>
              </div>
            </div>

            {/* Optional Subject Input */}
            <div className="w-full max-w-xs mt-5">
              <input
                type="text"
                value={timerSubject}
                onChange={(e) => setTimerSubject(e.target.value)}
                placeholder="Mata pelajaran fokus (opsional)..."
                className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs text-center text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              {timerStatus === 'idle' && (
                <button
                  type="button"
                  onClick={startTimer}
                  className="min-h-[46px] px-7 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Mulai</span>
                </button>
              )}

              {timerStatus === 'running' && (
                <button
                  type="button"
                  onClick={pauseTimer}
                  className="min-h-[46px] px-7 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  <span>Jeda</span>
                </button>
              )}

              {timerStatus === 'paused' && (
                <button
                  type="button"
                  onClick={resumeTimer}
                  className="min-h-[46px] px-7 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Lanjutkan</span>
                </button>
              )}

              <button
                type="button"
                onClick={resetTimer}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--bg-soft)] text-[var(--text-primary)] text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </section>

          {/* Timer Duration Settings & History */}
          <div className="lg:col-span-5 space-y-6">
            <section className="study-card p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)] mb-1">
                Pengaturan Durasi Timer
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Sesuaikan durasi fokus dan istirahat dalam hitungan menit.
              </p>

              <form onSubmit={handleSavePomodoroSettings} className="space-y-3">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                      Fokus
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={focusMinsInput}
                      onChange={(e) => setFocusMinsInput(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm font-mono-num text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                      Istirahat
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={shortBreakInput}
                      onChange={(e) => setShortBreakInput(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm font-mono-num text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                      Panjang
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={longBreakInput}
                      onChange={(e) => setLongBreakInput(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm font-mono-num text-[var(--text-primary)]"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[var(--bg-soft)] hover:bg-[#CFDAB9] dark:hover:bg-[#31453B] text-[var(--text-primary)] text-xs font-semibold transition-colors"
                >
                  Simpan Durasi Timer
                </button>
              </form>
            </section>

            <section className="study-card p-5 sm:p-6">
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)] mb-1">
                Riwayat Sesi Belajar
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-4">
                Sesi Pomodoro yang telah kamu selesaikan
              </p>

              {data.studySessions.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] py-6 text-center">
                  Belum ada sesi belajar tercatat. Selesaikan satu sesi timer untuk melihat riwayat.
                </p>
              ) : (
                <div className="divide-y divide-[var(--border-hairline)] max-h-64 overflow-y-auto">
                  {data.studySessions.slice(0, 12).map((s) => {
                    const dt = new Date(s.completedAt);
                    const timeStr = `${String(dt.getHours()).padStart(
                      2,
                      '0'
                    )}:${String(dt.getMinutes()).padStart(2, '0')}`;
                    return (
                      <div
                        key={s.id}
                        className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {s.mode === 'fokus'
                              ? s.subject || 'Sesi Fokus'
                              : s.mode === 'istirahat_pendek'
                              ? 'Istirahat Singkat'
                              : 'Istirahat Panjang'}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {formatIndonesianDate(s.date, { shortMonth: true })} ·{' '}
                            {formatTimeDisplay(timeStr, data.settings.timeFormat)}
                          </p>
                        </div>
                        <span className="font-mono-num text-xs font-semibold text-[#344E41] dark:text-[#A3B18A] shrink-0">
                          {s.durationMinutes} mnt
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* TAB 3: COUNTDOWN UJIAN */}
      {productivityTab === 'ujian' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Diurutkan otomatis berdasarkan jadwal ujian paling dekat.
            </p>
            <button
              type="button"
              onClick={openAddExam}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Ujian</span>
            </button>
          </div>

          {sortedExams.length === 0 ? (
            <div className="study-card p-10 text-center space-y-3">
              <p className="font-display text-base font-semibold text-[var(--text-primary)]">
                Belum ada jadwal ujian
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Tambahkan jadwal ulangan harian, PTS, PAS, atau ujian masuk untuk memantau hitungan mundurnya.
              </p>
              <button
                type="button"
                onClick={openAddExam}
                className="px-4 py-2.5 rounded-xl bg-[#344E41] text-white text-sm font-semibold"
              >
                Tambah Ujian Pertama
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sortedExams.map((ex) => {
                const targetMs = getExamTargetTimestamp(ex.date, ex.time);
                const cd = getCountdownParts(targetMs, nowMs);

                return (
                  <article key={ex.id} className="study-card p-5 sm:p-6 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#344E41] dark:text-[#A3B18A]">
                          {ex.subject}
                        </p>
                        <h3 className="font-display text-lg font-bold text-[var(--text-primary)] mt-0.5">
                          {ex.name}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {formatIndonesianDate(ex.date, { withWeekday: true })}
                          {ex.time
                            ? ` · ${formatTimeDisplay(
                                ex.time,
                                data.settings.timeFormat
                              )}`
                            : ''}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditExam(ex)}
                          aria-label={`Edit ${ex.name}`}
                          className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingExam(ex)}
                          aria-label={`Hapus ${ex.name}`}
                          className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {cd.isPast ? (
                      <div className="p-3.5 rounded-2xl bg-[var(--bg-muted)] text-center text-xs font-semibold text-[var(--text-secondary)]">
                        Waktu ujian telah tiba / selesai dilaksanakan
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: 'Hari', val: cd.days },
                          { label: 'Jam', val: cd.hours },
                          { label: 'Menit', val: cd.minutes },
                          { label: 'Detik', val: cd.seconds },
                        ].map((unit) => (
                          <div
                            key={unit.label}
                            className="rounded-2xl bg-[var(--bg-muted)] py-3 px-2 text-center"
                          >
                            <span className="font-mono-num text-xl font-bold text-[#344E41] dark:text-[#DDE5D2] block">
                              {String(unit.val).padStart(2, '0')}
                            </span>
                            <span className="text-[11px] font-medium text-[var(--text-muted)]">
                              {unit.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {ex.notes && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-canvas)] p-3 rounded-xl border border-[var(--border-hairline)]">
                        {ex.notes}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Exam Add/Edit Modal */}
      <Modal
        open={examModalOpen}
        onClose={() => setExamModalOpen(false)}
        title={editingExam ? 'Edit Jadwal Ujian' : 'Tambah Jadwal Ujian'}
      >
        <form onSubmit={handleSubmitExam} className="space-y-4">
          {examError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
              {examError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Nama Ujian *
            </label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Contoh: Penilaian Tengah Semester"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Mata Pelajaran *
            </label>
            <input
              type="text"
              value={examSubject}
              onChange={(e) => setExamSubject(e.target.value)}
              placeholder="Contoh: Matematika Peminatan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Tanggal Ujian *
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Jam Ujian (Opsional)
              </label>
              <input
                type="time"
                value={examTime}
                onChange={(e) => setExamTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Catatan Persiapan (Opsional)
            </label>
            <textarea
              value={examNotes}
              onChange={(e) => setExamNotes(e.target.value)}
              rows={3}
              placeholder="Materi bab yang diujikan atau hal yang perlu disiapkan..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setExamModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-muted)] min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#344E41] hover:bg-[#2A3F34] min-h-[44px]"
            >
              {editingExam ? 'Simpan Perubahan' : 'Simpan Ujian'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingExam}
        onClose={() => setDeletingExam(null)}
        onConfirm={() => {
          if (deletingExam) deleteExam(deletingExam.id);
        }}
        title="Hapus Jadwal Ujian"
        message={`Hapus jadwal ujian "${deletingExam?.name}"?`}
      />
    </div>
  );
};
