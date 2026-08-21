import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { metadataApi, filesApi } from '../services/api';
import { FileItem } from '../types';
import { FileGrid } from '../components/explorer/FileGrid';
import { SkeletonLoader } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';
import { FilePreviewModal } from '../components/modals/FilePreviewModal';

export const RecentPage: React.FC = () => {
  const [recents, setRecents] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState<FileItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchRecents();
  }, []);

  const fetchRecents = async () => {
    try {
      setLoading(true);
      const res = await metadataApi.getRecents();
      if (res.success && res.data) {
        setRecents(res.data);
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
        <Clock className="w-6 h-6 text-brand-500" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Recent Files</h2>
      </div>

      {loading ? (
        <SkeletonLoader viewMode="grid" count={6} />
      ) : recents.length === 0 ? (
        <EmptyState
          title="No recent activity"
          description="Files and notes you view or open will automatically appear here."
        />
      ) : (
        <FileGrid
          files={recents}
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
