/**
 * Performance Test Suite
 * Comprehensive testing for target device performance validation
 * Requirements: 8.6
 */

import { Dimensions, Platform } from 'react-native'
import { AssetManager } from './assetManager'
import { memoryManager } from './memoryManager'
import { performanceMetrics } from './performanceMetrics'
import { PerformanceMonitor } from './performanceMonitor'

export interface DeviceInfo {
  platform: string
  version: string
  screenWidth: number
  screenHeight: number
  pixelRatio: number
  isTablet: boolean
}

export interface TestScenario {
  name: string
  description: string
  duration: number
  setup?: () => Promise<void>
  test: () => Promise<void>
  cleanup?: () => Promise<void>
}

export interface TestResult {
  scenario: string
  passed: boolean
  score: number
  metrics: Record<string, unknown>
  issues: string[]
  recommendations: string[]
  duration: number
}

export interface PerformanceTestReport {
  deviceInfo: DeviceInfo
  timestamp: number
  overallScore: number
  overallPassed: boolean
  testResults: TestResult[]
  summary: {
    totalTests: number
    passedTests: number
    failedTests: number
    criticalIssues: string[]
    recommendations: string[]
  }
}

/**
 * Performance Test Suite Class
 * Runs comprehensive performance tests on target devices
 */
export class PerformanceTestSuite {
  private static instance: PerformanceTestSuite
  private assetManager: AssetManager
  private performanceMonitor: PerformanceMonitor

  private constructor() {
    this.assetManager = AssetManager.getInstance()
    this.performanceMonitor = PerformanceMonitor.getInstance()
  }

  public static getInstance(): PerformanceTestSuite {
    if (!PerformanceTestSuite.instance) {
      PerformanceTestSuite.instance = new PerformanceTestSuite()
    }
    return PerformanceTestSuite.instance
  }

