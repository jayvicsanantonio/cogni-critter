/**
 * TestingPhase Component
 * Handles the testing phase where the critter attempts to classify images using ML predictions
 */

import { AppColors } from '@assets/index'
import { mlService } from '@services/MLService'
import type { CritterState, ImageLabel } from '@/types/coreTypes'
import type { ImageItem, TestResult } from '@/types/mlTypes'
import {
  type CelebrationTrigger,
  celebrationManager,
} from '@utils/celebrationManager'
import {
  type CritterMood,
  critterEmotionalStateManager,
} from '@utils/critterEmotionalStateManager'
import {
  calculateTestingProgress,
  createProgressDisplayData,
} from '@utils/phaseProgressTracker'
import type React from 'react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Alert, Animated, StyleSheet, Text, View } from 'react-native'
import { AnimatedCritter } from './AnimatedCritter'
import { CelebratoryEffects } from './CelebratoryEffects'
import { ImageCard } from './ImageCard'
import { ProgressIndicator } from './ProgressIndicator'
import { ScoreCounter } from './ScoreCounter'
import { SortingBin } from './SortingBin'

interface TestingPhaseProps {
  images: ImageItem[]
  currentImageIndex: number
  testResults: TestResult[]
  critterColor: string
  onPredictionStart: () => void
  onPredictionComplete: (result: TestResult) => void
  onComplete: () => void
  maxPredictionTime?: number
}

/**
 * TestingPhase Component
 *
 * Manages the testing phase where the critter uses ML to classify images.
 * Implements critter thinking animation during prediction processing.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2
 */
