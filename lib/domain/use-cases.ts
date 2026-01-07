/**
 * Domain Layer - Use Cases
 * 
 * Business logic and use cases for the application.
 * No direct dependencies on frameworks or data layer implementation details.
 */

import * as repository from '../data/repository';
import type { Record, Result, SyncResult } from '../data/types';

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validate record input
 */
function validateRecordInput(title: string, body: string): void {
  if (!title || title.trim().length === 0) {
    throw new ValidationError('Title is required');
  }

  if (title.trim().length > 200) {
    throw new ValidationError('Title must be 200 characters or less');
  }

  if (!body || body.trim().length === 0) {
    throw new ValidationError('Body is required');
  }

  if (body.trim().length > 5000) {
    throw new ValidationError('Body must be 5000 characters or less');
  }
}

/**
 * Use Case: Create a new record
 * 
 * Business rules:
 * - Title and body are required
 * - Title max 200 characters
 * - Body max 5000 characters
 * - Record is created with PENDING sync status
 */
export async function createRecord(
  title: string,
  body: string
): Promise<Result<Record>> {
  try {
    // Validate input
    validateRecordInput(title, body);

    // Create record via repository
    const result = await repository.createRecord(title, body);

    if (!result.success) {
      return result;
    }

    console.log('[UseCase] Record created successfully:', result.data.id);
    return result;
  } catch (error) {
    console.error('[UseCase] Create record failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Use Case: Fetch all records
 * 
 * Returns all records ordered by creation time (newest first)
 */
export async function fetchAllRecords(): Promise<Result<Record[]>> {
  try {
    const result = await repository.getAllRecords();

    if (!result.success) {
      return result;
    }

    console.log('[UseCase] Fetched all records:', result.data.length);
    return result;
  } catch (error) {
    console.error('[UseCase] Fetch all records failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Use Case: Fetch a single record by ID
 */
export async function fetchRecordById(id: string): Promise<Result<Record | null>> {
  try {
    if (!id || id.trim().length === 0) {
      throw new ValidationError('Record ID is required');
    }

    const result = await repository.getRecordById(id);

    if (!result.success) {
      return result;
    }

    console.log('[UseCase] Fetched record:', id);
    return result;
  } catch (error) {
    console.error('[UseCase] Fetch record by ID failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Use Case: Synchronize pending records
 * 
 * Business rules:
 * - Only syncs records with PENDING status
 * - Retries on network/server errors
 * - Marks as FAILED on client errors
 * - Updates sync status after each attempt
 */
export async function syncRecords(): Promise<Result<SyncResult[]>> {
  try {
    console.log('[UseCase] Starting sync...');
    const result = await repository.syncPendingRecords();

    if (!result.success) {
      return result;
    }

    const successCount = result.data.filter((r) => r.success).length;
    const failureCount = result.data.filter((r) => !r.success).length;

    console.log(
      `[UseCase] Sync completed: ${successCount} success, ${failureCount} failed`
    );

    return result;
  } catch (error) {
    console.error('[UseCase] Sync records failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Use Case: Retry failed syncs
 * 
 * Marks failed records as pending and attempts to sync them again
 */
export async function retryFailedSyncs(): Promise<Result<SyncResult[]>> {
  try {
    console.log('[UseCase] Retrying failed syncs...');
    const result = await repository.retryFailedSyncs();

    if (!result.success) {
      return result;
    }

    console.log('[UseCase] Retry completed');
    return result;
  } catch (error) {
    console.error('[UseCase] Retry failed syncs failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Unknown error'),
    };
  }
}

/**
 * Use Case: Get sync statistics
 * 
 * Returns counts of records by sync status
 */
export async function getSyncStatistics(): Promise<{
  total: number;
  synced: number;
  pending: number;
  failed: number;
}> {
  try {
    const stats = await repository.getSyncStats();
    console.log('[UseCase] Sync stats:', stats);
    return stats;
  } catch (error) {
    console.error('[UseCase] Get sync stats failed:', error);
    return { total: 0, synced: 0, pending: 0, failed: 0 };
  }
}
