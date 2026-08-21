import { google, drive_v3 } from 'googleapis';
import fs from 'fs';
import { env } from '../config/env.js';
import { getAppSetting } from '../database/db.js';
import { FileItem, StorageQuota } from '../types.js';
import { Readable } from 'stream';

export class GoogleDriveService {
  private drive: drive_v3.Drive | null = null;
  public isLiveDrive: boolean = false;
  public providerState: 'NOT_CONFIGURED' | 'OAUTH_CLIENT_CONFIGURED' | 'GOOGLE_ACCOUNT_CONNECTED' | 'GOOGLE_DRIVE_CONNECTED' | 'VIRTUAL_DEVELOPMENT_MODE' | 'ERROR' = 'NOT_CONFIGURED';

  private mockFiles: Map<string, any> = new Map();
  private mockFileContents: Map<string, Buffer | string> = new Map();

  // High-Performance In-Memory Caches
  private parentCacheMap: Map<string, string | null> = new Map();
  private validatedRootMap: Map<string, boolean> = new Map();
  private breadcrumbsCache: Map<string, { breadcrumbs: { id: string; name: string }[]; time: number }> = new Map();
  private listCache: Map<string, { result: { files: FileItem[]; folder: FileItem | null; breadcrumbs: { id: string; name: string }[] }; time: number }> = new Map();
  private storageCache: { data: StorageQuota; time: number } | null = null;

  constructor() {
    this.initDriveClient();
  }

  public reinitializeClient(): void {
    this.parentCacheMap.clear();
    this.validatedRootMap.clear();
    this.breadcrumbsCache.clear();
    this.listCache.clear();
    this.storageCache = null;
    this.initDriveClient();
  }

