/**
 * Database Provider
 * 
 * Initializes the database when the app starts and provides loading state.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { initDatabase } from './data/database';

interface DatabaseContextValue {
  isReady: boolean;
  error: string | null;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  isReady: false,
  error: null,
});

export function useDatabaseReady() {
  return useContext(DatabaseContext);
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initialize() {
      try {
        console.log('[DatabaseProvider] Initializing database...');
        await initDatabase();
        console.log('[DatabaseProvider] Database ready');
        setIsReady(true);
      } catch (err) {
        console.error('[DatabaseProvider] Initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Database initialization failed');
      }
    }

    initialize();
  }, []);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-6">
        <Text className="text-xl font-bold text-error mb-2">Database Error</Text>
        <Text className="text-sm text-muted text-center">{error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#0a7ea4" />
        <Text className="text-sm text-muted mt-4">Initializing database...</Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={{ isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}
