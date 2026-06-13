import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../pandora.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initializeDb(db);
  }
  return db;
}

function initializeDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spotify_id TEXT UNIQUE NOT NULL,
      display_name TEXT,
      email TEXT,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      token_expires_at INTEGER NOT NULL,
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id),
      languages TEXT NOT NULL DEFAULT '[]',
      genres TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      spotify_track_id TEXT,
      track_name TEXT NOT NULL,
      artist_name TEXT NOT NULL,
      album_name TEXT,
      spotify_url TEXT,
      preview_url TEXT,
      album_art_url TEXT,
      recommendation_json TEXT NOT NULL,
      generated_at INTEGER DEFAULT (unixepoch()),
      valid_until INTEGER NOT NULL,
      feedback TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS listening_history_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      track_data TEXT NOT NULL,
      fetched_at INTEGER DEFAULT (unixepoch())
    );
  `);
}

export default getDb;
