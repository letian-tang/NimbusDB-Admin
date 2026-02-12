import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

// Ensure the data directory exists
const dbPath = path.resolve((process as any).cwd(), 'nimbus_admin.db');

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS connections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT NOT NULL,
    password TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// --- Auth Helpers ---

function hashPassword(password: string, salt: string) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function createUser(username: string, password: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(password, salt);
  const stmt = db.prepare('INSERT INTO users (username, password_hash, salt, created_at) VALUES (?, ?, ?, ?)');
  return stmt.run(username, hash, salt, Date.now());
}

export function validateUser(username: string, password: string) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  const user = stmt.get(username) as any;
  
  if (!user) return null;
  
  const hash = hashPassword(password, user.salt);
  if (hash === user.password_hash) {
    return { id: user.id, username: user.username, created_at: user.created_at };
  }
  return null;
}

export function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString('hex');
  // 24 hours expiration
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; 
  const stmt = db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)');
  stmt.run(token, userId, expiresAt);
  return token;
}

export function validateSession(token: string) {
  const stmt = db.prepare(`
    SELECT users.id, users.username, users.created_at 
    FROM sessions 
    JOIN users ON sessions.user_id = users.id 
    WHERE sessions.token = ? AND sessions.expires_at > ?
  `);
  return stmt.get(token, Date.now()) as any;
}

export function updatePassword(userId: number, newPassword: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = hashPassword(newPassword, salt);
  const stmt = db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?');
  stmt.run(hash, salt, userId);
}

// Bootstrap default admin user if no users exist
const userCount = db.prepare('SELECT count(*) as count FROM users').get() as any;
if (userCount.count === 0) {
  console.log("Creating default admin user...");
  createUser('admin', 'admin');
}

export default db;
