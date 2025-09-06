import { GameState, GameConfig } from '@types/gameTypes';
import { GamePhase, CritterState } from '@types/coreTypes';
import { TrainingExample, TestResult } from '@types/mlTypes';
import {
  gameActions,
  GameAction,
  shouldTransitionToTesting,
  shouldTransitionToResults,
  calculateAccuracy,
  getCritterMoodFromAccuracy,
} from './gameStateManager';

/**
 * Game State Integration Utilities
 *
 * Provides high-level integration functions for connecting
 * UI components with the game state management system.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

export interface GameStateHook {
  gameState: GameState;
  dispatch: React.Dispatch<GameAction>;
  actions: typeof gameStateActions;
  selectors: typeof gameStateSelectors;
  effects: typeof gameStateEffects;
}

/**
 * High-level game state actions
 */
export const gameStateActions = {
  /**
   * Initializes a new game session
   */
  initializeNewGame: (dispatch: React.Dispatch<GameAction>) => {
    dispatch(gameActions.initializeGame());
    dispatch(gameActions.startTeachingPhase());
  },

  /**
   * Handles user sorting action during teaching phase
   */
  handleUserSort: (
    dispatch: React.Dispatch<GameAction>,
    trainingExample: TrainingExample
  ) => {
    dispatch(gameActions.addTrainingExample(trainingExample));
    dispatch(gameActions.nextImage());
  },

  /**
   * Attempts to transition from teaching to testing phase
   */
  transitionToTesting: (
    dispatch: React.Dispatch<GameAction>,
    gameState: GameState,
    config?: GameConfig
  ): boolean => {
    if (shouldTransitionToTesting(gameState.trainingData, config)) {
      dispatch(gameActions.startTestingPhase());
      dispatch(gameActions.resetImageIndex());
      return true;
    }
    return false;
  },

  /**
   * Handles ML prediction result during testing phase
   */
  handlePredictionResult: (
    dispatch: React.Dispatch<GameAction>,
    testResult: TestResult
  ) => {
    dispatch(gameActions.startPrediction());

    // Simulate thinking delay
    setTimeout(() => {
      dispatch(gameActions.addTestResult(testResult));
      dispatch(gameActions.nextImage());
    }, 1000);
  },

  /**
   * Attempts to transition from testing to results phase
   */
  transitionToResults: (
    dispatch: React.Dispatch<GameAction>,
    gameState: GameState,
    config?: GameConfig
  ): boolean => {
    if (shouldTransitionToResults(gameState.testResults, config)) {
      dispatch(gameActions.showResults());
      return true;
    }
    return false;
  },

  /**
   * Restarts the game from results phase
   */
  restartGame: (dispatch: React.Dispatch<GameAction>) => {
    dispatch(gameActions.restartGame());
  },

  /**
   * Updates critter state with optional delay
   */
  updateCritterState: (
    dispatch: React.Dispatch<GameAction>,
    state: CritterState,
    delay?: number
  ) => {
    if (delay) {
      setTimeout(() => {
        dispatch(gameActions.updateCritterState(state));
      }, delay);
    } else {
      dispatch(gameActions.updateCritterState(state));
    }
  },
};

/**
 * Game state selectors for derived data
 */
