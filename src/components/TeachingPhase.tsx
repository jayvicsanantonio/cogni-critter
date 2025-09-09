import { AppColors } from '@assets/index'
import { TrainingDataService } from '@services/TrainingDataService'
import type { ImageLabel } from '@types/coreTypes'
import type { ImageItem, TrainingExample } from '@types/mlTypes'
import { UI_CONFIG } from '@utils/constants'
import {
  calculateTeachingProgress,
  createProgressDisplayData,
} from '@utils/phaseProgressTracker'
import {
  createPhaseTransitionHook,
  transitionTiming,
  transitionUI,
} from '@utils/phaseTransitionManager'
import {
  analyzeTrainingQuality,
  calculateProgress,
  getProgressMessage,
  ProgressTracker,
} from '@utils/progressTracker'
import type React from 'react'
import { useEffect, useState } from 'react'
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { AnimatedCritter } from './AnimatedCritter'
import { ProgressIndicator } from './ProgressIndicator'
import { SortingInterface } from './SortingInterface'

interface TeachingPhaseProps {
  images: ImageItem[]
  currentImageIndex: number
  trainingData: TrainingExample[]
  critterColor: string
  onSort: (imageUri: string, label: ImageLabel, imageId: string) => void
  onComplete: () => void
  minImages: number
  maxImages: number
}

/**
 * TeachingPhase Component
 *
 * Handles the teaching phase UI where users manually sort images
 * to train their CogniCritter. Features progress tracking and
 * automatic transition to testing phase.
 *
 * Requirements: 2.1, 2.6
 */
