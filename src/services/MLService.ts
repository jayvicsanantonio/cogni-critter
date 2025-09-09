/**
 * Machine Learning Service Implementation
 * Handles TensorFlow.js model operations for image classification
 */

import * as tf from '@tensorflow/tfjs'
import * as mobilenet from '@tensorflow-models/mobilenet'
import type { ClassificationResult } from '../types/coreTypes'
import type { TrainingExample } from '../types/mlTypes'
import type { MLService } from '../types/serviceTypes'
import { errorHandler, GameError } from '../utils/errorHandler'
import { imageToTensor as processImageToTensor } from '../utils/imageProcessing'
import { memoryManager } from '../utils/memoryManager'
import { loadLocalMobileNetV2 } from '../utils/localMobileNet'
import { performanceMetrics } from '../utils/performanceMetrics'

export class MLServiceImpl implements MLService {
  private net: mobilenet.MobileNet | null = null
  private featureExtractor: tf.LayersModel | null = null
  private customClassifier: tf.LayersModel | null = null
  private modelSource: 'local' | 'mobilenet' | null = null
  private isModelLoaded = false
  private loadingPromise: Promise<void> | null = null

  // Configuration for timeout and retry mechanism
  private readonly MODEL_LOAD_TIMEOUT = 30000 // 30 seconds
  private readonly MAX_RETRY_ATTEMPTS = 3
  private readonly RETRY_DELAY = 2000 // 2 seconds between retries

  /**
   * Load the pre-trained MobileNetV2 model
   */
  async loadModel(): Promise<void> {
    if (this.net && this.isModelLoaded) {
      return
    }

    // Return existing loading promise if already in progress
    if (this.loadingPromise) {
      return this.loadingPromise
    }

    // Initialize memory manager if not already done
    if (!memoryManager) {
      console.warn('Memory manager not initialized, initializing with defaults')
    }

    this.loadingPromise = memoryManager.withMemoryTracking(
      () => this._loadModelInternal(),
      'model_loading'
    )
    return this.loadingPromise
  }

  private async _loadModelInternal(): Promise<void> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        console.log(
          `Loading MobileNetV2 model... (Attempt ${attempt}/${this.MAX_RETRY_ATTEMPTS})`
        )

