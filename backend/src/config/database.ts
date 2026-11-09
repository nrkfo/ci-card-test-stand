import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path defaults to backend/database.sqlite or process.env.DB_PATH
const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, '../../database.sqlite');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: Database.Database = new Database(DB_PATH);

// Configure SQLite for high performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  // Check if test_logs has the obsolete station_id NOT NULL constraint
  try {
    const tableInfo = db.prepare("PRAGMA table_info(test_logs)").all() as Array<{ name: string; notnull: number }>;
    const stationCol = tableInfo.find(c => c.name === 'station_id');
    
    // If table still has old schema with station_id NOT NULL, migrate cleanly
    if (stationCol && stationCol.notnull === 1) {
      console.log('[DB] Migrating test_logs table to remove obsolete NOT NULL constraints...');
      db.exec(`
        DROP TABLE IF EXISTS test_logs;
        DROP TABLE IF EXISTS devices;
      `);
    }
  } catch (err) {
    console.error('[DB] Migration check error:', err);
  }

  // 1. Devices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_number TEXT UNIQUE NOT NULL,
      model_name TEXT,
      ip_address TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. Test logs table (all diagnostic fields nullable/defaulted)
  db.exec(`
    CREATE TABLE IF NOT EXISTS test_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
      ip_address TEXT,
      hardware_detected INTEGER NOT NULL DEFAULT 0,
      auth_status TEXT NOT NULL DEFAULT 'FAIL',
      cam_info_read INTEGER NOT NULL DEFAULT 0,
      raw_adb_log TEXT NOT NULL,
      test_result TEXT NOT NULL DEFAULT 'FAIL',
      failure_reason TEXT,
      cam_model_name TEXT,
      tested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for analytical speed
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_devices_serial ON devices(serial_number);
    CREATE INDEX IF NOT EXISTS idx_test_logs_device ON test_logs(device_id);
    CREATE INDEX IF NOT EXISTS idx_test_logs_result ON test_logs(test_result);
    CREATE INDEX IF NOT EXISTS idx_test_logs_tested_at ON test_logs(tested_at);
  `);
}
