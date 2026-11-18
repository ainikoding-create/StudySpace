import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Edit3,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TaskFormModal } from '../components/TaskFormModal';
import { useStudySpace } from '../context/StudySpaceContext';
import type { Task, TaskStatus } from '../types/studyspace';
import {
  formatIndonesianDate,
  formatTimeDisplay,
  getDaysDiffFromToday,
  getDeadlineBadgeText,
} from '../utils/date';

const STATUS_LABELS: Record<TaskStatus, string> = {
  belum_dikerjakan: 'Belum Dikerjakan',
  proses: 'Proses',
  selesai: 'Selesai',
};

export const TasksPage: React.FC = () => {
  const { data, toggleTaskStatus, deleteTask } = useStudySpace();

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('semua');
  const [statusFilter, setStatusFilter] = useState<'semua' | TaskStatus>('semua');
  const [sortBy, setSortBy] = useState<'deadline_asc' | 'deadline_desc' | 'priority'>(
    'deadline_asc'
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const subjects = useMemo(() => {
    const unique = Array.from(
      new Set(data.tasks.map((t) => t.subject).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return unique;
  }, [data.tasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const priorityRank = { tinggi: 0, sedang: 1, rendah: 2 };

    return data.tasks
      .filter((t) => {
        if (subjectFilter !== 'semua' && t.subject !== subjectFilter) return false;
        if (statusFilter !== 'semua' && t.status !== statusFilter) return false;
        if (
          q &&
          !t.title.toLowerCase().includes(q) &&
          !t.subject.toLowerCase().includes(q) &&
          !t.description.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'deadline_asc') {
          if (a.status === 'selesai' && b.status !== 'selesai') return 1;
          if (a.status !== 'selesai' && b.status === 'selesai') return -1;
          return a.deadline.localeCompare(b.deadline);
        }
        if (sortBy === 'deadline_desc') {
          return b.deadline.localeCompare(a.deadline);
        }
        return priorityRank[a.priority] - priorityRank[b.priority];
      });
  }, [data.tasks, search, subjectFilter, statusFilter, sortBy]);

  const overdueTasks = data.tasks.filter(
    (t) => t.status !== 'selesai' && getDaysDiffFromToday(t.deadline) < 0
  );
  const nearDeadlineTasks = data.tasks.filter((t) => {
    const diff = getDaysDiffFromToday(t.deadline);
    return t.status !== 'selesai' && diff >= 0 && diff <= 2;
  });

  return (
    <div className="space-y-6">
      {/* Header & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Pengingat Tugas
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Pantau status pengerjaan, prioritas, dan tenggat waktu setiap tugas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setFormOpen(true);
          }}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Tugas</span>
        </button>
      </div>

      {/* Warning Banners */}
      {(overdueTasks.length > 0 || nearDeadlineTasks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {overdueTasks.length > 0 && (
            <div className="study-card p-4 bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-900 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                  {overdueTasks.length} tugas melewati deadline
                </p>
                <p className="text-xs text-red-700/80 dark:text-red-300/80 truncate">
                  {overdueTasks.map((t) => t.title).join(', ')}
                </p>
              </div>
            </div>
          )}

          {nearDeadlineTasks.length > 0 && (
            <div className="study-card p-4 bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {nearDeadlineTasks.length} tugas mendekati deadline
                </p>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 truncate">
                  Tenggat dalam 2 hari ke depan
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search, Filters & Sort */}
      <section className="study-card p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama tugas atau mapel..."
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filter mata pelajaran"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            >
              <option value="semua">Semua Mata Pelajaran</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as 'deadline_asc' | 'deadline_desc' | 'priority'
                )
              }
              aria-label="Urutkan tugas"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            >
              <option value="deadline_asc">Deadline Terdekat</option>
              <option value="deadline_desc">Deadline Terjauh</option>
              <option value="priority">Prioritas Tertinggi</option>
            </select>
          </div>
        </div>

        {/* Status Segmented Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-muted)] w-fit">
          {(
            [
              { id: 'semua', label: 'Semua' },
              { id: 'belum_dikerjakan', label: 'Belum Dikerjakan' },
              { id: 'proses', label: 'Proses' },
              { id: 'selesai', label: 'Selesai' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="study-card p-10 text-center space-y-3">
          <p className="font-display text-base font-semibold text-[var(--text-primary)]">
            {data.tasks.length === 0
              ? 'Belum ada tugas yang dicatat'
              : 'Tidak ada tugas yang cocok dengan filter'}
          </p>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            {data.tasks.length === 0
              ? 'Tambahkan tugas sekolah pertamamu untuk mulai memantau tenggat waktu dan prioritas.'
              : 'Coba ubah kata kunci pencarian atau filter mata pelajaran.'}
          </p>
          {data.tasks.length === 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setFormOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-[#344E41] text-white text-sm font-semibold"
            >
              Tambah Tugas Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'selesai';
            const diff = getDaysDiffFromToday(task.deadline);
            const isOverdue = !isDone && diff < 0;
            const isNear = !isDone && diff >= 0 && diff <= 2;

            return (
              <article
                key={task.id}
                className={`study-card p-5 transition-opacity ${
                  isDone ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task.id)}
                      aria-label={
                        isDone
                          ? `Tandai ${task.title} belum selesai`
                          : `Tandai ${task.title} selesai`
                      }
                      className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                        isDone
                          ? 'bg-[#344E41] border-[#344E41] text-white'
                          : 'border-[#A3B18A] hover:border-[#344E41] text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <h3
                        className={`font-display text-base font-semibold leading-snug ${
                          isDone
                            ? 'line-through text-[var(--text-muted)]'
                            : 'text-[var(--text-primary)]'
                        }`}
                      >
                        {task.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)] mt-1">
                        <span className="font-semibold text-[var(--text-secondary)]">
                          {task.subject}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">
                          Prioritas {task.priority}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          Diberikan {formatIndonesianDate(task.assignedDate, { shortMonth: true })}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold inline-flex items-center gap-1 ${
                            isOverdue
                              ? 'text-red-600 dark:text-red-400'
                              : isNear
                              ? 'text-amber-700 dark:text-amber-400'
                              : isDone
                              ? 'text-[#344E41] dark:text-[#A3B18A]'
                              : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                          {isDone
                            ? `Selesai · Deadline ${formatIndonesianDate(task.deadline, { shortMonth: true })}`
                            : `${getDeadlineBadgeText(task.deadline)}${
                                task.deadlineTime
                                  ? ` (${formatTimeDisplay(
                                      task.deadlineTime,
                                      data.settings.timeFormat
                                    )})`
                                  : ''
                              }`}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-[var(--text-secondary)] mt-2.5 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        toggleTaskStatus(task.id, e.target.value as TaskStatus)
                      }
                      aria-label={`Ubah status ${task.title}`}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-muted)] text-[var(--text-primary)] border border-[var(--border-hairline)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
                    >
                      {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {STATUS_LABELS[st]}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTask(task);
                          setFormOpen(true);
                        }}
                        aria-label={`Edit ${task.title}`}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTask(task)}
                        aria-label={`Hapus ${task.title}`}
                        className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <TaskFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingTask(null);
        }}
        editingTask={editingTask}
      />

      <ConfirmDialog
        open={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={() => {
          if (deletingTask) deleteTask(deletingTask.id);
        }}
        title="Hapus Tugas"
        message={`Apakah kamu yakin ingin menghapus tugas "${deletingTask?.title}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
};