export const gameStateSelectors = {
  /**
   * Gets current phase display information
   */
  getPhaseInfo: (gameState: GameState) => {
    const phaseLabels: Record<GamePhase, string> = {
      INITIALIZING: 'Starting Up',
      LOADING_MODEL: 'Loading AI Model',
      TEACHING_PHASE: 'Teaching Your Critter',
      TESTING_PHASE: 'Testing Time',
      RESULTS_SUMMARY: 'Results',
    };

    return {
      phase: gameState.phase,
      label: phaseLabels[gameState.phase],
      isActive: true,
    };
  },

  /**
   * Gets teaching phase progress information
   */
  getTeachingProgress: (
    gameState: GameState,
    config?: GameConfig
  ) => {
    const minImages = config?.teachingPhase.minImages || 5;
    const maxImages = config?.teachingPhase.maxImages || 10;
    const current = gameState.trainingData.length;

    return {
      current,
      minimum: minImages,
      maximum: maxImages,
      percentage: Math.min((current / minImages) * 100, 100),
      isMinimumReached: current >= minImages,
      isMaximumReached: current >= maxImages,
      canTransitionToTesting: shouldTransitionToTesting(
        gameState.trainingData,
        config
      ),
    };
  },

  /**
   * Gets testing phase progress information
   */
  getTestingProgress: (gameState: GameState, config?: GameConfig) => {
    const totalTests = config?.testingPhaseImageCount || 5;
    const completed = gameState.testResults.length;
    const accuracy = calculateAccuracy(gameState.testResults);

    return {
      completed,
      total: totalTests,
      percentage: (completed / totalTests) * 100,
      accuracy,
      score: gameState.score,
      isComplete: shouldTransitionToResults(
        gameState.testResults,
        config
      ),
    };
  },

  /**
   * Gets current critter state information
   */
  getCritterInfo: (gameState: GameState) => {
    return {
      state: gameState.critterState,
      shouldAnimate:
        gameState.critterState === 'THINKING' ||
        gameState.critterState === 'LOADING_MODEL',
      mood:
        gameState.phase === 'RESULTS_SUMMARY'
          ? getCritterMoodFromAccuracy(
              calculateAccuracy(gameState.testResults)
            )
          : gameState.critterState,
    };
  },

  /**
   * Gets training data statistics
   */
  getTrainingStats: (gameState: GameState) => {
    const trainingData = gameState.trainingData;
    const apples = trainingData.filter(
      (ex) => ex.userLabel === 'apple'
    ).length;
    const notApples = trainingData.filter(
      (ex) => ex.userLabel === 'not_apple'
    ).length;

    return {
      total: trainingData.length,
      apples,
      notApples,
      balance:
        trainingData.length > 0
          ? Math.min(apples, notApples) / Math.max(apples, notApples)
          : 0,
      isBalanced:
        trainingData.length === 0 ||
        (apples > 0 &&
          notApples > 0 &&
          Math.abs(apples - notApples) <= 2),
    };
  },

  /**
   * Gets test results statistics
   */
  getTestStats: (gameState: GameState) => {
    const testResults = gameState.testResults;
    const correct = testResults.filter(
      (result) => result.isCorrect
    ).length;
    const accuracy = calculateAccuracy(testResults);

    return {
      total: testResults.length,
      correct,
      incorrect: testResults.length - correct,
      accuracy,
      averageConfidence:
        testResults.length > 0
          ? testResults.reduce(
              (sum, result) => sum + result.confidence,
              0
            ) / testResults.length
          : 0,
    };
  },
};

/**
 * Game state side effects and integrations
 */
export const gameStateEffects = {
  /**
   * Handles automatic phase transitions
   */
  handleAutoTransitions: (
    gameState: GameState,
    dispatch: React.Dispatch<GameAction>,
    config?: GameConfig
  ) => {
    // Auto-transition from teaching to testing if maximum reached
    if (gameState.phase === 'TEACHING_PHASE') {
      const maxImages = config?.teachingPhase.maxImages || 10;
      if (gameState.trainingData.length >= maxImages) {
        gameStateActions.transitionToTesting(
          dispatch,
          gameState,
          config
        );
      }
    }

    // Auto-transition from testing to results if all tests complete
    if (gameState.phase === 'TESTING_PHASE') {
      if (shouldTransitionToResults(gameState.testResults, config)) {
        gameStateActions.transitionToResults(
          dispatch,
          gameState,
          config
        );
      }
    }
  },

  /**
   * Handles critter state updates based on game events
   */
  handleCritterStateUpdates: (
    gameState: GameState,
    dispatch: React.Dispatch<GameAction>
  ) => {
    // Update critter state based on phase
    switch (gameState.phase) {
      case 'TEACHING_PHASE':
        if (gameState.critterState !== 'IDLE') {
          gameStateActions.updateCritterState(dispatch, 'IDLE');
        }
        break;

      case 'TESTING_PHASE':
        // Critter state will be managed by prediction results
        break;

      case 'RESULTS_SUMMARY':
        const finalMood = getCritterMoodFromAccuracy(
          calculateAccuracy(gameState.testResults)
        );
        if (gameState.critterState !== finalMood) {
          gameStateActions.updateCritterState(dispatch, finalMood);
        }
        break;
    }
  },

  /**
   * Handles data persistence and cleanup
   */
  handleDataPersistence: (gameState: GameState) => {
    // In a real implementation, this would save game state to storage
    // For now, we'll just log important state changes
    console.log('Game State Update:', {
      phase: gameState.phase,
      trainingDataCount: gameState.trainingData.length,
      testResultsCount: gameState.testResults.length,
      score: gameState.score,
    });
  },
};

