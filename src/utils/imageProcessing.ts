/**
 * Image Processing Utilities for React Native + TensorFlow.js
 */

import * as tf from '@tensorflow/tfjs'
import { fetch as rnFetch, decodeJpeg } from '@tensorflow/tfjs-react-native'

/**
 * Convert a base64 string (no data URL prefix) to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = global.atob ? global.atob(base64) : Buffer.from(base64, 'base64').toString('binary')
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Convert image URI to tensor format required by ML models on React Native
 * Supports http(s) URLs and data URIs (base64-encoded JPEG/PNG)
 *
 * @param imageUri - Image URI (remote http/https or data:image/...)
 * @param targetSize - Target size for resizing [width, height] (default: [224, 224])
 * @returns Promise<tf.Tensor> - Normalized tensor with batch dimension [1, height, width, 3]
 */
export async function imageToTensor(
  imageUri: string,
  targetSize: [number, number] = [224, 224]
): Promise<tf.Tensor> {
  try {
    let rgbTensor: tf.Tensor3D

    if (imageUri.startsWith('http')) {
      // Use tfjs-react-native fetch polyfill to obtain ArrayBuffer
      const response = await rnFetch(imageUri)
      const arrayBuffer = await response.arrayBuffer()
      const imageData = new Uint8Array(arrayBuffer)
      // Decode JPEG/PNG bytes to a rank-3 tensor [h, w, 3]
      rgbTensor = decodeJpeg(imageData)
    } else if (imageUri.startsWith('data:image/')) {
      // Data URI: data:image/<type>;base64,XXXXX
      const base64 = imageUri.substring(imageUri.indexOf(',') + 1)
      const bytes = base64ToUint8Array(base64)
      rgbTensor = decodeJpeg(bytes)
    } else {
      throw new Error('Unsupported URI scheme. Use http(s) or data URI formats.')
    }

    // Resize to target size
    const resized = tf.image.resizeBilinear(rgbTensor, targetSize)
    // Normalize to [0,1]
    const normalized = resized.toFloat().div(tf.scalar(255))
    // Add batch dimension
    const batched = normalized.expandDims(0)

    // Cleanup intermediates
    rgbTensor.dispose()
    resized.dispose()

    return batched
  } catch (error) {
    throw new Error(`Image to tensor conversion failed: ${(error as Error).message}`)
  }
}

/**
 * Preprocess image tensor for MobileNetV2 model
 * Applies MobileNetV2-specific preprocessing (already normalized in imageToTensor)
 *
 * @param tensor - Input tensor from imageToTensor
 * @returns Preprocessed tensor ready for MobileNetV2
 */
export function preprocessForMobileNet(tensor: tf.Tensor): tf.Tensor {
  // MobileNetV2 expects values in [0, 1] range, which we already have
  // No additional preprocessing needed beyond normalization
  return tensor
}

/**
 * Batch process multiple images to tensors
 * Useful for processing training data efficiently
 *
 * @param imageUris - Array of image URIs
 * @param targetSize - Target size for resizing
 * @returns Promise<tf.Tensor[]> - Array of processed tensors
 */
export async function batchImageToTensor(
  imageUris: string[],
  targetSize: [number, number] = [224, 224]
): Promise<tf.Tensor[]> {
  const promises = imageUris.map((uri) => imageToTensor(uri, targetSize))
  return Promise.all(promises)
}

/**
 * Dispose of tensor array to free memory
 *
 * @param tensors - Array of tensors to dispose
 */
export function disposeTensorArray(tensors: tf.Tensor[]): void {
  tensors.forEach((tensor) => {
    if (tensor && !tensor.isDisposed) {
      tensor.dispose()
    }
  })
}

/**
 * Get image dimensions from URI
 * Useful for validation and debugging
 *
 * @param imageUri - Image URI
 * @returns Promise<{width: number, height: number}>
 */
