import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { getAppSetting } from '../database/db.js';

// Load .env from root directory or server directory
const rootDir = path.resolve(__dirname, '../../../');
const serverDir = path.resolve(__dirname, '../../');

dotenv.config({ path: path.join(rootDir, '.env') });
dotenv.config({ path: path.join(serverDir, '.env') });

const defaultSessionSecret = crypto.randomBytes(32).toString('hex');

export const env = {
  APP_ENV: process.env.APP_ENV || 'development',
  APP_URL: process.env.APP_URL || 'http://localhost:5000',
  PORT: parseInt(process.env.PORT || '5000', 10),

  AUTH_ENABLED: process.env.AUTH_ENABLED !== 'false',
  SESSION_SECRET: process.env.SESSION_SECRET || defaultSessionSecret,

  GOOGLE_SERVICE_ACCOUNT_KEY_PATH: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH || '',

  MAX_UPLOAD_SIZE: parseInt(process.env.MAX_UPLOAD_SIZE || '52428800', 10), // 50 MB
  SESSION_TIMEOUT: parseInt(process.env.SESSION_TIMEOUT || '60', 10), // 60 min
  RATE_LIMIT: parseInt(process.env.RATE_LIMIT || '100', 10), // 100 req per 15m

  get STORAGE_PROVIDER(): string {
    return process.env.STORAGE_PROVIDER || getAppSetting('storage_provider') || 'google_drive';
  },

  get GOOGLE_CLIENT_ID(): string {
    return getAppSetting('google_client_id') || process.env.GOOGLE_CLIENT_ID || '';
  },

  get GOOGLE_CLIENT_SECRET(): string {
    return getAppSetting('google_client_secret') || process.env.GOOGLE_CLIENT_SECRET || '';
  },

  get GOOGLE_REFRESH_TOKEN(): string {
    return getAppSetting('google_refresh_token') || process.env.GOOGLE_REFRESH_TOKEN || '';
  },

  get GOOGLE_DRIVE_ROOT_FOLDER_ID(): string {
    return getAppSetting('google_drive_root_folder_id') || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '';
  },
};
