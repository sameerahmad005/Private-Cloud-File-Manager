import React, { useState, useEffect, useMemo } from 'react';
import { filesApi, metadataApi } from '../services/api';
import { FileCategory, FileItem, FileSortField, SortDirection } from '../types';
import { Breadcrumbs } from '../components/explorer/Breadcrumbs';
import { ActionBar } from '../components/explorer/ActionBar';
import { FileGrid } from '../components/explorer/FileGrid';
import { FileList } from '../components/explorer/FileList';
import { ContextMenu } from '../components/explorer/ContextMenu';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Modals
import { UploadModal } from '../components/modals/UploadModal';
import { CreateFolderModal } from '../components/modals/CreateFolderModal';
import { RenameModal } from '../components/modals/RenameModal';
import { MoveModal } from '../components/modals/MoveModal';
import { DeleteModal } from '../components/modals/DeleteModal';
import { FilePreviewModal } from '../components/modals/FilePreviewModal';
import { FileDetailsModal } from '../components/modals/FileDetailsModal';

interface DrivePageProps {
  onOpenNoteEditor: (note: any) => void;
}

// In-Memory Cache for Folder Navigation (0ms latency on navigate)
const folderCacheMap = new Map<string, { files: FileItem[]; breadcrumbs: { id: string; name: string }[] }>();

