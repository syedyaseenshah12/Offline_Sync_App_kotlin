/**
 * Error Logger
 * 
 * Centralized error logging system.
 * In production, this would integrate with Crashlytics or similar service.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const ERROR_LOG_KEY = '@offline_sync_errors';
const MAX_STORED_ERRORS = 100;

export enum ErrorCategory {
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  SYNC = 'SYNC',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

/**
 * Log an error with context
 */
export async function logError(
  category: ErrorCategory,
  error: Error | string,
  context?: Record<string, any>
): Promise<void> {
  try {
    const errorLog: ErrorLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      category,
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      context,
    };

    // Log to console
    console.error(`[ErrorLogger] ${category}:`, errorLog.message, context);

    // Store in AsyncStorage
    const existingLogs = await getErrorLogs();
    const updatedLogs = [errorLog, ...existingLogs].slice(0, MAX_STORED_ERRORS);
    await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updatedLogs));

    // In production, send to Crashlytics or error tracking service
    // Example: Crashlytics.recordError(error, context);
  } catch (err) {
    console.error('[ErrorLogger] Failed to log error:', err);
  }
}

/**
 * Get all stored error logs
 */
export async function getErrorLogs(): Promise<ErrorLog[]> {
  try {
    const stored = await AsyncStorage.getItem(ERROR_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[ErrorLogger] Failed to get error logs:', error);
    return [];
  }
}

/**
 * Clear all error logs
 */
export async function clearErrorLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ERROR_LOG_KEY);
    console.log('[ErrorLogger] Error logs cleared');
  } catch (error) {
    console.error('[ErrorLogger] Failed to clear error logs:', error);
  }
}

/**
 * Get error logs by category
 */
export async function getErrorLogsByCategory(category: ErrorCategory): Promise<ErrorLog[]> {
  try {
    const logs = await getErrorLogs();
    return logs.filter((log) => log.category === category);
  } catch (error) {
    console.error('[ErrorLogger] Failed to get error logs by category:', error);
    return [];
  }
}

/**
 * Get recent error logs (last N errors)
 */
export async function getRecentErrorLogs(count: number = 10): Promise<ErrorLog[]> {
  try {
    const logs = await getErrorLogs();
    return logs.slice(0, count);
  } catch (error) {
    console.error('[ErrorLogger] Failed to get recent error logs:', error);
    return [];
  }
}

/**
 * Export error logs as JSON string
 */
export async function exportErrorLogs(): Promise<string> {
  try {
    const logs = await getErrorLogs();
    return JSON.stringify(logs, null, 2);
  } catch (error) {
    console.error('[ErrorLogger] Failed to export error logs:', error);
    return '[]';
  }
}