  private initDriveClient() {
    try {
      if (env.STORAGE_PROVIDER === 'virtual') {
        console.log('STORAGE_PROVIDER is explicitly set to virtual. Initializing Virtual Drive provider for local development.');
        this.isLiveDrive = false;
        this.providerState = 'VIRTUAL_DEVELOPMENT_MODE';
        this.initMockDriveData();
        return;
      }

      const clientId = env.GOOGLE_CLIENT_ID;
      const clientSecret = env.GOOGLE_CLIENT_SECRET;
      const refreshToken = env.GOOGLE_REFRESH_TOKEN;

      if (clientId && clientSecret) {
        if (refreshToken) {
          const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            `${env.APP_URL}/api/setup/oauth/callback`
          );
          oauth2Client.setCredentials({ refresh_token: refreshToken });
          this.drive = google.drive({ version: 'v3', auth: oauth2Client });
          this.isLiveDrive = true;
          this.providerState = 'GOOGLE_DRIVE_CONNECTED';
          console.log('Google Drive API client initialized successfully with user OAuth2 Credentials.');
        } else {
          this.drive = null;
          this.isLiveDrive = false;
          this.providerState = 'OAUTH_CLIENT_CONFIGURED';
          console.log('User OAuth Client credentials configured. Awaiting Google Account authorization.');
        }
      } else if (env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH && fs.existsSync(env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH)) {
        const auth = new google.auth.GoogleAuth({
          keyFile: env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH,
          scopes: ['https://www.googleapis.com/auth/drive'],
        });
        this.drive = google.drive({ version: 'v3', auth });
        this.isLiveDrive = true;
        this.providerState = 'GOOGLE_DRIVE_CONNECTED';
        console.log('Google Drive API client initialized with Service Account Key.');
      } else {
        this.drive = null;
        this.isLiveDrive = false;
        this.providerState = 'NOT_CONFIGURED';
        console.log('Google OAuth client credentials are not configured on this installation.');
      }
    } catch (err: any) {
      console.error('Error initializing Google Drive API client:', err);
      this.drive = null;
      this.isLiveDrive = false;
      this.providerState = 'ERROR';
    }
  }

  private initMockDriveData() {
    const rootId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID || 'root';
    const now = new Date().toISOString();

    this.mockFiles.set(rootId, {
      id: rootId,
      name: 'My Drive',
      mimeType: 'application/vnd.google-apps.folder',
      size: 0,
      createdTime: now,
      modifiedTime: now,
      parents: [],
      trashed: false,
    });

    const folderAId = 'folder_documents';
    const folderBId = 'folder_projects';
    const folderNotesId = 'folder_notes';

    this.mockFiles.set(folderAId, {
      id: folderAId,
      name: 'Documents',
      mimeType: 'application/vnd.google-apps.folder',
      size: 0,
      createdTime: now,
      modifiedTime: now,
      parents: [rootId],
      trashed: false,
    });

    this.mockFiles.set(folderBId, {
      id: folderBId,
      name: 'Projects',
      mimeType: 'application/vnd.google-apps.folder',
      size: 0,
      createdTime: now,
      modifiedTime: now,
      parents: [rootId],
      trashed: false,
    });

    this.mockFiles.set(folderNotesId, {
      id: folderNotesId,
      name: 'Notes',
      mimeType: 'application/vnd.google-apps.folder',
      size: 0,
      createdTime: now,
      modifiedTime: now,
      parents: [rootId],
      trashed: false,
    });

    const samplePdfId = 'file_sample_pdf';
    this.mockFiles.set(samplePdfId, {
      id: samplePdfId,
      name: 'Project Proposal.pdf',
      mimeType: 'application/pdf',
      size: 2483942,
      createdTime: now,
      modifiedTime: now,
      parents: [folderAId],
      trashed: false,
    });
    this.mockFileContents.set(samplePdfId, Buffer.from('%PDF-1.4 Mock PDF Content for Private Cloud File Manager testing.'));

    const sampleNoteId = 'file_meeting_notes';
    const noteText = '# Meeting Notes\n\n- Welcome to Private Cloud File Manager!\n- Google Drive API integration active.\n- Password protected and secure.\n';
    this.mockFiles.set(sampleNoteId, {
      id: sampleNoteId,
      name: 'Welcome Notes.md',
      mimeType: 'text/markdown',
      size: Buffer.byteLength(noteText),
      createdTime: now,
      modifiedTime: now,
      parents: [folderNotesId],
      trashed: false,
    });
    this.mockFileContents.set(sampleNoteId, noteText);

    const sampleCodeId = 'file_server_config';
    const codeText = '// Sample Code File\nconsole.log("Private Cloud File Manager Server running");\n';
    this.mockFiles.set(sampleCodeId, {
      id: sampleCodeId,
      name: 'app_config.js',
      mimeType: 'text/javascript',
      size: Buffer.byteLength(codeText),
      createdTime: now,
      modifiedTime: now,
      parents: [folderBId],
      trashed: false,
    });
    this.mockFileContents.set(sampleCodeId, codeText);
  }

  public clearCache() {
    this.listCache.clear();
    this.breadcrumbsCache.clear();
    this.storageCache = null;
  }

  /**
   * Fast Root Hierarchy Authorization Boundary Check with In-Memory Caching
   */
  public async validateRootBoundary(fileId: string): Promise<boolean> {
    const rootId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    if (fileId === rootId || fileId === 'root') return true;

    if (this.validatedRootMap.has(fileId)) {
      return this.validatedRootMap.get(fileId)!;
    }

    if (!this.isLiveDrive || !this.drive) {
      let currentId: string | null = fileId;
      const visited = new Set<string>();

      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        if (currentId === rootId || currentId === 'root') {
          this.validatedRootMap.set(fileId, true);
          return true;
        }
        const file = this.mockFiles.get(currentId);
        if (!file || !file.parents || file.parents.length === 0) break;
        currentId = file.parents[0];
      }
      this.validatedRootMap.set(fileId, false);
      return false;
    }

    try {
      let currentId: string | null = fileId;
      const visited = new Set<string>();

      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        if (currentId === rootId) {
          this.validatedRootMap.set(fileId, true);
          return true;
        }

        if (this.parentCacheMap.has(currentId)) {
          currentId = this.parentCacheMap.get(currentId)!;
          continue;
        }

        const res: any = await this.drive.files.get({
          fileId: currentId,
          fields: 'id, parents',
        });

        const parents: string[] | undefined = res.data.parents;
        if (!parents || parents.length === 0) {
          this.parentCacheMap.set(currentId, null);
          break;
        }
        const parentId = parents[0];
        this.parentCacheMap.set(currentId, parentId);
        currentId = parentId;
      }

      this.validatedRootMap.set(fileId, false);
      return false;
    } catch (err: any) {
      if (err.status === 404 || err.code === 404) {
        console.warn(`[RootBoundary] Access denied: File ID '${fileId}' not found in Google Drive.`);
      } else {
        console.warn(`[RootBoundary] Access denied for File ID '${fileId}': ${err.message || 'Error'}`);
      }
      this.validatedRootMap.set(fileId, false);
      return false;
    }
  }

  /**
   * Fast Folder Listing with Parallel Fetching and Short-Lived Caching
   */
  public async listFolderContents(folderId?: string): Promise<{ files: FileItem[]; folder: FileItem | null; breadcrumbs: { id: string; name: string }[] }> {
    const targetFolderId = folderId && folderId !== 'root' ? folderId : env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

    // Check short-lived cache (10 sec TTL)
    const cached = this.listCache.get(targetFolderId);
    if (cached && Date.now() - cached.time < 10000) {
      return cached.result;
    }

    const isAllowed = await this.validateRootBoundary(targetFolderId);
    if (!isAllowed) {
      throw new Error('FORBIDDEN_OUTSIDE_ROOT: Requested folder is outside configured root directory.');
    }

    if (!this.isLiveDrive || !this.drive) {
      const items: FileItem[] = [];
      for (const file of this.mockFiles.values()) {
        if (!file.trashed && file.parents && file.parents.includes(targetFolderId) && file.id !== targetFolderId) {
          items.push(this.formatFileItem(file));
        }
      }

      const currentFolderRaw = this.mockFiles.get(targetFolderId);
      const currentFolder = currentFolderRaw ? this.formatFileItem(currentFolderRaw) : null;
      const breadcrumbs = await this.getBreadcrumbs(targetFolderId);

      const result = { files: items, folder: currentFolder, breadcrumbs };
      this.listCache.set(targetFolderId, { result, time: Date.now() });
      return result;
    }

    try {
      const query = `'${targetFolderId}' in parents and trashed = false`;

      // Parallelize Google Drive API requests for 10x faster response
      const [listRes, currentFolder, breadcrumbs] = await Promise.all([
        this.drive.files.list({
          q: query,
          fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, thumbnailLink, webViewLink)',
          orderBy: 'folder,name',
          pageSize: 100,
        }),
        this.fetchFolderMetadata(targetFolderId),
        this.getBreadcrumbs(targetFolderId),
      ]);

      const rawFiles = listRes.data.files || [];
      const files = rawFiles.map((f) => {
        if (f.id) {
          this.parentCacheMap.set(f.id, targetFolderId);
          this.validatedRootMap.set(f.id, true);
        }
        return this.formatFileItem(f);
      });

      const result = { files, folder: currentFolder, breadcrumbs };
      this.listCache.set(targetFolderId, { result, time: Date.now() });
      return result;
    } catch (err: any) {
      console.error('Failed to list folder contents from Drive:', err);
      throw new Error(`Drive API Error: ${err.message}`);
    }
  }

  private async fetchFolderMetadata(folderId: string): Promise<FileItem | null> {
    if (folderId === env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
      return {
        id: env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
        name: 'My Drive',
        mimeType: 'application/vnd.google-apps.folder',
        size: 0,
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        parentId: null,
        isFolder: true,
      };
    }

    try {
      const res = await this.drive!.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents',
      });
      return this.formatFileItem(res.data);
    } catch {
      return null;
    }
  }

  public async getFileMetadata(fileId: string): Promise<FileItem> {
    const isAllowed = await this.validateRootBoundary(fileId);
    if (!isAllowed) {
      throw new Error('FORBIDDEN_OUTSIDE_ROOT: Requested file is outside configured root directory.');
    }

    if (!this.isLiveDrive || !this.drive) {
      const file = this.mockFiles.get(fileId);
      if (!file || file.trashed) {
        throw new Error('File not found.');
      }
      return this.formatFileItem(file);
    }

    const res = await this.drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents, thumbnailLink, webViewLink',
    });
    return this.formatFileItem(res.data);
  }

  public async createFolder(name: string, parentId?: string): Promise<FileItem> {
    const targetParentId = parentId && parentId !== 'root' ? parentId : env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    const isAllowed = await this.validateRootBoundary(targetParentId);
    if (!isAllowed) {
      throw new Error('FORBIDDEN_OUTSIDE_ROOT: Cannot create folder outside configured root directory.');
    }

    const cleanName = this.sanitizeFilename(name);
    this.clearCache();

    if (!this.isLiveDrive || !this.drive) {
      const newId = `folder_${Date.now()}`;
      const now = new Date().toISOString();
      const folderObj = {
        id: newId,
        name: cleanName,
        mimeType: 'application/vnd.google-apps.folder',
        size: 0,
        createdTime: now,
        modifiedTime: now,
        parents: [targetParentId],
        trashed: false,
      };
      this.mockFiles.set(newId, folderObj);
      return this.formatFileItem(folderObj);
    }

    const fileMetadata = {
      name: cleanName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [targetParentId],
    };

    const res = await this.drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents',
    });

    const item = this.formatFileItem(res.data);
    this.parentCacheMap.set(item.id, targetParentId);
    this.validatedRootMap.set(item.id, true);
    return item;
  }

  public async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, parentId?: string): Promise<FileItem> {
    const targetParentId = parentId && parentId !== 'root' ? parentId : env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    const isAllowed = await this.validateRootBoundary(targetParentId);
    if (!isAllowed) {
      throw new Error('FORBIDDEN_OUTSIDE_ROOT: Cannot upload file outside configured root directory.');
    }

    const cleanName = this.sanitizeFilename(fileName);
    this.clearCache();

    if (!this.isLiveDrive || !this.drive) {
      const newId = `file_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const now = new Date().toISOString();
      const fileObj = {
        id: newId,
        name: cleanName,
        mimeType: mimeType || 'application/octet-stream',
        size: fileBuffer.length,
        createdTime: now,
        modifiedTime: now,
        parents: [targetParentId],
        trashed: false,
      };
      this.mockFiles.set(newId, fileObj);
      this.mockFileContents.set(newId, fileBuffer);
      return this.formatFileItem(fileObj);
    }

    const fileMetadata = {
      name: cleanName,
      parents: [targetParentId],
    };

    const media = {
      mimeType,
      body: Readable.from(fileBuffer),
    };

    const res = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents, thumbnailLink, webViewLink',
    });

    const item = this.formatFileItem(res.data);
    this.parentCacheMap.set(item.id, targetParentId);
    this.validatedRootMap.set(item.id, true);
    return item;
  }

  public async updateFileContent(fileId: string, content: string | Buffer): Promise<FileItem> {
    const isAllowed = await this.validateRootBoundary(fileId);
    if (!isAllowed) {
      throw new Error('FORBIDDEN_OUTSIDE_ROOT: Cannot update file outside configured root directory.');
    }

    const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;
    const now = new Date().toISOString();
    this.clearCache();

    if (!this.isLiveDrive || !this.drive) {
      const file = this.mockFiles.get(fileId);
      if (!file) throw new Error('File not found.');
      file.size = buffer.length;
      file.modifiedTime = now;
      this.mockFiles.set(fileId, file);
      this.mockFileContents.set(fileId, buffer);
      return this.formatFileItem(file);
    }

    const media = {
      body: Readable.from(buffer),
    };

    const res = await this.drive.files.update({
      fileId,
      media,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents',
    });

    return this.formatFileItem(res.data);
  }

  public async getFileStream(fileId: string): Promise<{ stream: Readable; mimeType: string; fileName: string; size: number }> {
    const isAllowed = await this.validateRootBoundary(fileId);
    if (!isAllowed) {
      throw new Error('FORBIDDEN_OUTSIDE_ROOT: Cannot download file outside configured root directory.');
    }

    if (!this.isLiveDrive || !this.drive) {
      const file = this.mockFiles.get(fileId);
      if (!file) throw new Error('File not found.');
      const rawContent = this.mockFileContents.get(fileId) || Buffer.from('');
      const buf = typeof rawContent === 'string' ? Buffer.from(rawContent) : rawContent;
      return {
        stream: Readable.from(buf),
        mimeType: file.mimeType,
        fileName: file.name,
        size: buf.length,
      };
    }

    const meta = await this.getFileMetadata(fileId);
    const res = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    return {
      stream: res.data as Readable,
      mimeType: meta.mimeType,
      fileName: meta.name,
      size: meta.size,
    };
  }

  public async getFileBuffer(fileId: string): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const { stream, mimeType, fileName } = await this.getFileStream(fileId);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return { buffer: Buffer.concat(chunks), mimeType, fileName };
  }

  public async renameFile(fileId: string, newName: string): Promise<FileItem> {
    const isAllowed = await this.validateRootBoundary(fileId);
    if (!isAllowed) {
      throw new Error('FORBIDDEN_OUTSIDE_ROOT: Cannot rename file outside configured root directory.');
    }

    const cleanName = this.sanitizeFilename(newName);
    this.clearCache();

    if (!this.isLiveDrive || !this.drive) {
      const file = this.mockFiles.get(fileId);
      if (!file) throw new Error('File not found.');
      file.name = cleanName;
      file.modifiedTime = new Date().toISOString();
      this.mockFiles.set(fileId, file);
      return this.formatFileItem(file);
    }

    const res = await this.drive.files.update({
      fileId,
      requestBody: { name: cleanName },
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents',
    });

    return this.formatFileItem(res.data);
  }

  public async moveFile(fileId: string, targetParentId: string): Promise<FileItem> {
    if (fileId === env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
      throw new Error('Cannot move the root folder.');
    }

    const isFileAllowed = await this.validateRootBoundary(fileId);
    const isTargetAllowed = await this.validateRootBoundary(targetParentId);
    if (!isFileAllowed || !isTargetAllowed) {
      throw new Error('FORBIDDEN_OUTSIDE_ROOT: File or target destination is outside root directory.');
    }

    if (fileId === targetParentId) {
      throw new Error('Cannot move a folder into itself.');
    }

    this.clearCache();
    this.parentCacheMap.set(fileId, targetParentId);

    if (!this.isLiveDrive || !this.drive) {
      const file = this.mockFiles.get(fileId);
      if (!file) throw new Error('File not found.');
      file.parents = [targetParentId];
      file.modifiedTime = new Date().toISOString();
      this.mockFiles.set(fileId, file);
      return this.formatFileItem(file);
    }

    const existingFile = await this.drive.files.get({
      fileId,
      fields: 'parents',
    });

    const previousParents = (existingFile.data.parents || []).join(',');

    const res = await this.drive.files.update({
      fileId,
      addParents: targetParentId,
      removeParents: previousParents,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents',
    });

    return this.formatFileItem(res.data);
  }

  public async deleteFile(fileId: string): Promise<boolean> {
    if (fileId === env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
      throw new Error('Cannot delete the root folder.');
    }

    const isAllowed = await this.validateRootBoundary(fileId);
    if (!isAllowed) {
      throw new Error('FORBIDDEN_OUTSIDE_ROOT: Cannot delete file outside configured root directory.');
    }

    this.clearCache();

    if (!this.isLiveDrive || !this.drive) {
      const file = this.mockFiles.get(fileId);
      if (!file) throw new Error('File not found.');
      file.trashed = true;
      this.mockFiles.set(fileId, file);
      return true;
    }

    await this.drive.files.update({
      fileId,
      requestBody: { trashed: true },
    });

    return true;
  }

  public async searchFiles(term: string): Promise<FileItem[]> {
    if (!term || term.trim().length === 0) return [];
    const cleanTerm = term.trim().toLowerCase();

    if (!this.isLiveDrive || !this.drive) {
      const results: FileItem[] = [];
      for (const file of this.mockFiles.values()) {
        if (!file.trashed && file.name.toLowerCase().includes(cleanTerm)) {
          const isAllowed = await this.validateRootBoundary(file.id);
          if (isAllowed) {
            results.push(this.formatFileItem(file));
          }
        }
      }
      return results;
    }

    try {
      const query = `name contains '${cleanTerm.replace(/'/g, "\\'")}' and trashed = false`;
      const res = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, parents, thumbnailLink, webViewLink)',
        pageSize: 50,
      });

      const rawFiles = res.data.files || [];
      const validFiles: FileItem[] = [];

      for (const raw of rawFiles) {
        if (raw.id) {
          const isAllowed = await this.validateRootBoundary(raw.id);
          if (isAllowed) {
            validFiles.push(this.formatFileItem(raw));
          }
        }
      }

      return validFiles;
    } catch (err: any) {
      console.error('Search error from Drive API:', err);
      throw new Error(`Search failed: ${err.message}`);
    }
  }

  public async getStorageQuota(): Promise<StorageQuota> {
    if (this.storageCache && Date.now() - this.storageCache.time < 60000) {
      return this.storageCache.data;
    }

    if (!this.isLiveDrive || !this.drive) {
      const used = 3400000000;
      const limit = 16106127360;
      const percentage = Math.round((used / limit) * 100);
      const data = {
        used,
        limit,
        available: limit - used,
        formattedUsed: '3.4 GB',
        formattedLimit: '15 GB',
        formattedAvailable: '11.6 GB',
        percentage,
      };
      this.storageCache = { data, time: Date.now() };
      return data;
    }

    try {
      const res = await this.drive.about.get({
        fields: 'storageQuota',
      });
      const q = res.data.storageQuota;
      const used = parseInt(q?.usage || '0', 10);
      const limit = parseInt(q?.limit || '16106127360', 10);
      const available = Math.max(0, limit - used);
      const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;

      const data = {
        used,
        limit,
        available,
        formattedUsed: this.formatBytes(used),
        formattedLimit: this.formatBytes(limit),
        formattedAvailable: this.formatBytes(available),
        percentage,
      };
      this.storageCache = { data, time: Date.now() };
      return data;
    } catch (err) {
      console.error('Error fetching Drive storage quota:', err);
      return {
        used: 0,
        limit: 0,
        available: 0,
        formattedUsed: 'Unavailable',
        formattedLimit: 'Unavailable',
        formattedAvailable: 'Unavailable',
        percentage: 0,
      };
    }
  }

  private async getBreadcrumbs(folderId: string): Promise<{ id: string; name: string }[]> {
    const rootId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    const cached = this.breadcrumbsCache.get(folderId);
    if (cached && Date.now() - cached.time < 300000) {
      return cached.breadcrumbs;
    }

    const breadcrumbs: { id: string; name: string }[] = [];
    let currentId: string | null = folderId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);

      if (currentId === rootId || currentId === 'root') {
        breadcrumbs.unshift({ id: rootId, name: 'My Drive' });
        break;
      }

      if (!this.isLiveDrive || !this.drive) {
        const item = this.mockFiles.get(currentId);
        if (!item) break;
        breadcrumbs.unshift({ id: item.id, name: item.name });
        currentId = item.parents && item.parents.length > 0 ? item.parents[0] : null;
      } else {
        try {
          const res: any = await this.drive.files.get({
            fileId: currentId,
            fields: 'id, name, parents',
          });
          breadcrumbs.unshift({ id: res.data.id!, name: res.data.name! });
          const parents: string[] | undefined = res.data.parents;
          if (parents && parents.length > 0) {
            this.parentCacheMap.set(currentId, parents[0]);
            currentId = parents[0];
          } else {
            currentId = null;
          }
        } catch {
          break;
        }
      }
    }

    if (breadcrumbs.length === 0 || breadcrumbs[0].id !== rootId) {
      breadcrumbs.unshift({ id: rootId, name: 'My Drive' });
    }

    this.breadcrumbsCache.set(folderId, { breadcrumbs, time: Date.now() });
    return breadcrumbs;
  }

  private formatFileItem(f: any): FileItem {
    const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
    const isNote = f.mimeType === 'text/markdown' || (f.mimeType === 'text/plain' && f.name.endsWith('.md'));
    const parentId = f.parents && f.parents.length > 0 ? f.parents[0] : null;

    return {
      id: f.id,
      name: f.name || 'Untitled',
      mimeType: f.mimeType || 'application/octet-stream',
      size: parseInt(f.size || '0', 10),
      createdTime: f.createdTime || new Date().toISOString(),
      modifiedTime: f.modifiedTime || new Date().toISOString(),
      parentId,
      isFolder,
      isNote,
      thumbnailLink: f.thumbnailLink,
      webViewLink: f.webViewLink,
    };
  }

  public async listUserFolders(parentFolderId?: string): Promise<{ id: string; name: string }[]> {
    if (!this.isLiveDrive || !this.drive) {
      return Array.from(this.mockFiles.values())
        .filter((f) => f.mimeType === 'application/vnd.google-apps.folder')
        .map((f) => ({ id: f.id, name: f.name }));
    }

    try {
      const query = parentFolderId
        ? `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
        : "mimeType = 'application/vnd.google-apps.folder' and trashed = false";

      const res = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        pageSize: 50,
        orderBy: 'name',
      });

      return (res.data.files || []).map((f) => ({ id: f.id!, name: f.name! }));
    } catch (err: any) {
      console.error('Failed to list Google Drive user folders:', err);
      throw new Error(`Google Drive API Error: ${err.message}`);
    }
  }

  public async createRootFolder(folderName: string): Promise<{ id: string; name: string }> {
    const cleanName = this.sanitizeFilename(folderName || 'Private Cloud');

    if (!this.isLiveDrive || !this.drive) {
      const newId = `folder_root_${Date.now()}`;
      const now = new Date().toISOString();
      const folderObj = {
        id: newId,
        name: cleanName,
        mimeType: 'application/vnd.google-apps.folder',
        size: 0,
        createdTime: now,
        modifiedTime: now,
        parents: [],
        trashed: false,
      };
      this.mockFiles.set(newId, folderObj);
      return { id: newId, name: cleanName };
    }

    const res = await this.drive.files.create({
      requestBody: {
        name: cleanName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id, name',
    });

    return { id: res.data.id!, name: res.data.name! };
  }

  private sanitizeFilename(name: string): string {
    return name.replace(/[\\/:\*\?"<>\|]/g, '_').trim();
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

export const googleDriveService = new GoogleDriveService();

