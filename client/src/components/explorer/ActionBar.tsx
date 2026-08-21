import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  FolderPlus,
  FilePlus,
  Upload,
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  Filter,
  Download,
  FolderInput,
  Trash2,
  X,
  Check,
} from 'lucide-react';
import { FileCategory, FileSortField, SortDirection } from '../../types';
import { PortalDropdown } from '../common/PortalDropdown';

interface ActionBarProps {
  viewMode: 'grid' | 'list';
  onToggleViewMode: (mode: 'grid' | 'list') => void;
  category: FileCategory;
  onSelectCategory: (cat: FileCategory) => void;
  sortBy: FileSortField;
  sortOrder: SortDirection;
  onSortChange: (field: FileSortField, order: SortDirection) => void;
  onNewFolder: () => void;
  onNewNote: () => void;
  onUpload: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDownload: () => void;
  onBulkMove: () => void;
  onBulkDelete: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  viewMode,
  onToggleViewMode,
  category,
  onSelectCategory,
  sortBy,
  sortOrder,
  onSortChange,
  onNewFolder,
  onNewNote,
  onUpload,
  selectedCount,
  onClearSelection,
  onBulkDownload,
  onBulkMove,
  onBulkDelete,
}) => {
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const newBtnRef = useRef<HTMLButtonElement>(null);
  const filterBtnRef = useRef<HTMLButtonElement>(null);
  const sortBtnRef = useRef<HTMLButtonElement>(null);

  const categories: { id: FileCategory; label: string }[] = [
    { id: 'all', label: 'All Files' },
    { id: 'folders', label: 'Folders' },
    { id: 'pdfs', label: 'PDFs' },
    { id: 'documents', label: 'Documents' },
    { id: 'images', label: 'Images' },
    { id: 'videos', label: 'Videos' },
    { id: 'spreadsheets', label: 'Spreadsheets' },
    { id: 'presentations', label: 'Presentations' },
    { id: 'notes', label: 'Notes' },
    { id: 'archives', label: 'Archives' },
    { id: 'code', label: 'Code' },
  ];

  const toggleNewMenu = () => {
    setSortMenuOpen(false);
    setFilterMenuOpen(false);
    setNewMenuOpen((prev) => !prev);
  };

  const toggleSortMenu = () => {
    setNewMenuOpen(false);
    setFilterMenuOpen(false);
    setSortMenuOpen((prev) => !prev);
  };

  const toggleFilterMenu = () => {
    setNewMenuOpen(false);
    setSortMenuOpen(false);
    setFilterMenuOpen((prev) => !prev);
  };

  return (
    <div className="relative z-30 space-y-2">
      {/* Primary Explorer Toolbar (ALWAYS rendered in header) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-1">
        <div className="flex items-center space-x-2">
          {/* + New Button & Dropdown */}
          <div className="relative">
            <button
              ref={newBtnRef}
              onClick={toggleNewMenu}
              className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-medium text-sm rounded-xl shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>New</span>
            </button>

            <PortalDropdown
              isOpen={newMenuOpen}
              onClose={() => setNewMenuOpen(false)}
              triggerRef={newBtnRef}
              align="left"
              className="w-52"
            >
              <button
                onClick={() => {
                  onNewFolder();
                  setNewMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <FolderPlus className="w-4.5 h-4.5 text-amber-500" />
                <span>New Folder</span>
              </button>
              <button
                onClick={() => {
                  onNewNote();
                  setNewMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <FilePlus className="w-4.5 h-4.5 text-emerald-500" />
                <span>New Note (.md)</span>
              </button>
              <button
                onClick={() => {
                  onUpload();
                  setNewMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <Upload className="w-4.5 h-4.5 text-brand-500" />
                <span>Upload Files</span>
              </button>
            </PortalDropdown>
          </div>

          {/* Quick Upload Button */}
          <button
            onClick={onUpload}
            className="flex items-center space-x-2 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span className="hidden xs:inline">Upload</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {/* Category Filter Dropdown */}
          <div className="relative">
            <button
              ref={filterBtnRef}
              onClick={toggleFilterMenu}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium rounded-xl transition-colors"
            >
              <Filter className="w-4 h-4 text-slate-400" />
              <span>
                {categories.find((c) => c.id === category)?.label || 'All Files'}
              </span>
            </button>

            <PortalDropdown
              isOpen={filterMenuOpen}
              onClose={() => setFilterMenuOpen(false)}
              triggerRef={filterBtnRef}
              align="right"
              className="w-48 max-h-60 overflow-y-auto"
            >
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSelectCategory(c.id);
                    setFilterMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-1.5 text-xs sm:text-sm ${
                    category === c.id
                      ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold text-brand-600 dark:text-brand-400'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{c.label}</span>
                  {category === c.id && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                </button>
              ))}
            </PortalDropdown>
          </div>

          {/* Sort Menu Dropdown */}
          <div className="relative">
            <button
              ref={sortBtnRef}
              onClick={toggleSortMenu}
              className="flex items-center space-x-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-medium rounded-xl transition-colors"
            >
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <span>Sort</span>
            </button>

            <PortalDropdown
              isOpen={sortMenuOpen}
              onClose={() => setSortMenuOpen(false)}
              triggerRef={sortBtnRef}
              align="right"
              className="w-48"
            >
              <button
                onClick={() => {
                  onSortChange('name', 'asc');
                  setSortMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-1.5 text-xs sm:text-sm transition-colors ${
                  sortBy === 'name' && sortOrder === 'asc'
                    ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold text-brand-600 dark:text-brand-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Name (A to Z)
              </button>
              <button
                onClick={() => {
                  onSortChange('name', 'desc');
                  setSortMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-1.5 text-xs sm:text-sm transition-colors ${
                  sortBy === 'name' && sortOrder === 'desc'
                    ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold text-brand-600 dark:text-brand-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Name (Z to A)
              </button>
              <button
                onClick={() => {
                  onSortChange('modifiedTime', 'desc');
                  setSortMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-1.5 text-xs sm:text-sm transition-colors ${
                  sortBy === 'modifiedTime' && sortOrder === 'desc'
                    ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold text-brand-600 dark:text-brand-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Newest Modified
              </button>
              <button
                onClick={() => {
                  onSortChange('modifiedTime', 'asc');
                  setSortMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-1.5 text-xs sm:text-sm transition-colors ${
                  sortBy === 'modifiedTime' && sortOrder === 'asc'
                    ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold text-brand-600 dark:text-brand-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Oldest Modified
              </button>
              <button
                onClick={() => {
                  onSortChange('size', 'desc');
                  setSortMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-1.5 text-xs sm:text-sm transition-colors ${
                  sortBy === 'size' && sortOrder === 'desc'
                    ? 'bg-brand-50 dark:bg-brand-950/60 font-semibold text-brand-600 dark:text-brand-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Largest Size
              </button>
            </PortalDropdown>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
            <button
              onClick={() => onToggleViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => onToggleViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="List View"
            >
              <ListIcon className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Selection Bar (Displayed below primary toolbar when items are selected) */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between p-2.5 px-4 bg-brand-600 text-white rounded-xl shadow-md animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClearSelection}
              className="p-1 rounded-md hover:bg-brand-700 transition-colors"
              title="Clear selection"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="font-medium text-xs sm:text-sm">
              {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onBulkDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-brand-700 hover:bg-brand-800 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={onBulkMove}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-brand-700 hover:bg-brand-800 rounded-lg transition-colors"
            >
              <FolderInput className="w-4 h-4" />
              <span className="hidden sm:inline">Move</span>
            </button>

            <button
              onClick={onBulkDelete}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
