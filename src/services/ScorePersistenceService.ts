/**
 * Score Persistence Service
 * Handles saving and loading of game scores and session data
 */

// Mock AsyncStorage implementation - replace with @react-native-async-storage/async-storage in production
const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    // In production, this would use actual AsyncStorage
    // For now, return null to simulate empty storage
    console.log(`AsyncStorage.getItem called with key: ${key}`)
    return null
  },

  async setItem(key: string, value: string): Promise<void> {
    // In production, this would use actual AsyncStorage
    console.log(
      `AsyncStorage.setItem called with key: ${key}, value length: ${value.length}`
    )
  },

  async removeItem(key: string): Promise<void> {
    // In production, this would use actual AsyncStorage
    console.log(`AsyncStorage.removeItem called with key: ${key}`)
  },
}

import type { TestResult } from '@types/mlTypes'

export interface GameSession {
  id: string
  timestamp: number
  duration: number // in milliseconds
  totalTests: number
  correctAnswers: number
  accuracy: number
  averageConfidence: number
  averageResponseTime: number
  longestStreak: number
  testResults: TestResult[]
  critterColor: string
  trainingDataCount: number
}

export interface ScoreStats {
  totalSessions: number
  totalTests: number
  totalCorrect: number
  overallAccuracy: number
  bestAccuracy: number
  bestStreak: number
  averageSessionDuration: number
  improvementTrend: number // Positive = improving, negative = declining
  lastPlayedDate: number
  favoriteColor: string
}

export interface SessionSummary {
  recent: GameSession[]
  best: GameSession
  stats: ScoreStats
  achievements: string[]
}

const STORAGE_KEYS = {
  SESSIONS: '@cognicritter_sessions',
  STATS: '@cognicritter_stats',
  ACHIEVEMENTS: '@cognicritter_achievements',
} as const

/**
 * Score Persistence Service
 *
 * Manages game session data persistence and statistics tracking.
 * Requirements: 5.1, 5.2 - Score persistence and session tracking
 */
export class ScorePersistenceService {
  private static instance: ScorePersistenceService

  private constructor() {}

  static getInstance(): ScorePersistenceService {
    if (!ScorePersistenceService.instance) {
      ScorePersistenceService.instance = new ScorePersistenceService()
    }
    return ScorePersistenceService.instance
  }

  /**
   * Save a completed game session
   */
  async saveSession(session: GameSession): Promise<void> {
    try {
      // Get existing sessions
      const sessions = await this.getSessions()

      // Add new session
      sessions.push(session)

      // Keep only last 50 sessions to manage storage
      const recentSessions = sessions
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50)

      // Save sessions
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSIONS,
        JSON.stringify(recentSessions)
      )

      // Update stats
      await this.updateStats(recentSessions)

