/**
 * Repository Layer
 * 
 * Provides high-level data access abstraction over database and API.
 * Implements the Repository pattern for clean separation of concerns.
 */

import { v4 as uuidv4 } from 'uuid';
import * as db from './database';
import * as api from './api';
import * as mappers from './mappers';
import type { Record, RecordEntity, SyncStatus, Result, SyncResult } from './types';

/**
 * Create a new record locally
 * Returns the created record immediately (offline-first)
 */
export async function createRecord(
  title: string,
  body: string
): Promise<Result<Record>> {
  try {
    const entity: RecordEntity = {
      id: uuidv4(),
      title: title.trim(),
      body: body.trim(),
      createdAt: Date.now(),
      syncStatus: 'PENDING',
      remoteId: null,
      lastSyncAttempt: null,
      syncError: null,
    };

    await db.insertRecord(entity);
    const record = mappers.entityToRecord(entity);

    console.log('[Repository] Record created:', record.id);
    return { success: true, data: record };
  } catch (error) {
    console.error('[Repository] Create record failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Fetch all records from local database
 */
export async function getAllRecords(): Promise<Result<Record[]>> {
  try {
    const entities = await db.getAllRecords();
    const records = mappers.entitiesToRecords(entities);

    console.log('[Repository] Fetched all records:', records.length);
    return { success: true, data: records };
  } catch (error) {
    console.error('[Repository] Fetch all records failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Fetch records by sync status
 */
export async function getRecordsByStatus(
  status: SyncStatus
): Promise<Result<Record[]>> {
  try {
    const entities = await db.getRecordsByStatus(status);
    const records = mappers.entitiesToRecords(entities);

    console.log(`[Repository] Fetched ${status} records:`, records.length);
    return { success: true, data: records };
  } catch (error) {
    console.error('[Repository] Fetch by status failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Fetch a single record by ID
 */
export async function getRecordById(id: string): Promise<Result<Record | null>> {
  try {
    const entity = await db.getRecordById(id);
    if (!entity) {
      return { success: true, data: null };
    }

    const record = mappers.entityToRecord(entity);
    return { success: true, data: record };
  } catch (error) {
    console.error('[Repository] Fetch by ID failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Sync a single record to the API
 * Updates local record with sync result
 */
export async function syncRecord(recordId: string): Promise<SyncResult> {
  try {
    // Fetch record from database
    const entity = await db.getRecordById(recordId);
    if (!entity) {
      return {
        recordId,
        success: false,
        error: 'Record not found',
      };
    }

    // Skip if already synced
    if (entity.syncStatus === 'SYNCED' && entity.remoteId !== null) {
      console.log(`[Repository] Record ${recordId} already synced`);
      return {
        recordId,
        success: true,
        remoteId: entity.remoteId,
      };
    }

    // Convert to API DTO and send request
    const dto = mappers.entityToCreatePostDTO(entity);
    const response = await api.createPost(dto);

    // Update local record with sync success
    const updatedEntity = mappers.mergePostResponse(entity, response);
    await db.updateRecord(updatedEntity);

    console.log(`[Repository] Record ${recordId} synced successfully`);
    return {
      recordId,
      success: true,
      remoteId: response.id,
    };
  } catch (error) {
    console.error(`[Repository] Sync record ${recordId} failed:`, error);

    // Determine if error is retryable
    const isRetryable =
      error instanceof api.ApiError && api.isRetryableError(error);
    const isPermanent =
      error instanceof api.ApiError && api.isPermanentError(error);

    // Update sync status based on error type
    const newStatus: SyncStatus = isPermanent ? 'FAILED' : 'PENDING';
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await db.updateSyncStatus(recordId, newStatus, undefined, errorMessage);

    return {
      recordId,
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sync all pending records
 * Returns summary of sync results
 */
export async function syncPendingRecords(): Promise<Result<SyncResult[]>> {
  try {
    // Fetch all pending records
    const pendingEntities = await db.getRecordsByStatus('PENDING');

    if (pendingEntities.length === 0) {
      console.log('[Repository] No pending records to sync');
      return { success: true, data: [] };
    }

    console.log(`[Repository] Syncing ${pendingEntities.length} pending records`);

    // Sync each record sequentially (avoid overwhelming API)
    const results: SyncResult[] = [];
    for (const entity of pendingEntities) {
      const result = await syncRecord(entity.id);
      results.push(result);

      // Small delay between requests to be respectful to API
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `[Repository] Sync completed: ${successCount} success, ${failureCount} failed`
    );

    return { success: true, data: results };
  } catch (error) {
    console.error('[Repository] Sync pending records failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Retry failed syncs
 */
export async function retryFailedSyncs(): Promise<Result<SyncResult[]>> {
  try {
    // Mark failed records as pending to retry
    const failedEntities = await db.getRecordsByStatus('FAILED');

    if (failedEntities.length === 0) {
      console.log('[Repository] No failed records to retry');
      return { success: true, data: [] };
    }

    console.log(`[Repository] Retrying ${failedEntities.length} failed records`);

    // Mark as pending
    for (const entity of failedEntities) {
      await db.updateSyncStatus(entity.id, 'PENDING');
    }

    // Sync them
    return await syncPendingRecords();
  } catch (error) {
    console.error('[Repository] Retry failed syncs failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Get sync statistics
 */
export async function getSyncStats(): Promise<{
  total: number;
  synced: number;
  pending: number;
  failed: number;
}> {
  try {
    const [total, synced, pending, failed] = await Promise.all([
      db.getAllRecords().then((r) => r.length),
      db.getRecordCountByStatus('SYNCED'),
      db.getRecordCountByStatus('PENDING'),
      db.getRecordCountByStatus('FAILED'),
    ]);

    return { total, synced, pending, failed };
  } catch (error) {
    console.error('[Repository] Get sync stats failed:', error);
    return { total: 0, synced: 0, pending: 0, failed: 0 };
  }
}
