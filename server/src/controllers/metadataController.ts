import { Request, Response } from 'express';
import { dbAll, dbGet, dbRun } from '../database/db.js';
import { googleDriveService } from '../services/googleDriveService.js';
import { env } from '../config/env.js';
import { FileItem } from '../types.js';

export async function getFavorites(req: Request, res: Response) {
  const userId = req.session.userId!;
  try {
    const rows = await dbAll<{ drive_file_id: string }>('SELECT drive_file_id FROM favorites WHERE user_id = ?', [userId]);
    const items: FileItem[] = [];

    for (const r of rows) {
      try {
        const item = await googleDriveService.getFileMetadata(r.drive_file_id);
        item.isFavorite = true;
        items.push(item);
      } catch {
        // File may have been deleted in drive
      }
    }

    return res.json({ success: true, data: items });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch favorites.' });
  }
}

export async function toggleFavorite(req: Request, res: Response) {
  const userId = req.session.userId!;
  const { driveFileId } = req.body;

  if (!driveFileId) {
    return res.status(400).json({ success: false, error: 'driveFileId is required.' });
  }

  try {
    const existing = await dbGet('SELECT * FROM favorites WHERE user_id = ? AND drive_file_id = ?', [userId, driveFileId]);
    if (existing) {
      await dbRun('DELETE FROM favorites WHERE user_id = ? AND drive_file_id = ?', [userId, driveFileId]);
      return res.json({ success: true, isFavorite: false, message: 'Removed from favorites.' });
    } else {
      const id = `fav_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await dbRun('INSERT INTO favorites (id, user_id, drive_file_id) VALUES (?, ?, ?)', [id, userId, driveFileId]);
      return res.json({ success: true, isFavorite: true, message: 'Added to favorites.' });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to toggle favorite.' });
  }
}

export async function getRecents(req: Request, res: Response) {
  const userId = req.session.userId!;
  try {
    const rows = await dbAll<{ drive_file_id: string }>(
      'SELECT drive_file_id FROM recents WHERE user_id = ? ORDER BY accessed_at DESC LIMIT 20',
      [userId]
    );
    const items: FileItem[] = [];

    for (const r of rows) {
      try {
        const item = await googleDriveService.getFileMetadata(r.drive_file_id);
        items.push(item);
      } catch {
        // File may no longer exist
      }
    }

    return res.json({ success: true, data: items });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch recents.' });
  }
}

export async function recordRecent(req: Request, res: Response) {
  const userId = req.session.userId!;
  const { driveFileId } = req.body;

  if (!driveFileId) return res.status(400).json({ success: false, error: 'driveFileId required.' });

  try {
    const id = `rec_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await dbRun(
      'INSERT INTO recents (id, user_id, drive_file_id, accessed_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, drive_file_id) DO UPDATE SET accessed_at = excluded.accessed_at',
      [id, userId, driveFileId, new Date().toISOString()]
    );
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStorageInfo(req: Request, res: Response) {
  try {
    const storage = await googleDriveService.getStorageQuota();
    return res.json({ success: true, data: storage });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch storage quota.' });
  }
}

export async function getSettings(req: Request, res: Response) {
  try {
    return res.json({
      success: true,
      data: {
        appName: 'Private Cloud File Manager',
        theme: 'system',
        defaultView: 'grid',
        maxUploadSize: env.MAX_UPLOAD_SIZE,
        sessionTimeout: env.SESSION_TIMEOUT,
        rateLimit: env.RATE_LIMIT,
        googleDriveConnected: googleDriveService.isLiveDrive,
        rootFolderId: env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAuditLogs(req: Request, res: Response) {
  try {
    const logs = await dbAll('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
    return res.json({ success: true, data: logs });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch audit logs.' });
  }
}

export async function getHealthStatus(req: Request, res: Response) {
  return res.json({
    status: 'ok',
    drive: googleDriveService.isLiveDrive ? 'connected' : 'mock_fallback',
    timestamp: new Date().toISOString(),
  });
}
