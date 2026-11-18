import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  Clock,
  GraduationCap,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useStudySpace } from '../context/StudySpaceContext';
import {
  formatIndonesianDate,
  formatLiveClock,
  formatTimeDisplay,
  getCountdownParts,
  getCurrentSchoolDay,
  getDaysDiffFromToday,
  getDeadlineBadgeText,
  getExamTargetTimestamp,
  getGreeting,
  getTodayKey,
} from '../utils/date';

const DAILY_QUOTES = [
  {
    text: 'Langkah kecil yang konsisten setiap hari akan membangun hasil besar saat ujian tiba.',
    author: 'StudySpace Daily',
  },
  {
    text: 'Fokus bukan tentang mengerjakan semuanya sekaligus, melainkan menuntaskan satu hal penting dengan tenang.',
    author: 'StudySpace Daily',
  },
  {
    text: 'Catatan yang rapi hari ini adalah penyelamat terbaik saat mengulang materi minggu depan.',
    author: 'StudySpace Daily',
  },
  {
    text: 'Disiplin bukan membatasi waktumu, justru memberi ruang agar kamu bisa beristirahat tanpa rasa cemas.',
    author: 'StudySpace Daily',
  },
  {
    text: 'Mengerti konsep dasar lebih berharga daripada menghafal ratusan rumus tanpa paham maknanya.',
    author: 'StudySpace Daily',
  },
  {
    text: 'Istirahat yang cukup adalah bagian dari strategi belajar yang cerdas.',
    author: 'StudySpace Daily',
  },
];