export async function getImageDimensions(
  imageUri: string
): Promise<{ width: number; height: number }> {
  try {
    let bytes: Uint8Array
    if (imageUri.startsWith('http')) {
      const response = await rnFetch(imageUri)
      const arrayBuffer = await response.arrayBuffer()
      bytes = new Uint8Array(arrayBuffer)
    } else if (imageUri.startsWith('data:image/')) {
      const base64 = imageUri.substring(imageUri.indexOf(',') + 1)
      bytes = base64ToUint8Array(base64)
    } else {
      throw new Error('Unsupported URI scheme')
    }
    const tensor = decodeJpeg(bytes)
    const [height, width] = tensor.shape
    tensor.dispose()
    return { width, height }
  } catch (e) {
    throw new Error(`Failed to get image dimensions: ${(e as Error).message}`)
  }
}

/**
 * Memory Management Utilities for TensorFlow.js
 */

/**
 * Safely dispose of a single tensor
 * Checks if tensor exists and is not already disposed
 *
 * @param tensor - Tensor to dispose
 */
export function safeTensorDispose(tensor: tf.Tensor | null | undefined): void {
  if (tensor && !tensor.isDisposed) {
    try {
      tensor.dispose()
    } catch (error) {
      console.warn('Error disposing tensor:', error)
    }
  }
}

/**
 * Safely dispose of multiple tensors
 *
 * @param tensors - Array of tensors to dispose
 */
export function safeTensorArrayDispose(
  tensors: (tf.Tensor | null | undefined)[]
): void {
  tensors.forEach((tensor) => {
    safeTensorDispose(tensor)
  })
}

/**
 * Execute a function with automatic tensor cleanup
 * Tracks tensors created during execution and disposes them automatically
 *
 * @param fn - Function to execute
 * @returns Result of the function
 */
export async function withTensorCleanup<T>(
  fn: () => Promise<T> | T
): Promise<T> {
  const initialNumTensors = tf.memory().numTensors

  try {
    const result = await fn()
    return result
  } finally {
    // Force garbage collection to clean up any unreferenced tensors
    tf.disposeVariables()

    const finalNumTensors = tf.memory().numTensors
    const leakedTensors = finalNumTensors - initialNumTensors

    if (leakedTensors > 0) {
      console.warn(
        `Potential tensor memory leak detected: ${leakedTensors} tensors not disposed`
      )
    }
  }
}

/**
 * Get current memory usage information
 *
 * @returns TensorFlow.js memory info
 */
export function getMemoryInfo(): tf.MemoryInfo {
  return tf.memory()
}

/**
 * Log current memory usage for debugging
 *
 * @param context - Context string for the log
 */
export function logMemoryUsage(context: string = ''): void {
  const memory = tf.memory()
  console.log(`Memory Usage ${context}:`, {
    numTensors: memory.numTensors,
    numDataBuffers: memory.numDataBuffers,
    numBytes: memory.numBytes,
    unreliable: memory.unreliable,
  })
}

/**
 * Force cleanup of all unreferenced tensors
 * Use sparingly as it can be expensive
 */
export function forceGarbageCollection(): void {
  tf.disposeVariables()

  // Additional cleanup for WebGL backend
  if (tf.getBackend() === 'webgl') {
    const backendUnknown = tf.backend() as unknown
    const maybeBackend = backendUnknown as { checkCompileCompletion?: unknown }
    if (
      maybeBackend &&
      typeof maybeBackend.checkCompileCompletion === 'function'
    ) {
      ;(maybeBackend.checkCompileCompletion as () => void)()
    }
  }
}

/**
 * Monitor memory usage and warn if it exceeds threshold
 *
 * @param maxTensors - Maximum number of tensors before warning
 * @param maxBytes - Maximum bytes before warning
 */
export function monitorMemoryUsage(
  maxTensors: number = 100,
  maxBytes: number = 100 * 1024 * 1024
): void {
  const memory = tf.memory()

  if (memory.numTensors > maxTensors) {
    console.warn(
      `High tensor count detected: ${memory.numTensors} tensors (threshold: ${maxTensors})`
    )
  }

  if (memory.numBytes > maxBytes) {
    console.warn(
      `High memory usage detected: ${(memory.numBytes / 1024 / 1024).toFixed(
        2
      )}MB (threshold: ${(maxBytes / 1024 / 1024).toFixed(2)}MB)`
    )
  }
}
