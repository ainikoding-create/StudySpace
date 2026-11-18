import React from 'react';
import {
  AlertTriangle,
  BellOff,
  CalendarDays,
  ChevronRight,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { useStudySpace } from '../context/StudySpaceContext';
import { Modal } from './Modal';

interface RemindersDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const RemindersDrawer: React.FC<RemindersDrawerProps> = ({
  open,
  onClose,
}) => {
  const { reminders, data, setActivePage, setProductivityTab } = useStudySpace();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pengingat Akademik"
      subtitle="Ringkasan tugas terlambat, deadline dekat, ujian, dan agenda hari ini."
    >
      {!data.settings.visualReminders ? (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--bg-muted)] mx-auto flex items-center justify-center text-[var(--text-muted)]">
            <BellOff className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Pengingat visual sedang dinonaktifkan
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Aktifkan kembali di menu Pengaturan untuk melihat pengingat deadline dan jadwal.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              setActivePage('pengaturan');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#344E41] text-white"
          >
            Buka Pengaturan
          </button>
        </div>
      ) : reminders.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Semua terkendali dengan baik!
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Tidak ada tugas terlambat, deadline mendesak, atau ujian dalam waktu dekat.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reminders.map((rem) => {
            const Icon =
              rem.type === 'overdue'
                ? AlertTriangle
                : rem.type === 'near_deadline'
                ? Clock
                : rem.type === 'exam'
                ? GraduationCap
                : CalendarDays;

            return (
              <button
                key={rem.id}
                type="button"
                onClick={() => {
                  setActivePage(rem.targetPage);
                  if (rem.targetTab) setProductivityTab(rem.targetTab);
                  onClose();
                }}
                className="w-full text-left flex items-center gap-3.5 p-3.5 rounded-2xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)] transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    rem.urgency === 'high'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300'
                      : rem.urgency === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                      : 'bg-[var(--bg-soft)] text-[var(--accent-dark)]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {rem.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    {rem.subtitle}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
};
