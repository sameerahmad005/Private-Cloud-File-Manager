import { googleDriveService } from './googleDriveService.js';
import { env } from '../config/env.js';
import { NoteItem } from '../types.js';

export class NotesService {
  private async getOrCreateNotesFolder(parentId?: string): Promise<string> {
    const targetParentId = parentId && parentId !== 'root' ? parentId : env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
    
    const { files } = await googleDriveService.listFolderContents(targetParentId);
    const existingNotesFolder = files.find(
      (f) => f.isFolder && f.name.toLowerCase() === 'notes'
    );

    if (existingNotesFolder) {
      return existingNotesFolder.id;
    }

    const createdFolder = await googleDriveService.createFolder('Notes', targetParentId);
    return createdFolder.id;
  }

  public async createNote(title: string, content: string, parentId?: string): Promise<NoteItem> {
    const cleanTitle = title.endsWith('.md') ? title : `${title}.md`;
    const folderId = await this.getOrCreateNotesFolder(parentId);
    const buffer = Buffer.from(content || '', 'utf-8');

    const fileItem = await googleDriveService.uploadFile(
      buffer,
      cleanTitle,
      'text/markdown',
      folderId
    );

    return {
      id: fileItem.id,
      title: fileItem.name.replace(/\.md$/, ''),
      content: content || '',
      mimeType: 'text/markdown',
      createdTime: fileItem.createdTime,
      modifiedTime: fileItem.modifiedTime,
      parentId: fileItem.parentId,
    };
  }

  public async getNote(noteId: string): Promise<NoteItem> {
    const meta = await googleDriveService.getFileMetadata(noteId);
    const { buffer } = await googleDriveService.getFileBuffer(noteId);
    const content = buffer.toString('utf-8');

    return {
      id: meta.id,
      title: meta.name.replace(/\.md$/, ''),
      content,
      mimeType: meta.mimeType.includes('markdown') ? 'text/markdown' : 'text/plain',
      createdTime: meta.createdTime,
      modifiedTime: meta.modifiedTime,
      parentId: meta.parentId,
    };
  }

  public async updateNote(noteId: string, title?: string, content?: string): Promise<NoteItem> {
    let meta = await googleDriveService.getFileMetadata(noteId);

    if (title && title.trim()) {
      const cleanTitle = title.endsWith('.md') ? title : `${title}.md`;
      if (cleanTitle !== meta.name) {
        meta = await googleDriveService.renameFile(noteId, cleanTitle);
      }
    }

    if (content !== undefined) {
      meta = await googleDriveService.updateFileContent(noteId, content);
    }

    const { buffer } = await googleDriveService.getFileBuffer(noteId);

    return {
      id: meta.id,
      title: meta.name.replace(/\.md$/, ''),
      content: buffer.toString('utf-8'),
      mimeType: meta.mimeType.includes('markdown') ? 'text/markdown' : 'text/plain',
      createdTime: meta.createdTime,
      modifiedTime: meta.modifiedTime,
      parentId: meta.parentId,
    };
  }

  public async deleteNote(noteId: string): Promise<boolean> {
    return googleDriveService.deleteFile(noteId);
  }

  public async listAllNotes(): Promise<NoteItem[]> {
    const notesFolderId = await this.getOrCreateNotesFolder();
    const { files } = await googleDriveService.listFolderContents(notesFolderId);

    const notePromises = files
      .filter((f) => !f.isFolder && (f.isNote || f.name.endsWith('.md') || f.mimeType === 'text/markdown'))
      .map(async (f) => {
        try {
          const { buffer } = await googleDriveService.getFileBuffer(f.id);
          return {
            id: f.id,
            title: f.name.replace(/\.md$/, ''),
            content: buffer.toString('utf-8'),
            mimeType: 'text/markdown' as const,
            createdTime: f.createdTime,
            modifiedTime: f.modifiedTime,
            parentId: f.parentId,
          };
        } catch {
          return {
            id: f.id,
            title: f.name.replace(/\.md$/, ''),
            content: '',
            mimeType: 'text/markdown' as const,
            createdTime: f.createdTime,
            modifiedTime: f.modifiedTime,
            parentId: f.parentId,
          };
        }
      });

    return Promise.all(notePromises);
  }
}

export const notesService = new NotesService();
