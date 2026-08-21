import { Request, Response } from 'express';
import { notesService } from '../services/notesService.js';
import { authService } from '../services/authService.js';

export async function listNotes(req: Request, res: Response) {
  try {
    const notes = await notesService.listAllNotes();
    return res.json({ success: true, data: notes });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to list notes.' });
  }
}

export async function createNote(req: Request, res: Response) {
  const { title, content, parentId } = req.body;
  const username = req.session.username || 'admin';
  const ip = req.ip || 'unknown';

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, error: 'Note title is required.' });
  }

  try {
    const note = await notesService.createNote(title.trim(), content || '', parentId);
    await authService.logAuditEvent('NOTE_CREATE', `Created note '${note.title}'`, username, ip);
    return res.json({ success: true, data: note });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to create note.' });
  }
}

export async function getNote(req: Request, res: Response) {
  const id = req.params.id as string;
  try {
    const note = await notesService.getNote(id);
    return res.json({ success: true, data: note });
  } catch (err: any) {
    return res.status(404).json({ success: false, error: err.message || 'Note not found.' });
  }
}

export async function updateNote(req: Request, res: Response) {
  const id = req.params.id as string;
  const { title, content } = req.body;
  const username = req.session.username || 'admin';
  const ip = req.ip || 'unknown';

  try {
    const note = await notesService.updateNote(id, title, content);
    await authService.logAuditEvent('NOTE_UPDATE', `Updated note '${note.title}'`, username, ip);
    return res.json({ success: true, data: note });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to update note.' });
  }
}

export async function deleteNote(req: Request, res: Response) {
  const id = req.params.id as string;
  const username = req.session.username || 'admin';
  const ip = req.ip || 'unknown';

  try {
    await notesService.deleteNote(id);
    await authService.logAuditEvent('NOTE_DELETE', `Deleted note ID ${id}`, username, ip);
    return res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to delete note.' });
  }
}
