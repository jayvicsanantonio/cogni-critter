import type { TrainingExample } from '@types/mlTypes'

/**
 * Progress Tracking Utilities
 *
 * Provides comprehensive progress tracking for the teaching phase
 * with visual indicators and milestone management.
 *
 * Requirements: 2.4, 5.4
 */

export interface ProgressState {
  current: number
  minimum: number
  maximum: number
  percentage: number
  isMinimumReached: boolean
  isMaximumReached: boolean
  remainingToMinimum: number
  remainingToMaximum: number
}

export interface ProgressMilestone {
  id: string
  threshold: number
  label: string
  description: string
  isReached: boolean
  color: string
}

/**
 * Calculates current progress state
 */
export function calculateProgress(
  current: number,
  minimum: number = 5,
  maximum: number = 10
): ProgressState {
  const percentage = Math.min((current / minimum) * 100, 100)
  const isMinimumReached = current >= minimum
  const isMaximumReached = current >= maximum
  const remainingToMinimum = Math.max(minimum - current, 0)
  const remainingToMaximum = Math.max(maximum - current, 0)

  return {
    current,
    minimum,
    maximum,
    percentage,
    isMinimumReached,
    isMaximumReached,
    remainingToMinimum,
    remainingToMaximum,
  }
}

/**
 * Gets progress milestones with current status
 */
export function getProgressMilestones(
  current: number,
  minimum: number = 5,
  maximum: number = 10
): ProgressMilestone[] {
  return [
    {
      id: 'start',
      threshold: 1,
      label: 'First Example',
      description: 'Great start! Your critter is beginning to learn.',
      isReached: current >= 1,
      color: '#4D96FF', // Spark Blue
    },
    {
      id: 'quarter',
      threshold: Math.ceil(minimum * 0.25),
      label: 'Getting Started',
      description: 'Your critter is starting to understand patterns.',
      isReached: current >= Math.ceil(minimum * 0.25),
      color: '#FFD644', // Glow Yellow
    },
    {
      id: 'half',
      threshold: Math.ceil(minimum * 0.5),
      label: 'Halfway There',
      description: 'Your critter is learning quickly!',
      isReached: current >= Math.ceil(minimum * 0.5),
      color: '#F037A5', // Action Pink
    },
    {
      id: 'minimum',
      threshold: minimum,
      label: 'Ready to Test',
      description: 'Your critter has enough examples to start testing!',
      isReached: current >= minimum,
      color: '#A2E85B', // Cogni Green
    },
    {
      id: 'maximum',
      threshold: maximum,
      label: 'Expert Level',
      description: 'Your critter has learned from the maximum examples!',
      isReached: current >= maximum,
      color: '#A2E85B', // Cogni Green (brighter)
    },
  ]
}

/**
 * Gets the next milestone to reach
 */
export function getNextMilestone(
  current: number,
  minimum: number = 5,
  maximum: number = 10
): ProgressMilestone | null {
  const milestones = getProgressMilestones(current, minimum, maximum)
  return milestones.find((milestone) => !milestone.isReached) || null
}

/**
 * Gets the most recently reached milestone
 */
export function getLastReachedMilestone(
  current: number,
  minimum: number = 5,
  maximum: number = 10
): ProgressMilestone | null {
  const milestones = getProgressMilestones(current, minimum, maximum)
  const reachedMilestones = milestones.filter(
    (milestone) => milestone.isReached
  )
  return reachedMilestones[reachedMilestones.length - 1] || null
}

/**
 * Generates progress message based on current state
 */
export function getProgressMessage(
  current: number,
  minimum: number = 5,
  maximum: number = 10
): string {
  const progress = calculateProgress(current, minimum, maximum)

  if (progress.isMaximumReached) {
    return 'Perfect! Your critter has learned from the maximum number of examples.'
  }

  if (progress.isMinimumReached) {
    return `Great job! Your critter is ready to test. You can add ${progress.remainingToMaximum} more examples or start testing.`
  }

  if (current === 0) {
    return 'Start teaching your critter by sorting some images!'
  }

  return `Keep going! Add ${progress.remainingToMinimum} more examples to reach the minimum for testing.`
}

/**
 * Calculates training data balance and quality metrics
 */
