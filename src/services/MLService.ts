/**
 * Machine Learning Service Implementation
 * Handles TensorFlow.js model operations for image classification
 */

import * as tf from '@tensorflow/tfjs';
import { MLService } from '../types/serviceTypes';
import { ClassificationResult } from '../types/coreTypes';
import { TrainingExample } from '../types/mlTypes';
import {
  imageToTensor as processImageToTensor,
  safeTensorDispose,
  safeTensorArrayDispose,
  withTensorCleanup,
  logMemoryUsage,
  monitorMemoryUsage,
} from '../utils/imageProcessing';
import {
  loadModelWithFallback,
  validateModelArchitecture,
  MODELS,
} from '../utils/modelLoader';

export class MLServiceImpl implements MLService {
  private model: tf.LayersModel | null = null;
  private customClassifier: tf.LayersModel | null = null;
  private isModelLoaded = false;
  private loadingPromise: Promise<tf.LayersModel> | null = null;

  // Configuration for timeout and retry mechanism
  private readonly MODEL_LOAD_TIMEOUT = 30000; // 30 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds between retries

  /**
   * Load the pre-trained MobileNetV2 model
   */
  async loadModel(): Promise<tf.LayersModel> {
    if (this.model && this.isModelLoaded) {
      return this.model;
    }

    // Return existing loading promise if already in progress
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    this.loadingPromise = this._loadModelInternal();
    return this.loadingPromise;
  }

