import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { isInitialized } from '../database/db.js';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    username: string;
    role: string;
    csrfToken: string;
    lastActivity: number;
    oauthState?: string;
    oauthRedirectUri?: string;
  }
}

export function checkSetupStatus(req: Request, res: Response, next: NextFunction) {
  const initialized = isInitialized();
  const fullPath = req.originalUrl || req.url || req.path;
  const isSetupRoute = fullPath.includes('/setup');
  const isHealthRoute = fullPath.includes('/health');

  if (!initialized) {
    if (isSetupRoute || isHealthRoute) {
      return next();
    }
    return res.status(503).json({
      success: false,
      setupRequired: true,
      error: 'SETUP_REQUIRED: System is not initialized. Please complete setup at /setup.',
    });
  }

  if (initialized && isSetupRoute && !fullPath.includes('/setup/status')) {
    return res.status(403).json({
      success: false,
      error: 'SETUP_ALREADY_COMPLETED: First-run setup has already been completed.',
    });
  }

  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED: Authentication required to access file manager resources.',
    });
  }

  // Check inactivity timeout (60 minutes)
  const now = Date.now();
  const timeoutMs = 60 * 60 * 1000;
  if (req.session.lastActivity && now - req.session.lastActivity > timeoutMs) {
    req.session.destroy(() => {});
    return res.status(401).json({
      success: false,
      error: 'SESSION_EXPIRED: Your session has expired due to inactivity. Please log in again.',
    });
  }

  req.session.lastActivity = now;

  // Generate CSRF token for session if not already present
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }

  next();
}

export function validateCsrf(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    const clientToken = req.headers['x-csrf-token'] || req.body?._csrf;
    const sessionToken = req.session?.csrfToken;

    if (!sessionToken || !clientToken || clientToken !== sessionToken) {
      return res.status(403).json({
        success: false,
        error: 'CSRF_VALIDATION_FAILED: Invalid or missing anti-CSRF token.',
      });
    }
  }
  next();
}
