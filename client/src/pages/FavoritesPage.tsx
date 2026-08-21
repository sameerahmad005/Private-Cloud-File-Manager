import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { metadataApi, filesApi } from '../services/api';
import { FileItem } from '../types';
import { FileGrid } from '../components/explorer/FileGrid';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';
import { FilePreviewModal } from '../components/modals/FilePreviewModal';

export const FavoritesPage: React.FC = () => {
  const [favorites, setFavorites] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const res = await metadataApi.getFavorites();
      if (res.success && res.data) {
        setFavorites(res.data);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleOpenItem = (file: FileItem) => {
    if (!file.isFolder) {
      setActiveFile(file);
      setPreviewOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
        <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Favorites</h2>
      </div>

      {loading ? (
        <SkeletonLoader viewMode="grid" count={6} />
      ) : favorites.length === 0 ? (
        <EmptyState
          title="No favorite files yet"
          description="Right click or tap the three dots on any file to add it to your favorites for quick access."
        />
      ) : (
        <FileGrid
          files={favorites}
          selectedIds={new Set()}
          onSelect={() => {}}
          onOpen={handleOpenItem}
          onContextMenu={(e, file) => {
            e.preventDefault();
            window.open(filesApi.getDownloadUrl(file.id), '_blank');
          }}
        />
      )}

      <FilePreviewModal
        isOpen={previewOpen}
        file={activeFile}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};
