import { Request, Response } from 'express';
import crypto from 'crypto';
import { google } from 'googleapis';
import { isInitialized, setAppSetting } from '../database/db.js';
import { authService } from '../services/authService.js';
import { googleDriveService } from '../services/googleDriveService.js';
import { env } from '../config/env.js';

export async function getSetupStatus(req: Request, res: Response) {
  const initialized = isInitialized();
  const hasOauthConfig = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const hasRefreshToken = Boolean(env.GOOGLE_REFRESH_TOKEN);
  const isDriveConnected = googleDriveService.isLiveDrive;
  const providerState = googleDriveService.providerState;
  
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const dynamicOrigin = `${protocol}://${host}`;
  const effectiveAppUrl = env.APP_URL && !env.APP_URL.includes('localhost') ? env.APP_URL : (dynamicOrigin.includes('localhost') && env.APP_URL ? env.APP_URL : dynamicOrigin);
  const redirectUri = `${effectiveAppUrl}/api/setup/oauth/callback`;
  const rootFolderId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  return res.json({
    success: true,
    data: {
      initialized,
      providerState,
      hasOauthConfig,
      hasRefreshToken,
      isDriveConnected,
      redirectUri,
      rootFolderId,
    },
  });
}

export async function createAdmin(req: Request, res: Response) {
  if (isInitialized()) {
    return res.status(403).json({ success: false, error: 'SETUP_ALREADY_COMPLETED: First-run setup is locked.' });
  }

  const { username, password } = req.body;
  try {
    const user = await authService.createAdminUser(username, password);

    const csrfToken = crypto.randomBytes(24).toString('hex');
    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.csrfToken = csrfToken;
    req.session.lastActivity = Date.now();

    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => (err ? reject(err) : resolve()));
    });

    return res.json({
      success: true,
      data: { user, csrfToken },
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Failed to create admin user.' });
  }
}

export async function saveOauthConfig(req: Request, res: Response) {
  if (isInitialized()) {
    return res.status(403).json({ success: false, error: 'SETUP_ALREADY_COMPLETED: First-run setup is locked.' });
  }

  const { clientId, clientSecret } = req.body;

  if (!clientId || typeof clientId !== 'string' || !clientId.trim()) {
    return res.status(400).json({ success: false, error: 'Google OAuth Client ID is required.' });
  }
  if (!clientSecret || typeof clientSecret !== 'string' || !clientSecret.trim()) {
    return res.status(400).json({ success: false, error: 'Google OAuth Client Secret is required.' });
  }
  if (!clientId.includes('.apps.googleusercontent.com')) {
    return res.status(400).json({ success: false, error: 'Malformed Google Client ID format. Must end with .apps.googleusercontent.com' });
  }

  setAppSetting('google_client_id', clientId.trim());
  setAppSetting('google_client_secret', clientSecret.trim());
  googleDriveService.reinitializeClient();

  return res.json({
    success: true,
    message: 'Google OAuth client credentials saved successfully.',
    data: {
      providerState: googleDriveService.providerState,
      hasOauthConfig: true,
    },
  });
}

function getEffectiveRedirectUri(req: Request): string {
  const originQuery = typeof req.query.origin === 'string' ? req.query.origin : '';
  if (originQuery && !originQuery.includes('localhost')) {
    return `${originQuery.replace(/\/$/, '')}/api/setup/oauth/callback`;
  }

  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const dynamicOrigin = `${protocol}://${host}`;

  const effectiveAppUrl = env.APP_URL && !env.APP_URL.includes('localhost')
    ? env.APP_URL
    : (host ? dynamicOrigin : (env.APP_URL || 'http://localhost:5000'));

  return `${effectiveAppUrl.replace(/\/$/, '')}/api/setup/oauth/callback`;
}

export async function getOAuthUrl(req: Request, res: Response) {
  if (isInitialized()) {
    return res.status(403).json({ success: false, error: 'SETUP_ALREADY_COMPLETED: First-run setup is locked.' });
  }

  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(400).json({
      success: false,
      error: 'Google Client ID and Client Secret must be configured before starting OAuth authorization.',
    });
  }

  const redirectUri = getEffectiveRedirectUri(req);
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  req.session.oauthRedirectUri = redirectUri;

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
    state,
  });

  return res.json({ success: true, data: { url, redirectUri } });
}

