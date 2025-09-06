/**
 * Game State Management
 * Implements finite state machine logic for the Sorter Machine gameplay
 */

import { GameState, GameConfig } from '@types/gameTypes';
import {
  GamePhase,
  CritterState,
  ImageLabel,
} from '@types/coreTypes';
import { TrainingExample, TestResult } from '@types/mlTypes';

/**
 * Game Actions for state transitions
 */
export type GameAction =
  | { type: 'INITIALIZE_GAME' }
  | { type: 'START_MODEL_LOADING' }
  | { type: 'MODEL_LOADED' }
  | { type: 'MODEL_LOAD_FAILED'; error: string }
  | { type: 'START_TEACHING_PHASE' }
  | { type: 'ADD_TRAINING_EXAMPLE'; example: TrainingExample }
  | { type: 'START_TESTING_PHASE' }
  | { type: 'START_PREDICTION' }
  | { type: 'ADD_TEST_RESULT'; result: TestResult }
  | { type: 'SHOW_RESULTS' }
  | { type: 'RESTART_GAME' }
  | { type: 'UPDATE_CRITTER_STATE'; state: CritterState }
  | { type: 'NEXT_IMAGE' }
  | { type: 'RESET_IMAGE_INDEX' };

/**
 * Default game configuration
 */
export const DEFAULT_GAME_CONFIG: GameConfig = {
  teachingPhase: {
    minImages: 5,
    maxImages: 10,
    currentCount: 0,
  },
  testingPhaseImageCount: 5,
  targetFrameRate: 60,
  maxPredictionTime: 1000,
  animationDuration: 250,
};

/**
 * Initial game state
 */
export const initialGameState: GameState = {
  phase: 'INITIALIZING',
  currentImageIndex: 0,
  trainingData: [],
  testResults: [],
  score: 0,
  critterState: 'IDLE',
};

/**
 * Game state reducer implementing finite state machine logic
 * Handles state transitions: INITIALIZING → LOADING_MODEL → TEACHING_PHASE → TESTING_PHASE → RESULTS_SUMMARY
 */
