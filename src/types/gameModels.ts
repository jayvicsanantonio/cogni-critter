import { CritterState, GamePhase, ImageLabel } from './coreTypes';

/**
 * Game State Interface
 * Represents the current state of the game including phase, progress, and results
 */
export interface GameState {
  phase: GamePhase;
  currentImageIndex: number;
  trainingData: TrainingExample[];
  testResults: TestResult[];
  score: number;
  critterState: CritterState;
}

/**
 * Training Example Interface
 * Represents a labeled example from the teaching phase
 */
export interface TrainingExample {
  id: string;
  imageUri: string;
  userLabel: ImageLabel;
  timestamp: number;
}

/**
 * Test Result Interface
 * Represents the result of a single classification during testing phase
 */
export interface TestResult {
  id: string;
  imageUri: string;
  trueLabel: ImageLabel;
  predictedLabel: ImageLabel;
  confidence: number;
  isCorrect: boolean;
  predictionTime: number;
}

/**
 * Image Item Interface
 * Represents an individual image in the dataset
 */
export interface ImageItem {
  id: string;
  uri: string;
  label: ImageLabel;
  metadata?: {
    variety?: string;
    color?: string;
    source?: string;
  };
}

/**
 * Game Configuration Interface
 * Contains all configurable parameters for the game
 */
export interface GameConfig {
  teachingPhase: {
    minImages: number; // 5 images minimum
    maxImages: number; // 10 images maximum
    currentCount: number; // Dynamically set based on user progress
  };
  testingPhaseImageCount: number; // 5 images (fixed)
  targetFrameRate: number; // 60 fps
  maxPredictionTime: number; // 1000ms
  animationDuration: number; // 250ms
}

/**
 * Image Dataset Interface
 * Contains organized collections of training and test images
 */
export interface ImageDataset {
  apples: ImageItem[];
  notApples: ImageItem[];
}

/**
 * Error Handler Interface
 * Defines methods for handling different types of errors
 */
export interface ErrorHandler {
  handleModelLoadError(error: Error): void;
  handlePredictionError(error: Error): void;
  handleAnimationError(error: Error): void;
  showUserFriendlyError(message: string): void;
}

/**
 * Performance Metrics Interface
 * Tracks performance metrics for optimization
 */
export interface PerformanceMetrics {
  frameRate: number; // Target: 60fps, Minimum: 45fps
  modelLoadTime: number; // Target: <5s, Maximum: 10s
  predictionTime: number; // Target: <500ms, Maximum: 1s
  memoryUsage: number; // Target: <100MB, Maximum: 150MB
}