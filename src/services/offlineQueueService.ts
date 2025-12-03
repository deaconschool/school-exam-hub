import { connectivityService } from './connectivityService';

export interface QueuedOperation {
  id: string;
  type: 'grade' | 'batch_grade' | 'student_remove' | 'exam_create' | 'exam_update';
  data: any;
  timestamp: Date;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  error?: string;
  priority: 'low' | 'normal' | 'high';
  teacherId: string;
  examId?: string;
}

export interface SyncProgress {
  total: number;
  pending: number;
  syncing: number;
  completed: number;
  failed: number;
  lastSyncTime: Date | null;
  currentOperation?: string;
}

export interface OfflineQueueConfig {
  maxQueueSize: number;
  retryDelayMs: number;
  maxRetries: number;
  batchSize: number;
  syncOnReconnect: boolean;
  autoSyncInterval: number;
  storagePrefix: string;
}

const DEFAULT_CONFIG: OfflineQueueConfig = {
  maxQueueSize: 1000,
  retryDelayMs: 2000,
  maxRetries: 5,
  batchSize: 10,
  syncOnReconnect: true,
  autoSyncInterval: 30000, // 30 seconds
  storagePrefix: 'offline_queue_'
};

class OfflineQueueService {
  private config: OfflineQueueConfig;
  private queue: QueuedOperation[] = [];
  private listeners: ((queue: QueuedOperation[], progress: SyncProgress) => void)[] = [];
  private syncInProgress = false;
  private autoSyncInterval: NodeJS.Timeout | null = null;
  private operationHandlers: Map<string, (operation: QueuedOperation) => Promise<any>> = new Map();

  constructor(config: Partial<OfflineQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadQueue();
    this.setupConnectivityListener();
    this.startAutoSync();
  }

