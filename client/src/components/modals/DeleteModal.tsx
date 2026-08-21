import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { FileItem } from '../../types';
import { filesApi } from '../../services/api';

interface DeleteModalProps {
  isOpen: boolean;
  file: FileItem | null;
  selectedFiles?: FileItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  file,
  selectedFiles = [],
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const targets = selectedFiles.length > 0 ? selectedFiles : file ? [file] : [];
  const count = targets.length;

  const handleDelete = async () => {
    if (targets.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      for (const item of targets) {
        await filesApi.deleteFile(item.id);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete file.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900">
              {error}
            </div>
          )}

          <p className="text-sm text-slate-700 dark:text-slate-300">
            {count === 1 ? (
              <>
                Are you sure you want to move <span className="font-semibold text-slate-900 dark:text-slate-100">"{targets[0]?.name}"</span> to Google Drive trash?
              </>
            ) : (
              <>
                Are you sure you want to move <span className="font-semibold text-slate-900 dark:text-slate-100">{count} selected items</span> to Google Drive trash?
              </>
            )}
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Files moved to trash will remain recoverable in Google Drive trash for 30 days.
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            <span>{loading ? 'Deleting...' : 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
