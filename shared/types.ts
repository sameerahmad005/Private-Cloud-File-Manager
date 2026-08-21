export interface FileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  parentId: string | null;
  isFolder: boolean;
  isFavorite?: boolean;
  isNote?: boolean;
  thumbnailLink?: string;
  webViewLink?: string;
  path?: { id: string; name: string }[];
}

export interface FolderItem {
  id: string;
  name: string;
  parentId: string | null;
  createdTime: string;
  modifiedTime: string;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  mimeType: 'text/markdown' | 'text/plain';
  createdTime: string;
  modifiedTime: string;
  parentId: string | null;
}

export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface StorageQuota {
  used: number;
  limit: number;
  formattedUsed: string;
  formattedLimit: string;
  percentage: number;
  available: number;
  formattedAvailable: string;
}

export interface AppSettings {
  appName: string;
  theme: 'light' | 'dark' | 'system';
  defaultView: 'grid' | 'list';
  maxUploadSize: number; // in bytes
  sessionTimeout: number; // in minutes
  rateLimit: number; // requests per 15 min
  googleDriveConnected: boolean;
  rootFolderId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  event: string;
  details: string;
  username: string;
  ip: string;
}

export interface AuthSessionResponse {
  authenticated: boolean;
  user?: User;
  csrfToken?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type FileSortField = 'name' | 'modifiedTime' | 'size' | 'createdTime';
export type SortDirection = 'asc' | 'desc';
export type FileCategory = 
  | 'all' 
  | 'folders' 
  | 'documents' 
  | 'pdfs' 
  | 'images' 
  | 'videos' 
  | 'presentations' 
  | 'spreadsheets' 
  | 'notes' 
  | 'archives'
  | 'code';
