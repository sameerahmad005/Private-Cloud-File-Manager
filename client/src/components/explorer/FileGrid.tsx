import React from 'react';
import { FileItem } from '../../types';
import { FileCard } from './FileCard';

interface FileGridProps {
  files: FileItem[];
  selectedIds: Set<string>;
  onSelect: (file: FileItem, multi: boolean) => void;
  onOpen: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  selectedIds,
  onSelect,
  onOpen,
  onContextMenu,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 p-1">
      {files.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          isSelected={selectedIds.has(file.id)}
          onSelect={onSelect}
          onOpen={onOpen}
          onContextMenu={onContextMenu}
        />
      ))}
    </div>
  );
};
