import React from 'react';
import { FileItem } from '../../types';
import { FileRow } from './FileRow';

interface FileListProps {
  files: FileItem[];
  selectedIds: Set<string>;
  onSelect: (file: FileItem, multi: boolean) => void;
  onOpen: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
  onSelectAll?: (select: boolean) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedIds,
  onSelect,
  onOpen,
  onContextMenu,
  onSelectAll,
}) => {
  const allSelected = files.length > 0 && selectedIds.size === files.length;

  return (
    <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50 uppercase tracking-wider">
            <th className="py-3 px-4 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
              />
            </th>
            <th className="py-3 px-2">Name</th>
            <th className="py-3 px-4 hidden sm:table-cell">Type</th>
            <th className="py-3 px-4 hidden md:table-cell">Size</th>
            <th className="py-3 px-4">Modified</th>
            <th className="py-3 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              isSelected={selectedIds.has(file.id)}
              onSelect={onSelect}
              onOpen={onOpen}
              onContextMenu={onContextMenu}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
