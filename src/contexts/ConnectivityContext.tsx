import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { connectivityService, ConnectivityStatus, useConnectivity } from '../services/connectivityService';

interface ConnectivityContextType {
  // Current status
  status: ConnectivityStatus;
  isOnline: boolean;
  isOffline: boolean;
  quality: string;

  // Quality checks
  isConnectedExcellent: boolean;
  isConnectedGood: boolean;
  isConnectedPoor: boolean;

  // Connection info
  lastConnected: Date | null;
  nextRetry: Date | null;
  retryCount: number;
  maxRetries: number;

  // Actions
  checkNow: () => Promise<boolean>;
  waitForConnection: (timeoutMs?: number) => Promise<boolean>;
  retryConnection: () => void;
  forceOnline: () => void;
  forceOffline: () => void;

  // Configuration
  updateConfig: (config: any) => void;
}

const ConnectivityContext = createContext<ConnectivityContextType | undefined>(undefined);

interface ConnectivityProviderProps {
  children: ReactNode;
  autoRetry?: boolean;
  showToastOnStatusChange?: boolean;
}

export const ConnectivityProvider: React.FC<ConnectivityProviderProps> = ({
  children,
  autoRetry = true,
  showToastOnStatusChange = true
}) => {
  const connectivityState = useConnectivity();

  // Additional state for advanced features
  const [connectionHistory, setConnectionHistory] = useState<ConnectivityStatus[]>([]);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Initialize connection history on mount
  useEffect(() => {
    setConnectionHistory([connectivityService.getStatus()]);
  }, []);

  // Track connection changes for history
  useEffect(() => {
    const unsubscribe = connectivityService.subscribe((status) => {
      setConnectionHistory(prev => {
        const newHistory = [...prev, status];
        // Keep only last 50 entries
        return newHistory.slice(-50);
      });

      // Show toast notification if enabled
      if (showToastOnStatusChange) {
        handleStatusChange(status);
      }
    });

    return unsubscribe;
  }, [showToastOnStatusChange]);

  // Handle status changes for notifications
  const handleStatusChange = (status: ConnectivityStatus) => {
    const previousStatus = connectionHistory[connectionHistory.length - 1];

    if (previousStatus?.online !== status.online) {
      if (status.online) {
        // Came back online
        setShowOfflineWarning(false);
        showNotification('Connection restored', 'success');

        // Trigger auto-sync if we have pending operations
        if (autoRetry) {
          triggerAutoSync();
        }
      } else {
        // Went offline
        setShowOfflineWarning(true);
        showNotification('Connection lost. Working in offline mode.', 'warning');
      }
    } else if (previousStatus?.quality !== status.quality && status.online) {
      // Quality changed while online
      if (status.quality === 'poor') {
        showNotification('Poor connection detected', 'warning');
      } else if (status.quality === 'excellent' && previousStatus.quality !== 'excellent') {
        showNotification('Connection improved', 'success');
      }
    }
  };

  // Show browser notification (if permissions are granted)
  const showNotification = (message: string, type: 'success' | 'warning' | 'error') => {
    // Try browser notification first
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('School Exam Hub', {
        body: message,
        icon: type === 'success' ? '/success-icon.png' : '/warning-icon.png',
        tag: 'connectivity'
      });
    }

    // Fallback to console for now - could be replaced with toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Trigger auto-sync when coming back online
  const triggerAutoSync = async () => {
    // This will be implemented when we add the offline queue service
    setSyncInProgress(true);

    try {
      // Sync pending operations
      console.log('Triggering auto-sync...');
      // await offlineQueueService.syncPendingOperations();
    } catch (error) {
      console.error('Auto-sync failed:', error);
      showNotification('Failed to sync some changes', 'error');
    } finally {
      setSyncInProgress(false);
    }
  };

  // Context value
  const contextValue: ConnectivityContextType = {
    // Current status
    status: connectivityService.getStatus(),
    isOnline: connectivityState.isOnline,
    isOffline: connectivityState.isOffline,
    quality: connectivityState.quality,

    // Quality checks
    isConnectedExcellent: connectivityState.isConnectedExcellent,
    isConnectedGood: connectivityState.isConnectedGood,
    isConnectedPoor: connectivityState.isConnectedPoor,

    // Connection info
    lastConnected: connectivityState.lastConnected,
    nextRetry: connectivityState.nextRetry,
    retryCount: connectivityState.retryCount,
    maxRetries: connectivityState.maxRetries,

    // Actions
    checkNow: () => connectivityService.checkNow(),
    waitForConnection: (timeoutMs?: number) => connectivityService.waitForConnection(timeoutMs),
    retryConnection: () => {
      if (connectivityState.canRetry) {
        connectivityService.checkNow();
      }
    },
    forceOnline: () => connectivityService.forceOnline(),
    forceOffline: () => connectivityService.forceOffline(),

    // Configuration
    updateConfig: (config: any) => connectivityService.updateConfig(config)
  };

  return (
    <ConnectivityContext.Provider value={contextValue}>
      {children}

      {/* Global Offline Warning Banner */}
      {showOfflineWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 border-b border-red-200 text-red-800 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="text-sm font-medium">
                You are offline. Your work will be saved locally and synced when you reconnect.
              </span>
            </div>
            <button
              onClick={() => setShowOfflineWarning(false)}
              className="text-red-600 hover:text-red-800"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Global Sync Progress Indicator */}
      {syncInProgress && (
        <div className="fixed bottom-4 right-4 z-50 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm font-medium">Syncing changes...</span>
          </div>
        </div>
      )}
    </ConnectivityContext.Provider>
  );
};

// Custom hook to use the connectivity context
export const useConnectivityContext = (): ConnectivityContextType => {
  const context = useContext(ConnectivityContext);
  if (context === undefined) {
    throw new Error('useConnectivityContext must be used within a ConnectivityProvider');
  }
  return context;
};

// Higher-order component to provide connectivity awareness
export const withConnectivity = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & { connectivity?: ConnectivityContextType }> => {
  return (props) => {
    const connectivity = useConnectivityContext();
    return <Component {...props} connectivity={connectivity} />;
  };
};

// Utility hook for connectivity-dependent operations
export const useConnectivityOperation = () => {
  const { isOnline, waitForConnection, checkNow } = useConnectivityContext();
  const [operationInProgress, setOperationInProgress] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const executeOperation = async <T,>(
    operation: () => Promise<T>,
    options?: {
      requireOnline?: boolean;
      timeoutMs?: number;
      retryOffline?: boolean;
    }
  ): Promise<T | null> => {
    const { requireOnline = true, timeoutMs = 30000, retryOffline = true } = options || {};

    setOperationInProgress(true);
    setLastError(null);

    try {
      // If operation requires online status and we're offline, wait
      if (requireOnline && !isOnline) {
        if (retryOffline) {
          const connected = await waitForConnection(timeoutMs);
          if (!connected) {
            throw new Error('No internet connection available');
          }
        } else {
          throw new Error('This operation requires an internet connection');
        }
      }

      // Execute the operation
      const result = await operation();
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Operation failed';
      setLastError(errorMessage);
      console.error('Connectivity operation failed:', error);
      return null;
    } finally {
      setOperationInProgress(false);
    }
  };

  return {
    executeOperation,
    operationInProgress,
    lastError,
    clearError: () => setLastError(null)
  };
};

export default ConnectivityContext;