export function gameReducer(
  state: GameState,
  action: GameAction
): GameState {
  switch (action.type) {
    case 'INITIALIZE_GAME':
      return {
        ...initialGameState,
        phase: 'INITIALIZING',
        critterState: 'IDLE',
      };

    case 'START_MODEL_LOADING':
      // Transition: INITIALIZING → LOADING_MODEL
      if (state.phase !== 'INITIALIZING') {
        console.warn(
          'Invalid transition: Can only start model loading from INITIALIZING phase'
        );
        return state;
      }
      return {
        ...state,
        phase: 'LOADING_MODEL',
        critterState: 'LOADING_MODEL',
      };

    case 'MODEL_LOADED':
      // Transition: LOADING_MODEL → TEACHING_PHASE
      if (state.phase !== 'LOADING_MODEL') {
        console.warn(
          'Invalid transition: Can only complete model loading from LOADING_MODEL phase'
        );
        return state;
      }
      return {
        ...state,
        phase: 'TEACHING_PHASE',
        critterState: 'IDLE',
        currentImageIndex: 0,
      };

    case 'MODEL_LOAD_FAILED':
      // Stay in LOADING_MODEL phase but update critter state to show error
      if (state.phase !== 'LOADING_MODEL') {
        console.warn(
          'Invalid transition: Can only fail model loading from LOADING_MODEL phase'
        );
        return state;
      }
      return {
        ...state,
        critterState: 'CONFUSED',
      };

    case 'START_TEACHING_PHASE':
      // Force transition to TEACHING_PHASE (for retry scenarios)
      return {
        ...state,
        phase: 'TEACHING_PHASE',
        critterState: 'IDLE',
        currentImageIndex: 0,
        trainingData: [],
      };

    case 'ADD_TRAINING_EXAMPLE':
      // Only valid during TEACHING_PHASE
      if (state.phase !== 'TEACHING_PHASE') {
        console.warn(
          'Invalid action: Can only add training examples during TEACHING_PHASE'
        );
        return state;
      }
      return {
        ...state,
        trainingData: [...state.trainingData, action.example],
      };

    case 'START_TESTING_PHASE':
      // Transition: TEACHING_PHASE → TESTING_PHASE
      if (state.phase !== 'TEACHING_PHASE') {
        console.warn(
          'Invalid transition: Can only start testing from TEACHING_PHASE'
        );
        return state;
      }
      return {
        ...state,
        phase: 'TESTING_PHASE',
        critterState: 'IDLE',
        currentImageIndex: 0,
        testResults: [],
        score: 0,
      };

    case 'START_PREDICTION':
      // Only valid during TESTING_PHASE
      if (state.phase !== 'TESTING_PHASE') {
        console.warn(
          'Invalid action: Can only start prediction during TESTING_PHASE'
        );
        return state;
      }
      return {
        ...state,
        critterState: 'THINKING',
      };

    case 'ADD_TEST_RESULT':
      // Only valid during TESTING_PHASE
      if (state.phase !== 'TESTING_PHASE') {
        console.warn(
          'Invalid action: Can only add test results during TESTING_PHASE'
        );
        return state;
      }

      const newScore = action.result.isCorrect
        ? state.score + 1
        : state.score;
      const newCritterState: CritterState = action.result.isCorrect
        ? 'HAPPY'
        : 'CONFUSED';

      return {
        ...state,
        testResults: [...state.testResults, action.result],
        score: newScore,
        critterState: newCritterState,
      };

    case 'SHOW_RESULTS':
      // Transition: TESTING_PHASE → RESULTS_SUMMARY
      if (state.phase !== 'TESTING_PHASE') {
        console.warn(
          'Invalid transition: Can only show results from TESTING_PHASE'
        );
        return state;
      }
      return {
        ...state,
        phase: 'RESULTS_SUMMARY',
        critterState:
          state.score >= Math.ceil(state.testResults.length * 0.7)
            ? 'HAPPY'
            : 'CONFUSED',
      };

    case 'RESTART_GAME':
      // Transition: RESULTS_SUMMARY → TEACHING_PHASE
      if (state.phase !== 'RESULTS_SUMMARY') {
        console.warn(
          'Invalid transition: Can only restart from RESULTS_SUMMARY'
        );
        return state;
      }
      return {
        ...initialGameState,
        phase: 'TEACHING_PHASE',
        critterState: 'IDLE',
      };

    case 'UPDATE_CRITTER_STATE':
      return {
        ...state,
        critterState: action.state,
      };

    case 'NEXT_IMAGE':
      return {
        ...state,
        currentImageIndex: state.currentImageIndex + 1,
      };

    case 'RESET_IMAGE_INDEX':
      return {
        ...state,
        currentImageIndex: 0,
      };

    default:
      return state;
  }
}

/**
 * State Transition Helper Functions
 * Provides convenient functions for common state transitions with validation
 */

/**
 * Validates if a phase transition is allowed
 */
export function isValidTransition(
  currentPhase: GamePhase,
  targetPhase: GamePhase
): boolean {
  const validTransitions: Record<GamePhase, GamePhase[]> = {
    INITIALIZING: ['LOADING_MODEL'],
    LOADING_MODEL: ['TEACHING_PHASE'],
    TEACHING_PHASE: ['TESTING_PHASE'],
    TESTING_PHASE: ['RESULTS_SUMMARY'],
    RESULTS_SUMMARY: ['TEACHING_PHASE'], // Allow restart
  };

  return (
    validTransitions[currentPhase]?.includes(targetPhase) ?? false
  );
}

/**
 * Checks if teaching phase should transition to testing phase
 * Based on minimum images requirement and user progress
 */
export function shouldTransitionToTesting(
  trainingData: TrainingExample[],
  config: GameConfig = DEFAULT_GAME_CONFIG
): boolean {
  return trainingData.length >= config.teachingPhase.minImages;
}

/**
 * Checks if testing phase should transition to results
 * Based on completion of all test images
 */
