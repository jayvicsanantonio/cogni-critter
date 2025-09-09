/**
 * Model Loading Utilities
 * Handles both local bundled models and remote model loading
 */

import * as tf from '@tensorflow/tfjs'

/**
 * Model configuration for different model types
 */
interface ModelConfig {
  name: string
  localPath?: string
  remoteUrl: string
  version: string
}

/**
 * Available models configuration
 */
export const MODELS: Record<string, ModelConfig> = {
  MOBILENET_V2: {
    name: 'MobileNetV2',
    localPath: 'src/assets/models/mobilenet_v2/model.json',
    // Use a tfjs-layers compatible MobileNetV2 URL
    remoteUrl:
      'https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v2_1.0_224/model.json',
    version: '1.0.0',
  },
}

/**
 * Check if a local model exists
 * @param modelConfig - Model configuration
 * @returns Promise<boolean> - True if local model exists
 */
async function checkLocalModelExists(
  modelConfig: ModelConfig
): Promise<boolean> {
  if (!modelConfig.localPath) {
    return false
  }

  try {
    // In React Native, we need to check if the bundled asset exists
    // This is a simplified check - in production, you might use react-native-fs
    // or check the bundle contents

    // For now, we'll assume local models don't exist and always use remote
    // This can be updated when actual model files are bundled
    return false
  } catch (error) {
    console.log('Local model check failed:', error)
    return false
  }
}

/**
 * Load a model with fallback from local to remote
 * @param modelKey - Key from MODELS configuration
 * @param timeout - Timeout in milliseconds
 * @returns Promise<tf.LayersModel> - Loaded model
 */
export async function loadModelWithFallback(
  modelKey: keyof typeof MODELS,
  timeout: number = 30000
): Promise<tf.LayersModel> {
  const modelConfig = MODELS[modelKey]

  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelKey}`)
  }

  console.log(`Loading ${modelConfig.name} model...`)

  // First, try to load from local bundle
  const hasLocalModel = await checkLocalModelExists(modelConfig)

  if (hasLocalModel && modelConfig.localPath) {
    try {
      console.log(`Loading ${modelConfig.name} from local bundle...`)
      const model = await tf.loadLayersModel(modelConfig.localPath)
      console.log(`${modelConfig.name} loaded successfully from local bundle`)
      return model
    } catch (error) {
      console.warn(`Failed to load local model, falling back to remote:`, error)
    }
  }

  // Fallback to remote loading
  console.log(`Loading ${modelConfig.name} from remote URL...`)

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Model loading timeout after ${timeout}ms`))
    }, timeout)
  })

  const loadPromise = tf.loadLayersModel(modelConfig.remoteUrl)

  const model = await Promise.race([loadPromise, timeoutPromise])
  console.log(`${modelConfig.name} loaded successfully from remote`)

  return model
}

/**
 * Get model information
 * @param modelKey - Key from MODELS configuration
 * @returns Model configuration
 */
export function getModelInfo(modelKey: keyof typeof MODELS): ModelConfig {
  const modelConfig = MODELS[modelKey]

  if (!modelConfig) {
    throw new Error(`Unknown model: ${modelKey}`)
  }

  return modelConfig
}

/**
 * Preload models for better performance
 * @param modelKeys - Array of model keys to preload
 * @returns Promise<Map<string, tf.LayersModel>> - Map of loaded models
 */
export async function preloadModels(
  modelKeys: (keyof typeof MODELS)[]
): Promise<Map<string, tf.LayersModel>> {
  const loadedModels = new Map<string, tf.LayersModel>()

  const loadPromises = modelKeys.map(async (key) => {
    try {
      const model = await loadModelWithFallback(key)
      loadedModels.set(key, model)
      return { key, model, success: true }
    } catch (error) {
      console.error(`Failed to preload model ${key}:`, error)
      return { key, model: null, success: false, error }
    }
  })

  const results = await Promise.allSettled(loadPromises)

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.success) {
      console.log(`Successfully preloaded model: ${modelKeys[index]}`)
    } else {
      console.error(`Failed to preload model: ${modelKeys[index]}`)
    }
  })

  return loadedModels
}

/**
 * Validate model architecture
 * @param model - TensorFlow.js model
 * @param expectedInputShape - Expected input shape [height, width, channels]
 * @returns boolean - True if model is valid
 */
export function validateModelArchitecture(
  model: tf.LayersModel,
  expectedInputShape: number[]
): boolean {
  try {
    const inputShape = model.inputs[0].shape

    if (!inputShape) {
      console.error('Model has no input shape defined')
      return false
    }

    // Check if input shape matches expected (ignoring batch dimension)
    const modelInputShape = inputShape.slice(1) // Remove batch dimension

    if (modelInputShape.length !== expectedInputShape.length) {
      console.error(
        `Input shape dimension mismatch. Expected: ${expectedInputShape}, Got: ${modelInputShape}`
      )
      return false
    }

    for (let i = 0; i < expectedInputShape.length; i++) {
      if (
        expectedInputShape[i] !== -1 &&
        modelInputShape[i] !== expectedInputShape[i]
      ) {
        console.error(
          `Input shape mismatch at dimension ${i}. Expected: ${expectedInputShape[i]}, Got: ${modelInputShape[i]}`
        )
        return false
      }
    }

    console.log('Model architecture validation passed')
    return true
  } catch (error) {
    console.error('Model validation failed:', error)
    return false
  }
}
