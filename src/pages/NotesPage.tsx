import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Pin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useStudySpace } from '../context/StudySpaceContext';
import type { NoteCategory } from '../types/studyspace';
import { formatIndonesianDate, getTodayKey } from '../utils/date';

const NOTE_CATEGORIES: NoteCategory[] = [
  'Materi',
  'Ringkasan',
  'Rumus',
  'Latihan',
  'Lainnya',
];

export const NotesPage: React.FC = () => {
  const {
    data,
    addNote,
    updateNote,
    deleteNote,
    quickCreateNoteTrigger,
    showToast,
  } = useStudySpace();

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('semua');
  const [pinnedOnly, setPinnedOnly] = useState(false);

  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    () => data.notes[0]?.id ?? null
  );
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // Editor draft fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<NoteCategory>('Materi');
  const [date, setDate] = useState(getTodayKey());
  const [content, setContent] = useState('');
  const [saveLabel, setSaveLabel] = useState('');
  const autosaveTimerRef = useRef<number | null>(null);
  const lastHandledTriggerRef = useRef(0);

  const activeNote = useMemo(
    () => data.notes.find((n) => n.id === activeNoteId) ?? null,
    [data.notes, activeNoteId]
  );

  // Load selected note into editor
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setSubject(activeNote.subject);
      setCategory(activeNote.category);
      setDate(activeNote.date);
      setContent(activeNote.content);
      setSaveLabel('');
    }
  }, [activeNote?.id]);

  // Create a new note cleanly
  const handleCreateNewNote = () => {
    const created = addNote({
      title: 'Catatan Baru',
      subject: subjectFilter !== 'semua' ? subjectFilter : 'Umum',
      category: 'Materi',
      date: getTodayKey(),
      content: '',
      isPinned: false,
    });
    setActiveNoteId(created.id);
    setTitle(created.title);
    setSubject(created.subject);
    setCategory(created.category);
    setDate(created.date);
    setContent(created.content);
    setSaveLabel('Siap ditulis · Autosave aktif');
  };

  // Support quick-add from Dashboard
  useEffect(() => {
    if (
      quickCreateNoteTrigger > 0 &&
      quickCreateNoteTrigger !== lastHandledTriggerRef.current
    ) {
      lastHandledTriggerRef.current = quickCreateNoteTrigger;
      handleCreateNewNote();
    }
  }, [quickCreateNoteTrigger]);

  // Debounced autosave whenever user edits active note
  const scheduleAutosave = (
    noteId: string,
    patch: {
      title: string;
      subject: string;
      category: NoteCategory;
      date: string;
      content: string;
    }
  ) => {
    setSaveLabel('Menyimpan...');
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      updateNote(
        noteId,
        {
          title: patch.title.trim() || 'Tanpa Judul',
          subject: patch.subject.trim() || 'Umum',
          category: patch.category,
          date: patch.date || getTodayKey(),
          content: patch.content,
        },
        true
      );
      const now = new Date();
      setSaveLabel(
        `Tersimpan otomatis ${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}`
      );
    }, 450);
  };

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  const subjects = useMemo(
    () =>
      Array.from(new Set(data.notes.map((n) => n.subject).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [data.notes]
  );

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.notes
      .filter((n) => {
        if (subjectFilter !== 'semua' && n.subject !== subjectFilter) return false;
        if (pinnedOnly && !n.isPinned) return false;
        if (
          q &&
          !n.title.toLowerCase().includes(q) &&
          !n.subject.toLowerCase().includes(q) &&
          !n.content.toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [data.notes, search, subjectFilter, pinnedOnly]);

  const handleManualSave = () => {
    if (!activeNote) return;
    if (!title.trim()) {
      showToast('Judul catatan tidak boleh kosong.', 'error');
      return;
    }
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    updateNote(activeNote.id, {
      title: title.trim(),
      subject: subject.trim() || 'Umum',
      category,
      date,
      content,
    });
    setSaveLabel('Tersimpan');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            Catatan Pelajaran
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Notebook digital dengan pin catatan penting dan penyimpanan otomatis.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateNewNote}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#344E41] hover:bg-[#2A3F34] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Catatan Baru</span>
        </button>
      </div>

      {/* Notebook 2-Pane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Notes Sidebar List */}
        <section className="lg:col-span-4 study-card p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari catatan..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[#A3B18A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              aria-label="Filter mata pelajaran catatan"
              className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-primary)]"
            >
              <option value="semua">Semua Mapel</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setPinnedOnly((p) => !p)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 ${
                pinnedOnly
                  ? 'bg-[#344E41] text-white'
                  : 'bg-[var(--bg-muted)] text-[var(--text-secondary)]'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Pin</span>
            </button>
          </div>

          <div className="divide-y divide-[var(--border-hairline)] max-h-[500px] overflow-y-auto">
            {filteredNotes.length === 0 ? (
              <p className="py-8 text-center text-xs text-[var(--text-muted)]">
                {data.notes.length === 0
                  ? 'Belum ada catatan. Klik Catatan Baru untuk mulai menulis.'
                  : 'Tidak ada catatan yang cocok.'}
              </p>
            ) : (
              filteredNotes.map((note) => {
                const selected = note.id === activeNote?.id;
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setActiveNoteId(note.id)}
                    className={`w-full text-left p-3 rounded-xl my-1 transition-colors ${
                      selected
                        ? 'bg-[#DDE5D2]/70 dark:bg-[#2A3B31]'
                        : 'hover:bg-[var(--bg-canvas)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {note.title}
                      </p>
                      {note.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-[#344E41] dark:text-[#A3B18A] shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                      {note.subject} · {note.category} ·{' '}
                      {formatIndonesianDate(note.date, { shortMonth: true })}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* Note Editor */}
        <section className="lg:col-span-8 study-card p-5 sm:p-6">
          {!activeNote ? (
            <div className="py-16 text-center space-y-3">
              <p className="font-display text-base font-semibold text-[var(--text-primary)]">
                Pilih atau buat catatan baru
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                Semua perubahan materi akan tersimpan secara otomatis di perangkatmu.
              </p>
              <button
                type="button"
                onClick={handleCreateNewNote}
                className="px-4 py-2.5 rounded-xl bg-[#344E41] text-white text-sm font-semibold"
              >
                Buat Catatan Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Editor Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border-hairline)]">
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {saveLabel || 'Autosave aktif'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateNote(activeNote.id, { isPinned: !activeNote.isPinned })
                    }
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      activeNote.isPinned
                        ? 'bg-[#344E41] text-white'
                        : 'bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{activeNote.isPinned ? 'Tersemat' : 'Sematkan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleManualSave}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-soft)] text-[var(--text-primary)] flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingNoteId(activeNote.id)}
                    aria-label="Hapus catatan"
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title Input */}
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  const val = e.target.value;
                  setTitle(val);
                  scheduleAutosave(activeNote.id, {
                    title: val,
                    subject,
                    category,
                    date,
                    content,
                  });
                }}
                placeholder="Judul catatan..."
                className="w-full font-display text-xl font-bold bg-transparent text-[var(--text-primary)] focus:outline-none placeholder:text-[var(--text-muted)]"
              />

              {/* Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSubject(val);
                      scheduleAutosave(activeNote.id, {
                        title,
                        subject: val,
                        category,
                        date,
                        content,
                      });
                    }}
                    placeholder="Contoh: Fisika"
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const val = e.target.value as NoteCategory;
                      setCategory(val);
                      scheduleAutosave(activeNote.id, {
                        title,
                        subject,
                        category: val,
                        date,
                        content,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-primary)]"
                  >
                    {NOTE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDate(val);
                      scheduleAutosave(activeNote.id, {
                        title,
                        subject,
                        category,
                        date: val,
                        content,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-xs font-medium text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {/* Body Content */}
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1.5">
                  Isi Materi Catatan
                </label>
                <textarea
                  value={content}
                  onChange={(e) => {
                    const val = e.target.value;
                    setContent(val);
                    scheduleAutosave(activeNote.id, {
                      title,
                      subject,
                      category,
                      date,
                      content: val,
                    });
                  }}
                  rows={13}
                  placeholder="Tulis ringkasan materi, rumus penting, poin diskusi kelas, atau catatan ujian di sini..."
                  className="w-full p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-hairline)] text-sm text-[var(--text-primary)] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#A3B18A] resize-y"
                />
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={!!deletingNoteId}
        onClose={() => setDeletingNoteId(null)}
        onConfirm={() => {
          if (deletingNoteId) {
            const remaining = data.notes.filter((n) => n.id !== deletingNoteId);
            deleteNote(deletingNoteId);
            setActiveNoteId(remaining[0]?.id ?? null);
          }
        }}
        title="Hapus Catatan"
        message={`Hapus catatan "${activeNote?.title}" secara permanen?`}
      />
    </div>
  );
};
