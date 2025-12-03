import { useCallback, useRef } from 'react';
import { Student } from '@/data/types';

interface CacheEntry {
  student: Student;
  timestamp: number;
  expiryTime: number; // in milliseconds
}

interface StudentCacheData {
  getByCode: (code: string) => Student | null;
  setByCode: (code: string, student: Student, ttlMs?: number) => void;
  clearCache: () => void;
  clearExpired: () => void;
  getCacheStats: () => { totalEntries: number; expiredEntries: number };
}

/**
 * Simple in-memory cache for student data during grading sessions
 * Reduces redundant API calls and improves performance
 */
export const useStudentCache = (): StudentCacheData => {
  // Cache stored in ref to persist across re-renders
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Default TTL: 30 minutes (30 * 60 * 1000 ms)
  const DEFAULT_TTL = 30 * 60 * 1000;

  // Clear expired entries periodically
  const clearExpired = useCallback(() => {
    const now = Date.now();
    const cache = cacheRef.current;

    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiryTime) {
        cache.delete(key);
      }
    }
  }, []);

  // Get student by code from cache
  const getByCode = useCallback((code: string): Student | null => {
    if (!code) return null;

    // Clear expired entries first
    clearExpired();

    const entry = cacheRef.current.get(code.toLowerCase().trim());

    if (!entry) {
      return null;
    }

    // Check if entry is still valid
    const now = Date.now();
    if (now > entry.expiryTime) {
      cacheRef.current.delete(code.toLowerCase().trim());
      return null;
    }

    return entry.student;
  }, [clearExpired]);

  // Set student in cache with optional TTL
  const setByCode = useCallback((
    code: string,
    student: Student,
    ttlMs: number = DEFAULT_TTL
  ) => {
    if (!code || !student) return;

    const normalizedCode = code.toLowerCase().trim();
    const now = Date.now();

    cacheRef.current.set(normalizedCode, {
      student,
      timestamp: now,
      expiryTime: now + ttlMs
    });

    // Limit cache size to prevent memory issues
    const cache = cacheRef.current;
    if (cache.size > 200) {
      // Sort by timestamp and remove oldest entries
      const sortedEntries = Array.from(cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      // Remove oldest 50 entries
      for (let i = 0; i < 50 && i < sortedEntries.length; i++) {
        cache.delete(sortedEntries[i][0]);
      }
    }
  }, []);

  // Clear entire cache
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  // Get cache statistics for debugging
  const getCacheStats = useCallback(() => {
    const cache = cacheRef.current;
    const now = Date.now();

    let expiredCount = 0;
    for (const [, entry] of cache.entries()) {
      if (now > entry.expiryTime) {
        expiredCount++;
      }
    }

    return {
      totalEntries: cache.size,
      expiredEntries: expiredCount
    };
  }, []);

  return {
    getByCode,
    setByCode,
    clearCache,
    clearExpired,
    getCacheStats
  };
};

/**
 * Enhanced version for searching students with cached results
 */
export const useStudentSearchCache = () => {
  const searchCacheRef = useRef<Map<string, { students: Student[]; timestamp: number; expiryTime: number }>>(new Map());
  const DEFAULT_SEARCH_TTL = 15 * 60 * 1000; // 15 minutes for search results

  const getSearchResults = useCallback((searchTerm: string): Student[] | null => {
    if (!searchTerm.trim()) return null;

    const normalizedTerm = searchTerm.toLowerCase().trim();
    const entry = searchCacheRef.current.get(normalizedTerm);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now > entry.expiryTime) {
      searchCacheRef.current.delete(normalizedTerm);
      return null;
    }

    return entry.students;
  }, []);

  const setSearchResults = useCallback((
    searchTerm: string,
    students: Student[],
    ttlMs: number = DEFAULT_SEARCH_TTL
  ) => {
    if (!searchTerm.trim()) return;

    const normalizedTerm = searchTerm.toLowerCase().trim();
    const now = Date.now();

    searchCacheRef.current.set(normalizedTerm, {
      students,
      timestamp: now,
      expiryTime: now + ttlMs
    });

    // Limit search cache size
    const cache = searchCacheRef.current;
    if (cache.size > 100) {
      // Remove oldest 20 entries
      const sortedEntries = Array.from(cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      for (let i = 0; i < 20 && i < sortedEntries.length; i++) {
        cache.delete(sortedEntries[i][0]);
      }
    }
  }, []);

  const clearSearchCache = useCallback(() => {
    searchCacheRef.current.clear();
  }, []);

  return {
    getSearchResults,
    setSearchResults,
    clearSearchCache
  };
};