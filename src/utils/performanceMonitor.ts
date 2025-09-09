/**
 * Performance Monitor
 * Utilities for monitoring animation performance and frame rates
 */

import { InteractionManager } from 'react-native'

/**
 * Performance Monitor Class
 * Tracks frame rates, animation performance, and provides optimization suggestions
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private lastFrameTime = 0
  private frameRates: number[] = []
  private isMonitoring = false
  private monitoringInterval: NodeJS.Timeout | null = null
  private frameCount = 0
  private qualityAdjustmentCallbacks: QualityAdjustmentCallback[] = []
  private currentQualityLevel: QualityLevel = 'high'
  private consecutivePoorFrames = 0
  private consecutiveGoodFrames = 0

  // Performance thresholds
  private static readonly TARGET_FPS = 60
  private static readonly MIN_ACCEPTABLE_FPS = 45
  private static readonly QUALITY_ADJUSTMENT_THRESHOLD = 10 // frames
  private static readonly QUALITY_RECOVERY_THRESHOLD = 30 // frames

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Start monitoring performance
   * @param sampleDuration Duration to monitor in milliseconds (default: 5000ms)
   */
  public startMonitoring(sampleDuration: number = 5000): void {
    if (this.isMonitoring) {
      console.warn('[PerformanceMonitor] Already monitoring')
      return
    }

    this.isMonitoring = true
    this.frameCount = 0
    this.frameRates = []
    this.lastFrameTime = Date.now()

    if (__DEV__) {
      console.log(
        `[PerformanceMonitor] Starting performance monitoring for ${sampleDuration}ms`
      )
    }

    // Monitor frame rate using requestAnimationFrame equivalent
    const monitorFrame = () => {
      if (!this.isMonitoring) return

      const currentTime = Date.now()
      const frameTime = currentTime - this.lastFrameTime

      if (this.lastFrameTime > 0) {
        const fps = 1000 / frameTime
        this.frameRates.push(fps)
        this.frameCount++

        // Check for automatic quality adjustment
        this.checkQualityAdjustment(fps)

        // Log frame drops in development
        if (__DEV__ && fps < PerformanceMonitor.MIN_ACCEPTABLE_FPS) {
          console.warn(
            `[PerformanceMonitor] Frame drop detected: ${fps.toFixed(1)} FPS`
          )
        }
      }

      this.lastFrameTime = currentTime

      // Schedule next frame
      InteractionManager.runAfterInteractions(() => {
        requestAnimationFrame(monitorFrame)
      })
    }

    // Start monitoring
    requestAnimationFrame(monitorFrame)

    // Stop monitoring after specified duration
    this.monitoringInterval = setTimeout(() => {
      this.stopMonitoring()
    }, sampleDuration)
  }

  /**
   * Stop monitoring performance
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearTimeout(this.monitoringInterval)
      this.monitoringInterval = null
    }

    if (__DEV__) {
      const stats = this.getPerformanceStats()
      console.log('[PerformanceMonitor] Monitoring stopped:', stats)
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
        recommendations: ['No data available - start monitoring first'],
        currentQualityLevel: this.currentQualityLevel,
        qualityAdjustments: this.qualityAdjustmentCallbacks.length,
      }
    }

    const averageFPS =
      this.frameRates.reduce((sum, fps) => sum + fps, 0) /
      this.frameRates.length
    const minFPS = Math.min(...this.frameRates)
    const maxFPS = Math.max(...this.frameRates)
    const frameDrops = this.frameRates.filter(
      (fps) => fps < PerformanceMonitor.MIN_ACCEPTABLE_FPS
    ).length

    const isTargetMet = averageFPS >= PerformanceMonitor.TARGET_FPS
    const isAcceptable = averageFPS >= PerformanceMonitor.MIN_ACCEPTABLE_FPS

    const recommendations = this.generateRecommendations(
      averageFPS,
      frameDrops,
      this.frameRates.length
    )

    return {
      averageFPS: Math.round(averageFPS * 10) / 10,
      minFPS: Math.round(minFPS * 10) / 10,
      maxFPS: Math.round(maxFPS * 10) / 10,
      frameDrops,
      totalFrames: this.frameRates.length,
      isTargetMet,
      isAcceptable,
      recommendations,
      currentQualityLevel: this.currentQualityLevel,
      qualityAdjustments: this.qualityAdjustmentCallbacks.length,
    }
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
      this.startMonitoring(testDuration)

      setTimeout(() => {
        const stats = this.getPerformanceStats()
        this.stopMonitoring()
        resolve(stats)
      }, testDuration + 100) // Small buffer to ensure monitoring is complete
    })
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
    const recommendations: string[] = []

    if (averageFPS < PerformanceMonitor.MIN_ACCEPTABLE_FPS) {
      recommendations.push('Performance is below acceptable threshold')
      recommendations.push('Consider reducing animation complexity')
      recommendations.push(
        'Ensure useNativeDriver is enabled for all animations'
      )
    } else if (averageFPS < PerformanceMonitor.TARGET_FPS) {
      recommendations.push('Performance is acceptable but below target')
      recommendations.push('Consider optimizing animation timing or complexity')
    } else {
      recommendations.push('Performance meets target requirements')
    }

    const frameDropPercentage = (frameDrops / totalFrames) * 100
    if (frameDropPercentage > 10) {
      recommendations.push(
        `High frame drop rate: ${frameDropPercentage.toFixed(1)}%`
      )
      recommendations.push('Check for blocking operations during animations')
    }

    if (
      recommendations.length === 1 &&
      recommendations[0].includes('meets target')
    ) {
      recommendations.push('Animation performance is optimal')
    }

    return recommendations
  }

  /**
   * Register callback for quality adjustment notifications
   * @param callback Function to call when quality should be adjusted
   */
  public registerQualityAdjustmentCallback(
    callback: QualityAdjustmentCallback
  ): void {
    this.qualityAdjustmentCallbacks.push(callback)
  }

  /**
   * Unregister quality adjustment callback
   * @param callback Function to remove from callbacks
   */
  public unregisterQualityAdjustmentCallback(
    callback: QualityAdjustmentCallback
  ): void {
    const index = this.qualityAdjustmentCallbacks.indexOf(callback)
    if (index > -1) {
      this.qualityAdjustmentCallbacks.splice(index, 1)
    }
  }

  /**
   * Get current quality level
   */
  public getCurrentQualityLevel(): QualityLevel {
    return this.currentQualityLevel
  }

  /**
   * Manually set quality level
   * @param level Quality level to set
   */
  public setQualityLevel(level: QualityLevel): void {
    if (this.currentQualityLevel !== level) {
      this.currentQualityLevel = level
      this.notifyQualityAdjustment(level)

      if (__DEV__) {
        console.log(
          `[PerformanceMonitor] Quality level manually set to: ${level}`
        )
      }
    }
  }

  /**
   * Check if quality adjustment is needed based on current FPS
   * @param currentFPS Current frame rate
   */
  private checkQualityAdjustment(currentFPS: number): void {
    if (currentFPS < PerformanceMonitor.MIN_ACCEPTABLE_FPS) {
      this.consecutivePoorFrames++
      this.consecutiveGoodFrames = 0

      // Reduce quality if we have consecutive poor frames
      if (
        this.consecutivePoorFrames >=
        PerformanceMonitor.QUALITY_ADJUSTMENT_THRESHOLD
      ) {
        this.reduceQuality()
        this.consecutivePoorFrames = 0
      }
    } else if (currentFPS >= PerformanceMonitor.TARGET_FPS) {
      this.consecutiveGoodFrames++
      this.consecutivePoorFrames = 0

      // Increase quality if we have consecutive good frames
      if (
        this.consecutiveGoodFrames >=
        PerformanceMonitor.QUALITY_RECOVERY_THRESHOLD
      ) {
        this.increaseQuality()
        this.consecutiveGoodFrames = 0
      }
    } else {
      // Reset counters for frames in acceptable range
      this.consecutivePoorFrames = 0
      this.consecutiveGoodFrames = 0
    }
  }

  /**
   * Reduce quality level if possible
   */
  private reduceQuality(): void {
    let newLevel: QualityLevel

    switch (this.currentQualityLevel) {
      case 'high':
        newLevel = 'medium'
        break
      case 'medium':
        newLevel = 'low'
        break
      case 'low':
        return // Already at lowest quality
    }

    this.currentQualityLevel = newLevel
    this.notifyQualityAdjustment(newLevel)

    if (__DEV__) {
      console.log(`[PerformanceMonitor] Quality reduced to: ${newLevel}`)
    }
  }

  /**
   * Increase quality level if possible
   */
  private increaseQuality(): void {
    let newLevel: QualityLevel

    switch (this.currentQualityLevel) {
      case 'low':
        newLevel = 'medium'
        break
      case 'medium':
        newLevel = 'high'
        break
      case 'high':
        return // Already at highest quality
    }

    this.currentQualityLevel = newLevel
    this.notifyQualityAdjustment(newLevel)

    if (__DEV__) {
      console.log(`[PerformanceMonitor] Quality increased to: ${newLevel}`)
    }
  }

  /**
   * Notify all registered callbacks of quality adjustment
   * @param level New quality level
   */
  private notifyQualityAdjustment(level: QualityLevel): void {
    this.qualityAdjustmentCallbacks.forEach((callback) => {
      try {
        callback(level)
      } catch (error) {
        console.error(
          '[PerformanceMonitor] Error in quality adjustment callback:',
          error
        )
      }
    })
  }

  /**
   * Reset all performance data
   */
  public reset(): void {
    this.stopMonitoring()
    this.frameCount = 0
    this.frameRates = []
    this.lastFrameTime = 0
    this.consecutivePoorFrames = 0
    this.consecutiveGoodFrames = 0
    this.currentQualityLevel = 'high'
  }
}