export function analyzeTrainingQuality(trainingData: TrainingExample[]): {
  balance: number // 0-1, where 1 is perfectly balanced
  diversity: number // 0-1, based on variety of examples
  quality: 'poor' | 'fair' | 'good' | 'excellent'
  suggestions: string[]
} {
  if (trainingData.length === 0) {
    return {
      balance: 0,
      diversity: 0,
      quality: 'poor',
      suggestions: ['Start by adding some training examples'],
    }
  }

  const appleCount = trainingData.filter(
    (ex) => ex.userLabel === 'apple'
  ).length
  const notAppleCount = trainingData.filter(
    (ex) => ex.userLabel === 'not_apple'
  ).length
  const total = trainingData.length

  // Calculate balance (closer to 50/50 is better)
  const appleRatio = appleCount / total
  const balance = 1 - Math.abs(0.5 - appleRatio) * 2

  // Calculate diversity (placeholder - in real implementation would analyze image features)
  const diversity = Math.min(total / 10, 1) // Simple diversity based on total count

  // Determine quality
  let quality: 'poor' | 'fair' | 'good' | 'excellent'
  if (balance > 0.8 && diversity > 0.8) quality = 'excellent'
  else if (balance > 0.6 && diversity > 0.6) quality = 'good'
  else if (balance > 0.4 && diversity > 0.4) quality = 'fair'
  else quality = 'poor'

  // Generate suggestions
  const suggestions: string[] = []

  if (appleCount === 0) {
    suggestions.push(
      'Add some apple examples to teach your critter what apples look like'
    )
  } else if (notAppleCount === 0) {
    suggestions.push(
      'Add some non-apple examples to teach your critter what is NOT an apple'
    )
  } else if (appleRatio > 0.8) {
    suggestions.push('Try adding more non-apple examples for better balance')
  } else if (appleRatio < 0.2) {
    suggestions.push('Try adding more apple examples for better balance')
  }

  if (total < 5) {
    suggestions.push(
      `Add ${5 - total} more examples to reach the minimum for testing`
    )
  }

  if (suggestions.length === 0) {
    suggestions.push('Great balance! Your training data looks good.')
  }

  return {
    balance,
    diversity,
    quality,
    suggestions,
  }
}

/**
 * Tracks progress events for analytics and feedback
 */
export class ProgressTracker {
  private events: Array<{
    timestamp: number
    type: 'example_added' | 'milestone_reached' | 'phase_completed'
    data:
      | { label: string; imageId: string } // example_added
      | { milestoneId: string; threshold: number; label: string } // milestone_reached
      | { finalCount: number; reason: 'minimum_reached' | 'maximum_reached' } // phase_completed
  }> = []

  /**
   * Records when a training example is added
   */
  recordExampleAdded(example: TrainingExample): void {
    this.events.push({
      timestamp: Date.now(),
      type: 'example_added',
      data: {
        label: example.userLabel,
        imageId: example.id,
      },
    })
  }

  /**
   * Records when a milestone is reached
   */
  recordMilestoneReached(milestone: ProgressMilestone): void {
    this.events.push({
      timestamp: Date.now(),
      type: 'milestone_reached',
      data: {
        milestoneId: milestone.id,
        threshold: milestone.threshold,
        label: milestone.label,
      },
    })
  }

  /**
   * Records when teaching phase is completed
   */
  recordPhaseCompleted(
    finalCount: number,
    reason: 'minimum_reached' | 'maximum_reached'
  ): void {
    this.events.push({
      timestamp: Date.now(),
      type: 'phase_completed',
      data: {
        finalCount,
        reason,
      },
    })
  }

  /**
   * Gets all recorded events
   */
  getEvents(): typeof this.events {
    return [...this.events]
  }

  /**
   * Gets session statistics
   */
  getSessionStats(): {
    totalExamples: number
    sessionDuration: number
    milestonesReached: number
    averageTimePerExample: number
  } {
    const exampleEvents = this.events.filter((e) => e.type === 'example_added')
    const milestoneEvents = this.events.filter(
      (e) => e.type === 'milestone_reached'
    )

    const sessionStart = this.events[0]?.timestamp || Date.now()
    const sessionEnd =
      this.events[this.events.length - 1]?.timestamp || Date.now()
    const sessionDuration = sessionEnd - sessionStart

    return {
      totalExamples: exampleEvents.length,
      sessionDuration,
      milestonesReached: milestoneEvents.length,
      averageTimePerExample:
        exampleEvents.length > 0 ? sessionDuration / exampleEvents.length : 0,
    }
  }

  /**
   * Clears all events (for new session)
   */
  clear(): void {
    this.events = []
  }
}

/**
 * Visual progress indicators configuration
 */
export const PROGRESS_VISUAL_CONFIG = {
  colors: {
    incomplete: 'rgba(245, 245, 245, 0.2)',
    minimum: '#4D96FF', // Spark Blue
    complete: '#A2E85B', // Cogni Green
    maximum: '#A2E85B', // Cogni Green (same as complete)
  },
  animations: {
    duration: 300,
    easing: 'ease-in-out',
  },
  milestones: {
    size: 12,
    spacing: 8,
  },
} as const

/**
 * Gets appropriate color for progress state
 */
export function getProgressColor(
  current: number,
  minimum: number,
  maximum: number
): string {
  if (current >= maximum) return PROGRESS_VISUAL_CONFIG.colors.maximum
  if (current >= minimum) return PROGRESS_VISUAL_CONFIG.colors.complete
  return PROGRESS_VISUAL_CONFIG.colors.incomplete
}

/**
 * Calculates visual progress percentage for animations
 */
export function getVisualProgress(
  current: number,
  minimum: number,
  maximum: number
): {
  toMinimum: number
  toMaximum: number
  overall: number
} {
  const toMinimum = Math.min(current / minimum, 1)
  const toMaximum = current / maximum
  const overall = current / maximum

  return {
    toMinimum,
    toMaximum,
    overall,
  }
}
