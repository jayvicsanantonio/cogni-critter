/**
 * Service Interface Definitions
 */

import * as tf from '@tensorflow/tfjs';
import { ClassificationResult, CritterState } from './coreTypes';
import { TrainingExample } from './mlTypes';

/**
 * Machine Learning Service Interface
 * Handles all ML operations including model loading, training, and prediction
 */
export interface MLService {
  /**
   * Load the pre-trained MobileNetV2 model
   * @returns Promise that resolves to the loaded model
   */
  loadModel(): Promise<tf.LayersModel>;

  /**
   * Train the model using user-provided labeled examples
   * @param trainingData Array of labeled training examples from teaching phase
   * @returns Promise that resolves when training is complete
   */
  trainModel(trainingData: TrainingExample[]): Promise<void>;

  /**
   * Classify an image using the trained model
   * @param imageUri URI of the image to classify
   * @returns Promise that resolves to classification confidence scores
   */
  classifyImage(imageUri: string): Promise<ClassificationResult>;

  /**
   * Convert image to tensor format required by the model
   * @param imageUri URI of the image to convert
   * @returns Promise that resolves to a tensor (224x224x3)
   */
  imageToTensor(imageUri: string): Promise<tf.Tensor>;

  /**
   * Dispose of tensors and clean up memory
   */
  cleanup(): void;

  /**
   * Get current model status and memory usage
   */
  getModelInfo(): {
    isLoaded: boolean;
    memoryUsage: tf.MemoryInfo;
    backend: string;
  };
}

/**
 * Animation Service Interface
 * Handles critter animations and state transitions
 */
export interface AnimationService {
  /**
   * Animate critter state transition
   * @param fromState Current critter state
   * @param toState Target critter state
   * @param duration Animation duration in milliseconds
   * @returns Promise that resolves when animation completes
   */
  animateStateTransition(
    fromState: CritterState,
    toState: CritterState,
    duration?: number
  ): Promise<void>;

  /**
   * Get the appropriate sprite for a given state
   * @param state Critter state
   * @returns Sprite asset path or require statement
   */
  getSpriteForState(state: CritterState): any;

  /**
   * Apply color tint to grayscale sprite
   * @param color Hex color code for tinting
   * @returns Style object with tintColor property
   */
  applyColorTint(color: string): { tintColor: string };

  /**
   * Check if animation is currently running
   */
  isAnimating(): boolean;

  /**
   * Stop current animation
   */
  stopAnimation(): void;
}
