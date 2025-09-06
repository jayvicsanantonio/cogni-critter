/**
 * Performance Monitor
 * Utilities for monitoring animation performance and frame rates
 */

import { InteractionManager } from 'react-native';

/**
 * Performance Monitor Class
 * Tracks frame rates, animation performance, and provides optimization suggestions
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private frameCount = 0;
  private lastFrameTime = 0;
  private frameRates: number[] = [];
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Performance thresholds
  private static readonly TARGET_FPS = 60;
  private static readonly MIN_ACCEPTABLE_FPS = 45;
  private static readonly FRAME_TIME_TARGET =
    1000 / PerformanceMonitor.TARGET_FPS; // ~16.67ms

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start monitoring performance
   * @param sampleDuration Duration to monitor in milliseconds (default: 5000ms)
   */
  public startMonitoring(sampleDuration: number = 5000): void {
    if (this.isMonitoring) {
      console.warn('[PerformanceMonitor] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    this.frameCount = 0;
    this.frameRates = [];
    this.lastFrameTime = Date.now();

    if (__DEV__) {
      console.log(
        `[PerformanceMonitor] Starting performance monitoring for ${sampleDuration}ms`
      );
    }

    // Monitor frame rate using requestAnimationFrame equivalent
    const monitorFrame = () => {
      if (!this.isMonitoring) return;

      const currentTime = Date.now();
      const frameTime = currentTime - this.lastFrameTime;

      if (this.lastFrameTime > 0) {
        const fps = 1000 / frameTime;
        this.frameRates.push(fps);
        this.frameCount++;

        // Log frame drops in development
        if (__DEV__ && fps < PerformanceMonitor.MIN_ACCEPTABLE_FPS) {
          console.warn(
            `[PerformanceMonitor] Frame drop detected: ${fps.toFixed(
              1
            )} FPS`
          );
        }
      }

      this.lastFrameTime = currentTime;

      // Schedule next frame
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(monitorFrame);
      });
    };

    // Start monitoring
    requestAnimationFrame(monitorFrame);

    // Stop monitoring after specified duration
    this.monitoringInterval = setTimeout(() => {
      this.stopMonitoring();
    }, sampleDuration);
  }

  /**
   * Stop monitoring performance
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearTimeout(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (__DEV__) {
      const stats = this.getPerformanceStats();
      console.log('[PerformanceMonitor] Monitoring stopped:', stats);
    }
  }

  /**
   * Get current performance statistics
   * @returns Performance statistics object
   */
  public getPerformanceStats(): PerformanceStats {
    if (this.frameRates.length === 0) {
      return {
        averageFPS: 0,
        minFPS: 0,
        maxFPS: 0,
        frameDrops: 0,
        totalFrames: 0,
        isTargetMet: false,
        isAcceptable: false,
        recommendations: [
          'No data available - start monitoring first',
        ],
      };
    }

    const averageFPS =
      this.frameRates.reduce((sum, fps) => sum + fps, 0) /
      this.frameRates.length;
    const minFPS = Math.min(...this.frameRates);
    const maxFPS = Math.max(...this.frameRates);
    const frameDrops = this.frameRates.filter(
      (fps) => fps < PerformanceMonitor.MIN_ACCEPTABLE_FPS
    ).length;

    const isTargetMet = averageFPS >= PerformanceMonitor.TARGET_FPS;
    const isAcceptable =
      averageFPS >= PerformanceMonitor.MIN_ACCEPTABLE_FPS;

    const recommendations = this.generateRecommendations(
      averageFPS,
      frameDrops,
      this.frameRates.length
    );

    return {
      averageFPS: Math.round(averageFPS * 10) / 10,
      minFPS: Math.round(minFPS * 10) / 10,
      maxFPS: Math.round(maxFPS * 10) / 10,
      frameDrops,
      totalFrames: this.frameRates.length,
      isTargetMet,
      isAcceptable,
      recommendations,
    };
  }

  /**
   * Test animation performance with a specific component
   * @param testDuration Duration to test in milliseconds
   * @returns Promise that resolves with performance results
   */
  public async testAnimationPerformance(
    testDuration: number = 3000
  ): Promise<PerformanceStats> {
    return new Promise((resolve) => {
      this.startMonitoring(testDuration);

      setTimeout(() => {
        const stats = this.getPerformanceStats();
        this.stopMonitoring();
        resolve(stats);
      }, testDuration + 100); // Small buffer to ensure monitoring is complete
    });
  }

  /**
   * Generate performance recommendations
   * @param averageFPS Average frame rate
   * @param frameDrops Number of frame drops
   * @param totalFrames Total frames measured
   * @returns Array of recommendation strings
   */
  private generateRecommendations(
    averageFPS: number,
    frameDrops: number,
    totalFrames: number
  ): string[] {
    const recommendations: string[] = [];

    if (averageFPS < PerformanceMonitor.MIN_ACCEPTABLE_FPS) {
      recommendations.push(
        'Performance is below acceptable threshold'
      );
      recommendations.push('Consider reducing animation complexity');
      recommendations.push(
        'Ensure useNativeDriver is enabled for all animations'
      );
    } else if (averageFPS < PerformanceMonitor.TARGET_FPS) {
      recommendations.push(
        'Performance is acceptable but below target'
      );
      recommendations.push(
        'Consider optimizing animation timing or complexity'
      );
    } else {
      recommendations.push('Performance meets target requirements');
    }

    const frameDropPercentage = (frameDrops / totalFrames) * 100;
    if (frameDropPercentage > 10) {
      recommendations.push(
        `High frame drop rate: ${frameDropPercentage.toFixed(1)}%`
      );
      recommendations.push(
        'Check for blocking operations during animations'
      );
    }

    if (
      recommendations.length === 1 &&
      recommendations[0].includes('meets target')
    ) {
      recommendations.push('Animation performance is optimal');
    }

    return recommendations;
  }

  /**
   * Reset all performance data
   */
  public reset(): void {
    this.stopMonitoring();
    this.frameCount = 0;
    this.frameRates = [];
    this.lastFrameTime = 0;
  }
}

/**
 * Performance Statistics Interface
 */
export interface PerformanceStats {
  averageFPS: number;
  minFPS: number;
  maxFPS: number;
  frameDrops: number;
  totalFrames: number;
  isTargetMet: boolean;
  isAcceptable: boolean;
  recommendations: string[];
}

/**
 * Hook for easy performance monitoring in components
 */
export const usePerformanceMonitoring = () => {
  const monitor = PerformanceMonitor.getInstance();

  const startTest = (duration?: number) =>
    monitor.startMonitoring(duration);
  const stopTest = () => monitor.stopMonitoring();
  const getStats = () => monitor.getPerformanceStats();
  const testAnimation = (duration?: number) =>
    monitor.testAnimationPerformance(duration);

  return {
    startTest,
    stopTest,
    getStats,
    testAnimation,
  };
};
