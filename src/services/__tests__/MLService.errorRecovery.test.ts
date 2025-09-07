/**
 * MLService Error Recovery Integration Tests
 * Tests complete error handling and recovery flows
 * Requirements: 1.8, 3.3, 8.6
 */

import * as tf from '@tensorflow/tfjs';
import { MLServiceImpl } from '../MLService';
import { errorHandler } from '../../utils/errorHandler';
import { memoryManager } from '../../utils/memoryManager';

// Mock TensorFlow.js
jest.mock('@tensorflow/tfjs', () => ({
  loadLayersModel: jest.fn(),
  memory: jest.fn(),
  disposeVariables: jest.fn(),
  getBackend: jest.fn(),
  backend: jest.fn(),
  model: jest.fn(),
  sequential: jest.fn(),
  layers: {
    dense: jest.fn(),
    dropout: jest.fn(),
  },
  train: {
    adam: jest.fn(),
  },
  stack: jest.fn(),
  tensor1d: jest.fn(),
}));

// Mock model loader
jest.mock('../../utils/modelLoader', () => ({
  loadModelWithFallback: jest.fn(),
  validateModelArchitecture: jest.fn(),
  MODELS: {},
}));

// Mock image processing
jest.mock('../../utils/imageProcessing', () => ({
  imageToTensor: jest.fn(),
  safeTensorDispose: jest.fn(),
  safeTensorArrayDispose: jest.fn(),
  withTensorCleanup: jest.fn(),
  logMemoryUsage: jest.fn(),
  monitorMemoryUsage: jest.fn(),
}));

