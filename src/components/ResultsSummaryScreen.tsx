/**
 * ResultsSummaryScreen Component
 * Displays final accuracy score and educational insights after testing phase
 */

import { AppColors } from '@assets/index'
import type { TestResult, TrainingExample } from '@/types/mlTypes'
import type React from 'react'
import { useEffect, useRef } from 'react'
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { AnimatedCritter } from './AnimatedCritter'
import { CelebratoryEffects } from './CelebratoryEffects'
import { EducationalInsights } from './EducationalInsights'
import { MistakeAnalysis } from './MistakeAnalysis'

interface ResultsSummaryScreenProps {
  testResults: TestResult[]
  trainingData: TrainingExample[]
  critterColor: string
  onRestart: () => void
}

/**
 * ResultsSummaryScreen Component
 *
 * Displays final accuracy score and provides restart functionality.
 * Requirements: 3.5, 5.3
 */
export const ResultsSummaryScreen: React.FC<ResultsSummaryScreenProps> = ({
  testResults,
  trainingData,
  critterColor,
  onRestart,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current

  // Calculate accuracy metrics
  const correctPredictions = testResults.filter(
    (result) => result.isCorrect
  ).length
  const totalPredictions = testResults.length
  const accuracyPercentage =
    totalPredictions > 0
      ? Math.round((correctPredictions / totalPredictions) * 100)
      : 0

  // Determine critter state based on accuracy
  const getCritterState = () => {
    if (accuracyPercentage >= 80) return 'HAPPY'
    if (accuracyPercentage >= 60) return 'IDLE'
    return 'CONFUSED'
  }

  // Determine performance message
  const getPerformanceMessage = () => {
    if (accuracyPercentage >= 90)
      return 'Excellent! Your critter learned really well!'
    if (accuracyPercentage >= 80)
      return 'Great job! Your critter is getting smart!'
    if (accuracyPercentage >= 60) return 'Good work! Your critter is learning!'
    if (accuracyPercentage >= 40)
      return 'Not bad! Your critter needs more practice.'
    return 'Keep trying! Your critter is still learning.'
  }

  // Start entrance animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start()
  }, [fadeAnim, slideAnim, scaleAnim])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Animated.View
        style={[
          styles.resultsCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Celebratory effects for high accuracy */}
{accuracyPercentage >= 80 && (
          <CelebratoryEffects
            trigger={true}
            accuracy={accuracyPercentage / 100}
            streak={0}
            milestone={'High Accuracy'}
            onComplete={() => {}}
          />
        )}

        {/* Title */}
        <Text style={styles.title}>Game Complete!</Text>

        {/* Critter display */}
        <View style={styles.critterContainer}>
          <AnimatedCritter
            state={getCritterState()}
            critterColor={critterColor}
          />
        </View>

        {/* Accuracy score display */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Final Accuracy</Text>
          <Text style={styles.scoreValue}>{accuracyPercentage}%</Text>
          <Text style={styles.scoreDetails}>
            {correctPredictions} out of {totalPredictions} correct
          </Text>
        </View>

        {/* Performance message */}
        <Text style={styles.performanceMessage}>{getPerformanceMessage()}</Text>

        {/* Detailed results */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Results Breakdown</Text>
          {testResults.map((result, index) => (
            <View key={result.id} style={styles.resultItem}>
              <Text style={styles.resultIndex}>#{index + 1}</Text>
              <Text
                style={[
                  styles.resultStatus,
                  result.isCorrect ? styles.correct : styles.incorrect,
                ]}
              >
                {result.isCorrect ? '✓' : '✗'}
              </Text>
              <Text style={styles.resultLabel}>
                Predicted: {result.predictedLabel}
              </Text>
              <Text style={styles.resultConfidence}>
                {Math.round(result.confidence * 100)}% confident
              </Text>
            </View>
          ))}
        </View>

        {/* Educational insights about AI bias and training data diversity */}
        <EducationalInsights
          trainingData={trainingData}
          testResults={testResults}
          critterColor={critterColor}
        />

        {/* Mistake analysis with explanations */}
        <MistakeAnalysis
          trainingData={trainingData}
          testResults={testResults}
        />

        {/* Restart button */}
        <TouchableOpacity
          style={styles.restartButton}
          onPress={onRestart}
          activeOpacity={0.8}
        >
          <Text style={styles.restartButtonText}>Play Again</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  resultsCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  critterContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: 'rgba(162, 232, 91, 0.1)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: AppColors.cogniGreen,
  },
  scoreLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.8,
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 48,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.cogniGreen,
    marginBottom: 5,
  },
  scoreDetails: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.7,
  },
  performanceMessage: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    marginVertical: 20,
    lineHeight: 24,
  },
  detailsContainer: {
    width: '100%',
    marginTop: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 2,
    backgroundColor: 'rgba(245, 245, 245, 0.05)',
    borderRadius: 8,
  },
  resultIndex: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.6,
    width: 30,
  },
  resultStatus: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    width: 25,
    textAlign: 'center',
  },
  correct: {
    color: AppColors.cogniGreen,
  },
  incorrect: {
    color: AppColors.actionPink,
  },
  resultLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    flex: 1,
    marginLeft: 10,
  },
  resultConfidence: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.6,
  },
  restartButton: {
    backgroundColor: AppColors.cogniGreen,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  restartButtonText: {
    fontSize: 18,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.background,
    textAlign: 'center',
  },
})