export async function handleOAuthCallback(req: Request, res: Response) {
  const { code, state } = req.query;

  if (isInitialized()) {
    return res.status(403).send('Setup is already complete.');
  }

  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  const redirectUri = req.session?.oauthRedirectUri || getEffectiveRedirectUri(req);
  const oauth2Client = new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code as string);

    if (tokens.refresh_token) {
      setAppSetting('google_refresh_token', tokens.refresh_token);
      googleDriveService.reinitializeClient();
    } else {
      console.warn('Google OAuth returned access token without refresh token.');
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const dynamicOrigin = `${protocol}://${host}`;
    const targetOrigin = env.APP_URL && !env.APP_URL.includes('localhost') ? env.APP_URL : dynamicOrigin;

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Google Drive Authorized</title>
        </head>
        <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc;">
          <div style="max-width: 400px; margin: 40px auto; background: #1e293b; padding: 30px; border-radius: 20px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
            <h3 style="color: #10b981; margin-top: 0; font-size: 18px;">✓ Google Drive Connected</h3>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">Google Drive authorization succeeded. Closing this window...</p>
            <button onclick="window.close()" style="margin-top: 15px; padding: 8px 18px; background: #334155; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 600;">Close Window</button>
          </div>
          <script>
            const targetOrigin = "${targetOrigin}";
            if (window.opener) {
              try {
                window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS' }, targetOrigin);
                window.opener.postMessage({ type: 'google-oauth-success' }, targetOrigin);
              } catch (e) {
                window.opener.postMessage({ type: 'GOOGLE_OAUTH_SUCCESS' }, '*');
              }
              setTimeout(() => {
                try { window.close(); } catch(e) {}
              }, 600);
            } else {
              setTimeout(() => {
                window.location.href = '/setup';
              }, 1500);
            }
          </script>
        </body>
      </html>
    `);
  } catch (err: any) {
    console.error('OAuth token exchange error:', err);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head><title>OAuth Authorization Error</title></head>
        <body style="font-family: system-ui, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
          <h3 style="color: #f43f5e;">Google Authorization Error</h3>
          <p style="font-size: 13px; color: #cbd5e1;">${err.message || 'Error exchanging authorization code.'}</p>
          <button onclick="window.close()" style="margin-top: 15px; padding: 8px 16px; background: #334155; color: white; border: none; border-radius: 8px; cursor: pointer;">Close Window</button>
        </body>
      </html>
    `);
  }
}

export async function listDriveFolders(req: Request, res: Response) {
  if (isInitialized()) {
    return res.status(403).json({ success: false, error: 'SETUP_ALREADY_COMPLETED: First-run setup is locked.' });
  }

  try {
    const parentId = req.query.parentId as string | undefined;
    const folders = await googleDriveService.listUserFolders(parentId);
    return res.json({ success: true, data: folders });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to list Drive folders.' });
  }
}

export async function selectStorageFolder(req: Request, res: Response) {
  if (isInitialized()) {
    return res.status(403).json({ success: false, error: 'SETUP_ALREADY_COMPLETED: First-run setup is locked.' });
  }

  const { folderId, folderName, createNew } = req.body;

  try {
    let targetFolderId = folderId;
    let targetFolderName = folderName || 'Selected Folder';

    if (createNew) {
      const created = await googleDriveService.createRootFolder(folderName || 'Private Cloud');
      targetFolderId = created.id;
      targetFolderName = created.name;
    }

    if (!targetFolderId) {
      return res.status(400).json({ success: false, error: 'Storage folder selection is required.' });
    }

    setAppSetting('google_drive_root_folder_id', targetFolderId);
    googleDriveService.reinitializeClient();

    return res.json({
      success: true,
      data: {
        folderId: targetFolderId,
        folderName: targetFolderName,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to set storage folder.' });
  }
}

export async function completeSetup(req: Request, res: Response) {
  if (isInitialized()) {
    return res.status(403).json({ success: false, error: 'SETUP_ALREADY_COMPLETED: First-run setup is locked.' });
  }

  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, error: 'Administrator session required to complete setup.' });
  }

  setAppSetting('is_initialized', 'true');
  setAppSetting('setup_completed_at', new Date().toISOString());

  return res.json({
    success: true,
    message: 'First-run setup completed successfully! Redirecting to application dashboard...',
  });
}