export function shouldTransitionToResults(
  testResults: TestResult[],
  config: GameConfig = DEFAULT_GAME_CONFIG
): boolean {
  return testResults.length >= config.testingPhaseImageCount;
}

/**
 * Calculates final accuracy score
 */
export function calculateAccuracy(testResults: TestResult[]): number {
  if (testResults.length === 0) return 0;
  const correctResults = testResults.filter(
    (result) => result.isCorrect
  ).length;
  return correctResults / testResults.length;
}

/**
 * Determines if the critter should be happy based on performance
 */
export function getCritterMoodFromAccuracy(
  accuracy: number
): CritterState {
  return accuracy >= 0.7 ? 'HAPPY' : 'CONFUSED';
}

/**
 * State transition action creators
 * Provides type-safe action creation with validation
 */
export const gameActions = {
  initializeGame: (): GameAction => ({ type: 'INITIALIZE_GAME' }),

  startModelLoading: (): GameAction => ({
    type: 'START_MODEL_LOADING',
  }),

  modelLoaded: (): GameAction => ({ type: 'MODEL_LOADED' }),

  modelLoadFailed: (error: string): GameAction => ({
    type: 'MODEL_LOAD_FAILED',
    error,
  }),

  startTeachingPhase: (): GameAction => ({
    type: 'START_TEACHING_PHASE',
  }),

  addTrainingExample: (example: TrainingExample): GameAction => ({
    type: 'ADD_TRAINING_EXAMPLE',
    example,
  }),

  startTestingPhase: (): GameAction => ({
    type: 'START_TESTING_PHASE',
  }),

  startPrediction: (): GameAction => ({ type: 'START_PREDICTION' }),

  addTestResult: (result: TestResult): GameAction => ({
    type: 'ADD_TEST_RESULT',
    result,
  }),

  showResults: (): GameAction => ({ type: 'SHOW_RESULTS' }),

  restartGame: (): GameAction => ({ type: 'RESTART_GAME' }),

  updateCritterState: (state: CritterState): GameAction => ({
    type: 'UPDATE_CRITTER_STATE',
    state,
  }),

  nextImage: (): GameAction => ({ type: 'NEXT_IMAGE' }),

  resetImageIndex: (): GameAction => ({ type: 'RESET_IMAGE_INDEX' }),
};

/**
 * Phase transition functions with validation
 */
export const phaseTransitions = {
  /**
   * Transition from INITIALIZING to LOADING_MODEL
   */
  startGame: (dispatch: React.Dispatch<GameAction>) => {
    dispatch(gameActions.initializeGame());
    dispatch(gameActions.startModelLoading());
  },

  /**
   * Transition from LOADING_MODEL to TEACHING_PHASE
   */
  modelReady: (dispatch: React.Dispatch<GameAction>) => {
    dispatch(gameActions.modelLoaded());
  },

  /**
   * Handle model loading failure
   */
  modelFailed: (
    dispatch: React.Dispatch<GameAction>,
    error: string
  ) => {
    dispatch(gameActions.modelLoadFailed(error));
  },

  /**
   * Transition from TEACHING_PHASE to TESTING_PHASE
   * Validates minimum training data requirement
   */
  startTesting: (
    dispatch: React.Dispatch<GameAction>,
    trainingData: TrainingExample[],
    config: GameConfig = DEFAULT_GAME_CONFIG
  ) => {
    if (!shouldTransitionToTesting(trainingData, config)) {
      console.warn(
        `Need at least ${config.teachingPhase.minImages} training examples to start testing`
      );
      return false;
    }
    dispatch(gameActions.startTestingPhase());
    return true;
  },

  /**
   * Transition from TESTING_PHASE to RESULTS_SUMMARY
   * Validates all test images have been processed
   */
  showResults: (
    dispatch: React.Dispatch<GameAction>,
    testResults: TestResult[],
    config: GameConfig = DEFAULT_GAME_CONFIG
  ) => {
    if (!shouldTransitionToResults(testResults, config)) {
      console.warn(
        `Need ${config.testingPhaseImageCount} test results to show results`
      );
      return false;
    }
    dispatch(gameActions.showResults());
    return true;
  },

  /**
   * Restart game from RESULTS_SUMMARY to TEACHING_PHASE
   */
  restartGame: (dispatch: React.Dispatch<GameAction>) => {
    dispatch(gameActions.restartGame());
  },
};