        // Create timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Model loading timeout after ${this.MODEL_LOAD_TIMEOUT}ms`
              )
            )
          }, this.MODEL_LOAD_TIMEOUT)
        })

        // Create model loading promise
        const loadPromise = this._loadMobileNet()

        // Race between loading and timeout
        await Promise.race([loadPromise, timeoutPromise])
        this.isModelLoaded = true

        console.log('MobileNetV2 model loaded successfully (mobilenet library)')
        console.log(`Model loaded on attempt ${attempt}`)

        return
      } catch (error) {
        lastError = error as Error

        // Use error handler for consistent error handling
        const gameError = errorHandler.handleModelLoadError(lastError, {
          attempt,
          maxAttempts: this.MAX_RETRY_ATTEMPTS,
          timeout: this.MODEL_LOAD_TIMEOUT,
        })

        console.error(
          `Model loading attempt ${attempt} failed:`,
          gameError.errorInfo.message
        )

        // If this isn't the last attempt, wait before retrying
        if (attempt < this.MAX_RETRY_ATTEMPTS) {
          console.log(`Retrying in ${this.RETRY_DELAY}ms...`)
          await this._delay(this.RETRY_DELAY)
        }
      }
    }

    // All attempts failed
    this.loadingPromise = null
    const finalError = errorHandler.handleModelLoadError(
      lastError || new Error('Unknown model loading error'),
      {
        totalAttempts: this.MAX_RETRY_ATTEMPTS,
        finalFailure: true,
      }
    )

    throw finalError
  }

  private async _loadMobileNet(): Promise<void> {
    const stopTiming = performanceMetrics.startTiming('modelLoad')
    try {
      // Prefer local (bundled) MobileNetV2 feature extractor for offline support
      try {
        const local = await loadLocalMobileNetV2()
        this.featureExtractor = local.featureExtractor
        this.net = null
        this.modelSource = 'local'
        console.log('Loaded MobileNetV2 feature extractor from local bundle')
        return
      } catch (e) {
        console.warn('Local MobileNetV2 not available, falling back to @tensorflow-models/mobilenet:', e)
      }

      // Fallback: use the high-level mobilenet package (network fetch)
      this.net = await mobilenet.load({ version: 2, alpha: 1.0 })
      this.featureExtractor = null
      this.modelSource = 'mobilenet'
      console.log('Loaded MobileNetV2 via @tensorflow-models/mobilenet')
    } finally {
      stopTiming()
    }
  }

  private async _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Validate training data for quality and completeness
   */
  private _validateTrainingData(trainingData: TrainingExample[]): void {
    // Basic count validation
    if (trainingData.length < 2) {
      throw new Error(
        'At least 2 training examples required for binary classification'
      )
    }

    if (trainingData.length > 50) {
      console.warn(
        `Large training dataset (${trainingData.length} examples). Consider reducing for better performance.`
      )
    }

    // Check for balanced data (at least one example of each class)
    const appleCount = trainingData.filter(
      (ex) => ex.userLabel === 'apple'
    ).length
    const notAppleCount = trainingData.filter(
      (ex) => ex.userLabel === 'not_apple'
    ).length

    if (appleCount === 0 || notAppleCount === 0) {
      throw new Error(
        'Training data must contain examples of both apple and not-apple classes'
      )
    }

    // Check for severe class imbalance
    const imbalanceRatio =
      Math.max(appleCount, notAppleCount) / Math.min(appleCount, notAppleCount)
    if (imbalanceRatio > 5) {
      console.warn(
        `Class imbalance detected: ${appleCount} apple vs ${notAppleCount} not-apple examples. This may affect model performance.`
      )
    }

    // Validate data structure and detect duplicates
    const seenImageUris = new Set<string>()
    const seenIds = new Set<string>()

    for (let i = 0; i < trainingData.length; i++) {
      const example = trainingData[i]

      // Validate required fields
      if (!example.id || !example.imageUri || !example.userLabel) {
        throw new Error(
          `Invalid training example at index ${i}: missing required fields`
        )
      }

      // Validate label values
      if (!['apple', 'not_apple'].includes(example.userLabel)) {
        throw new Error(
          `Invalid label at index ${i}: ${example.userLabel}. Must be 'apple' or 'not_apple'`
        )
      }

      // Check for duplicate IDs
      if (seenIds.has(example.id)) {
        throw new Error(`Duplicate training example ID found: ${example.id}`)
      }
      seenIds.add(example.id)

      // Check for duplicate image URIs (warn only)
      if (seenImageUris.has(example.imageUri)) {
        console.warn(
          `Duplicate image URI found: ${example.imageUri}. This may reduce training effectiveness.`
        )
      }
      seenImageUris.add(example.imageUri)

      // Validate timestamp
      if (
        example.timestamp &&
        (typeof example.timestamp !== 'number' || example.timestamp <= 0)
      ) {
        console.warn(`Invalid timestamp at index ${i}: ${example.timestamp}`)
      }
    }

    console.log(`Training data validated successfully:`)
    console.log(`  - Total examples: ${trainingData.length}`)
    console.log(`  - Apple examples: ${appleCount}`)
    console.log(`  - Not-apple examples: ${notAppleCount}`)
    console.log(`  - Class balance ratio: ${imbalanceRatio.toFixed(2)}:1`)
  }

  /**
   * Preprocess training data by extracting features from the base model
   */
  private async _preprocessTrainingData(
    trainingData: TrainingExample[]
  ): Promise<{
    features: tf.Tensor[]
    labels: tf.Tensor
  }> {
    const features: tf.Tensor[] = []
    const labelArray: number[] = []

    if (!this.net && !this.featureExtractor) {
      throw new Error('Base feature extractor not loaded')
    }

    try {
      for (let i = 0; i < trainingData.length; i++) {
        const example = trainingData[i]
        console.log(
          `Processing training example ${i + 1}/${trainingData.length}: ${
            example.userLabel
          }`
        )

        try {
          // Convert image to tensor with error handling
          const imageTensor = await this.imageToTensor(example.imageUri)

          // Validate image tensor shape
          const expectedShape = [1, 224, 224, 3]
          if (!this._validateTensorShape(imageTensor, expectedShape)) {
            throw new Error(
              `Invalid image tensor shape: expected ${expectedShape}, got ${imageTensor.shape}`
            )
          }

          // Extract embeddings using MobileNet (local feature extractor preferred)
          let featureTensor: tf.Tensor
          if (this.featureExtractor) {
            const embedding = this.featureExtractor.predict(imageTensor) as tf.Tensor
            // Ensure shape [batch, N]
            featureTensor =
              embedding.shape.length === 2
                ? embedding
                : (embedding.reshape([
                    embedding.shape[0] || 1,
                    (embedding.shape[embedding.shape.length - 1] as number) || (embedding.size as number),
                  ]) as tf.Tensor)
          } else {
            const embedding = this.net!.infer(imageTensor, true) as tf.Tensor
            featureTensor = embedding.shape.length === 2 ? embedding : embedding.expandDims(0)
          }

          // Validate feature tensor
          if (!featureTensor || featureTensor.shape.length === 0) {
            throw new Error('Feature extraction failed: empty tensor')
          }

          // Check for NaN or infinite values in features
          const featureData = await featureTensor.data()
          if (this._hasInvalidValues(featureData)) {
            console.warn(
              `Invalid values detected in features for example ${i + 1}`
            )
          }

          features.push(featureTensor as tf.Tensor)

          // Convert label to binary (1 for apple, 0 for not_apple)
          labelArray.push(example.userLabel === 'apple' ? 1 : 0)

          // Clean up intermediate tensor
          memoryManager.safeTensorDispose(imageTensor as unknown as tf.Tensor)
        } catch (error) {
          console.error(
            `Failed to process training example ${i + 1} (${example.id}):`,
            error
          )
          throw new Error(
            `Preprocessing failed for example ${i + 1}: ${(error as Error).message}`
          )
        }
      }

      // Create labels tensor
      const labels = tf.tensor1d(labelArray)

      console.log(
        `Feature extraction completed: ${features.length} feature vectors extracted`
      )
      return { features, labels }
    } finally {
      // Nothing to dispose here (net is kept as class member)
    }
  }

  /**
   * Create feature extractor from the base MobileNetV2 model
   */
  // Feature extractor no longer needed; using MobileNet.infer

  /**
   * Create the custom binary classifier for apple/not-apple classification
   */
  private _createCustomClassifier(inputFeatureSize: number): void {
    console.log(
      `Creating custom classifier with input size: ${inputFeatureSize}`
    )

    // Dispose of any existing classifier
    if (this.customClassifier) {
      this.customClassifier.dispose()
    }

    // Create a simple but effective binary classifier
    this.customClassifier = tf.sequential({
      layers: [
        // Dense layer with ReLU activation
        tf.layers.dense({
          inputShape: [inputFeatureSize],
          units: 128,
          activation: 'relu',
          kernelInitializer: 'glorotUniform',
          name: 'dense_1',
        }),
        // Dropout for regularization
        tf.layers.dropout({
          rate: 0.3,
          name: 'dropout_1',
        }),
        // Second dense layer
        tf.layers.dense({
          units: 64,
          activation: 'relu',
          kernelInitializer: 'glorotUniform',
          name: 'dense_2',
        }),
        // Final classification layer with sigmoid for binary classification
        tf.layers.dense({
          units: 1,
          activation: 'sigmoid',
          kernelInitializer: 'glorotUniform',
          name: 'classification_output',
        }),
      ],
    })

    console.log('Custom classifier architecture created')
  }

  /**
   * Train the custom classifier with the extracted features
   */
  private async _trainClassifier(
    features: tf.Tensor[],
    labels: tf.Tensor,
    datasetSize: number
  ): Promise<void> {
    if (!this.customClassifier) {
      throw new Error('Custom classifier not created')
    }

    // Stack features into a single tensor
    const X = tf.stack(features as tf.Tensor[]) // shape: [numExamples, 1, N] or [numExamples, N]

    // If X is rank 3 [num, 1, N], reshape to [num, N]
    const inputShape = X.shape
    const X2 = inputShape.length === 3 && inputShape[1] === 1 ? X.reshape([inputShape[0], inputShape[2]]) : X

    try {
      // Compile the model with optimized settings for binary classification
      this._compileCustomClassifier(datasetSize)

      console.log('Starting classifier training...')

      // Configure training parameters based on dataset size
      const epochs = Math.min(20, Math.max(10, datasetSize * 2)) // Adaptive epochs
      const batchSize = Math.min(8, Math.max(2, Math.floor(datasetSize / 2))) // Adaptive batch size

      console.log(
        `Training configuration: ${epochs} epochs, batch size ${batchSize}`
      )

      // Train the classifier
      const history = await this.customClassifier.fit(X2, labels, {
        epochs: epochs,
        batchSize: batchSize,
        validationSplit: datasetSize > 4 ? 0.2 : 0, // Use validation split if enough data
        shuffle: true,
        verbose: 0, // Silent training for better UX
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (logs && epoch % 5 === 0) {
              console.log(
                `Epoch ${epoch + 1}: loss=${logs.loss?.toFixed(
                  4
                )}, accuracy=${logs.acc?.toFixed(4)}`
              )
            }
          },
        },
      })

      // Log final training results
      const finalLossRaw = (history.history.loss as unknown[])[(history.history.loss as unknown[]).length - 1]
      const finalAccRaw = ((history.history as any).acc || (history.history as any).accuracy || [0])[(history.history as any).acc ? ((history.history as any).acc.length - 1) : (((history.history as any).accuracy || [0]).length - 1)]
      const finalLoss = typeof finalLossRaw === 'number' ? finalLossRaw : Number(finalLossRaw)
      const finalAccuracy = typeof finalAccRaw === 'number' ? finalAccRaw : Number(finalAccRaw)
      console.log(
        `Training completed - Final loss: ${finalLoss.toFixed(4)}, Final accuracy: ${finalAccuracy.toFixed(4)}`
      )
    } finally {
      // Clean up training tensors
      memoryManager.safeTensorArrayDispose?.(features as tf.Tensor[])
      memoryManager.safeTensorDispose(X2 as tf.Tensor)
      memoryManager.safeTensorDispose(labels as tf.Tensor)
    }
  }

  /**
   * Validate tensor shape matches expected dimensions
   */
  private _validateTensorShape(
    tensor: tf.Tensor,
    expectedShape: number[]
  ): boolean {
    if (tensor.shape.length !== expectedShape.length) {
      return false
    }

    for (let i = 0; i < expectedShape.length; i++) {
      // Allow flexible batch size (first dimension)
      if (i === 0 && expectedShape[i] === 1) {
        continue
      }
      if (tensor.shape[i] !== expectedShape[i]) {
        return false
      }
    }

    return true
  }

  /**
   * Check for NaN or infinite values in tensor data
   */
  private _hasInvalidValues(
    data: Float32Array | Int32Array | Uint8Array
  ): boolean {
    for (let i = 0; i < data.length; i++) {
      const value = data[i]
      if (Number.isNaN(value) || !Number.isFinite(value)) {
        return true
      }
    }
    return false
  }

  /**
   * Compile the custom classifier with appropriate optimizer and loss function for binary classification
   */
  private _compileCustomClassifier(datasetSize: number): void {
    if (!this.customClassifier) {
      throw new Error('Custom classifier not created')
    }

    // Adaptive learning rate based on dataset size
    // Smaller datasets need lower learning rates to prevent overfitting
    let learningRate: number
    if (datasetSize <= 5) {
      learningRate = 0.0005 // Very conservative for small datasets
    } else if (datasetSize <= 10) {
      learningRate = 0.001 // Standard rate for typical teaching phase
    } else {
      learningRate = 0.002 // Slightly higher for larger datasets
    }

    console.log(`Compiling classifier with learning rate: ${learningRate}`)

    // Use Adam optimizer with adaptive learning rate and appropriate decay
    const optimizer = tf.train.adam(learningRate)

    // Compile with binary crossentropy loss and supported metrics
    this.customClassifier.compile({
      optimizer: optimizer,
      loss: 'binaryCrossentropy', // Standard loss for binary classification
      metrics: [
        'accuracy', // Classification accuracy
      ],
    })

    console.log('Custom classifier compiled successfully')
    console.log('  - Optimizer: Adam')
    console.log(`  - Learning rate: ${learningRate}`)
    console.log('  - Loss function: Binary Crossentropy')
    console.log('  - Metrics: Accuracy')
  }

  /**
   * Train a custom classifier using user-provided labeled examples
   * Implements transfer learning by fine-tuning MobileNetV2's final classification layer
   */
  async trainModel(trainingData: TrainingExample[]): Promise<void> {
    if ((!this.net && !this.featureExtractor) || !this.isModelLoaded) {
      throw new Error('Base model must be loaded before training')
    }

    // Validate training data
    this._validateTrainingData(trainingData)

    return memoryManager.withMemoryTracking(async () => {
      try {
        console.log(
          `Training custom classifier with ${trainingData.length} examples using transfer learning`
        )

        // Preprocess training data
        const { features, labels } =
          await this._preprocessTrainingData(trainingData)

        // Create and compile the custom classifier
        this._createCustomClassifier(features[0].shape[1] as number)

        // Train the classifier using the preprocessed data
        await this._trainClassifier(features, labels, trainingData.length)

        console.log('Transfer learning training completed successfully')
      } catch (error) {
        console.error('Training failed:', error)
        // Clean up any partially created classifier
        if (this.customClassifier) {
          try {
            this.customClassifier.dispose()
          } catch {}
          this.customClassifier = null
        }
        throw new Error(`Training failed: ${(error as Error).message}`)
      }
    }, 'model_training')
  }

  /**
   * Classify an image using the trained model with transfer learning approach
   */
  async classifyImage(
    imageUri: string,
    timeoutMs: number = 1000
  ): Promise<ClassificationResult> {
    if ((!this.net && !this.featureExtractor) || !this.isModelLoaded) {
      throw new Error('Base model not loaded')
    }

    if (!this.customClassifier) {
      throw new Error(
        'Custom classifier not trained. Please complete the teaching phase first.'
      )
    }

    try {
      console.log('Classifying image using transfer learning approach...')

      // Create timeout promise for prediction
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          const timeoutError = errorHandler.handlePredictionTimeout({
            imageUri,
            timeoutMs,
            timestamp: Date.now(),
          })
          reject(timeoutError)
        }, timeoutMs)
      })

      // Create prediction promise
      const predictionPromise = this._performPrediction(imageUri)

      // Race between prediction and timeout
      const result = await Promise.race([predictionPromise, timeoutPromise])

      return result
    } catch (error) {
      if (
        error instanceof GameError &&
        error.errorInfo.code === 'PREDICTION_TIMEOUT'
      ) {
        console.warn('Prediction timeout, using fallback mechanism')
        return this._getFallbackPrediction()
      }

      console.error('Classification failed:', error)
      throw errorHandler.handleUnknownError(error as Error, {
        imageUri,
        timeoutMs,
      })
    }
  }

  /**
   * Perform the actual prediction logic
   */
  private async _performPrediction(
    imageUri: string
  ): Promise<ClassificationResult> {
    return memoryManager.withMemoryTracking(async () => {
      // Convert image to tensor
      const imageTensor = await this.imageToTensor(imageUri)

      const stopTiming = performanceMetrics.startTiming('prediction')

      let prediction: tf.Tensor | null = null
      let features: tf.Tensor | null = null

      try {
        // Extract embeddings using MobileNet (local feature extractor preferred)
        if (this.featureExtractor) {
          const embedding = this.featureExtractor.predict(imageTensor) as tf.Tensor
          features =
            embedding.shape.length === 2
              ? embedding
              : (embedding.reshape([
                  embedding.shape[0] || 1,
                  (embedding.shape[embedding.shape.length - 1] as number) || (embedding.size as number),
                ]) as tf.Tensor)
        } else {
          const embedding = this.net!.infer(imageTensor, true) as tf.Tensor
          features = embedding.shape.length === 2 ? embedding : embedding.expandDims(0)
        }

        // Use custom trained classifier for final prediction
        prediction = this.customClassifier!.predict(features) as tf.Tensor

        // Convert prediction to classification result
        const predictionData = await prediction.data()
        const appleConfidence = predictionData[0]
        const notAppleConfidence = 1 - appleConfidence

        console.log(
          `Classification result: apple=${appleConfidence.toFixed(
            3
          )}, not_apple=${notAppleConfidence.toFixed(3)}`
        )

        return [appleConfidence, notAppleConfidence]
      } finally {
        // Clean up tensors safely using memory manager
        memoryManager.safeTensorDispose(imageTensor)
        if (features) memoryManager.safeTensorDispose(features as tf.Tensor)
        if (prediction) memoryManager.safeTensorDispose(prediction as tf.Tensor)
        try {
          stopTiming()
        } catch {}
      }
    }, 'image_prediction')
  }

  /**
   * Provide fallback prediction when timeout occurs
   */
  private _getFallbackPrediction(): ClassificationResult {
    // Generate a reasonable fallback prediction
    // This could be based on training data statistics or a neutral prediction
    const randomConfidence = 0.4 + Math.random() * 0.2 // Between 0.4 and 0.6
    const appleConfidence =
      Math.random() > 0.5 ? randomConfidence : 1 - randomConfidence
    const notAppleConfidence = 1 - appleConfidence

    console.log(
      `Fallback prediction: apple=${appleConfidence.toFixed(
        3
      )}, not_apple=${notAppleConfidence.toFixed(3)}`
    )

    return [appleConfidence, notAppleConfidence]
  }

  /**
   * Convert image to tensor format required by the model (224x224x3)
   */
  async imageToTensor(imageUri: string): Promise<tf.Tensor> {
    try {
      // Use the dedicated image processing utility
      // This handles both local and remote images with proper resizing and normalization
      return await processImageToTensor(imageUri, [224, 224])
    } catch (error) {
      console.error('Failed to convert image to tensor:', error)
      throw new Error(`Image to tensor conversion failed: ${(error as Error).message}`)
    }
  }

  /**
   * Dispose of tensors and clean up memory
   */
  cleanup(): void {
    memoryManager.takeSnapshot('MLService_cleanup_before')

    // Safely dispose of models using memory manager
    this.net = null

    if (this.featureExtractor) {
      try {
        this.featureExtractor.dispose()
      } catch (error) {
        errorHandler.handleTensorError(error as Error, { action: 'dispose_feature_extractor' })
      }
      this.featureExtractor = null
    }

    if (this.customClassifier) {
      try {
        this.customClassifier.dispose()
      } catch (error) {
        errorHandler.handleTensorError(error as Error, {
          action: 'dispose_custom_classifier',
        })
      }
      this.customClassifier = null
    }

    this.isModelLoaded = false
    this.loadingPromise = null

    // Force garbage collection using memory manager
    memoryManager.forceGarbageCollection()

    memoryManager.takeSnapshot('MLService_cleanup_after')
    console.log('MLService cleanup completed')
  }

  /**
   * Check if the model is ready for classification (both base model and custom classifier loaded)
   */
  isReadyForClassification(): boolean {
    return (
      this.isModelLoaded &&
      (this.net !== null || this.featureExtractor !== null) &&
      this.customClassifier !== null
    )
  }

  /**
   * Check if the base model is loaded and ready for training
   */
  isReadyForTraining(): boolean {
    return this.isModelLoaded && (this.net !== null || this.featureExtractor !== null)
  }

  /**
   * Get current model status and memory usage
   */
  getModelInfo() {
    return {
      isLoaded: this.isModelLoaded,
      hasCustomClassifier: this.customClassifier !== null,
      isReadyForTraining: this.isReadyForTraining(),
      isReadyForClassification: this.isReadyForClassification(),
      modelSource: this.modelSource,
      memoryUsage: tf.memory(),
      backend: tf.getBackend(),
    }
  }
}

// Export singleton instance
export const mlService = new MLServiceImpl()