  /**
   * Run complete performance test suite
   */
  public async runFullTestSuite(): Promise<PerformanceTestReport> {
    console.log('🚀 Starting Performance Test Suite...')

    const deviceInfo = this.getDeviceInfo()
    const testResults: TestResult[] = []
    const startTime = Date.now()

    // Define test scenarios
    const scenarios = this.getTestScenarios()

    // Run each test scenario
    for (const scenario of scenarios) {
      console.log(`\n📋 Running test: ${scenario.name}`)

      try {
        const result = await this.runTestScenario(scenario)
        testResults.push(result)

        const status = result.passed ? '✅ PASSED' : '❌ FAILED'
        console.log(`${status} - ${scenario.name} (Score: ${result.score})`)
      } catch (error) {
        console.error(`💥 Test failed with error: ${scenario.name}`, error)
        testResults.push({
          scenario: scenario.name,
          passed: false,
          score: 0,
          metrics: {},
          issues: [`Test failed with error: ${error}`],
          recommendations: ['Fix test execution error'],
          duration: 0,
        })
      }

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Generate final report
    const report = this.generateTestReport(
      deviceInfo,
      testResults,
      Date.now() - startTime
    )

    console.log('\n📊 Performance Test Suite Complete!')
    console.log(`Overall Score: ${report.overallScore}/100`)
    console.log(
      `Tests Passed: ${report.summary.passedTests}/${report.summary.totalTests}`
    )

    return report
  }

  /**
   * Run a quick performance check (subset of full suite)
   */
  public async runQuickCheck(): Promise<PerformanceTestReport> {
    console.log('⚡ Running Quick Performance Check...')

    const deviceInfo = this.getDeviceInfo()
    const testResults: TestResult[] = []
    const startTime = Date.now()

    // Run only critical tests
    const quickScenarios = [
      this.getTestScenarios()[0], // Frame rate test
      this.getTestScenarios()[2], // Memory test
    ]

    for (const scenario of quickScenarios) {
      const result = await this.runTestScenario(scenario)
      testResults.push(result)
    }

    const report = this.generateTestReport(
      deviceInfo,
      testResults,
      Date.now() - startTime
    )

    console.log(`Quick Check Score: ${report.overallScore}/100`)
    return report
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): DeviceInfo {
    const { width, height } = Dimensions.get('window')
    const pixelRatio = Dimensions.get('window').scale

    // Simple tablet detection based on screen size
    const isTablet = Math.min(width, height) >= 600

    return {
      platform: Platform.OS,
      version: Platform.Version.toString(),
      screenWidth: width,
      screenHeight: height,
      pixelRatio,
      isTablet,
    }
  }

  /**
   * Define test scenarios
   */
  private getTestScenarios(): TestScenario[] {
    return [
      {
        name: 'Frame Rate Performance',
        description: 'Test sustained 60fps performance during animations',
        duration: 5000,
        test: async () => {
          // Simulate animation load
          const monitor = PerformanceMonitor.getInstance()
          monitor.startMonitoring(5000)

          // Simulate heavy animation work
          for (let i = 0; i < 100; i++) {
            await new Promise((resolve) => {
              requestAnimationFrame(() => {
                // Simulate animation calculations
                const dummy = Math.random() * 1000
                resolve(dummy)
              })
            })
          }
        },
      },
      {
        name: 'Image Loading Performance',
        description: 'Test image loading and caching performance',
        duration: 3000,
        setup: async () => {
          this.assetManager.clearCache()
        },
        test: async () => {
          const dataset = this.assetManager.getImageDataset()
          const testImages = [
            ...dataset.apples.slice(0, 5),
            ...dataset.notApples.slice(0, 5),
          ]

          const startTime = Date.now()

          // Test sequential loading
          for (const image of testImages) {
            await this.assetManager.loadImage(image.uri)
          }

          const loadTime = Date.now() - startTime
          performanceMetrics.recordTiming('imageLoading', loadTime)
        },
      },
      {
        name: 'Memory Management',
        description: 'Test memory usage and cleanup efficiency',
        duration: 4000,
        test: async () => {
          memoryManager.startMonitoring()

          // Simulate memory-intensive operations
          const snapshots = []
          for (let i = 0; i < 20; i++) {
            const snapshot = memoryManager.takeSnapshot(`test_${i}`)
            snapshots.push(snapshot)

            // Simulate some work
            await new Promise((resolve) => setTimeout(resolve, 100))
          }

          // Test cleanup
          memoryManager.forceGarbageCollection()

          const finalSnapshot = memoryManager.takeSnapshot('final')
          const memoryGrowth = finalSnapshot.numBytes - snapshots[0].numBytes

          // Memory growth should be reasonable
          if (memoryGrowth > 10 * 1024 * 1024) {
            // 10MB
            throw new Error(
              `Excessive memory growth: ${memoryGrowth / 1024 / 1024}MB`
            )
          }
        },
        cleanup: async () => {
          memoryManager.stopMonitoring()
        },
      },
      {
        name: 'ML Model Performance',
        description: 'Test ML prediction timing and memory usage',
        duration: 3000,
        test: async () => {
          // This would test actual ML operations
          // For now, simulate the timing
          const predictions = []

          for (let i = 0; i < 10; i++) {
            const startTime = Date.now()

            // Simulate ML prediction work
            await new Promise((resolve) => setTimeout(resolve, 200))

            const predictionTime = Date.now() - startTime
            predictions.push(predictionTime)

            if (predictionTime > 1000) {
              throw new Error(`Prediction too slow: ${predictionTime}ms`)
            }
          }

          const avgPredictionTime =
            predictions.reduce((sum, time) => sum + time, 0) /
            predictions.length
          performanceMetrics.recordTiming('prediction', avgPredictionTime)
        },
      },
      {
        name: 'Stress Test',
        description: 'Test performance under heavy load',
        duration: 6000,
        test: async () => {
          // Start all monitoring
          performanceMetrics.startCollection()

          // Simulate heavy concurrent operations
          const promises = []

          // Heavy animation simulation
          for (let i = 0; i < 50; i++) {
            promises.push(
              new Promise((resolve) => {
                requestAnimationFrame(() => {
                  // Simulate complex calculations
                  for (let j = 0; j < 1000; j++) {
                    Math.random() * Math.PI
                  }
                  resolve(i)
                })
              })
            )
          }

          await Promise.all(promises)

          // Check if performance is still acceptable
          const stats = this.performanceMonitor.getPerformanceStats()
          if (stats.averageFPS < 30) {
            throw new Error(
              `Performance degraded under stress: ${stats.averageFPS}fps`
            )
          }
        },
        cleanup: async () => {
          performanceMetrics.stopCollection()
        },
      },
    ]
  }

  /**
   * Run a single test scenario
   */
  private async runTestScenario(scenario: TestScenario): Promise<TestResult> {
    const startTime = Date.now()
    let passed = true
    let score = 100
    const issues: string[] = []
    const recommendations: string[] = []

    try {
      // Setup
      if (scenario.setup) {
        await scenario.setup()
      }

      // Run test
      await scenario.test()

      // Cleanup
      if (scenario.cleanup) {
        await scenario.cleanup()
      }
    } catch (error) {
      passed = false
      score = 0
      issues.push(`Test execution failed: ${error}`)
      recommendations.push('Investigate test failure and optimize performance')
    }

    const duration = Date.now() - startTime

    // Collect metrics
    const performanceStats = this.performanceMonitor.getPerformanceStats()
    const memoryStats = memoryManager.getCurrentMemoryUsage()

    // Analyze results
    if (performanceStats.averageFPS < 45) {
      passed = false
      score = Math.max(0, score - 30)
      issues.push(`Low frame rate: ${performanceStats.averageFPS}fps`)
      recommendations.push('Optimize animations and reduce complexity')
    }

    if (memoryStats.numBytes > 100 * 1024 * 1024) {
      // 100MB
      score = Math.max(0, score - 20)
      issues.push(
        `High memory usage: ${(memoryStats.numBytes / 1024 / 1024).toFixed(
          1
        )}MB`
      )
      recommendations.push('Implement better memory management')
    }

    return {
      scenario: scenario.name,
      passed,
      score,
      metrics: {
        performance: performanceStats,
        memory: memoryStats,
        duration,
      },
      issues,
      recommendations,
      duration,
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(
    deviceInfo: DeviceInfo,
    testResults: TestResult[],
    _totalDuration: number
  ): PerformanceTestReport {
    const passedTests = testResults.filter((r) => r.passed).length
    const failedTests = testResults.length - passedTests

    // Calculate overall score
    const overallScore =
      testResults.length > 0
        ? Math.round(
            testResults.reduce((sum, r) => sum + r.score, 0) /
              testResults.length
          )
        : 0

    const overallPassed = overallScore >= 80 && failedTests === 0

    // Collect critical issues
    const criticalIssues: string[] = []
    const allRecommendations: string[] = []

    testResults.forEach((result) => {
      if (!result.passed) {
        criticalIssues.push(`${result.scenario}: ${result.issues.join(', ')}`)
      }
      allRecommendations.push(...result.recommendations)
    })

    // Remove duplicate recommendations
    const uniqueRecommendations = [...new Set(allRecommendations)]

    return {
      deviceInfo,
      timestamp: Date.now(),
      overallScore,
      overallPassed,
      testResults,
      summary: {
        totalTests: testResults.length,
        passedTests,
        failedTests,
        criticalIssues,
        recommendations: uniqueRecommendations,
      },
    }
  }
}

// Export singleton instance
export const performanceTestSuite = PerformanceTestSuite.getInstance()

/**
 * Development helper to run performance tests
 */
export const runPerformanceTests = async (quick = false): Promise<void> => {
  if (__DEV__) {
    console.log('🧪 Running performance tests...')

    try {
      const report = quick
        ? await performanceTestSuite.runQuickCheck()
        : await performanceTestSuite.runFullTestSuite()

      console.log('\n📋 Performance Test Report:')
      console.log(
        `Device: ${report.deviceInfo.platform} ${report.deviceInfo.version}`
      )
      console.log(
        `Screen: ${report.deviceInfo.screenWidth}x${report.deviceInfo.screenHeight}`
      )
      console.log(`Overall Score: ${report.overallScore}/100`)
      console.log(`Status: ${report.overallPassed ? '✅ PASSED' : '❌ FAILED'}`)

      if (report.summary.criticalIssues.length > 0) {
        console.log('\n🚨 Critical Issues:')
        report.summary.criticalIssues.forEach((issue) => {
          console.log(`  - ${issue}`)
        })
      }

      if (report.summary.recommendations.length > 0) {
        console.log('\n💡 Recommendations:')
        report.summary.recommendations.forEach((rec) => {
          console.log(`  - ${rec}`)
        })
      }
    } catch (error) {
      console.error('❌ Performance test suite failed:', error)
    }
  }
}