/**
 * Training Data Collection and Storage Utilities
 * Handles collection and validation of user-labeled training examples during teaching phase
 */

/**
 * Creates a new training example from user input
 */
export function createTrainingExample(
  imageUri: string,
  userLabel: ImageLabel,
  imageId?: string
): TrainingExample {
  return {
    id:
      imageId ||
      `training_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
    imageUri,
    userLabel,
    timestamp: Date.now(),
  };
}

/**
 * Validates training data quality and diversity
 */
export function validateTrainingData(
  trainingData: TrainingExample[]
): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check minimum count
  if (
    trainingData.length < DEFAULT_GAME_CONFIG.teachingPhase.minImages
  ) {
    issues.push(
      `Need at least ${DEFAULT_GAME_CONFIG.teachingPhase.minImages} training examples`
    );
  }

  // Check label distribution
  const appleCounts = trainingData.filter(
    (ex) => ex.userLabel === 'apple'
  ).length;
  const notAppleCounts = trainingData.filter(
    (ex) => ex.userLabel === 'not_apple'
  ).length;

  if (appleCounts === 0) {
    issues.push('No apple examples provided');
    suggestions.push(
      'Add some apple images to help your critter learn what apples look like'
    );
  }

  if (notAppleCounts === 0) {
    issues.push('No non-apple examples provided');
    suggestions.push(
      'Add some non-apple images to help your critter learn what is NOT an apple'
    );
  }

  // Check for severe imbalance (more than 80% of one class)
  const totalCount = trainingData.length;
  if (totalCount > 0) {
    const appleRatio = appleCounts / totalCount;
    if (appleRatio > 0.8) {
      suggestions.push(
        'Try adding more non-apple examples for better balance'
      );
    } else if (appleRatio < 0.2) {
      suggestions.push(
        'Try adding more apple examples for better balance'
      );
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Handles user sorting action during teaching phase
 */
export function handleUserSort(
  dispatch: React.Dispatch<GameAction>,
  imageUri: string,
  userLabel: ImageLabel,
  imageId?: string
): TrainingExample {
  const trainingExample = createTrainingExample(
    imageUri,
    userLabel,
    imageId
  );
  dispatch(gameActions.addTrainingExample(trainingExample));
  return trainingExample;
}

/**
 * Checks if teaching phase should continue or transition to testing
 */
export function evaluateTeachingProgress(
  trainingData: TrainingExample[],
  config: GameConfig = DEFAULT_GAME_CONFIG
): {
  shouldContinue: boolean;
  shouldTransition: boolean;
  canTransition: boolean;
  message?: string;
} {
  const validation = validateTrainingData(trainingData);
  const hasMinimum =
    trainingData.length >= config.teachingPhase.minImages;
  const hasMaximum =
    trainingData.length >= config.teachingPhase.maxImages;

  // Must transition if at maximum
  if (hasMaximum) {
    return {
      shouldContinue: false,
      shouldTransition: true,
      canTransition: true,
      message:
        'Great job! Your critter has learned from enough examples.',
    };
  }

  // Can transition if minimum met and data is valid
  if (hasMinimum && validation.isValid) {
    return {
      shouldContinue: true,
      shouldTransition: false,
      canTransition: true,
      message:
        'Your critter is ready to test its learning! Add more examples or start testing.',
    };
  }

  // Must continue if minimum not met or data invalid
  return {
    shouldContinue: true,
    shouldTransition: false,
    canTransition: false,
    message:
      validation.issues[0] ||
      'Keep teaching your critter with more examples.',
  };
}

/**
 * Gets training data statistics for UI display
 */
export function getTrainingStats(trainingData: TrainingExample[]): {
  total: number;
  apples: number;
  notApples: number;
  progress: number;
  isBalanced: boolean;
} {
  const apples = trainingData.filter(
    (ex) => ex.userLabel === 'apple'
  ).length;
  const notApples = trainingData.filter(
    (ex) => ex.userLabel === 'not_apple'
  ).length;
  const total = trainingData.length;
  const progress = Math.min(
    total / DEFAULT_GAME_CONFIG.teachingPhase.minImages,
    1
  );

  // Consider balanced if neither class is more than 70% of total
  const isBalanced =
    total === 0 ||
    (apples / total <= 0.7 && notApples / total <= 0.7);

  return {
    total,
    apples,
    notApples,
    progress,
    isBalanced,
  };
}

/**
 * Test Result Tracking and Scoring Logic
 * Handles ML prediction results, scoring, and performance evaluation during testing phase
 */

/**
 * Creates a test result from ML prediction
 */
export function createTestResult(
  imageUri: string,
  trueLabel: ImageLabel,
  predictedLabel: ImageLabel,
  confidence: number,
  predictionTime: number,
  imageId?: string
): TestResult {
  return {
    id:
      imageId ||
      `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    imageUri,
    trueLabel,
    predictedLabel,
    confidence,
    isCorrect: trueLabel === predictedLabel,
    predictionTime,
  };
}