/**
 * Creates a comprehensive game state hook for React components
 */
export function createGameStateHook(
  gameState: GameState,
  dispatch: React.Dispatch<GameAction>
): GameStateHook {
  return {
    gameState,
    dispatch,
    actions: gameStateActions,
    selectors: gameStateSelectors,
    effects: gameStateEffects,
  };
}

/**
 * Validation utilities for game state transitions
 */
export const gameStateValidation = {
  /**
   * Validates if teaching phase can transition to testing
   */
  canStartTesting: (
    gameState: GameState,
    config?: GameConfig
  ): {
    canTransition: boolean;
    reasons: string[];
  } => {
    const reasons: string[] = [];

    if (gameState.phase !== 'TEACHING_PHASE') {
      reasons.push('Not in teaching phase');
    }

    const minImages = config?.teachingPhase.minImages || 5;
    if (gameState.trainingData.length < minImages) {
      reasons.push(`Need at least ${minImages} training examples`);
    }

    const apples = gameState.trainingData.filter(
      (ex) => ex.userLabel === 'apple'
    ).length;
    const notApples = gameState.trainingData.filter(
      (ex) => ex.userLabel === 'not_apple'
    ).length;

    if (apples === 0) {
      reasons.push('Need at least one apple example');
    }

    if (notApples === 0) {
      reasons.push('Need at least one non-apple example');
    }

    return {
      canTransition: reasons.length === 0,
      reasons,
    };
  },

  /**
   * Validates if testing phase can show results
   */
  canShowResults: (
    gameState: GameState,
    config?: GameConfig
  ): {
    canTransition: boolean;
    reasons: string[];
  } => {
    const reasons: string[] = [];

    if (gameState.phase !== 'TESTING_PHASE') {
      reasons.push('Not in testing phase');
    }

    const requiredTests = config?.testingPhaseImageCount || 5;
    if (gameState.testResults.length < requiredTests) {
      reasons.push(`Need ${requiredTests} test results`);
    }

    return {
      canTransition: reasons.length === 0,
      reasons,
    };
  },
};

/**
 * Debug utilities for development
 */
export const gameStateDebug = {
  /**
   * Logs current game state for debugging
   */
  logGameState: (gameState: GameState) => {
    console.group('Game State Debug');
    console.log('Phase:', gameState.phase);
    console.log('Critter State:', gameState.critterState);
    console.log('Current Image Index:', gameState.currentImageIndex);
    console.log(
      'Training Data:',
      gameState.trainingData.length,
      'examples'
    );
    console.log(
      'Test Results:',
      gameState.testResults.length,
      'results'
    );
    console.log('Score:', gameState.score);
    console.groupEnd();
  },

  /**
   * Validates game state consistency
   */
  validateGameState: (gameState: GameState): string[] => {
    const issues: string[] = [];

    // Check for negative values
    if (gameState.currentImageIndex < 0) {
      issues.push('Current image index is negative');
    }

    if (gameState.score < 0) {
      issues.push('Score is negative');
    }

    // Check phase consistency
    if (
      gameState.phase === 'TESTING_PHASE' &&
      gameState.trainingData.length === 0
    ) {
      issues.push('Testing phase with no training data');
    }

    if (
      gameState.phase === 'RESULTS_SUMMARY' &&
      gameState.testResults.length === 0
    ) {
      issues.push('Results phase with no test results');
    }

    return issues;
  },
};
