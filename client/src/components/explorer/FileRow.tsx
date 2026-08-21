import React from 'react';
import { MoreVertical, Star } from 'lucide-react';
import { FileItem } from '../../types';
import { FileIcon } from './FileIcon';

interface FileRowProps {
  file: FileItem;
  isSelected: boolean;
  onSelect: (file: FileItem, multi: boolean) => void;
  onOpen: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
}

export const FileRow: React.FC<FileRowProps> = ({
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
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <tr
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
      className={`group border-b border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer select-none ${
        isSelected
          ? 'bg-brand-50/80 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100'
          : 'hover:bg-slate-100/60 dark:hover:bg-slate-900/60 text-slate-800 dark:text-slate-200'
      }`}
    >
      <td className="py-3 px-4 w-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => {}}
          className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
        />
      </td>

      <td className="py-3 px-2">
        <div className="flex items-center space-x-3">
          <FileIcon file={file} className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm truncate max-w-xs md:max-w-md group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {file.name}
          </span>
          {file.isFavorite && (
            <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
          )}
        </div>
      </td>

      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 hidden sm:table-cell">
        {file.isFolder ? 'Folder' : file.mimeType.split('/')[1] || 'File'}
      </td>

      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell">
        {file.isFolder ? '--' : formatBytes(file.size)}
      </td>

      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
        {formatDate(file.modifiedTime)}
      </td>

      <td className="py-3 px-3 text-right">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContextMenu(e, file);
          }}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};