export const DashboardPage: React.FC = () => {
  const {
    data,
    setActivePage,
    setProductivityTab,
    setQuickCreateTaskOpen,
    triggerQuickCreateNote,
    toggleTaskStatus,
    reminders,
  } = useStudySpace();

  const [now, setNow] = useState(() => new Date());
  const [quoteOffset, setQuoteOffset] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const todayKey = getTodayKey();
  const schoolDay = getCurrentSchoolDay(now);
  const greeting = getGreeting(now.getHours());

  const activeTasks = useMemo(
    () =>
      data.tasks
        .filter((t) => t.status !== 'selesai')
        .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [data.tasks]
  );

  const completedTasksCount = useMemo(
    () => data.tasks.filter((t) => t.status === 'selesai').length,
    [data.tasks]
  );

  const overdueCount = useMemo(
    () => activeTasks.filter((t) => getDaysDiffFromToday(t.deadline) < 0).length,
    [activeTasks]
  );

  const todaySchedules = useMemo(() => {
    if (!schoolDay) return [];
    return data.schedules
      .filter((s) => s.day === schoolDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [data.schedules, schoolDay]);

  const nearestExam = useMemo(() => {
    const nowMs = now.getTime();
    const upcoming = data.exams
      .map((ex) => ({
        exam: ex,
        targetMs: getExamTargetTimestamp(ex.date, ex.time),
      }))
      .filter((item) => item.targetMs > nowMs)
      .sort((a, b) => a.targetMs - b.targetMs);
    return upcoming[0] ?? null;
  }, [data.exams, now]);

  const examCountdown = useMemo(() => {
    if (!nearestExam) return null;
    return getCountdownParts(nearestExam.targetMs, now.getTime());
  }, [nearestExam, now]);

  // Daily Productivity Progress (today's todos + today's focus sessions / tasks)
  const todayTodos = useMemo(
    () => data.todos.filter((td) => td.date === todayKey),
    [data.todos, todayKey]
  );
  const completedTodosToday = todayTodos.filter((td) => td.completed).length;
  const todoProgress =
    todayTodos.length > 0
      ? Math.round((completedTodosToday / todayTodos.length) * 100)
      : 0;

  const focusMinutesToday = useMemo(
    () =>
      data.studySessions
        .filter((s) => s.date === todayKey && s.mode === 'fokus')
        .reduce((sum, s) => sum + s.durationMinutes, 0),
    [data.studySessions, todayKey]
  );

  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const currentQuote =
    DAILY_QUOTES[(dayOfYear + quoteOffset) % DAILY_QUOTES.length];

  return (
    <div className="space-y-6">
      {/* Hero Greeting & Live Clock */}
      <section className="study-card p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[var(--text-muted)]">
            <span className="font-semibold text-[#344E41] dark:text-[#A3B18A]">
              StudySpace
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatIndonesianDate(now, { withWeekday: true })}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-num text-[var(--text-primary)] font-semibold">
              {formatLiveClock(now, data.settings.timeFormat)}
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-tight">
            {greeting}, {data.settings.nickname}!
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {activeTasks.length > 0
              ? `Kamu memiliki ${activeTasks.length} tugas aktif dan ${todaySchedules.length} mata pelajaran terjadwal hari ini.`
              : 'Semua tugasmu sudah beres. Gunakan waktu hari ini untuk mengulang materi atau fokus belajar.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setQuickCreateTaskOpen(true)}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tugas</span>
          </button>
          <button
            type="button"
            onClick={triggerQuickCreateNote}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--bg-soft)] hover:bg-[#CFDAB9] dark:hover:bg-[#31453B] text-[var(--text-primary)] text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4" />
            <span>Tambah Catatan</span>
          </button>
        </div>
      </section>

      {/* Urgent Visual Reminder Strip (only when enabled & alerts exist) */}
      {data.settings.visualReminders && reminders.length > 0 && (
        <section className="study-card p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#EFF3E8] dark:bg-[#1E2B24]">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {reminders[0].title}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {reminders.length > 1
                  ? `${reminders[0].subtitle} · +${reminders.length - 1} pengingat lainnya`
                  : reminders[0].subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActivePage(reminders[0].targetPage);
              if (reminders[0].targetTab) setProductivityTab(reminders[0].targetTab);
            }}
            className="text-xs font-semibold text-[#344E41] dark:text-[#A3B18A] hover:underline flex items-center gap-1 shrink-0 self-start sm:self-center"
          >
            <span>Lihat Detail</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      {/* 4 Summary Metrics */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="study-card p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Tugas Aktif</p>
          <p className="font-display text-2xl sm:text-3xl font-bold tabular-nums mt-1.5 text-[var(--text-primary)]">
            {activeTasks.length}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {overdueCount > 0 ? `${overdueCount} terlambat` : 'Tidak ada yang terlambat'}
          </p>
        </div>

        <div className="study-card p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Tugas Selesai</p>
          <p className="font-display text-2xl sm:text-3xl font-bold tabular-nums mt-1.5 text-[#344E41] dark:text-[#A3B18A]">
            {completedTasksCount}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Dari total {data.tasks.length} tugas
          </p>
        </div>

        <div className="study-card p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Progress To-Do Hari Ini</p>
          <p className="font-display text-2xl sm:text-3xl font-bold tabular-nums mt-1.5 text-[var(--text-primary)]">
            {todoProgress}%
          </p>
          <div className="w-full h-2 rounded-full bg-[var(--bg-muted)] mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#344E41] dark:bg-[#A3B18A] transition-all duration-300"
              style={{ width: `${todoProgress}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 tabular-nums">
            {completedTodosToday}/{todayTodos.length} aktivitas selesai
          </p>
        </div>

        <div className="study-card p-5">
          <p className="text-xs font-medium text-[var(--text-muted)]">Fokus Belajar Hari Ini</p>
          <p className="font-display text-2xl sm:text-3xl font-bold tabular-nums mt-1.5 text-[var(--text-primary)]">
            {focusMinutesToday} <span className="text-base font-semibold">mnt</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setActivePage('produktivitas');
              setProductivityTab('timer');
            }}
            className="text-xs font-semibold text-[#344E41] dark:text-[#A3B18A] hover:underline mt-1.5 inline-flex items-center gap-1"
          >
            <span>Buka Study Timer</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </section>

      {/* Main 2-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Jadwal Hari Ini & Deadline Terdekat */}
        <div className="lg:col-span-7 space-y-6">
          {/* Jadwal Pelajaran Hari Ini */}
          <section className="study-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  Jadwal Pelajaran Hari Ini
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {schoolDay ? `Hari ${schoolDay}` : 'Hari Minggu (Libur Sekolah)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('jadwal')}
                className="text-xs font-semibold text-[#344E41] dark:text-[#A3B18A] hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <span>Semua Jadwal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!schoolDay ? (
              <div className="py-7 text-center rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)]">
                <CalendarClock className="w-7 h-7 mx-auto text-[var(--accent-sage)] mb-2" />
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Selamat berakhir pekan!
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Tidak ada jadwal pelajaran reguler di hari Minggu.
                </p>
              </div>
            ) : todaySchedules.length === 0 ? (
              <div className="py-7 text-center rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] space-y-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Belum ada jadwal untuk hari {schoolDay}
                </p>
                <button
                  type="button"
                  onClick={() => setActivePage('jadwal')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#344E41] text-white"
                >
                  Atur Jadwal
                </button>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-hairline)]">
                {todaySchedules.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {item.subject}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                          {[item.teacher, item.room].filter(Boolean).join(' · ') ||
                            'Jadwal sekolah'}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono-num text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap shrink-0">
                      {formatTimeDisplay(item.startTime, data.settings.timeFormat)} –{' '}
                      {formatTimeDisplay(item.endTime, data.settings.timeFormat)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Deadline Terdekat */}
          <section className="study-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  Deadline Terdekat
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Urutan tugas aktif paling mendesak
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePage('tugas')}
                className="text-xs font-semibold text-[#344E41] dark:text-[#A3B18A] hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                <span>Kelola Tugas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activeTasks.length === 0 ? (
              <div className="py-7 text-center rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] space-y-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Tidak ada tugas aktif saat ini
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Klik Tambah Tugas jika ada pekerjaan rumah baru.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-hairline)]">
                {activeTasks.slice(0, 4).map((task) => {
                  const diff = getDaysDiffFromToday(task.deadline);
                  const isOverdue = diff < 0;
                  const isNear = diff >= 0 && diff <= 2;

                  return (
                    <div
                      key={task.id}
                      className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleTaskStatus(task.id, 'selesai')}
                          aria-label={`Tandai ${task.title} selesai`}
                          className="mt-0.5 w-6 h-6 rounded-lg border border-[#A3B18A] hover:bg-[#344E41] hover:border-[#344E41] hover:text-white flex items-center justify-center text-transparent transition-colors shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                            {task.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                            <span>{task.subject}</span>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize">Prioritas {task.priority}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
                            isOverdue
                              ? 'text-red-600 dark:text-red-400'
                              : isNear
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {isOverdue ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span>{getDeadlineBadgeText(task.deadline)}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Countdown Ujian Terdekat & Motivasi Belajar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Countdown Ujian Terdekat */}
          <section className="study-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#344E41] dark:text-[#A3B18A]" />
                <h3 className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                  Countdown Ujian Terdekat
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActivePage('produktivitas');
                  setProductivityTab('ujian');
                }}
                className="text-xs font-semibold text-[#344E41] dark:text-[#A3B18A] hover:underline whitespace-nowrap"
              >
                Kelola Ujian
              </button>
            </div>

            {!nearestExam || !examCountdown ? (
              <div className="py-7 text-center rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] space-y-2.5">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Belum ada jadwal ujian mendatang
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('produktivitas');
                    setProductivityTab('ujian');
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#344E41] text-white"
                >
                  Tambah Jadwal Ujian
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-base font-bold text-[var(--text-primary)]">
                    {nearestExam.exam.name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {nearestExam.exam.subject} ·{' '}
                    {formatIndonesianDate(nearestExam.exam.date, {
                      withWeekday: true,
                    })}
                    {nearestExam.exam.time
                      ? ` · ${formatTimeDisplay(
                          nearestExam.exam.time,
                          data.settings.timeFormat
                        )}`
                      : ''}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Hari', val: examCountdown.days },
                    { label: 'Jam', val: examCountdown.hours },
                    { label: 'Menit', val: examCountdown.minutes },
                    { label: 'Detik', val: examCountdown.seconds },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className="rounded-2xl bg-[var(--bg-muted)] py-3 px-2 text-center"
                    >
                      <span className="font-mono-num text-xl sm:text-2xl font-bold text-[#344E41] dark:text-[#DDE5D2] block">
                        {String(unit.val).padStart(2, '0')}
                      </span>
                      <span className="text-[11px] font-medium text-[var(--text-muted)]">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>

                {nearestExam.exam.notes && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-canvas)] p-3 rounded-xl border border-[var(--border-hairline)]">
                    {nearestExam.exam.notes}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Motivasi Belajar Harian */}
          <section className="study-card p-5 sm:p-6 bg-[#DDE5D2]/55 dark:bg-[#202D26]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#344E41] dark:text-[#A3B18A]">
                <Sparkles className="w-4 h-4" />
                <span>Motivasi Belajar Harian</span>
              </div>
              <button
                type="button"
                onClick={() => setQuoteOffset((prev) => prev + 1)}
                aria-label="Ganti kutipan motivasi"
                className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-secondary)] transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <blockquote className="text-sm sm:text-base font-medium text-[var(--text-primary)] leading-relaxed">
              “{currentQuote.text}”
            </blockquote>
            <p className="text-xs text-[var(--text-muted)] mt-2.5">
              — {currentQuote.author}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
