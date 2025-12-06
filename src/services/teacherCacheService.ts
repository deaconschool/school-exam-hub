/**
 * Teacher-Specific Cache Service
 * Provides caching layer exclusively for teacher portal data
 * Separated from other portals to prevent interference
 *
 * IMPORTANT: This service only adds caching, it doesn't change existing behavior
 * All features continue to work exactly as before, with optional cache lookups
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class TeacherCacheService {
  private cache = new Map<string, CacheEntry<any>>();

  // TTL values adjusted based on data stability
  private readonly TTL = {
    EXAM_ID: 10 * 60 * 1000,        // 10 minutes - exam IDs are stable
    GRADE_CRITERIA: 5 * 60 * 1000,  // 5 minutes - grade criteria are stable per exam
    BATCH_GRADES: 10 * 1000,       // 10 seconds - grades can change quickly
    STUDENT_INFO: 30 * 1000,       // 30 seconds - student info can change
  };

  /**
   * Store data in cache with TTL (non-blocking, never throws)
   */
  set<T>(key: string, data: T, ttl?: number): void {
    try {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.TTL.GRADE_CRITERIA
      });
    } catch (error) {
      // Silently fail - cache is optimization, not critical
      console.warn('Cache set failed:', error);
    }
  }

  /**
   * Get data from cache if not expired
   * Returns null if not found or expired - always safe to use
   */
  get<T>(key: string): T | null {
    try {
      const entry = this.cache.get(key);
      if (!entry) return null;

      // Check if entry has expired
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  /**
   * Check if data exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove specific entry from cache
   */
  delete(key: string): boolean {
    try {
      return this.cache.delete(key);
    } catch {
      return false;
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    try {
      this.cache.clear();
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  /**
   * Clear expired entries only
   */
  clearExpired(): void {
    try {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  /**
   * Helper method: Cache with fallback
   * Tries cache first, if miss or error, executes fetch function
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch fresh data
    try {
      const data = await fetchFn();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      // If fetch fails, this will propagate up
      // Existing error handling remains unchanged
      throw error;
    }
  }

  /**
   * Cache active exam ID for a teacher
   */
  cacheActiveExamId(teacherId: string, examId: string): void {
    const key = `active_exam_${teacherId}`;
    this.set(key, examId, this.TTL.EXAM_ID);
  }

  /**
   * Get cached active exam ID
   */
  getActiveExamId(teacherId: string): string | null {
    const key = `active_exam_${teacherId}`;
    return this.get(key);
  }

  /**
   * Cache grade criteria (stable per exam)
   */
  cacheGradeCriteria(criteria: any): void {
    const key = 'grade_criteria';
    this.set(key, criteria, this.TTL.GRADE_CRITERIA);
  }

  /**
   * Get cached grade criteria
   */
  getGradeCriteria(): any | null {
    const key = 'grade_criteria';
    return this.get(key);
  }

  /**
   * Cache batch grades (frequently changing)
   */
  cacheBatchGrades(teacherId: string, studentCodes: string[], grades: any): void {
    const key = `batch_grades_${teacherId}_${studentCodes.join(',')}`;
    this.set(key, grades, this.TTL.BATCH_GRADES);
  }

  /**
   * Get cached batch grades
   */
  getBatchGrades(teacherId: string, studentCodes: string[]): any | null {
    const key = `batch_grades_${teacherId}_${studentCodes.join(',')}`;
    return this.get(key);
  }

  /**
   * Invalidate cache for specific teacher (when grades are saved)
   */
  invalidateTeacherCache(teacherId: string): void {
    try {
      // Remove all keys related to this teacher
      for (const key of this.cache.keys()) {
        if (key.includes(teacherId)) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getStats(): { size: number; expired: number } {
    try {
      const now = Date.now();
      let expired = 0;

      for (const entry of this.cache.values()) {
        if (now - entry.timestamp > entry.ttl) {
          expired++;
        }
      }

      return {
        size: this.cache.size,
        expired
      };
    } catch {
      return { size: 0, expired: 0 };
    }
  }
}

// Export singleton instance
export const teacherCacheService = new TeacherCacheService();

// Export class for testing
export { TeacherCacheService };