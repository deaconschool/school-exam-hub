import { useState, useEffect, useCallback, useRef } from 'react';

export interface AutoSaveConfig {
  debounceMs: number;
  storageStrategy: 'hybrid'; // localStorage + IndexedDB
  retryAttempts: number;
}

export interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  saveCount: number;
  error: string | null;
  pendingChanges: boolean;
}

const DEFAULT_CONFIG: AutoSaveConfig = {
  debounceMs: 500,
  storageStrategy: 'hybrid',
  retryAttempts: 3
};

const STORAGE_KEY_PREFIX = 'autosave_grade_';
const INDEXED_DB_NAME = 'SchoolExamHub_AutoSave';
const INDEXED_DB_VERSION = 1;
const GRADE_STORE_NAME = 'gradeBackups';

class AutoSaveStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private async initDB(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);

      request.onerror = () => {
        const error = request.error;
        if (error && error.name === 'VersionError') {
          // If version error, try to delete the database and recreate
          console.warn('IndexedDB version conflict, attempting to recreate database');
          indexedDB.deleteDatabase(INDEXED_DB_NAME);

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
        if (!db.objectStoreNames.contains(GRADE_STORE_NAME)) {
          db.createObjectStore(GRADE_STORE_NAME, { keyPath: 'id' });
        }
      };
    });

    return this.initPromise;
  }

  async saveToLocalStorage(key: string, data: any): Promise<void> {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
      localStorage.setItem(storageKey, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }));
    } catch (error) {
      console.warn('LocalStorage save failed:', error);
      throw error;
    }
  }

  async saveToIndexedDB(key: string, data: any): Promise<void> {
    await this.initDB();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([GRADE_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(GRADE_STORE_NAME);

      const record = {
        id: key,
        data,
        timestamp: new Date(),
        version: '1.0'
      };

      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadFromLocalStorage(key: string): Promise<any> {
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
      const item = localStorage.getItem(storageKey);
      return item ? JSON.parse(item).data : null;
    } catch (error) {
      console.warn('LocalStorage load failed:', error);
      return null;
    }
  }

  async loadFromIndexedDB(key: string): Promise<any> {
    await this.initDB();

    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([GRADE_STORE_NAME], 'readonly');
      const store = transaction.objectStore(GRADE_STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };

      request.onerror = () => {
        console.warn('IndexedDB load failed:', request.error);
        resolve(null);
      };
    });
  }

  async removeFromStorage(key: string): Promise<void> {
    // Remove from localStorage
    try {
      const storageKey = `${STORAGE_KEY_PREFIX}${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('LocalStorage removal failed:', error);
    }

    // Remove from IndexedDB
    try {
      await this.initDB();
      if (this.db) {
        const transaction = this.db.transaction([GRADE_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(GRADE_STORE_NAME);
        store.delete(key);
      }
    } catch (error) {
      console.warn('IndexedDB removal failed:', error);
    }
  }
}

const storage = new AutoSaveStorage();

export function useAutoSave<T = any>(
  teacherId: string,
  examId: string,
  initialData: Record<string, T> = {},
  config: Partial<AutoSaveConfig> = {}
) {
  const [data, setData] = useState<Record<string, T>>(initialData);
  const [status, setStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    lastSaved: null,
    saveCount: 0,
    error: null,
    pendingChanges: false
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveCountRef = useRef(0);
  const pendingSaveRef = useRef<Record<string, T> | null>(null);
  const retryCountRef = useRef(0);

  const configRef = useRef({ ...DEFAULT_CONFIG, ...config });
  const storageKey = `${teacherId}_${examId}`;

  // Load initial data from storage on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Try localStorage first (faster)
        let savedData = await storage.loadFromLocalStorage(storageKey);

        // If not found, try IndexedDB
        if (!savedData) {
          savedData = await storage.loadFromIndexedDB(storageKey);
        }

        if (savedData) {
          setData(savedData);
          setStatus(prev => ({
            ...prev,
            lastSaved: new Date(),
            saveCount: prev.saveCount + 1
          }));
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, [teacherId, examId, storageKey]);

  const saveData = useCallback(async (dataToSave: Record<string, T>, retryCount = 0): Promise<void> => {
    try {
      setStatus(prev => ({ ...prev, isSaving: true, error: null }));

      // Save to localStorage first (fastest)
      await storage.saveToLocalStorage(storageKey, dataToSave);

      // Also save to IndexedDB for larger capacity
      await storage.saveToIndexedDB(storageKey, dataToSave);

      const now = new Date();
      setStatus(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: now,
        saveCount: prev.saveCount + 1,
        pendingChanges: false,
        error: null
      }));

      saveCountRef.current += 1;
      pendingSaveRef.current = null;
      retryCountRef.current = 0;

    } catch (error) {
      console.error('Auto-save failed:', error);

      // Check if it's an IndexedDB version error
      if (error instanceof Error && error.name === 'VersionError') {
        console.warn('IndexedDB version error, localStorage save was successful');
        // Don't count as failure if localStorage save worked
        const now = new Date();
        setStatus(prev => ({
          ...prev,
          isSaving: false,
          lastSaved: now,
          saveCount: prev.saveCount + 1,
          pendingChanges: false,
          error: null
        }));
        saveCountRef.current += 1;
        pendingSaveRef.current = null;
        retryCountRef.current = 0;
        return;
      }

      // Retry logic for other errors
      if (retryCount < configRef.current.retryAttempts) {
        retryCountRef.current = retryCount + 1;
        setTimeout(() => {
          saveData(dataToSave, retryCount + 1);
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setStatus(prev => ({
          ...prev,
          isSaving: false,
          error: `Failed to save after ${retryCount + 1} attempts`,
          pendingChanges: true
        }));
      }
    }
  }, [storageKey]);

  // Debounced save function
  const debouncedSave = useCallback((newData: Record<string, T>) => {
    pendingSaveRef.current = newData;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (pendingSaveRef.current) {
        saveData(pendingSaveRef.current);
      }
    }, configRef.current.debounceMs);

    setStatus(prev => ({ ...prev, pendingChanges: true }));
  }, [saveData]);

  // Update function with auto-save
  const updateData = useCallback((updates: Partial<Record<string, T>> | ((prev: Record<string, T>) => Record<string, T>)) => {
    setData(prevData => {
      const newData = typeof updates === 'function'
        ? updates(prevData)
        : { ...prevData, ...updates };

      // Trigger auto-save
      debouncedSave(newData);

      return newData;
    });
  }, [debouncedSave]);

  // Update specific student grades
  const updateStudentGrades = useCallback((studentCode: string, grades: Partial<T>) => {
    updateData(prev => ({
      ...prev,
      [studentCode]: {
        ...prev[studentCode] || { tasleem_grade: '', not2_grade: '', ada2_gama3y_grade: '', notes: '' },
        ...grades
      }
    }));
  }, [updateData]);

  // Force save immediately
  const forceSave = useCallback(() => {
    if (pendingSaveRef.current) {
      saveData(pendingSaveRef.current);
    }
  }, [saveData]);

  // Clear saved data
  const clearSavedData = useCallback(async () => {
    try {
      await storage.removeFromStorage(storageKey);
      setData({});
      setStatus({
        isSaving: false,
        lastSaved: null,
        saveCount: 0,
        error: null,
        pendingChanges: false
      });
    } catch (error) {
      console.error('Failed to clear saved data:', error);
      setStatus(prev => ({
        ...prev,
        error: 'Failed to clear saved data'
      }));
    }
  }, [storageKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Save any pending data before unmount
      if (pendingSaveRef.current) {
        saveData(pendingSaveRef.current);
      }
    };
  }, [saveData]);

  // Listen for page visibility changes to save when tab becomes hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && pendingSaveRef.current) {
        saveData(pendingSaveRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [saveData]);

  // Listen for beforeunload to save data
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSaveRef.current) {
        // Use synchronous localStorage for beforeunload
        try {
          const storageKey = `${STORAGE_KEY_PREFIX}${storageKey}`;
          localStorage.setItem(storageKey, JSON.stringify({
            data: pendingSaveRef.current,
            timestamp: new Date().toISOString(),
            version: '1.0'
          }));
        } catch (error) {
          console.error('Emergency save failed:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [storageKey]);

  return {
    data,
    status,
    updateData,
    updateStudentGrades,
    forceSave,
    clearSavedData
  };
}