  private async loadQueue(): Promise<void> {
    try {
      const queueKey = `${this.config.storagePrefix}operations`;
      const stored = localStorage.getItem(queueKey);

      if (stored) {
        const parsed = JSON.parse(stored);
        this.queue = parsed.map((op: any) => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  private async saveQueue(): Promise<void> {
    try {
      const queueKey = `${this.config.storagePrefix}operations`;
      localStorage.setItem(queueKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  private setupConnectivityListener(): void {
    connectivityService.subscribe(async (status) => {
      if (status.online && this.config.syncOnReconnect) {
        // Wait a moment for connection to stabilize
        setTimeout(() => {
          this.syncPendingOperations();
        }, 1000);
      }
    });
  }

  private startAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
    }

    this.autoSyncInterval = setInterval(() => {
      if (connectivityService.getStatus().online) {
        this.syncPendingOperations();
      }
    }, this.config.autoSyncInterval);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Operation handler registration
  public registerOperationHandler(type: string, handler: (operation: QueuedOperation) => Promise<any>): void {
    this.operationHandlers.set(type, handler);
  }

  // Queue management
  public async addOperation(
    type: QueuedOperation['type'],
    data: any,
    teacherId: string,
    options: {
      priority?: QueuedOperation['priority'];
      examId?: string;
    } = {}
  ): Promise<string> {
    const id = this.generateId();

    const operation: QueuedOperation = {
      id,
      type,
      data,
      teacherId,
      examId: options.examId,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      priority: options.priority || 'normal'
    };

    // Insert based on priority
    const insertIndex = this.queue.findIndex(op =>
      op.status === 'pending' &&
      this.getPriorityValue(op.priority) < this.getPriorityValue(operation.priority)
    );

    if (insertIndex === -1) {
      this.queue.push(operation);
    } else {
      this.queue.splice(insertIndex, 0, operation);
    }

    // Enforce queue size limit
    if (this.queue.length > this.config.maxQueueSize) {
      // Remove oldest completed operations first
      const completedIndex = this.queue.findIndex(op => op.status === 'completed');
      if (completedIndex !== -1) {
        this.queue.splice(completedIndex, 1);
      } else {
        // Remove oldest pending operation (last resort)
        this.queue.shift();
      }
    }

    await this.saveQueue();
    this.notifyListeners();

    console.log(`Added operation to queue: ${type} (ID: ${id})`);

    // Try to sync immediately if online
    if (connectivityService.getStatus().online) {
      setTimeout(() => this.syncPendingOperations(), 100);
    }

    return id;
  }

  private getPriorityValue(priority: QueuedOperation['priority']): number {
    switch (priority) {
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  public getQueue(teacherId?: string): QueuedOperation[] {
    if (teacherId) {
      return this.queue.filter(op => op.teacherId === teacherId);
    }
    return [...this.queue];
  }

  public getOperation(id: string): QueuedOperation | null {
    return this.queue.find(op => op.id === id) || null;
  }

  public getProgress(teacherId?: string): SyncProgress {
    const filteredQueue = teacherId
      ? this.queue.filter(op => op.teacherId === teacherId)
      : this.queue;

    const total = filteredQueue.length;
    const pending = filteredQueue.filter(op => op.status === 'pending').length;
    const syncing = filteredQueue.filter(op => op.status === 'syncing').length;
    const completed = filteredQueue.filter(op => op.status === 'completed').length;
    const failed = filteredQueue.filter(op => op.status === 'failed').length;

    const lastSync = filteredQueue
      .filter(op => op.status === 'completed')
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const currentOperation = filteredQueue.find(op => op.status === 'syncing');

    return {
      total,
      pending,
      syncing,
      completed,
      failed,
      lastSyncTime: lastSync?.timestamp || null,
      currentOperation: currentOperation?.type
    };
  }

  // Sync operations
  public async syncPendingOperations(teacherId?: string): Promise<void> {
    if (this.syncInProgress || !connectivityService.getStatus().online) {
      return;
    }

    this.syncInProgress = true;

    try {
      const pendingOperations = this.queue.filter(op =>
        op.status === 'pending' &&
        (!teacherId || op.teacherId === teacherId)
      );

      // Process in batches
      for (let i = 0; i < pendingOperations.length; i += this.config.batchSize) {
        const batch = pendingOperations.slice(i, i + this.config.batchSize);

        await Promise.allSettled(
          batch.map(operation => this.syncOperation(operation))
        );

        // Small delay between batches to prevent overwhelming the server
        if (i + this.config.batchSize < pendingOperations.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
      await this.saveQueue();
      this.notifyListeners();
    }
  }

  private async syncOperation(operation: QueuedOperation): Promise<void> {
    try {
      // Mark as syncing
      operation.status = 'syncing';
      await this.saveQueue();
      this.notifyListeners();

      const handler = this.operationHandlers.get(operation.type);
      if (!handler) {
        throw new Error(`No handler registered for operation type: ${operation.type}`);
      }

      // Execute the operation
      await handler(operation);

      // Mark as completed
      operation.status = 'completed';
      operation.error = undefined;

      console.log(`Successfully synced operation: ${operation.type} (ID: ${operation.id})`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      operation.error = errorMessage;
      operation.retryCount++;

      console.error(`Failed to sync operation ${operation.id}:`, errorMessage);

      if (operation.retryCount >= operation.maxRetries) {
        operation.status = 'failed';
      } else {
        operation.status = 'pending';
        // Schedule retry with exponential backoff
        const delay = this.config.retryDelayMs * Math.pow(2, operation.retryCount);
        setTimeout(() => {
          if (connectivityService.getStatus().online) {
            this.syncOperation(operation);
          }
        }, delay);
      }
    }

    await this.saveQueue();
    this.notifyListeners();
  }

  // Manual retry for failed operations
  public async retryOperation(id: string): Promise<boolean> {
    const operation = this.queue.find(op => op.id === id);
    if (!operation) {
      return false;
    }

    operation.status = 'pending';
    operation.retryCount = 0;
    operation.error = undefined;

    await this.saveQueue();
    this.notifyListeners();

    if (connectivityService.getStatus().online) {
      await this.syncOperation(operation);
    }

    return true;
  }

  // Retry all failed operations
  public async retryFailedOperations(teacherId?: string): Promise<void> {
    const failedOperations = this.queue.filter(op =>
      op.status === 'failed' &&
      (!teacherId || op.teacherId === teacherId)
    );

    for (const operation of failedOperations) {
      await this.retryOperation(operation.id);
    }
  }

  // Remove completed/failed operations
  public async clearCompleted(teacherId?: string): Promise<void> {
    const initialLength = this.queue.length;

    this.queue = this.queue.filter(op =>
      op.status === 'pending' || op.status === 'syncing' ||
      (teacherId && op.teacherId !== teacherId)
    );

    if (this.queue.length !== initialLength) {
      await this.saveQueue();
      this.notifyListeners();
    }
  }

  public async clearFailed(teacherId?: string): Promise<void> {
    const initialLength = this.queue.length;

    this.queue = this.queue.filter(op =>
      op.status !== 'failed' ||
      (teacherId && op.teacherId !== teacherId)
    );

    if (this.queue.length !== initialLength) {
      await this.saveQueue();
      this.notifyListeners();
    }
  }

  // Listeners
  public subscribe(listener: (queue: QueuedOperation[], progress: SyncProgress) => void): () => void {
    this.listeners.push(listener);

    // Call immediately with current state
    listener(this.getQueue(), this.getProgress());

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    const queue = this.getQueue();
    const progress = this.getProgress();

    this.listeners.forEach(listener => {
      try {
        listener(queue, progress);
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    });
  }

  // Configuration
  public updateConfig(updates: Partial<OfflineQueueConfig>): void {
    this.config = { ...this.config, ...updates };

    if (updates.autoSyncInterval !== undefined) {
      this.startAutoSync();
    }
  }

  public getConfig(): OfflineQueueConfig {
    return { ...this.config };
  }

  // Statistics
  public getStatistics(teacherId?: string) {
    const filteredQueue = teacherId
      ? this.queue.filter(op => op.teacherId === teacherId)
      : this.queue;

    const byType = filteredQueue.reduce((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = filteredQueue.reduce((acc, op) => {
      acc[op.status] = (acc[op.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = filteredQueue.reduce((acc, op) => {
      acc[op.priority] = (acc[op.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const oldestOperation = filteredQueue
      .filter(op => op.status !== 'completed')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];

    return {
      totalOperations: filteredQueue.length,
      byType,
      byStatus,
      byPriority,
      oldestOperation: oldestOperation?.timestamp || null,
      averageRetries: filteredQueue.reduce((sum, op) => sum + op.retryCount, 0) / filteredQueue.length
    };
  }

  // Cleanup
  public cleanup(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }

    this.listeners = [];
  }

  // Export/Import for backup purposes
  public exportQueue(teacherId?: string): string {
    const queueData = teacherId
      ? this.queue.filter(op => op.teacherId === teacherId)
      : this.queue;

    return JSON.stringify(queueData, null, 2);
  }

  public async importQueue(queueData: string, replace = false): Promise<void> {
    try {
      const importedOperations: QueuedOperation[] = JSON.parse(queueData);

      if (replace) {
        this.queue = importedOperations.map(op => ({
          ...op,
          timestamp: new Date(op.timestamp)
        }));
      } else {
        this.queue.push(...importedOperations.map(op => ({
          ...op,
          id: this.generateId(), // Generate new IDs to avoid conflicts
          timestamp: new Date(op.timestamp)
        })));
      }

      await this.saveQueue();
      this.notifyListeners();

    } catch (error) {
      throw new Error(`Failed to import queue data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const offlineQueueService = new OfflineQueueService();

export default OfflineQueueService;