export const TeachingPhase: React.FC<TeachingPhaseProps> = ({
  images,
  currentImageIndex,
  trainingData,
  critterColor,
  onSort,
  onComplete,
  minImages,
  maxImages,
}) => {
  const [fadeAnim] = useState(new Animated.Value(1))
  const [slideAnim] = useState(new Animated.Value(0))
  const [progressTracker] = useState(() => new ProgressTracker())
  const [countdownTimer, setCountdownTimer] = useState<number | null>(null)

  // Phase transition management
  const transitionHook = createPhaseTransitionHook({
    minImages,
    maxImages,
    autoTransitionEnabled: true,
    transitionDelay: 3000, // 3 seconds
  })

  const currentImage = images[currentImageIndex]

  // Enhanced progress tracking
  const teachingProgress = calculateTeachingProgress(trainingData, {
    minImages,
    maxImages,
  })
  const progressDisplay = createProgressDisplayData(teachingProgress)

  // Legacy progress for existing functionality
  const progressState = calculateProgress(
    trainingData.length,
    minImages,
    maxImages
  )
  const _progressMessage = getProgressMessage(
    trainingData.length,
    minImages,
    maxImages
  )
  const qualityAnalysis = analyzeTrainingQuality(trainingData)
  const canComplete = progressState.isMinimumReached
  const mustComplete = progressState.isMaximumReached

  useEffect(() => {
    // Evaluate transition whenever training data changes
    const transitionResult = transitionHook.setupAutoTransition(
      trainingData,
      (nextPhase) => {
        if (nextPhase === 'TESTING_PHASE') {
          onComplete()
        }
      }
    )

    // Handle countdown for automatic transition
    if (transitionResult.shouldTransition && transitionResult.delay) {
      setCountdownTimer(transitionResult.delay)

      const cleanup = transitionTiming.createCountdown(
        transitionResult.delay,
        (remaining) => setCountdownTimer(remaining),
        () => setCountdownTimer(null)
      )

      return cleanup
    } else {
      setCountdownTimer(null)
    }

    // Cleanup on unmount
    return () => {
      transitionHook.cleanup()
    }
  }, [
    trainingData,
    onComplete,
    transitionHook.cleanup,
    transitionHook.setupAutoTransition,
  ])

  const handleSort = (binId: string) => {
    if (!currentImage) return

    const label: ImageLabel = binId === 'apple' ? 'apple' : 'not_apple'

    // Animate out current image
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: binId === 'apple' ? 100 : -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Create training example using TrainingDataService
      const trainingService = TrainingDataService.getInstance()
      const trainingExample = trainingService.handleUserSort(
        currentImage.uri,
        label,
        currentImage.id
      )

      // Track progress event
      progressTracker.recordExampleAdded(trainingExample)

      // Call parent sort handler
      onSort(currentImage.uri, label, currentImage.id)

      // Reset animations for next image
      fadeAnim.setValue(1)
      slideAnim.setValue(0)
    })
  }

  if (!currentImage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Teaching Complete!</Text>
          <Text style={styles.subtitle}>
            Your critter learned from {trainingData.length} examples
          </Text>
        </View>

        <View style={styles.critterContainer}>
          <AnimatedCritter state="HAPPY" critterColor={critterColor} />
        </View>

        <Text style={styles.readyText}>
          Ready to test what your critter learned!
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.title}>Teach Your Critter</Text>
        <Text style={styles.subtitle}>
          Sort images to help your critter learn
        </Text>

        {/* Progress indicator */}
        <ProgressIndicator
          current={trainingData.length}
          minimum={minImages}
          maximum={maxImages}
          showLabels={true}
          animated={true}
        />
      </View>

      {/* Critter display */}
      <View style={styles.critterContainer}>
        <AnimatedCritter state="IDLE" critterColor={critterColor} />
      </View>

      {/* Sorting interface */}
      <Animated.View
        style={[
          styles.sortingContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <SortingInterface
          imageUri={currentImage.uri}
          onSort={handleSort}
          disabled={false}
        />
      </Animated.View>

      {/* Instructions and feedback */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionText}>
          Drag the image to the correct bin to teach your critter
        </Text>

        {/* Enhanced Progress message */}
        <Text
          style={[
            styles.progressMessage,
            canComplete && styles.readyText,
            mustComplete && styles.completeText,
          ]}
        >
          {progressDisplay.message}
        </Text>

        {/* Quality indicator */}
        {teachingProgress.qualityScore > 0 && (
          <Text style={styles.qualityIndicator}>
            Quality: {Math.round(teachingProgress.qualityScore * 100)}%
            {teachingProgress.balanceRatio < 0.2 && ' ✓ Well balanced'}
          </Text>
        )}

        {/* Quality feedback */}
        {qualityAnalysis.suggestions.length > 0 && (
          <Text style={styles.suggestionText}>
            💡 {qualityAnalysis.suggestions[0]}
          </Text>
        )}

        {/* Transition controls */}
        {(() => {
          const transitionResult =
            transitionHook.evaluateTransition(trainingData)

          return (
            <View style={styles.transitionContainer}>
              {/* Countdown display */}
              {countdownTimer && countdownTimer > 0 && (
                <Text style={styles.countdownText}>
                  Auto-starting test in{' '}
                  {transitionTiming.formatRemainingTime(countdownTimer)}
                </Text>
              )}

              {/* Manual transition button */}
              {transitionUI.shouldShowTransitionButton(transitionResult) && (
                <TouchableOpacity
                  style={[
                    styles.transitionButton,
                    !transitionResult.canTransition && styles.disabledButton,
                  ]}
                  onPress={() => {
                    if (transitionResult.canTransition) {
                      transitionHook.forceTransition(trainingData)
                    }
                  }}
                  disabled={!transitionResult.canTransition}
                >
                  <Text
                    style={[
                      styles.transitionButtonText,
                      !transitionResult.canTransition &&
                        styles.disabledButtonText,
                    ]}
                  >
                    {transitionUI.getTransitionButtonText(transitionResult)}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Cancel auto-transition button */}
              {countdownTimer && countdownTimer > 0 && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    transitionHook.cancelTransition()
                    setCountdownTimer(null)
                  }}
                >
                  <Text style={styles.cancelButtonText}>Keep Teaching</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        })()}
      </View>
    </View>
  )
}

const { width: _width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
  },
  header: {
    alignItems: 'center',
    paddingTop: UI_CONFIG.SPACING.LG,
    paddingBottom: UI_CONFIG.SPACING.MD,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.text,
    textAlign: 'center',
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    opacity: 0.8,
    marginBottom: UI_CONFIG.SPACING.MD,
  },

  critterContainer: {
    alignItems: 'center',
    paddingVertical: UI_CONFIG.SPACING.MD,
  },
  sortingContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  instructionsContainer: {
    paddingVertical: UI_CONFIG.SPACING.MD,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    opacity: 0.8,
  },
  readyText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.secondary,
    textAlign: 'center',
    marginTop: UI_CONFIG.SPACING.XS,
    fontWeight: '600',
  },
  completeText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.primary,
    textAlign: 'center',
    marginTop: UI_CONFIG.SPACING.XS,
    fontWeight: '600',
  },
  progressMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    marginTop: UI_CONFIG.SPACING.XS,
    opacity: 0.8,
  },
  suggestionText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    marginTop: UI_CONFIG.SPACING.XS,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  transitionContainer: {
    marginTop: UI_CONFIG.SPACING.MD,
    alignItems: 'center',
    width: '100%',
  },
  countdownText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.primary,
    textAlign: 'center',
    marginBottom: UI_CONFIG.SPACING.SM,
    fontWeight: '600',
  },
  transitionButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: UI_CONFIG.SPACING.LG,
    paddingVertical: UI_CONFIG.SPACING.SM,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MEDIUM,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  disabledButton: {
    backgroundColor: AppColors.surface,
    opacity: 0.5,
  },
  transitionButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-ExtraBold',
    color: AppColors.background,
    textAlign: 'center',
  },
  disabledButtonText: {
    color: AppColors.text,
    opacity: 0.7,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.XS,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SMALL,
    borderWidth: 1,
    borderColor: AppColors.text,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    opacity: 0.8,
  },
  qualityIndicator: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: AppColors.text,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
})
