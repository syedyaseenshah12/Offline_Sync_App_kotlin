/**
 * Database Layer
 * 
 * Manages SQLite database initialization, schema, and low-level operations.
 * Uses expo-sqlite for persistent storage.
 */

import * as SQLite from 'expo-sqlite';
import type { RecordEntity, SyncStatus } from './types';

const DB_NAME = 'offline_sync.db';
const DB_VERSION = 1;

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize database and create tables if needed
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const db = await SQLite.openDatabaseAsync(DB_NAME);
    
    // Create records table with proper indexing
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS records (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        syncStatus TEXT NOT NULL CHECK(syncStatus IN ('PENDING', 'SYNCED', 'FAILED')),
        remoteId INTEGER,
        lastSyncAttempt INTEGER,
        syncError TEXT
      );

      -- Index for sync queries (fetch pending/failed records)
      CREATE INDEX IF NOT EXISTS idx_records_syncStatus ON records(syncStatus);
      
      -- Index for ordering by creation time
      CREATE INDEX IF NOT EXISTS idx_records_createdAt ON records(createdAt DESC);
      
      -- Index for remote ID lookups (prevent duplicate syncs)
      CREATE INDEX IF NOT EXISTS idx_records_remoteId ON records(remoteId);
    `);

    dbInstance = db;
    console.log('[Database] Initialized successfully');
    return db;
  } catch (error) {
    console.error('[Database] Initialization failed:', error);
    throw new Error(`Failed to initialize database: ${error}`);
  }
}

/**
 * Get database instance (must call initDatabase first)
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

/**
 * Insert a new record
 */
export async function insertRecord(record: RecordEntity): Promise<void> {
  const db = getDatabase();
  
  try {
    await db.runAsync(
      `INSERT INTO records (id, title, body, createdAt, syncStatus, remoteId, lastSyncAttempt, syncError)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        record.id,
        record.title,
        record.body,
        record.createdAt,
        record.syncStatus,
        record.remoteId,
        record.lastSyncAttempt,
        record.syncError,
      ]
    );
    console.log(`[Database] Inserted record: ${record.id}`);
  } catch (error) {
    console.error('[Database] Insert failed:', error);
    throw new Error(`Failed to insert record: ${error}`);
  }
}

/**
 * Update an existing record
 */
export async function updateRecord(record: RecordEntity): Promise<void> {
  const db = getDatabase();
  
  try {
    await db.runAsync(
      `UPDATE records 
       SET title = ?, body = ?, syncStatus = ?, remoteId = ?, lastSyncAttempt = ?, syncError = ?
       WHERE id = ?`,
      [
        record.title,
        record.body,
        record.syncStatus,
        record.remoteId,
        record.lastSyncAttempt,
        record.syncError,
        record.id,
      ]
    );
    console.log(`[Database] Updated record: ${record.id}`);
  } catch (error) {
    console.error('[Database] Update failed:', error);
    throw new Error(`Failed to update record: ${error}`);
  }
}

/**
 * Update sync status for a record
 */
export async function updateSyncStatus(
  id: string,
  syncStatus: SyncStatus,
  remoteId?: number,
  syncError?: string
): Promise<void> {
  const db = getDatabase();
  
  try {
    await db.runAsync(
      `UPDATE records 
       SET syncStatus = ?, remoteId = ?, lastSyncAttempt = ?, syncError = ?
       WHERE id = ?`,
      [syncStatus, remoteId ?? null, Date.now(), syncError ?? null, id]
    );
    console.log(`[Database] Updated sync status for ${id}: ${syncStatus}`);
  } catch (error) {
    console.error('[Database] Sync status update failed:', error);
    throw new Error(`Failed to update sync status: ${error}`);
  }
}

/**
 * Fetch all records ordered by creation time (newest first)
 */
export async function getAllRecords(): Promise<RecordEntity[]> {
  const db = getDatabase();
  
  try {
    const result = await db.getAllAsync<RecordEntity>(
      'SELECT * FROM records ORDER BY createdAt DESC'
    );
    console.log(`[Database] Fetched ${result.length} records`);
    return result;
  } catch (error) {
    console.error('[Database] Fetch all failed:', error);
    throw new Error(`Failed to fetch records: ${error}`);
  }
}

/**
 * Fetch records by sync status
 */
export async function getRecordsByStatus(status: SyncStatus): Promise<RecordEntity[]> {
  const db = getDatabase();
  
  try {
    const result = await db.getAllAsync<RecordEntity>(
      'SELECT * FROM records WHERE syncStatus = ? ORDER BY createdAt DESC',
      [status]
    );
    console.log(`[Database] Fetched ${result.length} records with status ${status}`);
    return result;
  } catch (error) {
    console.error('[Database] Fetch by status failed:', error);
    throw new Error(`Failed to fetch records by status: ${error}`);
  }
}

/**
 * Fetch a single record by ID
 */
export async function getRecordById(id: string): Promise<RecordEntity | null> {
  const db = getDatabase();
  
  try {
    const result = await db.getFirstAsync<RecordEntity>(
      'SELECT * FROM records WHERE id = ?',
      [id]
    );
    return result ?? null;
  } catch (error) {
    console.error('[Database] Fetch by ID failed:', error);
    throw new Error(`Failed to fetch record by ID: ${error}`);
  }
}

/**
 * Delete a record by ID
 */
export async function deleteRecord(id: string): Promise<void> {
  const db = getDatabase();
  
  try {
    await db.runAsync('DELETE FROM records WHERE id = ?', [id]);
    console.log(`[Database] Deleted record: ${id}`);
  } catch (error) {
    console.error('[Database] Delete failed:', error);
    throw new Error(`Failed to delete record: ${error}`);
  }
}

/**
 * Get count of records by status
 */
export async function getRecordCountByStatus(status: SyncStatus): Promise<number> {
  const db = getDatabase();
  
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM records WHERE syncStatus = ?',
      [status]
    );
    return result?.count ?? 0;
  } catch (error) {
    console.error('[Database] Count by status failed:', error);
    return 0;
  }
}

/**
 * Clear all records (for testing/debugging only)
 */
export async function clearAllRecords(): Promise<void> {
  const db = getDatabase();
  
  try {
    await db.runAsync('DELETE FROM records');
    console.log('[Database] Cleared all records');
  } catch (error) {
    console.error('[Database] Clear all failed:', error);
    throw new Error(`Failed to clear records: ${error}`);
  }
}
