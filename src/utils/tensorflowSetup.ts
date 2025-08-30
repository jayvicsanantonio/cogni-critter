import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';

/**
 * Initialize TensorFlow.js for React Native
 * This must be called before using any TensorFlow.js functionality
 */
export const initializeTensorFlow = async (): Promise<void> => {
  // Wait for tf to be ready
  await tf.ready();

  console.log('TensorFlow.js initialized successfully');
  console.log('Backend:', tf.getBackend());
  console.log('TensorFlow.js version:', tf.version.tfjs);
};

/**
 * Check if TensorFlow.js is ready
 */
export const isTensorFlowReady = (): boolean => {
  return tf.getBackend() !== null;
};
