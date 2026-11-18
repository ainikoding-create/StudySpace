import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Download,
  Info,
  Palette,
  Trash2,
  Upload,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useStudySpace } from '../context/StudySpaceContext';
import type { AppTheme } from '../types/studyspace';

export const SettingsPage: React.FC = () => {
  const {
    data,
    updateSettings,
    exportDataJson,
    importDataJson,
    clearAllData,
    showToast,
  } = useStudySpace();

  const [nickname, setNickname] = useState(data.settings.nickname);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setNickname(data.settings.nickname);
  }, [data.settings.nickname]);

  const browserNotifSupported =
    typeof window !== 'undefined' && 'Notification' in window;
  const notifPermission = browserNotifSupported
    ? Notification.permission
    : 'unsupported';

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      showToast('Nama panggilan tidak boleh kosong.', 'error');
      return;
    }
    updateSettings({ nickname: nickname.trim() });
  };

  const handleToggleBrowserNotification = async () => {
    if (!browserNotifSupported) {
      showToast('Browser ini tidak mendukung Web Notification API.', 'warning');
      return;
    }

    if (data.settings.browserNotifications) {
      updateSettings({ browserNotifications: false });
      return;
    }

    if (Notification.permission === 'granted') {
      updateSettings({ browserNotifications: true });
      return;
    }

    if (Notification.permission === 'denied') {
      showToast(
        'Izin notifikasi ditolak di browser. Aktifkan melalui pengaturan situs browser.',
        'warning'
      );
      return;
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        updateSettings({ browserNotifications: true });
        new Notification('StudySpace Aktif', {
          body: 'Notifikasi browser berhasil diaktifkan untuk pengingat belajar.',
        });
      } else {
        showToast('Izin notifikasi tidak diberikan.', 'info');
      }
    } catch {
      showToast('Gagal meminta izin notifikasi browser.', 'error');
    }
  };

  const handleTestNotification = () => {
    if (!browserNotifSupported || Notification.permission !== 'granted') {
      showToast('Aktifkan notifikasi browser terlebih dahulu.', 'warning');
      return;
    }
    new Notification('Pengingat StudySpace', {
      body: `Halo ${data.settings.nickname}, jangan lupa cek deadline tugasmu hari ini.`,
    });
    showToast('Notifikasi percobaan dikirim.');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const ok = importDataJson(reader.result);
        if (ok) {
          setNickname(data.settings.nickname);
        }
      }
    };
    reader.onerror = () => {
      showToast('Gagal membaca file yang dipilih.', 'error');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
          Pengaturan
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Sesuaikan profil pelajar, tema tampilan, format waktu, notifikasi, dan cadangan data.
        </p>
      </div>

      {/* Profil & Format Waktu */}
      <section className="study-card p-5 sm:p-6 space-y-5">
        <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
          Preferensi Pengguna
        </h3>

        <form onSubmit={handleSaveNickname} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Nama Panggilan
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Contoh: Syifa / Raka"
              maxLength={40}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>
          <div className="sm:self-end">
            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold transition-colors"
            >
              Simpan Nama
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Format Waktu
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Berlaku untuk jam pada Dashboard, Jadwal, Kalender, dan Riwayat.
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-muted)] w-fit">
            {(
              [
                { id: '24h', label: '24 Jam' },
                { id: '12h', label: '12 Jam (AM/PM)' },
              ] as const
            ).map((fmt) => (
              <button
                key={fmt.id}
                type="button"
                onClick={() => updateSettings({ timeFormat: fmt.id })}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  data.settings.timeFormat === fmt.id
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tema Aplikasi */}
      <section className="study-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#344E41] dark:text-[#A3B18A]" />
          <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
            Tema Aplikasi
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              {
                id: 'sage',
                name: 'Sage Cream (Default)',
                desc: 'Krem lembut dengan aksen Sage Green',
                swatches: ['#F8F8F2', '#DDE5D2', '#A3B18A', '#344E41'],
              },
              {
                id: 'botanical',
                name: 'Soft Botanical',
                desc: 'Nuansa daun hijau lebih segar',
                swatches: ['#F3F6EE', '#D3DFC5', '#8FA376', '#2B4236'],
              },
              {
                id: 'dark',
                name: 'Dark Forest',
                desc: 'Mode gelap nyaman untuk belajar malam',
                swatches: ['#131B17', '#1B2620', '#26362E', '#A3B18A'],
              },
            ] as {
              id: AppTheme;
              name: string;
              desc: string;
              swatches: string[];
            }[]
          ).map((theme) => {
            const active = data.settings.theme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => updateSettings({ theme: theme.id })}
                className={`p-4 rounded-2xl border text-left transition-colors ${
                  active
                    ? 'border-[#344E41] bg-[var(--bg-soft)]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-muted)]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-2.5">
                  {theme.swatches.map((hex) => (
                    <span
                      key={hex}
                      className="w-5 h-5 rounded-full border border-black/10"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {theme.name}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {theme.desc}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Pengaturan Notifikasi */}
      <section className="study-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#344E41] dark:text-[#A3B18A]" />
          <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
            Pengingat & Notifikasi
          </h3>
        </div>

        <div className="divide-y divide-[var(--border-hairline)]">
          <div className="py-3 first:pt-0 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Pengingat Visual Dalam Aplikasi
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Tampilkan peringatan tugas terlambat, deadline dekat, ujian, dan agenda hari ini.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateSettings({
                  visualReminders: !data.settings.visualReminders,
                })
              }
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 ${
                data.settings.visualReminders
                  ? 'bg-[#344E41] text-white'
                  : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]'
              }`}
            >
              {data.settings.visualReminders ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>

          <div className="py-3 last:pb-0 space-y-2.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Notifikasi Browser
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  Status izin: <span className="font-semibold">{notifPermission}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {data.settings.browserNotifications &&
                  notifPermission === 'granted' && (
                    <button
                      type="button"
                      onClick={handleTestNotification}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--bg-soft)]"
                    >
                      Tes
                    </button>
                  )}
                <button
                  type="button"
                  onClick={handleToggleBrowserNotification}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    data.settings.browserNotifications
                      ? 'bg-[#344E41] text-white'
                      : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]'
                  }`}
                >
                  {data.settings.browserNotifications ? 'Aktif' : 'Aktifkan'}
                </button>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-canvas)] p-3 rounded-xl border border-[var(--border-hairline)]">
              Catatan: Notifikasi browser hanya muncul saat aplikasi StudySpace terbuka di browser dan fitur notifikasi didukung oleh perangkatmu.
            </p>
          </div>
        </div>
      </section>

      {/* Manajemen Data LocalStorage */}
      <section className="study-card p-5 sm:p-6 space-y-4">
        <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
          Cadangan & Penyimpanan Data
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Semua data StudySpace tersimpan secara lokal di browser (Local Storage) tanpa akun atau server eksternal. Ekspor cadangan secara berkala agar datamu tetap aman.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportDataJson}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Data (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--bg-soft)] hover:bg-[#CFDAB9] dark:hover:bg-[#31453B] text-[var(--text-primary)] text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Impor Data (JSON)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileImport}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-sm font-semibold flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/70 transition-colors sm:ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua Data</span>
          </button>
        </div>
      </section>

      {/* Tentang Aplikasi */}
      <section className="study-card p-5 sm:p-6 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#344E41] dark:text-[#A3B18A]" />
          <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">
            Tentang StudySpace
          </h3>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-[var(--text-primary)]">StudySpace — Your Personal School Organizer</strong> adalah pendamping belajar pribadi untuk pelajar guna mengelola tugas, jadwal mata pelajaran, kalender akademik, catatan pelajaran, Study Timer Pomodoro, countdown ujian, dan to-do harian secara praktis dengan penyimpanan lokal yang aman.
        </p>
      </section>

      <ConfirmDialog
        open={confirmClearOpen}
        onClose={() => setConfirmClearOpen(false)}
        onConfirm={clearAllData}
        title="Hapus Seluruh Data StudySpace?"
        message="Semua tugas, jadwal pelajaran, agenda kalender, catatan, countdown ujian, to-do, riwayat belajar, dan pengaturan akan dihapus permanen dari browser ini. Pastikan kamu sudah mengekspor cadangan JSON jika masih membutuhkannya."
        confirmLabel="Ya, Hapus Semua"
      />
    </div>
  );
};
