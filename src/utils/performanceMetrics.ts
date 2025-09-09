/**
 * Performance Metrics Collection System
 * Comprehensive metrics collection for 60fps validation and performance analysis
 * Requirements: 8.6
 */

import { memoryManager } from './memoryManager'
import { PerformanceMonitor } from './performanceMonitor'

export interface PerformanceMetrics {
  frameRate: {
    current: number
    average: number
    min: number
    max: number
    target: number
    isTargetMet: boolean
  }
  memory: {
    tensors: number
    bytes: number
    usage: { tensors: number; bytes: number }
    trend: 'increasing' | 'decreasing' | 'stable'
  }
  timing: {
    modelLoadTime?: number
    predictionTime?: number
    animationTime?: number
  }
  quality: {
    level: 'high' | 'medium' | 'low'
    adjustments: number
  }
  validation: {
    meets60fps: boolean
    meetsMemoryLimits: boolean
    overallScore: number
  }
  timestamp: number
}

export interface ValidationCriteria {
  targetFPS: number
  minAcceptableFPS: number
  maxMemoryBytes: number
  maxMemoryTensors: number
  maxPredictionTime: number
  maxModelLoadTime: number
}

export interface PerformanceReport {
  summary: {
    overallScore: number
    passed: boolean
    issues: string[]
    recommendations: string[]
  }
  metrics: PerformanceMetrics
  history: PerformanceMetrics[]
  testDuration: number
}

/**
 * Performance Metrics Collector
 * Collects and analyzes comprehensive performance data
 */
export class PerformanceMetricsCollector {
  private static instance: PerformanceMetricsCollector
  private metricsHistory: PerformanceMetrics[] = []
  private isCollecting = false
  private collectionInterval: NodeJS.Timeout | null = null
  private performanceMonitor: PerformanceMonitor
  private timingData: Map<string, number> = new Map()

  // Default validation criteria
  private criteria: ValidationCriteria = {
    targetFPS: 60,
    minAcceptableFPS: 45,
    maxMemoryBytes: 150 * 1024 * 1024, // 150MB
    maxMemoryTensors: 150,
    maxPredictionTime: 1000, // 1 second
    maxModelLoadTime: 10000, // 10 seconds
  }

