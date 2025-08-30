import * as tf from '@tensorflow/tfjs';
import { ClassificationResult, CritterState } from './coreTypes';
import { TrainingExample } from './gameModels';

/**
 * ML Service Interface
 * Defines the contract for machine learning operations
 */
export interface MLService {
  /**
   * Load the pre-trained MobileNetV2 model
   * @returns Promise that resolves to the loaded TensorFlow model
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
   * Convert image to tensor format for ML processing
   * @param imageUri URI of the image to convert
   * @returns Promise that resolves to a normalized 224x224 tensor
   */
  imageToTensor(imageUri: string): Promise<tf.Tensor>;

  /**
   * Clean up tensors and free memory
   */
  dispose(): void;

  /**
   * Check if the model is loaded and ready for predictions
   * @returns Boolean indicating model readiness
   */
  isModelReady(): boolean;
}

/**
 * Animation Service Interface
 * Defines the contract for managing critter animations and transitions
 */
export interface AnimationService {
  /**
   * Animate transition between critter states
   * @param fromState Current critter state
   * @param toState Target critter state
   * @param duration Animation duration in milliseconds (default: 250ms)
   * @returns Promise that resolves when animation completes
   */
  transitionCritterState(
    fromState: CritterState,
    toState: CritterState,
    duration?: number
  ): Promise<void>;

  /**
   * Start a looping animation for the current state
   * @param state Critter state to animate
   */
  startLoopingAnimation(state: CritterState): void;

  /**
   * Stop any currently running animations
   */
  stopAllAnimations(): void;

  /**
   * Get the current animation state
   * @returns Current critter state being animated
   */
  getCurrentState(): CritterState;

  /**
   * Check if an animation is currently playing
   * @returns Boolean indicating if animation is active
   */
  isAnimating(): boolean;

  /**
   * Set the color tint for all critter sprites
   * @param color Hex color code for tinting grayscale sprites
   */
  setCritterColor(color: string): void;
}