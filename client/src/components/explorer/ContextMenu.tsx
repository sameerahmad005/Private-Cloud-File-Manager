import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  FolderOpen,
  Eye,
  Download,
  Star,
  Edit2,
  FolderInput,
  Info,
  Trash2,
} from 'lucide-react';
import { FileItem } from '../../types';

interface ContextMenuProps {
  x: number;
  y: number;
  file: FileItem;
  onClose: () => void;
  onOpen: (file: FileItem) => void;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onToggleFavorite: (file: FileItem) => void;
  onRename: (file: FileItem) => void;
  onMove: (file: FileItem) => void;
  onDetails: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  file,
  onClose,
  onOpen,
  onPreview,
  onDownload,
  onToggleFavorite,
  onRename,
  onMove,
  onDetails,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust menu position to keep within viewport bounds
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 300);

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px`, zIndex: 99999 }}
      className="fixed w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 text-sm animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-200 truncate">
        {file.name}
      </div>

      <div className="py-1">
        <button
          onClick={() => {
            onOpen(file);
            onClose();
          }}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <FolderOpen className="w-4 h-4 text-slate-500" />
          <span>Open</span>
        </button>

        {!file.isFolder && (
          <button
            onClick={() => {
              onPreview(file);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Preview</span>
          </button>
        )}

        {!file.isFolder && (
          <button
            onClick={() => {
              onDownload(file);
              onClose();
            }}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download</span>
          </button>
        )}

        <button
          onClick={() => {
            onToggleFavorite(file);
            onClose();
          }}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Star className={`w-4 h-4 ${file.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-500'}`} />
          <span>{file.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
        </button>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 py-1">
        <button
          onClick={() => {
            onRename(file);
            onClose();
          }}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Edit2 className="w-4 h-4 text-slate-500" />
          <span>Rename</span>
        </button>

        <button
          onClick={() => {
            onMove(file);
            onClose();
          }}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <FolderInput className="w-4 h-4 text-slate-500" />
          <span>Move to...</span>
        </button>

        <button
          onClick={() => {
            onDetails(file);
            onClose();
          }}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Info className="w-4 h-4 text-slate-500" />
          <span>File Details</span>
        </button>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 py-1">
        <button
          onClick={() => {
            onDelete(file);
            onClose();
          }}
          className="w-full flex items-center space-x-2.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-rose-500" />
          <span>Delete</span>
        </button>
      </div>
    </div>,
    document.body
  );
};
