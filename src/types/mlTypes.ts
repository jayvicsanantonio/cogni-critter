/**
 * Machine Learning and Training Types
 */

import type { ImageLabel } from './coreTypes'

export interface TrainingExample {
  id: string
  imageUri: string
  userLabel: ImageLabel
  timestamp: number
}

export interface TestResult {
  id: string
  imageUri: string
  trueLabel: ImageLabel
  predictedLabel: ImageLabel
  confidence: number
  isCorrect: boolean
  predictionTime: number
}

export interface ImageItem {
  id: string
  uri: string
  label: ImageLabel
  metadata?: {
    variety?: string
    color?: string
    source?: string
  }
}

export interface ImageDataset {
  apples: ImageItem[]
  notApples: ImageItem[]
}
