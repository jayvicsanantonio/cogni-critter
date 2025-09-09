/**
 * Game State Manager Tests
 * Tests for the finite state machine logic and state transitions
 */

// Mock the type imports to avoid babel issues
const _mockGameState = {
  phase: 'INITIALIZING' as const,
  currentImageIndex: 0,
  trainingData: [],
  testResults: [],
  score: 0,
  critterState: 'IDLE' as const,
}

const _mockTrainingExample = {
  id: 'test-id',
  imageUri: 'test.jpg',
  userLabel: 'apple' as const,
  timestamp: Date.now(),
}

const _mockTestResult = {
  id: 'test-id',
  imageUri: 'test.jpg',
  trueLabel: 'apple' as const,
  predictedLabel: 'apple' as const,
  confidence: 0.9,
  isCorrect: true,
  predictionTime: 500,
}

import { describe, it } from '@jest/globals'
import type { GameState, TestResult, TrainingExample } from '@types/gameTypes'
import {
  calculateAccuracy,
  calculateScoreMetrics,
  createTestResult,
  createTrainingExample,
  gameActions,
  gameReducer,
  getCritterStateForPhase,
  initialGameState,
  isValidTransition,
  shouldTransitionToTesting,
} from '../gameStateManager'

describe('gameReducer', () => {
  it('should initialize game correctly', () => {
    const action = gameActions.initializeGame()
    const newState = gameReducer(initialGameState, action)

    expect(newState.phase).toBe('INITIALIZING')
    expect(newState.critterState).toBe('IDLE')
    expect(newState.trainingData).toEqual([])
    expect(newState.testResults).toEqual([])
    expect(newState.score).toBe(0)
  })

  it('should transition from INITIALIZING to LOADING_MODEL', () => {
    const state: GameState = {
      ...initialGameState,
      phase: 'INITIALIZING',
    }
    const action = gameActions.startModelLoading()
    const newState = gameReducer(state, action)

    expect(newState.phase).toBe('LOADING_MODEL')
    expect(newState.critterState).toBe('LOADING_MODEL')
  })

  it('should transition from LOADING_MODEL to TEACHING_PHASE', () => {
    const state: GameState = {
      ...initialGameState,
      phase: 'LOADING_MODEL',
    }
    const action = gameActions.modelLoaded()
    const newState = gameReducer(state, action)

    expect(newState.phase).toBe('TEACHING_PHASE')
    expect(newState.critterState).toBe('IDLE')
    expect(newState.currentImageIndex).toBe(0)
  })

  it('should add training examples during TEACHING_PHASE', () => {
    const state: GameState = {
      ...initialGameState,
      phase: 'TEACHING_PHASE',
    }
    const trainingExample = createTrainingExample('test.jpg', 'apple')
    const action = gameActions.addTrainingExample(trainingExample)
    const newState = gameReducer(state, action)

    expect(newState.trainingData).toHaveLength(1)
    expect(newState.trainingData[0]).toEqual(trainingExample)
  })

  it('should transition from TEACHING_PHASE to TESTING_PHASE', () => {
    const state: GameState = {
      ...initialGameState,
      phase: 'TEACHING_PHASE',
    }
    const action = gameActions.startTestingPhase()
    const newState = gameReducer(state, action)

    expect(newState.phase).toBe('TESTING_PHASE')
    expect(newState.critterState).toBe('IDLE')
    expect(newState.currentImageIndex).toBe(0)
    expect(newState.testResults).toEqual([])
    expect(newState.score).toBe(0)
  })

  it('should handle test results and update score', () => {
    const state: GameState = {
      ...initialGameState,
      phase: 'TESTING_PHASE',
    }
    const testResult = createTestResult('test.jpg', 'apple', 'apple', 0.9, 500)
    const action = gameActions.addTestResult(testResult)
    const newState = gameReducer(state, action)

    expect(newState.testResults).toHaveLength(1)
    expect(newState.score).toBe(1)
    expect(newState.critterState).toBe('HAPPY')
  })

  it('should handle incorrect predictions', () => {
    const state: GameState = {
      ...initialGameState,
      phase: 'TESTING_PHASE',
    }
    const testResult = createTestResult(
      'test.jpg',
      'apple',
      'not_apple',
      0.6,
      500
    )
    const action = gameActions.addTestResult(testResult)
    const newState = gameReducer(state, action)

    expect(newState.testResults).toHaveLength(1)
    expect(newState.score).toBe(0)
    expect(newState.critterState).toBe('CONFUSED')
  })
})

