/**
 * Data Layer Types
 * 
 * Defines the shape of data stored in SQLite and transferred via API.
 */

/**
 * Sync status for records
 */
export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

/**
 * Database entity for text records
 */
export interface RecordEntity {
  id: string; // UUID generated locally
  title: string;
  body: string;
  createdAt: number; // Unix timestamp
  syncStatus: SyncStatus;
  remoteId: number | null; // ID from API after successful sync
  lastSyncAttempt: number | null; // Unix timestamp of last sync attempt
  syncError: string | null; // Error message if sync failed
}

/**
 * DTO for API requests (POST /posts)
 */
export interface CreatePostDTO {
  title: string;
  body: string;
  userId: number; // Required by jsonplaceholder API
}

/**
 * DTO for API responses (GET /posts, POST /posts)
 */
export interface PostResponseDTO {
  id: number;
  title: string;
  body: string;
  userId: number;
}

/**
 * Domain model for records (used in presentation layer)
 */
export interface Record {
  id: string;
  title: string;
  body: string;
  createdAt: Date;
  syncStatus: SyncStatus;
  remoteId: number | null;
  lastSyncAttempt: Date | null;
  syncError: string | null;
}

/**
 * Result type for operations that may fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Sync result for individual record
 */
export interface SyncResult {
  recordId: string;
  success: boolean;
  error?: string;
  remoteId?: number;
}

/**
 * Batch sync result
 */
export interface BatchSyncResult {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  results: SyncResult[];
}
