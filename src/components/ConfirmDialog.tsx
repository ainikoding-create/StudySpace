import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Hapus',
  cancelLabel = 'Batal',
  destructive = true,
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-md">
      <div className="flex items-start gap-3.5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            destructive
              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
              : 'bg-[var(--bg-soft)] text-[var(--accent-dark)]'
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
          {message}
        </p>
      </div>
      <div className="flex items-center justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-muted)] hover:bg-[var(--bg-soft)] transition-colors min-h-[44px]"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors min-h-[44px] ${
            destructive
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-[#344E41] hover:bg-[#2A3F34]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