/**
 * Handles ML prediction result during testing phase
 */
export function handlePredictionResult(
  dispatch: React.Dispatch<GameAction>,
  imageUri: string,
  trueLabel: ImageLabel,
  predictedLabel: ImageLabel,
  confidence: number,
  predictionTime: number,
  imageId?: string
): TestResult {
  const testResult = createTestResult(
    imageUri,
    trueLabel,
    predictedLabel,
    confidence,
    predictionTime,
    imageId
  );

  dispatch(gameActions.addTestResult(testResult));
  return testResult;
}

/**
 * Calculates comprehensive scoring metrics
 */
export function calculateScoreMetrics(testResults: TestResult[]): {
  accuracy: number;
  correctCount: number;
  totalCount: number;
  averageConfidence: number;
  averagePredictionTime: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  isHighPerformance: boolean;
} {
  if (testResults.length === 0) {
    return {
      accuracy: 0,
      correctCount: 0,
      totalCount: 0,
      averageConfidence: 0,
      averagePredictionTime: 0,
      performanceGrade: 'F',
      isHighPerformance: false,
    };
  }

  const correctCount = testResults.filter(
    (result) => result.isCorrect
  ).length;
  const totalCount = testResults.length;
  const accuracy = correctCount / totalCount;

  const averageConfidence =
    testResults.reduce((sum, result) => sum + result.confidence, 0) /
    totalCount;
  const averagePredictionTime =
    testResults.reduce(
      (sum, result) => sum + result.predictionTime,
      0
    ) / totalCount;

  // Determine performance grade
  let performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (accuracy >= 0.9) performanceGrade = 'A';
  else if (accuracy >= 0.8) performanceGrade = 'B';
  else if (accuracy >= 0.7) performanceGrade = 'C';
  else if (accuracy >= 0.6) performanceGrade = 'D';
  else performanceGrade = 'F';

  const isHighPerformance =
    accuracy >= 0.8 && averageConfidence >= 0.7;

  return {
    accuracy,
    correctCount,
    totalCount,
    averageConfidence,
    averagePredictionTime,
    performanceGrade,
    isHighPerformance,
  };
}

/**
 * Analyzes prediction patterns for educational insights
 */