/**
 * Performance Statistics Interface
 */
export interface PerformanceStats {
  averageFPS: number
  minFPS: number
  maxFPS: number
  frameDrops: number
  totalFrames: number
  isTargetMet: boolean
  isAcceptable: boolean
  recommendations: string[]
  currentQualityLevel: QualityLevel
  qualityAdjustments: number
}

/**
 * Quality Level Type
 */
export type QualityLevel = 'high' | 'medium' | 'low'

/**
 * Quality Adjustment Callback
 */
export type QualityAdjustmentCallback = (level: QualityLevel) => void

/**
 * Hook for easy performance monitoring in components
 */
export const usePerformanceMonitoring = () => {
  const monitor = PerformanceMonitor.getInstance()

  const startTest = (duration?: number) => monitor.startMonitoring(duration)
  const stopTest = () => monitor.stopMonitoring()
  const getStats = () => monitor.getPerformanceStats()
  const testAnimation = (duration?: number) =>
    monitor.testAnimationPerformance(duration)
  const registerQualityCallback = (callback: QualityAdjustmentCallback) =>
    monitor.registerQualityAdjustmentCallback(callback)
  const unregisterQualityCallback = (callback: QualityAdjustmentCallback) =>
    monitor.unregisterQualityAdjustmentCallback(callback)
  const getCurrentQuality = () => monitor.getCurrentQualityLevel()
  const setQuality = (level: QualityLevel) => monitor.setQualityLevel(level)

  return {
    startTest,
    stopTest,
    getStats,
    testAnimation,
    registerQualityCallback,
    unregisterQualityCallback,
    getCurrentQuality,
    setQuality,
  }
}
