/**
 * ScoreCounter Component
 * Real-time score tracking and display for testing phase
 */

import { AppColors } from '@assets/index'
import type { TestResult } from '@/types/mlTypes'
import type React from 'react'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'

interface ScoreCounterProps {
  testResults: TestResult[]
  totalTests: number
  animated?: boolean
  showStreak?: boolean
  showAccuracy?: boolean
  showMetrics?: boolean
}

/**
 * ScoreCounter Component
 *
 * Displays real-time score updates during testing phase with animations
 * and comprehensive metrics display.
 *
 * Requirements: 5.1, 5.2 - Real-time score counter updates and display
 */
export const ScoreCounter: React.FC<ScoreCounterProps> = ({
  testResults,
  totalTests,
  animated = true,
  showStreak = true,
  showAccuracy = true,
  showMetrics = false,
}) => {
  // Animation values
  const scoreScale = useRef(new Animated.Value(1)).current
  const accuracyOpacity = useRef(new Animated.Value(0)).current
  const streakBounce = useRef(new Animated.Value(0)).current

  // Calculate score metrics
  const correctCount = testResults.filter((r) => r.isCorrect).length
  const accuracy =
    testResults.length > 0 ? correctCount / testResults.length : 0

  // Calculate current streak (consecutive correct from the end)
  let currentStreak = 0
  for (let i = testResults.length - 1; i >= 0; i--) {
    if (testResults[i].isCorrect) {
      currentStreak++
    } else {
      break
    }
  }

  // Get last result for animation triggers
  const lastResult =
    testResults.length > 0 ? testResults[testResults.length - 1] : null

  // Animate score updates
  useEffect(() => {
    if (animated && testResults.length > 0) {
      // Animate score counter on new result
      Animated.sequence([
        Animated.timing(scoreScale, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scoreScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start()

      // Show accuracy with fade in
      if (showAccuracy) {
        Animated.timing(accuracyOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start()
      }
    }
  }, [testResults.length, accuracyOpacity, animated, scoreScale, showAccuracy])

  // Animate streak updates
  useEffect(() => {
    if (animated && showStreak && currentStreak > 1) {
      Animated.sequence([
        Animated.timing(streakBounce, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(streakBounce, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    }
  }, [currentStreak, animated, showStreak, streakBounce])

  // Calculate additional metrics if requested
  const averageConfidence =
    testResults.length > 0
      ? testResults.reduce((sum, r) => sum + r.confidence, 0) /
        testResults.length
      : 0

  const averageTime =
    testResults.length > 0
      ? testResults.reduce((sum, r) => sum + r.predictionTime, 0) /
        testResults.length
      : 0

  return (
    <View style={styles.container}>
      {/* Main Score Display */}
      <Animated.View
        style={[
          styles.scoreContainer,
          {
            transform: [{ scale: scoreScale }],
          },
        ]}
      >
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.scoreText}>
          {correctCount} / {testResults.length}
        </Text>
        {totalTests > testResults.length && (
          <Text style={styles.remainingText}>of {totalTests} total</Text>
        )}
      </Animated.View>

      {/* Accuracy Display */}
      {showAccuracy && testResults.length > 0 && (
        <Animated.View
          style={[
            styles.accuracyContainer,
            {
              opacity: accuracyOpacity,
            },
          ]}
        >
          <Text style={styles.accuracyLabel}>Accuracy</Text>
          <Text
            style={[
              styles.accuracyText,
              accuracy >= 0.8 && styles.highAccuracy,
              accuracy < 0.5 && styles.lowAccuracy,
            ]}
          >
            {Math.round(accuracy * 100)}%
          </Text>
        </Animated.View>
      )}

      {/* Streak Display */}
      {showStreak && currentStreak > 1 && (
        <Animated.View
          style={[
            styles.streakContainer,
            {
              transform: [
                {
                  scale: streakBounce.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.streakText}>🔥 {currentStreak} streak!</Text>
        </Animated.View>
      )}

      {/* Last Result Indicator */}
      {lastResult && (
        <View style={styles.lastResultContainer}>
          <View
            style={[
              styles.resultIndicator,
              lastResult.isCorrect
                ? styles.correctIndicator
                : styles.incorrectIndicator,
            ]}
          />
          <Text style={styles.lastResultText}>
            {lastResult.isCorrect ? 'Correct!' : 'Incorrect'}
          </Text>
          <Text style={styles.confidenceText}>
            {Math.round(lastResult.confidence * 100)}% confident
          </Text>
        </View>
      )}

      {/* Detailed Metrics */}
      {showMetrics && testResults.length > 0 && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Avg Confidence</Text>
            <Text style={styles.metricValue}>
              {Math.round(averageConfidence * 100)}%
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Avg Time</Text>
            <Text style={styles.metricValue}>{Math.round(averageTime)}ms</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    marginVertical: 8,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.7,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 28,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.primary,
  },
  remainingText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.6,
    marginTop: 2,
  },
  accuracyContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  accuracyLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.7,
  },
  accuracyText: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
  },
  highAccuracy: {
color: AppColors.primary,
  },
  lowAccuracy: {
    color: AppColors.error || AppColors.accent,
  },
  streakContainer: {
    backgroundColor: AppColors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  streakText: {
    fontSize: 14,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.background,
  },
  lastResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.text,
  },
  resultIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  correctIndicator: {
backgroundColor: AppColors.primary,
  },
  incorrectIndicator: {
    backgroundColor: AppColors.error || AppColors.accent,
  },
  lastResultText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    marginRight: 8,
  },
  confidenceText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.6,
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: AppColors.text,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.6,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
  },
})
