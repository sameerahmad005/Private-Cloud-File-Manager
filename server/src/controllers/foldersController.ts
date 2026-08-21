import { Request, Response } from 'express';
import { googleDriveService } from '../services/googleDriveService.js';
import { authService } from '../services/authService.js';

export async function createFolder(req: Request, res: Response) {
  const { name, parentId } = req.body;
  const username = req.session.username || 'admin';
  const ip = req.ip || 'unknown';

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Folder name is required.' });
  }

  try {
    const createdFolder = await googleDriveService.createFolder(name.trim(), parentId);
    await authService.logAuditEvent(
      'FOLDER_CREATE',
      `Created folder '${createdFolder.name}' (ID: ${createdFolder.id})`,
      username,
      ip
    );
    return res.json({ success: true, data: createdFolder });
  } catch (err: any) {
    const isForbidden = err.message?.includes('FORBIDDEN_OUTSIDE_ROOT');
    return res.status(isForbidden ? 403 : 500).json({
      success: false,
      error: err.message || 'Failed to create folder.',
    });
  }
}
