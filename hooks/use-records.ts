/**
 * Custom hook for records management
 * 
 * Provides reactive state management for records with automatic refresh.
 */

import { useState, useEffect, useCallback } from 'react';
import * as useCases from '@/lib/domain/use-cases';
import type { Record, SyncResult } from '@/lib/data/types';

interface UseRecordsState {
  records: Record[];
  loading: boolean;
  error: string | null;
  syncStats: {
    total: number;
    synced: number;
    pending: number;
    failed: number;
  };
}

interface UseRecordsActions {
  refresh: () => Promise<void>;
  createRecord: (title: string, body: string) => Promise<boolean>;
  syncRecords: () => Promise<SyncResult[]>;
  retryFailedSyncs: () => Promise<SyncResult[]>;
}

export function useRecords(): UseRecordsState & UseRecordsActions {
  const [state, setState] = useState<UseRecordsState>({
    records: [],
    loading: true,
    error: null,
    syncStats: { total: 0, synced: 0, pending: 0, failed: 0 },
  });

  /**
   * Fetch all records and sync stats
   */
  const refresh = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const [recordsResult, stats] = await Promise.all([
        useCases.fetchAllRecords(),
        useCases.getSyncStatistics(),
      ]);

      if (!recordsResult.success) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: recordsResult.error.message,
        }));
        return;
      }

      setState({
        records: recordsResult.data,
        loading: false,
        error: null,
        syncStats: stats,
      });
    } catch (error) {
      console.error('[useRecords] Refresh failed:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  }, []);

  /**
   * Create a new record
   */
  const createRecord = useCallback(
    async (title: string, body: string): Promise<boolean> => {
      try {
        const result = await useCases.createRecord(title, body);

        if (!result.success) {
          setState((prev) => ({ ...prev, error: result.error.message }));
          return false;
        }

        // Refresh list after creation
        await refresh();
        return true;
      } catch (error) {
        console.error('[useRecords] Create record failed:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
        }));
        return false;
      }
    },
    [refresh]
  );

  /**
   * Sync pending records
   */
  const syncRecords = useCallback(async (): Promise<SyncResult[]> => {
    try {
      const result = await useCases.syncRecords();

      if (!result.success) {
        setState((prev) => ({ ...prev, error: result.error.message }));
        return [];
      }

      // Refresh list after sync
      await refresh();
      return result.data;
    } catch (error) {
      console.error('[useRecords] Sync records failed:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return [];
    }
  }, [refresh]);

  /**
   * Retry failed syncs
   */
  const retryFailedSyncs = useCallback(async (): Promise<SyncResult[]> => {
    try {
      const result = await useCases.retryFailedSyncs();

      if (!result.success) {
        setState((prev) => ({ ...prev, error: result.error.message }));
        return [];
      }

      // Refresh list after retry
      await refresh();
      return result.data;
    } catch (error) {
      console.error('[useRecords] Retry failed syncs failed:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return [];
    }
  }, [refresh]);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...state,
    refresh,
    createRecord,
    syncRecords,
    retryFailedSyncs,
  };
}
