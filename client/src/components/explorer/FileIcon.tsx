import React from 'react';
import {
  Folder,
  FileText,
  FileCode,
  FileArchive,
  Image,
  Video,
  Music,
  FileSpreadsheet,
  Presentation,
  File,
  StickyNote,
} from 'lucide-react';
import { FileItem } from '../../types';

interface FileIconProps {
  file: FileItem;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({ file, className = 'w-6 h-6' }) => {
  if (file.isFolder) {
    return <Folder className={`${className} text-amber-500 fill-amber-500/20`} />;
  }

  if (file.isNote || file.name.endsWith('.md')) {
    return <StickyNote className={`${className} text-emerald-500`} />;
  }

  const mime = file.mimeType.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return <FileText className={`${className} text-rose-500`} />;
  }

  if (mime.startsWith('image/') || name.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
    return <Image className={`${className} text-sky-500`} />;
  }

  if (mime.startsWith('video/') || name.match(/\.(mp4|webm|mkv|mov)$/)) {
    return <Video className={`${className} text-purple-500`} />;
  }

  if (mime.startsWith('audio/') || name.match(/\.(mp3|wav|ogg)$/)) {
    return <Music className={`${className} text-indigo-500`} />;
  }

  if (mime.includes('sheet') || mime.includes('excel') || name.match(/\.(xlsx|xls|csv)$/)) {
    return <FileSpreadsheet className={`${className} text-emerald-600`} />;
  }

  if (mime.includes('presentation') || mime.includes('powerpoint') || name.match(/\.(pptx|ppt)$/)) {
    return <Presentation className={`${className} text-orange-500`} />;
  }

  if (mime.includes('zip') || mime.includes('tar') || name.match(/\.(zip|rar|gz|7z)$/)) {
    return <FileArchive className={`${className} text-amber-600`} />;
  }

  if (
    mime.includes('javascript') ||
    mime.includes('json') ||
    mime.includes('html') ||
    mime.includes('css') ||
    name.match(/\.(js|ts|jsx|tsx|json|html|css|py|php|c|cpp|rs|go|sh)$/)
  ) {
    return <FileCode className={`${className} text-blue-500`} />;
  }

  return <File className={`${className} text-slate-400`} />;
};