  private async _loadModelInternal(): Promise<tf.LayersModel> {
    let lastError: Error | null = null;

    for (
      let attempt = 1;
      attempt <= this.MAX_RETRY_ATTEMPTS;
      attempt++
    ) {
      try {
        console.log(
          `Loading MobileNetV2 model... (Attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS})`
        );

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Model loading timeout after ${this.MODEL_LOAD_TIMEOUT}ms`
              )
            );
          }, this.MODEL_LOAD_TIMEOUT);
        });

        // Create model loading promise
        const loadPromise = this._loadModelWithUrl();

        // Race between loading and timeout
        this.model = await Promise.race([
          loadPromise,
          timeoutPromise,
        ]);
        this.isModelLoaded = true;

        console.log('MobileNetV2 model loaded successfully');
        console.log('Model input shape:', this.model.inputs[0].shape);
        console.log(`Model loaded on attempt ${attempt}`);

        return this.model;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `Model loading attempt ${attempt} failed:`,
          error
        );

        // If this isn't the last attempt, wait before retrying
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          console.log(`Retrying in ${this.RETRY_DELAY}ms...`);
          await this._delay(this.RETRY_DELAY);
        }
      }
    }

    // All attempts failed
    this.loadingPromise = null;
    const errorMessage = `Model loading failed after ${this.MAX_RETRY_ATTEMPTS} attempts. Last error: ${lastError?.message}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  private async _loadModelWithUrl(): Promise<tf.LayersModel> {
    // Use the model loader utility which handles both local and remote models
    const model = await loadModelWithFallback(
      'MOBILENET_V2',
      this.MODEL_LOAD_TIMEOUT
    );

    // Validate the model architecture
    const isValid = validateModelArchitecture(model, [224, 224, 3]);
    if (!isValid) {
      model.dispose();
      throw new Error(
        'Loaded model does not match expected architecture'
      );
    }

    return model;
  }

  private async _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Train a custom classifier using user-provided labeled examples
   */
  async trainModel(trainingData: TrainingExample[]): Promise<void> {
    if (!this.model || !this.isModelLoaded) {
      throw new Error('Base model must be loaded before training');
    }

    if (trainingData.length < 2) {
      throw new Error('At least 2 training examples required');
    }

    try {
      logMemoryUsage('Before training');
      console.log(
        `Training custom classifier with ${trainingData.length} examples`
      );

      // Extract features from base model for all training images
      const features: tf.Tensor[] = [];
      const labels: number[] = [];

      for (const example of trainingData) {
        const imageTensor = await this.imageToTensor(
          example.imageUri
        );

        // Get features from the base model (remove final classification layer)
        const featureExtractor = tf.model({
          inputs: this.model.inputs,
          outputs:
            this.model.layers[this.model.layers.length - 2].output,
        });

        const featureTensor = featureExtractor.predict(
          imageTensor
        ) as tf.Tensor;
        features.push(featureTensor);
        labels.push(example.userLabel === 'apple' ? 1 : 0);

        // Clean up intermediate tensors
        imageTensor.dispose();
      }

      // Stack features and create labels tensor
      const X = tf.stack(features);
      const y = tf.tensor1d(labels);

      // Create simple binary classifier
      this.customClassifier = tf.sequential({
        layers: [
          tf.layers.dense({
            inputShape: [features[0].shape[1]],
            units: 64,
            activation: 'relu',
          }),
          tf.layers.dropout({ rate: 0.2 }),
          tf.layers.dense({
            units: 1,
            activation: 'sigmoid',
          }),
        ],
      });

      // Compile the model
      this.customClassifier.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy'],
      });

      // Train the classifier
      await this.customClassifier.fit(X, y, {
        epochs: 10,
        batchSize: Math.min(4, trainingData.length),
        verbose: 0,
      });

      console.log('Custom classifier training completed');

      // Clean up training tensors using safe disposal
      safeTensorArrayDispose(features);
      safeTensorDispose(X);
      safeTensorDispose(y);

      logMemoryUsage('After training');
    } catch (error) {
      console.error('Training failed:', error);
      throw new Error(`Training failed: ${error.message}`);
    }
  }

  /**
   * Classify an image using the trained model
   */
  async classifyImage(
    imageUri: string
  ): Promise<ClassificationResult> {
    if (!this.model || !this.isModelLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      const imageTensor = await this.imageToTensor(imageUri);

      let prediction: tf.Tensor;

      if (this.customClassifier) {
        // Use custom trained classifier
        const featureExtractor = tf.model({
          inputs: this.model.inputs,
          outputs:
            this.model.layers[this.model.layers.length - 2].output,
        });

        const features = featureExtractor.predict(
          imageTensor
        ) as tf.Tensor;
        prediction = this.customClassifier.predict(
          features
        ) as tf.Tensor;
        safeTensorDispose(features);
        featureExtractor.dispose();
      } else {
        // Fallback to base model (this would need adaptation for apple/not-apple)
        prediction = this.model.predict(imageTensor) as tf.Tensor;
      }

      // Convert prediction to classification result
      const predictionData = await prediction.data();
      const appleConfidence = this.customClassifier
        ? predictionData[0]
        : 0.5; // Fallback
      const notAppleConfidence = 1 - appleConfidence;

      // Clean up tensors safely
      safeTensorDispose(imageTensor);
      safeTensorDispose(prediction);

      return [appleConfidence, notAppleConfidence];
    } catch (error) {
      console.error('Classification failed:', error);
      throw new Error(`Classification failed: ${error.message}`);
    }
  }

  /**
   * Convert image to tensor format required by the model (224x224x3)
   */
  async imageToTensor(imageUri: string): Promise<tf.Tensor> {
    try {
      // Use the dedicated image processing utility
      // This handles both local and remote images with proper resizing and normalization
      return await processImageToTensor(imageUri, [224, 224]);
    } catch (error) {
      console.error('Failed to convert image to tensor:', error);
      throw new Error(
        `Image to tensor conversion failed: ${error.message}`
      );
    }
  }

  /**
   * Dispose of tensors and clean up memory
   */
  cleanup(): void {
    logMemoryUsage('Before MLService cleanup');

    // Safely dispose of models
    if (this.model) {
      try {
        this.model.dispose();
      } catch (error) {
        console.warn('Error disposing main model:', error);
      }
      this.model = null;
    }

    if (this.customClassifier) {
      try {
        this.customClassifier.dispose();
      } catch (error) {
        console.warn('Error disposing custom classifier:', error);
      }
      this.customClassifier = null;
    }

    this.isModelLoaded = false;
    this.loadingPromise = null;

    // Force garbage collection
    tf.disposeVariables();

    logMemoryUsage('After MLService cleanup');
    console.log('MLService cleanup completed');
  }

  /**
   * Get current model status and memory usage
   */
  getModelInfo() {
    return {
      isLoaded: this.isModelLoaded,
      memoryUsage: tf.memory(),
      backend: tf.getBackend(),
    };
  }
}

// Export singleton instance
export const mlService = new MLServiceImpl();
