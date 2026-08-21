import React from 'react';
import { X, Info, FileText } from 'lucide-react';
import { FileItem } from '../../types';

interface FileDetailsModalProps {
  isOpen: boolean;
  file: FileItem | null;
  onClose: () => void;
}

export const FileDetailsModal: React.FC<FileDetailsModalProps> = ({
  isOpen,
  file,
  onClose,
}) => {
  if (!isOpen || !file) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString();
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-brand-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">File Details</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <FileText className="w-8 h-8 text-brand-500 shrink-0" />
            <div className="truncate">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{file.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{file.mimeType}</p>
            </div>
          </div>

          <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800">
            <div className="flex justify-between pt-1">
              <span className="text-slate-500 dark:text-slate-400">Resource Type</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {file.isFolder ? 'Folder' : file.isNote ? 'Note (.md)' : 'File'}
              </span>
            </div>

            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500 dark:text-slate-400">File Size</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {file.isFolder ? '--' : formatBytes(file.size)}
              </span>
            </div>

            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500 dark:text-slate-400">Created Time</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formatDate(file.createdTime)}</span>
            </div>

            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500 dark:text-slate-400">Last Modified</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{formatDate(file.modifiedTime)}</span>
            </div>

            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500 dark:text-slate-400">Parent ID</span>
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                {file.parentId || 'Root'}
              </span>
            </div>

            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500 dark:text-slate-400">Drive File ID</span>
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                {file.id}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
