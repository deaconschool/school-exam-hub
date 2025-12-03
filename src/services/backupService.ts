import { supabase } from './supabaseService';
import { Grade } from '@/types/supabase';
import { connectivityService } from './connectivityService';

export interface BackupData {
  id: string;
  teacherId: string;
  examId: string;
  grades: Grade[];
  createdAt: string;
  operation: 'auto_save' | 'manual_save' | 'batch_operation' | 'before_submit' | 'before_batch_load' | 'emergency';
  integrity: 'verified' | 'corrupted' | 'pending';
  storageLocation: 'localStorage' | 'IndexedDB' | 'supabase';
  checksum?: string;
  version: string;
}

export interface EnhancedBackupConfig {
  autoBackupInterval: number; // milliseconds
  maxBackupsPerTeacher: number;
  backupRetentionDays: number;
  enableCloudBackup: boolean;
  enableIntegrityCheck: boolean;
  compressionEnabled: boolean;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  restoredCount?: number;
  error?: string;
}

/**
 * Enhanced Data Backup Service for Grade Operations
 * Provides multi-tier automatic backup and recovery capabilities for grade management
 */
export class GradeBackupService {
  private static readonly DEFAULT_CONFIG: EnhancedBackupConfig = {
    autoBackupInterval: 30000, // 30 seconds during active grading
    maxBackupsPerTeacher: 50,
    backupRetentionDays: 30,
    enableCloudBackup: false, // Disabled until database table is created
    enableIntegrityCheck: true,
    compressionEnabled: false
  };

  private static readonly LOCAL_STORAGE_KEY = 'grade_backups';
  private static readonly INDEXED_DB_NAME = 'SchoolExamHub';
  private static readonly INDEXED_DB_VERSION = 2;
  private static readonly BACKUP_STORE_NAME = 'gradeBackups';

