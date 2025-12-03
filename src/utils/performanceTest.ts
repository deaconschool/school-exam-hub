/**
 * Performance Testing Utilities
 * Tests and validates the performance optimizations implemented
 */

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  metadata?: any;
}

export class PerformanceTester {
  private metrics: PerformanceMetrics[] = [];

  /**
   * Start measuring a performance operation
   */
  startMeasurement(operationName: string): string {
    const measurementId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const metric: PerformanceMetrics = {
      operationName,
      startTime: performance.now(),
      endTime: 0,
      duration: 0,
      success: false
    };

    // Store metric using measurementId as key
    (this as any)[measurementId] = metric;

    return measurementId;
  }

  /**
   * End measurement and record results
   */
  endMeasurement(measurementId: string, success: boolean = true, metadata?: any): PerformanceMetrics {
    const metric = (this as any)[measurementId];
    if (!metric) {
      throw new Error(`Measurement not found: ${measurementId}`);
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    if (metadata) {
      metric.metadata = metadata;
    }

    this.metrics.push(metric);

    // Clean up temporary storage
    delete (this as any)[measurementId];

    return metric;
  }

  /**
   * Test search performance with debouncing
   */
  async testSearchPerformance(
    searchFunction: (term: string) => Promise<any>,
    testTerms: string[]
  ): Promise<{
    averageTime: number;
    totalTime: number;
    successRate: number;
    tests: PerformanceMetrics[];
  }> {
    const testMetrics: PerformanceMetrics[] = [];

    for (const term of testTerms) {
      const measurementId = this.startMeasurement(`Search: ${term}`);

      try {
        await searchFunction(term);
        const metric = this.endMeasurement(measurementId, true, { searchTerm: term });
        testMetrics.push(metric);
      } catch (error) {
        const metric = this.endMeasurement(measurementId, false, {
          searchTerm: term,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        testMetrics.push(metric);
      }
    }

    const totalTime = testMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const averageTime = totalTime / testMetrics.length;
    const successRate = (testMetrics.filter(m => m.success).length / testMetrics.length) * 100;

    return {
      averageTime,
      totalTime,
      successRate,
      tests: testMetrics
    };
  }

  /**
   * Test batch grade loading performance
   */
  async testBatchGradeLoading(
    batchLoadFunction: (studentCodes: string[], teacherId: string) => Promise<any>,
    studentCodes: string[],
    teacherId: string,
    iterations: number = 5
  ): Promise<{
    averageTime: number;
    fastestTime: number;
    slowestTime: number;
    totalTime: number;
    successRate: number;
    tests: PerformanceMetrics[];
  }> {
    const testMetrics: PerformanceMetrics[] = [];

    for (let i = 0; i < iterations; i++) {
      const measurementId = this.startMeasurement(`Batch Load (${studentCodes.length} students) - Iteration ${i + 1}`);

      try {
        await batchLoadFunction(studentCodes, teacherId);
        const metric = this.endMeasurement(measurementId, true, {
          studentCount: studentCodes.length,
          iteration: i + 1
        });
        testMetrics.push(metric);
      } catch (error) {
        const metric = this.endMeasurement(measurementId, false, {
          studentCount: studentCodes.length,
          iteration: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        testMetrics.push(metric);
      }
    }

    const durations = testMetrics.map(m => m.duration);
    const totalTime = durations.reduce((sum, duration) => sum + duration, 0);
    const averageTime = totalTime / testMetrics.length;
    const fastestTime = Math.min(...durations);
    const slowestTime = Math.max(...durations);
    const successRate = (testMetrics.filter(m => m.success).length / testMetrics.length) * 100;

    return {
      averageTime,
      fastestTime,
      slowestTime,
      totalTime,
      successRate,
      tests: testMetrics
    };
  }

  /**
   * Test cache performance
   */
  testCachePerformance(
    cacheGetFunction: (key: string) => any,
    cacheSetFunction: (key: string, value: any) => void,
    testData: { key: string; value: any }[]
  ): {
    cacheHitRate: number;
    averageGetTime: number;
    averageSetTime: number;
    totalOperations: number;
  } {
    const setTimes: number[] = [];
    const getTimes: number[] = = [];
    let cacheHits = 0;

    // Test set operations
    testData.forEach(({ key, value }) => {
      const start = performance.now();
      cacheSetFunction(key, value);
      const end = performance.now();
      setTimes.push(end - start);
    });

    // Test get operations (cache hits)
    testData.forEach(({ key }) => {
      const start = performance.now();
      const result = cacheGetFunction(key);
      const end = performance.now();
      getTimes.push(end - start);

      if (result !== null && result !== undefined) {
        cacheHits++;
      }
    });

    // Test get operations (cache misses)
    const missKeys = ['nonexistent1', 'nonexistent2', 'nonexistent3'];
    missKeys.forEach(key => {
      const start = performance.now();
      const result = cacheGetFunction(key);
      const end = performance.now();
      getTimes.push(end - start);
    });

    const averageSetTime = setTimes.reduce((sum, time) => sum + time, 0) / setTimes.length;
    const averageGetTime = getTimes.reduce((sum, time) => sum + time, 0) / getTimes.length;
    const cacheHitRate = (cacheHits / testData.length) * 100;

    return {
      cacheHitRate,
      averageGetTime,
      averageSetTime,
      totalOperations: testData.length + missKeys.length
    };
  }

  /**
   * Get all recorded metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: {
      totalOperations: number;
      successRate: number;
      averageDuration: number;
      totalDuration: number;
    };
    slowestOperations: PerformanceMetrics[];
    fastestOperations: PerformanceMetrics[];
    failedOperations: PerformanceMetrics[];
  } {
    const totalOperations = this.metrics.length;
    const successfulOperations = this.metrics.filter(m => m.success);
    const failedOperations = this.metrics.filter(m => !m.success);

    const successRate = (successfulOperations.length / totalOperations) * 100;
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = totalDuration / totalOperations;

    const sortedByDuration = [...this.metrics].sort((a, b) => b.duration - a.duration);
    const slowestOperations = sortedByDuration.slice(0, 5);
    const fastestOperations = sortedByDuration.slice(-5).reverse();

    return {
      summary: {
        totalOperations,
        successRate,
        averageDuration,
        totalDuration
      },
      slowestOperations,
      fastestOperations,
      failedOperations
    };
  }
}

/**
 * Utility function to validate performance targets
 */
export function validatePerformanceTargets(
  actualMetrics: any,
  targets: {
    maxSearchTime?: number;
    maxBatchLoadTime?: number;
    minSuccessRate?: number;
  }
): {
  passed: boolean;
  failures: string[];
  details: any;
} {
  const failures: string[] = [];
  let passed = true;

  if (targets.maxSearchTime && actualMetrics.searchTime > targets.maxSearchTime) {
    failures.push(`Search time ${actualMetrics.searchTime}ms exceeds target ${targets.maxSearchTime}ms`);
    passed = false;
  }

  if (targets.maxBatchLoadTime && actualMetrics.batchLoadTime > targets.maxBatchLoadTime) {
    failures.push(`Batch load time ${actualMetrics.batchLoadTime}ms exceeds target ${targets.maxBatchLoadTime}ms`);
    passed = false;
  }

  if (targets.minSuccessRate && actualMetrics.successRate < targets.minSuccessRate) {
    failures.push(`Success rate ${actualMetrics.successRate}% below target ${targets.minSuccessRate}%`);
    passed = false;
  }

  return {
    passed,
    failures,
    details: actualMetrics
  };
}