/**
 * Performance Test Suite Tests
 * Unit tests for the performance testing system
 */

import { beforeEach, describe, it } from '@jest/globals'
import { PerformanceTestSuite } from '../performanceTestSuite'

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    Version: '14.0',
  },
  Dimensions: {
    get: () => ({ width: 375, height: 812, scale: 3 }),
  },
  InteractionManager: {
    runAfterInteractions: (callback: () => void) => callback(),
  },
}))

// Mock performance dependencies
jest.mock('../performanceMonitor', () => ({
  PerformanceMonitor: {
    getInstance: () => ({
      startMonitoring: jest.fn(),
      stopMonitoring: jest.fn(),
      getPerformanceStats: () => ({
        averageFPS: 60,
        minFPS: 55,
        maxFPS: 60,
        frameDrops: 0,
        totalFrames: 300,
        isTargetMet: true,
        isAcceptable: true,
        recommendations: ['Performance meets target requirements'],
        currentQualityLevel: 'high',
        qualityAdjustments: 0,
      }),
    }),
  },
}))

jest.mock('../memoryManager', () => ({
  memoryManager: {
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    getCurrentMemoryUsage: () => ({
      numTensors: 10,
      numDataBuffers: 5,
      numBytes: 50 * 1024 * 1024, // 50MB
    }),
    takeSnapshot: jest.fn(() => ({
      numTensors: 10,
      numDataBuffers: 5,
      numBytes: 50 * 1024 * 1024,
      timestamp: Date.now(),
    })),
    forceGarbageCollection: jest.fn(),
  },
}))

jest.mock('../assetManager', () => ({
  AssetManager: {
    getInstance: () => ({
      clearCache: jest.fn(),
      getImageDataset: () => ({
        apples: [
          { id: '1', uri: 'apple1.jpg', label: 'apple' },
          { id: '2', uri: 'apple2.jpg', label: 'apple' },
        ],
        notApples: [
          { id: '3', uri: 'orange1.jpg', label: 'not_apple' },
          { id: '4', uri: 'banana1.jpg', label: 'not_apple' },
        ],
      }),
      loadImage: jest.fn().mockResolvedValue({
        uri: 'test.jpg',
        width: 224,
        height: 224,
        loadTime: 100,
        lastAccessed: Date.now(),
      }),
    }),
  },
}))

jest.mock('../performanceMetrics', () => ({
  performanceMetrics: {
    startCollection: jest.fn(),
    stopCollection: jest.fn(),
    recordTiming: jest.fn(),
  },
}))

describe('PerformanceTestSuite', () => {
  let testSuite: PerformanceTestSuite

  beforeEach(() => {
    testSuite = PerformanceTestSuite.getInstance()
    jest.clearAllMocks()
  })

  describe('Device Info', () => {
    it('should collect device information correctly', async () => {
      const report = await testSuite.runQuickCheck()

      expect(report.deviceInfo).toEqual({
        platform: 'ios',
        version: '14.0',
        screenWidth: 375,
        screenHeight: 812,
        pixelRatio: 3,
        isTablet: false,
      })
    })
  })

  describe('Quick Check', () => {
    it('should run quick performance check successfully', async () => {
      const report = await testSuite.runQuickCheck()

      expect(report).toBeDefined()
      expect(report.overallScore).toBeGreaterThan(0)
      expect(report.testResults).toHaveLength(2) // Frame rate and memory tests
      expect(report.summary.totalTests).toBe(2)
    })

    it('should pass with good performance metrics', async () => {
      const report = await testSuite.runQuickCheck()

      expect(report.overallPassed).toBe(true)
      expect(report.overallScore).toBeGreaterThanOrEqual(80)
      expect(report.summary.passedTests).toBe(2)
      expect(report.summary.failedTests).toBe(0)
    })
  })

  describe('Test Scenarios', () => {
    it('should handle test execution errors gracefully', async () => {
      // Mock a failing test by making loadImage throw
      const assetManager = require('../assetManager').AssetManager.getInstance()
      assetManager.loadImage.mockRejectedValueOnce(new Error('Network error'))

      const report = await testSuite.runQuickCheck()

      // Should still complete and provide a report
      expect(report).toBeDefined()
      expect(report.testResults.length).toBeGreaterThan(0)
    })
  })

  describe('Performance Validation', () => {
    it('should validate frame rate requirements', async () => {
      const report = await testSuite.runQuickCheck()

      const frameRateTest = report.testResults.find(
        (r) => r.scenario === 'Frame Rate Performance'
      )

      expect(frameRateTest).toBeDefined()
      expect(frameRateTest?.passed).toBe(true)
    })

    it('should validate memory usage requirements', async () => {
      const report = await testSuite.runQuickCheck()

      const memoryTest = report.testResults.find(
        (r) => r.scenario === 'Memory Management'
      )

      expect(memoryTest).toBeDefined()
      expect(memoryTest?.passed).toBe(true)
    })
  })

  describe('Report Generation', () => {
    it('should generate comprehensive test report', async () => {
      const report = await testSuite.runQuickCheck()

      expect(report.deviceInfo).toBeDefined()
      expect(report.timestamp).toBeGreaterThan(0)
      expect(report.overallScore).toBeGreaterThanOrEqual(0)
      expect(report.overallScore).toBeLessThanOrEqual(100)
      expect(report.testResults).toBeInstanceOf(Array)
      expect(report.summary).toBeDefined()
      expect(report.summary.totalTests).toBeGreaterThan(0)
    })

    it('should provide actionable recommendations', async () => {
      const report = await testSuite.runQuickCheck()

      expect(report.summary.recommendations).toBeInstanceOf(Array)
      // Should have at least some recommendations
      expect(report.summary.recommendations.length).toBeGreaterThan(0)
    })
  })
})

describe('Performance Test Integration', () => {
  it('should be able to run performance tests in development', () => {
    // Test that the test runner can be imported and used
    const { runPerformanceTests } = require('../performanceTestSuite')
    expect(typeof runPerformanceTests).toBe('function')

    const testPerformance = require('../runPerformanceTests').default
    expect(typeof testPerformance.quick).toBe('function')
    expect(typeof testPerformance.full).toBe('function')
    expect(typeof testPerformance.withLogging).toBe('function')
  })
})
