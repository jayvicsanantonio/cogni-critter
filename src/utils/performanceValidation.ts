/**
 * Performance Validation Utility
 * Simple validation to ensure AnimatedCritter meets 60fps requirements
 */

import { InteractionManager } from 'react-native';

/**
 * Performance Validation Results
 */
export interface ValidationResult {
  passed: boolean;
  averageFPS: number;
  minFPS: number;
  frameDrops: number;
  totalFrames: number;
  message: string;
}

/**
 * Simple Performance Validator
 * Lightweight validation for animation performance
 */
export class PerformanceValidator {
  private static readonly TARGET_FPS = 60;
  private static readonly MIN_ACCEPTABLE_FPS = 45;
  private static readonly TEST_DURATION = 2000; // 2 seconds

  /**
   * Validate animation performance
   * @param testDuration Duration to test in milliseconds
   * @returns Promise with validation results
   */
  static async validateAnimationPerformance(
    testDuration: number = PerformanceValidator.TEST_DURATION
  ): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const frameRates: number[] = [];
      let lastFrameTime = Date.now();
      let isRunning = true;

      const measureFrame = () => {
        if (!isRunning) return;

        const currentTime = Date.now();
        const frameTime = currentTime - lastFrameTime;

        if (lastFrameTime > 0 && frameTime > 0) {
          const fps = 1000 / frameTime;
          frameRates.push(fps);
        }

        lastFrameTime = currentTime;

        // Schedule next frame measurement
        InteractionManager.runAfterInteractions(() => {
          requestAnimationFrame(measureFrame);
        });
      };

      // Start measuring
      requestAnimationFrame(measureFrame);

      // Stop after test duration
      setTimeout(() => {
        isRunning = false;

        // Calculate results
        const result =
          PerformanceValidator.calculateResults(frameRates);
        resolve(result);
      }, testDuration);
    });
  }

  /**
   * Calculate validation results from frame rate data
   * @param frameRates Array of measured frame rates
   * @returns Validation result
   */
  private static calculateResults(
    frameRates: number[]
  ): ValidationResult {
    if (frameRates.length === 0) {
      return {
        passed: false,
        averageFPS: 0,
        minFPS: 0,
        frameDrops: 0,
        totalFrames: 0,
        message: 'No frame data collected',
      };
    }

    const averageFPS =
      frameRates.reduce((sum, fps) => sum + fps, 0) /
      frameRates.length;
    const minFPS = Math.min(...frameRates);
    const frameDrops = frameRates.filter(
      (fps) => fps < PerformanceValidator.MIN_ACCEPTABLE_FPS
    ).length;

    const passed =
      averageFPS >= PerformanceValidator.TARGET_FPS &&
      minFPS >= PerformanceValidator.MIN_ACCEPTABLE_FPS &&
      frameDrops < frameRates.length * 0.1; // Less than 10% frame drops

    let message = '';
    if (passed) {
      message = `✅ Performance validation passed! Average: ${averageFPS.toFixed(
        1
      )} FPS`;
    } else if (
      averageFPS >= PerformanceValidator.MIN_ACCEPTABLE_FPS
    ) {
      message = `⚠️ Performance acceptable but below target. Average: ${averageFPS.toFixed(
        1
      )} FPS`;
    } else {
      message = `❌ Performance below acceptable threshold. Average: ${averageFPS.toFixed(
        1
      )} FPS`;
    }

    return {
      passed,
      averageFPS: Math.round(averageFPS * 10) / 10,
      minFPS: Math.round(minFPS * 10) / 10,
      frameDrops,
      totalFrames: frameRates.length,
      message,
    };
  }

  /**
   * Quick validation check (shorter test)
   * @returns Promise with validation results
   */
  static async quickValidation(): Promise<ValidationResult> {
    return PerformanceValidator.validateAnimationPerformance(1000); // 1 second test
  }

  /**
   * Log performance validation results
   * @param result Validation result to log
   */
  static logResults(result: ValidationResult): void {
    console.log('\n🎯 Animation Performance Validation Results:');
    console.log(`${result.message}`);
    console.log(
      `📊 Stats: ${result.averageFPS} avg FPS, ${result.minFPS} min FPS`
    );
    console.log(
      `📉 Frame drops: ${result.frameDrops}/${result.totalFrames} (${(
        (result.frameDrops / result.totalFrames) *
        100
      ).toFixed(1)}%)`
    );

    if (result.passed) {
      console.log(
        '🎉 AnimatedCritter meets 60fps performance requirements!'
      );
    } else {
      console.log(
        '🔧 Consider optimizing animations for better performance'
      );
    }
  }
}

/**
 * Development helper to validate AnimatedCritter performance
 * Call this function during development to check performance
 */
export const validateCritterPerformance = async (): Promise<void> => {
  if (__DEV__) {
    console.log(
      '🚀 Starting AnimatedCritter performance validation...'
    );

    try {
      const result =
        await PerformanceValidator.validateAnimationPerformance();
      PerformanceValidator.logResults(result);

      return result.passed
        ? Promise.resolve()
        : Promise.reject(new Error('Performance validation failed'));
    } catch (error) {
      console.error('❌ Performance validation error:', error);
      throw error;
    }
  }
};

/**
 * Hook for component-level performance validation
 */
export const usePerformanceValidation = () => {
  const validate = () =>
    PerformanceValidator.validateAnimationPerformance();
  const quickValidate = () => PerformanceValidator.quickValidation();

  return { validate, quickValidate };
};
