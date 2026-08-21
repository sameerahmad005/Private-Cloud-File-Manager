import { Request, Response } from 'express';
import multer from 'multer';
import { googleDriveService } from '../services/googleDriveService.js';
import { authService } from '../services/authService.js';
import { env } from '../config/env.js';
import { FileCategory, FileItem, FileSortField, SortDirection } from '../types.js';

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_SIZE },
});

export async function listFiles(req: Request, res: Response) {
  const folderId = (req.query.folderId as string) || env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const category = (req.query.category as FileCategory) || 'all';
  const sortBy = (req.query.sortBy as FileSortField) || 'name';
  const sortOrder = (req.query.sortOrder as SortDirection) || 'asc';

  try {
    const { files, folder, breadcrumbs } = await googleDriveService.listFolderContents(folderId);

    let filtered = files.filter((file) => {
      if (category === 'all') return true;
      if (category === 'folders') return file.isFolder;
      if (category === 'pdfs') return file.mimeType === 'application/pdf';
      if (category === 'images') return file.mimeType.startsWith('image/');
      if (category === 'videos') return file.mimeType.startsWith('video/');
      if (category === 'notes') return file.isNote || file.name.endsWith('.md');
      if (category === 'documents') {
        return (
          file.mimeType.includes('word') ||
          file.mimeType.includes('document') ||
          file.name.endsWith('.docx') ||
          file.name.endsWith('.doc')
        );
      }
      if (category === 'spreadsheets') {
        return (
          file.mimeType.includes('sheet') ||
          file.mimeType.includes('excel') ||
          file.name.endsWith('.xlsx') ||
          file.name.endsWith('.csv')
        );
      }
      if (category === 'presentations') {
        return (
          file.mimeType.includes('presentation') ||
          file.mimeType.includes('powerpoint') ||
          file.name.endsWith('.pptx')
        );
      }
      if (category === 'archives') {
        return (
          file.mimeType.includes('zip') ||
          file.mimeType.includes('tar') ||
          file.mimeType.includes('rar') ||
          file.name.endsWith('.zip')
        );
      }
      if (category === 'code') {
        return (
          file.mimeType.includes('javascript') ||
          file.mimeType.includes('json') ||
          file.mimeType.includes('html') ||
          file.mimeType.includes('css') ||
          file.name.endsWith('.js') ||
          file.name.endsWith('.ts') ||
          file.name.endsWith('.py')
        );
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;

      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return res.json({
      success: true,
      data: {
        files: filtered,
        currentFolder: folder,
        breadcrumbs,
      },
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN_OUTSIDE_ROOT');
    return res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: err.message || 'Failed to list folder files.',
    });
  }
}

export async function getFileMetadata(req: Request, res: Response) {
  const id = req.params.id as string;
  try {
    const file = await googleDriveService.getFileMetadata(id);
    return res.json({ success: true, data: file });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN_OUTSIDE_ROOT');
    return res.status(isForbidden ? 403 : 404).json({
      success: false,
      error: err.message || 'File not found.',
    });
  }
}

export async function uploadFiles(req: Request, res: Response) {
  const files = req.files as Express.Multer.File[];
  const parentId = (req.body.parentId as string) || env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const username = req.session.username || 'admin';
  const ip = req.ip || 'unknown';

  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files provided for upload.' });
  }

  try {
    const uploadResults: FileItem[] = [];
    for (const file of files) {
      const uploadedItem = await googleDriveService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        parentId
      );
      uploadResults.push(uploadedItem);

      await authService.logAuditEvent(
        'FILE_UPLOAD',
        `Uploaded file '${file.originalname}' (${file.size} bytes)`,
        username,
        ip
      );
    }

    return res.json({
      success: true,
      data: uploadResults,
      message: `${uploadResults.length} file(s) uploaded successfully.`,
    });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN_OUTSIDE_ROOT');
    return res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: err.message || 'File upload failed.',
    });
  }
}

export async function renameFile(req: Request, res: Response) {
  const id = req.params.id as string;
  const { name } = req.body;
  const username = req.session.username || 'admin';
  const ip = req.ip || 'unknown';

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'New name is required.' });
  }

  try {
    const updated = await googleDriveService.renameFile(id, name.trim());
    await authService.logAuditEvent('FILE_RENAME', `Renamed item ID ${id} to '${name.trim()}'`, username, ip);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN_OUTSIDE_ROOT');
    return res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: err.message || 'Failed to rename file.',
    });
  }
}

export async function moveFile(req: Request, res: Response) {
  const id = req.params.id as string;
  const { targetParentId } = req.body;
  const username = req.session.username || 'admin';
  const ip = req.ip || 'unknown';

  if (!targetParentId) {
    return res.status(400).json({ success: false, error: 'Target parent folder ID is required.' });
  }

  try {
    const updated = await googleDriveService.moveFile(id, targetParentId);
    await authService.logAuditEvent('FILE_MOVE', `Moved item ID ${id} to parent ${targetParentId}`, username, ip);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN_OUTSIDE_ROOT');
    return res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: err.message || 'Failed to move file.',
    });
  }
}

export async function deleteFile(req: Request, res: Response) {
  const id = req.params.id as string;
  const username = req.session.username || 'admin';
  const ip = req.ip || 'unknown';

  try {
    await googleDriveService.deleteFile(id);
    await authService.logAuditEvent('FILE_DELETE', `Moved item ID ${id} to Google Drive trash`, username, ip);
    return res.json({ success: true, message: 'Item moved to trash successfully.' });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN_OUTSIDE_ROOT');
    return res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: err.message || 'Failed to delete file.',
    });
  }
}

export async function downloadFile(req: Request, res: Response) {
  const id = req.params.id as string;
  try {
    const { stream, mimeType, fileName, size } = await googleDriveService.getFileStream(id);

    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    if (size > 0) res.setHeader('Content-Length', size.toString());

    stream.pipe(res);
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN_OUTSIDE_ROOT');
    return res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: err.message || 'Failed to stream download.',
    });
  }
}

export async function previewFile(req: Request, res: Response) {
  const id = req.params.id as string;
  try {
    const { stream, mimeType, fileName } = await googleDriveService.getFileStream(id);

    res.setHeader('Content-Type', mimeType || 'text/plain');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);

    stream.pipe(res);
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN_OUTSIDE_ROOT');
    return res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: err.message || 'Failed to fetch preview stream.',
    });
  }
}
