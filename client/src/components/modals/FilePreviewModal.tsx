import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, Loader2, FileText } from 'lucide-react';
import { marked } from 'marked';
import { FileItem } from '../../types';
import { filesApi } from '../../services/api';

interface FilePreviewModalProps {
  isOpen: boolean;
  file: FileItem | null;
  onClose: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  file,
  onClose,
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  useEffect(() => {
    if (isOpen && file && isTextOrMarkdown(file)) {
      fetchTextContent(file.id);
    } else {
      setTextContent(null);
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  function isTextOrMarkdown(item: FileItem) {
    const mime = item.mimeType.toLowerCase();
    const name = item.name.toLowerCase();
    return (
      item.isNote ||
      mime.includes('markdown') ||
      mime.includes('text/') ||
      mime.includes('javascript') ||
      mime.includes('json') ||
      name.endsWith('.md') ||
      name.endsWith('.txt') ||
      name.endsWith('.js') ||
      name.endsWith('.ts') ||
      name.endsWith('.py')
    );
  }

  const fetchTextContent = async (id: string) => {
    try {
      setLoadingText(true);
      const previewUrl = filesApi.getPreviewUrl(id);
      const res = await fetch(previewUrl);
      const text = await res.text();
      setTextContent(text);
    } catch {
      setTextContent('Failed to load text preview content.');
    } finally {
      setLoadingText(false);
    }
  };

  const previewUrl = filesApi.getPreviewUrl(file.id);
  const downloadUrl = filesApi.getDownloadUrl(file.id);

  const isPdf = file.mimeType === 'application/pdf' || file.name.endsWith('.pdf');
  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');
  const isMarkdown = file.isNote || file.mimeType.includes('markdown') || file.name.endsWith('.md');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center space-x-3 truncate mr-4">
            <FileText className="w-5 h-5 text-brand-500 shrink-0" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate text-sm sm:text-base">
              {file.name}
            </h3>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={downloadUrl}
              download={file.name}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Preview Content Viewport */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100/50 dark:bg-slate-950/50">
          {isImage && (
            <img
              src={previewUrl}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow"
            />
          )}

          {isPdf && (
            <iframe
              src={previewUrl}
              title={file.name}
              className="w-full h-full border-0 rounded-lg shadow-sm"
            />
          )}

          {isVideo && (
            <video controls src={previewUrl} className="max-w-full max-h-full rounded-lg shadow">
              Your browser does not support video playback.
            </video>
          )}

          {isAudio && (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 flex flex-col items-center space-y-4">
              <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">{file.name}</p>
              <audio controls src={previewUrl} className="w-72" />
            </div>
          )}

          {isMarkdown && (
            <div className="w-full h-full max-w-3xl overflow-y-auto p-6 bg-white dark:bg-slate-900 rounded-xl shadow border border-slate-200 dark:border-slate-800 prose dark:prose-invert text-sm">
              {loadingText ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(textContent || ''),
                  }}
                />
              )}
            </div>
          )}

          {!isMarkdown && isTextOrMarkdown(file) && (
            <div className="w-full h-full max-w-3xl overflow-auto p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs shadow">
              {loadingText ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                </div>
              ) : (
                <pre className="whitespace-pre-wrap">{textContent}</pre>
              )}
            </div>
          )}

          {!isImage && !isPdf && !isVideo && !isAudio && !isTextOrMarkdown(file) && (
            <div className="p-8 bg-white dark:bg-slate-900 rounded-2xl shadow border border-slate-200 dark:border-slate-800 text-center space-y-4 max-w-sm">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
                  Preview Unavailable
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Direct preview is not supported for this file format ({file.mimeType}).
                </p>
              </div>

              <div className="flex items-center justify-center space-x-3 pt-2">
                <a
                  href={downloadUrl}
                  download={file.name}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-xl shadow-sm transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download File</span>
                </a>

                {file.webViewLink && (
                  <a
                    href={file.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open in Drive</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