describe('MLService Error Recovery', () => {
  let mlService: MLServiceImpl;
  const mockLoadModel =
    require('../../utils/modelLoader').loadModelWithFallback;
  const mockValidateModel =
    require('../../utils/modelLoader').validateModelArchitecture;
  const mockImageToTensor =
    require('../../utils/imageProcessing').imageToTensor;

  beforeEach(() => {
    jest.clearAllMocks();
    mlService = new MLServiceImpl();

    // Default successful mocks
    mockValidateModel.mockReturnValue(true);
    (
      tf.memory as jest.MockedFunction<typeof tf.memory>
    ).mockReturnValue({
      numTensors: 10,
      numDataBuffers: 5,
      numBytes: 1024 * 1024,
      unreliable: false,
    });
  });

  describe('Model Loading Error Recovery', () => {
    it('should retry model loading on failure', async () => {
      // Mock first two attempts to fail, third to succeed
      const mockModel = {
        inputs: [{ shape: [null, 224, 224, 3] }],
        dispose: jest.fn(),
      };

      mockLoadModel
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Connection failed'))
        .mockResolvedValueOnce(mockModel);

      const result = await mlService.loadModel();

      expect(result).toBe(mockModel);
      expect(mockLoadModel).toHaveBeenCalledTimes(3);
    });

    it('should handle model loading timeout', async () => {
      // Mock all attempts to timeout
      mockLoadModel.mockImplementation(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 100)
          )
      );

      await expect(mlService.loadModel()).rejects.toThrow();
      expect(mockLoadModel).toHaveBeenCalledTimes(3); // MAX_RETRY_ATTEMPTS
    });

    it('should handle model validation failure', async () => {
      const mockModel = {
        inputs: [{ shape: [null, 128, 128, 3] }], // Wrong shape
        dispose: jest.fn(),
      };

      mockLoadModel.mockResolvedValue(mockModel);
      mockValidateModel.mockReturnValue(false);

      await expect(mlService.loadModel()).rejects.toThrow();
      expect(mockModel.dispose).toHaveBeenCalled();
    });
  });

  describe('Prediction Timeout Recovery', () => {
    beforeEach(async () => {
      // Setup successful model loading
      const mockModel = {
        inputs: [{ shape: [null, 224, 224, 3] }],
        layers: [
          { name: 'global_average_pooling2d', output: {} },
          { name: 'predictions' },
        ],
        dispose: jest.fn(),
      };

      mockLoadModel.mockResolvedValue(mockModel);
      await mlService.loadModel();

      // Setup custom classifier
      const mockClassifier = {
        compile: jest.fn(),
        fit: jest
          .fn()
          .mockResolvedValue({
            history: { loss: [0.1], acc: [0.9] },
          }),
        predict: jest.fn(),
        dispose: jest.fn(),
      };

      (
        tf.sequential as jest.MockedFunction<typeof tf.sequential>
      ).mockReturnValue(mockClassifier as any);
      (
        tf.model as jest.MockedFunction<typeof tf.model>
      ).mockReturnValue({
        predict: jest.fn().mockReturnValue({ shape: [1, 1280] }),
        dispose: jest.fn(),
      } as any);

      // Train model with minimal data
      await mlService.trainModel([
        {
          id: '1',
          imageUri: 'test1.jpg',
          userLabel: 'apple',
          timestamp: Date.now(),
        },
        {
          id: '2',
          imageUri: 'test2.jpg',
          userLabel: 'not_apple',
          timestamp: Date.now(),
        },
      ]);
    });

    it('should use fallback prediction on timeout', async () => {
      // Mock image processing to take too long
      mockImageToTensor.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({}), 2000)
          )
      );

      const result = await mlService.classifyImage('test.jpg', 500); // 500ms timeout

      expect(result).toHaveLength(2);
      expect(result[0]).toBeGreaterThanOrEqual(0);
      expect(result[0]).toBeLessThanOrEqual(1);
      expect(result[1]).toBeGreaterThanOrEqual(0);
      expect(result[1]).toBeLessThanOrEqual(1);
      expect(result[0] + result[1]).toBeCloseTo(1, 5);
    });

    it('should complete prediction within timeout', async () => {
      // Mock successful prediction
      const mockTensor = {
        data: jest.fn().mockResolvedValue(new Float32Array([0.8])),
        dispose: jest.fn(),
        shape: [1, 224, 224, 3],
      };

      mockImageToTensor.mockResolvedValue(mockTensor);

      const mockFeatureExtractor = {
        predict: jest.fn().mockReturnValue({ shape: [1, 1280] }),
        dispose: jest.fn(),
      };

      const mockClassifier = {
        predict: jest.fn().mockReturnValue({
          data: jest.fn().mockResolvedValue(new Float32Array([0.8])),
          dispose: jest.fn(),
        }),
      };

      // Mock the service's internal methods
      (mlService as any).customClassifier = mockClassifier;
      (mlService as any)._createFeatureExtractor = jest
        .fn()
        .mockReturnValue(mockFeatureExtractor);

      const result = await mlService.classifyImage('test.jpg', 1000);

      expect(result).toEqual([0.8, 0.2]);
    });
  });

  describe('Memory Management Error Recovery', () => {
    it('should handle tensor disposal errors gracefully', async () => {
      const mockModel = {
        inputs: [{ shape: [null, 224, 224, 3] }],
        layers: [{ name: 'global_average_pooling2d', output: {} }],
        dispose: jest.fn().mockImplementation(() => {
          throw new Error('Disposal failed');
        }),
      };

      mockLoadModel.mockResolvedValue(mockModel);
      await mlService.loadModel();

      // Should not throw when cleanup fails
      expect(() => {
        mlService.cleanup();
      }).not.toThrow();
    });

    it('should track memory usage during operations', async () => {
      const mockModel = {
        inputs: [{ shape: [null, 224, 224, 3] }],
        layers: [{ name: 'global_average_pooling2d', output: {} }],
        dispose: jest.fn(),
      };

      mockLoadModel.mockResolvedValue(mockModel);

      // Initialize memory manager
      memoryManager.initialize();

      await mlService.loadModel();

      // Memory manager should have tracked the operation
      const history = memoryManager.getMemoryHistory();
      expect(history.length).toBeGreaterThan(0);

      memoryManager.cleanup();
    });
  });

  describe('Training Error Recovery', () => {
    beforeEach(async () => {
      // Setup successful model loading
      const mockModel = {
        inputs: [{ shape: [null, 224, 224, 3] }],
        layers: [
          { name: 'global_average_pooling2d', output: {} },
          { name: 'predictions' },
        ],
        dispose: jest.fn(),
      };

      mockLoadModel.mockResolvedValue(mockModel);
      await mlService.loadModel();
    });

    it('should handle training data validation errors', async () => {
      const invalidTrainingData = [
        {
          id: '1',
          imageUri: 'test1.jpg',
          userLabel: 'apple',
          timestamp: Date.now(),
        },
        // Missing not_apple examples
      ];

      await expect(
        mlService.trainModel(invalidTrainingData)
      ).rejects.toThrow(
        'Training data must contain examples of both apple and not-apple classes'
      );
    });

    it('should handle feature extraction errors', async () => {
      const trainingData = [
        {
          id: '1',
          imageUri: 'test1.jpg',
          userLabel: 'apple',
          timestamp: Date.now(),
        },
        {
          id: '2',
          imageUri: 'test2.jpg',
          userLabel: 'not_apple',
          timestamp: Date.now(),
        },
      ];

      // Mock image processing to fail
      mockImageToTensor.mockRejectedValue(
        new Error('Image processing failed')
      );

      await expect(
        mlService.trainModel(trainingData)
      ).rejects.toThrow();
    });

    it('should clean up on training failure', async () => {
      const trainingData = [
        {
          id: '1',
          imageUri: 'test1.jpg',
          userLabel: 'apple',
          timestamp: Date.now(),
        },
        {
          id: '2',
          imageUri: 'test2.jpg',
          userLabel: 'not_apple',
          timestamp: Date.now(),
        },
      ];

      // Mock successful preprocessing but failed training
      const mockTensor = {
        data: jest
          .fn()
          .mockResolvedValue(new Float32Array([0.5, 0.3, 0.8])),
        dispose: jest.fn(),
        shape: [1, 224, 224, 3],
      };

      mockImageToTensor.mockResolvedValue(mockTensor);

      const mockFeatureExtractor = {
        predict: jest.fn().mockReturnValue({ shape: [1, 1280] }),
        dispose: jest.fn(),
      };

      const mockClassifier = {
        compile: jest.fn(),
        fit: jest
          .fn()
          .mockRejectedValue(new Error('Training failed')),
        dispose: jest.fn(),
      };

      (
        tf.sequential as jest.MockedFunction<typeof tf.sequential>
      ).mockReturnValue(mockClassifier as any);
      (
        tf.model as jest.MockedFunction<typeof tf.model>
      ).mockReturnValue(mockFeatureExtractor as any);

      await expect(
        mlService.trainModel(trainingData)
      ).rejects.toThrow();

      // Should have cleaned up the classifier
      expect(mockClassifier.dispose).toHaveBeenCalled();
    });
  });

  describe('Complete Error Recovery Flow', () => {
    it('should recover from multiple consecutive errors', async () => {
      // Test complete recovery scenario:
      // 1. Model loading fails initially but succeeds on retry
      // 2. Training succeeds
      // 3. Prediction times out but uses fallback

      const mockModel = {
        inputs: [{ shape: [null, 224, 224, 3] }],
        layers: [
          { name: 'global_average_pooling2d', output: {} },
          { name: 'predictions' },
        ],
        dispose: jest.fn(),
      };

      // Model loading fails first, then succeeds
      mockLoadModel
        .mockRejectedValueOnce(new Error('Initial failure'))
        .mockResolvedValueOnce(mockModel);

      // Load model with retry
      await mlService.loadModel();
      expect(mockLoadModel).toHaveBeenCalledTimes(2);

      // Setup successful training
      const mockClassifier = {
        compile: jest.fn(),
        fit: jest
          .fn()
          .mockResolvedValue({
            history: { loss: [0.1], acc: [0.9] },
          }),
        predict: jest.fn(),
        dispose: jest.fn(),
      };

      (
        tf.sequential as jest.MockedFunction<typeof tf.sequential>
      ).mockReturnValue(mockClassifier as any);
      (
        tf.model as jest.MockedFunction<typeof tf.model>
      ).mockReturnValue({
        predict: jest.fn().mockReturnValue({ shape: [1, 1280] }),
        dispose: jest.fn(),
      } as any);

      const trainingData = [
        {
          id: '1',
          imageUri: 'test1.jpg',
          userLabel: 'apple',
          timestamp: Date.now(),
        },
        {
          id: '2',
          imageUri: 'test2.jpg',
          userLabel: 'not_apple',
          timestamp: Date.now(),
        },
      ];

      const mockTensor = {
        data: jest
          .fn()
          .mockResolvedValue(new Float32Array([0.5, 0.3, 0.8])),
        dispose: jest.fn(),
        shape: [1, 224, 224, 3],
      };

      mockImageToTensor.mockResolvedValue(mockTensor);

      // Train model successfully
      await mlService.trainModel(trainingData);

      // Prediction times out, should use fallback
      mockImageToTensor.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockTensor), 2000)
          )
      );

      const result = await mlService.classifyImage('test.jpg', 500);

      // Should get fallback prediction
      expect(result).toHaveLength(2);
      expect(result[0] + result[1]).toBeCloseTo(1, 5);
    });
  });
});