export function analyzePredictionPatterns(
  testResults: TestResult[]
): {
  commonMistakes: Array<{
    type: 'false_positive' | 'false_negative';
    count: number;
    examples: TestResult[];
  }>;
  confidenceDistribution: {
    high: number; // > 0.8
    medium: number; // 0.5 - 0.8
    low: number; // < 0.5
  };
  insights: string[];
} {
  const falsePositives = testResults.filter(
    (r) => !r.isCorrect && r.predictedLabel === 'apple'
  );
  const falseNegatives = testResults.filter(
    (r) => !r.isCorrect && r.predictedLabel === 'not_apple'
  );

  const highConfidence = testResults.filter(
    (r) => r.confidence > 0.8
  ).length;
  const mediumConfidence = testResults.filter(
    (r) => r.confidence >= 0.5 && r.confidence <= 0.8
  ).length;
  const lowConfidence = testResults.filter(
    (r) => r.confidence < 0.5
  ).length;

  const insights: string[] = [];

  // Generate educational insights
  if (falsePositives.length > falseNegatives.length) {
    insights.push(
      'Your critter thinks too many things are apples! This might happen if it only saw red apples during training.'
    );
  } else if (falseNegatives.length > falsePositives.length) {
    insights.push(
      'Your critter is being too picky about what counts as an apple! It might need to see more apple varieties.'
    );
  }

  if (lowConfidence > testResults.length * 0.3) {
    insights.push(
      'Your critter seems unsure about many predictions. More diverse training examples could help!'
    );
  }

  if (
    testResults.length > 0 &&
    testResults.every((r) => r.isCorrect)
  ) {
    insights.push(
      'Perfect score! Your critter learned really well from your teaching.'
    );
  }

  return {
    commonMistakes: [
      {
        type: 'false_positive',
        count: falsePositives.length,
        examples: falsePositives.slice(0, 3), // Limit examples
      },
      {
        type: 'false_negative',
        count: falseNegatives.length,
        examples: falseNegatives.slice(0, 3), // Limit examples
      },
    ],
    confidenceDistribution: {
      high: highConfidence,
      medium: mediumConfidence,
      low: lowConfidence,
    },
    insights,
  };
}

/**
 * Checks if testing phase is complete and should show results
 */
export function evaluateTestingProgress(
  testResults: TestResult[],
  config: GameConfig = DEFAULT_GAME_CONFIG
): {
  isComplete: boolean;
  progress: number;
  remainingTests: number;
  shouldShowResults: boolean;
} {
  const totalRequired = config.testingPhaseImageCount;
  const completed = testResults.length;
  const progress = Math.min(completed / totalRequired, 1);
  const isComplete = completed >= totalRequired;

  return {
    isComplete,
    progress,
    remainingTests: Math.max(totalRequired - completed, 0),
    shouldShowResults: isComplete,
  };
}

/**
 * Gets real-time scoring display data
 */
export function getScoreDisplayData(testResults: TestResult[]): {
  currentScore: number;
  totalTests: number;
  accuracy: number;
  lastResult?: {
    isCorrect: boolean;
    confidence: number;
  };
  streak: number; // Current correct streak
} {
  const currentScore = testResults.filter((r) => r.isCorrect).length;
  const totalTests = testResults.length;
  const accuracy = totalTests > 0 ? currentScore / totalTests : 0;

  // Calculate current streak (consecutive correct from the end)
  let streak = 0;
  for (let i = testResults.length - 1; i >= 0; i--) {
    if (testResults[i].isCorrect) {
      streak++;
    } else {
      break;
    }
  }

  const lastResult =
    testResults.length > 0
      ? {
          isCorrect: testResults[testResults.length - 1].isCorrect,
          confidence: testResults[testResults.length - 1].confidence,
        }
      : undefined;

  return {
    currentScore,
    totalTests,
    accuracy,
    lastResult,
    streak,
  };
}

/**
 * Game State to AnimatedCritter Integration
 * Connects game state changes to critter animations and visual feedback
 */

/**
 * Maps game phase to appropriate critter state
 */
export function getCritterStateForPhase(
  phase: GamePhase
): CritterState {
  switch (phase) {
    case 'INITIALIZING':
      return 'IDLE';
    case 'LOADING_MODEL':
      return 'LOADING_MODEL';
    case 'TEACHING_PHASE':
      return 'IDLE';
    case 'TESTING_PHASE':
      return 'THINKING'; // Default for testing, will be updated based on results
    case 'RESULTS_SUMMARY':
      return 'HAPPY'; // Default, will be updated based on final score
    default:
      return 'IDLE';
  }
}

