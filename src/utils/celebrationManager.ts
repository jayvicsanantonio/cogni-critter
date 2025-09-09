/**
 * Celebration Manager
 * Manages when and what type of celebrations should be triggered
 */

import type { TestResult } from '@types/mlTypes'

export interface CelebrationTrigger {
  type: 'accuracy' | 'streak' | 'milestone' | 'perfect_game' | 'improvement'
  intensity: 'low' | 'medium' | 'high' | 'epic'
  message: string
  shouldTrigger: boolean
  data?: Record<string, unknown>
}

export interface CelebrationState {
  lastAccuracy: number
  lastStreak: number
  bestAccuracy: number
  longestStreak: number
  milestonesReached: Set<string>
  totalCelebrations: number
}

/**
 * Calculate current streak from test results
 */
function calculateStreak(testResults: TestResult[]): number {
  let streak = 0
  for (let i = testResults.length - 1; i >= 0; i--) {
    if (testResults[i].isCorrect) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * Calculate accuracy from test results
 */
function calculateAccuracy(testResults: TestResult[]): number {
  if (testResults.length === 0) return 0
  const correct = testResults.filter((r) => r.isCorrect).length
  return correct / testResults.length
}

/**
 * Check if accuracy milestone should be celebrated
 */
function checkAccuracyMilestone(
  accuracy: number,
  lastAccuracy: number,
  milestonesReached: Set<string>
): CelebrationTrigger | null {
  const milestones = [
    {
      threshold: 0.5,
      key: 'accuracy_50',
      message: 'Over 50% accuracy!',
      intensity: 'low' as const,
    },
    {
      threshold: 0.7,
      key: 'accuracy_70',
      message: 'Great! 70% accuracy!',
      intensity: 'medium' as const,
    },
    {
      threshold: 0.8,
      key: 'accuracy_80',
      message: 'Excellent! 80% accuracy!',
      intensity: 'high' as const,
    },
    {
      threshold: 0.9,
      key: 'accuracy_90',
      message: 'Outstanding! 90% accuracy!',
      intensity: 'epic' as const,
    },
    {
      threshold: 1.0,
      key: 'accuracy_100',
      message: 'PERFECT SCORE! 🌟',
      intensity: 'epic' as const,
    },
  ]

  for (const milestone of milestones) {
    if (
      accuracy >= milestone.threshold &&
      lastAccuracy < milestone.threshold &&
      !milestonesReached.has(milestone.key)
    ) {
      return {
        type: 'accuracy',
        intensity: milestone.intensity,
        message: milestone.message,
        shouldTrigger: true,
        data: { accuracy, milestone: milestone.key },
      }
    }
  }

  return null
}

/**
 * Check if streak milestone should be celebrated
 */
function checkStreakMilestone(
  streak: number,
  lastStreak: number,
  milestonesReached: Set<string>
): CelebrationTrigger | null {
  const milestones = [
    {
      threshold: 3,
      key: 'streak_3',
      message: '3 in a row! 🔥',
      intensity: 'medium' as const,
    },
    {
      threshold: 5,
      key: 'streak_5',
      message: '5 streak! Amazing! 🔥🔥',
      intensity: 'high' as const,
    },
    {
      threshold: 7,
      key: 'streak_7',
      message: '7 streak! Incredible! 🔥🔥🔥',
      intensity: 'epic' as const,
    },
    {
      threshold: 10,
      key: 'streak_10',
      message: '10 STREAK! LEGENDARY! 🔥🔥🔥🔥',
      intensity: 'epic' as const,
    },
  ]

  for (const milestone of milestones) {
    if (
      streak >= milestone.threshold &&
      lastStreak < milestone.threshold &&
      !milestonesReached.has(milestone.key)
    ) {
      return {
        type: 'streak',
        intensity: milestone.intensity,
        message: milestone.message,
        shouldTrigger: true,
        data: { streak, milestone: milestone.key },
      }
    }
  }

  return null
}

/**
 * Check for perfect game celebration
 */
function checkPerfectGame(
  testResults: TestResult[],
  totalTests: number,
  milestonesReached: Set<string>
): CelebrationTrigger | null {
  if (
    testResults.length === totalTests &&
    testResults.length > 0 &&
    testResults.every((r) => r.isCorrect) &&
    !milestonesReached.has('perfect_game')
  ) {
    return {
      type: 'perfect_game',
      intensity: 'epic',
      message: 'PERFECT GAME! Every single one correct! 🏆',
      shouldTrigger: true,
      data: { totalTests },
    }
  }

  return null
}

/**
 * Check for improvement celebration
 */
function checkImprovement(
  accuracy: number,
  bestAccuracy: number,
  streak: number,
  longestStreak: number
): CelebrationTrigger | null {
  // Significant accuracy improvement
  if (accuracy > bestAccuracy + 0.2 && accuracy >= 0.6) {
    return {
      type: 'improvement',
      intensity: 'medium',
      message: `New personal best! ${Math.round(accuracy * 100)}% accuracy!`,
      shouldTrigger: true,
      data: { accuracy, improvement: accuracy - bestAccuracy },
    }
  }

  // New longest streak
  if (streak > longestStreak && streak >= 3) {
    return {
      type: 'improvement',
      intensity: 'high',
      message: `New longest streak! ${streak} correct in a row!`,
      shouldTrigger: true,
      data: { streak, previousBest: longestStreak },
    }
  }

  return null
}

/**
 * Main celebration manager class
 */
export class CelebrationManager {
  private state: CelebrationState = {
    lastAccuracy: 0,
    lastStreak: 0,
    bestAccuracy: 0,
    longestStreak: 0,
    milestonesReached: new Set(),
    totalCelebrations: 0,
  }

  private callbacks: Map<string, (trigger: CelebrationTrigger) => void> =
    new Map()

  /**
   * Register callback for celebration events
   */
  onCelebration(id: string, callback: (trigger: CelebrationTrigger) => void) {
    this.callbacks.set(id, callback)
  }

  /**
   * Unregister callback
   */
  offCelebration(id: string) {
    this.callbacks.delete(id)
  }

  /**
   * Update with new test results and check for celebrations
   */
  updateResults(
    testResults: TestResult[],
    totalTests: number
  ): CelebrationTrigger[] {
    const accuracy = calculateAccuracy(testResults)
    const streak = calculateStreak(testResults)

    const triggers: CelebrationTrigger[] = []

    // Check all celebration types
    const accuracyTrigger = checkAccuracyMilestone(
      accuracy,
      this.state.lastAccuracy,
      this.state.milestonesReached
    )
    if (accuracyTrigger) triggers.push(accuracyTrigger)

    const streakTrigger = checkStreakMilestone(
      streak,
      this.state.lastStreak,
      this.state.milestonesReached
    )
    if (streakTrigger) triggers.push(streakTrigger)

    const perfectGameTrigger = checkPerfectGame(
      testResults,
      totalTests,
      this.state.milestonesReached
    )
    if (perfectGameTrigger) triggers.push(perfectGameTrigger)

    const improvementTrigger = checkImprovement(
      accuracy,
      this.state.bestAccuracy,
      streak,
      this.state.longestStreak
    )
    if (improvementTrigger) triggers.push(improvementTrigger)

    // Update state
    this.state.lastAccuracy = accuracy
    this.state.lastStreak = streak
    this.state.bestAccuracy = Math.max(this.state.bestAccuracy, accuracy)
    this.state.longestStreak = Math.max(this.state.longestStreak, streak)

    // Mark milestones as reached
    triggers.forEach((trigger) => {
      if (trigger.data?.milestone) {
        this.state.milestonesReached.add(trigger.data.milestone)
      }
      this.state.totalCelebrations++
    })

    // Trigger callbacks
    triggers.forEach((trigger) => {
      this.callbacks.forEach((callback) => {
        callback(trigger)
      })
    })

    return triggers
  }

  /**
   * Reset celebration state (for new game)
   */
  reset() {
    this.state = {
      lastAccuracy: 0,
      lastStreak: 0,
      bestAccuracy: this.state.bestAccuracy, // Keep best records
      longestStreak: this.state.longestStreak,
      milestonesReached: new Set(),
      totalCelebrations: 0,
    }
  }

  /**
   * Get current celebration state
   */
  getState(): Readonly<CelebrationState> {
    return { ...this.state }
  }

  /**
   * Check if a specific milestone has been reached
   */
  hasMilestone(milestone: string): boolean {
    return this.state.milestonesReached.has(milestone)
  }

  /**
   * Get celebration statistics
   */
  getStats() {
    return {
      totalCelebrations: this.state.totalCelebrations,
      milestonesReached: Array.from(this.state.milestonesReached),
      bestAccuracy: this.state.bestAccuracy,
      longestStreak: this.state.longestStreak,
    }
  }
}

/**
 * Create a singleton celebration manager instance
 */
export const celebrationManager = new CelebrationManager()
