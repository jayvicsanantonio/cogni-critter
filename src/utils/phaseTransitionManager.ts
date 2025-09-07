import { TrainingExample } from '@types/mlTypes';
import { GamePhase } from '@types/coreTypes';
import {
  calculateProgress,
  ProgressTracker,
} from './progressTracker';
import { handleTrainingTransition } from './trainingIntegration';

/**
 * Phase Transition Manager
 *
 * Handles automatic transitions between game phases based on
 * training data quality and quantity thresholds.
 *
 * Requirements: 2.4
 */

export interface TransitionConfig {
  minImages: number;
  maxImages: number;
  autoTransitionEnabled: boolean;
  transitionDelay: number; // milliseconds
  requiresUserConfirmation: boolean;
}

export interface TransitionResult {
  shouldTransition: boolean;
  canTransition: boolean;
  reason: string;
  nextPhase: GamePhase;
  delay?: number;
  requiresTraining?: boolean;
}

export const DEFAULT_TRANSITION_CONFIG: TransitionConfig = {
  minImages: 5,
  maxImages: 10,
  autoTransitionEnabled: true,
  transitionDelay: 2000, // 2 seconds
  requiresUserConfirmation: false,
};

/**
 * Evaluates whether teaching phase should transition to testing phase
 */
export function evaluateTeachingTransition(
  trainingData: TrainingExample[],
  config: TransitionConfig = DEFAULT_TRANSITION_CONFIG
): TransitionResult {
  const progress = calculateProgress(
    trainingData.length,
    config.minImages,
    config.maxImages
  );

  // Force transition if maximum reached
  if (progress.isMaximumReached) {
    return {
      shouldTransition: true,
      canTransition: true,
      reason:
        'Maximum training examples reached. Your critter is ready to learn!',
      nextPhase: 'TRAINING_MODEL',
      requiresTraining: true,
      delay: config.autoTransitionEnabled
        ? config.transitionDelay
        : undefined,
    };
  }

  // Check if minimum requirements are met
  if (progress.isMinimumReached) {
    // Validate training data quality
    const validation =
      validateTrainingDataForTransition(trainingData);

    if (!validation.isValid) {
      return {
        shouldTransition: false,
        canTransition: false,
        reason:
          validation.issues[0] ||
          'Training data needs improvement before testing.',
        nextPhase: 'TEACHING_PHASE',
      };
    }

    // Can transition but need to train first
    return {
      shouldTransition: config.autoTransitionEnabled,
      canTransition: true,
      reason: 'Your critter has enough examples to start learning!',
      nextPhase: 'TRAINING_MODEL',
      delay: config.autoTransitionEnabled
        ? config.transitionDelay
        : undefined,
      requiresTraining: true,
    };
  }

  // Need more examples
  return {
    shouldTransition: false,
    canTransition: false,
    reason: `Add ${progress.remainingToMinimum} more examples to reach the minimum for testing.`,
    nextPhase: 'TEACHING_PHASE',
  };
}

/**
 * Validates training data quality for phase transition
 */
