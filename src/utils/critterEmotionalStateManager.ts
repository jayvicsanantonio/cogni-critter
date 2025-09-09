/**
 * Critter Emotional State Manager
 * Enhanced critter state management based on scoring performance and context
 */

import type { CritterState } from '@types/coreTypes'
import type { TestResult } from '@types/mlTypes'

export interface EmotionalContext {
  accuracy: number
  streak: number
  recentPerformance: boolean[] // Last 3-5 results
  totalTests: number
  isImproving: boolean
  confidenceLevel: number
}

export interface CritterMood {
  state: CritterState
  intensity: 'low' | 'medium' | 'high'
  duration: number // How long to show this state
  reason: string // Why this state was chosen
}

/**
 * Calculate emotional context from test results
 */
export function calculateEmotionalContext(
  testResults: TestResult[]
): EmotionalContext {
  if (testResults.length === 0) {
    return {
      accuracy: 0,
      streak: 0,
      recentPerformance: [],
      totalTests: 0,
      isImproving: false,
      confidenceLevel: 0,
    }
  }

  const correctCount = testResults.filter((r) => r.isCorrect).length
  const accuracy = correctCount / testResults.length

  // Calculate current streak
  let streak = 0
  for (let i = testResults.length - 1; i >= 0; i--) {
    if (testResults[i].isCorrect) {
      streak++
    } else {
      break
    }
  }

  // Get recent performance (last 3-5 results)
  const recentCount = Math.min(5, testResults.length)
  const recentPerformance = testResults
    .slice(-recentCount)
    .map((r) => r.isCorrect)

  // Check if improving (compare first half vs second half)
  let isImproving = false
  if (testResults.length >= 4) {
    const midPoint = Math.floor(testResults.length / 2)
    const firstHalf = testResults.slice(0, midPoint)
    const secondHalf = testResults.slice(midPoint)

    const firstHalfAccuracy =
      firstHalf.filter((r) => r.isCorrect).length / firstHalf.length
    const secondHalfAccuracy =
      secondHalf.filter((r) => r.isCorrect).length / secondHalf.length

    isImproving = secondHalfAccuracy > firstHalfAccuracy
  }

  // Calculate average confidence
  const confidenceLevel =
    testResults.reduce((sum, r) => sum + r.confidence, 0) / testResults.length

  return {
    accuracy,
    streak,
    recentPerformance,
    totalTests: testResults.length,
    isImproving,
    confidenceLevel,
  }
}

/**
 * Determine critter mood based on emotional context
 */
export function determineCritterMood(context: EmotionalContext): CritterMood {
  const { accuracy, streak, recentPerformance, isImproving, confidenceLevel } =
    context

  // Perfect performance
  if (accuracy === 1.0 && context.totalTests >= 3) {
    return {
      state: 'HAPPY',
      intensity: 'high',
      duration: 3000,
      reason: 'Perfect score achieved!',
    }
  }

  // Long streak
  if (streak >= 5) {
    return {
      state: 'HAPPY',
      intensity: 'high',
      duration: 2500,
      reason: `Amazing ${streak} streak!`,
    }
  }

  // High accuracy with good confidence
  if (accuracy >= 0.8 && confidenceLevel >= 0.7) {
    return {
      state: 'HAPPY',
      intensity: 'medium',
      duration: 2000,
      reason: 'Excellent performance with high confidence',
    }
  }

  // Improving trend
  if (isImproving && accuracy >= 0.6) {
    return {
      state: 'HAPPY',
      intensity: 'medium',
      duration: 1500,
      reason: 'Performance is improving!',
    }
  }

  // Recent good performance
  if (recentPerformance.length >= 3) {
    const recentCorrect = recentPerformance.filter(Boolean).length
    const recentAccuracy = recentCorrect / recentPerformance.length

    if (recentAccuracy >= 0.8) {
      return {
        state: 'HAPPY',
        intensity: 'low',
        duration: 1500,
        reason: 'Recent performance is good',
      }
    }
  }

  // Moderate performance
  if (accuracy >= 0.5 && accuracy < 0.8) {
    if (streak >= 2) {
      return {
        state: 'HAPPY',
        intensity: 'low',
        duration: 1000,
        reason: 'Decent performance with some success',
      }
    } else {
      return {
        state: 'IDLE',
        intensity: 'medium',
        duration: 1000,
        reason: 'Moderate performance, staying focused',
      }
    }
  }

  // Poor recent performance but overall not terrible
  if (accuracy >= 0.3) {
    const recentCorrect = recentPerformance.filter(Boolean).length
    if (recentCorrect === 0 && recentPerformance.length >= 2) {
      return {
        state: 'CONFUSED',
        intensity: 'medium',
        duration: 2000,
        reason: 'Struggling with recent questions',
      }
    } else {
      return {
        state: 'CONFUSED',
        intensity: 'low',
        duration: 1500,
        reason: 'Having some difficulty',
      }
    }
  }

  // Very poor performance
  return {
    state: 'CONFUSED',
    intensity: 'high',
    duration: 2500,
    reason: 'Needs more practice and learning',
  }
}

/**
 * Get critter state for individual prediction result with context
 */
