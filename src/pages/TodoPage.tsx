import React, { useMemo, useState } from 'react';
import { Check, Edit3, Plus, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { useStudySpace } from '../context/StudySpaceContext';
import type { PriorityLevel, TodoCategory, TodoItem } from '../types/studyspace';
import {
  addDaysToKey,
  formatIndonesianDate,
  getTodayKey,
} from '../utils/date';

const CATEGORIES: TodoCategory[] = [
  'Belajar',
  'Tugas',
  'Pribadi',
  'Organisasi',
  'Kesehatan',
];

export const TodoPage: React.FC = () => {
  const { data, addTodo, updateTodo, toggleTodo, deleteTodo } = useStudySpace();
  const todayKey = getTodayKey();
  const tomorrowKey = addDaysToKey(todayKey, 1);

  const [dateFilter, setDateFilter] = useState<string>(todayKey);
  const [showAllDates, setShowAllDates] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<TodoItem | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TodoCategory>('Belajar');
  const [priority, setPriority] = useState<PriorityLevel>('sedang');
  const [date, setDate] = useState(todayKey);
  const [formError, setFormError] = useState('');

  const openAdd = () => {
    setEditingTodo(null);
    setTitle('');
    setCategory('Belajar');
    setPriority('sedang');
    setDate(showAllDates ? todayKey : dateFilter);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item: TodoItem) => {
    setEditingTodo(item);
    setTitle(item.title);
    setCategory(item.category);
    setPriority(item.priority);
    setDate(item.date);
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Judul aktivitas harian wajib diisi.');
      return;
    }
    if (!date) {
      setFormError('Tanggal aktivitas wajib dipilih.');
      return;
    }

    if (editingTodo) {
      updateTodo(editingTodo.id, {
        title: title.trim(),
        category,
        priority,
        date,
      });
    } else {
      addTodo({
        title: title.trim(),
        category,
        priority,
        date,
        completed: false,
      });
    }
    setModalOpen(false);
  };

  const filteredTodos = useMemo(() => {
    const priorityRank = { tinggi: 0, sedang: 1, rendah: 2 };
    return data.todos
      .filter((td) => (showAllDates ? true : td.date === dateFilter))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return priorityRank[a.priority] - priorityRank[b.priority];
      });
  }, [data.todos, dateFilter, showAllDates]);

  const incompleteTodos = filteredTodos.filter((td) => !td.completed);
  const completedTodos = filteredTodos.filter((td) => td.completed);
  const progressPercent =
    filteredTodos.length > 0
      ? Math.round((completedTodos.length / filteredTodos.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            To-Do Harian
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Checklist aktivitas harian agar target belajar dan kegiatanmu tetap terarah.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Aktivitas</span>
        </button>
      </div>

      {/* Filter Date & Progress Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className="lg:col-span-7 study-card p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAllDates(false);
                setDateFilter(todayKey);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                !showAllDates && dateFilter === todayKey
                  ? 'bg-[#344E41] text-white'
                  : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAllDates(false);
                setDateFilter(tomorrowKey);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                !showAllDates && dateFilter === tomorrowKey
                  ? 'bg-[#344E41] text-white'
                  : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Besok
            </button>
            <button
              type="button"
              onClick={() => setShowAllDates(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                showAllDates
                  ? 'bg-[#344E41] text-white'
                  : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Semua Tanggal
            </button>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                if (e.target.value) {
                  setShowAllDates(false);
                  setDateFilter(e.target.value);
                }
              }}
              aria-label="Pilih tanggal filter to-do"
              className="ml-auto px-3 py-1.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-primary)]"
            />
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Menampilkan aktivitas untuk:{' '}
            <span className="font-semibold text-[var(--text-primary)]">
              {showAllDates
                ? 'Semua tanggal'
                : formatIndonesianDate(dateFilter, { withWeekday: true })}
            </span>
          </p>
        </section>

        <section className="lg:col-span-5 study-card p-5 flex flex-col justify-between">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-semibold text-[var(--text-muted)]">
              Progress Harian
            </span>
            <span className="font-display text-2xl font-bold tabular-nums text-[#344E41] dark:text-[#A3B18A]">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[var(--bg-muted)] my-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#344E41] dark:bg-[#A3B18A] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] tabular-nums">
            {completedTodos.length} selesai dari {filteredTodos.length} aktivitas
          </p>
        </section>
      </div>

      {/* Separated Incomplete & Completed Sections */}
      {filteredTodos.length === 0 ? (
        <div className="study-card p-10 text-center space-y-3">
          <p className="font-display text-base font-semibold text-[var(--text-primary)]">
            Belum ada aktivitas pada tanggal ini
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Tambahkan target kecil agar harimu lebih produktif dan terstruktur.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2.5 rounded-xl bg-[#344E41] text-white text-sm font-semibold"
          >
            Tambah Aktivitas Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Belum Selesai */}
          <section className="study-card p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-hairline)]">
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                Belum Selesai
              </h3>
              <span className="font-mono-num text-xs font-semibold text-[var(--text-muted)]">
                {incompleteTodos.length}
              </span>
            </div>

            {incompleteTodos.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-6 text-center">
                Semua aktivitas telah diselesaikan!
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-hairline)]">
                {incompleteTodos.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTodo(item.id)}
                        aria-label={`Tandai ${item.title} selesai`}
                        className="mt-0.5 w-6 h-6 rounded-lg border border-[#A3B18A] hover:border-[#344E41] flex items-center justify-center text-transparent shrink-0 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {item.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                          <span>{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={`capitalize font-medium ${
                              item.priority === 'tinggi'
                                ? 'text-red-600 dark:text-red-400'
                                : ''
                            }`}
                          >
                            Prioritas {item.priority}
                          </span>
                          {showAllDates && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                {formatIndonesianDate(item.date, { shortMonth: true })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        aria-label={`Edit ${item.title}`}
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTodo(item)}
                        aria-label={`Hapus ${item.title}`}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Selesai */}
          <section className="study-card p-5 sm:p-6">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-hairline)]">
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
                Selesai
              </h3>
              <span className="font-mono-num text-xs font-semibold text-[#344E41] dark:text-[#A3B18A]">
                {completedTodos.length}
              </span>
            </div>

            {completedTodos.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] py-6 text-center">
                Belum ada aktivitas yang dicentang selesai.
              </p>
            ) : (
              <div className="divide-y divide-[var(--border-hairline)]">
                {completedTodos.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 opacity-80"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTodo(item.id)}
                        aria-label={`Batalkan selesai ${item.title}`}
                        className="mt-0.5 w-6 h-6 rounded-lg bg-[#344E41] border border-[#344E41] text-white flex items-center justify-center shrink-0 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold line-through text-[var(--text-muted)]">
                          {item.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-muted)] mt-0.5">
                          <span>{item.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">Prioritas {item.priority}</span>
                          {showAllDates && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>
                                {formatIndonesianDate(item.date, { shortMonth: true })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDeletingTodo(item)}
                      aria-label={`Hapus ${item.title}`}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal Form */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTodo ? 'Edit Aktivitas Harian' : 'Tambah Aktivitas Harian'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium dark:bg-red-950/60 dark:text-red-200 dark:border-red-900">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Nama Aktivitas *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Review materi Biologi selama 30 menit"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TodoCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Tanggal *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Prioritas
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--bg-muted)]">
              {(['rendah', 'sedang', 'tinggi'] as PriorityLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  className={`py-2 px-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    priority === level
                      ? 'bg-[#344E41] text-white shadow-sm'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
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
              {editingTodo ? 'Simpan Perubahan' : 'Tambah Aktivitas'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deletingTodo}
        onClose={() => setDeletingTodo(null)}
        onConfirm={() => {
          if (deletingTodo) deleteTodo(deletingTodo.id);
        }}
        title="Hapus Aktivitas"
        message={`Hapus aktivitas "${deletingTodo?.title}" dari daftar To-Do Harian?`}
      />
    </div>
  );
};
