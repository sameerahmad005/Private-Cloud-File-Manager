import React, { useState, useEffect } from 'react';
import { X, FolderInput, Folder, Loader2 } from 'lucide-react';
import { FileItem } from '../../types';
import { filesApi } from '../../services/api';

interface MoveModalProps {
  isOpen: boolean;
  file: FileItem | null;
  selectedFiles?: FileItem[];
  currentFolderId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  isOpen,
  file,
  selectedFiles = [],
  currentFolderId,
  onClose,
  onSuccess,
}) => {
  const [availableFolders, setAvailableFolders] = useState<FileItem[]>([]);
  const [targetParentId, setTargetParentId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
    }
  }, [isOpen, currentFolderId]);

  const fetchFolders = async () => {
    try {
      setFetching(true);
      const res = await filesApi.listFiles(currentFolderId, 'folders');
      if (res.success && res.data) {
        setAvailableFolders(res.data.files);
        if (res.data.currentFolder) {
          setTargetParentId(res.data.currentFolder.id);
        }
      }
    } catch {
      // Fallback
    } finally {
      setFetching(false);
    }
  };

  if (!isOpen) return null;

  const targets = selectedFiles.length > 0 ? selectedFiles : file ? [file] : [];

  const handleMove = async () => {
    if (targets.length === 0 || !targetParentId) return;

    try {
      setLoading(true);
      setError(null);

      for (const item of targets) {
        await filesApi.moveFile(item.id, targetParentId);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to move item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <FolderInput className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Move Items</h3>
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
            Select destination folder for <span className="font-semibold text-slate-900 dark:text-slate-100">{targets.length} item(s)</span>:
          </p>

          {fetching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
              {availableFolders.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No subfolders found in current directory.
                </div>
              ) : (
                availableFolders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setTargetParentId(folder.id)}
                    className={`w-full flex items-center space-x-3 p-3 text-left text-sm transition-colors ${
                      targetParentId === folder.id
                        ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <Folder className="w-4.5 h-4.5 text-amber-500" />
                    <span>{folder.name}</span>
                  </button>
                ))
              )}
            </div>
          )}
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
            onClick={handleMove}
            disabled={loading || !targetParentId}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Move Here</span>
          </button>
        </div>
      </div>
    </div>
  );
};