export function getCritterStateForPredictionWithContext(
  testResult: TestResult,
  allResults: TestResult[]
): CritterMood {
  // Immediate reaction to this specific result
  if (testResult.isCorrect) {
    // Check if this extends a streak
    let streak = 1
    for (let i = allResults.length - 2; i >= 0; i--) {
      if (allResults[i].isCorrect) {
        streak++
      } else {
        break
      }
    }

    if (streak >= 3) {
      return {
        state: 'HAPPY',
        intensity: 'high',
        duration: 2000,
        reason: `Correct! ${streak} in a row!`,
      }
    } else if (testResult.confidence >= 0.8) {
      return {
        state: 'HAPPY',
        intensity: 'medium',
        duration: 1500,
        reason: 'Correct with high confidence!',
      }
    } else {
      return {
        state: 'HAPPY',
        intensity: 'low',
        duration: 1000,
        reason: 'Correct answer!',
      }
    }
  } else {
    // Incorrect answer - consider context
    const recentMistakes = allResults
      .slice(-3)
      .filter((r) => !r.isCorrect).length

    if (recentMistakes >= 2) {
      return {
        state: 'CONFUSED',
        intensity: 'high',
        duration: 2500,
        reason: 'Multiple recent mistakes',
      }
    } else if (testResult.confidence >= 0.7) {
      return {
        state: 'CONFUSED',
        intensity: 'medium',
        duration: 2000,
        reason: 'Wrong but was confident - learning needed',
      }
    } else {
      return {
        state: 'CONFUSED',
        intensity: 'low',
        duration: 1500,
        reason: 'Incorrect answer',
      }
    }
  }
}

/**
 * Enhanced critter emotional state manager class
 */
export class CritterEmotionalStateManager {
  private currentMood: CritterMood | null = null
  private moodHistory: CritterMood[] = []
  private callbacks: Map<string, (mood: CritterMood) => void> = new Map()

  /**
   * Register callback for mood changes
   */
  onMoodChange(id: string, callback: (mood: CritterMood) => void) {
    this.callbacks.set(id, callback)
  }

  /**
   * Unregister callback
   */
  offMoodChange(id: string) {
    this.callbacks.delete(id)
  }

  /**
   * Update critter mood based on test results
   */
  updateMood(testResults: TestResult[]): CritterMood {
    const context = calculateEmotionalContext(testResults)
    const newMood = determineCritterMood(context)

    // Only update if mood actually changed or intensity increased
    if (
      !this.currentMood ||
      this.currentMood.state !== newMood.state ||
      this.currentMood.intensity !== newMood.intensity
    ) {
      this.currentMood = newMood
      this.moodHistory.push(newMood)

      // Keep only last 10 moods in history
      if (this.moodHistory.length > 10) {
        this.moodHistory = this.moodHistory.slice(-10)
      }

      // Trigger callbacks
      this.callbacks.forEach((callback) => {
        callback(newMood)
      })
    }

    return newMood
  }

  /**
   * Handle individual prediction result
   */
  handlePredictionResult(
    testResult: TestResult,
    allResults: TestResult[]
  ): CritterMood {
    const predictionMood = getCritterStateForPredictionWithContext(
      testResult,
      allResults
    )

    this.currentMood = predictionMood
    this.moodHistory.push(predictionMood)

    // Keep only last 10 moods in history
    if (this.moodHistory.length > 10) {
      this.moodHistory = this.moodHistory.slice(-10)
    }

    // Trigger callbacks
    this.callbacks.forEach((callback) => {
      callback(predictionMood)
    })

    return predictionMood
  }

  /**
   * Get current mood
   */
  getCurrentMood(): CritterMood | null {
    return this.currentMood
  }

  /**
   * Get mood history
   */
  getMoodHistory(): CritterMood[] {
    return [...this.moodHistory]
  }

  /**
   * Reset mood state (for new game)
   */
  reset() {
    this.currentMood = null
    this.moodHistory = []
  }

  /**
   * Get mood statistics
   */
  getMoodStats() {
    if (this.moodHistory.length === 0) {
      return {
        dominantMood: 'IDLE' as CritterState,
        moodChanges: 0,
        averageDuration: 0,
        emotionalStability: 1, // 0-1, higher is more stable
      }
    }

    // Count mood occurrences
    const moodCounts = this.moodHistory.reduce(
      (counts, mood) => {
        counts[mood.state] = (counts[mood.state] || 0) + 1
        return counts
      },
      {} as Record<CritterState, number>
    )

    // Find dominant mood
    const dominantMood = Object.entries(moodCounts).sort(
      ([, a], [, b]) => b - a
    )[0][0] as CritterState

    // Calculate mood changes
    let moodChanges = 0
    for (let i = 1; i < this.moodHistory.length; i++) {
      if (this.moodHistory[i].state !== this.moodHistory[i - 1].state) {
        moodChanges++
      }
    }

    // Calculate average duration
    const averageDuration =
      this.moodHistory.reduce((sum, mood) => sum + mood.duration, 0) /
      this.moodHistory.length

    // Calculate emotional stability (fewer mood changes = more stable)
    const emotionalStability = Math.max(
      0,
      1 - moodChanges / this.moodHistory.length
    )

    return {
      dominantMood,
      moodChanges,
      averageDuration,
      emotionalStability,
    }
  }
}

/**
 * Singleton instance
 */
export const critterEmotionalStateManager = new CritterEmotionalStateManager()
