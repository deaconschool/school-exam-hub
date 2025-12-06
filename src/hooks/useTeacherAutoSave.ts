/**
 * Teacher-Optimized Auto-Save Hook
 * Enhanced version of useAutoSave specifically for teacher grading workflow
 * - Smarter debouncing (longer for grading)
 * - Priority-based saving
 * - Reduced write operations
 * - Better error handling
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { teacherCacheService } from '@/services/teacherCacheService';
import { SupabaseService } from '@/services/supabaseService';

interface UseTeacherAutoSaveOptions {
  teacherId: string;
  studentCode?: string;
  examId?: string;
  onAutoSave?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface SaveStatus {
  lastSaved: Date | null;
  pendingChanges: boolean;
  isSaving: boolean;
  saveCount: number;
}

interface QueuedSave {
  id: string;
  data: any;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
}

export const useTeacherAutoSave = <T extends Record<string, any>>(
  initialData: T,
  storageKey: string,
  options: UseTeacherAutoSaveOptions
) => {
  const { teacherId, studentCode, examId, onAutoSave, onError } = options;

  // State
  const [data, setData] = useState<T>(initialData);
  const [status, setStatus] = useState<SaveStatus>({
    lastSaved: null,
    pendingChanges: false,
    isSaving: false,
    saveCount: 0
  });

  // Refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveQueueRef = useRef<QueuedSave[]>([]);
  const isProcessingRef = useRef(false);
  const lastSaveRef = useRef<T>(initialData);

  // Debounced save with longer delay for grading (1 second instead of 500ms)
  const debouncedSave = useCallback(
    (saveData: T, priority: 'high' | 'normal' | 'low' = 'normal') => {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Different delays based on priority
      const delay = priority === 'high' ? 100 : priority === 'normal' ? 1000 : 2000;

      saveTimeoutRef.current = setTimeout(() => {
        processSaveQueue();
      }, delay);
    },
    []
  );

  // Process save queue with priority
  const processSaveQueue = useCallback(async () => {
    if (isProcessingRef.current || saveQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    try {
      setStatus(prev => ({ ...prev, isSaving: true, pendingChanges: true }));

      // Get highest priority save (or latest if same priority)
      const sortedQueue = [...saveQueueRef.current].sort((a, b) => {
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        const aPriority = priorityOrder[a.priority];
        const bPriority = priorityOrder[b.priority];

        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // If same priority, use the latest
        return b.timestamp - a.timestamp;
      });

      const saveToProcess = sortedQueue[0];
      saveQueueRef.current = []; // Clear queue after processing

      // Save to localStorage first (fast, synchronous for emergencies)
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          data: saveToProcess.data,
          timestamp: new Date().toISOString(),
          teacherId,
          studentCode,
          examId
        }));
      } catch (error) {
        console.warn('localStorage save failed:', error);
      }

      // Async IndexedDB save (non-blocking)
      setTimeout(async () => {
        try {
          // Use existing BatchStorageService if available
          const { BatchStorageService } = await import('@/services/batchStorageService');
          await BatchStorageService.saveToIndexedDB(storageKey, saveToProcess.data);
        } catch (error) {
          console.warn('IndexedDB save failed:', error);
          // Don't throw error - auto-save failure shouldn't break the UI
        }
      }, 0);

      // Update cache for quick retrieval
      teacherCacheService.set(storageKey, saveToProcess.data, 60000); // 1 minute cache

      // Update status
      setStatus(prev => ({
        ...prev,
        lastSaved: new Date(),
        isSaving: false,
        pendingChanges: false,
        saveCount: prev.saveCount + 1
      }));

      lastSaveRef.current = saveToProcess.data;

      // Trigger callback
      if (onAutoSave) {
        onAutoSave(saveToProcess.data);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      setStatus(prev => ({ ...prev, isSaving: false }));

      if (onError) {
        onError(error as Error);
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [storageKey, teacherId, studentCode, examId, onAutoSave, onError]);

  // Public API
  const updateData = useCallback((
    updates: Partial<T>,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    setData(prev => {
      const newData = { ...prev, ...updates };

      // Only queue save if data actually changed
      if (JSON.stringify(newData) !== JSON.stringify(lastSaveRef.current)) {
        saveQueueRef.current.push({
          id: `${Date.now()}-${Math.random()}`,
          data: newData,
          priority,
          timestamp: Date.now()
        });

        setStatus(prev => ({ ...prev, pendingChanges: true }));
        debouncedSave(newData, priority);
      }

      return newData;
    });
  }, [debouncedSave]);

  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // Add current data to queue with high priority
    saveQueueRef.current.push({
      id: `force-${Date.now()}`,
      data,
      priority: 'high',
      timestamp: Date.now()
    });

    await processSaveQueue();
  }, [data, processSaveQueue]);

  const clearData = useCallback(() => {
    setData(initialData);
    saveQueueRef.current = [];

    // Clear storage
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }

    // Clear cache
    teacherCacheService.delete(storageKey);

    setStatus({
      lastSaved: null,
      pendingChanges: false,
      isSaving: false,
      saveCount: 0
    });

    lastSaveRef.current = initialData;
  }, [storageKey, initialData]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Try cache first
        const cached = teacherCacheService.get<T>(storageKey);
        if (cached) {
          setData(cached);
          lastSaveRef.current = cached;
          return;
        }

        // Then localStorage
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);

          // Validate it belongs to this teacher
          if (parsed.teacherId === teacherId &&
              parsed.studentCode === studentCode &&
              parsed.examId === examId) {
            setData(parsed.data);
            lastSaveRef.current = parsed.data;

            // Update cache
            teacherCacheService.set(storageKey, parsed.data, 60000);
          }
        }
      } catch (error) {
        console.warn('Failed to load auto-save data:', error);
      }
    };

    loadData();
  }, [storageKey, teacherId, studentCode, examId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      // Process any pending saves
      if (saveQueueRef.current.length > 0) {
        processSaveQueue();
      }
    };
  }, [processSaveQueue]);

  // Periodic cache cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      teacherCacheService.clearExpired();
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    data,
    updateData,
    forceSave,
    clearData,
    status,
    // Backward compatibility
    hasUnsavedChanges: status.pendingChanges,
    isSaving: status.isSaving,
    lastSaved: status.lastSaved
  };
};