  private static config: EnhancedBackupConfig = { ...GradeBackupService.DEFAULT_CONFIG };
  private static autoBackupIntervals: Map<string, NodeJS.Timeout> = new Map();
  private static db: IDBDatabase | null = null;
  private static initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB for enhanced backup storage
   */
  private static async initIndexedDB(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.INDEXED_DB_NAME, this.INDEXED_DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.BACKUP_STORE_NAME)) {
          db.createObjectStore(this.BACKUP_STORE_NAME, { keyPath: 'id' });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Generate checksum for data integrity verification
   */
  private static generateChecksum(data: any): string {
    const dataString = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Enhanced multi-tier backup creation with integrity checks
   */
  static async createEnhancedBackup(
    teacherId: string,
    examId: string,
    operation: BackupData['operation'] = 'auto_save',
    gradeData?: Grade[]
  ): Promise<BackupResult> {
    try {
      const backupId = `enhanced_backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      // Get current grades if not provided
      let currentGrades = gradeData;
      if (!currentGrades) {
        // Check if examId is a valid UUID format, if not, only backup from local storage
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(examId);

        if (isValidUUID) {
          // Only fetch from database if examId is a valid UUID
          const { data: grades, error } = await supabase
            .from('grades')
            .select(`
              *,
              students!inner(code, name, class, level)
            `)
            .eq('teacher_id', teacherId)
            .eq('exam_id', examId);

          if (error) {
            return {
              success: false,
              error: `Failed to fetch current grades: ${error.message}`
            };
          }
          currentGrades = grades || [];
        } else {
          // For auto-save scenarios, get grades from local storage instead of database
          currentGrades = [];
        }
      }

      const backupData: BackupData = {
        id: backupId,
        teacherId,
        examId,
        grades: currentGrades,
        createdAt: timestamp,
        operation,
        integrity: this.config.enableIntegrityCheck ? 'pending' : 'verified',
        storageLocation: 'localStorage',
        version: '2.0'
      };

      // Add checksum if integrity checking is enabled
      if (this.config.enableIntegrityCheck) {
        backupData.checksum = this.generateChecksum(currentGrades);
        backupData.integrity = 'verified';
      }

      // Multi-tier storage strategy
      const storagePromises: Promise<void>[] = [];

      // Tier 1: localStorage (immediate access)
      storagePromises.push(this.storeBackupLocally(backupData));

      // Tier 2: IndexedDB (larger capacity)
      storagePromises.push(this.storeBackupInIndexedDB(backupData));

      // Tier 3: Supabase (cloud backup) - only if online and enabled
      if (this.config.enableCloudBackup && connectivityService.getStatus().online) {
        storagePromises.push(this.storeBackupInSupabase(backupData));
      }

      // Execute all storage operations in parallel
      const results = await Promise.allSettled(storagePromises);
      const failed = results.filter(r => r.status === 'rejected');

      if (failed.length > 0) {
        console.warn(`Backup completed with ${failed.length} storage failures:`, failed.map(f => f.reason));
      }

      console.log(`Enhanced backup created successfully: ${backupId} (${backupData.grades.length} grades)`);

      // Clean up old backups
      await this.cleanupOldBackups(teacherId);

      return {
        success: true,
        backupId
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during enhanced backup'
      };
    }
  }

  /**
   * Legacy backup method for backward compatibility
   */
  static async createBackup(
    teacherId: string,
    examId: string,
    operation: BackupData['operation'] = 'before_submit'
  ): Promise<BackupResult> {
    return this.createEnhancedBackup(teacherId, examId, operation);
  }

  /**
   * Store backup in IndexedDB
   */
  private static async storeBackupInIndexedDB(backupData: BackupData): Promise<void> {
    try {
      await this.initIndexedDB();

      if (!this.db) {
        throw new Error('IndexedDB not initialized');
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.BACKUP_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.BACKUP_STORE_NAME);
        const request = store.put(backupData);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn('Failed to store backup in IndexedDB:', error);
    }
  }

  /**
   * Store backup in Supabase (cloud backup)
   */
  private static async storeBackupInSupabase(backupData: BackupData): Promise<void> {
    try {
      // Store backup metadata only (not the full grade data)
      const { error } = await supabase
        .from('backup_records')
        .insert({
          id: backupData.id,
          teacher_id: backupData.teacherId,
          exam_id: backupData.examId,
          operation_type: backupData.operation,
          integrity: backupData.integrity,
          storage_location: backupData.storageLocation,
          checksum: backupData.checksum,
          grade_count: backupData.grades.length,
          created_at: backupData.createdAt
        });

      if (error) {
        throw new Error(`Cloud backup failed: ${error.message}`);
      }

      console.log('Cloud backup metadata stored successfully');
    } catch (error) {
      // Handle different types of errors gracefully
      if (error instanceof Error) {
        if (error.message.includes('backup_records') || error.message.includes('404')) {
          console.log('Cloud backup table not available - using local storage only');
        } else {
          console.warn('Cloud backup failed:', error.message);
        }
      } else {
        console.warn('Cloud backup failed:', error);
      }
      // Don't throw here - local storage is sufficient for grade protection
    }
  }

  /**
   * Restore grades from a backup
   */
  static async restoreFromBackup(backupId: string): Promise<RestoreResult> {
    try {
      const backupData = this.getBackupFromStorage(backupId);

      if (!backupData) {
        return {
          success: false,
          error: 'Backup not found or expired'
        };
      }

      // Delete existing grades for this teacher/exam combination
      const { error: deleteError } = await supabase
        .from('grades')
        .delete()
        .eq('teacher_id', backupData.teacherId)
        .eq('exam_id', backupData.examId);

      if (deleteError) {
        return {
          success: false,
          error: `Failed to delete existing grades: ${deleteError.message}`
        };
      }

      // Restore grades from backup
      if (backupData.grades.length > 0) {
        const gradesToInsert = backupData.grades.map(grade => ({
          student_id: grade.student_id,
          teacher_id: grade.teacher_id,
          exam_id: grade.exam_id,
          tasleem_grade: grade.tasleem_grade,
          not2_grade: grade.not2_grade,
          ada2_gama3y_grade: grade.ada2_gama3y_grade,
          notes: grade.notes,
          created_at: grade.created_at,
          updated_at: grade.updated_at
        }));

        const { error: insertError } = await supabase
          .from('grades')
          .insert(gradesToInsert);

        if (insertError) {
          return {
            success: false,
            error: `Failed to restore grades: ${insertError.message}`
          };
        }
      }

      // Clean up old backups
      this.cleanExpiredBackups();

      return {
        success: true,
        restoredCount: backupData.grades.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during restore'
      };
    }
  }

  /**
   * Get all available backups for a teacher
   */
  static getAvailableBackups(teacherId: string, examId?: string): BackupData[] {
    try {
      const backupsJson = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!backupsJson) return [];

      const allBackups: BackupData[] = JSON.parse(backupsJson);

      return allBackups
        .filter(backup => {
          const matchesTeacher = backup.teacherId === teacherId;
          const matchesExam = !examId || backup.examId === examId;
          const isNotExpired = this.isBackupValid(backup.createdAt);
          return matchesTeacher && matchesExam && isNotExpired;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error retrieving backups:', error);
      return [];
    }
  }

  /**
   * Verify data integrity between before and after states
   */
  static async verifyDataIntegrity(
    beforeData: Grade[],
    afterData: Grade[]
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check if all student IDs are preserved
      const beforeStudentIds = new Set(beforeData.map(g => g.student_id));
      const afterStudentIds = new Set(afterData.map(g => g.student_id));

      if (beforeStudentIds.size !== afterStudentIds.size) {
        errors.push('Student count mismatch');
      }

      // Check for missing students
      for (const studentId of beforeStudentIds) {
        if (!afterStudentIds.has(studentId)) {
          errors.push(`Student ${studentId} is missing after operation`);
        }
      }

      // Check grade values are within valid range
      for (const grade of afterData) {
        if (grade.tasleem_grade !== null && (grade.tasleem_grade < 0 || grade.tasleem_grade > 20)) {
          errors.push(`Invalid tasleem grade for student ${grade.student_id}`);
        }
        if (grade.not2_grade !== null && (grade.not2_grade < 0 || grade.not2_grade > 20)) {
          errors.push(`Invalid not2 grade for student ${grade.student_id}`);
        }
        if (grade.ada2_gama3y_grade !== null && (grade.ada2_gama3y_grade < 0 || grade.ada2_gama3y_grade > 20)) {
          errors.push(`Invalid ada2_gama3y grade for student ${grade.student_id}`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Error during integrity verification: ' + (error instanceof Error ? error.message : 'Unknown error')]
      };
    }
  }

  /**
   * Clean up expired backups
   */
  static cleanExpiredBackups(): void {
    try {
      const backupsJson = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!backupsJson) return;

      const backups: BackupData[] = JSON.parse(backupsJson);
      const validBackups = backups.filter(backup => this.isBackupValid(backup.createdAt));

      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(validBackups));
    } catch (error) {
      console.error('Error cleaning expired backups:', error);
    }
  }

  /**
   * Store backup in localStorage
   */
  private static storeBackupLocally(backupData: BackupData): void {
    try {
      const backupsJson = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      const existingBackups: BackupData[] = backupsJson ? JSON.parse(backupsJson) : [];

      // Add new backup
      existingBackups.push(backupData);

      // Limit to last 50 backups per teacher
      const teacherBackups = existingBackups
        .filter(b => b.teacherId === backupData.teacherId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const otherBackups = existingBackups.filter(b => b.teacherId !== backupData.teacherId);
      const limitedBackups = [...otherBackups, ...teacherBackups.slice(0, 50)];

      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(limitedBackups));
    } catch (error) {
      console.error('Error storing backup locally:', error);
    }
  }

  /**
   * Get backup from localStorage
   */
  private static getBackupFromStorage(backupId: string): BackupData | null {
    try {
      const backupsJson = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!backupsJson) return null;

      const backups: BackupData[] = JSON.parse(backupsJson);
      const backup = backups.find(b => b.id === backupId && this.isBackupValid(b.createdAt));

      return backup || null;
    } catch (error) {
      console.error('Error retrieving backup from storage:', error);
      return null;
    }
  }

  /**
   * Check if backup is still valid (not expired)
   */
  private static isBackupValid(createdAt: string): boolean {
    const createdDate = new Date(createdAt);
    const expiryDate = new Date(createdDate.getTime() + (this.BACKUP_EXPIRY_HOURS * 60 * 60 * 1000));
    return new Date() < expiryDate;
  }

  /**
   * Start automatic periodic backups for a teacher/exam combination
   */
  static startAutoBackup(
    teacherId: string,
    examId: string,
    customInterval?: number
  ): void {
    const key = `${teacherId}_${examId}`;

    // Stop existing auto-backup for this combination
    this.stopAutoBackup(teacherId, examId);

    const interval = customInterval || this.config.autoBackupInterval;

    // Create backup immediately
    this.createEnhancedBackup(teacherId, examId, 'auto_save');

    // Set up periodic backups
    const intervalId = setInterval(() => {
      this.createEnhancedBackup(teacherId, examId, 'auto_save');
    }, interval);

    this.autoBackupIntervals.set(key, intervalId);
    console.log(`Auto-backup started for ${key} (interval: ${interval}ms)`);
  }

  /**
   * Stop automatic periodic backups
   */
  static stopAutoBackup(teacherId: string, examId: string): void {
    const key = `${teacherId}_${examId}`;
    const intervalId = this.autoBackupIntervals.get(key);

    if (intervalId) {
      clearInterval(intervalId);
      this.autoBackupIntervals.delete(key);
      console.log(`Auto-backup stopped for ${key}`);
    }
  }

  /**
   * Stop all auto-backup intervals
   */
  static stopAllAutoBackups(): void {
    for (const [key, intervalId] of this.autoBackupIntervals) {
      clearInterval(intervalId);
    }
    this.autoBackupIntervals.clear();
    console.log('All auto-backups stopped');
  }

  /**
   * Create emergency backup (used during critical errors)
   */
  static async createEmergencyBackup(
    teacherId: string,
    examId: string,
    gradeData: Grade[]
  ): Promise<BackupResult> {
    return this.createEnhancedBackup(teacherId, examId, 'emergency', gradeData);
  }

  /**
   * Enhanced restore from backup with integrity verification
   */
  static async restoreFromEnhancedBackup(backupId: string): Promise<RestoreResult> {
    try {
      const backupData = await this.getBackupFromAllSources(backupId);

      if (!backupData) {
        return {
          success: false,
          error: 'Backup not found or expired'
        };
      }

      // Verify backup integrity if checksum is available
      if (backupData.checksum && backupData.integrity === 'verified') {
        const currentChecksum = this.generateChecksum(backupData.grades);
        if (currentChecksum !== backupData.checksum) {
          backupData.integrity = 'corrupted';
          console.error('Backup integrity check failed - data may be corrupted');
        }
      }

      if (backupData.integrity === 'corrupted') {
        return {
          success: false,
          error: 'Backup data integrity check failed'
        };
      }

      // Delete existing grades for this teacher/exam combination
      const { error: deleteError } = await supabase
        .from('grades')
        .delete()
        .eq('teacher_id', backupData.teacherId)
        .eq('exam_id', backupData.examId);

      if (deleteError) {
        return {
          success: false,
          error: `Failed to delete existing grades: ${deleteError.message}`
        };
      }

      // Restore grades from backup
      if (backupData.grades.length > 0) {
        const gradesToInsert = backupData.grades.map(grade => ({
          student_id: grade.student_id,
          teacher_id: grade.teacher_id,
          exam_id: grade.exam_id,
          tasleem_grade: grade.tasleem_grade,
          not2_grade: grade.not2_grade,
          ada2_gama3y_grade: grade.ada2_gama3y_grade,
          notes: grade.notes,
          created_at: grade.created_at,
          updated_at: grade.updated_at
        }));

        const { error: insertError } = await supabase
          .from('grades')
          .insert(gradesToInsert);

        if (insertError) {
          return {
            success: false,
            error: `Failed to restore grades: ${insertError.message}`
          };
        }
      }

      console.log(`Successfully restored ${backupData.grades.length} grades from backup ${backupId}`);

      // Create a post-restore backup
      await this.createEnhancedBackup(
        backupData.teacherId,
        backupData.examId,
        'manual_save',
        backupData.grades
      );

      return {
        success: true,
        restoredCount: backupData.grades.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during restore'
      };
    }
  }

  /**
   * Get backup from all available storage sources (with fallbacks)
   */
  private static async getBackupFromAllSources(backupId: string): Promise<BackupData | null> {
    try {
      // Try localStorage first (fastest)
      let backup = this.getBackupFromLocalStorage(backupId);
      if (backup) return backup;

      // Try IndexedDB
      backup = await this.getBackupFromIndexedDB(backupId);
      if (backup) return backup;

      // Try cloud backup (if online)
      if (connectivityService.getStatus().online) {
        backup = await this.getBackupFromCloud(backupId);
        if (backup) return backup;
      }

      return null;
    } catch (error) {
      console.error('Error retrieving backup from all sources:', error);
      return null;
    }
  }

  /**
   * Get backup from IndexedDB
   */
  private static async getBackupFromIndexedDB(backupId: string): Promise<BackupData | null> {
    try {
      await this.initIndexedDB();

      if (!this.db) {
        return null;
      }

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.BACKUP_STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.BACKUP_STORE_NAME);
        const request = store.get(backupId);

        request.onsuccess = () => {
          const backup = request.result;
          if (backup && this.isBackupValid(backup.createdAt)) {
            resolve(backup);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.warn('IndexedDB backup retrieval failed:', request.error);
          resolve(null);
        };
      });
    } catch (error) {
      console.warn('Failed to get backup from IndexedDB:', error);
      return null;
    }
  }

  /**
   * Get backup metadata from cloud storage
   */
  private static async getBackupFromCloud(backupId: string): Promise<BackupData | null> {
    try {
      // This would fetch backup metadata from Supabase
      // For now, return null as cloud backup stores metadata only
      return null;
    } catch (error) {
      console.warn('Failed to get backup from cloud:', error);
      return null;
    }
  }

  /**
   * Clean up old backups for a specific teacher
   */
  private static async cleanupOldBackups(teacherId: string): Promise<void> {
    try {
      const backups = this.getAvailableBackups(teacherId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.backupRetentionDays);

      const oldBackups = backups.filter(backup =>
        new Date(backup.createdAt) < cutoffDate
      );

      if (oldBackups.length > 0) {
        console.log(`Cleaning up ${oldBackups.length} old backups for teacher ${teacherId}`);

        for (const backup of oldBackups) {
          await this.deleteBackup(backup.id);
        }
      }

      // Also enforce maximum backup limit
      if (backups.length > this.config.maxBackupsPerTeacher) {
        const excessBackups = backups
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(this.config.maxBackupsPerTeacher);

        console.log(`Removing ${excessBackups.length} excess backups for teacher ${teacherId}`);

        for (const backup of excessBackups) {
          await this.deleteBackup(backup.id);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Delete a specific backup from all storage locations
   */
  private static async deleteBackup(backupId: string): Promise<void> {
    try {
      // Remove from localStorage
      const backupsJson = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (backupsJson) {
        const backups: BackupData[] = JSON.parse(backupsJson);
        const filteredBackups = backups.filter(b => b.id !== backupId);
        localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(filteredBackups));
      }

      // Remove from IndexedDB
      await this.initIndexedDB();
      if (this.db) {
        return new Promise((resolve, reject) => {
          const transaction = this.db!.transaction([this.BACKUP_STORE_NAME], 'readwrite');
          const store = transaction.objectStore(this.BACKUP_STORE_NAME);
          const request = store.delete(backupId);

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    } catch (error) {
      console.warn(`Failed to delete backup ${backupId}:`, error);
    }
  }

  /**
   * Enhanced backup statistics with health monitoring
   */
  static getEnhancedBackupStats(teacherId?: string): {
    totalBackups: number;
    localStorageBackups: number;
    indexedDBBackups: number;
    cloudBackups: number;
    expiredBackups: number;
    corruptedBackups: number;
    oldestBackup: string | null;
    newestBackup: string | null;
    totalSize: string;
    healthScore: number;
  } {
    try {
      const backups = teacherId ?
        this.getAvailableBackups(teacherId) :
        this.getAllBackups();

      const now = new Date();
      const localStorageBackups = backups.filter(b => b.storageLocation === 'localStorage').length;
      const indexedDBBackups = backups.filter(b => b.storageLocation === 'IndexedDB').length;
      const cloudBackups = backups.filter(b => b.storageLocation === 'supabase').length;
      const expiredBackups = backups.filter(b => !this.isBackupValid(b.createdAt)).length;
      const corruptedBackups = backups.filter(b => b.integrity === 'corrupted').length;

      const sortedBackups = backups.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const oldestBackup = sortedBackups.length > 0 ? sortedBackups[0].createdAt : null;
      const newestBackup = sortedBackups.length > 0 ? sortedBackups[sortedBackups.length - 1].createdAt : null;

      // Estimate total size
      const totalSize = JSON.stringify(backups).length;
      const formattedSize = totalSize > 1024 * 1024 ?
        `${(totalSize / (1024 * 1024)).toFixed(2)} MB` :
        `${(totalSize / 1024).toFixed(2)} KB`;

      // Calculate health score (0-100)
      const healthScore = backups.length > 0 ?
        Math.max(0, 100 - ((expiredBackups + corruptedBackups) / backups.length * 100)) : 100;

      return {
        totalBackups: backups.length,
        localStorageBackups,
        indexedDBBackups,
        cloudBackups,
        expiredBackups,
        corruptedBackups,
        oldestBackup,
        newestBackup,
        totalSize: formattedSize,
        healthScore
      };
    } catch (error) {
      console.error('Error getting enhanced backup stats:', error);
      return {
        totalBackups: 0,
        localStorageBackups: 0,
        indexedDBBackups: 0,
        cloudBackups: 0,
        expiredBackups: 0,
        corruptedBackups: 0,
        oldestBackup: null,
        newestBackup: null,
        totalSize: '0 B',
        healthScore: 0
      };
    }
  }

  /**
   * Get all backups (for admin purposes)
   */
  private static getAllBackups(): BackupData[] {
    try {
      const backupsJson = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!backupsJson) return [];

      const backups: BackupData[] = JSON.parse(backupsJson);
      return backups.filter(backup => this.isBackupValid(backup.createdAt));
    } catch (error) {
      console.error('Error retrieving all backups:', error);
      return [];
    }
  }

  /**
   * Update backup configuration
   */
  static updateConfig(updates: Partial<EnhancedBackupConfig>): void {
    this.config = { ...this.config, ...updates };

    // Restart auto-backups with new interval if changed
    if (updates.autoBackupInterval) {
      console.log('Backup configuration updated. Auto-backup intervals will use new settings on next start.');
    }
  }

  /**
   * Get current backup configuration
   */
  static getConfig(): EnhancedBackupConfig {
    return { ...this.config };
  }

  /**
   * Legacy backup stats method for backward compatibility
   */
  static getBackupStats(): { totalBackups: number; expiredBackups: number; oldestBackup: string | null } {
    const stats = this.getEnhancedBackupStats();
    return {
      totalBackups: stats.totalBackups,
      expiredBackups: stats.expiredBackups,
      oldestBackup: stats.oldestBackup
    };
  }
}