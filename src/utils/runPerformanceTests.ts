/**
 * Performance Test Runner
 * Simple utility to run performance tests during development
 */

import { runPerformanceTests } from './performanceTestSuite'

/**
 * Run performance tests with console output
 */
export const testPerformance = {
  /**
   * Run full performance test suite
   */
  full: () => runPerformanceTests(false),

  /**
   * Run quick performance check
   */
  quick: () => runPerformanceTests(true),

  /**
   * Run tests and log results to console
   */
  withLogging: async (quick = false) => {
    console.log('🎯 Performance Testing Started...')
    console.log('=====================================')

    const startTime = Date.now()

    try {
      await runPerformanceTests(quick)

      const duration = Date.now() - startTime
      console.log(`\n⏱️  Total test duration: ${duration}ms`)
      console.log('=====================================')
      console.log('✅ Performance testing completed successfully!')
    } catch (error) {
      console.error('❌ Performance testing failed:', error)
      console.log('=====================================')
    }
  },
}

// Export for easy import in development
export default testPerformance