  private readonly COLLECTION_INTERVAL = 1000 // 1 second
  private readonly MAX_HISTORY_SIZE = 100

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance()
  }

  public static getInstance(): PerformanceMetricsCollector {
    if (!PerformanceMetricsCollector.instance) {
      PerformanceMetricsCollector.instance = new PerformanceMetricsCollector()
    }
    return PerformanceMetricsCollector.instance
  }

  /**
   * Start collecting performance metrics
   */
  public startCollection(customCriteria?: Partial<ValidationCriteria>): void {
    if (this.isCollecting) {
      console.warn('[PerformanceMetrics] Already collecting metrics')
      return
    }

    if (customCriteria) {
      this.criteria = { ...this.criteria, ...customCriteria }
    }

    this.isCollecting = true
    this.metricsHistory = []

    // Start performance monitoring
    this.performanceMonitor.startMonitoring()

    // Start metrics collection
    this.collectionInterval = setInterval(() => {
      this.collectMetrics()
    }, this.COLLECTION_INTERVAL)

    console.log('[PerformanceMetrics] Started collecting metrics')
  }

  /**
   * Stop collecting performance metrics
   */
  public stopCollection(): void {
    if (!this.isCollecting) {
      return
    }

    this.isCollecting = false

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval)
      this.collectionInterval = null
    }

    this.performanceMonitor.stopMonitoring()

    console.log('[PerformanceMetrics] Stopped collecting metrics')
  }

  /**
   * Record timing data for specific operations
   */
  public recordTiming(operation: string, duration: number): void {
    this.timingData.set(operation, duration)

    if (__DEV__) {
      console.log(`[PerformanceMetrics] ${operation}: ${duration}ms`)
    }
  }

  /**
   * Start timing an operation
   */
  public startTiming(operation: string): () => void {
    const startTime = Date.now()

    return () => {
      const duration = Date.now() - startTime
      this.recordTiming(operation, duration)
    }
  }

  /**
   * Get current performance metrics
   */
  public getCurrentMetrics(): PerformanceMetrics {
    return this.collectMetrics()
  }

  /**
   * Get metrics history
   */
  public getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory]
  }

  /**
   * Generate comprehensive performance report
   */
  public generateReport(testDuration?: number): PerformanceReport {
    const currentMetrics = this.getCurrentMetrics()
    const issues: string[] = []
    const recommendations: string[] = []

    // Analyze frame rate performance
    if (!currentMetrics.frameRate.isTargetMet) {
      issues.push(
        `Frame rate below target: ${currentMetrics.frameRate.average}fps vs ${currentMetrics.frameRate.target}fps`
      )
      recommendations.push(
        'Consider reducing animation complexity or enabling quality adjustment'
      )
    }

    // Analyze memory usage
    if (!currentMetrics.validation.meetsMemoryLimits) {
      issues.push(
        `Memory usage exceeds limits: ${(
          currentMetrics.memory.bytes / 1024 / 1024
        ).toFixed(1)}MB`
      )
      recommendations.push('Implement tensor disposal and memory cleanup')
    }

    // Analyze timing performance
    const modelLoadTime = this.timingData.get('modelLoad')
    if (modelLoadTime && modelLoadTime > this.criteria.maxModelLoadTime) {
      issues.push(`Model load time too slow: ${modelLoadTime}ms`)
      recommendations.push('Consider model optimization or caching')
    }

    const predictionTime = this.timingData.get('prediction')
    if (predictionTime && predictionTime > this.criteria.maxPredictionTime) {
      issues.push(`Prediction time too slow: ${predictionTime}ms`)
      recommendations.push('Optimize image preprocessing or model size')
    }

    // Calculate overall score
    const overallScore = this.calculateOverallScore(currentMetrics)
    const passed = overallScore >= 80 && issues.length === 0

    if (passed) {
      recommendations.push('Performance meets all requirements')
    }

    return {
      summary: {
        overallScore,
        passed,
        issues,
        recommendations,
      },
      metrics: currentMetrics,
      history: this.getMetricsHistory(),
      testDuration: testDuration || 0,
    }
  }

  /**
   * Validate 60fps performance specifically
   */
  public async validate60FPS(duration: number = 5000): Promise<{
    passed: boolean
    averageFPS: number
    minFPS: number
    frameDrops: number
    report: string
  }> {
    console.log('[PerformanceMetrics] Starting 60fps validation...')

    // Start collection for the test duration
    this.startCollection()

    return new Promise((resolve) => {
      setTimeout(() => {
        const stats = this.performanceMonitor.getPerformanceStats()
        this.stopCollection()

        const passed =
          stats.averageFPS >= this.criteria.targetFPS &&
          stats.minFPS >= this.criteria.minAcceptableFPS

        const report = passed
          ? `✅ 60fps validation PASSED - Average: ${stats.averageFPS}fps, Min: ${stats.minFPS}fps`
          : `❌ 60fps validation FAILED - Average: ${stats.averageFPS}fps, Min: ${stats.minFPS}fps`

        resolve({
          passed,
          averageFPS: stats.averageFPS,
          minFPS: stats.minFPS,
          frameDrops: stats.frameDrops,
          report,
        })
      }, duration)
    })
  }

  /**
   * Clear all collected data
   */
  public clearData(): void {
    this.metricsHistory = []
    this.timingData.clear()
    console.log('[PerformanceMetrics] Cleared all data')
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): PerformanceMetrics {
    const performanceStats = this.performanceMonitor.getPerformanceStats()
    const memoryStats = memoryManager.getDetailedMemoryStats()
    const memoryUsage = memoryManager.getMemoryUsagePercentage()

    const metrics: PerformanceMetrics = {
      frameRate: {
        current: performanceStats.averageFPS,
        average: performanceStats.averageFPS,
        min: performanceStats.minFPS,
        max: performanceStats.maxFPS,
        target: this.criteria.targetFPS,
        isTargetMet: performanceStats.isTargetMet,
      },
      memory: {
        tensors: memoryStats.current.numTensors,
        bytes: memoryStats.current.numBytes,
        usage: memoryUsage,
        trend: memoryStats.trend,
      },
      timing: {
        modelLoadTime: this.timingData.get('modelLoad'),
        predictionTime: this.timingData.get('prediction'),
        animationTime: this.timingData.get('animation'),
      },
      quality: {
        level: performanceStats.currentQualityLevel,
        adjustments: performanceStats.qualityAdjustments,
      },
      validation: {
        meets60fps: performanceStats.isTargetMet,
        meetsMemoryLimits: memoryManager.isMemoryUsageSafe(),
        overallScore: this.calculateOverallScore({} as PerformanceMetrics), // Will be calculated
      },
      timestamp: Date.now(),
    }

    // Calculate overall score
    metrics.validation.overallScore = this.calculateOverallScore(metrics)

    // Add to history
    this.metricsHistory.push(metrics)

    // Keep history size manageable
    if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
      this.metricsHistory = this.metricsHistory.slice(-this.MAX_HISTORY_SIZE)
    }

    return metrics
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculateOverallScore(metrics: PerformanceMetrics): number {
    let score = 100

    // Frame rate score (40% weight)
    const fpsScore = Math.min(
      100,
      (metrics.frameRate.average / this.criteria.targetFPS) * 100
    )
    score = score * 0.4 + fpsScore * 0.4

    // Memory score (30% weight)
    const memoryScore = Math.max(0, 100 - metrics.memory.usage.bytes)
    score = score * 0.7 + memoryScore * 0.3

    // Timing score (30% weight)
    let timingScore = 100
    if (
      metrics.timing.predictionTime &&
      metrics.timing.predictionTime > this.criteria.maxPredictionTime
    ) {
      timingScore -= 30
    }
    if (
      metrics.timing.modelLoadTime &&
      metrics.timing.modelLoadTime > this.criteria.maxModelLoadTime
    ) {
      timingScore -= 20
    }
    score = score * 0.7 + timingScore * 0.3

    return Math.max(0, Math.min(100, Math.round(score)))
  }
}

// Export singleton instance
export const performanceMetrics = PerformanceMetricsCollector.getInstance()

/**
 * Hook for easy performance metrics collection in components
 */
export const usePerformanceMetrics = () => {
  const collector = PerformanceMetricsCollector.getInstance()

  const startCollection = (criteria?: Partial<ValidationCriteria>) =>
    collector.startCollection(criteria)
  const stopCollection = () => collector.stopCollection()
  const getCurrentMetrics = () => collector.getCurrentMetrics()
  const generateReport = (duration?: number) =>
    collector.generateReport(duration)
  const validate60FPS = (duration?: number) => collector.validate60FPS(duration)
  const recordTiming = (operation: string, duration: number) =>
    collector.recordTiming(operation, duration)
  const startTiming = (operation: string) => collector.startTiming(operation)

  return {
    startCollection,
    stopCollection,
    getCurrentMetrics,
    generateReport,
    validate60FPS,
    recordTiming,
    startTiming,
  }
}
