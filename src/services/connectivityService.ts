export interface ConnectivityStatus {
  online: boolean;
  quality: 'excellent' | 'good' | 'poor' | 'offline';
  lastConnected: Date | null;
  nextRetry: Date | null;
  retryCount: number;
  maxRetries: number;
  connectionType: string;
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
}

export interface ConnectivityConfig {
  checkInterval: number; // milliseconds
  retryBackoffMs: number;
  maxRetries: number;
  timeoutMs: number;
  pingUrl: string;
}

const DEFAULT_CONFIG: ConnectivityConfig = {
  checkInterval: 10000, // 10 seconds (reduced frequency)
  retryBackoffMs: 2000, // 2 seconds
  maxRetries: 3, // Reduced retries
  timeoutMs: 2000, // 2 seconds (faster timeout)
  pingUrl: 'https://www.google.com/favicon.ico' // Simple, reliable endpoint to test connectivity
};

class ConnectivityService {
  private config: ConnectivityConfig;
  private status: ConnectivityStatus;
  private listeners: ((status: ConnectivityStatus) => void)[] = [];
  private checkInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private isChecking = false;
  private abortController: AbortController | null = null;

  constructor(config: Partial<ConnectivityConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.status = this.getInitialStatus();

    // Initialize with browser's online/offline status
    if (typeof window !== 'undefined') {
      this.setupBrowserListeners();
      this.startPeriodicCheck();
    }
  }

  private getInitialStatus(): ConnectivityStatus {
    if (typeof window === 'undefined') {
      return {
        online: false,
        quality: 'offline',
        lastConnected: null,
        nextRetry: null,
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        connectionType: 'unknown'
      };
    }

    const connection = this.getConnectionInfo();

    return {
      online: navigator.onLine,
      quality: navigator.onLine ? this.estimateQuality(connection) : 'offline',
      lastConnected: navigator.onLine ? new Date() : null,
      nextRetry: null,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      connectionType: connection?.type || 'unknown',
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      effectiveType: connection?.effectiveType
    };
  }

