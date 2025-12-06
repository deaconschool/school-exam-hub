import { Student } from '@/data/types';

export interface BatchData {
  teacherId: string;
  students: Student[];
  timestamp: Date;
  lastModified: Date;
  sessionName: string;
}

export interface BatchSession {
  id: string;
  name: string;
  teacherId: string;
  studentCodes: string[];
  timestamp: Date;
  lastModified: Date;
  isActive: boolean;
}

/**
 * Batch Storage Service
 * Provides persistent storage for student batches across sessions and connection issues
 */
export class BatchStorageService {
  private static readonly BATCH_STORAGE_KEY = 'teacher_batch_data';
  private static readonly BATCH_SESSIONS_KEY = 'teacher_batch_sessions';
  private static readonly ACTIVE_SESSION_KEY = 'active_batch_session';
  private static readonly INDEXED_DB_NAME = 'SchoolExamHub_BatchStorage';
  private static readonly INDEXED_DB_VERSION = 1;
  private static db: IDBDatabase | null = null;
  private static initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB database
   */
  private static async initDB(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.INDEXED_DB_NAME, this.INDEXED_DB_VERSION);

      request.onerror = () => {
        const error = request.error;
        if (error && error.name === 'VersionError') {
          // If version error, try to delete the database and recreate
          console.warn('BatchStorage IndexedDB version conflict, attempting to recreate database');
          indexedDB.deleteDatabase(this.INDEXED_DB_NAME);

          // Retry after a short delay
          setTimeout(() => {
            this.initPromise = null; // Reset the promise
            this.initDB().then(resolve).catch(reject);
          }, 100);
          return;
        }
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create batches store if it doesn't exist
        if (!db.objectStoreNames.contains('batches')) {
          db.createObjectStore('batches', { keyPath: 'id' });
        }

        // Create sessions store if it doesn't exist
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized before operations
   */
  private static async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  /**
   * Save the current batch for a teacher
   */
  static async saveBatch(teacherId: string, students: Student[], sessionName?: string): Promise<void> {
    try {
      const batchData: BatchData = {
        teacherId,
        students,
        timestamp: new Date(),
        lastModified: new Date(),
        sessionName: sessionName || this.generateSessionName()
      };

      // Save to localStorage for immediate access
      localStorage.setItem(`${this.BATCH_STORAGE_KEY}_${teacherId}`, JSON.stringify(batchData));

      // Also save to IndexedDB for persistence
      await this.saveBatchToIndexedDB(batchData);

      // Create or update session record
      await this.updateBatchSession(teacherId, students, batchData.sessionName);

    } catch (error) {
      console.error('Failed to save batch:', error);
    }
  }

  /**
   * Load the current batch for a teacher
   */
  static async loadBatch(teacherId: string): Promise<Student[] | null> {
    try {
      // Try localStorage first (faster)
      let batchData: BatchData | null = null;

      const localStorageData = localStorage.getItem(`${this.BATCH_STORAGE_KEY}_${teacherId}`);
      if (localStorageData) {
        try {
          batchData = JSON.parse(localStorageData);
        } catch (e) {
          console.warn('Failed to parse localStorage batch data:', e);
        }
      }

      // If not found in localStorage, try IndexedDB
      if (!batchData) {
        batchData = await this.loadBatchFromIndexedDB(teacherId);

        // Restore to localStorage if found in IndexedDB
        if (batchData) {
          localStorage.setItem(`${this.BATCH_STORAGE_KEY}_${teacherId}`, JSON.stringify(batchData));
        }
      }

      return batchData?.students || null;
    } catch (error) {
      console.error('Failed to load batch:', error);
      return null;
    }
  }

  /**
   * Update the current batch (add/remove students)
   */
  static async updateBatch(teacherId: string, students: Student[]): Promise<void> {
    try {
      // Get existing batch data
      const existingData = localStorage.getItem(`${this.BATCH_STORAGE_KEY}_${teacherId}`);
      let batchData: BatchData;

      if (existingData) {
        const parsed = JSON.parse(existingData);
        batchData = {
          ...parsed,
          students,
          lastModified: new Date()
        };
      } else {
        batchData = {
          teacherId,
          students,
          timestamp: new Date(),
          lastModified: new Date(),
          sessionName: this.generateSessionName()
        };
      }

      // Save updated batch
      await this.saveBatch(teacherId, students, batchData.sessionName);
    } catch (error) {
      console.error('Failed to update batch:', error);
    }
  }

  /**
   * Clear the current batch for a teacher
   */
  static async clearBatch(teacherId: string): Promise<void> {
    try {
      // Remove from localStorage
      localStorage.removeItem(`${this.BATCH_STORAGE_KEY}_${teacherId}`);

      // Remove from IndexedDB
      await this.clearBatchFromIndexedDB(teacherId);

      // Deactivate current session
      await this.deactivateCurrentSession(teacherId);

    } catch (error) {
      console.error('Failed to clear batch:', error);
    }
  }

  /**
   * Get all batch sessions for a teacher
   */
  static async getBatchSessions(teacherId: string): Promise<BatchSession[]> {
    try {
      const sessionsData = localStorage.getItem(`${this.BATCH_SESSIONS_KEY}_${teacherId}`);
      if (sessionsData) {
        return JSON.parse(sessionsData);
      }

      // Fallback to IndexedDB
      return await this.getBatchSessionsFromIndexedDB(teacherId);
    } catch (error) {
      console.error('Failed to get batch sessions:', error);
      return [];
    }
  }

  /**
   * Restore batch from a specific session
   */
  static async restoreFromSession(teacherId: string, sessionId: string): Promise<Student[] | null> {
    try {
      const sessions = await this.getBatchSessions(teacherId);
      const session = sessions.find(s => s.id === sessionId);

      if (!session) {
        return null;
      }

      // Get student details (you might need to implement this based on your student data)
      const students = await this.getStudentsByCodes(session.studentCodes);

      if (students.length > 0) {
        await this.saveBatch(teacherId, students, session.name);
        await this.setActiveSession(teacherId, sessionId);
        return students;
      }

      return null;
    } catch (error) {
      console.error('Failed to restore from session:', error);
      return null;
    }
  }

  /**
   * Check if there's a persistent batch for the teacher
   */
  static async hasPersistentBatch(teacherId: string): Promise<boolean> {
    try {
      const batch = await this.loadBatch(teacherId);
      return batch && batch.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get batch statistics
   */
  static getBatchStatistics(students: Student[]): {
    total: number;
    byClass: Record<string, number>;
    byLevel: Record<string, number>;
  } {
    const stats = {
      total: students.length,
      byClass: {} as Record<string, number>,
      byLevel: {} as Record<string, number>
    };

    students.forEach(student => {
      // Count by class
      const className = student.class || 'Unknown';
      stats.byClass[className] = (stats.byClass[className] || 0) + 1;

      // Count by level
      const level = student.level || 'Unknown';
      stats.byLevel[level] = (stats.byLevel[level] || 0) + 1;
    });

    return stats;
  }

  // Private helper methods

  private static generateSessionName(): string {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const dateString = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    return `Session ${dateString} ${timeString}`;
  }

  private static async saveBatchToIndexedDB(batchData: BatchData): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['batches'], 'readwrite');
      const store = transaction.objectStore('batches');

      const record = {
        id: `batch_${batchData.teacherId}`,
        data: batchData,
        timestamp: new Date()
      };

      return new Promise((resolve, reject) => {
        const putRequest = store.put(record);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      });
    } catch (error) {
      console.warn('Failed to save batch to IndexedDB:', error);
      // Don't throw - localStorage is sufficient
    }
  }