describe('State Validation', () => {
  it('should validate correct transitions', () => {
    expect(isValidTransition('INITIALIZING', 'LOADING_MODEL')).toBe(true)
    expect(isValidTransition('LOADING_MODEL', 'TEACHING_PHASE')).toBe(true)
    expect(isValidTransition('TEACHING_PHASE', 'TESTING_PHASE')).toBe(true)
    expect(isValidTransition('TESTING_PHASE', 'RESULTS_SUMMARY')).toBe(true)
    expect(isValidTransition('RESULTS_SUMMARY', 'TEACHING_PHASE')).toBe(true)
  })

  it('should reject invalid transitions', () => {
    expect(isValidTransition('INITIALIZING', 'TESTING_PHASE')).toBe(false)
    expect(isValidTransition('TEACHING_PHASE', 'RESULTS_SUMMARY')).toBe(false)
    expect(isValidTransition('LOADING_MODEL', 'RESULTS_SUMMARY')).toBe(false)
  })
})

describe('Training Data Management', () => {
  it('should create training examples correctly', () => {
    const example = createTrainingExample('test.jpg', 'apple', 'test-id')

    expect(example.id).toBe('test-id')
    expect(example.imageUri).toBe('test.jpg')
    expect(example.userLabel).toBe('apple')
    expect(example.timestamp).toBeGreaterThan(0)
  })

  it('should determine when to transition to testing', () => {
    const trainingData: TrainingExample[] = [
      createTrainingExample('1.jpg', 'apple'),
      createTrainingExample('2.jpg', 'apple'),
      createTrainingExample('3.jpg', 'not_apple'),
      createTrainingExample('4.jpg', 'not_apple'),
      createTrainingExample('5.jpg', 'apple'),
    ]

    expect(shouldTransitionToTesting(trainingData)).toBe(true)
    expect(shouldTransitionToTesting(trainingData.slice(0, 3))).toBe(false)
  })
})

describe('Scoring Logic', () => {
  it('should calculate accuracy correctly', () => {
    const testResults: TestResult[] = [
      createTestResult('1.jpg', 'apple', 'apple', 0.9, 500),
      createTestResult('2.jpg', 'apple', 'not_apple', 0.6, 500),
      createTestResult('3.jpg', 'not_apple', 'not_apple', 0.8, 500),
      createTestResult('4.jpg', 'not_apple', 'apple', 0.7, 500),
    ]

    expect(calculateAccuracy(testResults)).toBe(0.5)
  })

  it('should calculate comprehensive metrics', () => {
    const testResults: TestResult[] = [
      createTestResult('1.jpg', 'apple', 'apple', 0.9, 500),
      createTestResult('2.jpg', 'apple', 'apple', 0.8, 600),
      createTestResult('3.jpg', 'not_apple', 'not_apple', 0.7, 400),
    ]

    const metrics = calculateScoreMetrics(testResults)

    expect(metrics.accuracy).toBe(1.0)
    expect(metrics.correctCount).toBe(3)
    expect(metrics.totalCount).toBe(3)
    expect(metrics.performanceGrade).toBe('A')
    expect(metrics.isHighPerformance).toBe(true)
  })
})

describe('Critter State Integration', () => {
  it('should map phases to critter states correctly', () => {
    expect(getCritterStateForPhase('INITIALIZING')).toBe('IDLE')
    expect(getCritterStateForPhase('LOADING_MODEL')).toBe('LOADING_MODEL')
    expect(getCritterStateForPhase('TEACHING_PHASE')).toBe('IDLE')
    expect(getCritterStateForPhase('TESTING_PHASE')).toBe('THINKING')
    expect(getCritterStateForPhase('RESULTS_SUMMARY')).toBe('HAPPY')
  })

  it('should detect loading and thinking states', () => {
    const loadingState: GameState = {
      ...initialGameState,
      phase: 'LOADING_MODEL',
    }
    const thinkingState: GameState = {
      ...initialGameState,
      critterState: 'THINKING',
    }

    expect(gameStateIntegration.isLoading(loadingState)).toBe(true)
    expect(gameStateIntegration.isThinking(thinkingState)).toBe(true)
  })
})
