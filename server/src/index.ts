import express from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { env } from './config/env.js';
import { initDatabase, isInitialized } from './database/db.js';
import { configureSecurityHeaders, globalErrorHandler } from './middleware/securityMiddleware.js';
import { requireAuth, validateCsrf, checkSetupStatus } from './middleware/authMiddleware.js';
import { loginRateLimiter, apiRateLimiter } from './middleware/rateLimitMiddleware.js';

// Controllers
import * as authController from './controllers/authController.js';
import * as filesController from './controllers/filesController.js';
import * as foldersController from './controllers/foldersController.js';
import * as notesController from './controllers/notesController.js';
import * as searchController from './controllers/searchController.js';
import * as metadataController from './controllers/metadataController.js';
import * as setupController from './controllers/setupController.js';

const app = express();

// Trust reverse proxy (cPanel / LiteSpeed / Cloudflare) for HTTPS secure session cookies
app.set('trust proxy', 1);

// Security Headers
configureSecurityHeaders(app);

// Explicitly block any HTTP request trying to fetch .env or credential files
app.use((req, res, next) => {
  const lowerPath = req.path.toLowerCase();
  if (lowerPath.includes('.env') || lowerPath.includes('client_secret') || lowerPath.includes('.json')) {
    if (!req.path.startsWith('/api')) {
      return res.status(403).json({ error: 'FORBIDDEN: Direct access to configuration files is strictly prohibited.' });
    }
  }
  next();
});

// CORS
app.use(
  cors({
    origin: env.APP_URL || 'http://localhost:5000',
    credentials: true,
  })
);

// Body Parsers & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

import FileStoreFactory from 'session-file-store';

const FileStore = FileStoreFactory(session);
const sessionsDir = path.resolve(__dirname, '../data/sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// Server-side Sessions (Persistent Disk Store across cPanel workers)
app.use(
  session({
    store: new FileStore({
      path: sessionsDir,
      ttl: env.SESSION_TIMEOUT * 60,
      retries: 0,
      logFn: () => {},
    }),
    name: 'pcloud_sid',
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: env.SESSION_TIMEOUT * 60 * 1000,
    },
  })
);

// Enforce Setup Status Check for all /api endpoints
app.use('/api', checkSetupStatus);

// Health Endpoint (Public)
app.get('/api/health', metadataController.getHealthStatus);

// First-Run Setup Endpoints
app.get('/api/setup/status', setupController.getSetupStatus);
app.post('/api/setup/admin', setupController.createAdmin);
app.post('/api/setup/oauth-config', setupController.saveOauthConfig);
app.get('/api/setup/oauth/url', setupController.getOAuthUrl);
app.get('/api/setup/oauth/callback', setupController.handleOAuthCallback);
app.get('/api/setup/folders', setupController.listDriveFolders);
app.post('/api/setup/select-folder', setupController.selectStorageFolder);
app.post('/api/setup/complete', setupController.completeSetup);

// Auth Routes (Public login / session)
app.post('/api/auth/login', loginRateLimiter, authController.login);
app.get('/api/auth/session', authController.getSession);
app.post('/api/auth/logout', authController.logout);

// Protect all subsequent /api endpoints
app.use('/api', requireAuth, apiRateLimiter, validateCsrf);

// Change Password
app.post('/api/auth/change-password', authController.changePassword);

// File Routes
app.get('/api/files', filesController.listFiles);
app.get('/api/files/:id', filesController.getFileMetadata);
app.post('/api/files/upload', filesController.uploadMiddleware.array('files', 10), filesController.uploadFiles);
app.patch('/api/files/:id', filesController.renameFile);
app.delete('/api/files/:id', filesController.deleteFile);
app.post('/api/files/:id/move', filesController.moveFile);
app.get('/api/files/:id/download', filesController.downloadFile);
app.get('/api/files/:id/preview', filesController.previewFile);

// Folder Routes
app.post('/api/folders', foldersController.createFolder);

// Notes Routes
app.get('/api/notes', notesController.listNotes);
app.post('/api/notes', notesController.createNote);
app.get('/api/notes/:id', notesController.getNote);
app.patch('/api/notes/:id', notesController.updateNote);
app.delete('/api/notes/:id', notesController.deleteNote);

// Search Route
app.get('/api/search', searchController.searchFiles);

// Metadata, Settings, Favorites, Recents
app.get('/api/favorites', metadataController.getFavorites);
app.post('/api/favorites/toggle', metadataController.toggleFavorite);
app.get('/api/recents', metadataController.getRecents);
app.post('/api/recents/record', metadataController.recordRecent);
app.get('/api/storage', metadataController.getStorageInfo);
app.get('/api/settings', metadataController.getSettings);
app.get('/api/audit-logs', metadataController.getAuditLogs);

// Serve static frontend build if present in production
const possibleClientPaths = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), 'dist'),
];

const clientBuildPath = possibleClientPaths.find((p) => fs.existsSync(p)) || possibleClientPaths[0];
app.use(express.static(clientBuildPath));

// Server-side redirect for /setup and /setup/* routes once installation is initialized
app.get(['/setup', '/setup/*'], (req, res, next) => {
  if (isInitialized()) {
    console.log(`[SetupLock] Redirecting attempt to access ${req.path} after setup completion.`);
    return res.redirect(302, '/');
  }
  next();
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Global Error Handler
app.use(globalErrorHandler);

// Start Server
async function startServer() {
  await initDatabase();
  app.listen(env.PORT, () => {
    console.log(`=======================================================`);
    console.log(`Private Cloud File Manager Server running on port ${env.PORT}`);
    console.log(`Mode: ${env.APP_ENV}`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
