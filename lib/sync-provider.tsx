/**
 * Sync Provider
 * 
 * Manages background sync lifecycle and network monitoring.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as backgroundSync from './sync/background-sync';

interface SyncContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  triggerSync: () => Promise<void>;
}

const SyncContext = createContext<SyncContextValue>({
  isOnline: false,
  isSyncing: false,
  triggerSync: async () => {},
});

export function useSyncContext() {
  return useContext(SyncContext);
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Register background sync task
    backgroundSync.registerBackgroundSync();

    // Set up network listener
    const unsubscribeNetwork = backgroundSync.setupNetworkListener((connected) => {
      setIsOnline(connected);
    });

    // Check initial network status
    backgroundSync.getNetworkStatus().then((status) => {
      setIsOnline(status.isConnected);
    });

    // Set up app state listener (sync on foreground)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribeNetwork();
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      console.log('[SyncProvider] App became active, checking for pending syncs');
      const stats = await import('./data/repository').then((m) => m.getSyncStats());
      if (stats.pending > 0 || stats.failed > 0) {
        await triggerSync();
      }
    }
  };

  const triggerSync = async () => {
    if (isSyncing) {
      console.log('[SyncProvider] Sync already in progress');
      return;
    }

    setIsSyncing(true);
    try {
      await backgroundSync.triggerImmediateSync();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <SyncContext.Provider value={{ isOnline, isSyncing, triggerSync }}>
      {children}
    </SyncContext.Provider>
  );
}
