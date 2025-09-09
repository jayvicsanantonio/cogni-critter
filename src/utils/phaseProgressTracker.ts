/**
 * Phase Progress Tracker
 * Unified progress tracking for both teaching and testing phases
 */

import type { TestResult, TrainingExample } from '@types/mlTypes'

export interface PhaseProgress {
  current: number
  total: number
  percentage: number
  remaining: number
  isComplete: boolean
  phase: 'teaching' | 'testing'
}

export interface TeachingProgress extends PhaseProgress {
  phase: 'teaching'
  minimum: number
  maximum: number
  canTransition: boolean
  mustTransition: boolean
  qualityScore: number
  balanceRatio: number
}

export interface TestingProgress extends PhaseProgress {
  phase: 'testing'
  accuracy: number
  correctCount: number
  averageConfidence: number
  currentStreak: number
}

/**
 * Calculate teaching phase progress with quality metrics
 */
export function calculateTeachingProgress(
  trainingData: TrainingExample[],
  config: { minImages: number; maxImages: number }
): TeachingProgress {
  const current = trainingData.length
  const minimum = config.minImages
  const maximum = config.maxImages

  const percentage = Math.min(current / minimum, 1)
  const remaining = Math.max(minimum - current, 0)
  const canTransition = current >= minimum
  const mustTransition = current >= maximum
  const isComplete = mustTransition

  // Calculate quality metrics
  const appleCount = trainingData.filter(
    (ex) => ex.userLabel === 'apple'
  ).length
  const _notAppleCount = trainingData.filter(
    (ex) => ex.userLabel === 'not_apple'
  ).length

  // Balance ratio (closer to 0.5 is better)
  const balanceRatio = current > 0 ? Math.abs(0.5 - appleCount / current) : 0

  // Quality score (0-1, higher is better)
  const diversityScore = current > 0 ? 1 - balanceRatio : 0
  const volumeScore = Math.min(current / minimum, 1)
  const qualityScore = (diversityScore + volumeScore) / 2

  return {
    phase: 'teaching',
    current,
    total: maximum,
    percentage,
    remaining,
    isComplete,
    minimum,
    maximum,
    canTransition,
    mustTransition,
    qualityScore,
    balanceRatio,
  }
}

/**
 * Calculate testing phase progress with performance metrics
 */
export function calculateTestingProgress(
  testResults: TestResult[],
  totalTests: number
): TestingProgress {
  const current = testResults.length
  const percentage = totalTests > 0 ? current / totalTests : 0
  const remaining = Math.max(totalTests - current, 0)
  const isComplete = current >= totalTests

  // Calculate performance metrics
  const correctCount = testResults.filter((r) => r.isCorrect).length
  const accuracy = current > 0 ? correctCount / current : 0

  const averageConfidence =
    current > 0
      ? testResults.reduce((sum, r) => sum + r.confidence, 0) / current
      : 0

  // Calculate current streak (consecutive correct from the end)
  let currentStreak = 0
  for (let i = testResults.length - 1; i >= 0; i--) {
    if (testResults[i].isCorrect) {
      currentStreak++
    } else {
      break
    }
  }

  return {
    phase: 'testing',
    current,
    total: totalTests,
    percentage,
    remaining,
    isComplete,
    accuracy,
    correctCount,
    averageConfidence,
    currentStreak,
  }
}

/**
 * Get progress message for teaching phase
 */
export function getTeachingProgressMessage(progress: TeachingProgress): string {
  if (progress.mustTransition) {
    return 'Maximum examples reached! Ready to test.'
  }

  if (progress.canTransition) {
    if (progress.qualityScore >= 0.7) {
      return 'Great balance! Ready to test or add more examples.'
    } else if (progress.balanceRatio > 0.3) {
      return 'Consider adding more variety for better balance.'
    } else {
      return 'Ready to test! You can add more examples if you want.'
    }
  }

  return `${progress.remaining} more example${
    progress.remaining === 1 ? '' : 's'
  } needed to start testing.`
}

/**
 * Get progress message for testing phase
 */
export function getTestingProgressMessage(progress: TestingProgress): string {
  if (progress.isComplete) {
    return 'Testing complete!'
  }

  const accuracyText =
    progress.current > 0
      ? ` (${Math.round(progress.accuracy * 100)}% accuracy)`
      : ''

  return `${progress.remaining} image${
    progress.remaining === 1 ? '' : 's'
  } remaining${accuracyText}`
}