export const TestingPhase: React.FC<TestingPhaseProps> = ({
  images,
  currentImageIndex,
  testResults,
  critterColor,
  onPredictionStart,
  onPredictionComplete,
  onComplete,
  maxPredictionTime = 1000,
}) => {
  // Generate unique IDs for bins
  const appleBinId = useId()
  const notAppleBinId = useId()

  // Component state
  const [critterState, setCritterState] = useState<CritterState>('IDLE')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentPrediction, setCurrentPrediction] = useState<{
    predictedLabel: ImageLabel
    confidence: number
  } | null>(null)

  // Celebration state
  const [celebrationTrigger, setCelebrationTrigger] =
    useState<CelebrationTrigger | null>(null)
  const [showCelebration, setShowCelebration] = useState(false)

  // Enhanced emotional state
  const [currentMood, setCurrentMood] = useState<CritterMood | null>(null)

  // Enhanced critter state management function (Requirement 4.1, 4.2, 5.1)
  const updateCritterStateWithContext = (
    testResult: TestResult,
    allResults: TestResult[]
  ): CritterState => {
    // Use enhanced emotional state manager
    const mood = critterEmotionalStateManager.handlePredictionResult(
      testResult,
      allResults
    )
    setCurrentMood(mood)

    console.log(
      `Critter mood updated: ${mood.state} (${mood.intensity}) - ${mood.reason}`
    )

    return mood.state
  }

  // Animation values for smooth image-to-bin animations
  const imagePosition = useRef(new Animated.Value(0)).current
  const imageOpacity = useRef(new Animated.Value(1)).current
  const imageScale = useRef(new Animated.Value(1)).current

  // Ref for prediction timing
  const predictionStartTime = useRef<number>(0)

  // Get current image
  const currentImage = images[currentImageIndex]
  const isLastImage = currentImageIndex >= images.length - 1

  /**
   * Animate image moving to the predicted bin with enhanced visual effects
   * Requirement 3.3: Smooth image-to-bin animations based on predictions
   */
  const animateImageToBin = (predictedLabel: ImageLabel): Promise<void> => {
    return new Promise((resolve) => {
      // Determine target position based on prediction
      // More precise positioning to align with actual bin locations
      const targetX = predictedLabel === 'apple' ? 120 : -120 // Right for apple, left for not-apple

      // Create a more sophisticated animation sequence with scale effects
      const moveAnimation = Animated.sequence([
        // First phase: Quick movement toward bin with slight scale up
        Animated.parallel([
          Animated.timing(imagePosition, {
            toValue: targetX * 0.7, // 70% of the way first
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(imageOpacity, {
            toValue: 0.8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(imageScale, {
            toValue: 1.1, // Slightly larger during movement
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        // Second phase: Final positioning with bounce and scale down
        Animated.parallel([
          Animated.spring(imagePosition, {
            toValue: targetX,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(imageOpacity, {
            toValue: 0.4,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(imageScale, {
            toValue: 0.8, // Smaller at final position
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ])

      moveAnimation.start(() => {
        // Add a brief pause to show the final position
        setTimeout(() => {
          resolve()
        }, 300)
      })
    })
  }

  /**
   * Reset animation values for next image
   */
  const resetForNextImage = () => {
    setIsProcessing(false)
    setCurrentPrediction(null)
    setCritterState('IDLE')

    // Reset all animation values
    imagePosition.setValue(0)
    imageOpacity.setValue(1)
    imageScale.setValue(1)
  }

  // Setup emotional state manager
  useEffect(() => {
    const managerId = 'testing_phase'

    critterEmotionalStateManager.onMoodChange(managerId, (mood) => {
      setCurrentMood(mood)
    })

    return () => {
      critterEmotionalStateManager.offMoodChange(managerId)
    }
  }, [])

  // Update overall mood based on all test results
  useEffect(() => {
    if (testResults.length > 0) {
      critterEmotionalStateManager.updateMood(testResults)
    }
  }, [testResults])

  // No timeout cleanup needed; MLService handles prediction timeouts internally

  /**
   * Start ML prediction process with thinking animation
   * Requirement 3.1: Critter thinking animation during prediction processing
   */
  const startPrediction = useCallback(async () => {
    if (!currentImage || isProcessing) return

    setIsProcessing(true)
    predictionStartTime.current = Date.now()

    // Notify parent that prediction is starting
    onPredictionStart()

    // Set critter to thinking state (Requirement 4.1)
    setCritterState('THINKING')

    try {
      // Verify ML service is ready for classification
      if (!mlService.isReadyForClassification()) {
        throw new Error(
          'ML service not ready for classification. Please complete training first.'
        )
      }

      // Start ML prediction with built-in timeout handling
      // Pass maxPredictionTime through to ensure a single source of truth for timeouts
      const classificationResult = await mlService
        .classifyImage(currentImage.uri, maxPredictionTime)
        .catch((error) => {
          // Wrap ML service errors for better handling
          throw new Error(`ML prediction failed: ${error.message}`)
        })

      // Validate classification result format
      if (
        !Array.isArray(classificationResult) ||
        classificationResult.length !== 2
      ) {
        throw new Error('Invalid classification result format')
      }

      // Process prediction result with validation
      const [appleConfidence, notAppleConfidence] = classificationResult

      // Validate confidence values (Requirement 3.4: prediction result evaluation)
      if (
        Number.isNaN(appleConfidence) ||
        Number.isNaN(notAppleConfidence) ||
        appleConfidence < 0 ||
        appleConfidence > 1 ||
        notAppleConfidence < 0 ||
        notAppleConfidence > 1
      ) {
        throw new Error('Invalid confidence values in classification result')
      }

      // Determine predicted label based on higher confidence
      const predictedLabel: ImageLabel =
        appleConfidence > notAppleConfidence ? 'apple' : 'not_apple'
      const confidence = Math.max(appleConfidence, notAppleConfidence)

      // Store prediction for animation
      setCurrentPrediction({ predictedLabel, confidence })

      // Calculate prediction time
      const predictionTime = Date.now() - predictionStartTime.current

      // Create comprehensive test result (Requirement 3.4: prediction result evaluation and scoring logic)
      const testResult: TestResult = {
        id: `test_${currentImage.id}_${Date.now()}`,
        imageUri: currentImage.uri,
        trueLabel: currentImage.label,
        predictedLabel,
        confidence,
        isCorrect: predictedLabel === currentImage.label,
        predictionTime,
      }

      // Log detailed prediction results for analysis
      console.log(`Prediction completed in ${predictionTime}ms:`, {
        image: currentImage.id,
        predicted: predictedLabel,
        actual: currentImage.label,
        confidence: confidence.toFixed(3),
        correct: testResult.isCorrect,
        appleConf: appleConfidence.toFixed(3),
        notAppleConf: notAppleConfidence.toFixed(3),
      })

      // Update critter state based on accuracy with enhanced logic (Requirement 4.1, 4.2, 5.1)
      const updatedResults = [...testResults, testResult]
      const resultState = updateCritterStateWithContext(
        testResult,
        updatedResults
      )

      // Add a brief delay to show thinking state before result for better UX
      setTimeout(() => {
        setCritterState(resultState)
      }, 500) // Half second delay to show thinking animation

      // Animate image to appropriate bin (Requirement 3.3)
      await animateImageToBin(predictedLabel)

      // Notify parent of prediction completion
      onPredictionComplete(testResult)

      // Check for celebrations after adding the result
      const updatedTestResults = [...testResults, testResult]
      const celebrations = celebrationManager.updateResults(
        updatedTestResults,
        images.length
      )

      if (celebrations.length > 0) {
        // Trigger the most significant celebration
        const mostSignificant = celebrations.reduce((prev, current) => {
          const intensityOrder = {
            low: 1,
            medium: 2,
            high: 3,
            epic: 4,
          }
          return intensityOrder[current.intensity] >
            intensityOrder[prev.intensity]
            ? current
            : prev
        })

        setCelebrationTrigger(mostSignificant)
        setShowCelebration(true)
      }

      // Move to next image or complete testing
      setTimeout(() => {
        if (isLastImage) {
          onComplete()
        } else {
          // Reset for next image
          resetForNextImage()
        }
      }, 1500) // Allow time to see the result
    } catch (error) {
      console.error('Prediction failed:', error)

      // Handle timeout or other errors

      // Set critter to confused state on error
      setCritterState('CONFUSED')

      // Create fallback result for timeout
      const predictionTime = Date.now() - predictionStartTime.current
      const fallbackResult: TestResult = {
        id: `test_${currentImage.id}_${Date.now()}_timeout`,
        imageUri: currentImage.uri,
        trueLabel: currentImage.label,
        predictedLabel: 'not_apple', // Default fallback
        confidence: 0.5, // Low confidence for timeout
        isCorrect: currentImage.label === 'not_apple',
        predictionTime,
      }

      onPredictionComplete(fallbackResult)

      // Show error message
      Alert.alert(
        'Prediction Error',
        'The critter had trouble with this image. Moving to the next one.',
        [{ text: 'OK' }]
      )

      setTimeout(() => {
        if (isLastImage) {
          onComplete()
        } else {
          resetForNextImage()
        }
      }, 1500)
    }
  }, [
    currentImage,
    isProcessing,
    onPredictionStart,
    setCritterState,
    mlService,
    maxPredictionTime,
    animateImageToBin,
    testResults,
    updateCritterStateWithContext,
    onPredictionComplete,
    celebrationManager,
    images.length,
    isLastImage,
    onComplete,
    resetForNextImage,
  ])

  // Start prediction when image changes
  useEffect(() => {
    if (currentImage && !isProcessing) {
      startPrediction()
    }
  }, [currentImage, isProcessing, startPrediction])

  // Handle celebration completion
  const handleCelebrationComplete = () => {
    setShowCelebration(false)
    setCelebrationTrigger(null)
  }

  // Calculate comprehensive progress with metrics
  const testingProgress = calculateTestingProgress(testResults, images.length)
  const progressDisplay = createProgressDisplayData(testingProgress)
  const progress = testingProgress.percentage

  if (!currentImage) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Testing Complete!</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Testing Phase</Text>
        <Text style={styles.subtitle}>Watch your critter classify images!</Text>
        <ProgressIndicator
          progress={progress}
          total={images.length}
          current={testResults.length}
          label="images tested"
        />

        {/* Enhanced Progress Status */}
        <View style={styles.progressStatus}>
          <Text style={styles.progressMessage}>{progressDisplay.message}</Text>
          {testingProgress.currentStreak > 1 && (
            <Text style={styles.streakIndicator}>
              🔥 {testingProgress.currentStreak} correct in a row!
            </Text>
          )}
        </View>
      </View>

      {/* Critter Display */}
      <View style={styles.critterContainer}>
        <AnimatedCritter
          state={critterState}
          critterColor={critterColor}
          animationDuration={250}
        />
        {isProcessing && <Text style={styles.processingText}>Thinking...</Text>}
        {currentPrediction && (
          <Text style={styles.predictionText}>
            I think it's{' '}
            {currentPrediction.predictedLabel === 'apple'
              ? 'an apple'
              : 'not an apple'}
            !{'\n'}Confidence: {Math.round(currentPrediction.confidence * 100)}%
          </Text>
        )}
        {currentMood && (
          <Text style={styles.moodText}>{currentMood.reason}</Text>
        )}
      </View>

      {/* Image and Bins */}
      <View style={styles.gameArea}>
        {/* Sorting Bins with Enhanced Highlighting */}
        <View style={styles.binsContainer}>
          <SortingBin
            id={notAppleBinId}
            label="Not Apple"
            onDrop={() => {}} // Not interactive in testing phase
            highlighted={
              currentPrediction?.predictedLabel === 'not_apple' && !isProcessing
            }
          />
          <SortingBin
            id={appleBinId}
            label="Apple"
            onDrop={() => {}} // Not interactive in testing phase
            highlighted={
              currentPrediction?.predictedLabel === 'apple' && !isProcessing
            }
          />
        </View>

        {/* Image Card with Enhanced Animation */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [{ translateX: imagePosition }, { scale: imageScale }],
              opacity: imageOpacity,
            },
          ]}
        >
          <ImageCard
            imageUri={currentImage.uri}
            onSort={() => {}} // Not interactive in testing phase
            disabled={true}
          />
        </Animated.View>
      </View>

      {/* Real-time Score Counter with Enhanced Metrics */}
      <ScoreCounter
        testResults={testResults}
        totalTests={images.length}
        animated={true}
        showStreak={true}
        showAccuracy={true}
        showMetrics={true}
      />

      {/* Celebratory Effects */}
      <CelebratoryEffects
        trigger={showCelebration}
        accuracy={testingProgress.accuracy}
        streak={testingProgress.currentStreak}
        milestone={celebrationTrigger?.message}
        onComplete={handleCelebrationComplete}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.8,
    marginBottom: 16,
  },
  critterContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  processingText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.primary,
    marginTop: 10,
    textAlign: 'center',
  },
  predictionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 20,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  binsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  imageContainer: {
    alignItems: 'center',
  },
  progressStatus: {
    alignItems: 'center',
    marginTop: 8,
  },
  progressMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.8,
    textAlign: 'center',
  },
  streakIndicator: {
    fontSize: 12,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.accent,
    marginTop: 4,
    textAlign: 'center',
  },
  moodText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
})
