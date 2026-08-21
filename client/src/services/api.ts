import axios from 'axios';
import {
  ApiResponse,
  AuthSessionResponse,
  FileCategory,
  FileItem,
  FileSortField,
  NoteItem,
  SortDirection,
  StorageQuota,
  AppSettings,
  AuditLog,
} from '../types';

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function getCsrfToken() {
  return csrfToken;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export const authApi = {
  async getSession(): Promise<AuthSessionResponse> {
    const res = await api.get<ApiResponse<AuthSessionResponse>>('/auth/session');
    if (res.data.data?.csrfToken) {
      setCsrfToken(res.data.data.csrfToken);
    }
    return res.data.data || { authenticated: false };
  },

  async login(username: string, password: string) {
    const res = await api.post<ApiResponse<{ user: any; csrfToken: string }>>('/auth/login', { username, password });
    if (res.data.data?.csrfToken) {
      setCsrfToken(res.data.data.csrfToken);
    }
    return res.data;
  },

  async logout() {
    const res = await api.post<ApiResponse>('/auth/logout');
    setCsrfToken(null);
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const res = await api.post<ApiResponse>('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};

export const setupApi = {
  async getStatus() {
    const res = await api.get<
      ApiResponse<{
        initialized: boolean;
        providerState: 'NOT_CONFIGURED' | 'OAUTH_CLIENT_CONFIGURED' | 'GOOGLE_ACCOUNT_CONNECTED' | 'GOOGLE_DRIVE_CONNECTED' | 'VIRTUAL_DEVELOPMENT_MODE' | 'ERROR';
        hasOauthConfig: boolean;
        hasRefreshToken: boolean;
        isDriveConnected: boolean;
        redirectUri: string;
        rootFolderId: string;
      }>
    >('/setup/status');
    return res.data;
  },

  async createAdmin(username: string, password: string) {
    const res = await api.post<ApiResponse<{ user: any; csrfToken: string }>>('/setup/admin', { username, password });
    if (res.data.data?.csrfToken) {
      setCsrfToken(res.data.data.csrfToken);
    }
    return res.data;
  },

  async saveOauthConfig(clientId: string, clientSecret: string) {
    const res = await api.post<ApiResponse>('/setup/oauth-config', { clientId, clientSecret });
    return res.data;
  },

  async getOAuthUrl() {
    const res = await api.get<ApiResponse<{ url: string; redirectUri: string }>>('/setup/oauth/url');
    return res.data;
  },

  async listDriveFolders(parentId?: string) {
    const params = parentId ? `?parentId=${encodeURIComponent(parentId)}` : '';
    const res = await api.get<ApiResponse<{ id: string; name: string }[]>>(`/setup/folders${params}`);
    return res.data;
  },

  async selectStorageFolder(data: { folderId?: string; folderName?: string; createNew?: boolean }) {
    const res = await api.post<ApiResponse<{ folderId: string; folderName: string }>>('/setup/select-folder', data);
    return res.data;
  },

  async completeSetup() {
    const res = await api.post<ApiResponse>('/setup/complete');
    return res.data;
  },
};


export const filesApi = {
  async listFiles(
    folderId?: string,
    category: FileCategory = 'all',
    sortBy: FileSortField = 'name',
    sortOrder: SortDirection = 'asc'
  ) {
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId);
    if (category) params.append('category', category);
    if (sortBy) params.append('sortBy', sortBy);
    if (sortOrder) params.append('sortOrder', sortOrder);

    const res = await api.get<
      ApiResponse<{ files: FileItem[]; currentFolder: FileItem | null; breadcrumbs: { id: string; name: string }[] }>
    >(`/files?${params.toString()}`);
    return res.data;
  },

  async getFileMetadata(id: string) {
    const res = await api.get<ApiResponse<FileItem>>(`/files/${id}`);
    return res.data;
  },

  async uploadFiles(files: File[], parentId?: string, onProgress?: (percent: number) => void) {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (parentId) formData.append('parentId', parentId);

    const res = await api.post<ApiResponse<FileItem[]>>('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  async renameFile(id: string, name: string) {
    const res = await api.patch<ApiResponse<FileItem>>(`/files/${id}`, { name });
    return res.data;
  },

  async moveFile(id: string, targetParentId: string) {
    const res = await api.post<ApiResponse<FileItem>>(`/files/${id}/move`, { targetParentId });
    return res.data;
  },

  async deleteFile(id: string) {
    const res = await api.delete<ApiResponse>(`/files/${id}`);
    return res.data;
  },

  getDownloadUrl(id: string) {
    return `/api/files/${id}/download`;
  },

  getPreviewUrl(id: string) {
    return `/api/files/${id}/preview`;
  },
};

export const foldersApi = {
  async createFolder(name: string, parentId?: string) {
    const res = await api.post<ApiResponse<FileItem>>('/folders', { name, parentId });
    return res.data;
  },
};

export const notesApi = {
  async listNotes() {
    const res = await api.get<ApiResponse<NoteItem[]>>('/notes');
    return res.data;
  },

  async createNote(title: string, content: string, parentId?: string) {
    const res = await api.post<ApiResponse<NoteItem>>('/notes', { title, content, parentId });
    return res.data;
  },

  async getNote(id: string) {
    const res = await api.get<ApiResponse<NoteItem>>(`/notes/${id}`);
    return res.data;
  },

  async updateNote(id: string, title?: string, content?: string) {
    const res = await api.patch<ApiResponse<NoteItem>>(`/notes/${id}`, { title, content });
    return res.data;
  },

  async deleteNote(id: string) {
    const res = await api.delete<ApiResponse>(`/notes/${id}`);
    return res.data;
  },
};

export const searchApi = {
  async searchFiles(query: string) {
    const res = await api.get<ApiResponse<FileItem[]>>(`/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },
};

export const metadataApi = {
  async getFavorites() {
    const res = await api.get<ApiResponse<FileItem[]>>('/favorites');
    return res.data;
  },

  async toggleFavorite(driveFileId: string) {
    const res = await api.post<ApiResponse<{ isFavorite: boolean }>>('/favorites/toggle', { driveFileId });
    return res.data;
  },

  async getRecents() {
    const res = await api.get<ApiResponse<FileItem[]>>('/recents');
    return res.data;
  },

  async recordRecent(driveFileId: string) {
    const res = await api.post<ApiResponse>('/recents/record', { driveFileId });
    return res.data;
  },

  async getStorageInfo() {
    const res = await api.get<ApiResponse<StorageQuota>>('/storage');
    return res.data;
  },

  async getSettings() {
    const res = await api.get<ApiResponse<AppSettings>>('/settings');
    return res.data;
  },

  async getAuditLogs() {
    const res = await api.get<ApiResponse<AuditLog[]>>('/audit-logs');
    return res.data;
  },
};
