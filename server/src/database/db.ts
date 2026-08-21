import path from 'path';
import fs from 'fs';

const isVercel = !!process.env.VERCEL;
const dbDir = isVercel ? '/tmp' : path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const jsonDbPath = path.join(dbDir, 'app_metadata.json');

interface Schema {
  users: any[];
  favorites: any[];
  recents: any[];
  audit_logs: any[];
  app_settings: Record<string, string>;
}

let store: Schema = {
  users: [],
  favorites: [],
  recents: [],
  audit_logs: [],
  app_settings: {},
};

function loadStore() {
  try {
    if (fs.existsSync(jsonDbPath)) {
      const data = fs.readFileSync(jsonDbPath, 'utf-8');
      store = JSON.parse(data);
      if (!store.users) store.users = [];
      if (!store.favorites) store.favorites = [];
      if (!store.recents) store.recents = [];
      if (!store.audit_logs) store.audit_logs = [];
      if (!store.app_settings) store.app_settings = {};
    } else {
      saveStore();
    }
  } catch (err) {
    console.error('Error loading JSON metadata store:', err);
  }
}

function saveStore() {
  try {
    fs.writeFileSync(jsonDbPath, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving JSON metadata store:', err);
  }
}

import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export async function initDatabase(): Promise<void> {
  loadStore();

  const envAdminUser = process.env.ADMIN_USERNAME || 'admin';
  const envAdminPass = process.env.ADMIN_PASSWORD;
  
  if (envAdminPass) {
    const existing = store.users.find((u) => u.username === envAdminUser);
    if (!existing) {
      const hash = await bcrypt.hash(envAdminPass, 10);
      store.users.push({
        id: `user_env_admin`,
        username: envAdminUser,
        password_hash: hash,
        role: 'admin',
        created_at: new Date().toISOString(),
      });
      store.app_settings['is_initialized'] = 'true';
      saveStore();
    }
  }

  // If Google Drive OAuth is pre-configured via Environment Variables, preserve initialized status
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN && store.users.length > 0) {
    store.app_settings['is_initialized'] = 'true';
    saveStore();
  }

  console.log('Pure JS Metadata Database initialized successfully at:', jsonDbPath);
}

export async function dbRun(sql: string, params: any[] = []): Promise<any> {
  loadStore();
  const cleanSql = sql.trim().toUpperCase();

  if (cleanSql.startsWith('INSERT INTO USERS') || cleanSql.startsWith('INSERT OR REPLACE INTO USERS')) {
    const [id, username, password_hash, role, created_at] = params;
    const idx = store.users.findIndex((u) => u.username === username);
    const item = {
      id: id || `user_${Date.now()}`,
      username,
      password_hash,
      role: role || 'user',
      created_at: created_at || new Date().toISOString(),
    };
    if (idx >= 0) store.users[idx] = item;
    else store.users.push(item);
    saveStore();
    return { changes: 1 };
  }

  if (cleanSql.startsWith('UPDATE USERS')) {
    const [password_hash, username] = params;
    const user = store.users.find((u) => u.username === username);
    if (user) {
      user.password_hash = password_hash;
      saveStore();
      return { changes: 1 };
    }
    return { changes: 0 };
  }

  if (cleanSql.startsWith('DELETE FROM USERS')) {
    const [username] = params;
    store.users = store.users.filter((u) => u.username !== username);
    saveStore();
    return { changes: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO FAVORITES') || cleanSql.startsWith('INSERT OR REPLACE INTO FAVORITES')) {
    const [id, user_id, drive_file_id, created_at] = params;
    const idx = store.favorites.findIndex((f) => f.user_id === user_id && f.drive_file_id === drive_file_id);
    const item = {
      id: id || `fav_${Date.now()}`,
      user_id,
      drive_file_id,
      created_at: created_at || new Date().toISOString(),
    };
    if (idx >= 0) store.favorites[idx] = item;
    else store.favorites.push(item);
    saveStore();
    return { changes: 1 };
  }

  if (cleanSql.startsWith('DELETE FROM FAVORITES')) {
    const [user_id, drive_file_id] = params;
    store.favorites = store.favorites.filter((f) => !(f.user_id === user_id && f.drive_file_id === drive_file_id));
    saveStore();
    return { changes: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO RECENTS') || cleanSql.startsWith('INSERT OR REPLACE INTO RECENTS')) {
    const [id, user_id, drive_file_id, accessed_at] = params;
    const idx = store.recents.findIndex((r) => r.user_id === user_id && r.drive_file_id === drive_file_id);
    const item = {
      id: id || `rec_${Date.now()}`,
      user_id,
      drive_file_id,
      accessed_at: accessed_at || new Date().toISOString(),
    };
    if (idx >= 0) store.recents[idx] = item;
    else store.recents.push(item);
    saveStore();
    return { changes: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO AUDIT_LOGS')) {
    const [id, timestamp, event, details, username, ip] = params;
    store.audit_logs.push({
      id: id || `log_${Date.now()}`,
      timestamp: timestamp || new Date().toISOString(),
      event,
      details,
      username,
      ip,
    });
    saveStore();
    return { changes: 1 };
  }

  if (cleanSql.startsWith('INSERT INTO APP_SETTINGS') || cleanSql.startsWith('INSERT OR REPLACE INTO APP_SETTINGS')) {
    const [key, value] = params;
    store.app_settings[key] = value;
    saveStore();
    return { changes: 1 };
  }

  return { changes: 0 };
}

export async function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  loadStore();
  const cleanSql = sql.trim().toUpperCase();

  if (cleanSql.includes('FROM USERS WHERE USERNAME =')) {
    const username = params[0];
    const user = store.users.find((u) => u.username === username);
    return user as T;
  }

  if (cleanSql.includes('FROM FAVORITES WHERE USER_ID = AND DRIVE_FILE_ID =') || cleanSql.includes('DRIVE_FILE_ID = ?')) {
    const [userId, driveFileId] = params;
    const fav = store.favorites.find((f) => f.user_id === userId && f.drive_file_id === driveFileId);
    return fav as T;
  }

  if (cleanSql.includes('FROM APP_SETTINGS WHERE KEY =')) {
    const key = params[0];
    if (store.app_settings[key]) {
      return { key, value: store.app_settings[key] } as T;
    }
    return undefined;
  }

  return undefined;
}

export async function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  loadStore();
  const cleanSql = sql.trim().toUpperCase();

  if (cleanSql.includes('FROM FAVORITES WHERE USER_ID =')) {
    const userId = params[0];
    return store.favorites.filter((f) => f.user_id === userId) as T[];
  }

  if (cleanSql.includes('FROM RECENTS WHERE USER_ID =')) {
    const userId = params[0];
    const list = store.recents
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime())
      .slice(0, 20);
    return list as T[];
  }

  if (cleanSql.includes('FROM AUDIT_LOGS')) {
    const list = store.audit_logs
      .slice()
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);
    return list as T[];
  }

  return [];
}

export function getAppSetting(key: string): string | undefined {
  loadStore();
  return store.app_settings[key];
}

export function setAppSetting(key: string, value: string): void {
  loadStore();
  store.app_settings[key] = value;
  saveStore();
}

export function getSettingsMap(): Record<string, string> {
  loadStore();
  return { ...store.app_settings };
}

export function isInitialized(): boolean {
  loadStore();
  const hasEnvCredentials = Boolean(
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_CLIENT_SECRET &&
    env.GOOGLE_REFRESH_TOKEN &&
    (store.users.length > 0 || (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD))
  );
  if (hasEnvCredentials) return true;
  return store.app_settings['is_initialized'] === 'true' && store.users.length > 0;
}

