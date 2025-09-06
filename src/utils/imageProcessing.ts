/**
 * Image Processing Utilities for React Native + TensorFlow.js
 */

import * as tf from '@tensorflow/tfjs';

/**
 * Convert image URI to tensor format required by ML models
 * Handles both local bundled images and remote URLs
 *
 * @param imageUri - Image URI (local or remote)
 * @param targetSize - Target size for resizing [width, height] (default: [224, 224])
 * @returns Promise<tf.Tensor> - Normalized tensor with batch dimension [1, height, width, 3]
 */
export async function imageToTensor(
  imageUri: string,
  targetSize: [number, number] = [224, 224]
): Promise<tf.Tensor> {
  return new Promise((resolve, reject) => {
    try {
      // Create HTML Image element for cross-platform compatibility
      const image = new Image();

      image.onload = () => {
        try {
          // Create tensor from image pixels
          const imageTensor = tf.browser.fromPixels(image);

          // Resize to target size (default: 224x224 for MobileNetV2)
          const resized = tf.image.resizeBilinear(
            imageTensor,
            targetSize
          );

          // Normalize pixel values from [0, 255] to [0, 1] range
          const normalized = resized.div(255.0);

          // Add batch dimension [1, height, width, 3]
          const batched = normalized.expandDims(0);

          // Clean up intermediate tensors to prevent memory leaks
          imageTensor.dispose();
          resized.dispose();
          normalized.dispose();

          resolve(batched);
        } catch (error) {
          reject(
            new Error(`Tensor conversion failed: ${error.message}`)
          );
        }
      };

      image.onerror = (error) => {
        reject(
          new Error(`Failed to load image from ${imageUri}: ${error}`)
        );
      };

      // Handle CORS for remote images
      if (imageUri.startsWith('http')) {
        image.crossOrigin = 'anonymous';
      }

      // Set image source (works for both local and remote)
      image.src = imageUri;
    } catch (error) {
      reject(
        new Error(`Image processing setup failed: ${error.message}`)
      );
    }
  });
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
  return tensor;
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
  const promises = imageUris.map((uri) =>
    imageToTensor(uri, targetSize)
  );
  return Promise.all(promises);
}

/**
 * Dispose of tensor array to free memory
 *
 * @param tensors - Array of tensors to dispose
 */
export function disposeTensorArray(tensors: tf.Tensor[]): void {
  tensors.forEach((tensor) => {
    if (tensor && !tensor.isDisposed) {
      tensor.dispose();
    }
  });
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
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height,
      });
    };

    image.onerror = (error) => {
      reject(
        new Error(
          `Failed to load image for dimension check: ${error}`
        )
      );
    };

    if (imageUri.startsWith('http')) {
      image.crossOrigin = 'anonymous';
    }

    image.src = imageUri;
  });
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
export function safeTensorDispose(
  tensor: tf.Tensor | null | undefined
): void {
  if (tensor && !tensor.isDisposed) {
    try {
      tensor.dispose();
    } catch (error) {
      console.warn('Error disposing tensor:', error);
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
  tensors.forEach((tensor) => safeTensorDispose(tensor));
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
  const initialNumTensors = tf.memory().numTensors;

  try {
    const result = await fn();
    return result;
  } finally {
    // Force garbage collection to clean up any unreferenced tensors
    tf.disposeVariables();

    const finalNumTensors = tf.memory().numTensors;
    const leakedTensors = finalNumTensors - initialNumTensors;

    if (leakedTensors > 0) {
      console.warn(
        `Potential tensor memory leak detected: ${leakedTensors} tensors not disposed`
      );
    }
  }
}

/**
 * Get current memory usage information
 *
 * @returns TensorFlow.js memory info
 */
export function getMemoryInfo(): tf.MemoryInfo {
  return tf.memory();
}

/**
 * Log current memory usage for debugging
 *
 * @param context - Context string for the log
 */
export function logMemoryUsage(context: string = ''): void {
  const memory = tf.memory();
  console.log(`Memory Usage ${context}:`, {
    numTensors: memory.numTensors,
    numDataBuffers: memory.numDataBuffers,
    numBytes: memory.numBytes,
    unreliable: memory.unreliable,
  });
}

/**
 * Force cleanup of all unreferenced tensors
 * Use sparingly as it can be expensive
 */
export function forceGarbageCollection(): void {
  tf.disposeVariables();

  // Additional cleanup for WebGL backend
  if (tf.getBackend() === 'webgl') {
    const backend = tf.backend() as any;
    if (
      backend &&
      typeof backend.checkCompileCompletion === 'function'
    ) {
      backend.checkCompileCompletion();
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
  const memory = tf.memory();

  if (memory.numTensors > maxTensors) {
    console.warn(
      `High tensor count detected: ${memory.numTensors} tensors (threshold: ${maxTensors})`
    );
  }

  if (memory.numBytes > maxBytes) {
    console.warn(
      `High memory usage detected: ${(
        memory.numBytes /
        1024 /
        1024
      ).toFixed(2)}MB (threshold: ${(maxBytes / 1024 / 1024).toFixed(
        2
      )}MB)`
    );
  }
}