  private static async loadBatchFromIndexedDB(teacherId: string): Promise<BatchData | null> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['batches'], 'readonly');
      const store = transaction.objectStore('batches');

      return new Promise((resolve) => {
        const getRequest = store.get(`batch_${teacherId}`);

        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result ? result.data : null);
        };

        getRequest.onerror = () => {
          console.warn('Failed to load batch from IndexedDB:', getRequest.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('Failed to access IndexedDB:', error);
      return null;
    }
  }

  private static async clearBatchFromIndexedDB(teacherId: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      const transaction = db.transaction(['batches'], 'readwrite');
      const store = transaction.objectStore('batches');

      return new Promise((resolve) => {
        const deleteRequest = store.delete(`batch_${teacherId}`);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => {
          console.warn('Failed to clear batch from IndexedDB:', deleteRequest.error);
          resolve();
        };
      });
    } catch (error) {
      console.warn('Failed to clear batch from IndexedDB:', error);
      // Don't throw - localStorage clearing is sufficient
    }
  }

  private static async updateBatchSession(teacherId: string, students: Student[], sessionName: string): Promise<void> {
    const sessions: BatchSession[] = await this.getBatchSessions(teacherId);

    // Check if there's an active session for today
    const today = new Date().toDateString();
    let session = sessions.find(s =>
      s.isActive && new Date(s.timestamp).toDateString() === today
    );

    if (!session) {
      // Create new session
      session = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: sessionName,
        teacherId,
        studentCodes: students.map(s => s.code),
        timestamp: new Date(),
        lastModified: new Date(),
        isActive: true
      };
      sessions.push(session);
    } else {
      // Update existing session
      session.studentCodes = students.map(s => s.code);
      session.lastModified = new Date();
      session.name = sessionName;
    }

    // Save sessions
    localStorage.setItem(`${this.BATCH_SESSIONS_KEY}_${teacherId}`, JSON.stringify(sessions));
    await this.setActiveSession(teacherId, session.id);
  }

  private static async setActiveSession(teacherId: string, sessionId: string): Promise<void> {
    localStorage.setItem(`${this.ACTIVE_SESSION_KEY}_${teacherId}`, sessionId);
  }

  private static async deactivateCurrentSession(teacherId: string): Promise<void> {
    const sessions = await this.getBatchSessions(teacherId);
    const activeSessionId = localStorage.getItem(`${this.ACTIVE_SESSION_KEY}_${teacherId}`);

    if (activeSessionId) {
      const session = sessions.find(s => s.id === activeSessionId);
      if (session) {
        session.isActive = false;
        localStorage.setItem(`${this.BATCH_SESSIONS_KEY}_${teacherId}`, JSON.stringify(sessions));
      }
      localStorage.removeItem(`${this.ACTIVE_SESSION_KEY}_${teacherId}`);
    }
  }

  private static async getBatchSessionsFromIndexedDB(teacherId: string): Promise<BatchSession[]> {
    // Implement if needed for additional persistence
    return [];
  }

  private static async getStudentsByCodes(studentCodes: string[]): Promise<Student[]> {
    try {
      // Import dynamically to avoid circular imports
      const { SupabaseService } = await import('@/services/supabaseService');

      // Get students by codes
      const students: Student[] = [];

      for (const code of studentCodes) {
        try {
          const response = await SupabaseService.getStudentByCode(code);
          if (response.success && response.data) {
            students.push(response.data);
          }
        } catch (error) {
          console.warn(`Failed to load student ${code}:`, error);
        }
      }

      return students;
    } catch (error) {
      console.error('Failed to get students by codes:', error);
      return [];
    }
  }
}

export default BatchStorageService;