  private getConnectionInfo(): any {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      return (navigator as any).connection;
    }
    return null;
  }

  private estimateQuality(connection: any): 'excellent' | 'good' | 'poor' | 'offline' {
    // If we're explicitly offline, return offline
    if (!navigator.onLine) return 'offline';

    // If no connection API available, assume good connection (optimistic default)
    if (!connection) return 'excellent';

    const { effectiveType, downlink, rtt, saveData } = connection;

    // Check for data saver mode
    if (saveData) {
      return 'good'; // Data saver is on, but still usable
    }

    // Enhanced connection quality assessment
    if (effectiveType === '5g' || effectiveType === '4g') {
      // For 4G/5G, check actual metrics if available
      if (downlink && rtt) {
        if (downlink > 5 && rtt < 100) return 'excellent';
        if (downlink > 2 && rtt < 300) return 'good';
        return 'poor';
      }
      return 'excellent'; // Assume excellent for 4G/5G without metrics
    }

    if (effectiveType === '3g') {
      if (downlink && rtt) {
        if (downlink > 1.5 && rtt < 400) return 'good';
        if (downlink > 0.7 && rtt < 800) return 'poor';
        return 'offline';
      }
      return 'good'; // Assume good for 3G without metrics
    }

    // For 2G or unknown types
    if (effectiveType === '2g') {
      if (downlink && rtt) {
        if (downlink > 0.3 && rtt < 1000) return 'poor';
        return 'offline';
      }
      return 'poor';
    }

    // If connection type is unknown but we have metrics, use them
    if (downlink && rtt) {
      if (downlink > 2 && rtt < 200) return 'excellent';
      if (downlink > 1 && rtt < 500) return 'good';
      if (downlink > 0.1) return 'poor';
      return 'offline';
    }

    // Final fallback - if online and no other info, assume good
    return navigator.onLine ? 'good' : 'offline';
  }

  private setupBrowserListeners(): void {
    const handleOnline = () => {
      this.updateStatus({
        online: true,
        lastConnected: new Date(),
        retryCount: 0,
        nextRetry: null
      });
      this.scheduleReconnectCheck();
    };

    const handleOffline = () => {
      this.updateStatus({
        online: false,
        quality: 'offline'
      });
      this.scheduleRetry();
    };

    // Listen for connection changes if available
    const connection = this.getConnectionInfo();
    if (connection) {
      connection.addEventListener('change', () => {
        this.checkConnectivity();
      });
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Store cleanup function
    this.cleanup = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', this.checkConnectivity);
      }
    };
  }

  private startPeriodicCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, this.config.checkInterval);
  }

  private async checkConnectivity(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      // First priority: Use browser's online status as primary indicator
      let isOnline = navigator.onLine;
      let connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';

      if (!isOnline) {
        connectionQuality = 'offline';
      } else {
        // Only ping if browser reports online (to save unnecessary requests)
        const connection = this.getConnectionInfo();
        connectionQuality = this.estimateQuality(connection);

        // Only do actual ping tests if we have reason to doubt the connection
        if (connectionQuality === 'poor' || connectionQuality === 'offline') {
          // Method 1: Try fast ping with timeout
          try {
            const abortController = new AbortController();
            const timeoutId = setTimeout(() => abortController.abort(), this.config.timeoutMs);

            const response = await fetch('https://www.google.com/favicon.ico', {
              method: 'HEAD',
              signal: abortController.signal,
              cache: 'no-cache',
              mode: 'no-cors'
            });

            clearTimeout(timeoutId);
            isOnline = true;
            connectionQuality = 'good'; // If ping succeeds, upgrade to at least 'good'
          } catch (pingError) {
            // If browser says online but ping fails, trust the browser
            isOnline = navigator.onLine;
          }
        }
      }

      const connection = this.getConnectionInfo();

      this.updateStatus({
        online: isOnline,
        quality: isOnline ? connectionQuality : 'offline',
        lastConnected: isOnline ? new Date() : this.status.lastConnected,
        retryCount: isOnline ? 0 : this.status.retryCount,
        nextRetry: isOnline ? null : this.status.nextRetry,
        connectionType: connection?.type || 'unknown',
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        effectiveType: connection?.effectiveType
      });

      // Clear any pending retry if online
      if (isOnline && this.retryTimeout) {
        clearTimeout(this.retryTimeout);
        this.retryTimeout = null;
      }

    } catch (error) {
      // Network error - fallback to browser status
      this.updateStatus({
        online: navigator.onLine,
        quality: navigator.onLine ? 'poor' : 'offline'
      });

      if (this.status.retryCount < this.config.maxRetries && !navigator.onLine) {
        this.scheduleRetry();
      }
    } finally {
      this.isChecking = false;
    }
  }

  private scheduleRetry(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    const delay = this.config.retryBackoffMs * Math.pow(2, this.status.retryCount);
    const nextRetry = new Date(Date.now() + delay);

    this.updateStatus({
      nextRetry
    });

    this.retryTimeout = setTimeout(() => {
      this.updateStatus({
        retryCount: this.status.retryCount + 1
      });
      this.checkConnectivity();
    }, delay);
  }

  private scheduleReconnectCheck(): void {
    // Check connectivity more frequently immediately after coming online
    let checkCount = 0;
    const maxChecks = 5;
    const rapidInterval = 1000; // 1 second

    const rapidCheck = () => {
      if (checkCount >= maxChecks) {
        this.startPeriodicCheck(); // Return to normal checking
        return;
      }

      this.checkConnectivity();
      checkCount++;
      setTimeout(rapidCheck, rapidInterval);
    };

    rapidCheck();
  }

  private updateStatus(updates: Partial<ConnectivityStatus>): void {
    const oldStatus = { ...this.status };
    this.status = { ...this.status, ...updates };

    // Only notify listeners if status actually changed
    const changed = JSON.stringify(oldStatus) !== JSON.stringify(this.status);
    if (changed) {
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.status);
      } catch (error) {
        console.error('Error in connectivity listener:', error);
      }
    });
  }

  // Public API

  public getStatus(): ConnectivityStatus {
    return { ...this.status };
  }

  public isOnline(): boolean {
    return this.status.online;
  }

  public getQuality(): string {
    return this.status.quality;
  }

  public subscribe(listener: (status: ConnectivityStatus) => void): () => void {
    this.listeners.push(listener);

    // Immediately call with current status
    try {
      listener(this.status);
    } catch (error) {
      console.error('Error in new connectivity listener:', error);
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.status.online) {
        resolve(true);
        return;
      }

      const timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.subscribe((status) => {
        if (status.online) {
          clearTimeout(timeout);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  public async checkNow(): Promise<boolean> {
    await this.checkConnectivity();
    return this.status.online;
  }

  public forceOnline(): void {
    this.updateStatus({
      online: true,
      quality: 'excellent',
      lastConnected: new Date(),
      retryCount: 0,
      nextRetry: null
    });
  }

  public forceOffline(): void {
    this.updateStatus({
      online: false,
      quality: 'offline'
    });
  }

  public getConfig(): ConnectivityConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<ConnectivityConfig>): void {
    this.config = { ...this.config, ...updates };

    // Restart periodic check with new interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.startPeriodicCheck();
    }
  }

  public cleanup(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.listeners = [];
  }

  // Static method to get singleton instance
  private static instance: ConnectivityService | null = null;

  public static getInstance(config?: Partial<ConnectivityConfig>): ConnectivityService {
    if (!ConnectivityService.instance) {
      ConnectivityService.instance = new ConnectivityService(config);
    }
    return ConnectivityService.instance;
  }
}

// Export singleton instance
export const connectivityService = ConnectivityService.getInstance();

// Export types and utilities
export type { ConnectivityService };

// Helper function to create a React hook for connectivity
export function createConnectivityHook(service: ConnectivityService) {
  return function useConnectivity() {
    const [status, setStatus] = React.useState<ConnectivityStatus>(service.getStatus());

    React.useEffect(() => {
      const unsubscribe = service.subscribe(setStatus);
      return unsubscribe;
    }, []);

    return {
      ...status,
      isOnline: status.online,
      isOffline: !status.online,
      quality: status.quality,
      isConnectedExcellent: status.quality === 'excellent',
      isConnectedGood: status.quality === 'good',
      isConnectedPoor: status.quality === 'poor',
      canRetry: status.retryCount < status.maxRetries,
      retryIn: status.nextRetry
        ? Math.max(0, Math.ceil((status.nextRetry.getTime() - Date.now()) / 1000))
        : 0
    };
  };
}

// Export default hook
export const useConnectivity = createConnectivityHook(connectivityService);

// Import React at the top if not already available
import React from 'react';