      console.log('Session saved successfully:', session.id)
    } catch (error) {
      console.error('Failed to save session:', error)
      throw new Error('Failed to save game session')
    }
  }

  /**
   * Get all saved sessions
   */
  async getSessions(): Promise<GameSession[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS)
      if (!sessionsJson) return []

      const sessions = JSON.parse(sessionsJson) as GameSession[]
      return sessions.sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      console.error('Failed to load sessions:', error)
      return []
    }
  }

  /**
   * Get current statistics
   */
  async getStats(): Promise<ScoreStats> {
    try {
      const statsJson = await AsyncStorage.getItem(STORAGE_KEYS.STATS)
      if (!statsJson) {
        return this.getDefaultStats()
      }

      return JSON.parse(statsJson) as ScoreStats
    } catch (error) {
      console.error('Failed to load stats:', error)
      return this.getDefaultStats()
    }
  }

  /**
   * Get session summary with recent sessions, best performance, and stats
   */
  async getSessionSummary(): Promise<SessionSummary> {
    try {
      const [sessions, stats, achievements] = await Promise.all([
        this.getSessions(),
        this.getStats(),
        this.getAchievements(),
      ])

      const recent = sessions.slice(0, 10) // Last 10 sessions
      const best = sessions.reduce((prev, current) => {
        if (!prev) return current

        // Best is determined by accuracy first, then streak
        if (current.accuracy > prev.accuracy) return current
        if (
          current.accuracy === prev.accuracy &&
          current.longestStreak > prev.longestStreak
        ) {
          return current
        }
        return prev
      }, sessions[0])

      return {
        recent,
        best,
        stats,
        achievements,
      }
    } catch (error) {
      console.error('Failed to get session summary:', error)
      throw new Error('Failed to load session summary')
    }
  }

  /**
   * Create a game session from test results
   */
  createSession(
    testResults: TestResult[],
    critterColor: string,
    trainingDataCount: number,
    startTime: number
  ): GameSession {
    const endTime = Date.now()
    const duration = endTime - startTime

    const correctAnswers = testResults.filter((r) => r.isCorrect).length
    const accuracy =
      testResults.length > 0 ? correctAnswers / testResults.length : 0

    const averageConfidence =
      testResults.length > 0
        ? testResults.reduce((sum, r) => sum + r.confidence, 0) /
          testResults.length
        : 0

    const averageResponseTime =
      testResults.length > 0
        ? testResults.reduce((sum, r) => sum + r.predictionTime, 0) /
          testResults.length
        : 0

    // Calculate longest streak
    let longestStreak = 0
    let currentStreak = 0
    for (const result of testResults) {
      if (result.isCorrect) {
        currentStreak++
        longestStreak = Math.max(longestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    return {
      id: `session_${endTime}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: endTime,
      duration,
      totalTests: testResults.length,
      correctAnswers,
      accuracy,
      averageConfidence,
      averageResponseTime,
      longestStreak,
      testResults,
      critterColor,
      trainingDataCount,
    }
  }

  /**
   * Get achievements
   */
  async getAchievements(): Promise<string[]> {
    try {
      const achievementsJson = await AsyncStorage.getItem(
        STORAGE_KEYS.ACHIEVEMENTS
      )
      return achievementsJson ? JSON.parse(achievementsJson) : []
    } catch (error) {
      console.error('Failed to load achievements:', error)
      return []
    }
  }

  /**
   * Add achievement
   */
  async addAchievement(achievement: string): Promise<void> {
    try {
      const achievements = await this.getAchievements()
      if (!achievements.includes(achievement)) {
        achievements.push(achievement)
        await AsyncStorage.setItem(
          STORAGE_KEYS.ACHIEVEMENTS,
          JSON.stringify(achievements)
        )
      }
    } catch (error) {
      console.error('Failed to save achievement:', error)
    }
  }

  /**
   * Clear all data (for testing or reset)
   */
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS),
        AsyncStorage.removeItem(STORAGE_KEYS.STATS),
        AsyncStorage.removeItem(STORAGE_KEYS.ACHIEVEMENTS),
      ])
      console.log('All score data cleared')
    } catch (error) {
      console.error('Failed to clear data:', error)
      throw new Error('Failed to clear score data')
    }
  }

  /**
   * Export data for backup
   */
  async exportData(): Promise<string> {
    try {
      const [sessions, stats, achievements] = await Promise.all([
        this.getSessions(),
        this.getStats(),
        this.getAchievements(),
      ])

      const exportData = {
        sessions,
        stats,
        achievements,
        exportDate: Date.now(),
        version: '1.0',
      }

      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      console.error('Failed to export data:', error)
      throw new Error('Failed to export score data')
    }
  }

  /**
   * Import data from backup
   */
  async importData(dataJson: string): Promise<void> {
    try {
      const data = JSON.parse(dataJson)

      // Validate data structure
      if (!data.sessions || !data.stats || !data.achievements) {
        throw new Error('Invalid data format')
      }

      // Save imported data
      await Promise.all([
        AsyncStorage.setItem(
          STORAGE_KEYS.SESSIONS,
          JSON.stringify(data.sessions)
        ),
        AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats)),
        AsyncStorage.setItem(
          STORAGE_KEYS.ACHIEVEMENTS,
          JSON.stringify(data.achievements)
        ),
      ])

      console.log('Data imported successfully')
    } catch (error) {
      console.error('Failed to import data:', error)
      throw new Error('Failed to import score data')
    }
  }

  /**
   * Update statistics based on sessions
   */
  private async updateStats(sessions: GameSession[]): Promise<void> {
    if (sessions.length === 0) return

    const totalTests = sessions.reduce((sum, s) => sum + s.totalTests, 0)
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0)
    const overallAccuracy = totalTests > 0 ? totalCorrect / totalTests : 0

    const bestAccuracy = Math.max(...sessions.map((s) => s.accuracy))
    const bestStreak = Math.max(...sessions.map((s) => s.longestStreak))

    const averageSessionDuration =
      sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length

    // Calculate improvement trend (last 5 vs previous 5 sessions)
    let improvementTrend = 0
    if (sessions.length >= 10) {
      const recent5 = sessions.slice(0, 5)
      const previous5 = sessions.slice(5, 10)

      const recentAvg = recent5.reduce((sum, s) => sum + s.accuracy, 0) / 5
      const previousAvg = previous5.reduce((sum, s) => sum + s.accuracy, 0) / 5

      improvementTrend = recentAvg - previousAvg
    }

    // Find most used critter color
    const colorCounts = sessions.reduce(
      (counts, session) => {
        counts[session.critterColor] = (counts[session.critterColor] || 0) + 1
        return counts
      },
      {} as Record<string, number>
    )

    const favoriteColor =
      Object.entries(colorCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'default'

    const stats: ScoreStats = {
      totalSessions: sessions.length,
      totalTests,
      totalCorrect,
      overallAccuracy,
      bestAccuracy,
      bestStreak,
      averageSessionDuration,
      improvementTrend,
      lastPlayedDate: sessions[0].timestamp,
      favoriteColor,
    }

    await AsyncStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats))
  }

  /**
   * Get default stats for new users
   */
  private getDefaultStats(): ScoreStats {
    return {
      totalSessions: 0,
      totalTests: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
      bestAccuracy: 0,
      bestStreak: 0,
      averageSessionDuration: 0,
      improvementTrend: 0,
      lastPlayedDate: 0,
      favoriteColor: 'default',
    }
  }
}

/**
 * Singleton instance
 */
export const scorePersistenceService = ScorePersistenceService.getInstance()
