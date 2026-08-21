import React from 'react';
import { MoreVertical, Star } from 'lucide-react';
import { FileItem } from '../../types';
import { FileIcon } from './FileIcon';

interface FileCardProps {
  file: FileItem;
  isSelected: boolean;
  onSelect: (file: FileItem, multi: boolean) => void;
  onOpen: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  isSelected,
  onSelect,
  onOpen,
  onContextMenu,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) {
          onSelect(file, true);
        } else {
          onSelect(file, false);
        }
      }}
      onDoubleClick={() => onOpen(file)}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, file);
      }}
      className={`group relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
        isSelected
          ? 'bg-brand-50/90 dark:bg-brand-950/40 border-brand-500 shadow-md ring-2 ring-brand-500/20'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 group-hover:scale-105 transition-transform">
          <FileIcon file={file} className="w-7 h-7" />
        </div>

        <div className="flex items-center space-x-1">
          {file.isFavorite && (
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, file);
            }}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
          {file.name}
        </h4>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
          <span>{file.isFolder ? 'Folder' : formatBytes(file.size)}</span>
          <span>{formatDate(file.modifiedTime)}</span>
        </div>
      </div>
    </div>
  );
};