export const DrivePage: React.FC<DrivePageProps> = ({ onOpenNoteEditor }) => {
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Explorer Preferences
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [category, setCategory] = useState<FileCategory>('all');
  const [sortBy, setSortBy] = useState<FileSortField>('name');
  const [sortOrder, setSortOrder] = useState<SortDirection>('asc');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: FileItem;
  } | null>(null);

  // Modals State
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const [activeFile, setActiveFile] = useState<FileItem | null>(null);

  const cacheKey = `${currentFolderId || 'root'}_${category}`;

  useEffect(() => {
    fetchFolderContents();
  }, [currentFolderId, category]);

  const fetchFolderContents = async (isBackgroundRefresh = false) => {
    try {
      const cached = folderCacheMap.get(cacheKey);
      if (cached && !isBackgroundRefresh) {
        setFiles(cached.files);
        setBreadcrumbs(cached.breadcrumbs);
        setLoading(false);
      } else if (!cached && !isBackgroundRefresh) {
        setLoading(true);
      }

      setError(null);
      setSelectedIds(new Set());

      const res = await filesApi.listFiles(currentFolderId, category);
      if (res.success && res.data) {
        setFiles(res.data.files);
        setBreadcrumbs(res.data.breadcrumbs || []);
        folderCacheMap.set(cacheKey, {
          files: res.data.files,
          breadcrumbs: res.data.breadcrumbs || [],
        });
      }
    } catch (err: any) {
      if (!files || files.length === 0) {
        setError(err.message || 'Failed to load folder contents.');
      }
    } finally {
      setLoading(false);
    }
  };

  const invalidateAndRefresh = () => {
    folderCacheMap.delete(cacheKey);
    fetchFolderContents(true);
  };

  // Immutable client-side sorting of fetched items
  const sortedFiles = useMemo(() => {
    const list = [...files];
    list.sort((a, b) => {
      // Folders always sorted first
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortBy === 'modifiedTime') {
        valA = new Date(a.modifiedTime || 0).getTime();
        valB = new Date(b.modifiedTime || 0).getTime();
      } else if (sortBy === 'createdTime') {
        valA = new Date(a.createdTime || 0).getTime();
        valB = new Date(b.createdTime || 0).getTime();
      } else if (sortBy === 'size') {
        valA = a.size || 0;
        valB = b.size || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [files, sortBy, sortOrder]);

  const handleSelectFile = (file: FileItem, multi: boolean) => {
    if (multi) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(file.id)) next.delete(file.id);
        else next.add(file.id);
        return next;
      });
    } else {
      setSelectedIds(new Set([file.id]));
    }
  };

  const handleOpenItem = (file: FileItem) => {
    metadataApi.recordRecent(file.id);

    if (file.isFolder) {
      setCurrentFolderId(file.id);
    } else if (file.isNote || file.name.endsWith('.md')) {
      onOpenNoteEditor(file);
    } else {
      setActiveFile(file);
      setPreviewModalOpen(true);
    }
  };

  useKeyboardShortcuts({
    onSelectAll: () => {
      if (sortedFiles.length > 0) {
        setSelectedIds(new Set(sortedFiles.map((f) => f.id)));
      }
    },
    onDeselectAll: () => {
      setSelectedIds(new Set());
    },
    onDeleteSelected: () => {
      if (selectedIds.size > 0) {
        setDeleteModalOpen(true);
      }
    },
    onOpenSelected: () => {
      if (selectedIds.size === 1) {
        const selectedId = Array.from(selectedIds)[0];
        const target = sortedFiles.find((f) => f.id === selectedId);
        if (target) handleOpenItem(target);
      }
    },
    onEscape: () => {
      if (contextMenu) setContextMenu(null);
      else if (selectedIds.size > 0) setSelectedIds(new Set());
    },
  });

  const handleToggleFavorite = async (file: FileItem) => {
    try {
      await metadataApi.toggleFavorite(file.id);
      invalidateAndRefresh();
    } catch {
      // Ignored
    }
  };

  const handleBulkDownload = () => {
    const selected = sortedFiles.filter((f) => selectedIds.has(f.id) && !f.isFolder);
    selected.forEach((f) => {
      window.open(filesApi.getDownloadUrl(f.id), '_blank');
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
        <Breadcrumbs items={breadcrumbs} onNavigate={(id) => setCurrentFolderId(id)} />
      </div>

      {/* Fixed Action Toolbar (ALWAYS rendered in header area) */}
      <ActionBar
        viewMode={viewMode}
        onToggleViewMode={(mode) => setViewMode(mode)}
        category={category}
        onSelectCategory={(cat) => setCategory(cat)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order);
        }}
        onNewFolder={() => setCreateFolderModalOpen(true)}
        onNewNote={() => onOpenNoteEditor(null)}
        onUpload={() => setUploadModalOpen(true)}
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onBulkDownload={handleBulkDownload}
        onBulkMove={() => setMoveModalOpen(true)}
        onBulkDelete={() => setDeleteModalOpen(true)}
      />

      {/* File Explorer Content Area */}
      <div className="relative min-h-[300px]">
        {loading ? (
          <SkeletonLoader viewMode={viewMode} count={12} />
        ) : error ? (
          <ErrorState error={error} onRetry={() => fetchFolderContents()} />
        ) : sortedFiles.length === 0 ? (
          <EmptyState
            onUpload={() => setUploadModalOpen(true)}
            onCreateFolder={() => setCreateFolderModalOpen(true)}
          />
        ) : viewMode === 'grid' ? (
          <FileGrid
            files={sortedFiles}
            selectedIds={selectedIds}
            onSelect={handleSelectFile}
            onOpen={handleOpenItem}
            onContextMenu={(e, file) => {
              setActiveFile(file);
              setContextMenu({ x: e.clientX, y: e.clientY, file });
            }}
          />
        ) : (
          <FileList
            files={sortedFiles}
            selectedIds={selectedIds}
            onSelect={handleSelectFile}
            onOpen={handleOpenItem}
            onContextMenu={(e, file) => {
              setActiveFile(file);
              setContextMenu({ x: e.clientX, y: e.clientY, file });
            }}
            onSelectAll={(all) => {
              if (all) setSelectedIds(new Set(sortedFiles.map((f) => f.id)));
              else setSelectedIds(new Set());
            }}
          />
        )}
      </div>

      {/* Context Menu Popup */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          file={contextMenu.file}
          onClose={() => setContextMenu(null)}
          onOpen={handleOpenItem}
          onPreview={(file) => {
            setActiveFile(file);
            setPreviewModalOpen(true);
          }}
          onDownload={(file) => window.open(filesApi.getDownloadUrl(file.id), '_blank')}
          onToggleFavorite={handleToggleFavorite}
          onRename={(file) => {
            setActiveFile(file);
            setRenameModalOpen(true);
          }}
          onMove={(file) => {
            setActiveFile(file);
            setMoveModalOpen(true);
          }}
          onDetails={(file) => {
            setActiveFile(file);
            setDetailsModalOpen(true);
          }}
          onDelete={(file) => {
            setActiveFile(file);
            setDeleteModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folderId={currentFolderId}
        onUploadSuccess={invalidateAndRefresh}
      />

      <CreateFolderModal
        isOpen={createFolderModalOpen}
        onClose={() => setCreateFolderModalOpen(false)}
        parentId={currentFolderId}
        onSuccess={invalidateAndRefresh}
      />

      <RenameModal
        isOpen={renameModalOpen}
        file={activeFile}
        onClose={() => setRenameModalOpen(false)}
        onSuccess={invalidateAndRefresh}
      />

      <MoveModal
        isOpen={moveModalOpen}
        file={activeFile}
        selectedFiles={sortedFiles.filter((f) => selectedIds.has(f.id))}
        currentFolderId={currentFolderId}
        onClose={() => setMoveModalOpen(false)}
        onSuccess={invalidateAndRefresh}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        file={activeFile}
        selectedFiles={sortedFiles.filter((f) => selectedIds.has(f.id))}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={invalidateAndRefresh}
      />

      <FilePreviewModal
        isOpen={previewModalOpen}
        file={activeFile}
        onClose={() => setPreviewModalOpen(false)}
      />

      <FileDetailsModal
        isOpen={detailsModalOpen}
        file={activeFile}
        onClose={() => setDetailsModalOpen(false)}
      />
    </div>
  );
};
