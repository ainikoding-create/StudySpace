import React, { useMemo, useState } from 'react';
import { Clock, Edit3, MapPin, Plus, Trash2, User } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { useStudySpace } from '../context/StudySpaceContext';
import type { ScheduleItem, SchoolDay } from '../types/studyspace';
import {
  formatTimeDisplay,
  getCurrentSchoolDay,
  SCHOOL_DAYS,
} from '../utils/date';

const COLOR_PALETTE = [
  { label: 'Forest Sage', value: '#344E41' },
  { label: 'Olive Leaf', value: '#5C7A63' },
  { label: 'Classic Sage', value: '#A3B18A' },
  { label: 'Moss Earth', value: '#7B9071' },
  { label: 'Warm Khaki', value: '#958C6B' },
  { label: 'Teal Pine', value: '#4E6E5D' },
];

export const SchedulePage: React.FC = () => {
  const { data, addSchedule, updateSchedule, deleteSchedule } = useStudySpace();
  const currentDay = getCurrentSchoolDay();

  const [selectedDay, setSelectedDay] = useState<'Semua' | SchoolDay>('Semua');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ScheduleItem | null>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const [day, setDay] = useState<SchoolDay>(currentDay ?? 'Senin');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:30');
  const [room, setRoom] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0].value);
  const [formError, setFormError] = useState('');

  const openAddModal = (presetDay?: SchoolDay) => {
    setEditingItem(null);
    setSubject('');
    setTeacher('');
    setDay(presetDay ?? (selectedDay !== 'Semua' ? selectedDay : currentDay ?? 'Senin'));
    setStartTime('07:00');
    setEndTime('08:30');
    setRoom('');
    setColor(COLOR_PALETTE[0].value);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setSubject(item.subject);
    setTeacher(item.teacher || '');
    setDay(item.day);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setRoom(item.room || '');
    setColor(item.color);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setFormError('Nama mata pelajaran wajib diisi.');
      return;
    }
    if (!startTime || !endTime) {
      setFormError('Jam mulai dan jam selesai wajib diisi.');
      return;
    }
    if (endTime <= startTime) {
      setFormError('Jam selesai harus lebih akhir dari jam mulai.');
      return;
    }

    const payload = {
      subject: subject.trim(),
      teacher: teacher.trim() || undefined,
      day,
      startTime,
      endTime,
      room: room.trim() || undefined,
      color,
    };

    if (editingItem) {
      updateSchedule(editingItem.id, payload);
    } else {
      addSchedule(payload);
    }
    setModalOpen(false);
  };

  const visibleDays = useMemo(() => {
    return selectedDay === 'Semua' ? SCHOOL_DAYS : [selectedDay];
  }, [selectedDay]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Jadwal Mata Pelajaran
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Atur jadwal mingguan dari hari Senin hingga Sabtu lengkap dengan ruang kelas dan guru.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAddModal()}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Jadwal</span>
        </button>
      </div>

      {/* Day Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[var(--bg-muted)] overflow-x-auto">
        {(['Semua', ...SCHOOL_DAYS] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSelectedDay(tab)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
              selectedDay === tab
                ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab}
            {tab === currentDay ? ' (Hari Ini)' : ''}
          </button>
        ))}
      </div>

      {/* Schedule Grid */}
      <div
        className={`grid gap-5 ${
          selectedDay === 'Semua'
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            : 'grid-cols-1'
        }`}
      >
        {visibleDays.map((dayName) => {
          const dayItems = data.schedules
            .filter((s) => s.day === dayName)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          const isToday = dayName === currentDay;

          return (
            <section key={dayName} className="study-card p-5 flex flex-col">
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-3.5 border-b border-[var(--border-hairline)]">
                <div>
                  <h3 className="font-display text-base font-bold text-[var(--text-primary)]">
                    {dayName}
                    {isToday && (
                      <span className="ml-2 text-xs font-semibold text-[#344E41] dark:text-[#A3B18A]">
                        · Hari Ini
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {dayItems.length} mata pelajaran
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openAddModal(dayName)}
                  aria-label={`Tambah jadwal hari ${dayName}`}
                  className="min-h-[36px] min-w-[36px] rounded-xl bg-[var(--bg-muted)] hover:bg-[var(--bg-soft)] text-[var(--text-primary)] flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {dayItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                  Belum ada pelajaran dijadwalkan untuk hari {dayName}.
                </div>
              ) : (
                <div className="space-y-3">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full mt-1.5 shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-primary)] leading-snug">
                            {item.subject}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)] mt-1">
                            <span className="inline-flex items-center gap-1 font-mono-num text-[var(--text-secondary)]">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTimeDisplay(
                                item.startTime,
                                data.settings.timeFormat
                              )}{' '}
                              –{' '}
                              {formatTimeDisplay(
                                item.endTime,
                                data.settings.timeFormat
                              )}
                            </span>
                            {item.room && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {item.room}
                              </span>
                            )}
                            {item.teacher && (
                              <span className="inline-flex items-center gap-1">
                                <User className="w-3.5 h-3.5" />
                                {item.teacher}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          aria-label={`Edit ${item.subject}`}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          aria-label={`Hapus ${item.subject}`}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Add / Edit Schedule Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Jadwal Pelajaran' : 'Tambah Jadwal Pelajaran'}
        subtitle="Lengkapi informasi mata pelajaran dan jam belajar."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium dark:bg-red-950/60 dark:text-red-200 dark:border-red-900">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Nama Mata Pelajaran *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Contoh: Matematika Peminatan"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Hari *
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as SchoolDay)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
              >
                {SCHOOL_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Ruang Kelas (Opsional)
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Contoh: Ruang XII-A / Lab"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Jam Mulai *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Jam Selesai *
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Nama Guru (Opsional)
            </label>
            <input
              type="text"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              placeholder="Contoh: Ibu Ratna Sari, M.Pd"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-2">
              Warna Kategori
            </label>
            <div className="flex flex-wrap items-center gap-2.5">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  aria-label={c.label}
                  className={`w-9 h-9 rounded-xl transition-transform ${
                    color === c.value
                      ? 'ring-2 ring-offset-2 ring-[#344E41] scale-105'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--bg-soft)] min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#344E41] hover:bg-[#2A3F34] min-h-[44px]"
            >
              {editingItem ? 'Simpan Perubahan' : 'Simpan Jadwal'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) deleteSchedule(deletingItem.id);
        }}
        title="Hapus Jadwal"
        message={`Hapus mata pelajaran "${deletingItem?.subject}" pada hari ${deletingItem?.day}?`}
      />
    </div>
  );
};
