/**
 * Training Integration Utilities
 * Handles the integration between game state and ML training
 */

import type { TrainingExample } from '@types/mlTypes'
import { mlService } from '../services/MLService'
import type { GameAction } from './gameStateManager'

/**
 * Handles the complete training workflow after teaching phase completion
 */
export async function handleTrainingTransition(
  trainingData: TrainingExample[],
  dispatch: React.Dispatch<GameAction>
): Promise<boolean> {
  try {
    console.log('Starting model training with user examples...')

    // Update critter state to show it's learning
    dispatch({ type: 'UPDATE_CRITTER_STATE', state: 'THINKING' })

    // Start the training process
    await mlService.trainModel(trainingData)

    console.log('Model training completed successfully')

    // Notify that training is complete
    dispatch({ type: 'TRAINING_COMPLETED' })

    return true
  } catch (error) {
    console.error('Training failed:', error)

    // Notify that training failed
    dispatch({
      type: 'TRAINING_FAILED',
      error: error instanceof Error ? error.message : 'Unknown training error',
    })

    return false
  }
}

/**
 * Checks if the ML service is ready for training
 */
export function isReadyForTraining(): boolean {
  return mlService.isReadyForTraining()
}

/**
 * Checks if the ML service is ready for classification
 */
export function isReadyForClassification(): boolean {
  return mlService.isReadyForClassification()
}

/**
 * Gets training status information
 */
export function getTrainingStatus(): {
  canTrain: boolean
  canClassify: boolean
  modelInfo: {
    version: string
    modelType: string
    lastTrained: Date | null
  }
} {
  return {
    canTrain: mlService.isReadyForTraining(),
    canClassify: mlService.isReadyForClassification(),
    modelInfo: mlService.getModelInfo(),
  }
}

/**
 * Validates training data before starting training
 */
export function validateTrainingDataForML(trainingData: TrainingExample[]): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Basic validation
  if (trainingData.length < 2) {
    errors.push('At least 2 training examples required')
  }

  // Check for class balance
  const appleCount = trainingData.filter(
    (ex) => ex.userLabel === 'apple'
  ).length
  const notAppleCount = trainingData.filter(
    (ex) => ex.userLabel === 'not_apple'
  ).length

  if (appleCount === 0) {
    errors.push('No apple examples provided')
  }

  if (notAppleCount === 0) {
    errors.push('No not-apple examples provided')
  }

  // Check for severe imbalance
  const total = trainingData.length
  if (total > 0) {
    const imbalanceRatio =
      Math.max(appleCount, notAppleCount) / Math.min(appleCount, notAppleCount)
    if (imbalanceRatio > 5) {
      warnings.push(
        `Severe class imbalance detected (${imbalanceRatio.toFixed(
          1
        )}:1). This may affect model performance.`
      )
    }
  }

  // Check for duplicate images
  const imageUris = trainingData.map((ex) => ex.imageUri)
  const uniqueUris = new Set(imageUris)
  if (imageUris.length !== uniqueUris.size) {
    warnings.push('Duplicate images detected in training data')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Creates a training progress callback for UI updates
 */
export function createTrainingProgressCallback(
  dispatch: React.Dispatch<GameAction>
): {
  onStart: () => void
  onProgress: (progress: number) => void
  onComplete: () => void
  onError: (error: string) => void
} {
  return {
    onStart: () => {
      console.log('Training started')
      dispatch({ type: 'UPDATE_CRITTER_STATE', state: 'THINKING' })
    },

    onProgress: (progress: number) => {
      console.log(`Training progress: ${(progress * 100).toFixed(1)}%`)
      // Keep critter in thinking state during training
    },

    onComplete: () => {
      console.log('Training completed')
      dispatch({ type: 'TRAINING_COMPLETED' })
    },

    onError: (error: string) => {
      console.error('Training error:', error)
      dispatch({ type: 'TRAINING_FAILED', error })
    },
  }
}

/**
 * Estimates training time based on dataset size
 */
export function estimateTrainingTime(trainingDataSize: number): number {
  // Rough estimation: ~500ms per example + base overhead
  const baseTime = 2000 // 2 seconds base time
  const perExampleTime = 500 // 500ms per example

  return baseTime + trainingDataSize * perExampleTime
}

/**
 * Formats training time for display
 */
export function formatTrainingTime(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000)

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}
