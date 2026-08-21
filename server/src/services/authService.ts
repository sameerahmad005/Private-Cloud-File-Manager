import bcrypt from 'bcryptjs';
import { dbGet, dbRun } from '../database/db.js';
import { User } from '../types.js';

interface FailedAttempt {
  count: number;
  lastAttempt: number;
  lockoutUntil?: number;
}

export class AuthService {
  private failedAttempts: Map<string, FailedAttempt> = new Map();

  public checkBruteForceLockout(ip: string): { locked: boolean; remainingSeconds?: number } {
    const record = this.failedAttempts.get(ip);
    if (!record) return { locked: false };

    const now = Date.now();
    if (record.lockoutUntil && record.lockoutUntil > now) {
      const remainingSeconds = Math.ceil((record.lockoutUntil - now) / 1000);
      return { locked: true, remainingSeconds };
    }

    if (record.lockoutUntil && record.lockoutUntil <= now) {
      this.failedAttempts.delete(ip);
      return { locked: false };
    }

    return { locked: false };
  }

  public recordFailedAttempt(ip: string): void {
    const now = Date.now();
    const record = this.failedAttempts.get(ip) || { count: 0, lastAttempt: now };

    if (now - record.lastAttempt > 10 * 60 * 1000) {
      record.count = 0;
    }

    record.count += 1;
    record.lastAttempt = now;

    if (record.count >= 5) {
      record.lockoutUntil = now + 10 * 60 * 1000;
      console.warn(`IP ${ip} temporarily locked out due to 5 failed login attempts.`);
    }

    this.failedAttempts.set(ip, record);
  }

  public recordSuccessfulAttempt(ip: string): void {
    this.failedAttempts.delete(ip);
  }

  public async createAdminUser(username: string, password: string): Promise<User> {
    const cleanUser = (username || '').trim();
    if (!cleanUser || cleanUser.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const existingUser = await dbGet<any>('SELECT * FROM users WHERE LOWER(username) = ?', [cleanUser.toLowerCase()]);
    if (existingUser) {
      throw new Error('An administrator account already exists.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user_admin_${Date.now()}`;
    const createdAt = new Date().toISOString();

    await dbRun(
      'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [userId, cleanUser, passwordHash, 'admin', createdAt]
    );

    return {
      id: userId,
      username: cleanUser,
      role: 'admin',
      createdAt,
    };
  }

  public async authenticate(username: string, password: string, ip: string): Promise<User | null> {
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const lockout = this.checkBruteForceLockout(ip);
    if (lockout.locked) {
      throw new Error(`TOO_MANY_REQUESTS: Account locked due to repeated failed attempts. Please try again in ${lockout.remainingSeconds} seconds.`);
    }

    const userRow = await dbGet<any>('SELECT * FROM users WHERE LOWER(username) = ?', [cleanUser]);

    if (!userRow) {
      this.recordFailedAttempt(ip);
      return null;
    }

    const match = await bcrypt.compare(cleanPass, userRow.password_hash);
    if (!match) {
      this.recordFailedAttempt(ip);
      return null;
    }

    this.recordSuccessfulAttempt(ip);
    return {
      id: userRow.id,
      username: userRow.username,
      role: userRow.role,
      createdAt: userRow.created_at || new Date().toISOString(),
    };
  }

  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }

    const user = await dbGet<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) throw new Error('User not found.');

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      throw new Error('Current password does not match.');
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await dbRun('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    return true;
  }

  public async logAuditEvent(event: string, details: string, username: string, ip: string): Promise<void> {
    try {
      const id = `audit_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await dbRun(
        'INSERT INTO audit_logs (id, timestamp, event, details, username, ip) VALUES (?, ?, ?, ?, ?, ?)',
        [id, new Date().toISOString(), event, details, username, ip]
      );
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }
}

export const authService = new AuthService();
