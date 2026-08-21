import { Request, Response } from 'express';
import { googleDriveService } from '../services/googleDriveService.js';

export async function searchFiles(req: Request, res: Response) {
  const query = (req.query.q as string) || '';

  if (!query || !query.trim()) {
    return res.json({ success: true, data: [] });
  }

  try {
    const results = await googleDriveService.searchFiles(query.trim());
    return res.json({ success: true, data: results });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Search operation failed.' });
  }
}
