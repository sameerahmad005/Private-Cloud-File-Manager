import assert from 'assert';
import bcrypt from 'bcryptjs';
import { googleDriveService } from './services/googleDriveService.js';
import { notesService } from './services/notesService.js';
import { authService } from './services/authService.js';
import { initDatabase, setAppSetting } from './database/db.js';
import { env } from './config/env.js';

async function runTests() {
  console.log('-------------------------------------------------------');
  console.log('Running Private Cloud File Manager Test Suite...');
  console.log('-------------------------------------------------------');

  // Test 1: Database Initialization
  await initDatabase();
  console.log('✓ Test 1 Passed: JSON metadata database initialized.');

  // Test 2: Password Hashing Verification
  const testPassword = `TestPassword_${Math.random().toString(36).substring(2)}!A1`;
  const hash = await bcrypt.hash(testPassword, 10);
  const match = await bcrypt.compare(testPassword, hash);
  assert.strictEqual(match, true, 'Bcrypt password comparison should succeed.');
  console.log('✓ Test 2 Passed: Bcrypt password hashing & verification verified.');

  // Test 3: Root Hierarchy Boundary Validation
  const rootId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID || 'root';
  setAppSetting('google_drive_root_folder_id', rootId);

  const isRootAllowed = await googleDriveService.validateRootBoundary(rootId);
  assert.strictEqual(isRootAllowed, true, 'Root folder ID must be allowed.');

  const isInvalidAllowed = await googleDriveService.validateRootBoundary('unauthorized_external_file_id_999');
  assert.strictEqual(isInvalidAllowed, false, 'File outside configured root folder must be denied.');
  console.log('✓ Test 3 Passed: Root hierarchy boundary validation enforced.');

  // Test 4: Folder & File Operations
  const folder = await googleDriveService.createFolder('Mock Folder', rootId);
  assert.ok(folder.id, 'Folder creation should return valid ID.');
  assert.strictEqual(folder.name, 'Mock Folder');

  const fileItem = await googleDriveService.uploadFile(
    Buffer.from('Hello Unit Test'),
    'test.txt',
    'text/plain',
    folder.id
  );
  assert.ok(fileItem.id, 'File upload should return valid file ID.');

  const renamed = await googleDriveService.renameFile(fileItem.id, 'renamed_test.txt');
  assert.strictEqual(renamed.name, 'renamed_test.txt');

  const streamInfo = await googleDriveService.getFileStream(fileItem.id);
  assert.ok(streamInfo.stream, 'File stream must be readable.');

  const deleted = await googleDriveService.deleteFile(fileItem.id);
  assert.strictEqual(deleted, true, 'File soft deletion to trash should succeed.');
  console.log('✓ Test 4 Passed: Folder and File CRUD operations passed.');

  // Test 5: Notes Operations
  const note = await notesService.createNote('Test Note', '# Hello World\nThis is a test note.');
  assert.ok(note.id, 'Note creation should return valid ID.');
  assert.strictEqual(note.title, 'Test Note');

  const fetchedNote = await notesService.getNote(note.id);
  assert.strictEqual(fetchedNote.title, 'Test Note');
  assert.ok(fetchedNote.content.includes('Hello World'));

  const updatedNote = await notesService.updateNote(note.id, 'Updated Note', '# Updated Content');
  assert.strictEqual(updatedNote.title, 'Updated Note');

  await notesService.deleteNote(note.id);
  console.log('✓ Test 5 Passed: Markdown Notes CRUD operations passed.');

  // Test 6: Brute Force Protection
  const dummyIp = '192.168.1.99';
  authService.recordSuccessfulAttempt(dummyIp);
  let lockout = authService.checkBruteForceLockout(dummyIp);
  assert.strictEqual(lockout.locked, false);

  for (let i = 0; i < 5; i++) {
    authService.recordFailedAttempt(dummyIp);
  }
  lockout = authService.checkBruteForceLockout(dummyIp);
  assert.strictEqual(lockout.locked, true, '5 failed attempts should trigger brute-force lockout.');
  console.log('✓ Test 6 Passed: Brute-force protection & lockout verified.');

  console.log('-------------------------------------------------------');
  console.log('ALL 6 TESTS PASSED SUCCESSFULLY! ALL CONTROLS VERIFIED.');
  console.log('-------------------------------------------------------');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
