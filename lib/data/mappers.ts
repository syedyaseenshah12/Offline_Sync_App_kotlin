/**
 * Data Mappers
 * 
 * Convert between different data representations:
 * - RecordEntity (database) ↔️ Record (domain)
 * - RecordEntity ↔️ CreatePostDTO (API request)
 * - PostResponseDTO (API response) ↔️ RecordEntity
 */

import type {
  RecordEntity,
  Record,
  CreatePostDTO,
  PostResponseDTO,
} from './types';

/**
 * Convert RecordEntity to domain Record
 */
export function entityToRecord(entity: RecordEntity): Record {
  return {
    id: entity.id,
    title: entity.title,
    body: entity.body,
    createdAt: new Date(entity.createdAt),
    syncStatus: entity.syncStatus,
    remoteId: entity.remoteId,
    lastSyncAttempt: entity.lastSyncAttempt ? new Date(entity.lastSyncAttempt) : null,
    syncError: entity.syncError,
  };
}

/**
 * Convert domain Record to RecordEntity
 */
export function recordToEntity(record: Record): RecordEntity {
  return {
    id: record.id,
    title: record.title,
    body: record.body,
    createdAt: record.createdAt.getTime(),
    syncStatus: record.syncStatus,
    remoteId: record.remoteId,
    lastSyncAttempt: record.lastSyncAttempt ? record.lastSyncAttempt.getTime() : null,
    syncError: record.syncError,
  };
}

/**
 * Convert RecordEntity to CreatePostDTO for API request
 */
export function entityToCreatePostDTO(entity: RecordEntity): CreatePostDTO {
  return {
    title: entity.title,
    body: entity.body,
    userId: 1, // jsonplaceholder requires userId, using constant
  };
}

/**
 * Update RecordEntity with data from API response
 */
export function mergePostResponse(
  entity: RecordEntity,
  response: PostResponseDTO
): RecordEntity {
  return {
    ...entity,
    remoteId: response.id,
    syncStatus: 'SYNCED',
    lastSyncAttempt: Date.now(),
    syncError: null,
  };
}

/**
 * Convert array of entities to domain records
 */
export function entitiesToRecords(entities: RecordEntity[]): Record[] {
  return entities.map(entityToRecord);
}

/**
 * Convert array of domain records to entities
 */
export function recordsToEntities(records: Record[]): RecordEntity[] {
  return records.map(recordToEntity);
}