/**
 * Determines critter state based on prediction result
 */
export function getCritterStateForPrediction(
  testResult: TestResult,
  delayMs: number = 0
): {
  immediateState: CritterState;
  delayedState?: CritterState;
  delayDuration?: number;
} {
  // During prediction, critter should be thinking
  const immediateState: CritterState = 'THINKING';

  // After prediction, show result-based emotion
  const delayedState: CritterState = testResult.isCorrect
    ? 'HAPPY'
    : 'CONFUSED';

  return {
    immediateState,
    delayedState: delayMs > 0 ? delayedState : undefined,
    delayDuration: delayMs > 0 ? delayMs : undefined,
  };
}

/**
 * Calculates critter state for results summary based on overall performance
 */
export function getCritterStateForResults(
  testResults: TestResult[]
): CritterState {
  const metrics = calculateScoreMetrics(testResults);

  // Happy if accuracy is 70% or higher
  return metrics.accuracy >= 0.7 ? 'HAPPY' : 'CONFUSED';
}

/**
 * Hook-like function to manage critter state transitions with timing
 */
export function createCritterStateManager() {
  let currentTimeout: NodeJS.Timeout | null = null;

  return {
    /**
     * Updates critter state immediately
     */
    updateImmediate: (
      dispatch: React.Dispatch<GameAction>,
      state: CritterState
    ) => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
      }
      dispatch(gameActions.updateCritterState(state));
    },

    /**
     * Updates critter state with a delay
     */
    updateDelayed: (
      dispatch: React.Dispatch<GameAction>,
      state: CritterState,
      delayMs: number
    ) => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }

      currentTimeout = setTimeout(() => {
        dispatch(gameActions.updateCritterState(state));
        currentTimeout = null;
      }, delayMs);
    },

    /**
     * Handles prediction sequence with thinking -> result states
     */
    handlePredictionSequence: (
      dispatch: React.Dispatch<GameAction>,
      testResult: TestResult,
      thinkingDurationMs: number = 1000
    ) => {
      // Immediately show thinking
      dispatch(gameActions.updateCritterState('THINKING'));

      // After delay, show result
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }

      currentTimeout = setTimeout(() => {
        const resultState = testResult.isCorrect
          ? 'HAPPY'
          : 'CONFUSED';
        dispatch(gameActions.updateCritterState(resultState));
        currentTimeout = null;
      }, thinkingDurationMs);
    },

    /**
     * Cleanup function to clear any pending timeouts
     */
    cleanup: () => {
      if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
      }
    },
  };
}

/**
 * Game state integration utilities for React components
 */
export const gameStateIntegration = {
  /**
   * Gets the appropriate critter state for current game state
   */
  getCritterState: (gameState: GameState): CritterState => {
    // Use explicit critter state if set, otherwise derive from phase
    return (
      gameState.critterState ||
      getCritterStateForPhase(gameState.phase)
    );
  },

  /**
   * Checks if critter should show loading animation
   */
  isLoading: (gameState: GameState): boolean => {
    return (
      gameState.phase === 'LOADING_MODEL' ||
      gameState.critterState === 'LOADING_MODEL'
    );
  },

  /**
   * Checks if critter should show thinking animation
   */
  isThinking: (gameState: GameState): boolean => {
    return gameState.critterState === 'THINKING';
  },

  /**
   * Gets animation duration based on game config
   */
  getAnimationDuration: (
    config: GameConfig = DEFAULT_GAME_CONFIG
  ): number => {
    return config.animationDuration;
  },

  /**
   * Determines if critter should celebrate based on recent performance
   */
  shouldCelebrate: (gameState: GameState): boolean => {
    if (
      gameState.phase !== 'TESTING_PHASE' &&
      gameState.phase !== 'RESULTS_SUMMARY'
    ) {
      return false;
    }

    const scoreData = getScoreDisplayData(gameState.testResults);
    return scoreData.streak >= 3 || scoreData.accuracy >= 0.8;
  },
};
