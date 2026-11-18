import React, { useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  ListTodo,
  Menu,
  Plus,
  Settings,
  Timer,
} from 'lucide-react';
import { useStudySpace } from '../context/StudySpaceContext';
import type { NavPage } from '../types/studyspace';
import { Modal } from './Modal';
import { RemindersDrawer } from './RemindersDrawer';
import { TaskFormModal } from './TaskFormModal';

interface NavItem {
  id: NavPage;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Beranda', icon: LayoutDashboard },
  { id: 'tugas', label: 'Tugas', shortLabel: 'Tugas', icon: ClipboardList },
  { id: 'jadwal', label: 'Jadwal', shortLabel: 'Jadwal', icon: CalendarClock },
  { id: 'kalender', label: 'Kalender', shortLabel: 'Kalender', icon: Calendar },
  { id: 'catatan', label: 'Catatan', shortLabel: 'Catatan', icon: BookOpen },
  { id: 'produktivitas', label: 'Produktivitas', shortLabel: 'Fokus', icon: BarChart3 },
  { id: 'todo', label: 'To-Do Harian', shortLabel: 'To-Do', icon: ListTodo },
  { id: 'pengaturan', label: 'Pengaturan', shortLabel: 'Setelan', icon: Settings },
];

const MOBILE_PRIMARY_IDS: NavPage[] = ['dashboard', 'tugas', 'jadwal', 'todo'];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    data,
    activePage,
    setActivePage,
    setProductivityTab,
    reminders,
    quickCreateTaskOpen,
    setQuickCreateTaskOpen,
    timerStatus,
    timerRemainingSeconds,
  } = useStudySpace();

  const [remindersOpen, setRemindersOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentNav = NAV_ITEMS.find((n) => n.id === activePage) ?? NAV_ITEMS[0];
  const mins = Math.floor(timerRemainingSeconds / 60);
  const secs = timerRemainingSeconds % 60;
  const timerFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] z-30">
        <div className="px-6 pt-6 pb-5 border-b border-[var(--border-hairline)]">
          <button
            type="button"
            onClick={() => setActivePage('dashboard')}
            className="flex items-center gap-3 text-left w-full group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#344E41] text-[#F8F8F2] flex items-center justify-center shrink-0 shadow-sm">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)] block leading-tight whitespace-nowrap">
                StudySpace
              </span>
              <span className="text-xs text-[var(--text-muted)] block truncate">
                Personal School Organizer
              </span>
            </div>
          </button>
        </div>

        <nav className="flex-1 px-3.5 py-4 space-y-1 overflow-y-auto" aria-label="Menu utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-[#344E41] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.id === 'tugas' &&
                  data.tasks.filter((t) => t.status !== 'selesai').length > 0 && (
                    <span
                      className={`ml-auto text-xs font-mono-num tabular-nums ${
                        isActive ? 'text-[#DDE5D2]' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {data.tasks.filter((t) => t.status !== 'selesai').length}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>

        {/* Active Pomodoro quick jump in sidebar if running/paused */}
        {timerStatus !== 'idle' && (
          <div className="px-3.5 pb-3">
            <button
              type="button"
              onClick={() => {
                setActivePage('produktivitas');
                setProductivityTab('timer');
              }}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[var(--bg-soft)] text-[var(--text-primary)] hover:opacity-90 transition-opacity"
            >
              <span className="flex items-center gap-2 text-xs font-semibold">
                <Timer className="w-4 h-4 text-[#344E41] dark:text-[#A3B18A]" />
                <span>{timerStatus === 'running' ? 'Fokus Berjalan' : 'Timer Dijeda'}</span>
              </span>
              <span className="font-mono-num text-xs font-semibold">
                {timerFormatted}
              </span>
            </button>
          </div>
        )}

        <div className="px-5 py-4 border-t border-[var(--border-hairline)]">
          <p className="text-xs text-[var(--text-muted)] truncate">
            Ruang Belajar <span className="font-semibold text-[var(--text-primary)]">{data.settings.nickname}</span>
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 h-14 lg:h-16 bg-[var(--bg-canvas)]/90 backdrop-blur-md border-b border-[var(--border-hairline)] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg:hidden w-8 h-8 rounded-xl bg-[#344E41] text-[#F8F8F2] flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h1 className="font-display text-base sm:text-lg font-semibold text-[var(--text-primary)] truncate">
              {currentNav.label}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {timerStatus !== 'idle' && (
              <button
                type="button"
                onClick={() => {
                  setActivePage('produktivitas');
                  setProductivityTab('timer');
                }}
                className="lg:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[var(--bg-soft)] text-xs font-mono-num font-semibold text-[var(--text-primary)]"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{timerFormatted}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setRemindersOpen(true)}
              aria-label="Buka pengingat akademik"
              className="relative min-h-[40px] min-w-[40px] px-2.5 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)] transition-colors"
            >
              <Bell className="w-4 h-4" />
              {reminders.length > 0 && (
                <span className="text-xs font-mono-num font-semibold text-red-600 dark:text-red-400">
                  {reminders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setQuickCreateTaskOpen(true)}
              className="min-h-[40px] px-3.5 sm:px-4 py-2 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah Tugas</span>
              <span className="sm:hidden">Tugas</span>
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Navigasi bawah"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--bg-surface)]/95 backdrop-blur-md border-t border-[var(--border-hairline)] pb-safe"
      >
        <div className="grid grid-cols-5 h-16 items-center">
          {MOBILE_PRIMARY_IDS.map((id) => {
            const item = NAV_ITEMS.find((n) => n.id === id)!;
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] gap-1 transition-colors ${
                  isActive
                    ? 'text-[#344E41] dark:text-[#A3B18A] font-semibold'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] leading-none whitespace-nowrap">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center min-h-[44px] gap-1 transition-colors ${
              !MOBILE_PRIMARY_IDS.includes(activePage)
                ? 'text-[#344E41] dark:text-[#A3B18A] font-semibold'
                : 'text-[var(--text-muted)]'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[11px] leading-none whitespace-nowrap">Menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Secondary Menu Bottom Sheet */}
      <Modal
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        title="Menu StudySpace"
        subtitle="Pilih halaman lain yang ingin kamu buka."
      >
        <div className="grid grid-cols-2 gap-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActivePage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-colors min-h-[52px] ${
                  isActive
                    ? 'bg-[#344E41] text-white border-[#344E41]'
                    : 'bg-[var(--bg-canvas)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:bg-[var(--bg-muted)]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </Modal>

      <RemindersDrawer open={remindersOpen} onClose={() => setRemindersOpen(false)} />
      <TaskFormModal
        open={quickCreateTaskOpen}
        onClose={() => setQuickCreateTaskOpen(false)}
      />
    </div>
  );
};
