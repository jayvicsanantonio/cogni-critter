/**
 * Game State and Flow Types
 */

import type { CritterState, GamePhase } from './coreTypes'
import type { TestResult, TrainingExample } from './mlTypes'

export interface GameState {
  phase: GamePhase
  currentImageIndex: number
  trainingData: TrainingExample[]
  testResults: TestResult[]
  score: number
  critterState: CritterState
}

export interface GameConfig {
  teachingPhase: {
    minImages: number // 5 images minimum
    maxImages: number // 10 images maximum
    currentCount: number // Dynamically set based on user progress
  }
  testingPhaseImageCount: number // 5 images (fixed)
  targetFrameRate: number // 60 fps
  maxPredictionTime: number // 1000ms
  animationDuration: number // 250ms
}
