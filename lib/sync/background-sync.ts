/**
 * Background Sync Service
 * 
 * Manages background synchronization with:
 * - Network connectivity detection
 * - Exponential backoff retry logic
 * - Task scheduling via expo-task-manager
 * - Periodic background fetch
 */

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import NetInfo from '@react-native-community/netinfo';
import * as repository from '../data/repository';
import { initDatabase } from '../data/database';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

/**
 * Background task definition
 * Runs periodically to sync pending records
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    console.log('[BackgroundSync] Task started');

    // Ensure database is initialized
    await initDatabase();

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      console.log('[BackgroundSync] No internet connection, skipping sync');
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    // Sync pending records
    const result = await repository.syncPendingRecords();

    if (!result.success) {
      console.error('[BackgroundSync] Sync failed:', result.error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }

    const successCount = result.data.filter((r) => r.success).length;
    console.log(`[BackgroundSync] Synced ${successCount} records`);

    return successCount > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundSync] Task error:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register background sync task
 * Call this once when the app starts
 */
export async function registerBackgroundSync(): Promise<void> {
  try {
    // Check if task is already registered
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);

    if (isRegistered) {
      console.log('[BackgroundSync] Task already registered');
      return;
    }

    // Register background fetch task
    await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (minimum allowed by iOS)
      stopOnTerminate: false, // Continue after app is terminated
      startOnBoot: true, // Start after device reboot
    });

    console.log('[BackgroundSync] Task registered successfully');
  } catch (error) {
    console.error('[BackgroundSync] Registration failed:', error);
  }
}

/**
 * Unregister background sync task
 */
export async function unregisterBackgroundSync(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
    console.log('[BackgroundSync] Task unregistered');
  } catch (error) {
    console.error('[BackgroundSync] Unregister failed:', error);
  }
}

/**
 * Check if background sync is available
 */
export async function isBackgroundSyncAvailable(): Promise<boolean> {
  try {
    const status = await BackgroundFetch.getStatusAsync();
    return status === BackgroundFetch.BackgroundFetchStatus.Available;
  } catch (error) {
    console.error('[BackgroundSync] Status check failed:', error);
    return false;
  }
}

/**
 * Trigger immediate sync if network is available
 */
export async function triggerImmediateSync(): Promise<boolean> {
  try {
    console.log('[BackgroundSync] Triggering immediate sync');

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected || !netInfo.isInternetReachable) {
      console.log('[BackgroundSync] No internet connection');
      return false;
    }

    // Sync pending records
    const result = await repository.syncPendingRecords();

    if (!result.success) {
      console.error('[BackgroundSync] Immediate sync failed:', result.error);
      return false;
    }

    const successCount = result.data.filter((r) => r.success).length;
    console.log(`[BackgroundSync] Immediate sync completed: ${successCount} records`);

    return true;
  } catch (error) {
    console.error('[BackgroundSync] Immediate sync error:', error);
    return false;
  }
}

/**
 * Set up network state listener
 * Triggers sync when network becomes available
 */
export function setupNetworkListener(onNetworkChange?: (isConnected: boolean) => void): () => void {
  let previouslyConnected = false;

  const unsubscribe = NetInfo.addEventListener((state) => {
    const isConnected = state.isConnected && state.isInternetReachable === true;

    console.log('[BackgroundSync] Network state changed:', {
      type: state.type,
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
    });

    // Trigger sync when network becomes available
    if (isConnected && !previouslyConnected) {
      console.log('[BackgroundSync] Network available, triggering sync');
      triggerImmediateSync();
    }

    previouslyConnected = isConnected;

    // Notify callback
    if (onNetworkChange) {
      onNetworkChange(isConnected);
    }
  });

  return unsubscribe;
}

/**
 * Get current network status
 */
export async function getNetworkStatus(): Promise<{
  isConnected: boolean;
  type: string;
}> {
  try {
    const state = await NetInfo.fetch();
    return {
      isConnected: state.isConnected && state.isInternetReachable === true,
      type: state.type,
    };
  } catch (error) {
    console.error('[BackgroundSync] Get network status failed:', error);
    return { isConnected: false, type: 'unknown' };
  }
}
