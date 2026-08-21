import { Request, Response } from 'express';
import crypto from 'crypto';
import { authService } from '../services/authService.js';

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required.',
    });
  }

  try {
    const user = await authService.authenticate(username, password, ip);
    if (!user) {
      await authService.logAuditEvent('LOGIN_FAILED', `Failed login attempt for username '${username}'`, username, ip);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    const csrfToken = crypto.randomBytes(24).toString('hex');
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.csrfToken = csrfToken;
    req.session.lastActivity = Date.now();

    await authService.logAuditEvent('LOGIN_SUCCESS', `User '${user.username}' logged in successfully`, user.username, ip);

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    return res.json({
      success: true,
      data: {
        user,
        csrfToken,
      },
    });
  } catch (err: any) {
    return res.status(err.message?.includes('TOO_MANY_REQUESTS') ? 429 : 500).json({
      success: false,
      error: err.message || 'Authentication error',
    });
  }
}

export async function logout(req: Request, res: Response) {
  const username = req.session?.username || 'unknown';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Logout failed.' });
    }
    res.clearCookie('connect.sid');
    authService.logAuditEvent('LOGOUT', `User '${username}' logged out`, username, ip);
    return res.json({ success: true, message: 'Logged out successfully.' });
  });
}

export async function getSession(req: Request, res: Response) {
  if (!req.session || !req.session.userId) {
    return res.json({
      success: true,
      data: { authenticated: false },
    });
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }

  return res.json({
    success: true,
    data: {
      authenticated: true,
      user: {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role,
      },
      csrfToken: req.session.csrfToken,
    },
  });
}

export async function changePassword(req: Request, res: Response) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.session.userId!;
  const username = req.session.username || 'admin';
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  try {
    await authService.changePassword(userId, currentPassword, newPassword);
    await authService.logAuditEvent('PASSWORD_CHANGE', `User '${username}' changed password`, username, ip);
    return res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
}
