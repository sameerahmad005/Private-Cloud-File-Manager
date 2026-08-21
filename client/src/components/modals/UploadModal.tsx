import React, { useState } from 'react';
import { X, UploadCloud, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { filesApi } from '../../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId?: string;
  onUploadSuccess: () => void;
}

interface UploadFileItem {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  folderId,
  onUploadSuccess,
}) => {
  const [queue, setQueue] = useState<UploadFileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccessBanner, setUploadSuccessBanner] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setQueue([]);
    setUploadSuccessBanner(false);
    onClose();
  };

  const handleFilesAdded = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newItems: UploadFileItem[] = fileArray.map((f) => ({
      file: f,
      progress: 0,
      status: 'pending',
    }));
    setQueue((prev) => [...prev, ...newItems]);
    setUploadSuccessBanner(false);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const startUpload = async () => {
    if (queue.length === 0 || isUploading) return;
    setIsUploading(true);

    const pendingFiles = queue.filter((i) => i.status === 'pending' || i.status === 'error').map((i) => i.file);

    try {
      setQueue((prev) =>
        prev.map((item) => ({ ...item, status: 'uploading', progress: 20 }))
      );

      await filesApi.uploadFiles(pendingFiles, folderId, (percent) => {
        setQueue((prev) =>
          prev.map((item) => ({ ...item, progress: Math.max(20, percent) }))
        );
      });

      setQueue((prev) =>
        prev.map((item) => ({ ...item, status: 'complete', progress: 100 }))
      );

      setUploadSuccessBanner(true);
      onUploadSuccess();

      // Auto-close modal after 1.2 seconds on successful upload
      setTimeout(() => {
        handleClose();
      }, 1200);
    } catch (err: any) {
      setQueue((prev) =>
        prev.map((item) => ({
          ...item,
          status: 'error',
          error: err.message || 'Upload failed.',
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upload Files</h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {uploadSuccessBanner && (
            <div className="flex items-center space-x-2 p-3 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-xl border border-emerald-200 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Upload complete! Closing...</span>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              dragActive
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 dark:hover:border-brand-600 bg-slate-50/50 dark:bg-slate-950/50'
            }`}
          >
            <input
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFilesAdded(e.target.files)}
              className="hidden"
              id="file-upload-input"
            />
            <label htmlFor="file-upload-input" className="cursor-pointer flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-brand-500 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Drag and drop files here, or <span className="text-brand-600 dark:text-brand-400 underline">browse</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Maximum file size: 50 MB
              </p>
            </label>
          </div>

          {/* Upload Queue List */}
          {queue.length > 0 && (
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {queue.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
                >
                  <div className="flex items-center space-x-2.5 truncate mr-2">
                    <File className="w-4 h-4 text-brand-500 shrink-0" />
                    <div className="truncate">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {item.file.name}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">{formatBytes(item.file.size)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {item.status === 'uploading' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                          <div
                            className="bg-brand-600 h-1.5 rounded-full transition-all duration-150"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                        <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                      </div>
                    )}
                    {item.status === 'complete' && (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500" />
                    )}
                    {item.status === 'error' && (
                      <div className="flex items-center space-x-1 text-rose-500">
                        <AlertCircle className="w-4 h-4" />
                        <span>Failed</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={startUpload}
            disabled={queue.length === 0 || isUploading}
            className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isUploading ? 'Uploading...' : 'Upload Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
