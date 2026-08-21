import React from 'react';
import { FolderOpen, Upload, FolderPlus } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onUpload?: () => void;
  onCreateFolder?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'This folder is empty',
  description = 'Upload your first file or create a subfolder to get started.',
  onUpload,
  onCreateFolder,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/30">
      <div className="p-4 bg-brand-50 dark:bg-brand-950/40 rounded-full mb-4">
        <FolderOpen className="w-10 h-10 text-brand-600 dark:text-brand-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-6">
        {description}
      </p>

      <div className="flex items-center space-x-3">
        {onUpload && (
          <button
            onClick={onUpload}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs sm:text-sm rounded-xl shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>
        )}

        {onCreateFolder && (
          <button
            onClick={onCreateFolder}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm rounded-xl transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-amber-500" />
            <span>New Folder</span>
          </button>
        )}
      </div>
    </div>
  );
};