function validateTrainingDataForTransition(
  trainingData: TrainingExample[]
): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (trainingData.length === 0) {
    issues.push('No training examples provided');
    return { isValid: false, issues, suggestions };
  }

  // Check for both apple and non-apple examples
  const appleCount = trainingData.filter(
    (ex) => ex.userLabel === 'apple'
  ).length;
  const notAppleCount = trainingData.filter(
    (ex) => ex.userLabel === 'not_apple'
  ).length;

  if (appleCount === 0) {
    issues.push('No apple examples provided');
    suggestions.push(
      'Add some apple images to help your critter learn what apples look like'
    );
  }

  if (notAppleCount === 0) {
    issues.push('No non-apple examples provided');
    suggestions.push(
      'Add some non-apple images to help your critter learn what is NOT an apple'
    );
  }

  // Check for severe imbalance (more than 90% of one class)
  const total = trainingData.length;
  if (total > 0) {
    const appleRatio = appleCount / total;
    if (appleRatio > 0.9) {
      issues.push(
        'Training data is too heavily skewed toward apples'
      );
      suggestions.push(
        'Add more non-apple examples for better balance'
      );
    } else if (appleRatio < 0.1) {
      issues.push(
        'Training data is too heavily skewed toward non-apples'
      );
      suggestions.push('Add more apple examples for better balance');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Phase Transition Manager Class
 * Manages automatic transitions with timing and user confirmation
 */
export class PhaseTransitionManager {
  private config: TransitionConfig;
  private progressTracker: ProgressTracker;
  private transitionTimer: NodeJS.Timeout | null = null;
  private onTransitionCallback?: (nextPhase: GamePhase) => void;
  private onTrainingCallback?: (
    trainingData: TrainingExample[]
  ) => Promise<boolean>;

  constructor(
    config: TransitionConfig = DEFAULT_TRANSITION_CONFIG,
    progressTracker?: ProgressTracker
  ) {
    this.config = config;
    this.progressTracker = progressTracker || new ProgressTracker();
  }

  /**
   * Sets the callback function to call when transition should occur
   */
  setTransitionCallback(
    callback: (nextPhase: GamePhase) => void
  ): void {
    this.onTransitionCallback = callback;
  }

  /**
   * Sets the callback function to call when training should occur
   */
  setTrainingCallback(
    callback: (trainingData: TrainingExample[]) => Promise<boolean>
  ): void {
    this.onTrainingCallback = callback;
  }

  /**
   * Evaluates current state and potentially triggers transition
   */
  evaluateTransition(
    trainingData: TrainingExample[]
  ): TransitionResult {
    const result = evaluateTeachingTransition(
      trainingData,
      this.config
    );

    // Clear any existing timer
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    // Schedule automatic transition if needed
    if (
      result.shouldTransition &&
      result.delay &&
      this.onTransitionCallback
    ) {
      this.transitionTimer = setTimeout(async () => {
        this.progressTracker.recordPhaseCompleted(
          trainingData.length,
          trainingData.length >= this.config.maxImages
            ? 'maximum_reached'
            : 'minimum_reached'
        );

        // If training is required, handle it first
        if (result.requiresTraining && this.onTrainingCallback) {
          const trainingSuccess = await this.onTrainingCallback(
            trainingData
          );
          if (trainingSuccess) {
            // Training succeeded, transition to testing phase
            this.onTransitionCallback!('TESTING_PHASE');
          } else {
            // Training failed, stay in current phase
            console.error(
              'Training failed during automatic transition'
            );
          }
        } else {
          // Direct transition without training
          this.onTransitionCallback!(result.nextPhase);
        }

        this.transitionTimer = null;
      }, result.delay);
    }

    return result;
  }

  /**
   * Forces immediate transition (cancels any pending automatic transition)
   */
  async forceTransition(
    trainingData: TrainingExample[]
  ): Promise<boolean> {
    const result = evaluateTeachingTransition(
      trainingData,
      this.config
    );

    if (result.canTransition && this.onTransitionCallback) {
      // Cancel any pending automatic transition
      if (this.transitionTimer) {
        clearTimeout(this.transitionTimer);
        this.transitionTimer = null;
      }

      this.progressTracker.recordPhaseCompleted(
        trainingData.length,
        'minimum_reached'
      );

      // If training is required, handle it first
      if (result.requiresTraining && this.onTrainingCallback) {
        const trainingSuccess = await this.onTrainingCallback(
          trainingData
        );
        if (trainingSuccess) {
          // Training succeeded, transition to testing phase
          this.onTransitionCallback('TESTING_PHASE');
          return true;
        } else {
          // Training failed
          console.error('Training failed during forced transition');
          return false;
        }
      } else {
        // Direct transition without training
        this.onTransitionCallback(result.nextPhase);
        return true;
      }
    }

    return false;
  }

  /**
   * Cancels any pending automatic transition
   */
  cancelPendingTransition(): void {
    if (this.transitionTimer) {
      clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
  }

  /**
   * Updates transition configuration
   */
  updateConfig(newConfig: Partial<TransitionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Gets current configuration
   */
  getConfig(): TransitionConfig {
    return { ...this.config };
  }

  /**
   * Checks if there's a pending automatic transition
   */
  hasPendingTransition(): boolean {
    return this.transitionTimer !== null;
  }

  /**
   * Gets time remaining for pending transition (in milliseconds)
   */
  getTransitionTimeRemaining(): number {
    // This is a simplified implementation
    // In a real app, you'd track the start time and calculate remaining time
    return this.transitionTimer ? this.config.transitionDelay : 0;
  }

  /**
   * Cleanup method to clear any pending timers
   */
  cleanup(): void {
    this.cancelPendingTransition();
  }
}

/**
 * Hook-like function for React components to use phase transitions
 */
export function createPhaseTransitionHook(
  config?: Partial<TransitionConfig>
) {
  const manager = new PhaseTransitionManager({
    ...DEFAULT_TRANSITION_CONFIG,
    ...config,
  });

  return {
    /**
     * Evaluates transition and returns result
     */
    evaluateTransition: (trainingData: TrainingExample[]) =>
      manager.evaluateTransition(trainingData),

    /**
     * Sets up automatic transition with callback
     */
    setupAutoTransition: (
      trainingData: TrainingExample[],
      onTransition: (nextPhase: GamePhase) => void,
      onTraining?: (
        trainingData: TrainingExample[]
      ) => Promise<boolean>
    ) => {
      manager.setTransitionCallback(onTransition);
      if (onTraining) {
        manager.setTrainingCallback(onTraining);
      }
      return manager.evaluateTransition(trainingData);
    },

    /**
     * Forces immediate transition
     */
    forceTransition: async (trainingData: TrainingExample[]) =>
      await manager.forceTransition(trainingData),

    /**
     * Cancels pending transition
     */
    cancelTransition: () => manager.cancelPendingTransition(),

    /**
     * Cleanup function
     */
    cleanup: () => manager.cleanup(),

    /**
     * Gets manager instance for advanced usage
     */
    getManager: () => manager,
  };
}

/**
 * Utility functions for transition UI feedback
 */
export const transitionUI = {
  /**
   * Gets appropriate message for transition state
   */
  getTransitionMessage: (result: TransitionResult): string => {
    if (result.shouldTransition && result.delay) {
      return `${
        result.reason
      } Transitioning to testing in ${Math.ceil(
        result.delay / 1000
      )} seconds...`;
    }
    return result.reason;
  },

  /**
   * Gets appropriate color for transition state
   */
  getTransitionColor: (result: TransitionResult): string => {
    if (result.shouldTransition) return '#A2E85B'; // Cogni Green
    if (result.canTransition) return '#4D96FF'; // Spark Blue
    return '#F5F5F5'; // Default text color
  },

  /**
   * Determines if transition button should be shown
   */
  shouldShowTransitionButton: (result: TransitionResult): boolean => {
    return result.canTransition && !result.shouldTransition;
  },

  /**
   * Gets button text for manual transition
   */
  getTransitionButtonText: (result: TransitionResult): string => {
    if (!result.canTransition) return 'Not Ready Yet';
    return result.requiresTraining
      ? 'Train Critter'
      : 'Start Testing';
  },
};

/**
 * Transition timing utilities
 */
export const transitionTiming = {
  /**
   * Creates a countdown timer for automatic transitions
   */
  createCountdown: (
    duration: number,
    onTick: (remaining: number) => void,
    onComplete: () => void
  ): (() => void) => {
    let remaining = duration;
    const interval = setInterval(() => {
      remaining -= 1000;
      onTick(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onComplete();
      }
    }, 1000);

    // Return cleanup function
    return () => clearInterval(interval);
  },

  /**
   * Formats remaining time for display
   */
  formatRemainingTime: (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000);
    return `${seconds}s`;
  },
};
