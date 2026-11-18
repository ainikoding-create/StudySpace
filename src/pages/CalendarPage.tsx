import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit3,
  GraduationCap,
  Plus,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { useStudySpace } from '../context/StudySpaceContext';
import type { CalendarCategory, CalendarEvent } from '../types/studyspace';
import {
  formatIndonesianDate,
  formatTimeDisplay,
  getMonthGridDays,
  getTodayKey,
  getWeekDateKeys,
  INDONESIAN_MONTHS,
  parseDateKey,
  toLocalDateKey,
} from '../utils/date';

interface UnifiedAgendaItem {
  id: string;
  source: 'agenda' | 'tugas' | 'ujian';
  title: string;
  date: string;
  time?: string;
  category: CalendarCategory;
  subtitle?: string;
  description?: string;
  rawEvent?: CalendarEvent;
}

const CATEGORY_META: Record<
  CalendarCategory,
  { label: string; dotColor: string; textClass: string }
> = {
  tugas: {
    label: 'Deadline Tugas',
    dotColor: '#D97706',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  ujian: {
    label: 'Jadwal Ujian',
    dotColor: '#DC2626',
    textClass: 'text-red-700 dark:text-red-300',
  },
  kegiatan_sekolah: {
    label: 'Kegiatan Sekolah',
    dotColor: '#344E41',
    textClass: 'text-[#344E41] dark:text-[#A3B18A]',
  },
  pribadi: {
    label: 'Agenda Pribadi',
    dotColor: '#6B8E6E',
    textClass: 'text-[#4E6E5D] dark:text-[#DDE5D2]',
  },
};

const WEEKDAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const CalendarPage: React.FC = () => {
  const {
    data,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    setActivePage,
    setProductivityTab,
  } = useStudySpace();

  const todayKey = getTodayKey();
  const [viewMode, setViewMode] = useState<'bulanan' | 'mingguan'>('bulanan');
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayKey);
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<CalendarCategory>('kegiatan_sekolah');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Merge tasks, exams, and custom calendar events automatically
  const unifiedByDate = useMemo(() => {
    const map = new Map<string, UnifiedAgendaItem[]>();
    const pushItem = (item: UnifiedAgendaItem) => {
      const list = map.get(item.date) || [];
      list.push(item);
      map.set(item.date, list);
    };

    data.tasks.forEach((t) => {
      pushItem({
        id: `sync_task_${t.id}`,
        source: 'tugas',
        title: t.title,
        date: t.deadline,
        time: t.deadlineTime,
        category: 'tugas',
        subtitle: `${t.subject} · ${t.status === 'selesai' ? 'Selesai' : 'Aktif'}`,
        description: t.description,
      });
    });

    data.exams.forEach((ex) => {
      pushItem({
        id: `sync_exam_${ex.id}`,
        source: 'ujian',
        title: ex.name,
        date: ex.date,
        time: ex.time,
        category: 'ujian',
        subtitle: ex.subject,
        description: ex.notes,
      });
    });

    data.calendarEvents.forEach((ev) => {
      pushItem({
        id: ev.id,
        source: 'agenda',
        title: ev.title,
        date: ev.date,
        time: ev.time,
        category: ev.category,
        description: ev.description,
        rawEvent: ev,
      });
    });

    return map;
  }, [data.tasks, data.exams, data.calendarEvents]);

  const monthCells = useMemo(
    () => getMonthGridDays(cursorDate.getFullYear(), cursorDate.getMonth()),
    [cursorDate]
  );

  const weekDateKeys = useMemo(() => getWeekDateKeys(cursorDate), [cursorDate]);

  const navigatePrev = () => {
    setCursorDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'bulanan') {
        d.setMonth(d.getMonth() - 1);
      } else {
        d.setDate(d.getDate() - 7);
      }
      return d;
    });
  };

  const navigateNext = () => {
    setCursorDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'bulanan') {
        d.setMonth(d.getMonth() + 1);
      } else {
        d.setDate(d.getDate() + 7);
      }
      return d;
    });
  };

  const openAddAgenda = (presetDate?: string) => {
    setEditingEvent(null);
    setTitle('');
    setDate(presetDate || selectedDate || todayKey);
    setTime('');
    setCategory('kegiatan_sekolah');
    setDescription('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditAgenda = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setTitle(ev.title);
    setDate(ev.date);
    setTime(ev.time || '');
    setCategory(ev.category);
    setDescription(ev.description || '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Judul agenda wajib diisi.');
      return;
    }
    if (!date) {
      setFormError('Tanggal agenda wajib dipilih.');
      return;
    }

    const payload = {
      title: title.trim(),
      date,
      time: time || undefined,
      category,
      description: description.trim() || undefined,
    };

    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, payload);
    } else {
      addCalendarEvent(payload);
    }
    setSelectedDate(date);
    setModalOpen(false);
  };

  const selectedDayItems = unifiedByDate.get(selectedDate) || [];

  const headerLabel =
    viewMode === 'bulanan'
      ? `${INDONESIAN_MONTHS[cursorDate.getMonth()]} ${cursorDate.getFullYear()}`
      : `Minggu · ${formatIndonesianDate(weekDateKeys[0], {
          shortMonth: true,
        })} – ${formatIndonesianDate(weekDateKeys[6], { shortMonth: true })}`;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Kalender Akademik
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Sinkronisasi otomatis deadline tugas, jadwal ujian, dan kegiatan sekolah.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openAddAgenda(selectedDate)}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Agenda</span>
        </button>
      </div>

      {/* Category Legend & View Switcher */}
      <div className="study-card p-4 sm:px-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
          {(Object.keys(CATEGORY_META) as CalendarCategory[]).map((cat) => (
            <span key={cat} className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_META[cat].dotColor }}
              />
              <span>{CATEGORY_META[cat].label}</span>
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-muted)] w-fit shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('bulanan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'bulanan'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mingguan')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === 'mingguan'
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Mingguan
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar + Selected Day Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 study-card p-4 sm:p-6">
          {/* Calendar Toolbar */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <h3 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)]">
              {headerLabel}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCursorDate(now);
                  setSelectedDate(toLocalDateKey(now));
                }}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--bg-soft)] text-xs font-semibold text-[var(--text-primary)]"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={navigatePrev}
                aria-label="Periode sebelumnya"
                className="min-h-[36px] min-w-[36px] rounded-xl border border-[var(--border-hairline)] flex items-center justify-center hover:bg-[var(--bg-muted)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={navigateNext}
                aria-label="Periode berikutnya"
                className="min-h-[36px] min-w-[36px] rounded-xl border border-[var(--border-hairline)] flex items-center justify-center hover:bg-[var(--bg-muted)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'bulanan' ? (
            <>
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[var(--text-muted)] pb-2">
                {WEEKDAY_HEADERS.map((h) => (
                  <div key={h} className="py-1">
                    {h}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {monthCells.map((cell) => {
                  const items = unifiedByDate.get(cell.dateKey) || [];
                  const isToday = cell.dateKey === todayKey;
                  const isSelected = cell.dateKey === selectedDate;

                  return (
                    <button
                      key={cell.dateKey}
                      type="button"
                      onClick={() => setSelectedDate(cell.dateKey)}
                      className={`min-h-[60px] sm:min-h-[78px] p-1.5 sm:p-2 rounded-2xl border text-left flex flex-col justify-between transition-colors ${
                        isSelected
                          ? 'border-[#344E41] bg-[#DDE5D2]/55 dark:bg-[#2A3B31]'
                          : isToday
                          ? 'border-[#A3B18A] bg-[var(--bg-muted)]'
                          : 'border-transparent hover:bg-[var(--bg-canvas)]'
                      } ${!cell.inMonth ? 'opacity-45' : ''}`}
                    >
                      <span
                        className={`text-xs sm:text-sm font-mono-num font-semibold ${
                          isToday
                            ? 'text-[#344E41] dark:text-[#DDE5D2]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {items.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {items.slice(0, 4).map((it) => (
                            <span
                              key={it.id}
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  CATEGORY_META[it.category].dotColor,
                              }}
                              title={it.title}
                            />
                          ))}
                          {items.length > 4 && (
                            <span className="text-[10px] font-mono-num text-[var(--text-muted)]">
                              +{items.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-2.5">
              {weekDateKeys.map((dayKey) => {
                const d = parseDateKey(dayKey);
                const items = unifiedByDate.get(dayKey) || [];
                const isToday = dayKey === todayKey;
                const isSelected = dayKey === selectedDate;

                return (
                  <button
                    key={dayKey}
                    type="button"
                    onClick={() => setSelectedDate(dayKey)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-[#344E41] bg-[#DDE5D2]/50 dark:bg-[#2A3B31]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)]'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {formatIndonesianDate(d, { withWeekday: true })}
                        {isToday && (
                          <span className="ml-2 text-xs text-[#344E41] dark:text-[#A3B18A]">
                            · Hari Ini
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {items.length === 0 ? (
                        <span className="text-xs text-[var(--text-muted)]">
                          Kosong
                        </span>
                      ) : (
                        items.map((it) => (
                          <span
                            key={it.id}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-primary)]"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  CATEGORY_META[it.category].dotColor,
                              }}
                            />
                            <span className="truncate max-w-[160px]">
                              {it.title}
                            </span>
                          </span>
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Selected Date Detail Panel */}
        <aside className="lg:col-span-4 study-card p-5 sm:p-6 flex flex-col">
          <div className="flex items-start justify-between gap-2 pb-4 border-b border-[var(--border-hairline)]">
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">
                Agenda Tanggal
              </p>
              <h3 className="font-display text-base sm:text-lg font-bold text-[var(--text-primary)] mt-0.5">
                {formatIndonesianDate(selectedDate, { withWeekday: true })}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => openAddAgenda(selectedDate)}
              aria-label="Tambah agenda di tanggal ini"
              className="min-h-[38px] min-w-[38px] rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--bg-soft)] flex items-center justify-center text-[var(--text-primary)]"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex-1 space-y-3">
            {selectedDayItems.length === 0 ? (
              <div className="py-10 text-center space-y-2.5">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Belum ada agenda pada tanggal ini
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Klik tombol tambah di atas untuk mencatat kegiatan sekolah atau agenda pribadi.
                </p>
              </div>
            ) : (
              selectedDayItems.map((item) => {
                const meta = CATEGORY_META[item.category];
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-semibold ${meta.textClass}`}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: meta.dotColor }}
                          />
                          {meta.label}
                          {item.time &&
                            ` · ${formatTimeDisplay(
                              item.time,
                              data.settings.timeFormat
                            )}`}
                        </span>
                        <h4 className="text-sm font-bold text-[var(--text-primary)] mt-1">
                          {item.title}
                        </h4>
                        {item.subtitle && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      {item.source === 'agenda' && item.rawEvent ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditAgenda(item.rawEvent!)}
                            aria-label={`Edit ${item.title}`}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEvent(item.rawEvent!)}
                            aria-label={`Hapus ${item.title}`}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (item.source === 'tugas') {
                              setActivePage('tugas');
                            } else {
                              setActivePage('produktivitas');
                              setProductivityTab('ujian');
                            }
                          }}
                          title="Buka di halaman sumber"
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] shrink-0"
                        >
                          {item.source === 'tugas' ? (
                            <ClipboardList className="w-4 h-4" />
                          ) : (
                            <GraduationCap className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>

      {/* Add/Edit Agenda Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? 'Edit Agenda Kalender' : 'Tambah Agenda Kalender'}
        subtitle="Tambahkan kegiatan sekolah, rapat ekstrakurikuler, atau jadwal belajar."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Nama Agenda *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Rapat OSIS / Bimbingan Belajar"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Tanggal *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Jam (Opsional)
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Kategori
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CalendarCategory)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)]"
            >
              <option value="kegiatan_sekolah">Kegiatan Sekolah</option>
              <option value="pribadi">Agenda Pribadi</option>
              <option value="ujian">Ujian / Evaluasi</option>
              <option value="tugas">Tugas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Keterangan (Opsional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Catatan tempat, perlengkapan, atau detail acara..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-muted)] min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#344E41] hover:bg-[#2A3F34] min-h-[44px]"
            >
              {editingEvent ? 'Simpan Perubahan' : 'Simpan Agenda'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={() => {
          if (deletingEvent) deleteCalendarEvent(deletingEvent.id);
        }}
        title="Hapus Agenda"
        message={`Hapus agenda "${deletingEvent?.title}" dari kalender?`}
      />
    </div>
  );
};