/**
 * Get progress color based on phase and performance
 */
export function getProgressColor(progress: PhaseProgress): string {
  if (progress.phase === 'teaching') {
    const teachingProgress = progress as TeachingProgress
    if (teachingProgress.mustTransition) return '#A2E85B' // Cogni Green
    if (teachingProgress.canTransition) return '#4D96FF' // Spark Blue
    return '#F5F5F5' // Bright Cloud
  } else {
    const testingProgress = progress as TestingProgress
    if (testingProgress.accuracy >= 0.8) return '#A2E85B' // Cogni Green
    if (testingProgress.accuracy >= 0.6) return '#FFD644' // Glow Yellow
    if (testingProgress.accuracy >= 0.4) return '#F037A5' // Action Pink
    return '#F5F5F5' // Bright Cloud
  }
}

/**
 * Get progress status text
 */
export function getProgressStatus(progress: PhaseProgress): {
  status: 'excellent' | 'good' | 'fair' | 'needs_improvement'
  message: string
} {
  if (progress.phase === 'teaching') {
    const teachingProgress = progress as TeachingProgress

    if (teachingProgress.qualityScore >= 0.8) {
      return {
        status: 'excellent',
        message: 'Excellent training data quality!',
      }
    } else if (teachingProgress.qualityScore >= 0.6) {
      return {
        status: 'good',
        message: 'Good training data quality.',
      }
    } else if (teachingProgress.qualityScore >= 0.4) {
      return {
        status: 'fair',
        message: 'Fair training data quality.',
      }
    } else {
      return {
        status: 'needs_improvement',
        message: 'Consider adding more variety.',
      }
    }
  } else {
    const testingProgress = progress as TestingProgress

    if (testingProgress.accuracy >= 0.8) {
      return {
        status: 'excellent',
        message: 'Excellent performance!',
      }
    } else if (testingProgress.accuracy >= 0.6) {
      return { status: 'good', message: 'Good performance!' }
    } else if (testingProgress.accuracy >= 0.4) {
      return { status: 'fair', message: 'Fair performance.' }
    } else {
      return {
        status: 'needs_improvement',
        message: 'Keep learning!',
      }
    }
  }
}

/**
 * Create progress display data for UI components
 */
export function createProgressDisplayData(progress: PhaseProgress) {
  return {
    progress: progress.percentage,
    current: progress.current,
    total: progress.total,
    remaining: progress.remaining,
    message:
      progress.phase === 'teaching'
        ? getTeachingProgressMessage(progress as TeachingProgress)
        : getTestingProgressMessage(progress as TestingProgress),
    color: getProgressColor(progress),
    status: getProgressStatus(progress),
  }
}

/**
 * Enhanced progress tracker with animations and milestones
 */
export class EnhancedProgressTracker {
  private milestones: number[] = []
  private callbacks: Map<string, (progress: PhaseProgress) => void> = new Map()

  constructor(milestones: number[] = [0.25, 0.5, 0.75, 1.0]) {
    this.milestones = milestones
  }

  /**
   * Register callback for progress updates
   */
  onProgress(id: string, callback: (progress: PhaseProgress) => void) {
    this.callbacks.set(id, callback)
  }

  /**
   * Unregister callback
   */
  offProgress(id: string) {
    this.callbacks.delete(id)
  }

  /**
   * Update progress and trigger callbacks
   */
  updateProgress(progress: PhaseProgress) {
    // Check for milestone achievements
    const achievedMilestones = this.milestones.filter(
      (milestone) => progress.percentage >= milestone
    )

    // Trigger callbacks
    this.callbacks.forEach((callback) => {
      callback(progress)
    })

    return {
      progress,
      achievedMilestones,
      displayData: createProgressDisplayData(progress),
    }
  }

  /**
   * Get next milestone
   */
  getNextMilestone(currentProgress: number): number | null {
    const nextMilestone = this.milestones.find(
      (milestone) => milestone > currentProgress
    )
    return nextMilestone || null
  }

  /**
   * Calculate progress to next milestone
   */
  getProgressToNextMilestone(currentProgress: number): number {
    const nextMilestone = this.getNextMilestone(currentProgress)
    if (!nextMilestone) return 1

    const previousMilestone =
      this.milestones.filter((m) => m <= currentProgress).pop() || 0

    const segmentSize = nextMilestone - previousMilestone
    const progressInSegment = currentProgress - previousMilestone

    return progressInSegment / segmentSize
  }
}
