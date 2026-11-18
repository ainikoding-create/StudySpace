import React, { useEffect, useState } from 'react';
import { useStudySpace } from '../context/StudySpaceContext';
import type { PriorityLevel, Task, TaskStatus } from '../types/studyspace';
import { getTodayKey } from '../utils/date';
import { Modal } from './Modal';

interface TaskFormModalProps {
  open: boolean;
  onClose: () => void;
  editingTask?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  open,
  onClose,
  editingTask,
}) => {
  const { addTask, updateTask, showToast } = useStudySpace();
  const today = getTodayKey();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [assignedDate, setAssignedDate] = useState(today);
  const [deadline, setDeadline] = useState(today);
  const [deadlineTime, setDeadlineTime] = useState('23:59');
  const [priority, setPriority] = useState<PriorityLevel>('sedang');
  const [status, setStatus] = useState<TaskStatus>('belum_dikerjakan');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (editingTask) {
      setTitle(editingTask.title);
      setSubject(editingTask.subject);
      setDescription(editingTask.description);
      setAssignedDate(editingTask.assignedDate);
      setDeadline(editingTask.deadline);
      setDeadlineTime(editingTask.deadlineTime || '23:59');
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
    } else {
      setTitle('');
      setSubject('');
      setDescription('');
      setAssignedDate(today);
      setDeadline(today);
      setDeadlineTime('23:59');
      setPriority('sedang');
      setStatus('belum_dikerjakan');
    }
  }, [open, editingTask, today]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Nama tugas wajib diisi.');
      return;
    }
    if (!subject.trim()) {
      setError('Mata pelajaran wajib diisi.');
      return;
    }
    if (!deadline) {
      setError('Tanggal deadline wajib dipilih.');
      return;
    }
    if (assignedDate && deadline < assignedDate) {
      setError('Tanggal deadline tidak boleh lebih awal dari tanggal pemberian.');
      return;
    }

    const payload = {
      title: title.trim(),
      subject: subject.trim(),
      description: description.trim(),
      assignedDate: assignedDate || today,
      deadline,
      deadlineTime: deadlineTime || undefined,
      priority,
      status,
    };

    if (editingTask) {
      updateTask(editingTask.id, payload);
    } else {
      addTask(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTask ? 'Edit Tugas' : 'Tambah Tugas Baru'}
      subtitle="Catat detail tugas agar tidak terlewat dari deadline."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="px-3.5 py-2.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-medium dark:bg-red-950/60 dark:text-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Nama Tugas *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Latihan Soal Turunan Trigonometri"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            maxLength={120}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Mata Pelajaran *
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Contoh: Matematika Peminatan"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            maxLength={60}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
            Deskripsi / Catatan Tugas
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Tulis rincian halaman buku, instruksi guru, atau ketentuan pengumpulan..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Tanggal Pemberian
            </label>
            <input
              type="date"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Deadline *
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Jam Deadline
            </label>
            <input
              type="time"
              value={deadlineTime}
              onChange={(e) => setDeadlineTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            >
              <option value="belum_dikerjakan">Belum Dikerjakan</option>
              <option value="proses">Sedang Dikerjakan</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              showToast('Pengisian tugas dibatalkan.', 'info');
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--bg-soft)] transition-colors min-h-[44px]"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#344E41] hover:bg-[#2A3F34] transition-colors min-h-[44px]"
          >
            {editingTask ? 'Simpan Perubahan' : 'Simpan Tugas'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
